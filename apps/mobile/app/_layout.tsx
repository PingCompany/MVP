import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useConvexAuth } from "@/hooks/useConvexAuth";
import { WorkspaceProvider } from "@/components/WorkspaceProvider";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

function AuthGate({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthLoading>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0a7ea4" />
        </View>
      </AuthLoading>

      <Unauthenticated>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" />
        </Stack>
      </Unauthenticated>

      <Authenticated>
        <WorkspaceProvider>{children}</WorkspaceProvider>
      </Authenticated>
    </>
  );
}

function AppLayout() {
  return (
    <AuthGate>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#111" },
          headerTintColor: "#fff",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="channel/[channelId]" options={{ headerShown: true }} />
        <Stack.Screen name="dm/[conversationId]" options={{ headerShown: true }} />
      </Stack>
    </AuthGate>
  );
}

export default function RootLayout() {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useConvexAuth}>
      <AppLayout />
      <StatusBar style="light" />
    </ConvexProviderWithAuth>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
});
