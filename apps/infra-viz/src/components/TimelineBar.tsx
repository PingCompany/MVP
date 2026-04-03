import { useEffect } from "react";
import type { TrafficEvent, Bottleneck } from "../lib/types";
import { formatMs } from "../lib/format";

interface TimelineBarProps {
  events: TrafficEvent[];
  bottlenecks: Bottleneck[];
  currentTimeMs: number;
  sessionStartMs: number;
  sessionEndMs: number;
  progress: number;
  elapsedMs: number;
  totalMs: number;
  isPlaying: boolean;
  playbackSpeed: number;
  speedOptions: number[];
  onTogglePlay: () => void;
  onSeek: (timeMs: number) => void;
  onSetSpeed: (speed: number) => void;
  onCycleSpeed: () => void;
}


export function TimelineBar({
  events,
  bottlenecks,
  sessionStartMs,
  sessionEndMs,
  progress,
  elapsedMs,
  totalMs,
  isPlaying,
  playbackSpeed,
  speedOptions,
  onTogglePlay,
  onSeek,
  onSetSpeed,
  onCycleSpeed,
}: TimelineBarProps) {
  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        onTogglePlay();
      }
      if (e.key >= "1" && e.key <= "4") {
        const idx = parseInt(e.key) - 1;
        if (speedOptions[idx] !== undefined) onSetSpeed(speedOptions[idx]);
      }
      if (e.key === "s") onCycleSpeed();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onTogglePlay, onSetSpeed, onCycleSpeed, speedOptions]);

  const totalDuration = sessionEndMs - sessionStartMs;

  return (
    <div className="border-t border-zinc-800 bg-zinc-950 px-3 py-2 sm:px-4 sm:py-3">
      {/* Timeline scrubber */}
      <div className="relative mb-2">
        {/* Event ticks */}
        <div className="absolute inset-x-0 top-0 h-2">
          {events.map((e, i) => {
            const left = totalDuration > 0 ? ((e.startMs - sessionStartMs) / totalDuration) * 100 : 0;
            const color =
              e.status === "error" || e.status === "rate_limited"
                ? "bg-red-500"
                : e.callType === "cron"
                  ? "bg-blue-400"
                  : e.callType === "webhook"
                    ? "bg-green-400"
                    : "bg-zinc-600";
            return (
              <div
                key={i}
                className={`absolute top-0 h-1.5 w-px ${color} opacity-60`}
                style={{ left: `${left}%` }}
              />
            );
          })}
          {/* Bottleneck markers */}
          {bottlenecks.map((b, i) => {
            const left = totalDuration > 0 ? ((b.timeMs - sessionStartMs) / totalDuration) * 100 : 0;
            return (
              <div
                key={`b-${i}`}
                className={`absolute top-0 h-2 w-1 rounded-sm ${
                  b.severity === "critical" ? "bg-red-500" : "bg-yellow-500"
                }`}
                style={{ left: `${left}%` }}
              />
            );
          })}
        </div>

        {/* Slider */}
        <input
          type="range"
          min={0}
          max={1000}
          value={Math.round(progress * 1000)}
          onChange={(e) => {
            const pct = parseInt(e.target.value) / 1000;
            onSeek(sessionStartMs + pct * totalDuration);
          }}
          className="relative z-10 mt-2 h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-orange-500 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500"
        />
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Play/Pause */}
          <button
            onClick={onTogglePlay}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-zinc-100 transition hover:bg-zinc-700"
            title="Space to toggle"
          >
            {isPlaying ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <rect x="2" y="1" width="3.5" height="12" rx="1" />
                <rect x="8.5" y="1" width="3.5" height="12" rx="1" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <polygon points="2,1 13,7 2,13" />
              </svg>
            )}
          </button>

          {/* Speed buttons */}
          <div className="flex items-center gap-1">
            {speedOptions.map((speed, idx) => {
              const label = speed >= 1 ? "1x" : `${Math.round(1 / speed)}x`;
              return (
                <button
                  key={speed}
                  onClick={() => onSetSpeed(speed)}
                  className={`rounded px-1.5 py-0.5 text-[11px] font-mono transition sm:px-2 sm:text-xs ${
                    playbackSpeed === speed
                      ? "bg-orange-500 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                  }`}
                  title={`Press ${idx + 1}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time display */}
        <div className="text-[11px] font-mono text-zinc-500 sm:text-xs">
          <span className="text-zinc-300">{formatMs(elapsedMs)}</span>
          <span className="mx-1">/</span>
          <span>{formatMs(totalMs)}</span>
          <span className="ml-2 text-zinc-600 sm:ml-3">
            @{playbackSpeed >= 1 ? "1x" : `${Math.round(1 / playbackSpeed)}x slower`}
          </span>
        </div>
      </div>
    </div>
  );
}
