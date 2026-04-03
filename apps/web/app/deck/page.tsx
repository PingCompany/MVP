"use client";

import { motion, useInView } from "motion/react";
import { useRef, useEffect, useState } from "react";

/* --- PRIMITIVES --- */
function Tag({ children, color = "indigo" }: { children: React.ReactNode; color?: string }) {
  const c: Record<string, string> = {
    indigo: "text-indigo-400 border-indigo-500/25 bg-indigo-500/8",
    emerald: "text-emerald-400 border-emerald-500/25 bg-emerald-500/8",
    amber: "text-amber-400 border-amber-500/25 bg-amber-500/8",
    rose: "text-rose-400 border-rose-500/25 bg-rose-500/8",
    violet: "text-violet-400 border-violet-500/25 bg-violet-500/8",
    sky: "text-sky-400 border-sky-500/25 bg-sky-500/8",
  };
  return <span className={`inline-block font-semibold tracking-[0.14em] text-[11px] uppercase border px-3 py-1 rounded-full ${c[color]}`}>{children}</span>;
}

function Source({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-neutral-700 tracking-wide mt-3 font-light">Source: {children}</p>;
}

function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: false, amount: 0.9 });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) { setV(0); return; }
    let start: number | null = null;
    const frame = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1200, 1);
      setV(Math.floor(p * to));
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [inView, to]);
  return <span ref={ref}>{v.toLocaleString()}{suffix}</span>;
}

/* --- NAV --- */
const NAV = ["Cover","Problem","Cost","Solution","Moat","Tech","vs. Slack","ROI","Pricing","Market","Why Now","Traction","Connect"];

function Nav({ idx }: { idx: number }) {
  return (
    <nav className="fixed right-3 md:right-5 top-1/2 -translate-y-1/2 z-50 flex-col gap-2 hidden md:flex" aria-label="Slides">
      {NAV.map((label, i) => (
        <button key={i} title={label}
          onClick={() => document.getElementById(`s${i}`)?.scrollIntoView({ behavior: "smooth" })}
          className={`rounded-full transition-all duration-300 ${i === idx ? "w-1.5 h-5 bg-white" : "w-1.5 h-1.5 bg-neutral-700 hover:bg-neutral-500"}`}
        />
      ))}
    </nav>
  );
}

function S({ id, idx, children, wide = false, stretch = false }: { id: string; idx: number; children: React.ReactNode; wide?: boolean; stretch?: boolean }) {
  return (
    <section id={id} data-idx={idx} className={`snap-start snap-always h-[100dvh] flex flex-col items-center px-4 md:px-8 relative ${stretch ? "justify-between py-10 md:py-14" : "justify-center py-8 md:py-10"}`}>
      <div className={`w-full ${wide ? "max-w-7xl" : "max-w-5xl"} ${stretch ? "flex flex-col h-full" : ""}`}>{children}</div>
    </section>
  );
}

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ type: "spring", stiffness: 70, damping: 18, delay }}
      viewport={{ once: false, amount: 0.2 }}
      className={className}>
      {children}
    </motion.div>
  );
}

/* ══ SLIDE 0 - COVER ══ */
function Cover() {
  return (
    <S id="s0" idx={0}>
      {/* Animated aurora background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.15, 1], x: [0, 40, -20, 0], y: [0, -30, 20, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 70%)" }}
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [0, -50, 30, 0], y: [0, 40, -20, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(139,92,246,0.14) 0%, transparent 70%)" }}
        />
        {/* Signature: slowly rotating ring of nodes — the decision graph */}
        <motion.svg
          animate={{ rotate: 360 }}
          transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[640px] opacity-[0.07]"
          viewBox="0 0 200 200">
          {[0,1,2,3,4,5,6,7].map(i => {
            const a = (i / 8) * Math.PI * 2;
            const x = 100 + 85 * Math.cos(a);
            const y = 100 + 85 * Math.sin(a);
            const nx = 100 + 85 * Math.cos(a + Math.PI * 2 / 8);
            const ny = 100 + 85 * Math.sin(a + Math.PI * 2 / 8);
            return <g key={i}>
              <circle cx={x} cy={y} r="4" fill="#818cf8"/>
              <line x1={x} y1={y} x2={nx} y2={ny} stroke="#4f46e5" strokeWidth="0.5"/>
              <line x1={x} y1={y} x2="100" y2="100" stroke="#4f46e5" strokeWidth="0.3"/>
            </g>;
          })}
          <circle cx="100" cy="100" r="6" fill="#6366f1"/>
        </motion.svg>
      </div>
      <div className="relative text-center">
        {/* Signature sweep reveal on headline */}
        <FadeUp delay={0.05}>
          <motion.h1
            className="text-[2.6rem] md:text-[4.5rem] lg:text-[6.5rem] font-semibold tracking-tight leading-[0.92] mb-5 md:mb-7"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.01 }}>
            <motion.span
              className="text-white inline-block"
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              animate={{ clipPath: "inset(0 0% 0 0)" }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}>
              Service firms don&apos;t
            </motion.span>
            <br />
            <motion.span
              className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent inline-block"
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              animate={{ clipPath: "inset(0 0% 0 0)" }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.55 }}>
              scale decisions.
            </motion.span>
          </motion.h1>
        </FadeUp>
        <FadeUp delay={0.9}>
          <p className="text-neutral-400 text-base md:text-xl max-w-xl mx-auto leading-relaxed">
            OpenPing removes coordination overhead so delivery teams handle more clients, close decisions faster, and grow without adding operations headcount.
          </p>
        </FadeUp>
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
          className="mt-14 md:mt-16 flex flex-col items-center gap-1.5 text-neutral-700">
          <span className="text-[10px] tracking-[0.2em] uppercase">scroll</span>
          <div className="w-px h-6 bg-gradient-to-b from-neutral-700 to-transparent" />
        </motion.div>
      </div>
    </S>
  );
}

/* ══ SLIDE 1 - THE COORDINATION TAX ══ */
function CoordTax() {
  const items = [
    { pct: 40, label: "Senior expert time on low-value routing", color: "bg-rose-500" },
    { pct: 28, label: "Status chasing and context reconstruction", color: "bg-orange-500" },
    { pct: 18, label: "Alignment meetings that could be decisions", color: "bg-amber-500" },
    { pct: 14, label: "Actual billable delivery work", color: "bg-emerald-500" },
  ];
  return (
    <S id="s1" idx={1} wide stretch>
      {/* Background glow for slide 1 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(225,29,72,0.06),transparent_60%)]" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center flex-1">
        <FadeUp>
          <Tag color="rose">The Coordination Tax</Tag>
          <h2 className="mt-4 text-[2rem] md:text-[2.8rem] lg:text-[3.2rem] font-semibold tracking-tight leading-[1.02] text-white mb-4">
            Every delivery firm&apos;s<br /><span className="text-rose-400">fastest-growing cost</span><br />doesn&apos;t appear on a P&L.
          </h2>
          <p className="text-neutral-500 text-sm leading-relaxed mb-4">
            The coordination layer is every hour senior people spend <em className="text-neutral-300">moving information</em> instead of using it: chasing status, reconstructing context, re-routing asks, sitting in alignment calls.
          </p>
          <div className="flex items-center gap-4 p-4 rounded-xl border border-rose-900/40 bg-rose-950/10">
            <span className="text-3xl font-bold text-rose-400 shrink-0">2.3x</span>
            <p className="text-xs text-neutral-400 leading-snug">Coordination overhead grows <strong className="text-white">2.3x faster than revenue</strong> in service firms scaling without tooling.</p>
          </div>
          <Source>The Focus Company - Organizational Cognition Research, 2025-2026</Source>
        </FadeUp>
        <FadeUp delay={0.12}>
          <p className="text-xs text-neutral-600 uppercase tracking-widest font-medium mb-4">How a delivery lead&apos;s week is actually spent</p>
          <div className="space-y-3 md:space-y-4">
            {items.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-neutral-500">{item.label}</span>
                  <span className="text-sm font-semibold text-white ml-3">{item.pct}%</span>
                </div>
                <div className="h-6 rounded-lg bg-neutral-900 overflow-hidden">
                  <motion.div initial={{ width: 0 }} whileInView={{ width: `${item.pct}%` }}
                    transition={{ duration: 0.9, delay: i * 0.1, ease: "easeOut" }} viewport={{ once: false, amount: 0.5 }}
                    className={`h-full rounded-lg ${item.color} opacity-80`} />
                </div>
              </div>
            ))}
            <Source>The Focus Company - Time allocation study, n=47 delivery leads, 2026</Source>
          </div>
        </FadeUp>
      </div>
    </S>
  );
}

/* ══ SLIDE 2 - WHAT IT COSTS ══ */
function WhatItCosts() {
  return (
    <S id="s2" idx={2} wide stretch>
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute bottom-0 left-[-20%] w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.05),transparent_60%)]" />
      </div>
      <FadeUp className="mb-6">
        <Tag color="amber">What It Costs</Tag>
        <h2 className="mt-4 text-[2rem] md:text-[2.8rem] lg:text-[3.2rem] font-semibold tracking-tight leading-[1.02] text-white">
          The coordination layer<br /><span className="text-amber-400">has a price tag.</span>
        </h2>
      </FadeUp>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-5">
        {[
          { metric: "$180k+", label: "Annual cost of 1 coordination FTE", sub: "Loaded salary + management overhead for a single ops coordinator or project manager", color: "text-rose-400" },
          { metric: "1 in 3", label: "Senior hours lost to coordination overhead", sub: "Not execution - the overhead of tracking, chasing, and re-assembling context that disconnected tools create", color: "text-amber-400" },
          { metric: "74% / 22%", label: "The AI productivity gap", sub: "74% of workers say AI makes them more productive individually. Only 22% of firms see measurable org-level output growth. Coordination absorbs the gain.", color: "text-orange-400" },
          { metric: "38%", label: "Revenue capacity gap", sub: "Delivery leads bottlenecked by coordination handle fewer accounts. That latent capacity doesn't exist until coordination is solved.", color: "text-red-400" },
        ].map((c, i) => (
          <FadeUp key={i} delay={i * 0.08}>
            <div className="p-4 md:p-6 rounded-2xl border border-neutral-800 bg-neutral-950 h-full flex flex-col">
              <div className={`text-2xl md:text-3xl lg:text-4xl font-bold mb-2 ${c.color}`}>{c.metric}</div>
              <p className="text-xs md:text-sm font-semibold text-white mb-1.5">{c.label}</p>
              <p className="text-xs text-neutral-600 leading-relaxed mt-auto hidden md:block">{c.sub}</p>
            </div>
          </FadeUp>
        ))}
      </div>
      <FadeUp delay={0.35}>
        <div className="p-4 md:p-5 rounded-xl border border-amber-900/30 bg-amber-950/10">
          <p className="text-sm text-neutral-400 leading-relaxed">
            AI makes individual workers faster. But AI can&apos;t close decisions, follow through on commitments, or route the right question to the right person at scale.{" "}
            <span className="text-white font-medium">That&apos;s the gap. Senior people absorb it. Growth stalls.</span>
          </p>
        </div>
        <Source>McKinsey &quot;The State of AI in 2025&quot; - BLS Occupational Employment and Wage Statistics, 2025 - The Focus Company Research Programme, 2026</Source>
      </FadeUp>
    </S>
  );
}

/* ══ SLIDE 3 - WHAT OPENPING DOES ══ */
function WhatWeDo() {
  const steps = [
    { n: "01", title: "Signal Detection", detail: "Every message, file, document, and connected data source scanned for coordination signals.", icon: "\u{1F4E1}", color: "border-indigo-800/50 bg-indigo-950/20" },
    { n: "02", title: "Decision Extraction", detail: "Commitments, blockers, decisions classified with actor, timestamp, and confidence.", icon: "\u2699", color: "border-violet-800/50 bg-violet-950/20" },
    { n: "03", title: "Gap Detection", detail: "Missing context identified. One precise question routed to exactly the right person.", icon: "\u{1F50D}", color: "border-purple-800/50 bg-purple-950/20" },
    { n: "04", title: "Judgment Surface", detail: "Delivery leads see only what needs human judgment. Everything else is handled.", icon: "\u{1F3AF}", color: "border-emerald-800/50 bg-emerald-950/20" },
    { n: "05", title: "Follow-Through", detail: "Commitments tracked. Slips surfaced before the client notices. Outcomes logged.", icon: "\u2705", color: "border-emerald-700/50 bg-emerald-900/10" },
  ];
  return (
    <S id="s3" idx={3} wide stretch>
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[20%] right-[-10%] w-[700px] h-[700px] bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05),transparent_60%)]" />
      </div>
      <FadeUp className="mb-5">
        <Tag color="emerald">What OpenPing Does</Tag>
        <h2 className="mt-4 text-[2rem] md:text-[2.8rem] lg:text-[3.2rem] font-semibold tracking-tight leading-[1.02] text-white">
          Reads all communication and data.<br />Extracts what matters.<br /><span className="text-emerald-400">Closes the loop.</span>
        </h2>
      </FadeUp>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {[
          { head: "Works with existing tools - best in ours", body: "Connects to Slack, Teams, email. Full coordination intelligence activates in OpenPing's native workspace. Value from day one." },
          { head: "Every ask reaches the right person", body: "Delivery leads make decisions. The system handles routing, context retrieval, and follow-through automatically." },
          { head: "Messages, files, and connected data", body: "Not just chat. OpenPing reads documents, ticket systems, and data sources to build a complete coordination picture." },
        ].map((c, i) => (
          <FadeUp key={i} delay={0.05 + i * 0.06}>
            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950 h-full">
              <p className="text-sm font-semibold text-white mb-1.5">{c.head}</p>
              <p className="text-xs text-neutral-600 leading-relaxed">{c.body}</p>
            </div>
          </FadeUp>
        ))}
      </div>
      <div className="hidden lg:grid grid-cols-5 gap-0 relative">
        <div className="absolute top-[48px] left-[10%] right-[10%] h-px bg-gradient-to-r from-indigo-600/30 via-violet-600/30 to-emerald-600/30 z-0" />
        {steps.map((step, i) => (
          <FadeUp key={i} delay={i * 0.07}>
            <div className={`relative z-10 flex flex-col items-center text-center p-3 rounded-xl border ${step.color} mx-1 h-full`}>
              <div className="w-10 h-10 rounded-full border border-neutral-800 bg-neutral-950 flex items-center justify-center text-lg mb-2">{step.icon}</div>
              <span className="text-[10px] text-neutral-700 font-mono mb-1">{step.n}</span>
              <p className="text-xs font-semibold text-white mb-1.5 leading-snug">{step.title}</p>
              <p className="text-[11px] text-neutral-500 leading-relaxed">{step.detail}</p>
            </div>
          </FadeUp>
        ))}
      </div>
      <div className="lg:hidden space-y-2">
        {steps.map((step, i) => (
          <FadeUp key={i} delay={i * 0.05}>
            <div className={`flex items-start gap-3 p-3 rounded-xl border ${step.color}`}>
              <div className="w-9 h-9 shrink-0 rounded-full border border-neutral-800 bg-neutral-950 flex items-center justify-center">{step.icon}</div>
              <div>
                <p className="text-sm font-semibold text-white mb-0.5">{step.n} {step.title}</p>
                <p className="text-xs text-neutral-500 leading-relaxed">{step.detail}</p>
              </div>
            </div>
          </FadeUp>
        ))}
      </div>
    </S>
  );
}

/* ══ SLIDE 4 - DATA MOAT (now before PropTech) ══ */
function DataMoat() {
  return (
    <S id="s4" idx={4} wide>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-end">
        <FadeUp>
          <Tag color="violet">Why It Is Hard To Copy</Tag>
          <h2 className="mt-4 text-[2rem] md:text-[2.8rem] lg:text-[3.2rem] font-semibold tracking-tight leading-[1.02] text-white mb-4">
            Every tool reads finished work.<br /><span className="text-violet-400">OpenPing reads work as it forms.</span>
          </h2>
          <p className="text-neutral-500 text-sm leading-relaxed mb-5">
            Coordination data exists only inside a deployment. It cannot be scraped, licensed, or transferred. A competitor must start from zero - every time, for every client.
          </p>
          <div className="space-y-3">
            {[
              { n: "1", title: "The data is structurally inaccessible", body: "Org communication data exists only inside the deployment. It cannot be scraped, licensed, or acquired. A competitor needs months of their own deployment to generate equivalent signal.", accent: "border-violet-800/40" },
              { n: "2", title: "Each model is per-organization", body: "The classifier is fine-tuned on each org's own decision traces. Client A's model is useless for Client B. A replacement starts from zero - even with a technically superior base model.", accent: "border-indigo-800/40" },
              { n: "3", title: "Cold start takes 6-18 months to close", body: "Signal recall goes from ~60% at month 1 to ~90%+ by month 12. That precision gap belongs to the deployed instance. A new entrant cannot skip the accumulation phase.", accent: "border-emerald-800/40" },
              { n: "4", title: "Integrations lock in signal surface", body: "Every connected channel - Slack, Teams, email, project tools - adds unique signal. A replacement means reconnecting all channels and losing the entire historical graph.", accent: "border-neutral-700/60" },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 12 }} whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: i * 0.08 }} viewport={{ once: false, amount: 0.4 }}
                className={`flex gap-3 p-4 rounded-xl border ${item.accent} bg-neutral-950`}>
                <span className="w-6 h-6 rounded-full border border-violet-800 bg-violet-950/40 flex items-center justify-center text-[11px] text-violet-400 font-bold shrink-0 mt-0.5">{item.n}</span>
                <div>
                  <p className="text-sm font-semibold text-white mb-0.5">{item.title}</p>
                  <p className="text-xs text-neutral-500 leading-relaxed">{item.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </FadeUp>
        <FadeUp delay={0.15}>
          <p className="text-xs text-neutral-600 uppercase tracking-widest font-medium mb-3">The data flywheel</p>
          <div className="rounded-2xl overflow-hidden">
            <img src="/flywheel.svg" alt="Data flywheel - 4 stages: Capture, Extract, Learn, Deepen" className="w-full h-auto" />
          </div>
          <p className="text-xs text-neutral-700 mt-3 text-center italic">Month 1: ~60% signal recall - Month 12: ~90%+ - org-specific, non-transferable</p>
          <Source>LegalOS benchmark: 12,000 visa petitions, 100% approval rate. Their moat is labeled domain data, not the LLM. OpenPing&apos;s is coordination trace data. (YC W26, 2026)</Source>
        </FadeUp>
      </div>
    </S>
  );
}

/* ══ SLIDE 5 - PROPRIETARY TECHNOLOGY ══ */
function PropTech() {
  const engines = [
    { title: "Temporal Decision Graph", badge: "CORE INFRA", badgeColor: "text-violet-400", accent: "border-violet-700/50 bg-violet-950/10",
      points: ["Directed temporal hypergraph of decision units", "Causal, dependency, precedence edges over time", "Replay, attribution, counterfactual simulation built-in"] },
    { title: "Decision Control System", badge: "CONTROL PLANE", badgeColor: "text-indigo-400", accent: "border-indigo-700/50 bg-indigo-950/10",
      points: ["Four primitives: Reply, Rewind, Improve, Train", "Patch any decision, re-evaluate downstream effects", "Outcomes feed labeled classifier training data"] },
    { title: "On-the-Fly Embedding Pipeline", badge: "ML INFRA", badgeColor: "text-sky-400", accent: "border-sky-700/50 bg-sky-950/10",
      points: ["All inputs embedded continuously, under 80ms p95", "Hybrid dense/sparse retrieval, per-org namespace", "Streaming incremental - no batch reprocessing needed"] },
    { title: "Open Data Model", badge: "PORTABILITY", badgeColor: "text-emerald-400", accent: "border-emerald-700/50 bg-emerald-950/10",
      points: ["Open schema, no storage-layer lock-in", "Full export, external query, third-party integration", "Air-gapped enterprise, zero cloud dependency"] },
    { title: "Offline Inference - ppmlx", badge: "ON-DEVICE", badgeColor: "text-amber-400", accent: "border-amber-700/50 bg-amber-950/10",
      points: ["ppmlx: TurboQuant compression, speculative decoding", "On-device inference for air-gapped environments", "CRDT sync, works with intermittent connectivity"] },
    { title: "Pre-Formalization Signal Layer", badge: "DATA MOAT", badgeColor: "text-rose-400", accent: "border-rose-700/50 bg-rose-950/10",
      points: ["Captures signals before any formalization occurs", "Distinguishes commitment, intent, blocker, complaint", "12,000+ labeled traces - cold start not replicable"] },
  ];
  return (
    <S id="s5" idx={5} wide stretch>
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute bottom-[-10%] left-[10%] w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.06),transparent_60%)]" />
      </div>
      <FadeUp className="mb-6">
        <Tag color="violet">Proprietary Technology</Tag>
        <h2 className="mt-4 text-[2rem] md:text-[2.8rem] lg:text-[3.2rem] font-semibold tracking-tight leading-[1.02] text-white">
          Built on research others<br /><span className="text-violet-400">haven&apos;t published yet.</span>
        </h2>
      </FadeUp>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {engines.map((e, i) => (
          <FadeUp key={i} delay={i * 0.05}>
            <div className={`rounded-2xl border p-4 md:p-5 h-full ${e.accent}`}>
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-sm font-semibold text-white pr-2">{e.title}</h3>
                <span className={`text-[9px] font-bold tracking-widest border border-current rounded-full px-2 py-0.5 shrink-0 opacity-60 ${e.badgeColor}`}>{e.badge}</span>
              </div>
              <ul className="space-y-1.5">
                {e.points.map((p, j) => (
                  <li key={j} className="text-xs text-neutral-500 flex gap-2 leading-relaxed">
                    <span className="text-neutral-700 shrink-0 mt-0.5">-</span>{p}
                  </li>
                ))}
              </ul>
            </div>
          </FadeUp>
        ))}
      </div>
      <FadeUp delay={0.35}>
        <Source>The Focus Company - Organizational Cognition Research Programme, 2025-2026</Source>
      </FadeUp>
    </S>
  );
}

/* ══ SLIDE 6 - VS SLACK + AI (left text / right table) ══ */
function VsStatusQuo() {
  const dims = [
    { dim: "Core unit", slack: "Message", ping: "Decision" },
    { dim: "AI role", slack: "Feature (reactive)", ping: "Structural layer (proactive)" },
    { dim: "Data model", slack: "Messages / threads", ping: "Decisions / commitments" },
    { dim: "Follow-through", slack: "Manual - falls on PM", ping: "Orchestrated automatically" },
    { dim: "Context on handoff", slack: "Lost after every handoff", ping: "Captured at source" },
    { dim: "Success metric", slack: "Messages sent", ping: "Decisions resolved" },
    { dim: "Switching cost", slack: "High - data export restricted, no portability", ping: "Low - all data belongs to you, free or paid" },
  ];
  return (
    <S id="s6" idx={6} wide stretch>
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.04),transparent_60%)]" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-end flex-1">
        <FadeUp>
          <Tag color="amber">Why Not Slack + AI?</Tag>
          <h2 className="mt-4 text-[2rem] md:text-[2.8rem] lg:text-[3.2rem] font-semibold tracking-tight leading-[1.02] text-white mb-4">
            Slack helps teams communicate.<br />OpenPing helps them<br /><span className="text-amber-400">coordinate outcomes.</span>
          </h2>
          <div className="p-4 md:p-5 rounded-xl border border-neutral-800 bg-neutral-950">
            <p className="text-sm text-neutral-300 leading-relaxed">
              Task managers own tasks. Document tools own documents. Chat tools own messages.{" "}
              <span className="text-white font-medium">No product owns the decision and follow-through layer between them.</span>{" "}
              That gap is the control plane OpenPing occupies.
            </p>
            <Source>Block &quot;From Hierarchy to Intelligence&quot; (Dorsey &amp; Botha, 2025) - Sequoia &quot;Services: The New Software&quot; (2026)</Source>
          </div>
        </FadeUp>
        <FadeUp delay={0.12}>
          <div className="overflow-x-auto rounded-2xl border border-neutral-800">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="text-left p-3 text-neutral-700 font-medium uppercase tracking-widest text-[10px]">Dimension</th>
                  <th className="text-left p-3 text-neutral-600 font-medium">Slack + AI</th>
                  <th className="text-left p-3 text-emerald-600 font-medium">OpenPing</th>
                </tr>
              </thead>
              <tbody>
                {dims.map((row, i) => (
                  <tr key={i} className="border-b border-neutral-900 last:border-b-0">
                    <td className="p-3 text-neutral-600 text-[10px] uppercase tracking-wide font-medium">{row.dim}</td>
                    <td className="p-3 text-neutral-500">{row.slack}</td>
                    <td className="p-3 text-emerald-400 font-medium">{row.ping}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeUp>
      </div>
    </S>
  );
}

/* ══ SLIDE 7 - ROI MATH (redo) ══ */
function RoiMath() {
  return (
    <S id="s7" idx={7} wide>
      <FadeUp className="mb-6">
        <Tag color="emerald">ROI Math</Tag>
        <h2 className="mt-4 text-[2rem] md:text-[2.8rem] lg:text-[3.2rem] font-semibold tracking-tight leading-[1.02] text-white">
          Not competing with a SaaS seat fee.<br /><span className="text-emerald-400">Competing with a headcount line.</span>
        </h2>
        <p className="mt-3 text-neutral-500 text-sm max-w-2xl leading-relaxed">
          Service firms don&apos;t budget $100k for software. They budget $100k for an ops lead. OpenPing delivers that function - plus unlocks revenue capacity the ops lead was constraining.
        </p>
      </FadeUp>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_60px_1fr] gap-5 md:gap-0 items-center">
        {/* Left: The CFO's view */}
        <FadeUp delay={0.1}>
          <p className="text-xs text-neutral-600 uppercase tracking-widest font-medium mb-3">The buyer&apos;s alternative</p>
          <div className="space-y-3">
            <div className="p-4 md:p-5 rounded-2xl border border-neutral-700/60 bg-neutral-950">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-xs text-neutral-600 uppercase tracking-widest mb-1">Option A</p>
                  <p className="text-base font-semibold text-neutral-400">Hire ops coordinator</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-neutral-500">$180k</p>
                  <p className="text-xs text-neutral-700">/year</p>
                </div>
              </div>
              <ul className="space-y-1">
                {["Employer tax + benefits + management overhead","Doesn't scale - needs another hire at 100 people","6-week ramp, knowledge leaves when they leave"].map((t, i) => (
                  <li key={i} className="text-xs text-neutral-700 flex gap-2"><span className="text-neutral-800 shrink-0">-</span>{t}</li>
                ))}
              </ul>
            </div>
            <div className="relative p-4 md:p-5 rounded-2xl border border-emerald-800/40 bg-emerald-950/10">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-xs text-emerald-700 uppercase tracking-widest mb-1">Option B</p>
                  <p className="text-base font-semibold text-white">OpenPing</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-400">$100k</p>
                  <p className="text-xs text-emerald-900">starts at $24k</p>
                </div>
              </div>
              <ul className="space-y-1">
                {["Handles coordination function from day one","Scales with team - no additional headcount","Org knowledge stays; improves with every decision"].map((t, i) => (
                  <li key={i} className="text-xs text-emerald-700/80 flex gap-2"><span className="text-emerald-800 shrink-0">+</span>{t}</li>
                ))}
              </ul>
              {/* Mobile Arrow down */}
              <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 lg:hidden text-emerald-800">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
              </div>
            </div>
            <p className="text-xs text-neutral-600 text-center pt-1">Same function. 45% lower cost. No management overhead. Scales.</p>
          </div>
        </FadeUp>
        
        {/* Desktop Arrow right */}
        <FadeUp delay={0.14} className="hidden lg:flex items-center justify-center translate-y-8 z-10 w-full">
          <svg width="40" height="24" viewBox="0 0 40 24" fill="none" className="text-emerald-800/60 drop-shadow-lg mx-auto overflow-visible">
            <path d="M0 12 L36 12" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
            <path d="M28 4 L38 12 L28 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </FadeUp>

        {/* Right: Value components */}
        <FadeUp delay={0.18}>
          <p className="text-xs text-neutral-600 uppercase tracking-widest font-medium mb-3 lg:pl-3">Value generated (pilot data)</p>
          <div className="space-y-2 md:space-y-3 lg:pl-3">
            {[
              { label: "Coordination overhead eliminated", value: "$120k", sub: "2.5 hrs/day per delivery lead at $80k loaded cost", color: "text-emerald-400", bar: 43 },
              { label: "Revenue capacity unlocked", value: "$120k", sub: "Delivery leads handle 2x more accounts without extra hires", color: "text-emerald-400", bar: 43 },
              { label: "New hire ramp savings", value: "$40k", sub: "2.6 weeks vs 6 weeks - senior time freed for delivery", color: "text-emerald-300", bar: 14 },
            ].map((row, i) => (
              <div key={i} className="p-3 md:p-4 rounded-xl border border-neutral-800 bg-neutral-950">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs md:text-sm font-medium text-white">{row.label}</p>
                  <span className={`text-base md:text-lg font-bold shrink-0 ml-3 ${row.color}`}>{row.value}</span>
                </div>
                <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden mb-1.5">
                  <motion.div initial={{ width: 0 }} whileInView={{ width: `${row.bar}%` }}
                    transition={{ duration: 0.8, delay: 0.2 + i * 0.06, ease: "easeOut" }} viewport={{ once: false, amount: 0.5 }}
                    className="h-full rounded-full bg-emerald-500 opacity-60" />
                </div>
                <p className="text-[11px] text-neutral-700 hidden md:block">{row.sub}</p>
              </div>
            ))}
            <div className="p-3 md:p-4 rounded-xl border border-emerald-700/40 bg-emerald-950/20 flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              <div>
                <p className="text-xs text-neutral-500">Total value generated</p>
                <p className="text-xs text-emerald-900 mt-0.5">vs. $100k investment</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-300 drop-shadow-md">$280k</p>
                <p className="text-xs text-emerald-700">2.8x ROI - year one</p>
              </div>
            </div>
          </div>
          <Source>The Focus Company pilot benchmarks - pre/post, 90-day windows, n=3 deployments, 2026</Source>
        </FadeUp>
      </div>
    </S>
  );
}

/* ══ SLIDE 8 - PRICING ══ */
function Pricing() {
  return (
    <S id="s8" idx={8} wide stretch>
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 right-0 w-[600px] h-[800px] bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.05),transparent_60%)]" />
      </div>
      <FadeUp className="mb-6">
        <Tag color="sky">Pricing &amp; Business Model</Tag>
        <h2 className="mt-4 text-[2rem] md:text-[2.8rem] lg:text-[3.2rem] font-semibold tracking-tight leading-[1.02] text-white">
          Open-core model.<br /><span className="text-sky-400">Like PostHog or Linear.</span>
        </h2>
        <p className="mt-3 text-neutral-500 text-sm max-w-2xl leading-relaxed">
          Self-hosted communication interface (open source). Proprietary coordination control suite (paid). Built for inference-heavy workloads with improving unit economics at scale.
        </p>
      </FadeUp>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-5">
        {[
          { tier: "Free", price: "$0", period: "forever", cta: "Self-hosted",
            icon: <svg className="w-6 h-6 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>,
            features: ["Open-source workspace interface","Unlimited users","Open data model - own all data","Basic coordination signals","Community support"],
            accent: "border-neutral-700", highlight: false },
          { tier: "SME", price: "from $2k", period: "/month", cta: "Hosted",
            icon: <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,
            features: ["Full coordination control suite","Decision graph + follow-through","On-the-fly embedding pipeline","Basic quotas - scales with usage","Dedicated onboarding"],
            accent: "border-indigo-700/60", highlight: true },
          { tier: "Enterprise", price: "Custom", period: "via form", cta: "On-prem / Air-gapped",
            icon: <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>,
            features: ["ppmlx offline inference (on-device)","Custom classifier fine-tuning","Unlimited workspaces + users","Org graph export + full API","SLA + dedicated success"],
            accent: "border-emerald-700/60", highlight: false },
        ].map((t, i) => (
          <FadeUp key={i} delay={i * 0.08}>
            <div className={`rounded-2xl border p-5 md:p-6 h-full flex flex-col ${t.accent} ${t.highlight ? "bg-indigo-950/15 ring-1 ring-indigo-600/20" : "bg-neutral-950"}`}>
              <div className="mb-4">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[10px] text-neutral-600 uppercase tracking-widest font-medium mb-1">{t.tier} - {t.cta}</p>
                  <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 shrink-0">{t.icon}</div>
                </div>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-2xl md:text-3xl font-bold text-white">{t.price}</span>
                  <span className="text-sm text-neutral-600">{t.period}</span>
                </div>
              </div>
              <ul className="space-y-1.5 flex-1 mt-2">
                {t.features.map((f, j) => (
                  <li key={j} className="text-xs text-neutral-500 flex gap-2 items-start"><span className="text-emerald-600 shrink-0 mt-0.5">+</span><span className="leading-snug">{f}</span></li>
                ))}
              </ul>
            </div>
          </FadeUp>
        ))}
      </div>
      <FadeUp delay={0.28}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950">
            <p className="text-sm font-semibold text-white mb-1.5">Early stage: service-like margins - fast path to software margins</p>
            <p className="text-xs text-neutral-500 leading-relaxed">Initial deployments involve significant onboarding and integration work. As deployments standardize, the ppmlx engine reduces inference cost 4-6x vs API-based approaches. Target gross margin: 70%+ at scale.</p>
          </div>
          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950">
            <p className="text-sm font-semibold text-white mb-1.5">Priced against headcount, not software budgets</p>
            <p className="text-xs text-neutral-500 leading-relaxed">The buyer compares $24k-$100k/yr against 1-3 coordination hires ($180k-$540k/yr). The CFO approves this. Not IT procurement. ppmlx is open-source for offline inference; proprietary models may be added in future tiers.</p>
          </div>
        </div>
      </FadeUp>
    </S>
  );
}

/* ══ SLIDE 9 - MARKET ══ */
function Market() {
  return (
    <S id="s9" idx={9} wide stretch>
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute bottom-0 left-[20%] w-[700px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.04),transparent_60%)]" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-end flex-1">
        <FadeUp>
          <Tag color="amber">Market</Tag>
          <h2 className="mt-4 text-[2rem] md:text-[2.8rem] lg:text-[3.2rem] font-semibold tracking-tight leading-[1.02] text-white mb-4">
            <span className="text-amber-400 drop-shadow-md">$6 of services</span><br />per every <span className="text-emerald-400 drop-shadow-md">$1 of software.</span>
          </h2>
          <p className="text-neutral-500 text-sm leading-relaxed mb-6">
            OpenPing doesn&apos;t compete for the software budget. It competes for the headcount budget that exists solely to coordinate delivery. That budget is 10x larger - and has no incumbent.
          </p>
          <div className="space-y-3">
            {[
              { label: "ICP", bullets: ["Founder, COO, Head of Delivery","50-300 person headcount","Multiple clients sharing experts simultaneously"] },
              { label: "Beachhead", bullets: ["~50,000 US agencies & consultancies","Software houses in 50-300 range"] },
              { label: "ACV", bullets: ["$24k-$150k starting range","Priced against coordination headcount","Not fighting for software seat budgets"] },
              { label: "Verticals", bullets: ["Digital agencies & Consultancies","Software houses & Implementation partners","Managed services"] },
            ].map((r, i) => (
              <div key={i} className="flex gap-4 py-3 border-b border-neutral-900/50 last:border-b-0">
                <span className="text-[10px] text-amber-500/80 uppercase tracking-widest font-bold w-16 shrink-0 pt-0.5">{r.label}</span>
                <ul className="space-y-1">
                  {r.bullets.map((b, j) => (
                    <li key={j} className="text-xs text-neutral-400 flex items-start gap-2">
                      <span className="text-amber-800 shrink-0 mt-[3px]">•</span>
                      <span className="leading-snug">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <Source>US Census Bureau - Business Formation Statistics 2024 - Sequoia &quot;Services: The New Software&quot; (Julien Bek, 2026)</Source>
        </FadeUp>
        <FadeUp delay={0.15}>
          <div className="space-y-3 md:space-y-4">
            {[
              { label: "Beachhead - US only", sub: "~50k agencies + consultancies, 50-300 people. $24k ACV floor.", value: "$1.2B", pct: 15, color: "bg-amber-600", textColor: "text-amber-400" },
              { label: "5-Year SAM", sub: "All delivery-heavy professional services (legal, engineering, IT, consulting) globally.", value: "$12-15B", pct: 45, color: "bg-amber-500", textColor: "text-amber-300" },
              { label: "Platform TAM", sub: "Competing with the coordination headcount budget across all professional services.", value: "$100B+", pct: 100, color: "bg-yellow-400", textColor: "text-yellow-300" },
            ].map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }} viewport={{ once: false, amount: 0.4 }}>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-sm font-semibold text-white">{m.label}</span>
                  <span className={`text-base md:text-lg font-bold ${m.textColor}`}>{m.value}</span>
                </div>
                <p className="text-xs text-neutral-600 mb-2 leading-snug">{m.sub}</p>
                <div className="h-5 rounded-full bg-neutral-900 overflow-hidden">
                  <motion.div initial={{ width: 0 }} whileInView={{ width: `${m.pct}%` }}
                    transition={{ duration: 1, delay: 0.2 + i * 0.15, ease: "easeOut" }} viewport={{ once: false, amount: 0.5 }}
                    className={`h-full rounded-full ${m.color} opacity-70`} />
                </div>
              </motion.div>
            ))}
            <div className="mt-4 p-4 rounded-xl border border-neutral-800 bg-neutral-950">
              <p className="text-xs text-neutral-500 leading-relaxed">At <strong className="text-white">1% penetration</strong> of the US beachhead alone, OpenPing reaches <strong className="text-white">$12M ARR</strong>. At 5%: $60M. The market is underpenetrated and the buyer is motivated - the cost of inaction is measurable.</p>
            </div>
          </div>
        </FadeUp>
      </div>
    </S>
  );
}

/* ══ SLIDE 10 - WHY NOW ══ */
function WhyNow() {
  const forces = [
    { n: "01", title: "Agents are capable but not reliable at long-horizon tasks",
      body: "METR 2025: AI agents complete complex tasks successfully in 35-50% of attempts without human coordination checkpoints. The coordination layer can't be automated out yet - but it can be systematized and made dramatically cheaper.",
      ref: "METR Autonomy Evaluation, 2025 - ARC Evaluation, 2025", bar: 82, color: "bg-violet-500" },
    { n: "02", title: "AI tools amplify individuals but not organizations",
      body: "Workers using AI complete tasks 40% faster (McKinsey 2025). But firms don't see proportional revenue growth - coordination overhead absorbs the individual gain. More work per person creates more coordination surface, not less.",
      ref: "McKinsey 'The State of AI in 2025' - Stanford AI Index 2025", bar: 91, color: "bg-rose-500" },
    { n: "03", title: "More AI = more competition = more coordination needed",
      body: "AI-equipped teams run faster experiments, ship more, and generate more parallel decisions. That velocity creates more coordination surface - not less. Firms that can't coordinate at speed will lose to those that can.",
      ref: "Sequoia 'Services: The New Software' (Julien Bek, 2026) - Block 'From Hierarchy to Intelligence' (2025)", bar: 96, color: "bg-amber-500" },
    { n: "04", title: "'Service as software' is the next $1T category",
      body: "The infrastructure layer for AI-delivered professional services is forming now. Sequoia, Block, YC all signal the same thesis. The coordination control plane doesn't exist yet. The window to build it is measured in quarters.",
      ref: "Sequoia 'Services: The New Software' (2026) - YC W26 Demo Day - Block (2025)", bar: 100, color: "bg-emerald-500" },
  ];
  return (
    <S id="s10" idx={10} wide>
      <FadeUp className="mb-6">
        <Tag color="rose">Why Now</Tag>
        <h2 className="mt-4 text-[2rem] md:text-[2.8rem] lg:text-[3.2rem] font-semibold tracking-tight leading-[1.02] text-white">
          Four forces converging.<br /><span className="text-rose-400">None existed 18 months ago.</span>
        </h2>
      </FadeUp>
      <div className="space-y-4 max-w-4xl mx-auto w-full">
        {forces.map((f, i) => (
          <FadeUp key={i} delay={i * 0.08}>
            <div className="grid grid-cols-1 lg:grid-cols-[70px_1fr_100px] gap-4 md:gap-8 p-5 md:p-7 rounded-3xl border border-neutral-800 bg-neutral-950/80 backdrop-blur-sm items-center hover:bg-neutral-900/80 transition-colors">
              <div className="text-4xl md:text-5xl font-light text-neutral-800 tracking-tighter hidden lg:block">{f.n}</div>
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-2 lg:hidden">
                  <span className="text-lg font-bold text-neutral-700">{f.n}</span>
                </div>
                <h3 className="text-lg md:text-xl font-medium text-white mb-2.5 leading-snug">{f.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed mb-2">{f.body}</p>
                <p className="text-[11px] text-neutral-600 italic">{f.ref}</p>
              </div>
              <div className="flex lg:flex-col justify-between lg:justify-center items-center gap-3 lg:gap-1.5 w-full mt-3 lg:mt-0">
                <div className="w-full h-8 lg:h-20 lg:w-20 rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden relative group">
                  <motion.div initial={{ height: 0 }} whileInView={{ height: `${f.bar}%` }}
                    transition={{ duration: 1.2, delay: 0.15, type: "spring", stiffness: 60 }} viewport={{ once: false, amount: 0.5 }}
                    className={`absolute bottom-0 left-0 right-0 ${f.color} opacity-80`} />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-sm font-bold text-white drop-shadow-md z-10">{f.bar}%</span>
                  </div>
                </div>
              </div>
            </div>
          </FadeUp>
        ))}
      </div>
    </S>
  );
}

/* ══ SLIDE 11 - TRACTION ══ */
function Traction() {
  return (
    <S id="s11" idx={11} wide>
      <FadeUp className="mb-6 text-center">
        <Tag color="emerald">Early Traction</Tag>
        <h2 className="mt-4 text-[2rem] md:text-[2.8rem] lg:text-[3.2rem] font-semibold tracking-tight leading-[1.02] text-white">
          Three pilots. The data<br /><span className="text-emerald-400">is already conclusive.</span>
        </h2>
      </FadeUp>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {[
          { to: 3, suffix: "", label: "Active pilots", sub: "Agencies and consultancies", color: "text-white" },
          { to: 300, suffix: "+", label: "Decisions resolved", sub: "Each in under 5 min vs. reported 30-40 min baseline", color: "text-emerald-400" },
          { to: 77, suffix: "%", label: "Faster resolution", sub: "Client or cross-team dependency resolution time, pre vs. post", color: "text-emerald-300" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.93 }} whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: i * 0.08 }} viewport={{ once: false, amount: 0.5 }}
            className="py-8 md:py-10 px-5 rounded-2xl border border-neutral-800 bg-neutral-950 text-center">
            <div className={`text-4xl md:text-5xl font-bold mb-2 ${s.color}`}><CountUp to={s.to} suffix={s.suffix} /></div>
            <div className="text-sm font-medium text-neutral-300 mb-1">{s.label}</div>
            <div className="text-xs text-neutral-600">{s.sub}</div>
          </motion.div>
        ))}
      </div>
      <FadeUp delay={0.25}>
        <Source>The Focus Company pilot benchmarks - pre/post measurement, 90-day windows, 2026</Source>
      </FadeUp>
    </S>
  );
}

/* ══ SLIDE 12 - CONTACT ══ */
function Contact() {
  return (
    <S id="s12" idx={12}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03),transparent)]" />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, type: "spring", stiffness: 50 }} viewport={{ once: false, amount: 0.4 }} className="w-full max-w-3xl flex flex-col items-center justify-center min-h-[50vh]">
        
        <FadeUp delay={0.1}>
          <h2 className="text-[2.2rem] md:text-[3rem] lg:text-[4rem] font-semibold text-white tracking-tight leading-[1.05] text-center mb-6">
            A new infrastructure<br />layer is forming.<br />
            <span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">OpenPing is the foundation.</span>
          </h2>
        </FadeUp>
        
        <FadeUp delay={0.2}>
          <p className="text-base md:text-lg text-neutral-500 text-center leading-relaxed mb-12">
            The firm that controls coordination data for professional services will be infrastructure for how expert work gets delivered at scale. That position is being established with every deployment.
          </p>
        </FadeUp>

        <FadeUp delay={0.3} className="w-full flex justify-center mb-16">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <a href="mailto:hi@openping.app"
              className="px-8 py-4 rounded-full bg-white text-black text-sm font-semibold hover:bg-neutral-200 transition-colors w-full sm:w-auto text-center shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              hi@openping.app
            </a>
            <a href="https://openping.app" target="_blank" rel="noopener noreferrer"
              className="px-8 py-4 rounded-full border border-neutral-700 bg-neutral-900/50 text-neutral-300 text-sm font-medium hover:border-neutral-500 hover:text-white transition-colors w-full sm:w-auto text-center flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
              openping.app
            </a>
          </div>
        </FadeUp>

        <FadeUp delay={0.4}>
          <div className="flex flex-col items-center gap-6 text-center">
            {[
              { label: "Founded", value: "2026" },
              { label: "Parent company", value: "The Focus Company" },
              { label: "Stage", value: "Pre-seed - Active pilots" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center justify-center">
                <div className="text-[10px] text-neutral-600 uppercase tracking-widest font-medium mb-1.5">{item.label}</div>
                <div className="text-base text-neutral-300 font-medium">{item.value}</div>
              </div>
            ))}
          </div>
        </FadeUp>
      </motion.div>
    </S>
  );
}

/* ══ ROOT ══ */
export default function PitchDeck() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const container = document.getElementById("deck");
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => { for (const e of entries) { if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.idx ?? 0)); } },
      { root: container, threshold: 0.5 }
    );
    container.querySelectorAll("[data-idx]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return (
    <>
      <div className="fixed inset-0 bg-black pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,rgba(99,102,241,0.07),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_30%_at_50%_100%,rgba(16,185,129,0.04),transparent)]" />
      </div>
      <Nav idx={active} />
      <main id="deck" className="relative h-[100dvh] w-full overflow-y-scroll snap-y snap-mandatory bg-transparent text-white antialiased" style={{ scrollbarWidth: "none" }}>
        <Cover />
        <CoordTax />
        <WhatItCosts />
        <WhatWeDo />
        <DataMoat />
        <PropTech />
        <VsStatusQuo />
        <RoiMath />
        <Pricing />
        <Market />
        <WhyNow />
        <Traction />
        <Contact />
      </main>
    </>
  );
}
