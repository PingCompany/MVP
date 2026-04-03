import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser, requireConversationMember } from "./auth";

function generateRoomName(workspaceSlug: string, contextName: string): string {
  const suffix = Math.random().toString(36).substring(2, 10);
  const sanitized = contextName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 30);
  return `ping-${workspaceSlug}-${sanitized}-${suffix}`;
}

export const startInConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
    threadMessageId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireConversationMember(ctx, args.conversationId, user._id);

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    const workspace = await ctx.db.get(conversation.workspaceId);
    if (!workspace) throw new Error("Workspace not found");

    // Check for existing active meeting in this context
    const existing = await ctx.db
      .query("meetings")
      .withIndex("by_conversation_and_status", (q) =>
        q.eq("conversationId", args.conversationId).eq("status", "active"),
      )
      .first();

    if (existing) {
      return { meetingId: existing._id, meetingUrl: existing.meetingUrl, alreadyActive: true };
    }

    // Build a title from conversation name or member names
    let title = "Meeting";
    if (conversation.name) {
      title = `Meeting in ${conversation.name}`;
    } else {
      const members = await ctx.db
        .query("conversationMembers")
        .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
        .collect();
      const memberNames = await Promise.all(
        members.map(async (m) => {
          const u = await ctx.db.get(m.userId);
          return u?.name ?? "Unknown";
        }),
      );
      title = `Meeting with ${memberNames.join(", ")}`;
    }

    const roomName = generateRoomName(workspace.slug, title);
    const meetingUrl = `https://meet.jit.si/${roomName}`;
    const now = Date.now();

    const meetingId = await ctx.db.insert("meetings", {
      workspaceId: workspace._id,
      conversationId: args.conversationId,
      threadMessageId: args.threadMessageId,
      title,
      provider: "jitsi",
      meetingUrl,
      status: "active",
      startedBy: user._id,
      startedAt: now,
      participants: [{ userId: user._id, joinedAt: now }],
    });

    // Insert system message with meetingId
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      authorId: user._id,
      body: `**started a meeting** — [Join meeting](${meetingUrl})`,
      type: "system",
      isEdited: false,
      meetingId,
      ...(args.threadMessageId ? { threadId: args.threadMessageId, alsoSentToConversation: false } : {}),
    });

    // If posted in a thread, update parent's thread denormalized fields
    if (args.threadMessageId) {
      const parent = await ctx.db.get(args.threadMessageId);
      if (parent) {
        const existingParticipants = parent.threadParticipantIds ?? [];
        const newParticipants = existingParticipants.includes(user._id)
          ? existingParticipants
          : [...existingParticipants, user._id];
        await ctx.db.patch(args.threadMessageId, {
          threadReplyCount: (parent.threadReplyCount ?? 0) + 1,
          threadLastReplyAt: now,
          threadLastReplyAuthorId: user._id,
          threadParticipantIds: newParticipants,
        });
      }
    }

    await ctx.db.patch(meetingId, { messageId });

    return { meetingId, meetingUrl, alreadyActive: false };
  },
});

export const joinMeeting = mutation({
  args: {
    meetingId: v.id("meetings"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) throw new Error("Meeting not found");
    if (meeting.status !== "active") throw new Error("Meeting has ended");

    const participants = meeting.participants ?? [];
    const alreadyJoined = participants.some((p) => p.userId === user._id);
    if (!alreadyJoined) {
      await ctx.db.patch(args.meetingId, {
        participants: [...participants, { userId: user._id, joinedAt: Date.now() }],
      });
    }

    return { meetingUrl: meeting.meetingUrl };
  },
});

export const endMeeting = mutation({
  args: {
    meetingId: v.id("meetings"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) throw new Error("Meeting not found");
    if (meeting.status !== "active") throw new Error("Meeting already ended");

    // Only the starter can end the meeting (or workspace admin)
    if (meeting.startedBy !== user._id) {
      // Check if workspace admin
      const membership = await ctx.db
        .query("workspaceMembers")
        .withIndex("by_user_workspace", (q) =>
          q.eq("userId", user._id).eq("workspaceId", meeting.workspaceId),
        )
        .unique();
      if (!membership || membership.role !== "admin") {
        throw new Error("Only the meeting starter or a workspace admin can end the meeting");
      }
    }

    await ctx.db.patch(args.meetingId, {
      status: "ended",
      endedAt: Date.now(),
    });
  },
});

export const getActiveMeeting = query({
  args: {
    conversationId: v.optional(v.id("conversations")),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);

    let meeting = null;

    if (args.conversationId) {
      meeting = await ctx.db
        .query("meetings")
        .withIndex("by_conversation_and_status", (q) =>
          q.eq("conversationId", args.conversationId!).eq("status", "active"),
        )
        .first();
    }

    if (!meeting) return null;

    const starter = await ctx.db.get(meeting.startedBy);
    const participants = await Promise.all(
      (meeting.participants ?? []).map(async (p) => {
        const u = await ctx.db.get(p.userId);
        return {
          userId: p.userId,
          name: u?.name ?? "Unknown",
          avatarUrl: u?.avatarUrl,
          joinedAt: p.joinedAt,
        };
      }),
    );

    return {
      _id: meeting._id,
      title: meeting.title,
      provider: meeting.provider,
      meetingUrl: meeting.meetingUrl,
      status: meeting.status,
      startedBy: {
        _id: meeting.startedBy,
        name: starter?.name ?? "Unknown",
        avatarUrl: starter?.avatarUrl,
      },
      startedAt: meeting.startedAt,
      endedAt: meeting.endedAt,
      participants,
    };
  },
});
