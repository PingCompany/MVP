import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { ConvexProviderWithAuth, ConvexReactClient, useConvexAuth as useConvexAuthState } from "convex/react";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useConvexAuth } from "@/hooks/useConvexAuth";
import { WorkspaceProvider } from "@/components/WorkspaceProvider";
import { useEffect } from "react";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

function AuthGate() {
  const { isLoading, isAuthenticated } = useConvexAuthState();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inLoginScreen = segments[0] === "login";

    if (!isAuthenticated && !inLoginScreen) {
      router.replace("/login");
    } else if (isAuthenticated && inLoginScreen) {
      router.replace("/(tabs)");
    }
  }, [isLoading, isAuthenticated, segments]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  if (isAuthenticated) {
    return (
      <WorkspaceProvider>
        <Slot />
      </WorkspaceProvider>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useConvexAuth}>
      <AuthGate />
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
