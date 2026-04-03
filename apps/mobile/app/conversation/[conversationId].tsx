import { useEffect, useCallback, useState, useMemo } from "react";
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
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { useQuery, useMutation, useConvex } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { MessageBubble } from "@/components/MessageBubble";
import { MessageComposer } from "@/components/MessageComposer";
import { MessageActionSheet } from "@/components/MessageActionSheet";
import { CollapsibleAttachments } from "@/components/CollapsibleAttachments";
import { DateSeparator } from "@/components/DateSeparator";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useReactions } from "@/hooks/useReactions";
import { TypingIndicator } from "@/components/TypingIndicator";
import { ForwardModal } from "@/components/ForwardModal";
import { IntegrationCard } from "@/components/IntegrationCard";
import { uploadFile } from "@/lib/fileUpload";
import { getDMDisplayName } from "@/lib/dmDisplayName";

function isSameDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

type ListItem =
  | { type: "message"; data: any; showHeader: boolean }
  | { type: "date"; timestamp: number };

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams<{
    conversationId: string;
  }>();
  const typedConversationId = conversationId as Id<"conversations">;

  const conversation = useQuery(api.conversations.get, {
    conversationId: typedConversationId,
  });
  const messages = useQuery(api.messages.listByConversation, {
    conversationId: typedConversationId,
  });
  const markRead = useMutation(api.conversations.markRead);
  const sendMessage = useMutation(api.messages.send);
  const joinConversation = useMutation(api.conversations.join);
  const router = useRouter();
  const { user } = useCurrentUser();
  const convex = useConvex();

  const [joining, setJoining] = useState(false);
  const [actionSheet, setActionSheet] = useState<{
    visible: boolean;
    messageId?: string;
    timestamp?: number;
  }>({ visible: false });
  const [forwardMsg, setForwardMsg] = useState<{
    body: string;
    author: string;
  } | null>(null);

  const messageList = useMemo(
    () => (Array.isArray(messages) ? messages : []),
    [messages],
  );
  const messageIds = useMemo(
    () => messageList.map((m: any) => m._id as Id<"messages">),
    [messageList],
  );
  const { reactionsByMessage, toggleReaction } = useReactions(messageIds);
  const typingUsers = useQuery(api.typing.getTypingUsers, {
    conversationId: typedConversationId,
  });

  const isPublic = conversation?.visibility === "public";

  const displayName = useMemo(() => {
    if (!conversation) return "Conversation";
    if (isPublic) return `# ${conversation.name}`;
    return getDMDisplayName(
      conversation.name,
      conversation.members ?? [],
      user?._id,
    );
  }, [conversation, user?._id, isPublic]);

  useEffect(() => {
    if (conversation?.isMember) {
      markRead({ conversationId: typedConversationId });
    }
  }, [conversation?.isMember, typedConversationId, markRead]);

  const handleSend = useCallback(
    async (
      body: string,
      pendingFiles?: {
        uri: string;
        name: string;
        mimeType: string;
        size: number;
      }[],
    ) => {
      if (!body && (!pendingFiles || pendingFiles.length === 0)) return;

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
    },
    [sendMessage, typedConversationId, convex],
  );

  const handleJoin = async () => {
    setJoining(true);
    try {
      await joinConversation({ conversationId: typedConversationId });
    } finally {
      setJoining(false);
    }
  };

  // Build list items with date separators (inverted, so newest first)
  const listItems = useMemo(() => {
    if (!messageList.length) return [];
    const items: ListItem[] = [];
    for (let i = 0; i < messageList.length; i++) {
      const msg = messageList[i];
      const olderMsg = messageList[i + 1];
      const sameAuthorAbove =
        olderMsg &&
        olderMsg.authorId === msg.authorId &&
        isSameDay(msg._creationTime, olderMsg._creationTime) &&
        msg._creationTime - olderMsg._creationTime < 5 * 60 * 1000;
      items.push({ type: "message", data: msg, showHeader: !sameAuthorAbove });
      if (olderMsg && !isSameDay(msg._creationTime, olderMsg._creationTime)) {
        items.push({ type: "date", timestamp: msg._creationTime });
      }
    }
    if (messageList.length > 0) {
      items.push({
        type: "date",
        timestamp: messageList[messageList.length - 1]._creationTime,
      });
    }
    return items;
  }, [messageList]);

  if (messages === undefined || conversation === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  const placeholder = isPublic
    ? `Message #${conversation?.name ?? ""}...`
    : "Message...";

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
                  pathname: "/conversation-info/[conversationId]" as any,
                  params: { conversationId },
                })
              }
            >
              <Text style={styles.headerTitleText}>{displayName}</Text>
            </Pressable>
          ),
        }}
      />

      <FlatList
        data={listItems}
        keyExtractor={(item, idx) =>
          item.type === "message" ? item.data._id : `date-${idx}`
        }
        renderItem={({ item }) => {
          if (item.type === "date") {
            return <DateSeparator timestamp={item.timestamp} />;
          }
          const msg = item.data;
          const lastParticipant =
            msg.threadParticipants?.[msg.threadParticipants.length - 1];
          return (
            <View>
              <MessageBubble
                authorName={msg.author?.name ?? "Unknown"}
                authorAvatarUrl={msg.author?.avatarUrl}
                body={msg.body}
                timestamp={msg._creationTime}
                isOwn={msg.authorId === user?._id}
                type={msg.type}
                messageId={msg._id}
                reactions={reactionsByMessage[msg._id] ?? []}
                onToggleReaction={(emoji) => toggleReaction(msg._id, emoji)}
                currentUserId={user?._id}
                showHeader={item.showHeader}
                onPress={() =>
                  router.push({
                    pathname: "/thread/[messageId]",
                    params: { messageId: msg._id, conversationId },
                  })
                }
                onLongPress={() =>
                  setActionSheet({
                    visible: true,
                    messageId: msg._id,
                    timestamp: msg._creationTime,
                  })
                }
                threadReplyCount={msg.threadReplyCount}
                threadLastReplyAuthor={lastParticipant?.name}
                threadLastReplyAvatarUrl={lastParticipant?.avatarUrl}
                threadLastReplyAt={msg.threadLastReplyAt}
                onThreadPress={() =>
                  router.push({
                    pathname: "/thread/[messageId]",
                    params: { messageId: msg._id, conversationId },
                  })
                }
              />
              {msg.attachments && msg.attachments.length > 0 && (
                <CollapsibleAttachments attachments={msg.attachments} />
              )}
              {msg.integrationObject && (
                <View style={{ marginLeft: 66, marginRight: 16 }}>
                  <IntegrationCard integration={msg.integrationObject} />
                </View>
              )}
            </View>
          );
        }}
        inverted
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={
          <View style={styles.emptyMessages}>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>
              Be the first to say something!
            </Text>
          </View>
        }
      />

      <TypingIndicator
        userNames={(typingUsers ?? []).map((u: any) => u.name)}
      />

      {!conversation?.isMember && isPublic ? (
        <View style={styles.joinBar}>
          <Pressable
            style={[styles.joinBtn, joining && styles.joinBtnDisabled]}
            onPress={handleJoin}
            disabled={joining}
          >
            <Text style={styles.joinBtnText}>
              {joining ? "Joining..." : "Join Conversation"}
            </Text>
          </Pressable>
        </View>
      ) : (
        <MessageComposer
          onSend={handleSend}
          enableAttachments
          placeholder={placeholder}
        />
      )}

      <MessageActionSheet
        visible={actionSheet.visible}
        onClose={() => setActionSheet({ visible: false })}
        onReaction={(emoji) => {
          if (actionSheet.messageId) {
            toggleReaction(actionSheet.messageId as Id<"messages">, emoji);
          }
        }}
        onReply={() => {
          if (actionSheet.messageId) {
            router.push({
              pathname: "/thread/[messageId]",
              params: { messageId: actionSheet.messageId, conversationId },
            });
          }
        }}
        onForward={() => {
          if (actionSheet.messageId && messageList.length) {
            const msg = messageList.find(
              (m: any) => m._id === actionSheet.messageId,
            );
            if (msg) {
              setForwardMsg({
                body: msg.body,
                author: (msg as any).author?.name ?? "Unknown",
              });
            }
          }
          setActionSheet({ visible: false });
        }}
        onCopyLink={() => {
          if (actionSheet.messageId) {
            Clipboard.setStringAsync(
              `https://openping.app/conversation/${conversationId}?msg=${actionSheet.messageId}`,
            );
          }
        }}
        messageDate={actionSheet.timestamp ?? Date.now()}
      />

      {forwardMsg && (
        <ForwardModal
          visible={!!forwardMsg}
          onClose={() => setForwardMsg(null)}
          messageBody={forwardMsg.body}
          authorName={forwardMsg.author}
        />
      )}
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
  joinBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#333",
    backgroundColor: "#111",
    padding: 12,
    alignItems: "center",
  },
  joinBtn: {
    backgroundColor: "#0a7ea4",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  joinBtnDisabled: {
    opacity: 0.5,
  },
  joinBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  headerTitleText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
});
