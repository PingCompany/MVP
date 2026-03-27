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
import { useLocalSearchParams, Stack } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { MessageBubble } from "@/components/MessageBubble";
import { MessageComposer } from "@/components/MessageComposer";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function ChannelDetailScreen() {
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const typedChannelId = channelId as Id<"channels">;

  const channel = useQuery(api.channels.get, { channelId: typedChannelId });
  const messages = useQuery(api.messages.listByChannel, {
    channelId: typedChannelId,
  });
  const markRead = useMutation(api.channels.markRead);
  const sendMessage = useMutation(api.messages.send);
  const joinChannel = useMutation(api.channels.join);
  const { user } = useCurrentUser();

  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (channel?.isMember) {
      markRead({ channelId: typedChannelId });
    }
  }, [channel?.isMember, typedChannelId]);

  const handleSend = useCallback(
    (body: string) => {
      if (!body) return;
      sendMessage({ channelId: typedChannelId, body });
    },
    [sendMessage, typedChannelId],
  );

  const handleJoin = async () => {
    setJoining(true);
    try {
      await joinChannel({ channelId: typedChannelId });
    } finally {
      setJoining(false);
    }
  };

  if (messages === undefined || channel === undefined) {
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
          title: channel ? `# ${channel.name}` : "Channel",
          headerStyle: { backgroundColor: "#111" },
          headerTintColor: "#fff",
        }}
      />

      <FlatList
        data={messages}
        keyExtractor={(item: any) => item._id}
        renderItem={({ item }: { item: any }) => (
          <MessageBubble
            authorName={item.author?.name ?? "Unknown"}
            body={item.body}
            timestamp={item._creationTime}
            isOwn={item.authorId === user?._id}
            type={item.type}
          />
        )}
        inverted
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={
          <View style={styles.emptyMessages}>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Be the first to say something!</Text>
          </View>
        }
      />

      {channel?.isMember ? (
        <MessageComposer
          onSend={handleSend}
          placeholder={`Message #${channel?.name ?? ""}...`}
        />
      ) : (
        <View style={styles.joinBar}>
          <Pressable
            style={[styles.joinBtn, joining && styles.joinBtnDisabled]}
            onPress={handleJoin}
            disabled={joining}
          >
            <Text style={styles.joinBtnText}>
              {joining ? "Joining..." : "Join Channel"}
            </Text>
          </Pressable>
        </View>
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
    // Inverted FlatList flips the empty component
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
});
