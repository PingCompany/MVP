import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useWorkspace } from "@/hooks/useWorkspace";
import { ChannelListItem } from "@/components/ChannelListItem";
import { useRouter } from "expo-router";

export default function ChannelsScreen() {
  const { workspaceId } = useWorkspace();
  const channels = useQuery(api.channels.list, { workspaceId });
  const router = useRouter();

  if (channels === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  const myChannels = channels.filter((c: any) => c.isMember && !c.isArchived);
  const otherChannels = channels.filter((c: any) => !c.isMember && !c.isArchived);

  return (
    <View style={styles.container}>
      <FlatList
        data={[...myChannels, ...otherChannels]}
        keyExtractor={(item: any) => item._id}
        renderItem={({ item }: { item: any }) => (
          <ChannelListItem
            name={item.name}
            unreadCount={item.unreadCount ?? 0}
            isStarred={item.isStarred ?? false}
            onPress={() =>
              router.push({
                pathname: "/channel/[channelId]",
                params: { channelId: item._id },
              })
            }
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No channels yet</Text>
          </View>
        }
        contentContainerStyle={channels.length === 0 ? styles.emptyContainer : undefined}
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
  },
  emptyContainer: {
    flex: 1,
  },
});
