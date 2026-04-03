import { useRef, useEffect, useCallback } from "react";
import { INFRA_NODES, INFRA_LINKS, getLinkKey } from "../lib/nodes";
import type { TrafficEvent, Bottleneck } from "../lib/types";

interface TrafficGraphProps {
  activeEvents: TrafficEvent[];
  bottlenecks: Bottleneck[];
  currentTimeMs: number;
  selectedNode: string | null;
  selectedLink: string | null;
  onSelectNode: (id: string | null) => void;
  onSelectLink: (key: string | null) => void;
}

const LINK_LABELS: Record<string, string> = {
  "github->convex": "Webhooks",
  "linear->convex": "Webhooks",
  "browser->workos": "OAuth",
  "workos->browser": "Callback",
  "workos->convex": "User events",
  "convex->workos": "Org mgmt",
  "vercel->workos": "Session validate",
  "convex->openai": "LLM calls",
  "convex->graphiti": "Knowledge graph",
  "convex->neo4j": "Graph queries",
  "convex->resend": "Emails",
  "browser->convex": "Mutations / Queries",
  "convex->browser": "Subscriptions",
  "browser->vercel": "API routes",
  "vercel->browser": "Responses",
  "convex->convex": "Internal",
  "browser->sentry": "Error reports",
  "browser->posthog": "Analytics",
};

// Unique links for rendering
const UNIQUE_LINKS = (() => {
  const seen = new Set<string>();
  return INFRA_LINKS.filter((l) => {
    const k = getLinkKey(l.source, l.target);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
})();

// Camera state for pan/zoom
interface Camera {
  x: number;
  y: number;
  scale: number;
}

function screenToWorld(sx: number, sy: number, cam: Camera, w: number, h: number) {
  return {
    x: (sx - w / 2) / cam.scale - cam.x,
    y: (sy - h / 2) / cam.scale - cam.y,
  };
}

function findNodeAt(wx: number, wy: number): string | null {
  for (const n of INFRA_NODES) {
    const dx = wx - n.x, dy = wy - n.y;
    if (dx * dx + dy * dy < (n.size + 8) * (n.size + 8)) return n.id;
  }
  return null;
}

function findLinkAt(wx: number, wy: number): string | null {
  for (const l of UNIQUE_LINKS) {
    const sn = INFRA_NODES.find((n) => n.id === l.source)!;
    const tn = INFRA_NODES.find((n) => n.id === l.target)!;
    if (sn.id === tn.id) continue;
    const dx = tn.x - sn.x, dy = tn.y - sn.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) continue;
    const t = Math.max(0, Math.min(1, ((wx - sn.x) * dx + (wy - sn.y) * dy) / (len * len)));
    const px = sn.x + t * dx, py = sn.y + t * dy;
    const dist = Math.sqrt((wx - px) ** 2 + (wy - py) ** 2);
    if (dist < 12) return getLinkKey(l.source, l.target);
  }
  return null;
}

export function TrafficGraph({
  activeEvents,
  bottlenecks,
  currentTimeMs,
  selectedNode,
  selectedLink,
  onSelectNode,
  onSelectLink,
}: TrafficGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const camRef = useRef<Camera>({ x: 0, y: 0, scale: 0.8 });
  const rafRef = useRef(0);
  const propsRef = useRef({ activeEvents, bottlenecks, currentTimeMs, selectedNode, selectedLink });
  propsRef.current = { activeEvents, bottlenecks, currentTimeMs, selectedNode, selectedLink };

  // Resize canvas to fill container
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = container.clientWidth * dpr;
      canvas.height = container.clientHeight * dpr;
      canvas.style.width = `${container.clientWidth}px`;
      canvas.style.height = `${container.clientHeight}px`;
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Click handler
  const handleClick = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    const cam = camRef.current;
    const w = rect.width, h = rect.height;
    const { x: wx, y: wy } = screenToWorld(sx, sy, cam, w, h);

    const node = findNodeAt(wx, wy);
    if (node) { onSelectLink(null); onSelectNode(propsRef.current.selectedNode === node ? null : node); return; }
    const link = findLinkAt(wx, wy);
    if (link) { onSelectNode(null); onSelectLink(propsRef.current.selectedLink === link ? null : link); return; }
    onSelectNode(null);
    onSelectLink(null);
  }, [onSelectNode, onSelectLink]);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const cam = camRef.current;
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    cam.scale = Math.max(0.2, Math.min(3, cam.scale * factor));
  }, []);

  // Pan
  const dragRef = useRef<{ startX: number; startY: number; camX: number; camY: number } | null>(null);
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, camX: camRef.current.x, camY: camRef.current.y };
  }, []);
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const cam = camRef.current;
    cam.x = dragRef.current.camX + (e.clientX - dragRef.current.startX) / cam.scale;
    cam.y = dragRef.current.camY + (e.clientY - dragRef.current.startY) / cam.scale;
  }, []);
  const handleMouseUp = useCallback(() => { dragRef.current = null; }, []);

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function draw() {
      const w = canvas!.width, h = canvas!.height;
      const dpr = window.devicePixelRatio || 1;
      const cam = camRef.current;
      const p = propsRef.current;
      const now = Date.now();

      // Build per-link traffic map
      const linkTraffic = new Map<string, { count: number; hasError: boolean }>();
      const nodeTraffic = new Map<string, { count: number; hasError: boolean }>();
      for (const e of p.activeEvents) {
        const k = getLinkKey(e.source, e.target);
        const lt = linkTraffic.get(k);
        const isErr = e.status === "error" || e.status === "rate_limited";
        if (lt) { lt.count++; if (isErr) lt.hasError = true; }
        else linkTraffic.set(k, { count: 1, hasError: isErr });
        for (const nid of [e.source, e.target]) {
          const nt = nodeTraffic.get(nid);
          if (nt) { nt.count++; if (isErr) nt.hasError = true; }
          else nodeTraffic.set(nid, { count: 1, hasError: isErr });
        }
      }

      const bottleneckNodes = new Set<string>();
      for (const b of p.bottlenecks) {
        if (b.timeMs <= p.currentTimeMs && b.timeMs > p.currentTimeMs - 5000) bottleneckNodes.add(b.nodeId);
      }

      ctx!.clearRect(0, 0, w, h);
      ctx!.save();
      ctx!.translate(w / 2, h / 2);
      ctx!.scale(cam.scale * dpr, cam.scale * dpr);
      ctx!.translate(cam.x, cam.y);

      // ── Draw links ──
      for (const l of UNIQUE_LINKS) {
        const sn = INFRA_NODES.find((n) => n.id === l.source)!;
        const tn = INFRA_NODES.find((n) => n.id === l.target)!;
        const key = getLinkKey(l.source, l.target);
        const traffic = linkTraffic.get(key);
        const isActive = !!traffic;
        const isSel = p.selectedLink === key;
        const label = LINK_LABELS[key];

        // Self-loop
        if (sn.id === tn.id) {
          const lr = 28;
          const cx = sn.x + lr * 1.3, cy = sn.y - lr * 1.3;
          ctx!.beginPath();
          ctx!.arc(cx, cy, lr, 0, Math.PI * 2);
          ctx!.strokeStyle = isSel ? "rgba(249,115,22,0.9)" : isActive ? "rgba(249,115,22,0.4)" : "rgba(113,113,122,0.12)";
          ctx!.lineWidth = isSel ? 2.5 : isActive ? Math.min(1 + traffic!.count * 0.4, 3.5) : 0.4;
          ctx!.stroke();
          if (label) {
            ctx!.font = "500 8px Inter,system-ui,sans-serif";
            ctx!.textAlign = "center";
            ctx!.textBaseline = "middle";
            ctx!.fillStyle = isActive ? "rgba(255,255,255,0.65)" : "rgba(161,161,170,0.35)";
            ctx!.fillText(label, cx, cy - lr - 5);
          }
          if (isActive) {
            const angle = ((now / 600) % 1) * Math.PI * 2;
            ctx!.beginPath();
            ctx!.arc(cx + Math.cos(angle) * lr, cy + Math.sin(angle) * lr, 2.5, 0, Math.PI * 2);
            ctx!.fillStyle = "#F97316";
            ctx!.fill();
          }
          continue;
        }

        const dx = tn.x - sn.x, dy = tn.y - sn.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) continue;
        const ux = dx / dist, uy = dy / dist;
        const px = -uy, py = ux;
        const x1 = sn.x + ux * (sn.size + 2), y1 = sn.y + uy * (sn.size + 2);
        const x2 = tn.x - ux * (tn.size + 2), y2 = tn.y - uy * (tn.size + 2);

        // Line
        ctx!.beginPath();
        ctx!.moveTo(x1, y1);
        ctx!.lineTo(x2, y2);
        if (isSel) { ctx!.strokeStyle = "rgba(249,115,22,0.9)"; ctx!.lineWidth = 2.5; }
        else if (isActive) { ctx!.strokeStyle = traffic!.hasError ? "rgba(239,68,68,0.6)" : "rgba(249,115,22,0.45)"; ctx!.lineWidth = Math.min(1 + traffic!.count * 0.6, 4.5); }
        else { ctx!.strokeStyle = "rgba(113,113,122,0.12)"; ctx!.lineWidth = 0.4; }
        ctx!.stroke();

        // Arrow
        const aL = 7, aW = 3.5;
        ctx!.beginPath();
        ctx!.moveTo(x2, y2);
        ctx!.lineTo(x2 - ux * aL + px * aW, y2 - uy * aL + py * aW);
        ctx!.lineTo(x2 - ux * aL - px * aW, y2 - uy * aL - py * aW);
        ctx!.closePath();
        ctx!.fillStyle = isSel ? "rgba(249,115,22,0.9)" : isActive ? traffic!.hasError ? "rgba(239,68,68,0.7)" : "rgba(249,115,22,0.6)" : "rgba(113,113,122,0.2)";
        ctx!.fill();

        // Label
        if (label) {
          const mx = (x1 + x2) / 2 + px * 8, my = (y1 + y2) / 2 + py * 8;
          ctx!.save();
          ctx!.translate(mx, my);
          let ang = Math.atan2(dy, dx);
          if (ang > Math.PI / 2) ang -= Math.PI;
          if (ang < -Math.PI / 2) ang += Math.PI;
          ctx!.rotate(ang);
          ctx!.font = "500 8px Inter,system-ui,sans-serif";
          ctx!.textAlign = "center";
          ctx!.textBaseline = "middle";
          const tw = ctx!.measureText(label).width;
          ctx!.fillStyle = "rgba(9,9,11,0.85)";
          ctx!.beginPath();
          ctx!.roundRect(-tw / 2 - 3, -7, tw + 6, 14, 2);
          ctx!.fill();
          ctx!.fillStyle = isActive ? "rgba(255,255,255,0.8)" : "rgba(161,161,170,0.45)";
          ctx!.fillText(label, 0, 0);
          if (isActive) {
            const bx = tw / 2 + 10;
            ctx!.font = "700 7px Inter,system-ui,sans-serif";
            const ct = String(traffic!.count);
            const cw = ctx!.measureText(ct).width;
            ctx!.beginPath();
            ctx!.arc(bx, 0, Math.max(cw / 2 + 3, 5), 0, Math.PI * 2);
            ctx!.fillStyle = traffic!.hasError ? "#EF4444" : "#F97316";
            ctx!.fill();
            ctx!.fillStyle = "white";
            ctx!.textAlign = "center";
            ctx!.textBaseline = "middle";
            ctx!.fillText(ct, bx, 0);
          }
          ctx!.restore();
        }

        // Particles
        if (isActive) {
          const cnt = Math.min(traffic!.count, 5);
          for (let i = 0; i < cnt; i++) {
            const t = ((now / (650 + i * 130)) + i * 0.18) % 1;
            const ppx = x1 + (x2 - x1) * t, ppy = y1 + (y2 - y1) * t;
            ctx!.beginPath();
            ctx!.arc(ppx, ppy, 3, 0, Math.PI * 2);
            ctx!.fillStyle = traffic!.hasError ? "#FCA5A5" : "#FDBA74";
            ctx!.fill();
          }
        }
      }

      // ── Draw nodes ──
      for (const n of INFRA_NODES) {
        const nt = nodeTraffic.get(n.id);
        const isActive = !!nt;
        const isSel = p.selectedNode === n.id;
        const isBneck = bottleneckNodes.has(n.id);

        // Processing orbits
        if (nt) {
          const rings = Math.min(nt.count, 3);
          for (let i = 0; i < rings; i++) {
            const orbitR = n.size + 6 + i * 5;
            const speed = 2000 + i * 800;
            const angle = ((now / speed) % 1) * Math.PI * 2 + i * (Math.PI * 2 / 3);
            ctx!.beginPath();
            ctx!.arc(n.x, n.y, orbitR, angle, angle + Math.PI * 0.4);
            ctx!.strokeStyle = nt.hasError ? `rgba(239,68,68,${0.6 - i * 0.15})` : `rgba(249,115,22,${0.6 - i * 0.15})`;
            ctx!.lineWidth = 1.5;
            ctx!.stroke();
            ctx!.beginPath();
            ctx!.arc(n.x + Math.cos(angle + Math.PI * 0.4) * orbitR, n.y + Math.sin(angle + Math.PI * 0.4) * orbitR, 2, 0, Math.PI * 2);
            ctx!.fillStyle = nt.hasError ? "#FCA5A5" : "#FDBA74";
            ctx!.fill();
          }
        }

        // Bottleneck pulse
        if (isBneck) {
          const pulse = 0.5 + 0.5 * Math.sin(now / 200);
          ctx!.beginPath();
          ctx!.arc(n.x, n.y, n.size + 8, 0, Math.PI * 2);
          ctx!.strokeStyle = `rgba(239,68,68,${pulse * 0.8})`;
          ctx!.lineWidth = 3;
          ctx!.stroke();
        }

        // Selection
        if (isSel) {
          ctx!.beginPath();
          ctx!.arc(n.x, n.y, n.size + 4, 0, Math.PI * 2);
          ctx!.strokeStyle = "rgba(249,115,22,0.8)";
          ctx!.lineWidth = 2;
          ctx!.stroke();
        }

        // Body
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.size, 0, Math.PI * 2);
        ctx!.fillStyle = isActive ? n.color : n.color + "55";
        ctx!.fill();
        ctx!.strokeStyle = isActive ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.05)";
        ctx!.lineWidth = 0.5;
        ctx!.stroke();

        // Label
        ctx!.font = "600 11px Inter,system-ui,sans-serif";
        ctx!.textAlign = "center";
        ctx!.textBaseline = "top";
        ctx!.fillStyle = isActive ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.45)";
        ctx!.fillText(n.label, n.x, n.y + n.size + 3);

        // Badge
        if (nt && nt.count > 0) {
          const bx = n.x + n.size * 0.75, by = n.y - n.size * 0.75;
          ctx!.beginPath();
          ctx!.arc(bx, by, 7, 0, Math.PI * 2);
          ctx!.fillStyle = nt.hasError ? "#EF4444" : "#F97316";
          ctx!.fill();
          ctx!.font = "700 8px Inter,system-ui,sans-serif";
          ctx!.textAlign = "center";
          ctx!.textBaseline = "middle";
          ctx!.fillStyle = "white";
          ctx!.fillText(String(nt.count), bx, by);
        }
      }

      ctx!.restore();
      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div ref={containerRef} className="relative min-h-0 min-w-0 flex-1">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="h-full w-full cursor-grab active:cursor-grabbing"
      />
    </div>
  );
}
