import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

interface TrafficEvent {
  source: string;
  target: string;
  name: string;
  callType: string;
  startMs: number;
  endMs: number;
  durationMs: number;
  status: string;
  error?: string;
  metadata?: string;
  sessionId: string;
  scenarioTag?: string;
}

function evt(
  base: number,
  offsetMs: number,
  source: string,
  target: string,
  name: string,
  callType: string,
  durationMs: number,
  sessionId: string,
  scenarioTag: string,
  opts?: { status?: string; error?: string; metadata?: string },
): TrafficEvent {
  return {
    source,
    target,
    name,
    callType,
    startMs: base + offsetMs,
    endMs: base + offsetMs + durationMs,
    durationMs,
    status: opts?.status ?? "ok",
    error: opts?.error,
    metadata: opts?.metadata,
    sessionId,
    scenarioTag,
  };
}

function registrationFlow(base: number, sessionId: string): TrafficEvent[] {
  const tag = "registration";
  return [
    evt(base, 0, "browser", "vercel", "GET /sign-in (redirect)", "clientQuery", 10, sessionId, tag),
    evt(base, 10, "browser", "workos", "OAuth authorize", "action", 800, sessionId, tag),
    evt(base, 810, "workos", "browser", "OAuth callback redirect", "webhook", 5, sessionId, tag),
    evt(base, 815, "browser", "vercel", "GET /api/auth/token", "clientQuery", 50, sessionId, tag),
    evt(base, 820, "vercel", "workos", "withAuth() validate session", "action", 120, sessionId, tag),
    evt(base, 940, "vercel", "browser", "JWT token response", "clientQuery", 5, sessionId, tag),
    evt(base, 945, "browser", "convex", "users.createOrUpdate", "clientMutation", 35, sessionId, tag),
    evt(base, 980, "convex", "convex", "scheduled: workos.createOrg", "scheduled", 5, sessionId, tag),
    evt(base, 985, "convex", "workos", "createOrganization (SDK)", "action", 450, sessionId, tag),
    evt(base, 1435, "convex", "convex", "workspaces.create", "mutation", 25, sessionId, tag),
    evt(base, 1460, "convex", "convex", "scheduled: managedAgents.ensure", "scheduled", 15, sessionId, tag),
    evt(base, 1460, "convex", "convex", "channels.create #general", "mutation", 15, sessionId, tag),
    evt(base, 1480, "convex", "browser", "subscription: workspace update", "query", 5, sessionId, tag),
    evt(base, 1490, "browser", "convex", "onboarding.getState", "clientQuery", 20, sessionId, tag),
  ];
}

function messagingFlow(base: number, sessionId: string): TrafficEvent[] {
  const tag = "messaging";
  return [
    evt(base, 0, "browser", "convex", "messages.send", "clientMutation", 30, sessionId, tag),
    evt(base, 5, "browser", "convex", "typing.stop", "clientMutation", 8, sessionId, tag),
    evt(base, 30, "convex", "convex", "scheduled: ingest.processMessage", "scheduled", 5, sessionId, tag),
    evt(base, 30, "convex", "convex", "scheduled: agentRunner.dispatch", "scheduled", 5, sessionId, tag),
    evt(base, 35, "convex", "graphiti", "POST /messages (ingest)", "action", 640, sessionId, tag),
    evt(base, 675, "convex", "convex", "ingest.patchEpisodeId", "mutation", 15, sessionId, tag),
    evt(base, 40, "convex", "convex", "agentRunner.getAgentContext", "query", 20, sessionId, tag),
    evt(base, 60, "convex", "convex", "agentRunner.getRecentMessages", "query", 25, sessionId, tag),
    evt(base, 85, "convex", "graphiti", "POST /search (facts)", "action", 350, sessionId, tag),
    evt(base, 435, "convex", "openai", "POST /chat/completions (gpt-4o-mini)", "action", 2800, sessionId, tag,
      { metadata: JSON.stringify({ model: "gpt-4o-mini", tokens: 1240 }) }),
    evt(base, 3235, "convex", "convex", "bot.insertBotMessage", "mutation", 20, sessionId, tag),
    evt(base, 3255, "convex", "convex", "scheduled: ingest.processMessage (bot)", "scheduled", 5, sessionId, tag),
    evt(base, 3260, "convex", "graphiti", "POST /messages (bot ingest)", "action", 580, sessionId, tag),
    evt(base, 3840, "convex", "browser", "subscription: messages list update", "query", 5, sessionId, tag),
    // Parallel: other users receive subscription updates
    evt(base, 3842, "convex", "browser", "subscription: unreadCount update", "query", 3, sessionId, tag),
  ];
}

function webhookFlow(base: number, sessionId: string): TrafficEvent[] {
  const tag = "webhook";
  return [
    evt(base, 0, "github", "convex", "POST /webhooks/github (pull_request.opened)", "webhook", 5, sessionId, tag),
    evt(base, 5, "convex", "convex", "integrations.findWorkspaceByGithubOrg", "query", 15, sessionId, tag),
    evt(base, 20, "convex", "convex", "HMAC-SHA256 verify", "mutation", 2, sessionId, tag),
    evt(base, 22, "convex", "convex", "integrations.upsert (github_pr)", "mutation", 25, sessionId, tag),
    evt(base, 47, "convex", "convex", "integrationRouting.findByType", "query", 10, sessionId, tag),
    evt(base, 57, "convex", "convex", "messages.send (integration msg)", "mutation", 20, sessionId, tag),
    evt(base, 77, "convex", "convex", "scheduled: ingest.processMessage", "scheduled", 5, sessionId, tag),
    evt(base, 82, "convex", "graphiti", "POST /messages (integration ingest)", "action", 620, sessionId, tag),
    evt(base, 702, "convex", "browser", "subscription: messages update", "query", 5, sessionId, tag),
    evt(base, 703, "convex", "browser", "subscription: integrationObjects update", "query", 3, sessionId, tag),
    // Linear webhook arriving 2 seconds later
    evt(base, 2000, "linear", "convex", "POST /webhooks/linear (Issue.update)", "webhook", 5, sessionId, tag),
    evt(base, 2005, "convex", "convex", "integrations.findWorkspaceByLinearOrgId", "query", 12, sessionId, tag),
    evt(base, 2017, "convex", "convex", "HMAC-SHA256 verify", "mutation", 2, sessionId, tag),
    evt(base, 2019, "convex", "convex", "integrations.upsert (linear_ticket)", "mutation", 22, sessionId, tag),
    evt(base, 2041, "convex", "browser", "subscription: integrationObjects update", "query", 3, sessionId, tag),
  ];
}

function cronFlow(base: number, sessionId: string): TrafficEvent[] {
  const tag = "cron-cycle";
  return [
    evt(base, 0, "convex", "convex", "cron: summaries.generateChannelSummaries", "cron", 5, sessionId, tag),
    evt(base, 5, "convex", "convex", "channels.listActive", "query", 25, sessionId, tag),
    evt(base, 30, "convex", "convex", "messages.getRecent (ch1)", "query", 20, sessionId, tag),
    evt(base, 30, "convex", "convex", "messages.getRecent (ch2)", "query", 18, sessionId, tag),
    evt(base, 30, "convex", "convex", "messages.getRecent (ch3)", "query", 22, sessionId, tag),
    // High-activity channel: individual OpenAI call
    evt(base, 55, "convex", "openai", "POST /chat/completions (ch1 summary)", "action", 3200, sessionId, tag,
      { metadata: JSON.stringify({ model: "gpt-5.4-nano", tokens: 890 }) }),
    // Low-activity channels: batched
    evt(base, 55, "convex", "openai", "POST /chat/completions (ch2+ch3 batch)", "action", 4100, sessionId, tag,
      { metadata: JSON.stringify({ model: "gpt-5.4-nano", tokens: 1450 }) }),
    evt(base, 3255, "convex", "convex", "inboxSummaries.upsert (ch1)", "mutation", 15, sessionId, tag),
    evt(base, 4155, "convex", "convex", "inboxSummaries.upsert (ch2)", "mutation", 15, sessionId, tag),
    evt(base, 4155, "convex", "convex", "inboxSummaries.upsert (ch3)", "mutation", 15, sessionId, tag),
    evt(base, 4175, "convex", "browser", "subscription: inbox update", "query", 5, sessionId, tag),
    // Fact-check cron (fires ~5 min after summaries)
    evt(base, 5000, "convex", "convex", "cron: proactiveAlerts.scanForFactChecks", "cron", 5, sessionId, tag),
    evt(base, 5005, "convex", "convex", "messages.getRecent (all channels)", "query", 35, sessionId, tag),
    evt(base, 5040, "convex", "openai", "POST /chat/completions (fact-check)", "action", 2600, sessionId, tag,
      { metadata: JSON.stringify({ model: "gpt-4o-mini", tokens: 720 }) }),
    evt(base, 7640, "convex", "convex", "inboxItems.insert (fact_verify)", "mutation", 15, sessionId, tag),
    // Typing indicator cleanup cron
    evt(base, 8000, "convex", "convex", "cron: typing.cleanupExpired", "cron", 3, sessionId, tag),
    evt(base, 8003, "convex", "convex", "typingIndicators.deleteExpired", "mutation", 8, sessionId, tag),
  ];
}

function invitationFlow(base: number, sessionId: string): TrafficEvent[] {
  const tag = "invitation";
  return [
    evt(base, 0, "browser", "convex", "invitations.send", "clientMutation", 35, sessionId, tag),
    evt(base, 35, "convex", "convex", "scheduled: email.sendInvitation", "scheduled", 5, sessionId, tag),
    evt(base, 40, "convex", "resend", "POST /emails (invitation)", "action", 800, sessionId, tag),
    evt(base, 840, "convex", "convex", "email.markSent", "mutation", 10, sessionId, tag),
    evt(base, 845, "convex", "browser", "subscription: invitations update", "query", 5, sessionId, tag),
    // --- Time gap: user receives email and clicks link (simulated as 10s) ---
    evt(base, 10000, "browser", "vercel", "GET /invite/[token]", "clientQuery", 15, sessionId, tag),
    evt(base, 10015, "browser", "convex", "invitations.getByToken", "clientQuery", 20, sessionId, tag),
    // User signs in first
    evt(base, 10500, "browser", "workos", "OAuth authorize", "action", 750, sessionId, tag),
    evt(base, 11250, "workos", "browser", "OAuth callback", "webhook", 5, sessionId, tag),
    evt(base, 11255, "browser", "vercel", "GET /api/auth/token", "clientQuery", 45, sessionId, tag),
    evt(base, 11260, "vercel", "workos", "withAuth() validate session", "action", 110, sessionId, tag),
    // Accept invitation
    evt(base, 11400, "browser", "convex", "invitations.accept", "clientMutation", 45, sessionId, tag),
    evt(base, 11445, "convex", "convex", "workspaceMembers.add", "mutation", 20, sessionId, tag),
    evt(base, 11465, "convex", "convex", "channels.join #general", "mutation", 15, sessionId, tag),
    evt(base, 11480, "convex", "convex", "invitations.cleanupPersonalWs", "mutation", 30, sessionId, tag),
    evt(base, 11510, "convex", "browser", "subscription: workspace members", "query", 5, sessionId, tag),
    evt(base, 11512, "convex", "browser", "subscription: channels update", "query", 3, sessionId, tag),
  ];
}

function dmConversationFlow(base: number, sessionId: string): TrafficEvent[] {
  const tag = "dm-conversation";
  return [
    // User opens DM list
    evt(base, 0, "browser", "convex", "directConversations.list", "clientQuery", 25, sessionId, tag),
    evt(base, 25, "convex", "browser", "subscription: conversations", "query", 5, sessionId, tag),
    // User opens a conversation
    evt(base, 800, "browser", "convex", "directConversations.get", "clientQuery", 15, sessionId, tag),
    evt(base, 800, "browser", "convex", "directMessages.list", "clientQuery", 30, sessionId, tag),
    evt(base, 830, "convex", "browser", "subscription: messages", "query", 5, sessionId, tag),
    // User starts typing
    evt(base, 2000, "browser", "convex", "typing.start", "clientMutation", 8, sessionId, tag),
    evt(base, 2008, "convex", "browser", "subscription: typing indicator", "query", 3, sessionId, tag),
    // User sends DM
    evt(base, 3500, "browser", "convex", "directMessages.send", "clientMutation", 28, sessionId, tag),
    evt(base, 3505, "browser", "convex", "typing.stop", "clientMutation", 6, sessionId, tag),
    evt(base, 3528, "convex", "convex", "scheduled: ingest.processDirectMessage", "scheduled", 5, sessionId, tag),
    evt(base, 3528, "convex", "convex", "scheduled: agentRunner.dispatchDMResponse", "scheduled", 5, sessionId, tag),
    evt(base, 3535, "convex", "graphiti", "POST /messages (DM ingest)", "action", 550, sessionId, tag),
    evt(base, 4085, "convex", "convex", "ingest.patchEpisodeId", "mutation", 12, sessionId, tag),
    evt(base, 3540, "convex", "browser", "subscription: DM list update", "query", 5, sessionId, tag),
    // Agent responds (for agent_1to1 conversation)
    evt(base, 3540, "convex", "convex", "agentRunner.getAgentContext", "query", 18, sessionId, tag),
    evt(base, 3558, "convex", "convex", "bot.getUserChannelIds", "query", 15, sessionId, tag),
    evt(base, 3573, "convex", "graphiti", "POST /search (DM context)", "action", 380, sessionId, tag),
    evt(base, 3953, "convex", "openai", "POST /chat/completions (DM reply)", "action", 2200, sessionId, tag,
      { metadata: JSON.stringify({ model: "gpt-4o-mini", tokens: 980 }) }),
    evt(base, 6153, "convex", "convex", "bot.insertDMBotMessage", "mutation", 18, sessionId, tag),
    evt(base, 6171, "convex", "convex", "scheduled: ingest.processDirectMessage (bot)", "scheduled", 5, sessionId, tag),
    evt(base, 6176, "convex", "graphiti", "POST /messages (bot DM ingest)", "action", 490, sessionId, tag),
    evt(base, 6666, "convex", "browser", "subscription: DM messages update", "query", 5, sessionId, tag),
    // User reads the response, marks read
    evt(base, 8000, "browser", "convex", "directConversations.markRead", "clientMutation", 10, sessionId, tag),
  ];
}

function searchFlow(base: number, sessionId: string): TrafficEvent[] {
  const tag = "search";
  return [
    // User opens command palette (Cmd+K)
    evt(base, 0, "browser", "convex", "users.getMe", "clientQuery", 12, sessionId, tag),
    // User types search query — debounced, fires after 300ms pause
    evt(base, 800, "browser", "convex", "search.searchMessages", "clientQuery", 65, sessionId, tag,
      { metadata: JSON.stringify({ query: "deployment status", limit: 20 }) }),
    evt(base, 800, "browser", "convex", "search.searchDirectMessages", "clientQuery", 55, sessionId, tag,
      { metadata: JSON.stringify({ query: "deployment status", limit: 20 }) }),
    evt(base, 800, "browser", "convex", "search.searchPeople", "clientQuery", 20, sessionId, tag,
      { metadata: JSON.stringify({ query: "deployment status", limit: 10 }) }),
    evt(base, 865, "convex", "browser", "subscription: search results", "query", 5, sessionId, tag),
    // User refines query
    evt(base, 2000, "browser", "convex", "search.searchMessages", "clientQuery", 48, sessionId, tag,
      { metadata: JSON.stringify({ query: "deployment failed prod", limit: 20 }) }),
    evt(base, 2000, "browser", "convex", "search.searchDirectMessages", "clientQuery", 42, sessionId, tag,
      { metadata: JSON.stringify({ query: "deployment failed prod", limit: 20 }) }),
    evt(base, 2048, "convex", "browser", "subscription: search results", "query", 5, sessionId, tag),
    // User clicks on a search result — navigates to channel message
    evt(base, 3500, "browser", "convex", "channels.get", "clientQuery", 15, sessionId, tag),
    evt(base, 3500, "browser", "convex", "messages.listByChannel", "clientQuery", 35, sessionId, tag),
    evt(base, 3500, "browser", "convex", "channels.memberCount", "clientQuery", 10, sessionId, tag),
    evt(base, 3535, "convex", "browser", "subscription: channel messages", "query", 5, sessionId, tag),
    evt(base, 3540, "browser", "convex", "channels.markRead", "clientMutation", 10, sessionId, tag),
  ];
}

function browseChannelsFlow(base: number, sessionId: string): TrafficEvent[] {
  const tag = "browse-channels";
  return [
    // User loads sidebar — channels list
    evt(base, 0, "browser", "convex", "channels.list", "clientQuery", 30, sessionId, tag),
    evt(base, 0, "browser", "convex", "directConversations.list", "clientQuery", 28, sessionId, tag),
    evt(base, 0, "browser", "convex", "presence.heartbeat", "clientMutation", 12, sessionId, tag),
    evt(base, 30, "convex", "browser", "subscription: channels", "query", 5, sessionId, tag),
    evt(base, 28, "convex", "browser", "subscription: conversations", "query", 5, sessionId, tag),
    // User clicks channel #engineering
    evt(base, 1200, "browser", "convex", "channels.get", "clientQuery", 15, sessionId, tag),
    evt(base, 1200, "browser", "convex", "messages.listByChannel", "clientQuery", 40, sessionId, tag),
    evt(base, 1200, "browser", "convex", "channels.listMembers", "clientQuery", 22, sessionId, tag),
    evt(base, 1240, "convex", "browser", "subscription: messages", "query", 5, sessionId, tag),
    evt(base, 1245, "browser", "convex", "channels.markRead", "clientMutation", 8, sessionId, tag),
    // User scrolls up — loads older messages (pagination)
    evt(base, 3000, "browser", "convex", "messages.listByChannel (page 2)", "clientQuery", 38, sessionId, tag),
    evt(base, 3038, "convex", "browser", "subscription: messages page", "query", 5, sessionId, tag),
    // User switches to #design channel
    evt(base, 5000, "browser", "convex", "channels.get", "clientQuery", 14, sessionId, tag),
    evt(base, 5000, "browser", "convex", "messages.listByChannel", "clientQuery", 35, sessionId, tag),
    evt(base, 5000, "browser", "convex", "channels.listMembers", "clientQuery", 20, sessionId, tag),
    evt(base, 5035, "convex", "browser", "subscription: messages", "query", 5, sessionId, tag),
    evt(base, 5040, "browser", "convex", "channels.markRead", "clientMutation", 8, sessionId, tag),
    // User stars the channel
    evt(base, 6000, "browser", "convex", "channels.toggleStar", "clientMutation", 10, sessionId, tag),
    evt(base, 6010, "convex", "browser", "subscription: channels update", "query", 3, sessionId, tag),
    // Presence heartbeat fires (60s interval — simulated)
    evt(base, 7000, "browser", "convex", "presence.heartbeat", "clientMutation", 12, sessionId, tag),
  ];
}

function bottleneckScenario(base: number, sessionId: string): TrafficEvent[] {
  const tag = "bottleneck-demo";
  return [
    // Burst: 12 rapid queries in <100ms (N+1 pattern)
    ...Array.from({ length: 12 }, (_, i) =>
      evt(base, i * 8, "convex", "convex", `channelMembers.get (user ${i + 1})`, "query", 6, sessionId, tag),
    ),
    // Very slow OpenAI call (>10s)
    evt(base, 200, "convex", "openai", "POST /chat/completions (large context)", "action", 12500, sessionId, tag,
      { metadata: JSON.stringify({ model: "gpt-4o-mini", tokens: 8000 }) }),
    // Rate limit approaching
    evt(base, 300, "browser", "convex", "messages.send", "clientMutation", 30, sessionId, tag,
      { metadata: JSON.stringify({ rateLimitRemaining: 8, rateLimitMax: 30 }) }),
    evt(base, 400, "browser", "convex", "messages.send", "clientMutation", 35, sessionId, tag,
      { metadata: JSON.stringify({ rateLimitRemaining: 4, rateLimitMax: 30 }) }),
    // Rate limit hit
    evt(base, 500, "browser", "convex", "messages.send", "clientMutation", 5, sessionId, tag,
      { status: "rate_limited", metadata: JSON.stringify({ rateLimitRemaining: 0, rateLimitMax: 30 }) }),
    // Error from external service
    evt(base, 1000, "convex", "graphiti", "POST /messages (ingest)", "action", 5200, sessionId, tag,
      { status: "error", error: "ETIMEDOUT: connection timed out" }),
    // Retry succeeds
    evt(base, 6200, "convex", "graphiti", "POST /messages (ingest retry)", "action", 890, sessionId, tag),
    // Multiple errors in short window
    evt(base, 8000, "convex", "openai", "POST /chat/completions", "action", 150, sessionId, tag,
      { status: "error", error: "429 Too Many Requests" }),
    evt(base, 8200, "convex", "openai", "POST /chat/completions", "action", 120, sessionId, tag,
      { status: "error", error: "429 Too Many Requests" }),
    evt(base, 8400, "convex", "openai", "POST /chat/completions", "action", 130, sessionId, tag,
      { status: "error", error: "429 Too Many Requests" }),
    evt(base, 9000, "convex", "openai", "POST /chat/completions (after backoff)", "action", 3100, sessionId, tag),
  ];
}

export const seed = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const scenarios: { name: string; generator: (base: number, sessionId: string) => TrafficEvent[] }[] = [
      { name: "registration", generator: registrationFlow },
      { name: "messaging", generator: messagingFlow },
      { name: "dm-conversation", generator: dmConversationFlow },
      { name: "search", generator: searchFlow },
      { name: "browse-channels", generator: browseChannelsFlow },
      { name: "webhook", generator: webhookFlow },
      { name: "cron-cycle", generator: cronFlow },
      { name: "invitation", generator: invitationFlow },
      { name: "bottleneck-demo", generator: bottleneckScenario },
    ];

    for (const scenario of scenarios) {
      const sessionId = `demo-${scenario.name}-${now}`;
      const events = scenario.generator(now, sessionId);

      // Convex mutations have transaction limits, batch in chunks of 50
      for (let i = 0; i < events.length; i += 50) {
        const batch = events.slice(i, i + 50);
        await ctx.runMutation(internal.trafficTrace.recordBatch, { events: batch });
      }
    }

    return { seeded: scenarios.length, timestamp: now };
  },
});

export const seedSingle = internalAction({
  args: { scenario: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const sessionId = `demo-${args.scenario}-${now}`;

    const generators: Record<string, (base: number, sessionId: string) => TrafficEvent[]> = {
      registration: registrationFlow,
      messaging: messagingFlow,
      "dm-conversation": dmConversationFlow,
      search: searchFlow,
      "browse-channels": browseChannelsFlow,
      webhook: webhookFlow,
      "cron-cycle": cronFlow,
      invitation: invitationFlow,
      "bottleneck-demo": bottleneckScenario,
    };

    const generator = generators[args.scenario];
    if (!generator) {
      throw new Error(`Unknown scenario: ${args.scenario}. Available: ${Object.keys(generators).join(", ")}`);
    }

    const events = generator(now, sessionId);
    for (let i = 0; i < events.length; i += 50) {
      const batch = events.slice(i, i + 50);
      await ctx.runMutation(internal.trafficTrace.recordBatch, { events: batch });
    }

    return { sessionId, eventCount: events.length };
  },
});
