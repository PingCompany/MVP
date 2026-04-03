import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { requireUser, requireConversationMember } from "./auth";

export const toggle = mutation({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    await requireConversationMember(ctx, message.conversationId!, user._id);

    const existingReactions = await ctx.db
      .query("reactions")
      .withIndex("by_message_user", (q) =>
        q.eq("messageId", args.messageId).eq("userId", user._id),
      )
      .take(100);

    const existing = existingReactions.find((r) => r.emoji === args.emoji);

    if (existing) {
      await ctx.db.delete(existing._id);
      return null;
    }

    return await ctx.db.insert("reactions", {
      messageId: args.messageId,
      userId: user._id,
      emoji: args.emoji,
    });
  },
});

export const getByMessages = query({
  args: {
    messageIds: v.array(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // Verify membership for all unique conversations referenced by these messages
    const messages = await Promise.all(
      args.messageIds.map((id) => ctx.db.get(id)),
    );
    const conversationIds = new Set<Id<"conversations">>();
    for (const msg of messages) {
      if (msg) conversationIds.add(msg.conversationId!);
    }
    for (const conversationId of conversationIds) {
      await requireConversationMember(ctx, conversationId, user._id);
    }

    const result: Record<
      string,
      Array<{
        emoji: string;
        count: number;
        userIds: string[];
        userNames: string[];
      }>
    > = {};

    await Promise.all(
      args.messageIds.map(async (messageId) => {
        const reactions = await ctx.db
          .query("reactions")
          .withIndex("by_message", (q) => q.eq("messageId", messageId))
          .take(500);

        const grouped = new Map<string, (typeof reactions)[number][]>();
        for (const reaction of reactions) {
          const entry = grouped.get(reaction.emoji);
          if (entry) {
            entry.push(reaction);
          } else {
            grouped.set(reaction.emoji, [reaction]);
          }
        }

        result[messageId] = await Promise.all(
          Array.from(grouped.entries()).map(async ([emoji, emojiReactions]) => {
            const users = await Promise.all(
              emojiReactions.map((r) => ctx.db.get(r.userId)),
            );
            return {
              emoji,
              count: emojiReactions.length,
              userIds: emojiReactions.map((r) => r.userId as string),
              userNames: users.map((u) => u?.name ?? "Unknown"),
            };
          }),
        );
      }),
    );

    return result;
  },
});
