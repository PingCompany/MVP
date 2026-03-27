import { View, Text, Pressable, StyleSheet } from "react-native";
import { CategoryBadge } from "./CategoryBadge";

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(ts).toLocaleDateString();
}

interface DecisionCardProps {
  item: any;
  onAct: (itemId: string, actionKey: string) => void;
  onArchive: (itemId: string) => void;
}

export function DecisionCard({ item, onAct, onArchive }: DecisionCardProps) {
  const actions = item.recommendedActions ?? [];

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <CategoryBadge category={item.category ?? "skip"} />
        {item.channelName && (
          <Text style={styles.channel}>#{item.channelName}</Text>
        )}
        <Text style={styles.time}>
          {formatRelativeTime(item.createdAt ?? item._creationTime)}
        </Text>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.summary} numberOfLines={3}>
        {item.summary}
      </Text>

      {actions.length > 0 && (
        <View style={styles.actions}>
          {actions.map((action: any) => (
            <Pressable
              key={action.actionKey}
              style={[
                styles.actionBtn,
                action.primary && styles.actionBtnPrimary,
              ]}
              onPress={() => onAct(item._id, action.actionKey)}
            >
              <Text
                style={[
                  styles.actionText,
                  action.primary && styles.actionTextPrimary,
                ]}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}
          <Pressable onPress={() => onArchive(item._id)}>
            <Text style={styles.archiveText}>Archive</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#333",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  channel: { color: "#888", fontSize: 12, flex: 1 },
  time: { color: "#666", fontSize: 12 },
  title: { color: "#fff", fontSize: 17, fontWeight: "bold", marginTop: 8 },
  summary: { color: "#ccc", fontSize: 14, marginTop: 4, lineHeight: 20 },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    alignItems: "center",
  },
  actionBtn: {
    backgroundColor: "#222",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnPrimary: { backgroundColor: "#0a7ea4" },
  actionText: { color: "#ccc", fontSize: 14, fontWeight: "500" },
  actionTextPrimary: { color: "#fff" },
  archiveText: { color: "#888", fontSize: 13, marginLeft: 4 },
});
