import { useState, useRef, useCallback, useEffect } from "react";
import { type ChaosInstance, createChaos, tickChaos, getChaosActiveEvents } from "../lib/chaosEngine";
import type { TrafficEvent } from "../lib/types";

export function useChaosMode() {
  const [chaos, setChaos] = useState<ChaosInstance | null>(null);
  const speedRef = useRef(1);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(0 as unknown as ReturnType<typeof setInterval>);
  const lastTickRef = useRef(0);

  const isRunning = chaos !== null;

  const start = useCallback(() => {
    const instance = createChaos();
    setChaos(instance);
    lastTickRef.current = performance.now();
  }, []);

  const stop = useCallback(() => {
    setChaos(null);
  }, []);

  const setSpeed = useCallback((s: number) => { speedRef.current = s; }, []);

  // Tick at ~30fps via setInterval (simpler than RAF, TrafficGraph has its own RAF for rendering)
  useEffect(() => {
    if (!chaos) return;
    intervalRef.current = setInterval(() => {
      const now = performance.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;
      setChaos((prev) => prev ? tickChaos(prev, delta, speedRef.current) : null);
    }, 33);
    return () => clearInterval(intervalRef.current);
  }, [!!chaos]); // only re-run when chaos starts/stops, not on every state change

  const activeEvents: TrafficEvent[] = chaos ? getChaosActiveEvents(chaos) : [];
  const events: TrafficEvent[] = chaos?.events ?? [];
  const currentTimeMs = chaos ? chaos.baseTime + chaos.virtualTimeMs : 0;
  const virtualTimeMs = chaos?.virtualTimeMs ?? 0;

  return { isRunning, events, activeEvents, currentTimeMs, virtualTimeMs, start, stop, setSpeed };
}
