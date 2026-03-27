import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { ConversationListItem } from "@/components/ConversationListItem";
import { useRouter } from "expo-router";

export default function DMsScreen() {
  const conversations = useQuery(api.directConversations.list);
  const router = useRouter();

  if (conversations === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item: any) => item._id}
        renderItem={({ item }: { item: any }) => {
          // Build display name from members (excluding current user)
          const displayName =
            item.name ??
            item.members
              ?.map((m: any) => m.name)
              .join(", ") ??
            "Conversation";

          return (
            <ConversationListItem
              name={displayName}
              lastMessage={item.lastMessage?.body}
              lastMessageAuthor={item.lastMessage?.authorName}
              unreadCount={item.unreadCount ?? 0}
              timestamp={item.lastMessage?._creationTime}
              onPress={() =>
                router.push({
                  pathname: "/dm/[conversationId]",
                  params: { conversationId: item._id },
                })
              }
            />
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>
              Start a conversation from the web app
            </Text>
          </View>
        }
        contentContainerStyle={
          conversations.length === 0 ? styles.emptyContainer : undefined
        }
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
  empty: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyText: {
    color: "#888",
    fontSize: 16,
    marginBottom: 4,
  },
  emptySubtext: {
    color: "#666",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
  },
});
