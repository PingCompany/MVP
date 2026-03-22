import { internalMutation, mutation } from "./_generated/server";
import { requireUser } from "./auth";

export const seedDefaultData = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if default workspace already exists
    const existingWorkspace = await ctx.db
      .query("workspaces")
      .withIndex("by_slug", (q) => q.eq("slug", "default"))
      .unique();

    if (existingWorkspace) return;

    // Create a system user for seeding
    const systemUserId = await ctx.db.insert("users", {
      workosUserId: "system",
      email: "system@ping.app",
      name: "System",
      status: "active",
    });

    const workspaceId = await ctx.db.insert("workspaces", {
      name: "Default Workspace",
      slug: "default",
      createdBy: systemUserId,
    });

    // Create workspace membership for system user
    await ctx.db.insert("workspaceMembers", {
      userId: systemUserId,
      workspaceId,
      role: "admin",
      joinedAt: Date.now(),
    });

    // Create default channels
    const generalId = await ctx.db.insert("channels", {
      name: "general",
      description: "Company-wide announcements and discussion",
      workspaceId,
      createdBy: systemUserId,
      isDefault: true,
      isArchived: false,
      type: "public",
    });

    await ctx.db.insert("channels", {
      name: "engineering",
      description: "Engineering team discussions",
      workspaceId,
      createdBy: systemUserId,
      isDefault: true,
      isArchived: false,
      type: "public",
    });

    // Add system user to channels
    await ctx.db.insert("channelMembers", {
      channelId: generalId,
      userId: systemUserId,
    });
  },
});

// ─── Seed mock decisions for the logged-in user ───────────────────────────────

export const seedDecisions = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    // Find workspace membership
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
    if (!membership) throw new Error("No workspace found for user");

    const workspaceId = membership.workspaceId;

    // Get or create channels we'll reference
    const channelMap: Record<string, import("./_generated/dataModel").Id<"channels">> = {};

    const channelNames = ["engineering", "product", "general", "support", "ops", "data"];
    for (const name of channelNames) {
      const existing = await ctx.db
        .query("channels")
        .filter((q) =>
          q.and(q.eq(q.field("workspaceId"), workspaceId), q.eq(q.field("name"), name)),
        )
        .first();
      if (existing) {
        channelMap[name] = existing._id;
      } else {
        channelMap[name] = await ctx.db.insert("channels", {
          name,
          workspaceId,
          createdBy: user._id,
          isDefault: false,
          isArchived: false,
        });
      }
    }

    const now = Date.now();

    const mockDecisions: Parameters<typeof ctx.db.insert<"decisions">>[1][] = [
      // Q1 - urgent-important
      {
        userId: user._id,
        workspaceId,
        type: "pr_review",
        title: "Should we approve PR #847 to unblock the staging deploy?",
        summary: "PR #847 refactors the JWT middleware. Staging is blocked until it merges — QA window closes in 2 hours. CI is green, 1 approval still needed.",
        eisenhowerQuadrant: "urgent-important",
        status: "pending",
        channelId: channelMap["engineering"],
        orgTrace: [
          { name: "Sarah Kim", role: "author" },
          { name: "Alex Chen", role: "assignee" },
          { name: "David Park", role: "mentioned" },
          { name: "Taylor Wong", role: "to_consult" },
        ],
        recommendedActions: [
          { label: "Approve & merge", actionKey: "approve", primary: true },
          { label: "Request changes", actionKey: "request_changes", needsComment: true },
          { label: "Skip — not my call", actionKey: "snooze" },
        ],
        nextSteps: [
          { actionKey: "approve", label: "Post approval comment on PR #847", automated: true },
          { actionKey: "approve", label: "Notify QA team in #engineering", automated: true },
          { actionKey: "approve", label: "Trigger staging deploy pipeline", automated: true },
          { actionKey: "request_changes", label: "Post your feedback as PR review comment", automated: true },
          { actionKey: "request_changes", label: "Notify Sarah Kim with context", automated: true },
          { actionKey: "snooze", label: "Remind you again in 1 hour", automated: true },
        ],
        createdAt: now - 12 * 60 * 1000,
      },
      {
        userId: user._id,
        workspaceId,
        type: "question_answer",
        title: "Should we raise Acme Corp's API rate limit above their contract?",
        summary: "Acme is hitting 429s. Their contract allows 1,000 req/min but the limiter is set to 200. Marcus escalated — their batch job runs at end of business today.",
        eisenhowerQuadrant: "urgent-important",
        status: "pending",
        channelId: channelMap["support"],
        orgTrace: [
          { name: "Marcus Lee", role: "author" },
          { name: "Priya Patel", role: "mentioned" },
          { name: "Jamie Sato", role: "to_consult" },
        ],
        recommendedActions: [
          { label: "Raise to 1,000 req/min now", actionKey: "raise_limit", primary: true },
          { label: "Keep limit, ask sales to renegotiate", actionKey: "escalate_sales" },
          { label: "Escalate to account manager", actionKey: "escalate_am", needsComment: true },
        ],
        nextSteps: [
          { actionKey: "raise_limit", label: "Update Acme Corp rate limit to 1,000/min", automated: true },
          { actionKey: "raise_limit", label: "Send confirmation to Marcus Lee", automated: true },
          { actionKey: "raise_limit", label: "Log override in audit trail", automated: true },
          { actionKey: "escalate_sales", label: "Draft email to Priya Patel flagging contract gap", automated: true },
          { actionKey: "escalate_am", label: "Create follow-up task for account manager", automated: false },
        ],
        createdAt: now - 28 * 60 * 1000,
      },
      // Q2 - important
      {
        userId: user._id,
        workspaceId,
        type: "ticket_triage",
        title: "Which ds-v2 Linear tickets belong in Q2 scope?",
        summary: "34 tickets tagged 'ds-v2' are open. Jordan needs the scope locked this week — it affects roadmap planning for product, frontend, and design. Q3 starts in 5 weeks.",
        eisenhowerQuadrant: "important",
        status: "pending",
        channelId: channelMap["product"],
        orgTrace: [
          { name: "Jordan Park", role: "assignee" },
          { name: "Mia Torres", role: "mentioned" },
          { name: "Ryan Cho", role: "to_consult" },
        ],
        recommendedActions: [
          { label: "All 34 tickets in Q2", actionKey: "all_in" },
          { label: "Top 15 by priority only", actionKey: "top_15", primary: true },
          { label: "Defer all to Q3", actionKey: "defer_all" },
        ],
        nextSteps: [
          { actionKey: "all_in", label: "Add all 34 tickets to Q2 milestone in Linear", automated: true },
          { actionKey: "all_in", label: "Notify Jordan Park and Mia Torres", automated: true },
          { actionKey: "top_15", label: "Add top 15 priority tickets to Q2 milestone", automated: true },
          { actionKey: "top_15", label: "Move remaining 19 to Q3 backlog", automated: true },
          { actionKey: "top_15", label: "Post summary in #product", automated: true },
          { actionKey: "defer_all", label: "Move all ds-v2 tickets to Q3 milestone", automated: true },
          { actionKey: "defer_all", label: "Notify stakeholders of deferral", automated: true },
        ],
        createdAt: now - 2 * 60 * 60 * 1000,
      },
      {
        userId: user._id,
        workspaceId,
        type: "blocked_unblock",
        title: "How do we unblock the Stripe payment launch?",
        summary: "Integration is code-complete. Legal has had the DPA for 6 days with no response. Launch is on the roadmap for next Monday. Options involve scope trade-offs.",
        eisenhowerQuadrant: "important",
        status: "pending",
        channelId: channelMap["ops"],
        orgTrace: [
          { name: "Chris Wang", role: "author" },
          { name: "Dana Ross", role: "mentioned" },
          { name: "Legal Team", role: "to_consult" },
        ],
        recommendedActions: [
          { label: "Escalate legal — SLA breach", actionKey: "escalate_legal", primary: true },
          { label: "Launch without saved cards", actionKey: "launch_scoped" },
          { label: "Delay launch 1 week", actionKey: "delay_launch", needsComment: true },
        ],
        nextSteps: [
          { actionKey: "escalate_legal", label: "Send escalation email to legal with SLA breach notice", automated: true },
          { actionKey: "escalate_legal", label: "Set reminder to follow up in 4 hours", automated: true },
          { actionKey: "launch_scoped", label: "Update launch scope in #ops", automated: true },
          { actionKey: "launch_scoped", label: "Notify Chris Wang to remove saved cards feature", automated: false },
          { actionKey: "delay_launch", label: "Update roadmap item to next Monday + 1 week", automated: true },
          { actionKey: "delay_launch", label: "Notify stakeholders of delay with reasoning", automated: true },
        ],
        createdAt: now - 4 * 60 * 60 * 1000,
      },
      // Q3 - urgent
      {
        userId: user._id,
        workspaceId,
        type: "cross_team_ack",
        title: "Should we hold the /v1/users deprecation for mobile?",
        summary: "Backend is dropping v1/users on Friday. Mobile needs 3 more weeks. Backend says the old endpoint is causing incidents in production. One team's timeline has to move.",
        eisenhowerQuadrant: "urgent",
        status: "pending",
        channelId: channelMap["engineering"],
        orgTrace: [
          { name: "Alex Chen", role: "author" },
          { name: "Sarah Kim", role: "mentioned" },
          { name: "Jordan Park", role: "mentioned" },
          { name: "Mobile Lead", role: "to_consult" },
        ],
        recommendedActions: [
          { label: "Keep Friday deadline", actionKey: "keep_deadline", needsComment: true },
          { label: "Extend 3 weeks for mobile", actionKey: "extend", primary: true },
          { label: "Immediate deprecation, add fallback stub", actionKey: "deprecate_now" },
        ],
        nextSteps: [
          { actionKey: "keep_deadline", label: "Confirm Friday deprecation in #engineering", automated: true },
          { actionKey: "keep_deadline", label: "Add fallback error response for v1 callers", automated: false },
          { actionKey: "extend", label: "Update deprecation date to 3 weeks out", automated: true },
          { actionKey: "extend", label: "Notify backend team of extension", automated: true },
          { actionKey: "extend", label: "Create migration guide task in Linear", automated: true },
          { actionKey: "deprecate_now", label: "Deploy v1 stub with 410 Gone response", automated: false },
          { actionKey: "deprecate_now", label: "Alert all teams of immediate change", automated: true },
        ],
        createdAt: now - 45 * 60 * 1000,
      },
      // Q4 - fyi
      {
        userId: user._id,
        workspaceId,
        type: "fact_verify",
        title: "Which activation metric goes in the board deck?",
        summary: "The board deck says 68% activation but the dashboard shows 61%. One uses 'account created', the other 'first message sent'. The deck goes out Thursday.",
        eisenhowerQuadrant: "fyi",
        status: "pending",
        channelId: channelMap["data"],
        orgTrace: [
          { name: "Dana Ross", role: "author" },
          { name: "Priya Patel", role: "mentioned" },
          { name: "Board Deck Author", role: "to_consult" },
        ],
        recommendedActions: [
          { label: "Use account created — 68%", actionKey: "use_68" },
          { label: "Use first message — 61%", actionKey: "use_61", primary: true },
          { label: "Define a new standard metric", actionKey: "define_new", needsComment: true },
        ],
        nextSteps: [
          { actionKey: "use_68", label: "Update board deck metric to 68% (account created)", automated: false },
          { actionKey: "use_68", label: "Add footnote explaining definition", automated: false },
          { actionKey: "use_61", label: "Update board deck metric to 61% (first message sent)", automated: false },
          { actionKey: "use_61", label: "Add footnote explaining definition", automated: false },
          { actionKey: "define_new", label: "Create Linear ticket: define activation standard", automated: true },
          { actionKey: "define_new", label: "Notify data team to align on definition", automated: true },
        ],
        createdAt: now - 6 * 60 * 60 * 1000,
      },
      {
        userId: user._id,
        workspaceId,
        type: "channel_summary",
        title: "How do we handle the low office move survey response?",
        summary: "12 of 40 responses collected. Deadline is tomorrow. Also: all-hands slide deck needs exec review by EOD Thursday. Two things to address.",
        eisenhowerQuadrant: "fyi",
        status: "pending",
        channelId: channelMap["general"],
        orgTrace: [
          { name: "Marcus Lee", role: "author" },
          { name: "Mia Torres", role: "author" },
          { name: "Office Manager", role: "to_consult" },
        ],
        recommendedActions: [
          { label: "Send reminder to team now", actionKey: "send_reminder", primary: true },
          { label: "Extend deadline 48 hours", actionKey: "extend_deadline" },
          { label: "Close survey with current data", actionKey: "close_survey" },
        ],
        nextSteps: [
          { actionKey: "send_reminder", label: "Post reminder message in #general", automated: true },
          { actionKey: "send_reminder", label: "Send DM to non-responders", automated: true },
          { actionKey: "extend_deadline", label: "Update survey deadline to +48 hours", automated: true },
          { actionKey: "extend_deadline", label: "Post updated deadline in #general", automated: true },
          { actionKey: "close_survey", label: "Mark survey as closed with current 12 responses", automated: true },
          { actionKey: "close_survey", label: "Generate response summary report", automated: true },
        ],
        createdAt: now - 8 * 60 * 60 * 1000,
      },
    ];

    let inserted = 0;
    for (const d of mockDecisions) {
      await ctx.db.insert("decisions", d);
      inserted++;
    }

    return { inserted };
  },
});

export const clearSeedDecisions = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const pending = await ctx.db
      .query("decisions")
      .withIndex("by_user_status", (q) => q.eq("userId", user._id).eq("status", "pending"))
      .collect();

    const snoozed = await ctx.db
      .query("decisions")
      .withIndex("by_user_status", (q) => q.eq("userId", user._id).eq("status", "snoozed"))
      .collect();

    let deleted = 0;
    for (const d of [...pending, ...snoozed]) {
      await ctx.db.delete(d._id);
      deleted++;
    }

    return { deleted };
  },
});
