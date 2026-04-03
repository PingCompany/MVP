export interface TrafficEvent {
  _id: string;
  source: string;
  target: string;
  name: string;
  callType: string;
  startMs: number;
  endMs: number;
  durationMs: number;
  status: string;
  error?: string;
  metadata?: string;
  sessionId: string;
  scenarioTag?: string;
}

export interface SessionInfo {
  sessionId: string;
  scenarioTag: string | undefined;
  eventCount: number;
  startMs: number;
  endMs: number;
  durationMs: number;
}

export interface InfraNode {
  id: string;
  label: string;
  color: string;
  x: number;
  y: number;
  size: number;
  icon: string;
}

export interface InfraLink {
  source: string;
  target: string;
}

export interface Bottleneck {
  ruleId: string;
  severity: "warning" | "critical";
  timeMs: number;
  nodeId: string;
  description: string;
  events: TrafficEvent[];
}

export interface PlaybackState {
  currentTimeMs: number;
  playbackSpeed: number;
  isPlaying: boolean;
  sessionStartMs: number;
  sessionEndMs: number;
}
