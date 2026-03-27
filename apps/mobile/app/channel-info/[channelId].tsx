import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { MemberListItem } from "@/components/MemberListItem";

export default function ChannelInfoScreen() {
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const typedChannelId = channelId as Id<"channels">;

  const channel = useQuery(api.channels.get, { channelId: typedChannelId });
  const members = useQuery(api.channels.listMembers, {
    channelId: typedChannelId,
  });

  if (channel === undefined || members === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: channel ? `# ${channel.name}` : "Channel Info",
          headerStyle: { backgroundColor: "#111" },
          headerTintColor: "#fff",
        }}
      />

      <View style={styles.header}>
        <Text style={styles.hashIcon}>#</Text>
        <Text style={styles.channelName}>{channel?.name}</Text>
        {channel?.description ? (
          <Text style={styles.description}>{channel.description}</Text>
        ) : null}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Members ({members?.length ?? 0})
        </Text>
      </View>

      <FlatList
        data={members}
        keyExtractor={(item: any) => item._id}
        renderItem={({ item }: { item: any }) => (
          <MemberListItem
            name={item.name ?? "Unknown"}
            role={item.role}
            isOnline={item.presenceStatus === "online"}
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
