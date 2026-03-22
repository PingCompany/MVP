import { query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { requireAuth } from "./auth";

const PERIOD_MS: Record<string, number> = {
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  "90d": 90 * 24 * 60 * 60 * 1000,
};

const periodValidator = v.union(
  v.literal("7d"),
  v.literal("30d"),
  v.literal("90d"),
);

async function getWorkspaceChannels(ctx: QueryCtx, workspaceId: Id<"workspaces">) {
  return ctx.db
    .query("channels")
    .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
    .take(500);
}

async function getRecentMessages(ctx: QueryCtx, channelId: Id<"channels">) {
  return ctx.db
    .query("messages")
    .withIndex("by_channel", (q) => q.eq("channelId", channelId))
    .order("desc")
    .take(2000);
}

/**
 * Combined KPI + activity breakdown query. Returns both KPI metrics and
 * per-category counts in a single pass over the data.
 */
export const getKPIs = query({
  args: { period: periodValidator, workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx, args.workspaceId);

    const now = Date.now();
    const periodMs = PERIOD_MS[args.period];
    const cutoff = now - periodMs;
    const prevCutoff = cutoff - periodMs;

    const channels = await getWorkspaceChannels(ctx, args.workspaceId);

    let botMessages = 0;
    let prevBotMessages = 0;
    let userMessages = 0;

    for (const channel of channels) {
      const msgs = await getRecentMessages(ctx, channel._id);
      for (const msg of msgs) {
        if (msg._creationTime < prevCutoff) break;
        if (msg._creationTime >= cutoff) {
          if (msg.type === "bot") botMessages++;
          else if (msg.type === "user") userMessages++;
        } else {
          if (msg.type === "bot") prevBotMessages++;
        }
      }
    }

    const summaries = await ctx.db
      .query("inboxSummaries")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(1000);
    const summaryCount = summaries.filter(
      (s) => s._creationTime >= cutoff,
    ).length;

    const alerts = await ctx.db
      .query("proactiveAlerts")
      .withIndex("by_user_status", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(1000);
    const alertCount = alerts.filter((a) => a.createdAt >= cutoff).length;

    const queryDelta =
      prevBotMessages > 0
        ? Math.round(
            ((botMessages - prevBotMessages) / prevBotMessages) * 100,
          )
        : botMessages > 0
          ? 100
          : 0;

    const hoursSaved = Math.round(((botMessages * 2) / 60) * 10) / 10;
    const prevHoursSaved = Math.round(((prevBotMessages * 2) / 60) * 10) / 10;
    const hoursDelta =
      prevHoursSaved > 0
        ? Math.round(((hoursSaved - prevHoursSaved) / prevHoursSaved) * 100)
        : hoursSaved > 0
          ? 100
          : 0;

    const totalActivity = userMessages + botMessages + summaryCount + alertCount;

    return {
      botMessages,
      totalMessages: userMessages + botMessages,
      summaryCount,
      alertCount,
      queryDelta,
      hoursSaved,
      hoursDelta,
      breakdown: [
        {
          label: "Direct Messages",
          count: userMessages,
          pct: totalActivity > 0 ? Math.round((userMessages / totalActivity) * 100) : 0,
        },
        {
          label: "Agent Queries",
          count: botMessages,
          pct: totalActivity > 0 ? Math.round((botMessages / totalActivity) * 100) : 0,
        },
        {
          label: "Inbox Summaries",
          count: summaryCount,
          pct: totalActivity > 0 ? Math.round((summaryCount / totalActivity) * 100) : 0,
        },
        {
          label: "Proactive Alerts",
          count: alertCount,
          pct: totalActivity > 0 ? Math.round((alertCount / totalActivity) * 100) : 0,
        },
      ],
    };
  },
});

/**
 * Agent (bot user) leaderboard -- counts bot messages per author
 * within the user's workspace for the given period.
 */
export const getAgentLeaderboard = query({
  args: { period: periodValidator, workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx, args.workspaceId);
    const cutoff = Date.now() - PERIOD_MS[args.period];
    const channels = await getWorkspaceChannels(ctx, args.workspaceId);

    const authorCounts: Record<string, number> = {};

    for (const channel of channels) {
      const msgs = await getRecentMessages(ctx, channel._id);
      for (const msg of msgs) {
        if (msg._creationTime < cutoff) break;
        if (msg.type === "bot") {
          authorCounts[msg.authorId] = (authorCounts[msg.authorId] ?? 0) + 1;
        }
      }
    }

    const sorted = Object.entries(authorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
    const maxCount = sorted[0]?.[1] ?? 1;

    const leaderboard = await Promise.all(
      sorted.map(async ([authorId, count]) => {
        const author = await ctx.db.get(authorId as Id<"users">);
        return {
          name: author?.name ?? "Unknown Agent",
          queries: count,
          pct: Math.round((count / maxCount) * 100),
        };
      }),
    );

    return leaderboard;
  },
});

// ---------------------------------------------------------------------------
// Decision-centric analytics
// ---------------------------------------------------------------------------

const QUADRANT_LABELS: Record<string, string> = {
  "urgent-important": "Urgent & Important",
  important: "Important",
  urgent: "Urgent",
  fyi: "FYI",
};

const DECISION_TYPE_LABELS: Record<string, string> = {
  pr_review: "PR Review",
  ticket_triage: "Ticket Triage",
  question_answer: "Q&A",
  blocked_unblock: "Unblock",
  fact_verify: "Fact Check",
  cross_team_ack: "Cross-Team",
  channel_summary: "Summary",
};

const ALERT_TYPE_LABELS: Record<string, string> = {
  unanswered_question: "Unanswered Question",
  pr_review_nudge: "PR Review Nudge",
  incident_route: "Incident Route",
  blocked_task: "Blocked Task",
  fact_check: "Fact Check",
  cross_team_sync: "Cross-Team Sync",
};

/**
 * Personal decision-centric analytics for the authenticated user.
 */
export const getUserAnalytics = query({
  args: { period: periodValidator, workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx, args.workspaceId);
    const now = Date.now();
    const periodMs = PERIOD_MS[args.period];
    const cutoff = now - periodMs;
    const prevCutoff = cutoff - periodMs;

    // --- Decisions ---
    const allDecisions = await ctx.db
      .query("decisions")
      .withIndex("by_user_status", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(2000);

    const decisionsInPeriod = allDecisions.filter((d) => d.createdAt >= cutoff);
    const resolved = decisionsInPeriod.filter(
      (d) => d.status === "decided" || d.status === "delegated",
    );
    const pending = allDecisions.filter((d) => d.status === "pending");

    // Avg decision time (createdAt → outcome.decidedAt)
    let totalDecisionMs = 0;
    let decidedCount = 0;
    for (const d of resolved) {
      if (d.outcome?.decidedAt) {
        totalDecisionMs += d.outcome.decidedAt - d.createdAt;
        decidedCount++;
      }
    }
    const avgDecisionTimeMinutes =
      decidedCount > 0 ? Math.round(totalDecisionMs / decidedCount / 60000) : 0;

    // By quadrant
    const quadrantCounts: Record<string, number> = {};
    for (const d of decisionsInPeriod) {
      quadrantCounts[d.eisenhowerQuadrant] =
        (quadrantCounts[d.eisenhowerQuadrant] ?? 0) + 1;
    }
    const decisionsByQuadrant = Object.entries(quadrantCounts).map(
      ([quadrant, count]) => ({
        quadrant,
        label: QUADRANT_LABELS[quadrant] ?? quadrant,
        count,
      }),
    );

    // By type
    const typeCounts: Record<string, number> = {};
    for (const d of decisionsInPeriod) {
      typeCounts[d.type] = (typeCounts[d.type] ?? 0) + 1;
    }
    const decisionsByType = Object.entries(typeCounts)
      .map(([type, count]) => ({
        type,
        label: DECISION_TYPE_LABELS[type] ?? type,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    // --- AI Context Prep ---
    const summaries = await ctx.db
      .query("inboxSummaries")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(1000);
    const summariesReceived = summaries.filter(
      (s) => s._creationTime >= cutoff,
    ).length;

    const alerts = await ctx.db
      .query("proactiveAlerts")
      .withIndex("by_user_status", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(1000);
    const alertsInPeriod = alerts.filter((a) => a.createdAt >= cutoff);
    const alertsSurfaced = alertsInPeriod.length;
    const alertsActedOn = alertsInPeriod.filter(
      (a) => a.status === "acted",
    ).length;

    const alertTypeCounts: Record<string, number> = {};
    for (const a of alertsInPeriod) {
      alertTypeCounts[a.type] = (alertTypeCounts[a.type] ?? 0) + 1;
    }
    const alertsByType = Object.entries(alertTypeCounts)
      .map(([type, count]) => ({
        type,
        label: ALERT_TYPE_LABELS[type] ?? type,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    // --- Cognitive load reduction ---
    const channels = await getWorkspaceChannels(ctx, args.workspaceId);
    let botAssists = 0;
    let prevBotAssists = 0;
    for (const channel of channels) {
      const msgs = await getRecentMessages(ctx, channel._id);
      for (const msg of msgs) {
        if (msg._creationTime < prevCutoff) break;
        if (msg._creationTime >= cutoff) {
          if (msg.type === "bot") botAssists++;
        } else {
          if (msg.type === "bot") prevBotAssists++;
        }
      }
    }

    const hoursSaved =
      Math.round(((botAssists * 2 + summariesReceived * 5) / 60) * 10) / 10;
    const prevHoursSaved =
      Math.round(((prevBotAssists * 2) / 60) * 10) / 10;
    const hoursDelta =
      prevHoursSaved > 0
        ? Math.round(((hoursSaved - prevHoursSaved) / prevHoursSaved) * 100)
        : hoursSaved > 0
          ? 100
          : 0;

    return {
      decisionsResolved: resolved.length,
      decisionsPending: pending.length,
      avgDecisionTimeMinutes,
      decisionsByQuadrant,
      decisionsByType,
      summariesReceived,
      alertsSurfaced,
      alertsActedOn,
      alertsByType,
      botAssists,
      hoursSaved,
      hoursDelta,
    };
  },
});

/**
 * Workspace-wide analytics — admin only.
 */
export const getWorkspaceAnalytics = query({
  args: { period: periodValidator, workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx, args.workspaceId);
    if (user.role !== "admin") {
      throw new Error("Only admins can view workspace analytics");
    }

    const now = Date.now();
    const periodMs = PERIOD_MS[args.period];
    const cutoff = now - periodMs;

    // --- Team health ---
    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .take(500);
    const totalMembers = members.length;
    const newMembers = members.filter((m) => m.joinedAt >= cutoff).length;

    // Active users (lastSeenAt within period)
    let activeUsers = 0;
    for (const m of members) {
      const u = await ctx.db.get(m.userId);
      if (u?.lastSeenAt && u.lastSeenAt >= cutoff) activeUsers++;
    }

    // --- Message & channel activity ---
    const channels = await getWorkspaceChannels(ctx, args.workspaceId);
    let totalMessages = 0;
    let totalBotAssists = 0;

    const channelMessageCounts: Array<{
      channelId: Id<"channels">;
      name: string;
      messageCount: number;
    }> = [];

    for (const channel of channels) {
      if (channel.isArchived) continue;
      const msgs = await getRecentMessages(ctx, channel._id);
      let channelCount = 0;
      for (const msg of msgs) {
        if (msg._creationTime < cutoff) break;
        totalMessages++;
        channelCount++;
        if (msg.type === "bot") totalBotAssists++;
      }
      channelMessageCounts.push({
        channelId: channel._id,
        name: channel.name,
        messageCount: channelCount,
      });
    }

    channelMessageCounts.sort((a, b) => b.messageCount - a.messageCount);
    const maxChannelCount = channelMessageCounts[0]?.messageCount ?? 1;
    const channelActivity = channelMessageCounts.slice(0, 8).map((c) => ({
      ...c,
      pct: Math.round((c.messageCount / maxChannelCount) * 100),
    }));
    const deadChannels = channelMessageCounts.filter(
      (c) => c.messageCount === 0,
    ).length;

    // --- DMs ---
    const conversations = await ctx.db
      .query("directConversations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .take(500);
    let totalDMs = 0;
    for (const conv of conversations) {
      const dms = await ctx.db
        .query("directMessages")
        .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
        .order("desc")
        .take(500);
      for (const dm of dms) {
        if (dm._creationTime < cutoff) break;
        totalDMs++;
      }
    }

    // --- Workspace decisions ---
    // Collect decisions across all members
    let totalDecisions = 0;
    let totalPending = 0;
    let totalDecisionMs = 0;
    let decidedCount = 0;
    const quadrantCounts: Record<string, number> = {};
    const userDecisionCounts: Record<string, number> = {};
    const userPendingCounts: Record<string, number> = {};

    for (const m of members) {
      const decisions = await ctx.db
        .query("decisions")
        .withIndex("by_user_status", (q) => q.eq("userId", m.userId))
        .order("desc")
        .take(500);

      for (const d of decisions) {
        if (d.status === "pending") {
          totalPending++;
          userPendingCounts[m.userId] =
            (userPendingCounts[m.userId] ?? 0) + 1;
        }
        if (d.createdAt < cutoff) continue;
        if (d.status === "decided" || d.status === "delegated") {
          totalDecisions++;
          userDecisionCounts[m.userId] =
            (userDecisionCounts[m.userId] ?? 0) + 1;
          if (d.outcome?.decidedAt) {
            totalDecisionMs += d.outcome.decidedAt - d.createdAt;
            decidedCount++;
          }
        }
        quadrantCounts[d.eisenhowerQuadrant] =
          (quadrantCounts[d.eisenhowerQuadrant] ?? 0) + 1;
      }
    }

    const avgDecisionTimeMinutes =
      decidedCount > 0 ? Math.round(totalDecisionMs / decidedCount / 60000) : 0;

    const decisionsByQuadrant = Object.entries(quadrantCounts).map(
      ([quadrant, count]) => ({
        quadrant,
        label: QUADRANT_LABELS[quadrant] ?? quadrant,
        count,
      }),
    );

    // Top deciders
    const sortedDeciders = Object.entries(userDecisionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
    const maxDecisions = sortedDeciders[0]?.[1] ?? 1;
    const topDeciders = await Promise.all(
      sortedDeciders.map(async ([userId, count]) => {
        const u = await ctx.db.get(userId as Id<"users">);
        return {
          name: u?.name ?? "Unknown",
          count,
          pct: Math.round((count / maxDecisions) * 100),
        };
      }),
    );

    // Bottlenecks (most pending)
    const sortedBottlenecks = Object.entries(userPendingCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    const bottlenecks = await Promise.all(
      sortedBottlenecks.map(async ([userId, pending]) => {
        const u = await ctx.db.get(userId as Id<"users">);
        return { name: u?.name ?? "Unknown", pending };
      }),
    );

    // --- AI platform ---
    let totalSummaries = 0;
    let totalAlerts = 0;
    const alertTypeCounts: Record<string, number> = {};

    for (const m of members) {
      const summaries = await ctx.db
        .query("inboxSummaries")
        .withIndex("by_user", (q) => q.eq("userId", m.userId))
        .order("desc")
        .take(200);
      totalSummaries += summaries.filter(
        (s) => s._creationTime >= cutoff,
      ).length;

      const alerts = await ctx.db
        .query("proactiveAlerts")
        .withIndex("by_user_status", (q) => q.eq("userId", m.userId))
        .order("desc")
        .take(200);
      for (const a of alerts) {
        if (a.createdAt < cutoff) continue;
        totalAlerts++;
        alertTypeCounts[a.type] = (alertTypeCounts[a.type] ?? 0) + 1;
      }
    }

    const totalAlertsByType = Object.entries(alertTypeCounts)
      .map(([type, count]) => ({
        type,
        label: ALERT_TYPE_LABELS[type] ?? type,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    const totalHoursSaved =
      Math.round(((totalBotAssists * 2 + totalSummaries * 5) / 60) * 10) / 10;

    // --- Integrations ---
    const integrations = await ctx.db
      .query("integrationObjects")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .take(1000);
    const recentIntegrations = integrations.filter(
      (i) => i.lastSyncedAt >= cutoff,
    );
    const prsSynced = recentIntegrations.filter(
      (i) => i.type === "github_pr",
    ).length;
    const ticketsSynced = recentIntegrations.filter(
      (i) => i.type === "linear_ticket",
    ).length;

    return {
      totalDecisions,
      totalPending,
      avgDecisionTimeMinutes,
      decisionsByQuadrant,
      activeUsers,
      totalMembers,
      newMembers,
      totalMessages,
      totalDMs,
      channelActivity,
      deadChannels,
      totalBotAssists,
      totalSummaries,
      totalAlerts,
      totalAlertsByType,
      totalHoursSaved,
      topDeciders,
      bottlenecks,
      prsSynced,
      ticketsSynced,
    };
  },
});
