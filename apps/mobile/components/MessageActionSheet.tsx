import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
} from "react-native";
import { SmilePlus, MessageCircle, CornerUpRight, Link, Info } from "lucide-react-native";
import EmojiPicker from "rn-emoji-keyboard";

interface MessageActionSheetProps {
  visible: boolean;
  onClose: () => void;
  onReaction: (emoji: string) => void;
  onReply: () => void;
  onForward: () => void;
  onCopyLink: () => void;
  messageDate: number;
}

export function MessageActionSheet({
  visible,
  onClose,
  onReaction,
  onReply,
  onForward,
  onCopyLink,
  messageDate,
}: MessageActionSheetProps) {
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const formattedDate = new Date(messageDate).toLocaleString([], {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          {/* Action buttons row */}
          <View style={styles.actionsRow}>
            <Pressable
              style={styles.actionBtn}
              onPress={() => setEmojiPickerOpen(true)}
            >
              <View style={styles.actionIconWrap}>
                <SmilePlus size={20} color="#fff" />
              </View>
              <Text style={styles.actionLabel}>React</Text>
            </Pressable>

            <Pressable
              style={styles.actionBtn}
              onPress={() => {
                onReply();
                onClose();
              }}
            >
              <View style={styles.actionIconWrap}>
                <MessageCircle size={20} color="#fff" />
              </View>
              <Text style={styles.actionLabel}>Reply</Text>
            </Pressable>

            <Pressable
              style={styles.actionBtn}
              onPress={() => {
                onForward();
                onClose();
              }}
            >
              <View style={styles.actionIconWrap}>
                <CornerUpRight size={20} color="#fff" />
              </View>
              <Text style={styles.actionLabel}>Forward</Text>
            </Pressable>

            <Pressable
              style={styles.actionBtn}
              onPress={() => {
                onCopyLink();
                onClose();
              }}
            >
              <View style={styles.actionIconWrap}>
                <Link size={20} color="#fff" />
              </View>
              <Text style={styles.actionLabel}>Copy Link</Text>
            </Pressable>
          </View>

          {/* Info line */}
          <View style={styles.listActions}>
            <View style={styles.listItem}>
              <Info size={18} color="#999" />
              <Text style={styles.listLabel}>Sent {formattedDate}</Text>
            </View>
          </View>

          {/* Cancel */}
          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </Pressable>

      <EmojiPicker
        onEmojiSelected={(emojiObject) => {
          onReaction(emojiObject.emoji);
          setEmojiPickerOpen(false);
          onClose();
        }}
        open={emojiPickerOpen}
        onClose={() => setEmojiPickerOpen(false)}
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#1c1c1e",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingTop: 12,
    paddingBottom: 34,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333",
  },
  actionBtn: {
    alignItems: "center",
    gap: 6,
    minWidth: 70,
  },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#2c2c2e",
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: 12,
    color: "#999",
  },
  listActions: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  listLabel: {
    fontSize: 15,
    color: "#ccc",
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 14,
  },
  cancelText: {
    fontSize: 16,
    color: "#0a7ea4",
    fontWeight: "600",
  },
});
