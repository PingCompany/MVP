import { useState, useCallback } from "react";
import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  Switch,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { MessageBubble } from "@/components/MessageBubble";
import { MessageComposer } from "@/components/MessageComposer";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function ThreadScreen() {
  const { messageId, channelId } = useLocalSearchParams<{
    messageId: string;
    channelId: string;
  }>();
  const typedThreadId = messageId as Id<"messages">;
  const typedChannelId = channelId as Id<"channels">;

  const thread = useQuery(api.threads.listReplies, {
    threadId: typedThreadId,
  });
  const sendReply = useMutation(api.threads.sendReply);
  const { user } = useCurrentUser();

  const [alsoSendToChannel, setAlsoSendToChannel] = useState(false);

  const handleSend = useCallback(
    (body: string) => {
      if (!body) return;
      sendReply({
        channelId: typedChannelId,
        threadId: typedThreadId,
        body,
        alsoSendToChannel,
      });
    },
    [sendReply, typedChannelId, typedThreadId, alsoSendToChannel],
  );

  if (thread === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen
        options={{
          title: "Thread",
          headerStyle: { backgroundColor: "#111" },
          headerTintColor: "#fff",
        }}
      />

      <FlatList
        data={thread.replies}
        keyExtractor={(item: any) => item._id}
        ListHeaderComponent={
          <View>
            <MessageBubble
              authorName={thread.parent.author?.name ?? "Unknown"}
              body={thread.parent.body}
              timestamp={thread.parent._creationTime}
              isOwn={thread.parent.authorId === user?._id}
              type={thread.parent.type}
            />
            <View style={styles.divider}>
              <Text style={styles.dividerText}>
                {thread.replies.length}{" "}
                {thread.replies.length === 1 ? "reply" : "replies"}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }: { item: any }) => (
          <MessageBubble
            authorName={item.author?.name ?? "Unknown"}
            body={item.body}
            timestamp={item._creationTime}
            isOwn={item.authorId === user?._id}
            type={item.type}
          />
        )}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={
          <View style={styles.emptyMessages}>
            <Text style={styles.emptyText}>No replies yet</Text>
          </View>
        }
      />

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Also send to channel</Text>
        <Switch
          value={alsoSendToChannel}
          onValueChange={setAlsoSendToChannel}
          trackColor={{ false: "#333", true: "#0a7ea4" }}
          thumbColor="#fff"
        />
      </View>

      <MessageComposer onSend={handleSend} placeholder="Reply in thread..." />
    </KeyboardAvoidingView>
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
  messageList: {
    paddingVertical: 8,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#333",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333",
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  dividerText: {
    fontSize: 13,
    color: "#888",
    fontWeight: "600",
  },
  emptyMessages: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyText: {
    color: "#888",
    fontSize: 14,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#333",
    backgroundColor: "#111",
  },
  toggleLabel: {
    fontSize: 14,
    color: "#999",
  },
});
