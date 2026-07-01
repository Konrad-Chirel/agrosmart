// @ts-nocheck
import { MaterialIcons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { Screen } from "../components/Screen";
import { useOnboarding } from "../data/onboardingState";
import { AgrosmartService } from "../services/AgrosmartService";
import { colors, fonts, radius, shadow, spacing } from "../theme";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "WelcomeSuccess">;

export function WelcomeSuccessScreen({ navigation, route }: Props) {
  const { firstName, profileImage, crop } = useOnboarding();
  const { heureRecommandee } = route.params || {};
  const displayName = firstName.trim() || "Koffi";
  const pluralCrop = crop.name.endsWith("s") ? crop.name : `${crop.name}s`;

  // Animations
  const avatarFloat = useRef(new Animated.Value(0)).current;
  const haloPulse = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.sequence([
      Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(checkScale, { toValue: 1, friction: 6, tension: 120, useNativeDriver: true }),
    ]).start();

    // Float loop
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(avatarFloat, { toValue: -12, duration: 1500, useNativeDriver: true }),
        Animated.timing(avatarFloat, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    );
    const haloLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(haloPulse, { toValue: 1.12, duration: 1100, useNativeDriver: true }),
        Animated.timing(haloPulse, { toValue: 0.9, duration: 900, useNativeDriver: true }),
      ])
    );
    floatLoop.start();
    haloLoop.start();

    return () => { floatLoop.stop(); haloLoop.stop(); };
  }, []);

  const handleOpenDashboard = () => {
    navigation.replace("MainTabs");
  };

  // Avatar image with fallback to Unsplash farmer image
  const avatarSource = profileImage
    ? { uri: profileImage }
    : { uri: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&q=80" };

  return (
    <Screen contentStyle={styles.wrap}>
      {/* Top nav */}
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={26} color={colors.primary} />
        </Pressable>
        <View style={styles.progressDots}>
          <View style={styles.dotInactive} />
          <View style={styles.dotInactive} />
          <View style={styles.dotInactive} />
          <View style={styles.dotActive} />
          <View style={styles.dotInactive} />
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Hero avatar with floating animation */}
      <Animated.View style={[styles.avatarArea, { opacity: fadeIn, transform: [{ translateY: avatarFloat }] }]}>
        {/* Halo ring */}
        <Animated.View style={[styles.halo, { transform: [{ scale: haloPulse }] }]} />
        {/* Photo */}
        <View style={styles.avatarCircle}>
          <Image source={avatarSource} style={styles.avatarImage} />
        </View>
        {/* Orange checkmark badge */}
        <Animated.View style={[styles.checkBadge, { transform: [{ scale: checkScale }] }]}>
          <MaterialIcons name="check" size={28} color="#1a1a1a" />
        </Animated.View>
      </Animated.View>

      {/* Text */}
      <Animated.View style={{ opacity: fadeIn }}>
        <Text style={styles.title}>Vous êtes prêt, {displayName} ! 🎉</Text>
        <Text style={styles.subtitle}>
          Votre programme d'arrosage pour vos{"\n"}
          <Text style={styles.subtitleBold}>{pluralCrop}</Text> est prêt.
        </Text>
      </Animated.View>

      {/* Summary card */}
      <Animated.View style={[styles.card, { opacity: fadeIn }]}>
        {/* Culture row */}
        <View style={styles.cardRow}>
          <View style={styles.cardRowLeft}>
            <View style={styles.iconWrapOrange}>
              <MaterialIcons name="local-dining" size={20} color="#c2410c" />
            </View>
            <Text style={styles.rowLabel}>Culture</Text>
          </View>
          <Text style={styles.rowValue}>{crop.emoji} {crop.name}</Text>
        </View>

        {/* Stade + Prochain arrosage */}
        <View style={styles.twoCol}>
          <View style={styles.smallCell}>
            <Text style={styles.smallLabel}>Stade</Text>
            <View style={styles.smallRow}>
              <MaterialIcons name="eco" size={18} color={colors.primary} />
              <Text style={styles.smallValue} numberOfLines={1}>{crop.stage || "Germination"}</Text>
            </View>
          </View>
          <View style={styles.smallCell}>
            <Text style={styles.smallLabel}>Prochain arrosage</Text>
            <View style={styles.smallRow}>
              <MaterialIcons name="schedule" size={18} color="#ff9500" />
              <Text style={styles.smallValue}>{heureRecommandee || "06h30"}</Text>
            </View>
          </View>
        </View>

        {/* Cycle duration */}
        <View style={styles.cycleBand}>
          <View style={styles.cycleBandLeft}>
            <MaterialIcons name="calendar-today" size={20} color="#dcfce7" />
            <Text style={styles.cycleBandText}>Durée du cycle</Text>
          </View>
          <Text style={styles.cycleBandValue}>{crop.durationWeeks} semaines</Text>
        </View>
      </Animated.View>

      {/* CTA */}
      <AppButton
        label="Accéder à mon tableau de bord"
        icon="arrow-forward"
        iconPosition="right"
        onPress={handleOpenDashboard}
        style={{ marginTop: 4 }}
      />

      <Text style={styles.note}>
        Vous recevrez une notification 10 minutes avant chaque cycle.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.mobile,
    paddingTop: 8,
    paddingBottom: 32,
    alignItems: "stretch",
  },

  // Top nav
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: radius.full },
  progressDots: { flexDirection: "row", gap: 6, alignItems: "center" },
  dotInactive: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.outline },
  dotActive: { width: 28, height: 8, borderRadius: 4, backgroundColor: colors.primary },

  // Hero
  avatarArea: { alignSelf: "center", width: 220, height: 220, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  halo: { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: colors.primary, opacity: 0.08 },
  avatarCircle: {
    width: 190,
    height: 190,
    borderRadius: 95,
    overflow: "hidden",
    borderWidth: 6,
    borderColor: "#fff",
    ...shadow.lift,
  },
  avatarImage: { width: "100%", height: "100%" },
  checkBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#ff9500",
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  // Text
  title: { fontSize: 26, fontFamily: fonts.heading, color: colors.primary, textAlign: "center", marginBottom: 10 },
  subtitle: { fontSize: 16, fontFamily: fonts.body, color: colors.onSurfaceVariant, textAlign: "center", lineHeight: 24, marginBottom: 24 },
  subtitleBold: { fontFamily: fonts.heading, color: colors.onSurface },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.outline,
    overflow: "hidden",
    marginBottom: 24,
    ...shadow.card,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.md,
    margin: 10,
    marginBottom: 6,
  },
  cardRowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconWrapOrange: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#ffedd5", alignItems: "center", justifyContent: "center" },
  rowLabel: { fontSize: 15, fontFamily: fonts.bodyMedium, color: colors.onSurface },
  rowValue: { fontSize: 18, fontFamily: fonts.heading, color: colors.onSurface },

  twoCol: { flexDirection: "row", gap: 8, paddingHorizontal: 10, marginBottom: 6 },
  smallCell: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.md,
    padding: 14,
  },
  smallLabel: { fontSize: 12, fontFamily: fonts.body, color: colors.onSurfaceVariant, marginBottom: 8 },
  smallRow: { flexDirection: "row", gap: 6, alignItems: "center" },
  smallValue: { fontSize: 16, fontFamily: fonts.heading, color: colors.onSurface, flex: 1 },

  cycleBand: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.primary,
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cycleBandLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  cycleBandText: { fontSize: 15, fontFamily: fonts.bodyMedium, color: "#dcfce7" },
  cycleBandValue: { fontSize: 16, fontFamily: fonts.heading, color: "#ffffff" },

  // Saving
  saving: { minHeight: 56, alignItems: "center", justifyContent: "center", gap: 8 },
  savingText: { fontSize: 13, fontFamily: fonts.body, color: colors.primary },

  note: { fontSize: 13, fontFamily: fonts.body, color: colors.onSurfaceVariant, textAlign: "center", marginTop: 16, lineHeight: 20 },
});
