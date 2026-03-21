"use client";

import { useQuery, useMutation } from "convex/react";
import { useCallback } from "react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";

export interface ReactionGroup {
  emoji: string;
  count: number;
  userIds: string[];
  userNames: string[];
}

export function useReactions({
  messageIds,
  enabled,
}: {
  messageIds: Id<"messages">[];
  enabled: boolean;
}) {
  const reactionsByMessage =
    useQuery(
      api.reactions.getByMessages,
      enabled && messageIds.length > 0 ? { messageIds } : "skip",
    ) ?? {};

  const toggle = useMutation(api.reactions.toggle);

  const toggleReaction = useCallback(
    (messageId: string, emoji: string) => {
      toggle({ messageId: messageId as Id<"messages">, emoji });
    },
    [toggle],
  );

  return { reactionsByMessage, toggleReaction } as const;
}
