import { v } from "convex/values";
import { internalQuery, internalMutation } from "./_generated/server";

// ── Channel Message Operations ──────────────────────────────────────

export const readChannelMessages = internalQuery({
  args: {
    channelId: v.id("channels"),
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    limit: v.number(),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
  },
  handler: async (
    ctx,
    { channelId, workspaceId, userId, limit, startTime, endTime },
  ) => {
    const channel = await ctx.db.get(channelId);
    if (!channel || channel.workspaceId !== workspaceId) {
      throw new Error("Channel not found or access denied");
    }

    // For private channels, verify membership
    if (channel.isPrivate) {
      const membership = await ctx.db
        .query("channelMembers")
        .withIndex("by_channel_user", (q) =>
          q.eq("channelId", channelId).eq("userId", userId),
        )
        .first();
      if (!membership) throw new Error("Not a member of this private channel");
    }

    // Fetch more than needed to account for thread-only replies being filtered
    const fetchLimit = Math.min(limit * 2, 200);
    let messages = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", channelId))
      .order("desc")
      .take(fetchLimit);

    // Apply date filtering
    if (startTime) {
      messages = messages.filter((m) => m._creationTime >= startTime);
    }
    if (endTime) {
      messages = messages.filter((m) => m._creationTime <= endTime);
    }

    // Filter out thread-only replies (same as existing listByChannel behavior)
    messages = messages.filter((m) => !m.threadId || m.alsoSentToChannel);

    // Trim to requested limit
    messages = messages.slice(0, limit);

    // Enrich with author info
    const enriched = await Promise.all(
      messages.map(async (msg) => {
        const author = await ctx.db.get(msg.authorId);
        return {
          _id: msg._id,
          body: msg.body,
          type: msg.type,
          authorId: msg.authorId,
          authorName: author?.name ?? "Unknown",
          authorEmail: author?.email,
          _creationTime: msg._creationTime,
          isEdited: msg.isEdited,
          threadId: msg.threadId,
          threadReplyCount: msg.threadReplyCount,
          threadLastReplyAt: msg.threadLastReplyAt,
          mentions: msg.mentions,
        };
      }),
    );

    return enriched.reverse(); // Return in chronological order
  },
});

export const sendChannelMessageApi = internalMutation({
  args: {
    channelId: v.id("channels"),
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    body: v.string(),
    messageType: v.union(v.literal("user"), v.literal("bot")),
    threadId: v.optional(v.id("messages")),
  },
  handler: async (
    ctx,
    { channelId, workspaceId, userId, body, messageType, threadId },
  ) => {
    const channel = await ctx.db.get(channelId);
    if (!channel || channel.workspaceId !== workspaceId) {
      throw new Error("Channel not found or access denied");
    }

    // Verify channel membership
    const membership = await ctx.db
      .query("channelMembers")
      .withIndex("by_channel_user", (q) =>
        q.eq("channelId", channelId).eq("userId", userId),
      )
      .first();
    if (!membership) throw new Error("Not a member of this channel");

    // If threadId provided, validate parent message and keep reference for later update
    let parentMessage: Awaited<ReturnType<typeof ctx.db.get>> | null = null;
    if (threadId) {
      parentMessage = await ctx.db.get(threadId);
      if (!parentMessage) throw new Error("Parent message not found");
      if (parentMessage.channelId !== channelId)
        throw new Error("Parent message is not in this channel");
      if (parentMessage.threadId)
        throw new Error("Cannot create nested threads");
    }

    const messageId = await ctx.db.insert("messages", {
      channelId,
      authorId: userId,
      body,
      type: messageType,
      isEdited: false,
      ...(threadId ? { threadId, alsoSentToChannel: false } : {}),
    });

    // If thread reply, update parent denormalized fields
    if (threadId && parentMessage) {
      const currentParticipants = parentMessage.threadParticipantIds ?? [];
      const newParticipants = currentParticipants.includes(userId)
        ? currentParticipants
        : [...currentParticipants, userId].slice(0, 20);

      await ctx.db.patch(threadId, {
        threadReplyCount: (parentMessage.threadReplyCount ?? 0) + 1,
        threadLastReplyAt: Date.now(),
        threadLastReplyAuthorId: userId,
        threadParticipantIds: newParticipants,
      });
    }

    // Update unread counts for other members
    const allMembers = await ctx.db
      .query("channelMembers")
      .withIndex("by_channel", (q) => q.eq("channelId", channelId))
      .collect();

    for (const member of allMembers) {
      if (member.userId === userId) {
        // Sender: reset unread
        await ctx.db.patch(member._id, {
          lastReadAt: Date.now(),
          unreadCount: 0,
        });
      } else if (!threadId) {
        // Only increment for top-level messages
        await ctx.db.patch(member._id, {
          unreadCount: (member.unreadCount ?? 0) + 1,
        });
      }
    }

    return { messageId };
  },
});

export const listChannelThreadReplies = internalQuery({
  args: {
    threadId: v.id("messages"),
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
  },
  handler: async (ctx, { threadId, workspaceId }) => {
    const parent = await ctx.db.get(threadId);
    if (!parent) throw new Error("Parent message not found");

    const channel = await ctx.db.get(parent.channelId);
    if (!channel || channel.workspaceId !== workspaceId) {
      throw new Error("Channel not found or access denied");
    }

    if (parent.threadId)
      throw new Error("Message is a reply, not a thread parent");

    const replies = await ctx.db
      .query("messages")
      .withIndex("by_thread", (q) => q.eq("threadId", threadId))
      .order("asc")
      .take(200);

    const parentAuthor = await ctx.db.get(parent.authorId);
    const enrichedParent = {
      _id: parent._id,
      body: parent.body,
      type: parent.type,
      authorId: parent.authorId,
      authorName: parentAuthor?.name ?? "Unknown",
      _creationTime: parent._creationTime,
      threadReplyCount: parent.threadReplyCount,
    };

    const enrichedReplies = await Promise.all(
      replies.map(async (reply) => {
        const author = await ctx.db.get(reply.authorId);
        return {
          _id: reply._id,
          body: reply.body,
          type: reply.type,
          authorId: reply.authorId,
          authorName: author?.name ?? "Unknown",
          _creationTime: reply._creationTime,
        };
      }),
    );

    return { parent: enrichedParent, replies: enrichedReplies };
  },
});
