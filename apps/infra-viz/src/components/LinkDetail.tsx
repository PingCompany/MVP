import type { TrafficEvent, Bottleneck } from "../lib/types";
import { INFRA_NODES } from "../lib/nodes";
import { formatMs, statusClass } from "../lib/format";

interface LinkDetailProps {
  linkKey: string | null;
  events: TrafficEvent[];
  activeEvents: TrafficEvent[];
  bottlenecks: Bottleneck[];
  currentTimeMs: number;
  onClose: () => void;
}

function parseMetadata(meta: string | undefined): Record<string, unknown> | null {
  if (!meta) return null;
  try {
    return JSON.parse(meta);
  } catch {
    return null;
  }
}

export function LinkDetail({
  linkKey,
  events,
  activeEvents,
  bottlenecks,
  currentTimeMs,
  onClose,
}: LinkDetailProps) {
  if (!linkKey) return null;

  const [sourceId, targetId] = linkKey.split("->");
  const sourceNode = INFRA_NODES.find((n) => n.id === sourceId);
  const targetNode = INFRA_NODES.find((n) => n.id === targetId);
  if (!sourceNode || !targetNode) return null;

  // All events on this link
  const linkEvents = events.filter((e) => e.source === sourceId && e.target === targetId);
  const linkActive = activeEvents.filter((e) => e.source === sourceId && e.target === targetId);

  // Stats
  const totalCount = linkEvents.length;
  const errorCount = linkEvents.filter((e) => e.status === "error" || e.status === "rate_limited").length;
  const avgMs = totalCount > 0
    ? Math.round(linkEvents.reduce((s, e) => s + e.durationMs, 0) / totalCount)
    : 0;
  const maxMs = totalCount > 0
    ? Math.max(...linkEvents.map((e) => e.durationMs))
    : 0;
  const minMs = totalCount > 0
    ? Math.min(...linkEvents.map((e) => e.durationMs))
    : 0;

  // Group by callType
  const byType = new Map<string, number>();
  for (const e of linkEvents) {
    byType.set(e.callType, (byType.get(e.callType) ?? 0) + 1);
  }

  // Events near current time: active + recently completed
  const nearEvents = linkEvents
    .filter((e) => e.endMs <= currentTimeMs && e.endMs > currentTimeMs - 10000)
    .concat(linkActive)
    .sort((a, b) => b.startMs - a.startMs)
    .slice(0, 30);

  // Relevant bottlenecks
  const linkBottlenecks = bottlenecks.filter(
    (b) => b.nodeId === sourceId || b.nodeId === targetId,
  );

  return (
    <div className="flex h-full w-full flex-col border-l border-zinc-800 bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: sourceNode.color }} />
          <span className="font-semibold text-zinc-100">{sourceNode.label}</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-orange-500">
            <path d="M3 8h10M10 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: targetNode.color }} />
          <span className="font-semibold text-zinc-100">{targetNode.label}</span>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="2" y1="2" x2="12" y2="12" /><line x1="12" y1="2" x2="2" y2="12" />
          </svg>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 border-b border-zinc-800 p-4">
        <MiniStat label="Total" value={totalCount} />
        <MiniStat label="Active" value={linkActive.length} />
        <MiniStat label="Errors" value={errorCount} />
        <MiniStat label="Avg" value={`${avgMs}ms`} />
        <MiniStat label="Min" value={`${minMs}ms`} />
        <MiniStat label="Max" value={`${maxMs}ms`} />
      </div>

      {/* Breakdown by call type */}
      <div className="border-b border-zinc-800 px-4 py-3">
        <div className="mb-2 text-[10px] uppercase tracking-wider text-zinc-500">By type</div>
        <div className="flex flex-wrap gap-1.5">
          {Array.from(byType.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => (
              <span
                key={type}
                className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300"
              >
                {type} <span className="text-zinc-500">{count}</span>
              </span>
            ))}
        </div>
      </div>

      {/* Bottlenecks */}
      {linkBottlenecks.length > 0 && (
        <div className="border-b border-zinc-800 px-4 py-3">
          <div className="mb-2 text-[10px] uppercase tracking-wider text-zinc-500">Bottlenecks</div>
          <div className="space-y-1">
            {linkBottlenecks.map((b, i) => (
              <div
                key={i}
                className={`rounded px-2 py-1 text-xs ${
                  b.severity === "critical" ? "bg-red-500/10 text-red-400" : "bg-yellow-500/10 text-yellow-400"
                }`}
              >
                {b.description}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event list — what is being sent */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="mb-2 text-[10px] uppercase tracking-wider text-zinc-500">
          Traffic ({nearEvents.length} near current time)
        </div>
        <div className="space-y-1.5">
          {nearEvents.map((e, i) => {
            const isInFlight = e.startMs <= currentTimeMs && e.endMs > currentTimeMs;
            const meta = parseMetadata(e.metadata);

            return (
              <div
                key={i}
                className={`rounded-md border px-3 py-2 text-xs ${
                  isInFlight
                    ? "border-orange-500/40 bg-orange-500/5"
                    : "border-zinc-800 bg-zinc-900/50"
                }`}
              >
                {/* Event name + status */}
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-zinc-200" title={e.name}>
                    {e.name}
                  </span>
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${statusClass(e.status)}`}>
                    {e.status}
                  </span>
                </div>

                {/* Timing */}
                <div className="mt-1 flex items-center gap-3 text-zinc-500">
                  <span className="font-mono">{formatMs(e.durationMs)}</span>
                  <span>{e.callType}</span>
                  {isInFlight && (
                    <span className="flex items-center gap-1 text-orange-400">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400" />
                      in flight
                    </span>
                  )}
                </div>

                {/* Error detail */}
                {e.error && (
                  <div className="mt-1 rounded bg-red-500/10 px-2 py-1 text-red-400">
                    {e.error}
                  </div>
                )}

                {/* Metadata */}
                {meta && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {Object.entries(meta).map(([k, v]) => (
                      <span key={k} className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
                        {k}: <span className="text-zinc-300">{String(v)}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {nearEvents.length === 0 && (
            <div className="py-4 text-center text-xs text-zinc-600">
              No events near current time on this link
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-[10px] text-zinc-600">{label}</div>
      <div className="text-sm font-medium text-zinc-200">{value}</div>
    </div>
  );
}
