import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { TrafficEvent, SessionInfo } from "../lib/types";

export function useSessions(): SessionInfo[] | undefined {
  return useQuery(api.trafficTrace.listSessions);
}

export function useSessionEvents(sessionId: string | null): TrafficEvent[] {
  const data = useQuery(
    api.trafficTrace.getSessionEvents,
    sessionId ? { sessionId } : "skip",
  );
  return (data as TrafficEvent[] | undefined) ?? [];
}
