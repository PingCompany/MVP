"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { InboxCard, type InboxItem, type EisenhowerQuadrant, QUADRANT_ORDER } from "@/components/inbox/InboxCard";
import { DecisionCard, type DecisionItem, type OrgTracePerson } from "@/components/inbox/DecisionCard";
import { DecisionModal } from "@/components/inbox/DecisionModal";
import { DraftReminderCard } from "@/components/inbox/DraftReminderCard";
import { UnansweredQuestionCard } from "@/components/inbox/UnansweredQuestionCard";
import { CheckCircle2, Loader2, FlaskConical } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";

const SECTION_LABELS: Record<EisenhowerQuadrant, string> = {
  "urgent-important": "Do Now",
  "important":        "Schedule",
  "urgent":           "Delegate",
  "fyi":              "Eliminate",
};

export default function InboxPage() {
  const router = useRouter();
  const { buildPath } = useWorkspace();

  const { isAuthenticated } = useConvexAuth();
  const summaries = useQuery(api.inboxSummaries.list, isAuthenticated ? {} : "skip");
  const drafts = useQuery(api.drafts.listActive, isAuthenticated ? {} : "skip");
  const alerts = useQuery(api.proactiveAlerts.listPending, isAuthenticated ? {} : "skip");
  const decisions = useQuery(api.decisions.list, isAuthenticated ? {} : "skip");
  const markReadMutation = useMutation(api.inboxSummaries.markRead);
  const archiveMutation = useMutation(api.inboxSummaries.archive);
  const dismissAlertMutation = useMutation(api.proactiveAlerts.dismiss);
  const decideMutation = useMutation(api.decisions.decide);
  const snoozeMutation = useMutation(api.decisions.snooze);
  const seedDecisionsMutation = useMutation(api.seed.seedDecisions);
  const clearSeedMutation = useMutation(api.seed.clearSeedDecisions);

  const [openDecisionId, setOpenDecisionId] = useState<string | null>(null);

  const unansweredQuestions = useMemo(
    () => (alerts ?? []).filter((a) => a.type === "unanswered_question"),
    [alerts],
  );

  const items: InboxItem[] = useMemo(() => {
    if (!summaries) return [];
    return summaries.map((s) => ({
      id: s._id,
      priority: (s.eisenhowerQuadrant ?? "fyi") as EisenhowerQuadrant,
      channel: s.channelName,
      author: "PING",
      authorInitials: "P",
      summary: s.bullets[0]?.text ?? "New activity",
      context: s.bullets
        .slice(1)
        .map((b) => b.text)
        .join(". "),
      timestamp: new Date(s.periodEnd),
      actions: [
        {
          label: "View Channel",
          primary: true,
          onClick: () => router.push(buildPath(`/channel/${s.channelId}`)),
        },
        ...(s.actionItems ?? []).map((ai) => ({
          label: ai.text,
          onClick: () => {
            if (ai.integrationUrl) {
              window.open(ai.integrationUrl, "_blank");
            } else {
              router.push(buildPath(`/channel/${s.channelId}`));
            }
            markReadMutation({ summaryId: s._id });
          },
        })),
      ],
      isRead: s.isRead,
    }));
  }, [summaries, router, markReadMutation, buildPath]);

  const decisionItems: DecisionItem[] = useMemo(() => {
    if (!decisions) return [];
    return decisions.map((d) => ({
      id: d._id,
      type: d.type,
      title: d.title,
      summary: d.summary,
      eisenhowerQuadrant: d.eisenhowerQuadrant,
      status: d.status,
      channelName: d.channelName ?? "unknown",
      createdAt: new Date(d.createdAt),
      agentExecutionStatus: d.agentExecutionStatus ?? undefined,
      agentExecutionResult: d.agentExecutionResult ?? undefined,
      orgTrace: (d.orgTrace ?? []) as OrgTracePerson[],
      nextSteps: (d.nextSteps ?? []) as DecisionItem["nextSteps"],
      recommendedActions: (d.recommendedActions ?? []) as DecisionItem["recommendedActions"],
    }));
  }, [decisions]);

  const handleMarkRead = (id: string) => {
    markReadMutation({ summaryId: id as Id<"inboxSummaries"> });
  };

  const handleArchive = (id: string) => {
    archiveMutation({ summaryId: id as Id<"inboxSummaries"> });
  };

  const handleDismissAlert = (alertId: string) => {
    dismissAlertMutation({ alertId: alertId as Id<"proactiveAlerts"> });
  };

  const handleDecisionAction = (id: string, action: string, comment?: string) => {
    if (action === "Snooze" || action === "snooze") {
      snoozeMutation({
        decisionId: id as Id<"decisions">,
        snoozeUntil: Date.now() + 60 * 60 * 1000,
      });
    } else {
      decideMutation({
        decisionId: id as Id<"decisions">,
        action,
        comment,
      });
    }
  };

  const isLoading = summaries === undefined || drafts === undefined || decisions === undefined;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-foreground/20" />
      </div>
    );
  }

  const totalCount = items.length + (drafts?.length ?? 0) + unansweredQuestions.length + decisionItems.length;

  if (totalCount === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 animate-fade-in px-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-foreground/15" />
        <h2 className="text-sm font-medium text-foreground">Inbox is empty</h2>
        <p className="max-w-xs text-xs text-muted-foreground leading-relaxed">
          Decisions, summaries, and action items appear here as your team communicates in channels.
          Send messages in a channel — AI summaries and decisions generate every 5–15 minutes.
        </p>
        <button
          onClick={() => seedDecisionsMutation({})}
          className="mt-2 flex items-center gap-1.5 rounded-md border border-subtle px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-white/20 hover:text-foreground"
        >
          <FlaskConical className="h-3.5 w-3.5" />
          Load demo decisions
        </button>
      </div>
    );
  }

  // Sort summaries: Q1 -> Q2 -> Q3 -> Q4, then by timestamp desc within each group
  const sortedItems = [...items].sort((a, b) => {
    const qDiff = QUADRANT_ORDER.indexOf(a.priority) - QUADRANT_ORDER.indexOf(b.priority);
    if (qDiff !== 0) return qDiff;
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  // Sort decisions by quadrant then creation time
  const sortedDecisions = [...decisionItems].sort((a, b) => {
    const qDiff = QUADRANT_ORDER.indexOf(a.eisenhowerQuadrant) - QUADRANT_ORDER.indexOf(b.eisenhowerQuadrant);
    if (qDiff !== 0) return qDiff;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-subtle px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {totalCount} item{totalCount !== 1 ? "s" : ""}
          </span>
          <span className="text-2xs text-foreground/20">·</span>
          <span className="text-2xs text-muted-foreground">Eisenhower Matrix</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => seedDecisionsMutation({})}
            title="Load demo decisions"
            className="flex items-center gap-1 rounded px-2 py-1 text-2xs text-foreground/20 transition-colors hover:bg-surface-2 hover:text-muted-foreground"
          >
            <FlaskConical className="h-3 w-3" />
            demo
          </button>
          <button
            onClick={() => clearSeedMutation({})}
            title="Clear all pending decisions"
            className="flex items-center gap-1 rounded px-2 py-1 text-2xs text-foreground/20 transition-colors hover:bg-surface-2 hover:text-red-400"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Draft reminders (above quadrant sections) */}
      {drafts.length > 0 && (
        <div>
          <div className="sticky top-0 z-10 border-b border-subtle bg-background/90 backdrop-blur-sm px-4 py-1.5">
            <span className="text-2xs font-medium uppercase tracking-widest text-foreground/25">
              Unsent Drafts
            </span>
          </div>
          {drafts.map((draft) => (
            <DraftReminderCard
              key={draft._id}
              draftId={draft._id}
              channelId={draft.channelId}
              channelName={draft.channelName}
              body={draft.body}
              suggestedCompletion={draft.suggestedCompletion}
              updatedAt={new Date(draft.updatedAt)}
            />
          ))}
        </div>
      )}

      {/* Unanswered questions */}
      {unansweredQuestions.length > 0 && (
        <div>
          <div className="sticky top-0 z-10 border-b border-subtle bg-background/90 backdrop-blur-sm px-4 py-1.5">
            <span className="text-2xs font-medium uppercase tracking-widest text-foreground/25">
              Needs Your Answer
            </span>
          </div>
          {unansweredQuestions.map((alert) => (
            <UnansweredQuestionCard
              key={alert._id}
              alertId={alert._id}
              channelId={alert.channelId}
              channelName={"channel"}
              title={alert.title}
              body={alert.body}
              suggestedAction={alert.suggestedAction}
              createdAt={new Date(alert.createdAt)}
              onDismiss={handleDismissAlert}
            />
          ))}
        </div>
      )}

      {/* Decisions — using DecisionCard component */}
      {sortedDecisions.length > 0 && (
        <div>
          <div className="sticky top-0 z-10 border-b border-subtle bg-background/90 backdrop-blur-sm px-4 py-1.5">
            <span className="text-2xs font-medium uppercase tracking-widest text-white/25">
              Decisions
            </span>
          </div>
          {sortedDecisions.map((decision) => (
            <DecisionCard
              key={decision.id}
              item={decision}
              onAction={handleDecisionAction}
              onOpen={() => setOpenDecisionId(decision.id)}
            />
          ))}
        </div>
      )}

      {/* Eisenhower quadrant sections */}
      {QUADRANT_ORDER.map((quadrant) => {
        const sectionItems = sortedItems.filter((item) => item.priority === quadrant);
        if (sectionItems.length === 0) return null;

        return (
          <div key={quadrant}>
            <div className="sticky top-0 z-10 border-b border-subtle bg-background/90 backdrop-blur-sm px-4 py-1.5">
              <span className="text-2xs font-medium uppercase tracking-widest text-foreground/25">
                {SECTION_LABELS[quadrant]}
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

      {openDecisionId && (() => {
        const decision = sortedDecisions.find(d => d.id === openDecisionId);
        if (!decision) return null;
        return (
          <DecisionModal
            item={decision}
            onAction={handleDecisionAction}
            onClose={() => setOpenDecisionId(null)}
          />
        );
      })()}
    </div>
  );
}
