import { useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  ActionSheetIOS,
  Platform,
  Alert,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { MemberListItem } from "@/components/MemberListItem";
import { AttachmentPreview } from "@/components/AttachmentPreview";
import { useWorkspace } from "@/hooks/useWorkspace";
import {
  FileIcon,
  ImageIcon,
  Star,
  Bell,
  BellOff,
  FolderPlus,
  Lock,
  Globe,
  Unlock,
  Archive,
} from "lucide-react-native";

export default function ConversationInfoScreen() {
  const { conversationId } = useLocalSearchParams<{
    conversationId: string;
  }>();
  const typedConversationId = conversationId as Id<"conversations">;
  const { workspaceId } = useWorkspace();

  const conversation = useQuery(api.conversations.get, {
    conversationId: typedConversationId,
  });
  const members = useQuery(api.conversations.listMembers, {
    conversationId: typedConversationId,
  });
  const allConversations = useQuery(api.conversations.list, { workspaceId });
  const toggleStar = useMutation(api.conversations.toggleStar);
  const toggleMute = useMutation(api.conversations.toggleMute);
  const setFolderMut = useMutation(api.conversations.setFolder);
  const archiveMut = useMutation(api.conversations.archive);

  const existingFolders = useMemo(() => {
    const set = new Set<string>();
    if (allConversations) {
      for (const c of allConversations) {
        if ((c as any).folder) set.add((c as any).folder);
      }
    }
    return Array.from(set).sort();
  }, [allConversations]);

  const messagesData = useQuery(api.messages.list, {
    conversationId: typedConversationId,
  });

  const { sharedFiles, images, files } = useMemo(() => {
    const collected: {
      storageId: string;
      filename: string;
      mimeType: string;
      size: number;
      timestamp: number;
      authorName: string;
    }[] = [];
    if (messagesData) {
      for (const msg of Array.isArray(messagesData) ? messagesData : []) {
        if ((msg as any).attachments) {
          for (const att of (msg as any).attachments) {
            collected.push({
              ...att,
              timestamp: msg._creationTime,
              authorName: (msg as any).author?.name ?? "Unknown",
            });
          }
        }
      }
    }
    return {
      sharedFiles: collected,
      images: collected.filter((f) => f.mimeType?.startsWith("image/")),
      files: collected.filter((f) => !f.mimeType?.startsWith("image/")),
    };
  }, [messagesData]);

  if (conversation === undefined || members === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  const isChannel = (conversation as any)?.kind === "channel";
  const displayName = isChannel
    ? (conversation as any)?.name
    : (conversation as any)?.name ?? "Conversation";

  const visibility = (conversation as any)?.visibility as
    | "public"
    | "secret"
    | "secret_can_be_public"
    | undefined;

  const VisibilityIcon =
    visibility === "public"
      ? Globe
      : visibility === "secret_can_be_public"
        ? Unlock
        : Lock;
  const visibilityLabel =
    visibility === "public"
      ? "Public"
      : visibility === "secret_can_be_public"
        ? "Secret (can be public)"
        : visibility === "secret"
          ? "Secret"
          : null;

  const memberList = Array.isArray(members) ? members : [];

  return (
    <FlatList
      style={styles.container}
      data={memberList}
      keyExtractor={(item: any, index: number) => item._id ?? item.userId ?? `member-${index}`}
      ListHeaderComponent={
        <>
          <Stack.Screen
            options={{
              title: isChannel ? `# ${displayName}` : displayName,
              headerStyle: { backgroundColor: "#111" },
              headerTintColor: "#fff",
            }}
          />

          <View style={styles.header}>
            {isChannel && <Text style={styles.hashIcon}>#</Text>}
            <Text style={styles.channelName}>{displayName}</Text>
            {(conversation as any)?.description ? (
              <Text style={styles.description}>
                {(conversation as any).description}
              </Text>
            ) : null}
            {visibilityLabel && (
              <View style={styles.visibilityBadge}>
                <VisibilityIcon size={14} color="#888" />
                <Text style={styles.visibilityText}>{visibilityLabel}</Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <Pressable
              style={styles.actionBtn}
              onPress={async () => {
                const result = await toggleStar({
                  conversationId: typedConversationId,
                });
                Alert.alert(
                  result ? "Added to Favorites" : "Removed from Favorites",
                );
              }}
            >
              <Star
                size={20}
                color={
                  (conversation as any)?.isStarred ? "#f59e0b" : "#888"
                }
                fill={
                  (conversation as any)?.isStarred
                    ? "#f59e0b"
                    : "transparent"
                }
              />
              <Text
                style={[
                  styles.actionLabel,
                  (conversation as any)?.isStarred && { color: "#f59e0b" },
                ]}
              >
                {(conversation as any)?.isStarred ? "Starred" : "Star"}
              </Text>
            </Pressable>

            <Pressable
              style={styles.actionBtn}
              onPress={async () => {
                const result = await toggleMute({
                  conversationId: typedConversationId,
                });
                Alert.alert(
                  result
                    ? "Notifications muted"
                    : "Notifications unmuted",
                );
              }}
            >
              {(conversation as any)?.isMuted ? (
                <BellOff size={20} color="#ef4444" />
              ) : (
                <Bell size={20} color="#888" />
              )}
              <Text
                style={[
                  styles.actionLabel,
                  (conversation as any)?.isMuted && { color: "#ef4444" },
                ]}
              >
                {(conversation as any)?.isMuted ? "Muted" : "Mute"}
              </Text>
            </Pressable>

            <Pressable
              style={styles.actionBtn}
              onPress={() => {
                if (Platform.OS === "ios") {
                  const hasFolder = !!(conversation as any)?.folder;
                  const options = ["Cancel"];
                  if (hasFolder) options.push("Remove from folder");
                  for (const f of existingFolders) options.push(f);
                  options.push("+ New folder...");
                  const destructiveIndex = hasFolder ? 1 : -1;

                  ActionSheetIOS.showActionSheetWithOptions(
                    {
                      options,
                      cancelButtonIndex: 0,
                      destructiveButtonIndex: destructiveIndex,
                    },
                    async (index) => {
                      if (index === 0) return;
                      if (hasFolder && index === 1) {
                        await setFolderMut({
                          conversationId: typedConversationId,
                          folder: undefined,
                        });
                        Alert.alert("Removed from folder");
                        return;
                      }
                      const offset = hasFolder ? 2 : 1;
                      const folderIdx = index - offset;
                      if (folderIdx < existingFolders.length) {
                        const f = existingFolders[folderIdx];
                        await setFolderMut({
                          conversationId: typedConversationId,
                          folder: f,
                        });
                        Alert.alert(`Moved to ${f}`);
                      } else {
                        Alert.prompt(
                          "New Folder",
                          "Enter folder name",
                          async (name) => {
                            if (name?.trim()) {
                              await setFolderMut({
                                conversationId: typedConversationId,
                                folder: name.trim(),
                              });
                              Alert.alert(`Moved to ${name.trim()}`);
                            }
                          },
                        );
                      }
                    },
                  );
                }
              }}
            >
              <FolderPlus
                size={20}
                color={
                  (conversation as any)?.folder ? "#0a7ea4" : "#888"
                }
              />
              <Text
                style={[
                  styles.actionLabel,
                  (conversation as any)?.folder && { color: "#0a7ea4" },
                ]}
              >
                {(conversation as any)?.folder ?? "Folder"}
              </Text>
            </Pressable>

            <Pressable
              style={styles.actionBtn}
              onPress={() => {
                Alert.alert(
                  "Archive",
                  "Are you sure you want to archive this conversation?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Archive",
                      style: "destructive",
                      onPress: () =>
                        archiveMut({
                          conversationId: typedConversationId,
                        }),
                    },
                  ],
                );
              }}
            >
              <Archive size={20} color="#888" />
              <Text style={styles.actionLabel}>Archive</Text>
            </Pressable>
          </View>

          {/* Shared Images */}
          {images.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionRow}>
                  <ImageIcon size={16} color="#888" />
                  <Text style={styles.sectionTitle}>
                    Photos ({images.length})
                  </Text>
                </View>
              </View>
              <FlatList
                horizontal
                data={images}
                keyExtractor={(_, i) => `img-${i}`}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imageRow}
                renderItem={({ item }) => (
                  <AttachmentPreview
                    storageId={item.storageId as any}
                    filename={item.filename}
                    mimeType={item.mimeType}
                    size={item.size}
                  />
                )}
              />
            </>
          )}

          {/* Shared Files */}
          {files.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionRow}>
                  <FileIcon size={16} color="#888" />
                  <Text style={styles.sectionTitle}>
                    Files ({files.length})
                  </Text>
                </View>
              </View>
              {files.map((f, i) => (
                <View key={`file-${i}`} style={styles.fileRow}>
                  <AttachmentPreview
                    storageId={f.storageId as any}
                    filename={f.filename}
                    mimeType={f.mimeType}
                    size={f.size}
                  />
                </View>
              ))}
            </>
          )}

          {sharedFiles.length === 0 && (
            <>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionRow}>
                  <FileIcon size={16} color="#888" />
                  <Text style={styles.sectionTitle}>Shared Files</Text>
                </View>
              </View>
              <View style={styles.emptyFiles}>
                <Text style={styles.emptyText}>No shared files yet</Text>
              </View>
            </>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Members ({memberList.length})
            </Text>
          </View>
        </>
      }
      renderItem={({ item }: { item: any }) => (
        <MemberListItem
          name={item.name ?? "Unknown"}
          role={item.role}
          isOnline={item.presenceStatus === "online"}
          isAgent={item.isAgent}
        />
      )}
    />
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
  hashIcon: {
    color: "#888",
    fontSize: 40,
    fontWeight: "700",
    marginBottom: 8,
  },
  channelName: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  description: {
    color: "#888",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  visibilityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#222",
  },
  visibilityText: {
    color: "#888",
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 32,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333",
    backgroundColor: "#111",
  },
  actionBtn: {
    alignItems: "center",
    gap: 6,
  },
  actionLabel: {
    fontSize: 12,
    color: "#888",
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#111",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333",
    marginTop: 16,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    color: "#888",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  imageRow: {
    padding: 12,
    gap: 8,
  },
  fileRow: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  emptyFiles: {
    alignItems: "center",
    paddingVertical: 20,
  },
  emptyText: {
    color: "#666",
    fontSize: 14,
  },
});
