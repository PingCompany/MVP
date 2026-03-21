"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InboxCard, type InboxItem, type Priority } from "@/components/inbox/InboxCard";
import { useToast } from "@/components/ui/toast-provider";
import { CheckCircle2 } from "lucide-react";

function useMockItems() {
  const router = useRouter();
  const { toast } = useToast();

  const items: InboxItem[] = [
    {
      id: "1",
      priority: "urgent",
      channel: "engineering",
      author: "Alex Chen",
      authorInitials: "AC",
      summary: "PR #234 is blocking your deploy pipeline",
      context: "Your PR has 2 failing checks and Alex's release is gated on it. Review window closes in 40 minutes before the merge freeze.",
      timestamp: new Date(Date.now() - 12 * 60 * 1000),
      actions: [
        { label: "Review PR #234", primary: true, onClick: () => { router.push("/channel/engineering"); toast("Opening PR #234..."); } },
        { label: "Ping Alex", onClick: () => toast("Message sent to Alex", "success") },
      ],
    },
    {
      id: "2",
      priority: "urgent",
      channel: "engineering",
      author: "Sarah Kim",
      authorInitials: "SK",
      summary: "Production incident: auth service returning 503s",
      context: "3 customers affected, escalated 8 minutes ago. Runbook linked in #incidents. On-call rotation expects response within 15min SLA.",
      timestamp: new Date(Date.now() - 8 * 60 * 1000),
      actions: [
        { label: "View Incident", primary: true, onClick: () => { router.push("/channel/engineering"); toast("Joining incident channel..."); } },
        { label: "Join #incidents", onClick: () => router.push("/channel/general") },
      ],
    },
    {
      id: "3",
      priority: "important",
      channel: "product",
      author: "KnowledgeBot",
      authorInitials: "KB",
      summary: "Sprint planning summary — 6 items need your decision",
      context: "Q2 sprint has 3 unassigned tickets blocking roadmap sign-off. Decisions needed on auth v2 scope, mobile priority, and API versioning.",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      actions: [
        { label: "Review Sprint", primary: true, onClick: () => toast("Opening sprint board...", "success") },
        { label: "Postpone 1h", onClick: () => toast("Postponed for 1 hour") },
        { label: "Delegate", onClick: () => toast("Delegated to team lead", "success") },
      ],
    },
    {
      id: "4",
      priority: "important",
      channel: "design",
      author: "Maya Rodriguez",
      authorInitials: "MR",
      summary: "Figma handoff ready for mobile onboarding flow",
      context: "All 14 screens exported with specs. Needs engineering estimate for sprint grooming tomorrow 10am. Figma link attached.",
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      actions: [
        { label: "Open Figma", primary: true, onClick: () => toast("Opening Figma...") },
        { label: "Add to Sprint", onClick: () => toast("Added to sprint backlog", "success") },
      ],
    },
    {
      id: "5",
      priority: "delegate",
      channel: "general",
      author: "Tom Walsh",
      authorInitials: "TW",
      summary: "New hire asks: which doc explains our deployment process?",
      context: "Jamie (joined Monday) can't find the runbook for staging deploys. Similar question answered by @sarah last month — linking that thread would resolve.",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      actions: [
        { label: "Share Runbook", primary: true, onClick: () => toast("Runbook link shared with Jamie", "success") },
        { label: "Assign to Sarah", onClick: () => toast("Assigned to Sarah", "success") },
      ],
    },
    {
      id: "6",
      priority: "delegate",
      channel: "product",
      author: "KnowledgeBot",
      authorInitials: "KB",
      summary: "Weekly digest: 3 external API updates may affect integrations",
      context: "GitHub Actions deprecates Node 16 runners Jan 31. Linear updated webhook schema (v2 field renames). Stripe API version pinned — upgrade recommended.",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      actions: [
        { label: "View Changes", primary: true, onClick: () => toast("Opening changelog...") },
      ],
    },
    {
      id: "7",
      priority: "low",
      channel: "general",
      author: "Workspace Agent",
      authorInitials: "WA",
      summary: "Monthly AI usage report — costs within budget",
      context: "February: 8,920 tokens, $2.14 spend, est. 34hrs saved. KnowledgeBot answered 47 queries (↑23%). Full breakdown in Analytics.",
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
      actions: [
        { label: "View Analytics", onClick: () => router.push("/settings/analytics") },
      ],
      isRead: true,
    },
  ];

  return items;
}

const SECTIONS: Array<{ priority: Priority; label: string }> = [
  { priority: "urgent",    label: "Do Now" },
  { priority: "important", label: "Schedule" },
  { priority: "delegate",  label: "Delegate" },
  { priority: "low",       label: "Eliminate" },
];

export default function InboxPage() {
  const mockItems = useMockItems();
  const [items, setItems] = useState(mockItems);

  const handleMarkRead = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    );
  };

  const handleArchive = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const isEmpty = items.length === 0;

  if (isEmpty) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 animate-fade-in">
        <CheckCircle2 className="h-10 w-10 text-white/15" />
        <h2 className="text-sm font-medium text-foreground">You&apos;re all caught up</h2>
        <p className="text-xs text-muted-foreground">
          New summaries and action items will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-subtle px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {items.length} item{items.length !== 1 ? "s" : ""}
          </span>
          <span className="text-2xs text-white/20">·</span>
          <span className="text-2xs text-muted-foreground">Eisenhower Matrix</span>
        </div>
        <button
          onClick={() => setItems([])}
          className="text-2xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Archive all
        </button>
      </div>

      {/* Sections */}
      {SECTIONS.map(({ priority, label }) => {
        const sectionItems = items.filter((item) => item.priority === priority);
        if (sectionItems.length === 0) return null;

        return (
          <div key={priority}>
            <div className="sticky top-0 z-10 border-b border-subtle bg-background/90 backdrop-blur-sm px-4 py-1.5">
              <span className="text-2xs font-medium uppercase tracking-widest text-white/25">
                {label}
              </span>
            </div>
            {sectionItems.map((item) => (
              <InboxCard
                key={item.id}
                item={item}
                onMarkRead={handleMarkRead}
                onArchive={handleArchive}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
