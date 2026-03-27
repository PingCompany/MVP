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
          title: "My Deck",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>{"📥"}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="communications"
        options={{
          title: "Comms",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>{"💬"}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>{"👤"}</Text>
          ),
        }}
      />
    </Tabs>
  );
}
