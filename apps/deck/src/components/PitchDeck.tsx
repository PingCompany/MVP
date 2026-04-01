import { motion, useInView } from "framer-motion";
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

function S({ id, idx, children, wide = false }: { id: string; idx: number; children: React.ReactNode; wide?: boolean }) {
  return (
    <section id={id} data-idx={idx} className="snap-start snap-always min-h-[100dvh] flex flex-col justify-center items-center px-4 md:px-8 py-8 md:py-10 relative">
      <div className={`w-full ${wide ? "max-w-7xl" : "max-w-5xl"}`}>{children}</div>
    </section>
  );
}

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }} viewport={{ once: false, amount: 0.25 }} className={className}>
      {children}
    </motion.div>
  );
}

function Cover() {
  return (
    <S id="s0" idx={0}>
      <div className="relative text-center">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
          <div className="w-[500px] h-[500px] rounded-full border border-neutral-900 opacity-60" />
          <div className="absolute w-[330px] h-[330px] rounded-full border border-neutral-900 opacity-80" />
          <div className="absolute w-[160px] h-[160px] rounded-full border border-neutral-900" />
        </div>
        <FadeUp>
          <div className="mb-5 flex justify-center">
            <img src="/bw_logotype_onbalck_padding.png" alt="PING" className="h-8 md:h-10" />
          </div>
        </FadeUp>
        <FadeUp delay={0.05}>
          <div className="mb-7 inline-flex items-center gap-2 border border-neutral-800 rounded-full px-4 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-neutral-500 tracking-[0.15em] uppercase">Investor Overview - 2026</span>
          </div>
        </FadeUp>
        <FadeUp delay={0.1}>
          <h1 className="text-[2.6rem] md:text-[4.5rem] lg:text-[6.5rem] font-semibold tracking-tight leading-[0.92] mb-5 md:mb-7">
            <span className="text-white">Service firms don&apos;t</span><br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">scale decisions.</span>
          </h1>
        </FadeUp>
        <FadeUp delay={0.2}>
          <p className="text-neutral-400 text-base md:text-xl max-w-xl mx-auto leading-relaxed">
            OpenPing removes coordination overhead so delivery teams can handle more clients, close decisions faster, and grow without adding operations headcount.
          </p>
        </FadeUp>
        <FadeUp delay={0.3}>
          <div className="mt-8 md:mt-10 flex items-center justify-center gap-6 md:gap-8 text-xs text-neutral-700 tracking-widest uppercase">
            <span>thefocus.company</span>
            <span className="w-px h-3 bg-neutral-800" />
            <span>openping.app</span>
          </div>
        </FadeUp>
        <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="mt-10 md:mt-12 flex flex-col items-center gap-1.5 text-neutral-700">
          <span className="text-[10px] tracking-[0.2em] uppercase">scroll</span>
          <div className="w-px h-5 bg-gradient-to-b from-neutral-700 to-transparent" />
        </motion.div>
      </div>
    </S>
  );
}

function CoordTax() {
  const items = [
    { pct: 40, label: "Senior expert time on low-value routing", color: "bg-rose-500" },
    { pct: 28, label: "Status chasing and context reconstruction", color: "bg-orange-500" },
    { pct: 18, label: "Alignment meetings that could be decisions", color: "bg-amber-500" },
    { pct: 14, label: "Actual billable delivery work", color: "bg-emerald-500" },
  ];
  return (
    <S id="s1" idx={1} wide>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
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

function WhatItCosts() {
  return (
    <S id="s2" idx={2} wide>
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

function WhatWeDo() {
  const steps = [
    { n: "01", title: "Signal Detection", detail: "Every message, file, document, and connected data source scanned for coordination signals.", icon: "📡", color: "border-indigo-800/50 bg-indigo-950/20" },
    { n: "02", title: "Decision Extraction", detail: "Commitments, blockers, decisions classified with actor, timestamp, and confidence.", icon: "⚙", color: "border-violet-800/50 bg-violet-950/20" },
    { n: "03", title: "Gap Detection", detail: "Missing context identified. One precise question routed to exactly the right person.", icon: "🔍", color: "border-purple-800/50 bg-purple-950/20" },
    { n: "04", title: "Judgment Surface", detail: "Delivery leads see only what needs human judgment. Everything else is handled.", icon: "🎯", color: "border-emerald-800/50 bg-emerald-950/20" },
    { n: "05", title: "Follow-Through", detail: "Commitments tracked. Slips surfaced before the client notices. Outcomes logged.", icon: "✅", color: "border-emerald-700/50 bg-emerald-900/10" },
  ];
  return (
    <S id="s3" idx={3} wide>
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
    <S id="s5" idx={5} wide>
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
    <S id="s6" idx={6} wide>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-end">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
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
            <div className="p-4 md:p-5 rounded-2xl border border-emerald-800/40 bg-emerald-950/10">
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
            </div>
            <p className="text-xs text-neutral-600 text-center pt-1">Same function. 45% lower cost. No management overhead. Scales.</p>
          </div>
        </FadeUp>
        <FadeUp delay={0.18}>
          <p className="text-xs text-neutral-600 uppercase tracking-widest font-medium mb-3">Value generated (pilot data)</p>
          <div className="space-y-2 md:space-y-3">
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
            <div className="p-3 md:p-4 rounded-xl border border-emerald-700/40 bg-emerald-950/20 flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-500">Total value generated</p>
                <p className="text-xs text-neutral-700 mt-0.5">vs. $100k investment</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-300">$280k</p>
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

function Pricing() {
  return (
    <S id="s8" idx={8} wide>
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
            features: ["Open-source workspace interface","Unlimited users","Open data model - own all data","Basic coordination signals","Community support"],
            accent: "border-neutral-700", highlight: false },
          { tier: "SME", price: "from $2k", period: "/month", cta: "Hosted",
            features: ["Full coordination control suite","Decision graph + follow-through","On-the-fly embedding pipeline","Basic quotas - scales with usage","Dedicated onboarding"],
            accent: "border-indigo-700/60", highlight: true },
          { tier: "Enterprise", price: "Custom", period: "", cta: "On-prem / Air-gapped",
            features: ["ppmlx offline inference (on-device)","Custom classifier fine-tuning","Unlimited workspaces + users","Org graph export + full API","SLA + dedicated success"],
            accent: "border-emerald-700/60", highlight: false },
        ].map((t, i) => (
          <FadeUp key={i} delay={i * 0.08}>
            <div className={`rounded-2xl border p-5 md:p-6 h-full flex flex-col ${t.accent} ${t.highlight ? "bg-indigo-950/15 ring-1 ring-indigo-600/20" : "bg-neutral-950"}`}>
              <div className="mb-4">
                <p className="text-[10px] text-neutral-600 uppercase tracking-widest font-medium mb-1">{t.tier} - {t.cta}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl md:text-3xl font-bold text-white">{t.price}</span>
                  <span className="text-sm text-neutral-600">{t.period}</span>
                </div>
              </div>
              <ul className="space-y-1.5 flex-1">
                {t.features.map((f, j) => (
                  <li key={j} className="text-xs text-neutral-500 flex gap-2"><span className="text-emerald-600 shrink-0">+</span>{f}</li>
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

function Market() {
  return (
    <S id="s9" idx={9} wide>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-end">
        <FadeUp>
          <Tag color="amber">Market</Tag>
          <h2 className="mt-4 text-[2rem] md:text-[2.8rem] lg:text-[3.2rem] font-semibold tracking-tight leading-[1.02] text-white mb-4">
            $6 of services<br />per every $1 of software.
          </h2>
          <p className="text-neutral-500 text-sm leading-relaxed mb-4">
            OpenPing doesn&apos;t compete for the software budget. It competes for the headcount budget that exists solely to coordinate delivery. That budget is 10x larger - and has no incumbent.
          </p>
          <div className="space-y-2">
            {[
              { label: "ICP", val: "Founder, COO, Head of Delivery - 50-300 people - multiple clients sharing experts simultaneously" },
              { label: "Beachhead", val: "~50,000 US agencies, consultancies, and software houses in 50-300 person range" },
              { label: "ACV", val: "$24k-$150k - priced against coordination headcount, not software seat budgets" },
              { label: "Verticals", val: "Digital agencies - Consultancies - Software houses - Implementation partners - Managed services" },
            ].map((r, i) => (
              <div key={i} className="flex gap-3 py-2.5 border-b border-neutral-900 last:border-b-0">
                <span className="text-[10px] text-neutral-700 uppercase tracking-widest font-medium w-16 shrink-0 pt-0.5">{r.label}</span>
                <span className="text-xs text-neutral-400 leading-relaxed">{r.val}</span>
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
      <div className="space-y-3">
        {forces.map((f, i) => (
          <FadeUp key={i} delay={i * 0.08}>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-5 p-4 md:p-5 rounded-2xl border border-neutral-800 bg-neutral-950">
              <div className="md:col-span-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-mono text-neutral-700">{f.n}</span>
                  <h3 className="text-sm font-semibold text-white">{f.title}</h3>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed mb-1.5">{f.body}</p>
                <p className="text-[11px] text-neutral-700 italic">{f.ref}</p>
              </div>
              <div className="md:col-span-1 flex flex-col justify-center items-end md:items-center gap-1">
                <div className="w-full h-5 rounded-lg bg-neutral-900 overflow-hidden">
                  <motion.div initial={{ width: 0 }} whileInView={{ width: `${f.bar}%` }}
                    transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }} viewport={{ once: false, amount: 0.5 }}
                    className={`h-full rounded-lg ${f.color} opacity-60`} />
                </div>
                <p className="text-sm font-bold text-white">{f.bar}%</p>
              </div>
            </div>
          </FadeUp>
        ))}
      </div>
    </S>
  );
}

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

function Contact() {
  return (
    <S id="s12" idx={12}>
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }} viewport={{ once: false, amount: 0.4 }} className="text-center">
        <div className="inline-flex items-center gap-2 text-xs text-neutral-700 tracking-[0.15em] uppercase mb-7">
          <span className="w-8 h-px bg-neutral-800" />The Focus Company - OpenPing<span className="w-8 h-px bg-neutral-800" />
        </div>
        <h2 className="text-[2.2rem] md:text-[3rem] lg:text-[4.5rem] font-semibold text-white tracking-tight leading-[0.92] mb-5">
          The category is being<br />built now. OpenPing<br />
          <span className="text-emerald-400">is the foundation layer.</span>
        </h2>
        <p className="text-base md:text-lg text-neutral-500 max-w-xl mx-auto leading-relaxed mb-10 md:mb-14">
          The firm that controls coordination data for professional services will be infrastructure for how expert work gets delivered at scale. That position is being established with every deployment.
        </p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 mb-10 md:mb-14">
          <a href="mailto:hello@thefocus.company"
            className="px-8 py-4 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-100 transition-colors w-full md:w-auto text-center">
            hello@thefocus.company
          </a>
          <a href="https://openping.app" target="_blank" rel="noopener noreferrer"
            className="px-8 py-4 rounded-full border border-neutral-700 text-neutral-300 text-sm hover:border-neutral-500 hover:text-white transition-colors w-full md:w-auto text-center">
            openping.app
          </a>
        </div>
        <div className="border-t border-neutral-900 pt-7 grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-8 text-left">
          {[
            { label: "Founded", value: "2026" },
            { label: "Parent company", value: "The Focus Company" },
            { label: "Stage", value: "Pre-seed - Active pilots" },
          ].map((item, i) => (
            <div key={i}>
              <div className="text-[10px] text-neutral-700 uppercase tracking-widest mb-1">{item.label}</div>
              <div className="text-sm text-neutral-400">{item.value}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </S>
  );
}

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
      <main id="deck" className="relative h-[100dvh] w-full overflow-y-scroll snap-y snap-mandatory bg-transparent text-white antialiased" style={{ scrollbarWidth: "none" as const }}>
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
