import type { TrafficEvent, Bottleneck } from "../lib/types";

interface StatsBarProps {
  events: TrafficEvent[];
  activeEvents: TrafficEvent[];
  completedCount: number;
  bottlenecks: Bottleneck[];
}

export function StatsBar({ events, activeEvents, completedCount, bottlenecks }: StatsBarProps) {
  const totalEvents = events.length;
  const avgDuration =
    events.length > 0
      ? Math.round(events.reduce((sum, e) => sum + e.durationMs, 0) / events.length)
      : 0;
  const errorCount = events.filter((e) => e.status === "error" || e.status === "rate_limited").length;
  const criticalCount = bottlenecks.filter((b) => b.severity === "critical").length;
  const warningCount = bottlenecks.filter((b) => b.severity === "warning").length;

  return (
    <div className="flex flex-wrap gap-2 px-3 py-2 sm:gap-3 sm:px-4">
      <StatCard label="Total Events" value={totalEvents} />
      <StatCard label="Completed" value={completedCount} sub={`/ ${totalEvents}`} />
      <StatCard label="In Flight" value={activeEvents.length} highlight={activeEvents.length > 0} />
      <StatCard label="Avg Latency" value={`${avgDuration}ms`} />
      <StatCard label="Errors" value={errorCount} highlight={errorCount > 0} color="red" />
      <StatCard
        label="Bottlenecks"
        value={criticalCount + warningCount}
        sub={criticalCount > 0 ? `${criticalCount} critical` : undefined}
        highlight={criticalCount > 0}
        color={criticalCount > 0 ? "red" : warningCount > 0 ? "yellow" : undefined}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  highlight,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
  color?: "red" | "yellow";
}) {
  const borderColor =
    highlight && color === "red"
      ? "border-red-500/50"
      : highlight && color === "yellow"
        ? "border-yellow-500/50"
        : highlight
          ? "border-blue-500/50"
          : "border-zinc-800";

  return (
    <div className={`rounded-lg border ${borderColor} bg-zinc-900 px-3 py-1.5 min-w-[90px] sm:min-w-[110px] sm:px-4 sm:py-2`}>
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-semibold text-zinc-100">{value}</span>
        {sub && <span className="text-xs text-zinc-500">{sub}</span>}
      </div>
    </div>
  );
}
