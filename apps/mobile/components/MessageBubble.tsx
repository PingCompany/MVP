import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import {
  MessageReactions,
  EmojiPickerModal,
} from "@/components/MessageReactions";
import type { ReactionGroup } from "@/hooks/useReactions";

interface MessageBubbleProps {
  authorName: string;
  body: string;
  timestamp: number;
  isOwn?: boolean;
  type?: "user" | "bot" | "system" | "integration";
  messageId?: string;
  reactions?: ReactionGroup[];
  onToggleReaction?: (emoji: string) => void;
  currentUserId?: string;
  onLongPress?: () => void;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function MessageBubble({
  authorName,
  body,
  timestamp,
  isOwn = false,
  type = "user",
  reactions,
  onToggleReaction,
  currentUserId,
  onLongPress,
}: MessageBubbleProps) {
  const [pickerVisible, setPickerVisible] = useState(false);

  const handleLongPress = () => {
    if (onLongPress) {
      onLongPress();
    } else if (onToggleReaction) {
      setPickerVisible(true);
    }
  };

  if (type === "system") {
    return (
      <View style={styles.systemContainer}>
        <Text style={styles.systemText}>{body}</Text>
      </View>
    );
  }

  const hasReactions = reactions && reactions.length > 0 && onToggleReaction;

  return (
    <Pressable onLongPress={handleLongPress}>
      <View style={[styles.container, isOwn && styles.ownContainer]}>
        <View style={styles.header}>
          <Text style={[styles.author, type === "bot" && styles.botAuthor]}>
            {authorName}
            {type === "bot" ? " (bot)" : ""}
          </Text>
          <Text style={styles.time}>{formatTime(timestamp)}</Text>
        </View>
        <Text style={styles.body}>{body}</Text>
        {hasReactions && (
          <MessageReactions
            reactions={reactions}
            onToggle={onToggleReaction}
            currentUserId={currentUserId}
          />
        )}
      </View>
      {onToggleReaction && (
        <EmojiPickerModal
          visible={pickerVisible}
          onClose={() => setPickerVisible(false)}
          onSelect={(emoji) => {
            onToggleReaction(emoji);
            setPickerVisible(false);
          }}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  ownContainer: {
    // Could add different styling for own messages
  },
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 2,
    gap: 8,
  },
  author: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  botAuthor: {
    color: "#0a7ea4",
  },
  time: {
    fontSize: 12,
    color: "#666",
  },
  body: {
    fontSize: 15,
    color: "#e0e0e0",
    lineHeight: 22,
  },
  systemContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignItems: "center",
  },
  systemText: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
  },
});
