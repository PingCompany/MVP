"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Send, Bot, Paperclip, AtSign, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CitationRow, type Citation } from "@/components/bot/CitationPill";
import { MarkdownContent } from "@/components/channel/MarkdownContent";
import { cn } from "@/lib/utils";
import { MentionPopover, type MentionUser } from "./MentionPopover";

export interface Message {
  id: string;
  type: "user" | "bot";
  author: string;
  authorInitials: string;
  content: string;
  timestamp: Date;
  citations?: Citation[];
  botName?: string;
}

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatFullDatetime(date: Date): string {
  return date.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function RelativeTimestamp({ date }: { date: Date }) {
  const relative = useMemo(() => formatRelativeTime(date), [date]);
  const full = useMemo(() => formatFullDatetime(date), [date]);

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-default text-2xs text-white/25">
            {relative}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-2xs">
          {full}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface MessageItemProps {
  message: Message;
  showAvatar: boolean;
}

export function MessageItem({ message, showAvatar }: MessageItemProps) {
  const isBot = message.type === "bot";

  return (
    <div
      className={cn(
        "group flex gap-3 px-4 py-1.5 transition-colors hover:bg-surface-2/60",
        showAvatar ? "mt-3" : "mt-0"
      )}
    >
      {/* Avatar column */}
      <div className="w-6 shrink-0 pt-0.5">
        {showAvatar ? (
          <Avatar className="h-6 w-6">
            <AvatarFallback
              className={cn(
                "text-2xs font-medium",
                isBot
                  ? "bg-ping-purple/20 text-ping-purple"
                  : "bg-surface-3 text-foreground"
              )}
            >
              {isBot ? <Bot className="h-3 w-3" /> : message.authorInitials}
            </AvatarFallback>
          </Avatar>
        ) : null}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {showAvatar && (
          <div className="flex items-baseline gap-2 pb-0.5">
            <span className={cn("text-xs font-semibold", isBot ? "text-ping-purple" : "text-foreground")}>
              {isBot ? message.botName || "KnowledgeBot" : message.author}
            </span>
            {isBot && (
              <span className="rounded border border-ping-purple/30 bg-ping-purple/10 px-1 py-px text-2xs text-ping-purple">
                AI
              </span>
            )}
            <RelativeTimestamp date={message.timestamp} />
          </div>
        )}

        <MarkdownContent
          content={message.content}
          className={cn(
            "text-sm leading-relaxed",
            isBot ? "text-foreground" : "text-foreground/90"
          )}
        />

        {message.citations && (
          <CitationRow citations={message.citations} />
        )}
      </div>
    </div>
  );
}

function MessageSkeleton() {
  return (
    <div className="flex gap-3 px-4 py-1.5 mt-3">
      <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-10" />
        </div>
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3.5 w-1/2" />
      </div>
    </div>
  );
}

interface MessageListProps {
  channelName: string;
  messages: Message[];
  onSend?: (content: string) => void;
  memberCount?: number;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  /** When true, renders a DM-style header (no # prefix, avatar shown) */
  isDM?: boolean;
}

export function MessageList({
  channelName,
  messages,
  onSend,
  memberCount,
  isLoading,
  hasMore,
  onLoadMore,
  isDM = false,
}: MessageListProps) {
  const [input, setInput] = useState("");
  const [showNewMessages, setShowNewMessages] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevMessageCountRef = useRef(messages.length);

  // Mention popover state
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null);
  const composerRef = useRef<HTMLDivElement>(null);

  const isAtBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }, []);

  // Auto-scroll when new messages arrive (only if at bottom)
  useEffect(() => {
    const newCount = messages.length;
    const prevCount = prevMessageCountRef.current;
    prevMessageCountRef.current = newCount;

    if (newCount > prevCount) {
      if (isAtBottom()) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        setShowNewMessages(false);
      } else {
        setShowNewMessages(true);
      }
    }
  }, [messages, isAtBottom]);

  // Initial scroll to bottom
  useEffect(() => {
    if (!isLoading) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [isLoading]);

  const handleScrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowNewMessages(false);
  };

  const handleScroll = () => {
    if (isAtBottom()) setShowNewMessages(false);
  };

  // Detect @ trigger in the textarea input
  const detectMention = useCallback(
    (value: string, cursorPos: number) => {
      // Look backwards from cursor for an @ that starts a mention
      const textBefore = value.slice(0, cursorPos);
      const atIndex = textBefore.lastIndexOf("@");

      if (atIndex === -1) {
        setMentionOpen(false);
        return;
      }

      // The @ must be at start of input or preceded by a space/newline
      const charBefore = atIndex > 0 ? textBefore[atIndex - 1] : " ";
      if (charBefore !== " " && charBefore !== "\n" && atIndex !== 0) {
        setMentionOpen(false);
        return;
      }

      // Text between @ and cursor must not contain spaces (simple filter query)
      const queryText = textBefore.slice(atIndex + 1);
      if (queryText.includes(" ")) {
        setMentionOpen(false);
        return;
      }

      setMentionStartIndex(atIndex);
      setMentionQuery(queryText);
      setMentionOpen(true);
    },
    []
  );

  const handleMentionSelect = useCallback(
    (user: MentionUser) => {
      if (mentionStartIndex === null) return;
      const textarea = textareaRef.current;
      if (!textarea) return;

      const before = input.slice(0, mentionStartIndex);
      const after = input.slice(textarea.selectionStart);
      const mention = `@${user.name} `;
      const newValue = before + mention + after;

      setInput(newValue);
      setMentionOpen(false);
      setMentionStartIndex(null);
      setMentionQuery("");

      // Restore cursor position after the inserted mention
      const newCursorPos = before.length + mention.length;
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      });
    },
    [input, mentionStartIndex]
  );

  const handleDismissMention = useCallback(() => {
    setMentionOpen(false);
    setMentionStartIndex(null);
    setMentionQuery("");
  }, []);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend?.(trimmed);
    setInput("");
    setMentionOpen(false);
    // Scroll to bottom after send
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // When mention popover is open, let it handle arrow/enter/escape
    if (mentionOpen) {
      if (["ArrowDown", "ArrowUp", "Enter", "Tab", "Escape"].includes(e.key)) {
        return; // MentionPopover's global keydown handler will capture this
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-subtle px-4 py-2">
        <span className="text-sm font-medium text-foreground">
          {isDM ? channelName : `#${channelName}`}
        </span>
        {memberCount !== undefined && (
          <span className="rounded bg-surface-3 px-1.5 py-px text-2xs text-muted-foreground">
            {memberCount} member{memberCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="relative flex-1 overflow-y-auto py-2 scrollbar-thin"
      >
        {/* Load more */}
        {hasMore && (
          <div className="flex justify-center py-2">
            <button
              onClick={onLoadMore}
              className="rounded px-3 py-1 text-2xs text-muted-foreground transition-colors hover:bg-surface-3 hover:text-foreground"
            >
              Load earlier messages
            </button>
          </div>
        )}

        {/* Skeletons */}
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <MessageSkeleton key={i} />)
        ) : (
          messages.map((msg, i) => {
            const prev = messages[i - 1];
            const showAvatar =
              !prev ||
              prev.author !== msg.author ||
              msg.timestamp.getTime() - prev.timestamp.getTime() > 5 * 60 * 1000;

            return (
              <MessageItem key={msg.id} message={msg} showAvatar={showAvatar} />
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* New messages pill */}
      {showNewMessages && (
        <div className="absolute bottom-20 left-1/2 z-10 -translate-x-1/2">
          <button
            onClick={handleScrollToBottom}
            className="flex items-center gap-1.5 rounded-full border border-subtle bg-surface-2 px-3 py-1.5 text-xs font-medium text-foreground shadow-lg transition-colors hover:bg-surface-3"
          >
            <ChevronDown className="h-3 w-3" />
            New messages
          </button>
        </div>
      )}

      {/* Composer */}
      <div className="border-t border-subtle p-3">
        <div ref={composerRef} className="relative flex items-end gap-2 rounded border border-subtle bg-surface-2 px-3 py-2 focus-within:border-white/15">
          {/* Mention popover — positioned above the composer */}
          <MentionPopover
            query={mentionQuery}
            isOpen={mentionOpen}
            position={{ top: 8, left: 0 }}
            onSelect={handleMentionSelect}
            onDismiss={handleDismissMention}
          />

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              const newValue = e.target.value;
              setInput(newValue);
              detectMention(newValue, e.target.selectionStart);
            }}
            onKeyDown={handleKeyDown}
            onClick={(e) => {
              // Re-check mention on click (cursor may have moved)
              detectMention(input, e.currentTarget.selectionStart);
            }}
            onBlur={() => {
              // Delay dismiss so click on popover item fires first
              setTimeout(() => setMentionOpen(false), 150);
            }}
            placeholder={isDM ? `Message ${channelName}...` : `Message #${channelName}... or @KnowledgeBot`}
            rows={1}
            className="max-h-32 flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-white/25 focus:outline-none"
            style={{ height: "20px" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "20px";
              el.style.height = `${el.scrollHeight}px`;
            }}
          />
          <div className="flex shrink-0 items-center gap-1 pb-0.5">
            {!isDM && (
              <button
                onClick={() => {
                  const textarea = textareaRef.current;
                  if (!textarea) return;
                  const cursorPos = textarea.selectionStart;
                  const before = input.slice(0, cursorPos);
                  const after = input.slice(cursorPos);
                  // Insert @ and trigger mention detection
                  const needsSpace = before.length > 0 && !before.endsWith(" ") && !before.endsWith("\n");
                  const prefix = needsSpace ? " @" : "@";
                  const newValue = before + prefix + after;
                  setInput(newValue);
                  const newCursorPos = cursorPos + prefix.length;
                  requestAnimationFrame(() => {
                    textarea.focus();
                    textarea.setSelectionRange(newCursorPos, newCursorPos);
                    detectMention(newValue, newCursorPos);
                  });
                }}
                className="rounded p-1 text-white/25 hover:bg-surface-3 hover:text-white/60"
              >
                <AtSign className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              disabled
              title="File attachments coming soon"
              className="rounded p-1 text-white/25 opacity-50 cursor-not-allowed"
            >
              <Paperclip className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className={cn(
                "rounded p-1 transition-colors",
                input.trim()
                  ? "bg-ping-purple text-white hover:bg-ping-purple-hover"
                  : "text-white/20"
              )}
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <p className="mt-1 text-2xs text-white/20">
          Enter to send · Shift+Enter for new line{!isDM && " · @mention to summon agents"}
        </p>
      </div>
    </div>
  );
}
