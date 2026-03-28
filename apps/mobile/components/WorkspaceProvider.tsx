import { ReactNode } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useConvexAuth } from "convex/react";
import { WorkspaceContext, useWorkspaceData } from "@/hooks/useWorkspace";

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useConvexAuth();
  const { workspaces, isLoading } = useWorkspaceData();

  // When not authenticated, just render children without workspace context
  // (login screens don't need it, and this avoids race conditions with expo-router)
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  if (!workspaces || workspaces.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>No workspace found</Text>
        <Text style={styles.subtext}>
          Please join a workspace from the web app first.
        </Text>
      </View>
    );
  }

  // V1: auto-select first workspace
  const workspace = workspaces[0];

  return (
    <WorkspaceContext.Provider
      value={{
        workspaceId: workspace.workspaceId,
        workspaceName: workspace.name,
        workspaceSlug: workspace.slug,
        role: workspace.role,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  text: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  subtext: {
    color: "#888",
    fontSize: 14,
  },
});
