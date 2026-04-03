import type { TrafficEvent, Bottleneck } from "../lib/types";
import { INFRA_NODES } from "../lib/nodes";
import { formatMs, statusClass } from "../lib/format";

interface NodeDetailProps {
  nodeId: string | null;
  events: TrafficEvent[];
  activeEvents: TrafficEvent[];
  bottlenecks: Bottleneck[];
  currentTimeMs: number;
  onClose: () => void;
}

export function NodeDetail({
  nodeId,
  events,
  activeEvents,
  bottlenecks,
  currentTimeMs,
  onClose,
}: NodeDetailProps) {
  if (!nodeId) return null;

  const node = INFRA_NODES.find((n) => n.id === nodeId);
  if (!node) return null;

  // Events involving this node (as source or target)
  const nodeEvents = events.filter((e) => e.source === nodeId || e.target === nodeId);
  const inbound = nodeEvents.filter((e) => e.target === nodeId);
  const outbound = nodeEvents.filter((e) => e.source === nodeId);
  const nodeActive = activeEvents.filter((e) => e.source === nodeId || e.target === nodeId);
  const nodeBottlenecks = bottlenecks.filter((b) => b.nodeId === nodeId);

  const avgInboundMs = inbound.length > 0
    ? Math.round(inbound.reduce((s, e) => s + e.durationMs, 0) / inbound.length)
    : 0;
  const avgOutboundMs = outbound.length > 0
    ? Math.round(outbound.reduce((s, e) => s + e.durationMs, 0) / outbound.length)
    : 0;
  const errorRate = nodeEvents.length > 0
    ? ((nodeEvents.filter((e) => e.status === "error" || e.status === "rate_limited").length / nodeEvents.length) * 100).toFixed(1)
    : "0";

  // Show events near current time (recently completed or active)
  const recentEvents = nodeEvents
    .filter((e) => e.endMs <= currentTimeMs && e.endMs > currentTimeMs - 5000)
    .concat(nodeActive)
    .sort((a, b) => b.startMs - a.startMs)
    .slice(0, 20);

  return (
    <div className="flex h-full w-full flex-col border-l border-zinc-800 bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: node.color }} />
          <span className="font-semibold text-zinc-100">{node.label}</span>
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

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 border-b border-zinc-800 p-4">
        <MiniStat label="Inbound" value={inbound.length} />
        <MiniStat label="Outbound" value={outbound.length} />
        <MiniStat label="Avg In" value={`${avgInboundMs}ms`} />
        <MiniStat label="Avg Out" value={`${avgOutboundMs}ms`} />
        <MiniStat label="Error Rate" value={`${errorRate}%`} />
        <MiniStat label="Active" value={nodeActive.length} />
      </div>

      {/* Bottlenecks */}
      {nodeBottlenecks.length > 0 && (
        <div className="border-b border-zinc-800 p-4">
          <div className="mb-2 text-[10px] uppercase tracking-wider text-zinc-500">Bottlenecks</div>
          <div className="space-y-1">
            {nodeBottlenecks.map((b, i) => (
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

      {/* Event list */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-2 text-[10px] uppercase tracking-wider text-zinc-500">
          Recent Events ({recentEvents.length})
        </div>
        <div className="space-y-1">
          {recentEvents.map((e, i) => {
            const isActive = e.startMs <= currentTimeMs && e.endMs > currentTimeMs;
            return (
              <div
                key={i}
                className={`rounded px-2 py-1.5 text-xs ${
                  isActive ? "bg-orange-500/10 ring-1 ring-orange-500/30" : "bg-zinc-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate text-zinc-300" title={e.name}>{e.name}</span>
                  <span className={`ml-2 shrink-0 rounded px-1.5 py-0.5 text-[10px] ${statusClass(e.status)}`}>
                    {e.status}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-zinc-600">
                  <span>{e.source} → {e.target}</span>
                  <span>{formatMs(e.durationMs)}</span>
                  <span>{e.callType}</span>
                </div>
              </div>
            );
          })}
          {recentEvents.length === 0 && (
            <div className="text-xs text-zinc-600">No events near current time</div>
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
