import { View, Text, StyleSheet } from "react-native";

interface MessageBubbleProps {
  authorName: string;
  body: string;
  timestamp: number;
  isOwn?: boolean;
  type?: "user" | "bot" | "system" | "integration";
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
}: MessageBubbleProps) {
  if (type === "system") {
    return (
      <View style={styles.systemContainer}>
        <Text style={styles.systemText}>{body}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isOwn && styles.ownContainer]}>
      <View style={styles.header}>
        <Text style={[styles.author, type === "bot" && styles.botAuthor]}>
          {authorName}
          {type === "bot" ? " (bot)" : ""}
        </Text>
        <Text style={styles.time}>{formatTime(timestamp)}</Text>
      </View>
      <Text style={styles.body}>{body}</Text>
    </View>
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
