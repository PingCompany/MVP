import { useCallback } from "react";
import {
  View,
  Text,
  SectionList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { DecisionCard } from "@/components/inbox/DecisionCard";

export default function MyDeckScreen() {
  const items = useQuery(api.inboxItems.list);
  const act = useMutation(api.inboxItems.act);
  const archive = useMutation(api.inboxItems.archive);

  const handleAct = useCallback(
    (itemId: string, actionKey: string) => {
      act({ itemId: itemId as any, action: actionKey });
    },
    [act],
  );

  const handleArchive = useCallback(
    (itemId: string) => {
      archive({ itemId: itemId as any });
    },
    [archive],
  );

  if (items === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  const pending = items.filter((i: any) => i.status === "pending");
  const snoozed = items.filter((i: any) => i.status === "snoozed");

  const sections = [
    ...(pending.length > 0 ? [{ title: "Pending", data: pending }] : []),
    ...(snoozed.length > 0 ? [{ title: "Snoozed", data: snoozed }] : []),
  ];

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item: any) => item._id}
        renderItem={({ item }: { item: any }) => (
          <DecisionCard
            item={item}
            onAct={handleAct}
            onArchive={handleArchive}
          />
        )}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        contentContainerStyle={
          sections.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Your deck is clear</Text>
            <Text style={styles.emptySubtext}>
              New items will appear here when they need your attention
            </Text>
          </View>
        }
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  listContent: { paddingTop: 8, paddingBottom: 24 },
  sectionHeader: {
    color: "#888",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { alignItems: "center", padding: 24 },
  emptyTitle: { color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 8 },
  emptySubtext: { color: "#888", fontSize: 15, textAlign: "center" },
});
