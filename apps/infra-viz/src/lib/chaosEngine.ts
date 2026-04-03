import type { TrafficEvent } from "./types";

interface FlowStep {
  offset: number;
  source: string;
  target: string;
  name: string;
  callType: string;
  duration: number;
  status?: string;
  metadata?: string;
}

const FLOWS: { name: string; weight: number; steps: FlowStep[] }[] = [
  { name: "read-channel", weight: 20, steps: [
    { offset: 0, source: "browser", target: "convex", name: "messages.listByChannel", callType: "clientQuery", duration: 32 },
    { offset: 32, source: "convex", target: "browser", name: "subscription: messages", callType: "query", duration: 5 },
    { offset: 37, source: "browser", target: "convex", name: "channels.markRead", callType: "clientMutation", duration: 8 },
  ]},
  { name: "read-dm", weight: 15, steps: [
    { offset: 0, source: "browser", target: "convex", name: "directMessages.list", callType: "clientQuery", duration: 28 },
    { offset: 28, source: "convex", target: "browser", name: "subscription: DM messages", callType: "query", duration: 5 },
    { offset: 33, source: "browser", target: "convex", name: "directConversations.markRead", callType: "clientMutation", duration: 8 },
  ]},
  { name: "send-message", weight: 18, steps: [
    { offset: 0, source: "browser", target: "convex", name: "typing.start", callType: "clientMutation", duration: 6 },
    { offset: 6, source: "convex", target: "browser", name: "subscription: typing", callType: "query", duration: 3 },
    { offset: 400, source: "browser", target: "convex", name: "messages.send", callType: "clientMutation", duration: 28 },
    { offset: 404, source: "browser", target: "convex", name: "typing.stop", callType: "clientMutation", duration: 6 },
    { offset: 428, source: "convex", target: "convex", name: "scheduled: ingest.processMessage", callType: "scheduled", duration: 5 },
    { offset: 435, source: "convex", target: "graphiti", name: "POST /messages (ingest)", callType: "action", duration: 600 },
    { offset: 1035, source: "convex", target: "convex", name: "ingest.patchEpisodeId", callType: "mutation", duration: 12 },
    { offset: 430, source: "convex", target: "browser", name: "subscription: messages update", callType: "query", duration: 5 },
  ]},
  { name: "send-dm", weight: 14, steps: [
    { offset: 0, source: "browser", target: "convex", name: "typing.start", callType: "clientMutation", duration: 6 },
    { offset: 350, source: "browser", target: "convex", name: "directMessages.send", callType: "clientMutation", duration: 25 },
    { offset: 375, source: "convex", target: "convex", name: "scheduled: ingest.processDirectMessage", callType: "scheduled", duration: 5 },
    { offset: 380, source: "convex", target: "graphiti", name: "POST /messages (DM ingest)", callType: "action", duration: 520 },
    { offset: 377, source: "convex", target: "browser", name: "subscription: DM update", callType: "query", duration: 5 },
  ]},
  { name: "browse-channel", weight: 10, steps: [
    { offset: 0, source: "browser", target: "convex", name: "channels.get", callType: "clientQuery", duration: 15 },
    { offset: 0, source: "browser", target: "convex", name: "messages.listByChannel", callType: "clientQuery", duration: 35 },
    { offset: 35, source: "convex", target: "browser", name: "subscription: messages", callType: "query", duration: 5 },
    { offset: 40, source: "browser", target: "convex", name: "channels.markRead", callType: "clientMutation", duration: 8 },
  ]},
  { name: "presence", weight: 6, steps: [
    { offset: 0, source: "browser", target: "convex", name: "presence.heartbeat", callType: "clientMutation", duration: 12 },
  ]},
  { name: "sidebar", weight: 5, steps: [
    { offset: 0, source: "browser", target: "convex", name: "channels.list", callType: "clientQuery", duration: 28 },
    { offset: 0, source: "browser", target: "convex", name: "directConversations.list", callType: "clientQuery", duration: 25 },
    { offset: 28, source: "convex", target: "browser", name: "subscription: channels", callType: "query", duration: 5 },
  ]},
  { name: "search", weight: 3, steps: [
    { offset: 0, source: "browser", target: "convex", name: "search.searchMessages", callType: "clientQuery", duration: 55 },
    { offset: 0, source: "browser", target: "convex", name: "search.searchPeople", callType: "clientQuery", duration: 18 },
    { offset: 55, source: "convex", target: "browser", name: "subscription: search results", callType: "query", duration: 5 },
  ]},
  { name: "reaction", weight: 4, steps: [
    { offset: 0, source: "browser", target: "convex", name: "reactions.toggle", callType: "clientMutation", duration: 15 },
    { offset: 15, source: "convex", target: "browser", name: "subscription: reactions", callType: "query", duration: 3 },
  ]},
  { name: "agent-reply", weight: 3, steps: [
    { offset: 0, source: "convex", target: "convex", name: "agentRunner.dispatch", callType: "scheduled", duration: 5 },
    { offset: 45, source: "convex", target: "graphiti", name: "POST /search (facts)", callType: "action", duration: 340 },
    { offset: 385, source: "convex", target: "openai", name: "POST /chat/completions", callType: "action", duration: 2600 },
    { offset: 2985, source: "convex", target: "convex", name: "bot.insertBotMessage", callType: "mutation", duration: 18 },
    { offset: 3003, source: "convex", target: "graphiti", name: "POST /messages (bot ingest)", callType: "action", duration: 500 },
    { offset: 3005, source: "convex", target: "browser", name: "subscription: messages", callType: "query", duration: 5 },
  ]},
  { name: "github-webhook", weight: 2, steps: [
    { offset: 0, source: "github", target: "convex", name: "POST /webhooks/github", callType: "webhook", duration: 5 },
    { offset: 19, source: "convex", target: "convex", name: "integrations.upsert", callType: "mutation", duration: 22 },
    { offset: 41, source: "convex", target: "graphiti", name: "POST /messages (integration)", callType: "action", duration: 580 },
    { offset: 42, source: "convex", target: "browser", name: "subscription: messages", callType: "query", duration: 5 },
  ]},
  { name: "linear-webhook", weight: 2, steps: [
    { offset: 0, source: "linear", target: "convex", name: "POST /webhooks/linear", callType: "webhook", duration: 5 },
    { offset: 17, source: "convex", target: "convex", name: "integrations.upsert", callType: "mutation", duration: 20 },
    { offset: 37, source: "convex", target: "browser", name: "subscription: integrations", callType: "query", duration: 3 },
  ]},
  { name: "cron-summaries", weight: 1, steps: [
    { offset: 0, source: "convex", target: "convex", name: "cron: summaries.generate", callType: "cron", duration: 5 },
    { offset: 50, source: "convex", target: "openai", name: "POST /chat/completions (summaries)", callType: "action", duration: 3800 },
    { offset: 3850, source: "convex", target: "convex", name: "inboxSummaries.upsert", callType: "mutation", duration: 15 },
    { offset: 3865, source: "convex", target: "browser", name: "subscription: inbox", callType: "query", duration: 5 },
  ]},
];

const TOTAL_WEIGHT = FLOWS.reduce((s, f) => s + f.weight, 0);

function pickFlow() {
  let r = Math.random() * TOTAL_WEIGHT;
  for (const f of FLOWS) { r -= f.weight; if (r <= 0) return f; }
  return FLOWS[FLOWS.length - 1];
}

function jitter(val: number): number {
  return Math.round(val * (0.8 + Math.random() * 0.4));
}

const NUM_USERS = 10;

export interface ChaosInstance {
  events: TrafficEvent[];
  userNextAction: number[];
  nextId: number;
  virtualTimeMs: number;
  baseTime: number;
}

export function createChaos(): ChaosInstance {
  const userNextAction = Array.from({ length: NUM_USERS }, () => Math.random() * 300);
  return { events: [], userNextAction, nextId: 0, virtualTimeMs: 0, baseTime: Date.now() };
}

export function tickChaos(state: ChaosInstance, deltaMsReal: number, speed: number): ChaosInstance {
  const vDelta = deltaMsReal * speed;
  const newVT = state.virtualTimeMs + vDelta;
  const nowAbs = state.baseTime + newVT;
  let { nextId } = state;
  const newEvents: TrafficEvent[] = [];
  const userNextAction = [...state.userNextAction];

  for (let u = 0; u < NUM_USERS; u++) {
    while (userNextAction[u] < newVT) {
      const f = pickFlow();
      const actionTime = Math.max(userNextAction[u], state.virtualTimeMs);
      const flowBase = state.baseTime + actionTime;

      for (const s of f.steps) {
        const dur = jitter(s.duration);
        const start = flowBase + jitter(s.offset);
        newEvents.push({
          _id: `c${nextId++}`,
          source: s.source, target: s.target, name: s.name, callType: s.callType,
          startMs: start, endMs: start + dur, durationMs: dur,
          status: s.status ?? "ok", metadata: s.metadata,
          sessionId: "__chaos__", scenarioTag: f.name,
        });
      }

      const flowDur = Math.max(...f.steps.map((s) => s.offset + s.duration));
      userNextAction[u] = actionTime + flowDur + 300 + Math.random() * 1500;
    }
  }

  if (newEvents.length === 0) {
    return { ...state, virtualTimeMs: newVT, userNextAction };
  }

  const cutoff = nowAbs - 60000;
  const events = [...state.events, ...newEvents].filter((e) => e.endMs > cutoff);
  return { events, userNextAction, nextId, virtualTimeMs: newVT, baseTime: state.baseTime };
}

export function getChaosActiveEvents(state: ChaosInstance): TrafficEvent[] {
  const now = state.baseTime + state.virtualTimeMs;
  return state.events.filter((e) => e.startMs <= now && e.endMs > now);
}
