import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
} from "react-native";
import type { ReactionGroup } from "@/hooks/useReactions";

const POPULAR_EMOJI = [
  "\u{1F44D}", "\u{1F44E}", "\u{1F602}", "\u2764\uFE0F", "\u{1F389}", "\u{1F64C}", "\u{1F440}", "\u{1F525}",
  "\u{1F4AF}", "\u2705", "\u274C", "\u{1F914}", "\u{1F60D}", "\u{1F680}", "\u{1F44F}", "\u{1F4AA}",
  "\u{1F622}", "\u{1F62E}", "\u{1F64F}", "\u{1F4A1}", "\u2B50", "\u{1FAE1}", "\u{1F44B}", "\u2795",
];

interface MessageReactionsProps {
  reactions: ReactionGroup[];
  onToggle: (emoji: string) => void;
  currentUserId?: string;
}

export function MessageReactions({
  reactions,
  onToggle,
  currentUserId,
}: MessageReactionsProps) {
  const [pickerVisible, setPickerVisible] = useState(false);

  if (reactions.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillRow}
      >
        {reactions.map((r) => {
          const isActive = currentUserId
            ? r.userIds.includes(currentUserId)
            : false;
          return (
            <Pressable
              key={r.emoji}
              style={[styles.pill, isActive && styles.pillActive]}
              onPress={() => onToggle(r.emoji)}
            >
              <Text style={styles.pillEmoji}>{r.emoji}</Text>
              <Text style={[styles.pillCount, isActive && styles.pillCountActive]}>
                {r.count}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          style={styles.addButton}
          onPress={() => setPickerVisible(true)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </ScrollView>

      <EmojiPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={(emoji) => {
          onToggle(emoji);
          setPickerVisible(false);
        }}
      />
    </View>
  );
}

export function EmojiPickerModal({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.pickerContainer}>
          <View style={styles.emojiGrid}>
            {POPULAR_EMOJI.map((emoji) => (
              <Pressable
                key={emoji}
                style={styles.emojiButton}
                onPress={() => onSelect(emoji)}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
  pillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: "transparent",
  },
  pillActive: {
    borderColor: "#0a7ea4",
  },
  pillEmoji: {
    fontSize: 14,
  },
  pillCount: {
    fontSize: 12,
    color: "#ccc",
  },
  pillCountActive: {
    color: "#0a7ea4",
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  addButtonText: {
    fontSize: 14,
    color: "#888",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerContainer: {
    backgroundColor: "#222",
    borderRadius: 16,
    padding: 16,
    width: 280,
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 4,
  },
  emojiButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  emojiText: {
    fontSize: 22,
  },
});
