import { Pressable, Text, StyleSheet } from "react-native";

interface ThreadIndicatorProps {
  replyCount: number;
  lastReplyAuthor?: string;
  onPress: () => void;
}

export function ThreadIndicator({
  replyCount,
  lastReplyAuthor,
  onPress,
}: ThreadIndicatorProps) {
  const label = lastReplyAuthor
    ? `${replyCount} ${replyCount === 1 ? "reply" : "replies"} — last from ${lastReplyAuthor}`
    : `${replyCount} ${replyCount === 1 ? "reply" : "replies"}`;

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#222",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginTop: 4,
    marginLeft: 16,
  },
  text: {
    fontSize: 13,
    color: "#0a7ea4",
  },
});
