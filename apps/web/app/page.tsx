"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { api } from "@convex/_generated/api";
import { navigateToWorkspace } from "@/lib/workspace-url";
import {
  Inbox,
  BotMessageSquare,
  Bell,
  MessagesSquare,
  ArrowRight,
  Zap,
  Loader2,
} from "lucide-react";

function WorkspaceRedirect() {
  const workspaces = useQuery(api.workspaceMembers.listMyWorkspaces);
  const redirected = useRef(false);

  useEffect(() => {
    if (redirected.current) return;
    if (workspaces === undefined || workspaces === null) return;
    if (workspaces.length === 1) {
      redirected.current = true;
      navigateToWorkspace(workspaces[0].slug);
    }
  }, [workspaces]);

  // Loading or waiting for webhook
  if (workspaces === undefined || workspaces === null) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-white/20" />
        <p className="text-sm text-muted-foreground">
          {workspaces === null ? "Setting up your workspace…" : "Loading…"}
        </p>
      </div>
    );
  }

  // Single workspace — auto-redirect (spinner while navigating)
  if (workspaces.length === 1) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-white/20" />
      </div>
    );
  }

  // Multiple workspaces — show picker
  const lastSlug = typeof window !== "undefined" ? localStorage.getItem("lastWorkspace") : null;
  const sorted = lastSlug
    ? [...workspaces].sort((a, b) => (a.slug === lastSlug ? -1 : b.slug === lastSlug ? 1 : 0))
    : workspaces;

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 px-4">
      <div className="text-center">
        <h1 className="text-lg font-semibold text-foreground">Your Workspaces</h1>
        <p className="mt-1 text-xs text-muted-foreground">Choose a workspace to continue</p>
      </div>
      <div className="grid w-full max-w-sm gap-2">
        {sorted.map((ws) => (
          <button
            key={ws.workspaceId}
            onClick={() => {
              localStorage.setItem("lastWorkspace", ws.slug);
              navigateToWorkspace(ws.slug);
            }}
            className="flex items-center gap-3 rounded border border-subtle bg-surface-1 px-4 py-3 text-left transition-colors hover:bg-surface-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded bg-ping-purple text-xs font-bold text-white">
              {ws.name[0]?.toUpperCase() ?? "W"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{ws.name}</p>
              <p className="text-2xs text-muted-foreground">{ws.slug}</p>
            </div>
            <span className="rounded border border-white/15 bg-white/5 px-1.5 py-px text-2xs text-white/60">
              {ws.role}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

const features = [
  {
    icon: Inbox,
    title: "Eisenhower Matrix Inbox",
    description:
      "AI automatically triages every message into four quadrants — urgent & important, important, urgent, and FYI — so you always know what to tackle first.",
    color: "text-priority-urgent",
  },
  {
    icon: BotMessageSquare,
    title: "KnowledgeBot",
    description:
      "An AI assistant that searches your workspace knowledge graph. Ask anything and get answers grounded in your team's real conversations and docs.",
    color: "text-ping-purple",
  },
  {
    icon: Bell,
    title: "Proactive Alerts",
    description:
      "AI detects blocked tasks, unanswered questions, and pending PR reviews — then nudges the right people before things fall through the cracks.",
    color: "text-status-warning",
  },
  {
    icon: MessagesSquare,
    title: "Real-time Messaging",
    description:
      "Channels, DMs, typing indicators, and threads. Everything you expect from a modern messenger, built on a real-time sync engine.",
    color: "text-status-info",
  },
];

const stats = [
  { value: "4x", label: "Faster triage" },
  { value: "60%", label: "Fewer missed messages" },
  { value: "0", label: "Context switches to find info" },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-0 text-foreground">
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-surface-0/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-semibold tracking-tight text-white">
            PING
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm text-muted-foreground transition-colors hover:text-white">
              Pricing
            </Link>
            <Link href="/sign-in" className="inline-flex h-8 items-center rounded-md bg-ping-purple px-4 text-sm font-medium text-white transition-colors hover:bg-ping-purple-hover">
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(94,106,210,0.15),transparent_70%)]" />
        <div className="mx-auto max-w-5xl px-6 pb-24 pt-28 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-surface-2 px-3 py-1 text-xs text-muted-foreground">
            <Zap className="h-3 w-3 text-ping-purple" />
            AI-native workspace messaging
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
            Your team&rsquo;s messages,{" "}
            <span className="text-ping-purple">intelligently prioritized</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-md">
            PING replaces noisy group chat with an AI-powered inbox that triages
            conversations, surfaces blockers, and keeps your whole team in
            context — automatically.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/sign-in" className="inline-flex h-10 items-center gap-2 rounded-md bg-ping-purple px-6 text-sm font-medium text-white transition-colors hover:bg-ping-purple-hover">
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="#features" className="inline-flex h-10 items-center rounded-md border border-white/[0.08] bg-surface-1 px-6 text-sm font-medium text-muted-foreground transition-colors hover:border-white/[0.12] hover:text-white">
              Learn more
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-white/[0.06] bg-surface-1">
        <div className="mx-auto grid max-w-5xl grid-cols-1 divide-y divide-white/[0.06] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {stats.map((stat) => (
            <div key={stat.label} className="px-6 py-8 text-center">
              <div className="text-3xl font-bold text-ping-purple">{stat.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-5xl px-6 py-24">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Built for how teams actually work
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Every feature is designed to reduce noise and surface what matters.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {features.map((feature) => (
            <div key={feature.title} className="group rounded-xl border border-white/[0.06] bg-surface-1 p-6 transition-colors hover:border-white/[0.1]">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2">
                <feature.icon className={`h-5 w-5 ${feature.color}`} />
              </div>
              <h3 className="text-md font-medium text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-white/[0.06] bg-surface-1">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <h2 className="mb-12 text-center text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            How PING works
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { step: "1", title: "Your team chats", body: "Channels and DMs work just like you expect. Real-time, searchable, threaded." },
              { step: "2", title: "AI triages everything", body: "Every message is scored and sorted into your personal Eisenhower inbox." },
              { step: "3", title: "Nothing slips through", body: "Proactive alerts surface blockers, stale PRs, and unanswered questions." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-ping-purple/10 text-sm font-semibold text-ping-purple">{item.step}</div>
                <h3 className="text-md font-medium text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-24 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Ready to take back your focus?
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Join teams that spend less time triaging and more time building.
        </p>
        <Link href="/sign-in" className="mt-8 inline-flex h-10 items-center gap-2 rounded-md bg-ping-purple px-6 text-sm font-medium text-white transition-colors hover:bg-ping-purple-hover">
          Get started for free
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <footer className="border-t border-white/[0.06] bg-surface-1">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
          <span className="text-xs text-muted-foreground">&copy; 2026 Ping. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/pricing" className="text-xs text-muted-foreground hover:text-white">Pricing</Link>
            <Link href="/sign-in" className="text-xs text-muted-foreground hover:text-white">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <AuthLoading>
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ping-purple border-t-transparent" />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <LandingPage />
      </Unauthenticated>
      <Authenticated>
        <WorkspaceRedirect />
      </Authenticated>
    </>
  );
}
