import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";

export const record = internalMutation({
  args: {
    source: v.string(),
    target: v.string(),
    name: v.string(),
    callType: v.string(),
    startMs: v.number(),
    endMs: v.number(),
    durationMs: v.number(),
    status: v.string(),
    error: v.optional(v.string()),
    metadata: v.optional(v.string()),
    sessionId: v.string(),
    scenarioTag: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("trafficEvents", args);
  },
});

export const recordBatch = internalMutation({
  args: {
    events: v.array(
      v.object({
        source: v.string(),
        target: v.string(),
        name: v.string(),
        callType: v.string(),
        startMs: v.number(),
        endMs: v.number(),
        durationMs: v.number(),
        status: v.string(),
        error: v.optional(v.string()),
        metadata: v.optional(v.string()),
        sessionId: v.string(),
        scenarioTag: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    for (const event of args.events) {
      await ctx.db.insert("trafficEvents", event);
    }
  },
});

export const listSessions = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db.query("trafficEvents").take(5000);
    const sessionMap = new Map<
      string,
      {
        sessionId: string;
        scenarioTag: string | undefined;
        eventCount: number;
        startMs: number;
        endMs: number;
        durationMs: number;
      }
    >();

    for (const e of events) {
      const existing = sessionMap.get(e.sessionId);
      if (existing) {
        existing.eventCount++;
        existing.startMs = Math.min(existing.startMs, e.startMs);
        existing.endMs = Math.max(existing.endMs, e.endMs);
        existing.durationMs = existing.endMs - existing.startMs;
      } else {
        sessionMap.set(e.sessionId, {
          sessionId: e.sessionId,
          scenarioTag: e.scenarioTag,
          eventCount: 1,
          startMs: e.startMs,
          endMs: e.endMs,
          durationMs: e.endMs - e.startMs,
        });
      }
    }

    // Deduplicate: keep only the latest session per scenarioTag
    const byTag = new Map<string, typeof result[0]>();
    const result = Array.from(sessionMap.values()).sort((a, b) => b.startMs - a.startMs);
    const deduped: typeof result = [];
    for (const s of result) {
      const tag = s.scenarioTag ?? s.sessionId;
      if (!byTag.has(tag)) {
        byTag.set(tag, s);
        deduped.push(s);
      }
    }
    return deduped;
  },
});

export const getSessionEvents = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("trafficEvents")
      .withIndex("by_session_startMs", (q) => q.eq("sessionId", args.sessionId))
      .take(5000);
  },
});

export const deleteSession = internalMutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("trafficEvents")
      .withIndex("by_session_startMs", (q) => q.eq("sessionId", args.sessionId))
      .take(5000);
    for (const e of events) {
      await ctx.db.delete(e._id);
    }
    return events.length;
  },
});
