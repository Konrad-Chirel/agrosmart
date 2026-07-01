import { MaterialIcons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useOnboarding } from "../data/onboardingState";
import { colors, fonts, radius, type } from "../theme";

type Props = {
  title?: string;
  back?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
};

export function AppHeader({ title = "AgroSmart", back, onBack, rightElement }: Props) {
  const { profileImage } = useOnboarding();

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        <Pressable onPress={onBack} style={styles.iconBtn}>
          <MaterialIcons name={back ? "arrow-back" : "menu"} size={28} color={colors.primary} />
        </Pressable>
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={styles.brand}>{title}</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        {rightElement}
        <Image source={{ uri: profileImage }} style={styles.avatar} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { height: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  left: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12, paddingRight: 12 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: radius.full },
  brand: { flexShrink: 1, ...type.h1Mobile, fontFamily: fonts.heading, color: colors.primary },
  avatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: colors.primaryFixed },
});
