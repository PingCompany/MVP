import {
  internalAction,
  internalQuery,
  internalMutation,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 30_000;

// ── Channel message queries ────────────────────────────────────────

export const getMessage = internalQuery({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) return null;
    const author = await ctx.db.get(message.authorId);
    const channel = await ctx.db.get(message.channelId);
    return {
      _id: message._id,
      body: message.body,
      channelId: message.channelId,
      channelName: channel?.name ?? "",
      authorId: message.authorId,
      authorName: author?.name ?? "Unknown",
      createdAt: message._creationTime,
    };
  },
});

export const patchEpisodeId = internalMutation({
  args: {
    messageId: v.id("messages"),
    graphitiEpisodeId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      graphitiEpisodeId: args.graphitiEpisodeId,
    });
  },
});

export const getThreadContext = internalQuery({
  args: { threadId: v.id("messages") },
  handler: async (ctx, args) => {
    const parent = await ctx.db.get(args.threadId);
    if (!parent) return null;
    const author = await ctx.db.get(parent.authorId);
    return {
      parentBody: parent.body,
      parentAuthorName: author?.name ?? "Unknown",
    };
  },
});

// ── DM queries ─────────────────────────────────────────────────────

export const getDirectMessage = internalQuery({
  args: { messageId: v.id("directMessages") },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) return null;
    const author = await ctx.db.get(message.authorId);
    const conversation = await ctx.db.get(message.conversationId);
    return {
      _id: message._id,
      body: message.body,
      conversationId: message.conversationId,
      conversationName: conversation?.name ?? "Direct Message",
      authorId: message.authorId,
      authorName: author?.name ?? "Unknown",
      createdAt: message._creationTime,
    };
  },
});

export const patchDirectMessageEpisodeId = internalMutation({
  args: {
    messageId: v.id("directMessages"),
    graphitiEpisodeId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      graphitiEpisodeId: args.graphitiEpisodeId,
    });
  },
});

export const getThreadContextDM = internalQuery({
  args: { threadId: v.id("directMessages") },
  handler: async (ctx, args) => {
    const parent = await ctx.db.get(args.threadId);
    if (!parent) return null;
    const author = await ctx.db.get(parent.authorId);
    return {
      parentBody: parent.body,
      parentAuthorName: author?.name ?? "Unknown",
    };
  },
});

// ── Channel message ingestion ──────────────────────────────────────

export const processMessage = internalAction({
  args: {
    messageId: v.id("messages"),
    threadId: v.optional(v.id("messages")),
    retryCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const graphitiUrl =
      process.env.GRAPHITI_API_URL ?? "http://localhost:8000";
    const retryCount = args.retryCount ?? 0;

    const message = await ctx.runQuery(internal.ingest.getMessage, {
      messageId: args.messageId,
    });
    if (!message) {
      console.warn("[ingest] Message not found:", args.messageId);
      return;
    }

    // Build content with optional thread context
    let content = message.body;
    if (args.threadId) {
      const threadCtx = await ctx.runQuery(
        internal.ingest.getThreadContext,
        { threadId: args.threadId },
      );
      if (threadCtx) {
        content = `[Thread reply to: "${threadCtx.parentBody}"] ${content}`;
      }
    }

    const response = await fetch(`${graphitiUrl}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        group_id: message.channelId,
        messages: [
          {
            content,
            role_type: "user",
            role: message.authorName,
            timestamp: new Date(message.createdAt).toISOString(),
            source_description: `channel:${message.channelName}`,
            uuid: message._id,
            name: `${message.authorName} in #${message.channelName}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      if (
        (response.status === 429 || response.status === 503) &&
        retryCount < MAX_RETRIES
      ) {
        console.warn(
          `[ingest] Graphiti unavailable (${response.status}), retry ${retryCount + 1}/${MAX_RETRIES} in ${RETRY_DELAY_MS / 1000}s`,
        );
        await ctx.scheduler.runAfter(
          RETRY_DELAY_MS,
          internal.ingest.processMessage,
          {
            messageId: args.messageId,
            threadId: args.threadId,
            retryCount: retryCount + 1,
          },
        );
        return;
      }
      console.error(
        `[ingest] Graphiti /messages failed: ${response.status} ${body}`,
      );
      return;
    }

    await ctx.runMutation(internal.ingest.patchEpisodeId, {
      messageId: args.messageId,
      graphitiEpisodeId: message._id,
    });

    console.log("[ingest] Ingested message:", args.messageId);
  },
});

// ── DM ingestion ───────────────────────────────────────────────────

export const processDirectMessage = internalAction({
  args: {
    messageId: v.id("directMessages"),
    threadId: v.optional(v.id("directMessages")),
    retryCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const graphitiUrl =
      process.env.GRAPHITI_API_URL ?? "http://localhost:8000";
    const retryCount = args.retryCount ?? 0;

    const message = await ctx.runQuery(internal.ingest.getDirectMessage, {
      messageId: args.messageId,
    });
    if (!message) {
      console.warn("[ingest] DM not found:", args.messageId);
      return;
    }

    // Build content with optional thread context
    let content = message.body;
    if (args.threadId) {
      const threadCtx = await ctx.runQuery(
        internal.ingest.getThreadContextDM,
        { threadId: args.threadId },
      );
      if (threadCtx) {
        content = `[Thread reply to: "${threadCtx.parentBody}"] ${content}`;
      }
    }

    const groupId = `dm:${message.conversationId}`;

    const response = await fetch(`${graphitiUrl}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        group_id: groupId,
        messages: [
          {
            content,
            role_type: "user",
            role: message.authorName,
            timestamp: new Date(message.createdAt).toISOString(),
            source_description: `dm:${message.conversationName}`,
            uuid: message._id,
            name: `${message.authorName} in ${message.conversationName}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      if (
        (response.status === 429 || response.status === 503) &&
        retryCount < MAX_RETRIES
      ) {
        console.warn(
          `[ingest] Graphiti unavailable (${response.status}), retry ${retryCount + 1}/${MAX_RETRIES} in ${RETRY_DELAY_MS / 1000}s`,
        );
        await ctx.scheduler.runAfter(
          RETRY_DELAY_MS,
          internal.ingest.processDirectMessage,
          {
            messageId: args.messageId,
            threadId: args.threadId,
            retryCount: retryCount + 1,
          },
        );
        return;
      }
      console.error(
        `[ingest] Graphiti /messages failed: ${response.status} ${body}`,
      );
      return;
    }

    await ctx.runMutation(internal.ingest.patchDirectMessageEpisodeId, {
      messageId: args.messageId,
      graphitiEpisodeId: message._id,
    });

    console.log("[ingest] Ingested DM:", args.messageId);
  },
});
