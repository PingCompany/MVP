import type { TrafficEvent, Bottleneck } from "./types";

export function detectBottlenecks(events: TrafficEvent[]): Bottleneck[] {
  const bottlenecks: Bottleneck[] = [];

  // Rule 1: Slow external API calls (>3s)
  for (const e of events) {
    if (
      e.durationMs > 3000 &&
      e.status === "ok" &&
      (e.target === "openai" || e.target === "graphiti" || e.target === "workos")
    ) {
      bottlenecks.push({
        ruleId: e.durationMs > 10000 ? "very-slow-api" : "slow-api",
        severity: e.durationMs > 10000 ? "critical" : "warning",
        timeMs: e.startMs,
        nodeId: e.target,
        description: `${e.name}: ${e.durationMs}ms (${e.target})`,
        events: [e],
      });
    }
  }

  // Rule 2: Rate limit proximity / hit
  for (const e of events) {
    if (e.status === "rate_limited") {
      bottlenecks.push({
        ruleId: "rate-limit-hit",
        severity: "critical",
        timeMs: e.startMs,
        nodeId: e.target,
        description: `Rate limit hit: ${e.name}`,
        events: [e],
      });
    } else if (e.metadata) {
      try {
        const meta = JSON.parse(e.metadata);
        if (meta.rateLimitRemaining !== undefined && meta.rateLimitMax) {
          const pct = meta.rateLimitRemaining / meta.rateLimitMax;
          if (pct < 0.2) {
            bottlenecks.push({
              ruleId: "rate-limit-approaching",
              severity: "warning",
              timeMs: e.startMs,
              nodeId: e.target,
              description: `Rate limit ${meta.rateLimitRemaining}/${meta.rateLimitMax} remaining: ${e.name}`,
              events: [e],
            });
          }
        }
      } catch {
        // skip invalid metadata
      }
    }
  }

  // Rule 3: Burst queries (>10 convex->convex queries in <100ms)
  const convexQueries = events
    .filter((e) => e.source === "convex" && e.target === "convex" && e.callType === "query")
    .sort((a, b) => a.startMs - b.startMs);

  for (let i = 0; i < convexQueries.length; i++) {
    const windowEnd = convexQueries[i].startMs + 100;
    const burst = convexQueries.filter((e) => e.startMs >= convexQueries[i].startMs && e.startMs <= windowEnd);
    if (burst.length > 10) {
      bottlenecks.push({
        ruleId: "burst-queries",
        severity: "warning",
        timeMs: convexQueries[i].startMs,
        nodeId: "convex",
        description: `${burst.length} queries in <100ms (possible N+1)`,
        events: burst,
      });
      // Skip past this burst window
      while (i < convexQueries.length - 1 && convexQueries[i + 1].startMs <= windowEnd) i++;
    }
  }

  // Rule 4: Error spikes (>3 errors in 30s)
  const errors = events.filter((e) => e.status === "error").sort((a, b) => a.startMs - b.startMs);
  for (let i = 0; i < errors.length; i++) {
    const windowEnd = errors[i].startMs + 30000;
    const cluster = errors.filter((e) => e.startMs >= errors[i].startMs && e.startMs <= windowEnd);
    if (cluster.length >= 3) {
      bottlenecks.push({
        ruleId: "error-spike",
        severity: "critical",
        timeMs: errors[i].startMs,
        nodeId: cluster[0].target,
        description: `${cluster.length} errors in 30s window`,
        events: cluster,
      });
      while (i < errors.length - 1 && errors[i + 1].startMs <= windowEnd) i++;
    }
  }

  return bottlenecks.sort((a, b) => a.timeMs - b.timeMs);
}
