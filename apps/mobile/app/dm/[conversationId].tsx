import { useEffect, useCallback, useState } from "react";
import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { MessageBubble } from "@/components/MessageBubble";
import { MessageComposer } from "@/components/MessageComposer";
import { AttachmentPreview } from "@/components/AttachmentPreview";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { uploadFile } from "@/lib/fileUpload";
import { getDMDisplayName } from "@/lib/dmDisplayName";
import { useConvex } from "convex/react";

// NOTE: Reactions are not supported in DMs. The reactions API (api.reactions.toggle)
// accepts Id<"messages"> and checks channelMembers for authorization. DM messages
// use Id<"directMessages"> which is incompatible. Reactions would need a separate
// backend mutation that handles directMessages to work here.

export default function DMDetailScreen() {
  const { conversationId } = useLocalSearchParams<{
    conversationId: string;
  }>();
  const typedConversationId = conversationId as Id<"directConversations">;

  const conversation = useQuery(api.directConversations.get, {
    conversationId: typedConversationId,
  });
  const { results: messages, status, loadMore } = usePaginatedQuery(
    api.directMessages.list,
    { conversationId: typedConversationId },
    { initialNumItems: 25 },
  );
  const router = useRouter();
  const markRead = useMutation(api.directConversations.markRead);
  const sendMessage = useMutation(api.directMessages.send);
  const { user } = useCurrentUser();
  const convex = useConvex();

  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    markRead({ conversationId: typedConversationId });
  }, [typedConversationId]);

  const handleSend = useCallback(
    async (
      body: string,
      pendingFiles?: Array<{
        uri: string;
        name: string;
        mimeType: string;
        size: number;
      }>,
    ) => {
      setIsSending(true);
      try {
        let attachments;
        if (pendingFiles && pendingFiles.length > 0) {
          attachments = await Promise.all(
            pendingFiles.map((file) => uploadFile(convex, file)),
          );
        }

        await sendMessage({
          conversationId: typedConversationId,
          body: body || " ",
          ...(attachments ? { attachments } : {}),
        });
      } finally {
        setIsSending(false);
      }
    },
    [sendMessage, typedConversationId, convex],
  );

  const handleLoadMore = useCallback(() => {
    if (status === "CanLoadMore") {
      loadMore(25);
    }
  }, [status, loadMore]);

  const displayName = getDMDisplayName(
    conversation?.name,
    conversation?.members ?? [],
    user?._id,
  );

  if (messages === undefined) {
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
          title: displayName,
          headerStyle: { backgroundColor: "#111" },
          headerTintColor: "#fff",
          headerTitle: () => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/dm-info/[conversationId]",
                  params: { conversationId },
                })
              }
            >
              <Text style={styles.headerTitleText}>
                {displayName}
              </Text>
            </Pressable>
          ),
        }}
      />

      <FlatList
        data={messages}
        keyExtractor={(item: any) => item._id}
        renderItem={({ item }: { item: any }) => (
          <View>
            <MessageBubble
              authorName={item.author?.name ?? "Unknown"}
              body={item.body}
              timestamp={item._creationTime}
              isOwn={item.authorId === user?._id}
              type={item.type}
            />
            {item.attachments?.map((att: any, idx: number) => (
              <View key={idx} style={styles.attachment}>
                <AttachmentPreview
                  storageId={att.storageId}
                  filename={att.filename}
                  mimeType={att.mimeType}
                  size={att.size}
                />
              </View>
            ))}
          </View>
        )}
        inverted
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.messageList}
        ListFooterComponent={
          status === "LoadingMore" ? (
            <ActivityIndicator style={styles.loadingMore} color="#0a7ea4" />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyMessages}>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>
              Send the first message!
            </Text>
          </View>
        }
      />

      <MessageComposer
        onSend={handleSend}
        enableAttachments
        placeholder="Message..."
      />
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
  attachment: {
    paddingHorizontal: 16,
  },
  loadingMore: {
    paddingVertical: 16,
  },
  emptyMessages: {
    alignItems: "center",
    paddingVertical: 40,
    transform: [{ scaleY: -1 }],
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
  headerTitleText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
});
