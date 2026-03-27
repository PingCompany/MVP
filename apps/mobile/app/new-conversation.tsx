import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getInitials } from "@/lib/initials";
import { useRouter, Stack } from "expo-router";

export default function NewConversationScreen() {
  const [filter, setFilter] = useState("");
  const { workspaceId } = useWorkspace();
  const { user } = useCurrentUser();
  const router = useRouter();
  const users = useQuery(api.users.listAll, { workspaceId });
  const createConversation = useMutation(api.directConversations.create);

  const filteredUsers = (users ?? []).filter((u) => {
    if (u._id === user?._id) return false;
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  async function handleSelect(userId: Id<"users">) {
    const conversationId = await createConversation({
      kind: "1to1",
      memberIds: [userId],
      workspaceId,
    });
    router.replace({
      pathname: "/dm/[conversationId]",
      params: { conversationId },
    });
  }

  return (
    <>
      <Stack.Screen options={{ title: "New Conversation" }} />
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          placeholder="Search people..."
          placeholderTextColor="#666"
          value={filter}
          onChangeText={setFilter}
          autoFocus
        />
        {users === undefined ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#0a7ea4" />
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => {
              const initials = getInitials(item.name ?? "?");
              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.row,
                    pressed && styles.rowPressed,
                  ]}
                  onPress={() => handleSelect(item._id)}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.name}>{item.name}</Text>
                    {item.email ? (
                      <Text style={styles.email}>{item.email}</Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>
                  {filter ? "No matching users" : "No users found"}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  input: {
    backgroundColor: "#222",
    color: "#fff",
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 16,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#333",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#222",
    gap: 12,
  },
  rowPressed: { backgroundColor: "#1a1a1a" },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  info: { flex: 1 },
  name: { fontSize: 16, color: "#fff", fontWeight: "500" },
  email: { fontSize: 14, color: "#888", marginTop: 2 },
  empty: { alignItems: "center", paddingTop: 40 },
  emptyText: { color: "#888", fontSize: 16 },
});
