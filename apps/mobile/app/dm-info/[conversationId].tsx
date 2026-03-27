import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { MemberListItem } from "@/components/MemberListItem";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getDMDisplayName } from "@/lib/dmDisplayName";

export default function DMInfoScreen() {
  const { conversationId } = useLocalSearchParams<{
    conversationId: string;
  }>();
  const typedConversationId = conversationId as Id<"directConversations">;

  const conversation = useQuery(api.directConversations.get, {
    conversationId: typedConversationId,
  });
  const { user } = useCurrentUser();

  if (conversation === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  const members = conversation?.members ?? [];
  const displayName = getDMDisplayName(
    conversation?.name,
    members,
    user?._id,
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: displayName,
          headerStyle: { backgroundColor: "#111" },
          headerTintColor: "#fff",
        }}
      />

      <View style={styles.header}>
        <Text style={styles.conversationName}>{displayName}</Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Members ({members.length})</Text>
      </View>

      <FlatList
        data={members}
        keyExtractor={(item: any) => item.userId}
        renderItem={({ item }: { item: any }) => (
          <MemberListItem
            name={item.name ?? "Unknown"}
            isAgent={item.isAgent}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  header: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: "#111",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333",
  },
  conversationName: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#111",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333",
    marginTop: 16,
  },
  sectionTitle: {
    color: "#888",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
