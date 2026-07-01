import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import type { IconName } from "../data/mockData";
import { colors, fonts, radius, shadow, type } from "../theme";

type Props = { label: string; value: string; icon: IconName | any; tone?: string };

export function DataCard({ label, value, icon, tone = colors.primary }: Props) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: `${tone}20` }]}>
        <MaterialIcons name={icon as any} size={26} color={tone} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: "46%",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: 20,
    alignItems: "center", // Center align everything as per mockups
    ...shadow.card,
  },
  iconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  label: { ...type.label, fontFamily: fonts.bodyMedium, color: colors.onSurfaceVariant }, // Normal casing, medium weight
  value: { fontSize: 36, lineHeight: 44, fontFamily: fonts.headingExtra, color: colors.primary, marginTop: 4 }, // Big bold primary text
});
