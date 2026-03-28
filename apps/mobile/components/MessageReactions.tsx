import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import EmojiPicker from "rn-emoji-keyboard";
import type { ReactionGroup } from "@/hooks/useReactions";

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
    <EmojiPicker
      onEmojiSelected={(emojiObject) => onSelect(emojiObject.emoji)}
      open={visible}
      onClose={onClose}
      theme={{
        backdrop: "rgba(0,0,0,0.6)",
        knob: "#555",
        container: "#1c1c1e",
        header: "#fff",
        skinTonesContainer: "#252525",
        category: {
          icon: "#888",
          iconActive: "#0a7ea4",
          container: "#1c1c1e",
          containerActive: "#333",
        },
        search: {
          text: "#fff",
          placeholder: "#666",
          icon: "#666",
          background: "#2c2c2e",
        },
        emoji: {
          selected: "#333",
        },
      }}
      categoryPosition="top"
      enableSearchBar
      enableRecentlyUsed
    />
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
});
