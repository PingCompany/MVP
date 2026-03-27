import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#0a7ea4",
        tabBarInactiveTintColor: "#666",
        tabBarStyle: {
          backgroundColor: "#111",
          borderTopColor: "#333",
        },
        headerStyle: {
          backgroundColor: "#111",
        },
        headerTintColor: "#fff",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inbox",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📥</Text>,
        }}
      />
      <Tabs.Screen
        name="channels"
        options={{
          title: "Channels",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>#</Text>,
        }}
      />
      <Tabs.Screen
        name="dms"
        options={{
          title: "DMs",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>💬</Text>,
        }}
      />
    </Tabs>
  );
}
