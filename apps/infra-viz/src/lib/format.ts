export function formatMs(ms: number): string {
  if (ms < 1) return "<1ms";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}m ${s}s`;
}

export function statusClass(status: string): string {
  if (status === "error") return "bg-red-500/20 text-red-400";
  if (status === "rate_limited") return "bg-yellow-500/20 text-yellow-400";
  return "bg-green-500/20 text-green-400";
}
