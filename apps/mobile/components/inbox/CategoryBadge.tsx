import { View, Text, StyleSheet } from "react-native";

const COLORS: Record<string, string> = {
  do: "#ef4444",
  decide: "#f97316",
  delegate: "#3b82f6",
  skip: "#6b7280",
};

export function CategoryBadge({ category }: { category: string }) {
  const bg = COLORS[category] ?? "#6b7280";
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={styles.text}>{category.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  text: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
});
