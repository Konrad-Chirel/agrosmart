import { MaterialIcons } from "@expo/vector-icons";
import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppHeader } from "../components/AppHeader";
import { Screen } from "../components/Screen";
import { AgrosmartService } from "../services/AgrosmartService";
import { colors, fonts, radius, shadow, spacing, type } from "../theme";
import type { MainTabParamList, RootStackParamList } from "../navigation/RootNavigator";

type Props = CompositeScreenProps<BottomTabScreenProps<MainTabParamList, "Alerts">, NativeStackScreenProps<RootStackParamList>>;

const adviceImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB5BRKpbA-VIeMUATtTJf11n7i73LBI2e1llfLFkaSg8OyBeQHnCRzGhLb0N5Q1DZbVTSKcvPTuxMvfQwcXAddf200vO8woDjXfgepEUMbw_ElhPI8v2OKESmgkntEuLsvr2dQrl7MPXZ8oxKZPnvVyignUokt_A0Dorff1dE_w93H3Wib4xQSRhmvxLHq46i6WT7mgcb3Xb9asH-G3MCyijAPQU9DRGDVnWW1I71j9sBW1PXMXUbZBVazd8uiOrwSdVbxZlodu7dDm";

export function AlertsScreen({ navigation }: Props) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [conseil, setConseil] = useState<string>("L'arrosage matinal réduit l'évaporation de 30%.");
  const [loading, setLoading] = useState(true);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useEffect(() => {
    let mounted = true;
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const data = await AgrosmartService.getAlerts();
        if (mounted) {
          setAlerts(data.alertes || []);
          if (data.conseil_expert) setConseil(data.conseil_expert);
        }
      } catch (error) {
        console.log("Erreur chargement alertes", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchAlerts();
    return () => { mounted = false; };
  }, []);

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = Math.floor((new Date().getTime() - date.getTime()) / 60000); // in minutes
    if (diff < 1) return "À l'instant";
    if (diff < 60) return `Il y a ${diff} min`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    const days = Math.floor(hours / 24);
    return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
  };

  const getAlertStyles = (niveau: string) => {
    switch (niveau) {
      case 'critique':
      case 'urgence':
        return { card: styles.dangerCard, iconBg: styles.dangerIcon, iconColor: colors.error, titleColor: colors.error, icon: "warning" };
      case 'succes':
      case 'info':
        return { card: styles.successCard, iconBg: styles.successIcon, iconColor: colors.primary, titleColor: colors.primary, icon: "check-circle" };
      case 'avertissement':
      case 'warning':
      default:
        return { card: styles.warningCard, iconBg: styles.warningIcon, iconColor: colors.secondary, titleColor: colors.secondary, icon: "info-outline" };
    }
  };

  return (
    <Screen>
      <AppHeader />
      <View style={styles.heading}>
        <Text style={styles.title}>Alertes 🔔</Text>
        <Text style={styles.copy}>Surveillez l'état de vos parcelles en temps réel.</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : alerts.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <MaterialIcons name="notifications-none" size={64} color={colors.outlineVariant} />
            <Text style={{ fontFamily: fonts.heading, fontSize: 18, color: colors.onSurfaceVariant, marginTop: 16 }}>Rien cette semaine</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.outline, marginTop: 8, textAlign: "center", paddingHorizontal: 20 }}>
              Tout va bien, votre parcelle se porte à merveille !
            </Text>
          </View>
        ) : (
          alerts.map((alerte) => {
            const ui = getAlertStyles(alerte.niveau || 'avertissement');
            const isUrgent = alerte.niveau === 'critique' || alerte.niveau === 'urgence';

            return (
              <View key={alerte.id} style={[styles.alertCard, ui.card]}>
                <View style={styles.alertHeader}>
                  <View style={styles.alertTitleGroup}>
                    <Animated.View style={[styles.iconCircle, ui.iconBg, isUrgent && { transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }], opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }) }]}>
                      <MaterialIcons name={ui.icon} size={26} color={ui.iconColor} />
                    </Animated.View>
                    <View style={styles.alertTitleText}>
                      <Text style={[styles.alertTitle, { color: ui.titleColor }]}>{alerte.titre || alerte.type_alerte}</Text>
                      <Text style={styles.meta}>
                        Parcelle {alerte.parcelle_id} • {formatTimeAgo(alerte.created_at)}
                      </Text>
                    </View>
                  </View>
                  {isUrgent && (
                    <View style={styles.urgentPill}>
                      <Text style={styles.urgentText}>URGENT</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.message}>{alerte.message}</Text>
                
                {isUrgent && (
                  <Pressable onPress={() => navigation.navigate("ManualProgramming")} style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}>
                    <MaterialIcons name="bolt" size={20} color={colors.onPrimary} />
                    <Text style={styles.primaryActionText}>Gérer l'arrosage</Text>
                  </Pressable>
                )}
              </View>
            );
          })
        )}

          <ImageBackground source={{ uri: adviceImage }} style={styles.adviceCard} imageStyle={styles.adviceImage}>
            <View style={styles.adviceShade} />
            <View style={styles.adviceCopy}>
              <Text style={styles.adviceLabel}>Conseil Expert</Text>
              <Text style={styles.adviceText}>{conseil}</Text>
            </View>
          </ImageBackground>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { marginBottom: spacing.stackMd },
  title: { ...type.h1Mobile, fontFamily: fonts.heading, color: colors.onSurface },
  copy: { ...type.body, fontFamily: fonts.body, color: colors.onSurfaceVariant, marginTop: 4 },
  alertCard: {
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceContainerLowest,
    borderLeftWidth: 8,
    padding: spacing.stackMd,
    marginBottom: spacing.gutter,
    overflow: "hidden",
    ...shadow.card,
  },
  dangerCard: { borderLeftColor: colors.error, shadowColor: colors.error },
  warningCard: { borderLeftColor: colors.secondary, shadowColor: colors.secondary },
  successCard: { borderLeftColor: colors.onPrimary },
  alertHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  alertTitleGroup: { flex: 1, minWidth: 0, flexDirection: "row", gap: spacing.stackSm, alignItems: "flex-start" },
  iconCircle: { width: 50, height: 50, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  dangerIcon: { backgroundColor: colors.errorContainer },
  warningIcon: { backgroundColor: colors.secondaryFixed },
  successIcon: { backgroundColor: colors.primaryFixed },
  alertTitleText: { flex: 1, minWidth: 0 },
  alertTitle: { ...type.h2, fontFamily: fonts.heading },
  meta: { ...type.labelSm, fontFamily: fonts.body, color: "#5c6b5e", marginTop: 2 }, // Gris-vert foncé, lisible sur fond blanc
  urgentPill: { borderRadius: radius.full, backgroundColor: colors.error, paddingHorizontal: 10, paddingVertical: 5 },
  urgentText: { ...type.labelSm, fontFamily: fonts.body, color: colors.onError },
  message: { ...type.body, fontFamily: fonts.body, color: colors.onSurfaceVariant, marginTop: spacing.gutter },
  primaryAction: {
    minHeight: 56,
    marginTop: spacing.stackSm,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: spacing.stackMd,
    ...shadow.card,
  },
  primaryActionText: { ...type.label, fontFamily: fonts.body, color: colors.onPrimary },
  outlineAction: {
    minHeight: 56,
    alignSelf: "flex-start",
    marginTop: spacing.stackSm,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.secondary,
    paddingHorizontal: spacing.stackLg,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineActionText: { ...type.label, fontFamily: fonts.body, color: colors.secondary },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  statsBox: { flexDirection: "row", alignItems: "center", borderRadius: radius.md, backgroundColor: colors.surfaceContainer, padding: spacing.base, marginTop: spacing.stackSm },
  statCell: { flex: 1, alignItems: "center", paddingVertical: 8 },
  statDivider: { borderRightWidth: 1, borderRightColor: colors.outlineVariant },
  statLabel: { ...type.labelSm, fontFamily: fonts.body, color: colors.outline, textTransform: "uppercase", letterSpacing: 0.6 },
  statValue: { ...type.h2, fontFamily: fonts.heading, color: colors.primary, marginTop: 3 },
  adviceCard: { height: 192, borderRadius: radius.card, overflow: "hidden", justifyContent: "flex-end", marginTop: spacing.stackMd },
  adviceImage: { borderRadius: radius.card },
  adviceShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.46)" },
  adviceCopy: { padding: spacing.stackMd },
  adviceLabel: { ...type.labelSm, fontFamily: fonts.body, color: colors.secondaryFixed, textTransform: "uppercase", letterSpacing: 0.8 },
  adviceText: { ...type.h2, fontFamily: fonts.heading, color: colors.onPrimary, marginTop: 4 },
});
