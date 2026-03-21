"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Check, ArrowRight, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";

export type Priority = "urgent" | "important" | "delegate" | "low";

export interface InboxAction {
  label: string;
  primary?: boolean;
  onClick?: () => void;
}

export interface InboxItem {
  id: string;
  priority: Priority;
  channel: string;
  author: string;
  authorInitials: string;
  summary: string;
  context: string;
  timestamp: Date;
  actions: InboxAction[];
  isRead?: boolean;
}

const priorityConfig: Record<
  Priority,
  { color: string; bg: string; label: string; textColor: string }
> = {
  urgent:    { color: "bg-priority-urgent",    bg: "bg-priority-urgent/8",    label: "Do Now",   textColor: "text-priority-urgent" },
  important: { color: "bg-priority-important", bg: "bg-priority-important/8", label: "Schedule", textColor: "text-priority-important" },
  delegate:  { color: "bg-priority-delegate",  bg: "bg-priority-delegate/8",  label: "Delegate", textColor: "text-priority-delegate" },
  low:       { color: "bg-priority-low",       bg: "bg-priority-low/8",       label: "Low",      textColor: "text-priority-low" },
};

interface InboxCardProps {
  item: InboxItem;
  onMarkRead?: (id: string) => void;
  onArchive?: (id: string) => void;
}

export function InboxCard({ item, onMarkRead, onArchive }: InboxCardProps) {
  const [hovered, setHovered] = useState(false);
  const router = useRouter();
  const config = priorityConfig[item.priority];

  return (
    <div
      className={cn(
        "group relative flex gap-3 border-b border-subtle px-4 py-3",
        "cursor-default transition-colors duration-75",
        hovered ? "bg-surface-2" : "bg-transparent",
        item.isRead && "opacity-60"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Priority left border */}
      <div
        className={cn(
          "absolute left-0 top-3 bottom-3 w-0.5 rounded-r",
          config.color
        )}
      />

      {/* Avatar */}
      <Avatar className="mt-0.5 h-6 w-6 shrink-0">
        <AvatarFallback className="bg-surface-3 text-2xs font-medium text-foreground">
          {item.authorInitials}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Header row */}
        <div className="flex items-center gap-2 pb-0.5">
          <span className="text-xs font-medium text-foreground">{item.author}</span>
          <span className="text-2xs text-white/25">·</span>
          <span className="text-2xs text-muted-foreground">#{item.channel}</span>
          <span className="text-2xs text-white/25">·</span>
          <span className="text-2xs text-muted-foreground">
            {formatRelativeTime(item.timestamp)}
          </span>

          <div className="ml-auto flex items-center gap-1">
            <span
              className={cn(
                "rounded px-1.5 py-px text-2xs font-medium",
                config.bg,
                config.textColor
              )}
            >
              {config.label}
            </span>
          </div>
        </div>

        {/* Summary */}
        <p className="text-sm text-foreground">{item.summary}</p>

        {/* Context */}
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
          {item.context}
        </p>

        {/* Actions */}
        <div
          className={cn(
            "mt-2 flex items-center gap-1.5 transition-all duration-150",
            hovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none"
          )}
        >
          {item.actions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className={cn(
                "flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors",
                action.primary
                  ? "bg-ping-purple text-white hover:bg-ping-purple-hover"
                  : "bg-surface-3 text-foreground hover:bg-white/10"
              )}
            >
              {action.primary && <ArrowRight className="h-3 w-3" />}
              {action.label}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => onMarkRead?.(item.id)}
              className="rounded p-1 text-white/30 transition-colors hover:bg-surface-3 hover:text-foreground"
              title="Mark as read"
            >
              <Check className="h-3 w-3" />
            </button>
            <button
              onClick={() => onArchive?.(item.id)}
              className="rounded p-1 text-white/30 transition-colors hover:bg-surface-3 hover:text-foreground"
              title="Archive"
            >
              <Archive className="h-3 w-3" />
            </button>
            <button
              onClick={() => router.push(`/channel/${item.channel}`)}
              className="rounded p-1 text-white/30 transition-colors hover:bg-surface-3 hover:text-foreground"
              title="Go to channel"
            >
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
