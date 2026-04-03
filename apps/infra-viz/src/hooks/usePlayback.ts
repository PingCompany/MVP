import { useState, useRef, useCallback, useEffect } from "react";
import type { TrafficEvent, PlaybackState } from "../lib/types";

// 1x = real-time, then slowdowns
const SPEED_OPTIONS = [1, 1 / 5, 1 / 10, 1 / 50];

export function usePlayback(events: TrafficEvent[]) {
  const sessionStartMs = events.length > 0 ? Math.min(...events.map((e) => e.startMs)) : 0;
  const sessionEndMs = events.length > 0 ? Math.max(...events.map((e) => e.endMs)) : 0;

  const [state, setState] = useState<PlaybackState>({
    currentTimeMs: sessionStartMs,
    playbackSpeed: 1,
    isPlaying: false,
    sessionStartMs,
    sessionEndMs,
  });

  // Update bounds when events change
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      sessionStartMs,
      sessionEndMs,
      currentTimeMs: sessionStartMs,
      isPlaying: false,
    }));
  }, [sessionStartMs, sessionEndMs]);

  const lastFrameRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  const tick = useCallback(() => {
    const now = performance.now();
    const realDelta = now - lastFrameRef.current;
    lastFrameRef.current = now;

    setState((prev) => {
      if (!prev.isPlaying) return prev;

      const newTime = prev.currentTimeMs + realDelta * prev.playbackSpeed;
      if (newTime >= prev.sessionEndMs) {
        return { ...prev, currentTimeMs: prev.sessionEndMs, isPlaying: false };
      }
      return { ...prev, currentTimeMs: newTime };
    });

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (state.isPlaying) {
      lastFrameRef.current = performance.now();
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [state.isPlaying, tick]);

  const play = useCallback(() => {
    setState((prev) => {
      // If at the end, restart
      if (prev.currentTimeMs >= prev.sessionEndMs) {
        return { ...prev, currentTimeMs: prev.sessionStartMs, isPlaying: true };
      }
      return { ...prev, isPlaying: true };
    });
  }, []);

  const pause = useCallback(() => {
    setState((prev) => ({ ...prev, isPlaying: false }));
  }, []);

  const togglePlay = useCallback(() => {
    setState((prev) => {
      if (prev.isPlaying) return { ...prev, isPlaying: false };
      if (prev.currentTimeMs >= prev.sessionEndMs) {
        return { ...prev, currentTimeMs: prev.sessionStartMs, isPlaying: true };
      }
      return { ...prev, isPlaying: true };
    });
  }, []);

  const setSpeed = useCallback((speed: number) => {
    setState((prev) => ({ ...prev, playbackSpeed: speed }));
  }, []);

  const seek = useCallback((timeMs: number) => {
    setState((prev) => ({
      ...prev,
      currentTimeMs: Math.max(prev.sessionStartMs, Math.min(timeMs, prev.sessionEndMs)),
    }));
  }, []);

  const cycleSpeed = useCallback(() => {
    setState((prev) => {
      const idx = SPEED_OPTIONS.indexOf(prev.playbackSpeed);
      const next = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
      return { ...prev, playbackSpeed: next };
    });
  }, []);

  // Active events at current playback time
  const activeEvents = events.filter(
    (e) => e.startMs <= state.currentTimeMs && e.endMs > state.currentTimeMs,
  );

  // Events that have completed up to current time
  const completedCount = events.filter((e) => e.endMs <= state.currentTimeMs).length;

  // Elapsed time in the session
  const elapsedMs = state.currentTimeMs - state.sessionStartMs;
  const totalMs = state.sessionEndMs - state.sessionStartMs;
  const progress = totalMs > 0 ? elapsedMs / totalMs : 0;

  return {
    state,
    activeEvents,
    completedCount,
    elapsedMs,
    totalMs,
    progress,
    play,
    pause,
    togglePlay,
    setSpeed,
    seek,
    cycleSpeed,
    SPEED_OPTIONS,
  };
}
