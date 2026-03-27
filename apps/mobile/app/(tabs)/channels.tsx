import { StyleSheet, Text, View } from "react-native";

export default function ChannelsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Channels</Text>
      <Text style={styles.subtitle}>Browse and join workspace channels.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});
