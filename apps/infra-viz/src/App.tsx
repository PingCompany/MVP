import { useState, useMemo, useCallback, useEffect } from "react";
import { TrafficGraph } from "./components/TrafficGraph";
import { TimelineBar } from "./components/TimelineBar";
import { NodeDetail } from "./components/NodeDetail";
import { LinkDetail } from "./components/LinkDetail";
import { SessionPicker } from "./components/SessionPicker";
import { StatsBar } from "./components/StatsBar";
import { useSessions, useSessionEvents } from "./hooks/useTrafficData";
import { usePlayback } from "./hooks/usePlayback";
import { useChaosMode } from "./hooks/useChaosMode";
import { detectBottlenecks } from "./lib/bottlenecks";
import { formatMs } from "./lib/format";

const SPEED_OPTIONS = [1, 1 / 5, 1 / 10, 1 / 50];

export default function App() {
  const sessions = useSessions();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedLink, setSelectedLink] = useState<string | null>(null);
  const [chaosActive, setChaosActive] = useState(false);
  const [chaosSpeed, setChaosSpeed] = useState(1);

  const sessionEvents = useSessionEvents(chaosActive ? null : selectedSessionId);
  const playback = usePlayback(sessionEvents);
  const chaos = useChaosMode();

  const events = chaosActive ? chaos.events : sessionEvents;
  const activeEvents = chaosActive ? chaos.activeEvents : playback.activeEvents;
  const currentTimeMs = chaosActive ? chaos.currentTimeMs : playback.state.currentTimeMs;
  const completedCount = chaosActive
    ? events.filter((e) => e.endMs <= currentTimeMs).length
    : playback.completedCount;

  const bottlenecks = useMemo(() => detectBottlenecks(events), [events]);

  // Auto-select first session
  useEffect(() => {
    if (!chaosActive && sessions && sessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(sessions[0].sessionId);
    }
  }, [chaosActive, sessions, selectedSessionId]);

  const toggleChaos = useCallback(() => {
    if (chaosActive) {
      chaos.stop();
      setChaosActive(false);
    } else {
      setChaosActive(true);
      chaos.start();
    }
    setSelectedNode(null);
    setSelectedLink(null);
  }, [chaosActive, chaos]);

  const handleSetSpeed = useCallback((speed: number) => {
    if (chaosActive) { setChaosSpeed(speed); chaos.setSpeed(speed); }
    else playback.setSpeed(speed);
  }, [chaosActive, chaos, playback]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (chaosActive) { if (chaos.isRunning) chaos.stop(); else chaos.start(); setChaosActive(chaos.isRunning ? false : true); }
        else playback.togglePlay();
      }
      if (e.key >= "1" && e.key <= "4") {
        const idx = parseInt(e.key) - 1;
        if (SPEED_OPTIONS[idx] !== undefined) handleSetSpeed(SPEED_OPTIONS[idx]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [chaosActive, chaos, playback, handleSetSpeed]);

  const hasDetail = selectedNode !== null || selectedLink !== null;

  return (
    <div className="flex h-dvh flex-col bg-zinc-950 text-zinc-100">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 px-3 py-2 sm:px-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-orange-500" />
            <h1 className="text-sm font-semibold tracking-tight">PING Infra Traffic</h1>
          </div>
          {!chaosActive && (
            <SessionPicker sessions={sessions} selectedId={selectedSessionId} onSelect={setSelectedSessionId} />
          )}
          <button
            onClick={toggleChaos}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              chaosActive
                ? "bg-red-500/20 text-red-400 ring-1 ring-red-500/40 hover:bg-red-500/30"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
            }`}
          >
            {chaosActive && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
            )}
            {chaosActive ? "Chaos Mode ON" : "Chaos Mode"}
          </button>
        </div>
        <div className="hidden text-xs text-zinc-600 lg:block">
          Space: play/pause | 1-4: speed | Click node or link
        </div>
      </header>

      <StatsBar events={events} activeEvents={activeEvents} completedCount={completedCount} bottlenecks={bottlenecks} />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <TrafficGraph
          activeEvents={activeEvents}
          bottlenecks={bottlenecks}
          currentTimeMs={currentTimeMs}
          selectedNode={selectedNode}
          selectedLink={selectedLink}
          onSelectNode={setSelectedNode}
          onSelectLink={setSelectedLink}
        />
        {hasDetail && (
          <div className="absolute inset-y-0 right-0 z-10 w-full max-w-sm shadow-2xl shadow-black/50 lg:relative lg:w-96 lg:max-w-none lg:shadow-none">
            {selectedNode && (
              <NodeDetail nodeId={selectedNode} events={events} activeEvents={activeEvents} bottlenecks={bottlenecks} currentTimeMs={currentTimeMs} onClose={() => setSelectedNode(null)} />
            )}
            {selectedLink && (
              <LinkDetail linkKey={selectedLink} events={events} activeEvents={activeEvents} bottlenecks={bottlenecks} currentTimeMs={currentTimeMs} onClose={() => setSelectedLink(null)} />
            )}
          </div>
        )}
      </div>

      {chaosActive ? (
        <div className="border-t border-zinc-800 bg-zinc-950 px-3 py-2 sm:px-4 sm:py-3">
          <div className="mb-2 flex h-1.5 gap-px overflow-hidden rounded-full bg-zinc-900">
            {Array.from({ length: 40 }, (_, i) => (
              <div key={i} className="flex-1 rounded-full transition-all duration-300"
                style={{ backgroundColor: activeEvents.length > i * 0.3 ? `rgba(249,115,22,${Math.min((activeEvents.length - i * 0.3) * 0.3, 1)})` : "transparent" }} />
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button onClick={toggleChaos} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-red-500/20 text-red-400 transition hover:bg-red-500/30">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><rect x="1" y="1" width="10" height="10" rx="1" /></svg>
              </button>
              <div className="flex items-center gap-1">
                {SPEED_OPTIONS.map((s, idx) => (
                  <button key={s} onClick={() => handleSetSpeed(s)}
                    className={`rounded px-1.5 py-0.5 text-[11px] font-mono transition sm:px-2 sm:text-xs ${chaosSpeed === s ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"}`}
                    title={`Press ${idx + 1}`}>
                    {s >= 1 ? "1x" : `${Math.round(1 / s)}x`}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
                <span className="text-[11px] font-medium text-red-400 sm:text-xs">LIVE</span>
              </div>
            </div>
            <div className="text-[11px] font-mono text-zinc-500 sm:text-xs">
              <span className="text-orange-400">{activeEvents.length}</span> in-flight
              <span className="text-zinc-600 mx-1">|</span>
              <span className="text-zinc-300">{events.length}</span> total
              <span className="text-zinc-600 mx-1">|</span>
              {formatMs(chaos.virtualTimeMs)}
              <span className="ml-2 text-zinc-600">@{chaosSpeed >= 1 ? "1x" : `${Math.round(1 / chaosSpeed)}x slower`}</span>
            </div>
          </div>
        </div>
      ) : (
        <TimelineBar
          events={sessionEvents} bottlenecks={bottlenecks}
          currentTimeMs={playback.state.currentTimeMs} sessionStartMs={playback.state.sessionStartMs} sessionEndMs={playback.state.sessionEndMs}
          progress={playback.progress} elapsedMs={playback.elapsedMs} totalMs={playback.totalMs}
          isPlaying={playback.state.isPlaying} playbackSpeed={playback.state.playbackSpeed} speedOptions={SPEED_OPTIONS}
          onTogglePlay={playback.togglePlay} onSeek={playback.seek} onSetSpeed={playback.setSpeed} onCycleSpeed={playback.cycleSpeed}
        />
      )}
    </div>
  );
}
