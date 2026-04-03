import type { InfraNode, InfraLink } from "./types";

// Fixed positions for infrastructure nodes (canvas coordinates)
// Layout: 4 tiers, Convex at center
export const INFRA_NODES: InfraNode[] = [
  // Tier 1: External event sources (top)
  { id: "github", label: "GitHub", color: "#f0f6fc", x: -200, y: -250, size: 18, icon: "github" },
  { id: "linear", label: "Linear", color: "#5E6AD2", x: 200, y: -250, size: 18, icon: "ticket" },

  // Tier 2: Core services (middle)
  { id: "workos", label: "WorkOS", color: "#6366F1", x: -350, y: -50, size: 18, icon: "shield" },
  { id: "convex", label: "Convex", color: "#F97316", x: 0, y: 0, size: 35, icon: "database" },
  { id: "openai", label: "OpenAI", color: "#10A37F", x: 350, y: -50, size: 20, icon: "brain" },

  // Tier 3: Data services
  { id: "graphiti", label: "Graphiti", color: "#A855F7", x: -200, y: 150, size: 16, icon: "git-branch" },
  { id: "neo4j", label: "Neo4j", color: "#018BFF", x: 0, y: 200, size: 14, icon: "share-2" },
  { id: "resend", label: "Resend", color: "#000000", x: 200, y: 150, size: 14, icon: "mail" },

  // Tier 4: Client layer (bottom)
  { id: "vercel", label: "Vercel", color: "#FFFFFF", x: -150, y: 350, size: 16, icon: "triangle" },
  { id: "browser", label: "Browser", color: "#3B82F6", x: 0, y: 420, size: 22, icon: "monitor" },

  // Tier 4 side: Analytics (right)
  { id: "sentry", label: "Sentry", color: "#362D59", x: 300, y: 350, size: 12, icon: "bug" },
  { id: "posthog", label: "PostHog", color: "#F9BD2B", x: 400, y: 250, size: 12, icon: "bar-chart-2" },
];

// All possible links between nodes
export const INFRA_LINKS: InfraLink[] = [
  // Webhooks into Convex
  { source: "github", target: "convex" },
  { source: "linear", target: "convex" },

  // Auth flow
  { source: "workos", target: "convex" },
  { source: "browser", target: "workos" },
  { source: "workos", target: "browser" },
  { source: "vercel", target: "workos" },
  { source: "convex", target: "workos" },

  // AI / Knowledge
  { source: "convex", target: "openai" },
  { source: "convex", target: "graphiti" },
  { source: "convex", target: "neo4j" },

  // Email
  { source: "convex", target: "resend" },

  // Client <-> Backend
  { source: "browser", target: "convex" },
  { source: "convex", target: "browser" },
  { source: "browser", target: "vercel" },
  { source: "vercel", target: "browser" },

  // Internal
  { source: "convex", target: "convex" },

  // Analytics (client side)
  { source: "browser", target: "sentry" },
  { source: "browser", target: "posthog" },
];

export function getNodeById(id: string): InfraNode | undefined {
  return INFRA_NODES.find((n) => n.id === id);
}

export function getLinkKey(source: string, target: string): string {
  return `${source}->${target}`;
}
