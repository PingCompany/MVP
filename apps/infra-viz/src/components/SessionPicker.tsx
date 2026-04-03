import type { SessionInfo } from "../lib/types";

interface SessionPickerProps {
  sessions: SessionInfo[] | undefined;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const SCENARIO_LABELS: Record<string, string> = {
  registration: "Registration Flow",
  messaging: "Message + Agent Response",
  "dm-conversation": "DM Conversation",
  search: "Search (Cmd+K)",
  "browse-channels": "Browse Channels",
  webhook: "Webhook Arrival",
  "cron-cycle": "Cron Cycle",
  invitation: "Invitation Flow",
  "bottleneck-demo": "Bottleneck Demo",
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function SessionPicker({ sessions, selectedId, onSelect }: SessionPickerProps) {
  if (!sessions) {
    return (
      <div className="px-4 py-2 text-sm text-zinc-500">Loading sessions...</div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="px-4 py-2 text-sm text-zinc-500">
        No sessions found. Run the seed script first:
        <code className="ml-2 rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
          npx convex run seedTrafficDemo:seed
        </code>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <label className="text-xs uppercase tracking-wider text-zinc-500">Session</label>
      <select
        value={selectedId ?? ""}
        onChange={(e) => onSelect(e.target.value)}
        className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 focus:border-orange-500 focus:outline-none"
      >
        <option value="" disabled>
          Select a session...
        </option>
        {sessions.map((s) => (
          <option key={s.sessionId} value={s.sessionId}>
            {SCENARIO_LABELS[s.scenarioTag ?? ""] ?? s.scenarioTag ?? "Unknown"} — {s.eventCount} events — {formatDuration(s.durationMs)}
          </option>
        ))}
      </select>
    </div>
  );
}
