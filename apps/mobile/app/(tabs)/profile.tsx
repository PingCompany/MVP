import { View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { signOut } from "@/lib/auth";
import { getInitials } from "@/lib/initials";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const { user, isLoading } = useCurrentUser();
  const router = useRouter();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  const name = user?.name ?? "Unknown";
  const email = user?.email ?? "";
  const initials = getInitials(name);

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{name}</Text>
        {email ? <Text style={styles.email}>{email}</Text> : null}
      </View>
      <View style={styles.spacer} />
      <Pressable
        style={({ pressed }) => [styles.signOutButton, pressed && styles.signOutPressed]}
        onPress={handleSignOut}
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 24 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },
  profileSection: { alignItems: "center", paddingTop: 40 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#333", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  avatarText: { color: "#fff", fontSize: 32, fontWeight: "600" },
  name: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 4 },
  email: { fontSize: 16, color: "#888" },
  spacer: { flex: 1 },
  signOutButton: { backgroundColor: "#222", borderRadius: 12, paddingVertical: 16, alignItems: "center", borderWidth: StyleSheet.hairlineWidth, borderColor: "#333", marginBottom: 32 },
  signOutPressed: { backgroundColor: "#333" },
  signOutText: { color: "#ff4444", fontSize: 16, fontWeight: "600" },
});
