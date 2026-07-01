import { MaterialIcons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { colors, fonts, radius, shadow, type } from "../theme";
import type { IconName } from "../data/mockData";

type Props = {
  label: string;
  onPress?: () => void;
  icon?: IconName | any; // allow any for string literal
  iconPosition?: "left" | "right";
  variant?: "primary" | "light" | "amber" | "ghost";
  style?: ViewStyle;
  isLoading?: boolean;
};

export function AppButton({ label, onPress, icon, iconPosition = "left", variant = "primary", style, isLoading }: Props) {
  const iconElement = icon && !isLoading ? (
    <MaterialIcons name={icon as any} size={22} color={variant === "light" ? colors.primary : colors.onPrimary} />
  ) : null;

  return (
    <Pressable disabled={isLoading} onPress={onPress} style={({ pressed }) => [styles.base, styles[variant], pressed && styles.pressed, isLoading && styles.disabled, style]}>
      {isLoading ? (
          <ActivityIndicator color={variant === "light" ? colors.primary : colors.onPrimary} />
      ) : iconPosition === "left" && iconElement}
      <Text style={[styles.text, variant === "light" && styles.lightText, variant === "amber" && styles.amberText, variant === "ghost" && styles.ghostText]}>{label}</Text>
      {!isLoading && iconPosition === "right" && iconElement}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 22,
    ...shadow.card,
  },
  primary: { backgroundColor: colors.primary },
  amber: { backgroundColor: colors.secondary }, // Strong orange
  light: { backgroundColor: colors.surfaceContainerLowest },
  ghost: { backgroundColor: "transparent", shadowOpacity: 0, elevation: 0 },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
  text: { ...type.label, fontFamily: fonts.heading, color: colors.onPrimary },
  amberText: { color: "#ffffff" },
  lightText: { color: colors.primary },
  ghostText: { color: colors.onPrimary, textDecorationLine: "underline" },
  disabled: { opacity: 0.7 },
});
