"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
  X,
  GitPullRequest,
  Ticket,
  HelpCircle,
  AlertTriangle,
  Search,
  RefreshCw,
  FileText,
  ExternalLink,
  Loader2,
  CircleDot,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { DecisionItem, OrgTracePerson } from "./DecisionCard";

// ── Types ──────────────────────────────────────────────────────────────────────

interface RecommendedAction {
  label: string;
  actionKey: string;
  primary?: boolean;
  needsComment?: boolean;
}

interface DecisionModalProps {
  item: DecisionItem;
  onAction: (id: string, action: string, comment?: string) => void;
  onClose: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const typeConfig: Record<string, { icon: typeof GitPullRequest; label: string }> = {
  pr_review: { icon: GitPullRequest, label: "PR Review" },
  ticket_triage: { icon: Ticket, label: "Ticket" },
  question_answer: { icon: HelpCircle, label: "Question" },
  blocked_unblock: { icon: AlertTriangle, label: "Blocked" },
  fact_verify: { icon: Search, label: "Fact Check" },
  cross_team_ack: { icon: RefreshCw, label: "Cross-Team" },
  channel_summary: { icon: FileText, label: "Summary" },
};

const quadrantConfig: Record<string, { label: string; bg: string; text: string }> = {
  "urgent-important": { label: "URGENT", bg: "bg-priority-urgent/10", text: "text-priority-urgent" },
  important: { label: "IMPORTANT", bg: "bg-priority-important/10", text: "text-priority-important" },
  urgent: { label: "URGENT", bg: "bg-blue-500/10", text: "text-blue-400" },
  fyi: { label: "FYI", bg: "bg-white/5", text: "text-white/30" },
};

const ROLE_LABEL: Record<string, string> = {
  author: "wrote",
  assignee: "assigned",
  mentioned: "mentioned",
};

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

// Fallback actions per type if no recommendedActions stored
const fallbackActions: Record<string, RecommendedAction[]> = {
  pr_review: [
    { label: "Approve", actionKey: "approve", primary: true },
    { label: "Request Changes", actionKey: "request_changes", needsComment: true },
    { label: "Skip", actionKey: "snooze" },
  ],
  question_answer: [
    { label: "Reply", actionKey: "reply", primary: true, needsComment: true },
    { label: "Delegate", actionKey: "delegate", needsComment: true },
    { label: "Dismiss", actionKey: "dismiss" },
  ],
  blocked_unblock: [
    { label: "Investigate", actionKey: "investigate", primary: true },
    { label: "Reassign", actionKey: "reassign", needsComment: true },
    { label: "Snooze", actionKey: "snooze" },
  ],
  ticket_triage: [
    { label: "Accept", actionKey: "accept", primary: true },
    { label: "Reject", actionKey: "reject", needsComment: true },
    { label: "Delegate", actionKey: "delegate", needsComment: true },
  ],
  fact_verify: [
    { label: "Confirm", actionKey: "confirm", primary: true },
    { label: "Dispute", actionKey: "dispute", needsComment: true },
    { label: "Investigate", actionKey: "investigate" },
  ],
  cross_team_ack: [
    { label: "Acknowledge", actionKey: "acknowledge", primary: true },
    { label: "Follow Up", actionKey: "follow_up", needsComment: true },
  ],
  channel_summary: [
    { label: "Mark Read", actionKey: "mark_read", primary: true },
    { label: "Investigate", actionKey: "investigate" },
  ],
};

// ── Main component ─────────────────────────────────────────────────────────────

export function DecisionModal({ item, onAction, onClose }: DecisionModalProps) {
  const [comment, setComment] = useState("");
  const [deciding, setDeciding] = useState(false);

  const context = useQuery(api.decisions.getContext, {
    decisionId: item.id as Id<"decisions">,
  });

  const typeInfo = typeConfig[item.type] ?? typeConfig.channel_summary;
  const TypeIcon = typeInfo.icon;
  const qConfig = quadrantConfig[item.eisenhowerQuadrant] ?? quadrantConfig.fyi;
  const actions: RecommendedAction[] = item.recommendedActions ?? fallbackActions[item.type] ?? [];

  function handleAction(action: RecommendedAction) {
    setDeciding(true);
    onAction(item.id, action.actionKey, comment || undefined);
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 flex w-[520px] flex-col bg-background border-l border-subtle shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-subtle px-5 py-3">
          <div className="flex items-center gap-2">
            <TypeIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-2xs font-medium text-muted-foreground">{typeInfo.label}</span>
            <span className="text-2xs text-white/25">·</span>
            <span className="text-2xs text-muted-foreground">#{item.channelName}</span>
            <span className="text-2xs text-white/25">·</span>
            <span className="text-2xs text-muted-foreground">{formatRelativeTime(item.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("rounded px-1.5 py-px text-2xs font-medium", qConfig.bg, qConfig.text)}>
              {qConfig.label}
            </span>
            <button
              onClick={onClose}
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* Decision question */}
          <div className="px-5 pt-5 pb-4">
            <h2 className="text-base font-semibold text-foreground leading-snug">{item.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.summary}</p>
          </div>

          {/* Org trace */}
          {item.orgTrace && item.orgTrace.length > 0 && (
            <div className="border-t border-subtle px-5 py-3">
              <p className="mb-2 text-2xs font-medium uppercase tracking-widest text-foreground/25">People involved</p>
              <div className="flex flex-wrap gap-2">
                {item.orgTrace.map((p, i) => (
                  <div key={i} className="flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-surface-3 text-[9px] font-medium text-foreground/60">
                      {initials(p.name)}
                    </span>
                    <span className="text-xs text-foreground/80">{p.name}</span>
                    <span className="text-2xs text-foreground/30">{ROLE_LABEL[p.role] ?? p.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Context — messages + integration objects */}
          {context === undefined ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin text-foreground/20" />
            </div>
          ) : (
            <>
              {context.relatedMessages.length > 0 && (
                <div className="border-t border-subtle px-5 py-3">
                  <p className="mb-2 text-2xs font-medium uppercase tracking-widest text-foreground/25">
                    From #{item.channelName}
                  </p>
                  <div className="space-y-2">
                    {context.relatedMessages.slice(0, 5).map((msg, i) => (
                      <div key={i} className="rounded-md bg-surface-2 px-3 py-2">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-2xs font-medium text-foreground">{msg.authorName}</span>
                          <span className="text-2xs text-muted-foreground">{formatRelativeTime(msg.createdAt)}</span>
                        </div>
                        <p className="text-xs text-foreground/80 leading-relaxed">{msg.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {context.sourceIntegrationObject && (
                <div className="border-t border-subtle px-5 py-3">
                  <p className="mb-2 text-2xs font-medium uppercase tracking-widest text-foreground/25">Linked</p>
                  <a
                    href={context.sourceIntegrationObject.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-md bg-surface-2 px-3 py-2 transition-colors hover:bg-surface-3"
                  >
                    <CircleDot className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate text-sm text-foreground/90">
                      {context.sourceIntegrationObject.title}
                    </span>
                    <span className="shrink-0 rounded px-1.5 py-px text-2xs bg-white/5 text-muted-foreground">
                      {context.sourceIntegrationObject.status}
                    </span>
                    <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                  </a>
                </div>
              )}

              {context.relatedPastDecisions.length > 0 && (
                <div className="border-t border-subtle px-5 py-3">
                  <p className="mb-2 text-2xs font-medium uppercase tracking-widest text-foreground/25">Past decisions like this</p>
                  <div className="space-y-1.5">
                    {context.relatedPastDecisions.slice(0, 3).map((d, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-md bg-surface-2 px-3 py-1.5">
                        <span className="flex-1 truncate text-xs text-foreground/70">{d.title}</span>
                        <span className="shrink-0 rounded px-1.5 py-px text-2xs bg-white/5 text-muted-foreground">
                          {d.outcome?.action ?? "—"}
                        </span>
                        <span className="shrink-0 text-2xs text-muted-foreground">
                          {formatRelativeTime(d.outcome?.decidedAt ?? d.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action footer */}
        <div className="border-t border-subtle bg-background px-5 py-4 space-y-3">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add reasoning (optional)..."
            rows={2}
            className="w-full resize-none rounded-md border border-subtle bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-white/20"
          />
          <div className="flex items-center gap-2">
            {actions.map((action) => (
              <button
                key={action.actionKey}
                onClick={() => handleAction(action)}
                disabled={deciding}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50",
                  action.primary
                    ? "bg-ping-purple text-white hover:bg-ping-purple/90"
                    : "bg-white/5 text-foreground hover:bg-white/10"
                )}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
