import { MaterialIcons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PumpWarningModal } from "../components/PumpWarningModal";
import { ActivePumpModal } from "../components/ActivePumpModal";
import { images } from "../data/mockData";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { AgrosmartService } from "../services/AgrosmartService";
import { colors, fonts, radius, shadow, spacing, type } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "CultureDetail">;

type CalendarItem = {
  date: string;
  jour: string;
  heure: string;
  titre: string;
  description: string;
  volume_litres: number;
};

type CultureDetail = {
  id: number;
  type_culture: string;
  nom: string;
  stade: string;
  sante: string;
  score_sante?: number;
  alerte: boolean;
  semaine_actuelle: number;
  cycle_semaines: number;
  progression: number;
  humidite_sol: { texte: string; valeur: number | null; niveau: string };
  date_fin_prevue?: string;
  recolte?: {
    date_estimee: string;
    jours_restants: number;
  };
  calendrier_arrosage?: CalendarItem[];
};

export function CultureDetailScreen({ route, navigation }: Props) {
  const [culture, setCulture] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [programme, setProgramme] = useState<CalendarItem[]>([]);
  const [warningVisible, setWarningVisible] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [isPumpActive, setIsPumpActive] = useState(false);
  const [activePumpModalVisible, setActivePumpModalVisible] = useState(false);
  const [pumpStatus, setPumpStatus] = useState<any>(null);

  const load = async () => {
    if (!route.params?.cultureId) {
      setError("Culture introuvable.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await AgrosmartService.getCulture(route.params.cultureId);
      setCulture(data);
      const pump = await AgrosmartService.getPumpStatus().catch(() => null);
      setPumpStatus(pump);
      setIsPumpActive(pump?.active == null ? false : Boolean(pump.active));
    } catch {
      setError("Impossible de charger le détail de cette culture.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [route.params?.cultureId]);

  const harvestDate = culture?.recolte?.date_estimee || culture?.date_fin_prevue;
  const harvestWeeks = Math.max(0, Math.ceil((culture?.recolte?.jours_restants || 0) / 7));
  const schedule = culture?.calendrier_arrosage || [];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.screen}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Pressable onPress={() => navigation.goBack()} style={styles.headerIcon} hitSlop={10}>
                <MaterialIcons name="arrow-back" size={27} color={colors.primary} />
              </Pressable>
              <Text style={styles.headerTitle} numberOfLines={1}>
                Détail : {culture?.nom || route.params?.cultureName || "Culture"}
              </Text>
            </View>
            <Pressable style={styles.headerIcon} hitSlop={10}>
              <MaterialIcons name="show-chart" size={25} color={colors.primary} />
            </Pressable>
          </View>

          {loading ? (
            <StateBox text="Chargement de la culture..." />
          ) : error || !culture ? (
            <Pressable onPress={load}>
              <StateBox text={`${error || "Culture introuvable."} Touchez pour réessayer.`} />
            </Pressable>
          ) : (
            <>
              <View style={styles.heroWrap}>
                <ImageBackground source={{ uri: imageForCulture(culture.type_culture) }} style={styles.hero} imageStyle={styles.heroImage}>
                  <View style={styles.heroShade} />
                  <View style={styles.heroBadges}>
                    <View style={[styles.healthBadge, { backgroundColor: culture.alerte ? (culture.sante?.toLowerCase().includes("asphyxie") || culture.sante?.toLowerCase().includes("satur") ? "#ef4444" : "#f97316") : colors.primary }]}>
                      <MaterialIcons name={culture.alerte ? "warning" : "check-circle"} size={17} color={colors.onPrimary} />
                      <Text style={styles.healthBadgeText} numberOfLines={1}>{culture.sante}</Text>
                    </View>
                    <View style={styles.stageBadge}>
                      <Text style={styles.stageBadgeText} numberOfLines={1}>{culture.stade}</Text>
                    </View>
                  </View>
                </ImageBackground>
              </View>

              <View style={styles.progressCard}>
                <View style={styles.progressTop}>
                  <View style={styles.progressCopy}>
                    <Text style={styles.overline}>PROGRESSION DE CROISSANCE</Text>
                    <Text style={styles.progressTitle}>Semaine {culture.semaine_actuelle} / {culture.cycle_semaines}</Text>
                  </View>
                  <Text style={styles.progressPercent}>{culture.progression}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, culture.progression))}%` }]} />
                </View>
                <View style={styles.infoRow}>
                  <MaterialIcons name="info-outline" size={18} color={colors.onSurfaceVariant} />
                  <Text style={styles.infoText}>
                    {harvestWeeks > 0 ? `Récolte prévue dans environ ${harvestWeeks} semaine${harvestWeeks > 1 ? "s" : ""}.` : "La récolte est proche."}
                  </Text>
                </View>
              </View>

              <View style={styles.metricGrid}>
                <MetricCard
                  icon="water-drop"
                  iconColor={colors.primary}
                  iconBg="rgba(0,69,13,0.10)"
                  label="Humidité du sol"
                  value={culture.humidite_sol?.valeur == null ? "--" : `${Math.round(culture.humidite_sol.valeur)}%`}
                  note={culture.humidite_sol?.niveau || "En attente"}
                  noteColor={colors.primary}
                />
                <MetricCard
                  icon="favorite-border"
                  iconColor={colors.tertiary}
                  iconBg="rgba(114,25,0,0.10)"
                  label="Santé Globale"
                  value={`${culture.score_sante ?? 70}%`}
                  note="Score de vigueur"
                  noteColor={colors.onSurfaceVariant}
                />
              </View>

              <Pressable onPress={() => navigation.navigate("HarvestForecast", { cultureId: culture.id })} style={({ pressed }) => [styles.harvestCard, pressed && styles.pressed]}>
                <View style={styles.harvestIcon}>
                  <MaterialIcons name="calendar-today" size={25} color={colors.secondary} />
                </View>
                <View style={styles.harvestCopy}>
                  <Text style={styles.metricLabel}>Récolte estimée</Text>
                  <Text style={styles.harvestDate}>{formatLongDate(harvestDate)}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={30} color={colors.onSurfaceVariant} />
              </Pressable>

              <View style={styles.scheduleHeader}>
                <Text style={styles.scheduleTitle}>Programme de la semaine</Text>
                <Pressable onPress={() => navigation.navigate("WeeklySchedule", { cultureId: culture.id })} hitSlop={10}>
                  <Text style={styles.seeAll}>VOIR TOUT</Text>
                </Pressable>
              </View>

              <View style={styles.scheduleStack}>
                {(() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  let displayItems = schedule.filter((item: any) => item.date >= todayStr);
                  if (displayItems.length === 0) {
                    displayItems = schedule.slice(-3);
                  } else {
                    displayItems = displayItems.slice(0, 3);
                  }
                  
                  const firstUpcomingIndex = displayItems.findIndex((item: any) => item.statut === "a_venir" || item.statut === "planifie");
                  
                  return displayItems.map((item: any, index: number) => (
                    <ScheduleRow 
                      key={`${item.date}-${item.heure}-${index}`} 
                      item={item} 
                      active={index === firstUpcomingIndex} 
                      muted={item.statut === "fait" || item.statut === "manque"} 
                      onPress={() => navigation.navigate("WeeklySchedule", { cultureId: culture.id })}
                    />
                  ));
                })()}
                {schedule.length === 0 ? <Text style={styles.emptyProgram}>Aucun programme généré pour le moment.</Text> : null}
                <View style={styles.waterBox}>
                <Pressable onPress={async () => {
                  if (isPumpActive) {
                    try {
                      const pump = await AgrosmartService.getPumpStatus().catch(() => null);
                      setPumpStatus(pump);
                    } catch (e) {
                      console.log(e);
                    }
                    setActivePumpModalVisible(true);
                    return;
                  }

                  try {
                    const check = await AgrosmartService.checkPumpConditions();
                    if (check?.status === 'warning') {
                      setWarningMessage(check.message);
                      setWarningVisible(true);
                    } else {
                      await AgrosmartService.startPump(null);
                      setIsPumpActive(true);
                      navigation.navigate("IrrigationStarted", { parcel: culture.nom, durationMins: null });
                    }
                  } catch (error: any) {
                    console.log("Erreur demarrage", error);
                    Alert.alert("Erreur", error?.message || "Erreur de connexion avec le capteur.");
                  }
                }} style={({ pressed }) => [styles.waterButton, isPumpActive && { backgroundColor: colors.error }, pressed && styles.pressed]}>
                  <MaterialIcons name={isPumpActive ? "stop-circle" : "water-drop"} size={25} color={isPumpActive ? colors.onError : colors.onPrimaryContainer} />
                  <Text style={[styles.waterButtonText, isPumpActive && { color: colors.onError }]}>{isPumpActive ? "Arrêter l'arrosage" : "Arroser maintenant"}</Text>
                </Pressable>
                </View>
              </View>

              <PumpWarningModal
                visible={warningVisible}
                message={warningMessage}
                onCancel={() => setWarningVisible(false)}
                onConfirm={async () => {
                  setWarningVisible(false);
                  try {
                    await AgrosmartService.startPump(null);
                    setIsPumpActive(true);
                    const pump = await AgrosmartService.getPumpStatus().catch(() => null);
                    setPumpStatus(pump);
                    navigation.navigate("IrrigationStarted", { parcel: culture.nom, durationMins: null });
                  } catch (error: any) {
                    console.log("Erreur bypass:", error);
                    Alert.alert("Erreur", error?.message || "Erreur de connexion");
                  }
                }}
              />

              <ActivePumpModal
                visible={activePumpModalVisible}
                pumpStatus={pumpStatus}
                onCancel={() => setActivePumpModalVisible(false)}
                onStopPump={async () => {
                  setActivePumpModalVisible(false);
                  try {
                    await AgrosmartService.stopPump();
                    setIsPumpActive(false);
                    setPumpStatus(null);
                  } catch (e) {
                    console.log("Erreur arret", e);
                    Alert.alert("Erreur", "Impossible d'arrêter la pompe.");
                  }
                }}
              />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  note,
  noteColor,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  note: string;
  noteColor: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: iconBg }]}>
        <MaterialIcons name={icon} size={28} color={iconColor} />
      </View>
      <View>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={[styles.metricNote, { color: noteColor }]}>{note}</Text>
      </View>
    </View>
  );
}

function ScheduleRow({ item, active, muted, onPress }: { item: any; active?: boolean; muted?: boolean; onPress?: () => void }) {
  const date = new Date(item.date);
  const dayNumber = Number.isNaN(date.getTime()) ? "--" : date.getDate();
  const dayLabel = item.jour === "Aujourd'hui" ? "AUJ" : item.jour === "Demain" ? "DEM" : date.toLocaleDateString("fr-FR", { weekday: "short" }).slice(0, 3).toUpperCase();

  return (
    <Pressable onPress={onPress} style={[styles.scheduleRow, active && styles.scheduleRowActive, muted && styles.scheduleRowMuted]}>
      <View style={[styles.scheduleDate, active && styles.scheduleDateActive]}>
        <Text style={[styles.scheduleDay, active && styles.scheduleDateTextActive]}>{dayLabel}</Text>
        <Text style={[styles.scheduleNumber, active && styles.scheduleDateTextActive]}>{dayNumber}</Text>
      </View>
      <View style={styles.scheduleCopy}>
        <Text style={[styles.scheduleItemTitle, active && styles.scheduleItemTitleActive]} numberOfLines={1}>{item.titre}</Text>
        <Text style={[styles.scheduleItemSub, active && styles.scheduleItemSubActive]} numberOfLines={1}>{item.heure} • {Math.round(item.volume_litres)} Litres</Text>
      </View>
      <MaterialIcons name={active ? "sensors" : "schedule"} size={24} color={active ? colors.onPrimaryContainer : colors.onSurfaceVariant} />
    </Pressable>
  );
}

function StateBox({ text }: { text: string }) {
  return (
    <View style={styles.stateBox}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.stateText}>{text}</Text>
    </View>
  );
}

function imageForCulture(type: string) {
  return (
    {
      tomate: images.tomatoes,
      piment: images.chili,
      oignon: images.onion,
      laitue: images.lettuce,
      mais: images.corn,
      carotte: images.carrot,
    }[type] || images.tomatoes
  );
}

function formatLongDate(value?: string) {
  if (!value) return "Non définie";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingBottom: 40 },
  screen: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  header: {
    height: 64,
    backgroundColor: colors.surfaceDim,
    paddingHorizontal: spacing.mobile,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 12 },
  headerIcon: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 24, lineHeight: 32, fontWeight: "800", fontFamily: fonts.heading, color: colors.primary },
  heroWrap: { paddingHorizontal: spacing.mobile, paddingTop: spacing.stackSm },
  hero: { height: 224, borderRadius: 12, overflow: "hidden", justifyContent: "flex-end", ...shadow.card },
  heroImage: { borderRadius: 12 },
  heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.30)" },
  heroBadges: { flexDirection: "row", gap: 8, padding: 16 },
  healthBadge: { maxWidth: "54%", height: 32, borderRadius: radius.full, backgroundColor: colors.primary, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", gap: 5 },
  healthBadgeText: { fontSize: 12, lineHeight: 16, fontWeight: "700", fontFamily: fonts.body, color: colors.onPrimary },
  stageBadge: { height: 32, borderRadius: radius.full, backgroundColor: colors.secondaryContainer, paddingHorizontal: 14, alignItems: "center", justifyContent: "center" },
  stageBadgeText: { fontSize: 12, lineHeight: 16, fontWeight: "700", fontFamily: fonts.body, color: colors.onSecondaryContainer },
  progressCard: { marginHorizontal: spacing.mobile, marginTop: spacing.stackMd, borderRadius: 12, backgroundColor: colors.surfaceContainerLowest, borderWidth: 1, borderColor: colors.outlineVariant, padding: 20, ...shadow.card },
  progressTop: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginBottom: 16 },
  progressCopy: { flex: 1, minWidth: 0 },
  overline: { fontSize: 14, lineHeight: 20, letterSpacing: 2.4, fontWeight: "700", fontFamily: fonts.body, color: colors.onSurfaceVariant },
  progressTitle: { fontSize: 24, lineHeight: 32, fontWeight: "800", fontFamily: fonts.heading, color: colors.onSurface, marginTop: 2 },
  progressPercent: { fontSize: 40, lineHeight: 42, fontWeight: "700", fontFamily: fonts.heading, color: colors.primary },
  progressTrack: { height: 16, borderRadius: radius.full, backgroundColor: colors.surfaceContainerHighest, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: radius.full, backgroundColor: colors.primary },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: 16 },
  infoText: { flex: 1, fontSize: 16, lineHeight: 24, fontFamily: fonts.body, color: colors.onSurfaceVariant },
  metricGrid: { flexDirection: "row", gap: 16, paddingHorizontal: spacing.mobile, marginTop: spacing.stackMd },
  metricCard: { flex: 1, minHeight: 196, borderRadius: 12, backgroundColor: colors.surfaceContainerLowest, borderWidth: 1, borderColor: colors.outlineVariant, padding: 20, justifyContent: "space-between", ...shadow.card },
  metricIcon: { width: 50, height: 50, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  metricLabel: { fontSize: 16, lineHeight: 24, fontFamily: fonts.body, color: colors.onSurfaceVariant, marginBottom: 4 },
  metricValue: { fontSize: 24, lineHeight: 30, fontWeight: "800", fontFamily: fonts.heading, color: colors.onSurface },
  metricNote: { fontSize: 14, lineHeight: 20, fontWeight: "700", fontFamily: fonts.body },
  harvestCard: { minHeight: 80, marginHorizontal: spacing.mobile, marginTop: spacing.stackMd, borderRadius: 12, backgroundColor: colors.surfaceContainerLowest, borderWidth: 1, borderColor: colors.outlineVariant, padding: 16, flexDirection: "row", alignItems: "center", gap: 16, ...shadow.card },
  harvestIcon: { width: 52, height: 52, borderRadius: radius.full, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,143,0,0.20)" },
  harvestCopy: { flex: 1, minWidth: 0 },
  harvestDate: { fontSize: 20, lineHeight: 28, fontWeight: "800", fontFamily: fonts.heading, color: colors.onSurface },
  scheduleHeader: { paddingHorizontal: spacing.mobile, marginTop: 28, marginBottom: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  scheduleTitle: { fontSize: 20, lineHeight: 28, fontWeight: "800", fontFamily: fonts.heading, color: colors.onSurface },
  seeAll: { fontSize: 14, lineHeight: 20, fontWeight: "800", fontFamily: fonts.body, color: colors.primary },
  scheduleStack: { paddingHorizontal: spacing.mobile, gap: 12 },
  scheduleRow: { minHeight: 84, borderRadius: 12, borderWidth: 1, borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLowest, padding: 16, flexDirection: "row", alignItems: "center", gap: 16 },
  scheduleRowActive: { backgroundColor: colors.primaryContainer, borderColor: "rgba(0,69,13,0.20)" },
  scheduleRowMuted: { opacity: 0.6 },
  scheduleDate: { width: 48, height: 48, borderRadius: 8, backgroundColor: colors.surfaceContainerHighest, alignItems: "center", justifyContent: "center" },
  scheduleDateActive: { backgroundColor: colors.primaryFixedDim },
  scheduleDay: { fontSize: 12, lineHeight: 14, fontWeight: "800", fontFamily: fonts.body, color: colors.onSurfaceVariant },
  scheduleNumber: { fontSize: 22, lineHeight: 24, fontFamily: fonts.heading, color: colors.onSurfaceVariant },
  scheduleDateTextActive: { color: colors.primaryContainer },
  scheduleCopy: { flex: 1, minWidth: 0 },
  scheduleItemTitle: { fontSize: 18, lineHeight: 25, fontWeight: "800", fontFamily: fonts.heading, color: colors.onSurface },
  scheduleItemTitleActive: { color: colors.onPrimaryContainer },
  scheduleItemSub: { fontSize: 16, lineHeight: 24, fontFamily: fonts.body, color: colors.onSurfaceVariant },
  scheduleItemSubActive: { color: colors.onPrimaryContainer },
  emptyProgram: { ...type.body, fontFamily: fonts.body, color: colors.onSurfaceVariant, textAlign: "center", padding: 16 },
  waterButton: { height: 64, marginHorizontal: 0, marginTop: 48, borderRadius: 12, backgroundColor: colors.primaryContainer, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 12, ...shadow.lift },
  waterButtonText: { fontSize: 20, lineHeight: 28, fontWeight: "800", fontFamily: fonts.heading, color: colors.onPrimaryContainer },
  stateBox: { minHeight: 220, margin: spacing.mobile, borderRadius: 12, backgroundColor: colors.surfaceContainerLowest, alignItems: "center", justifyContent: "center", gap: 10, padding: 18, ...shadow.card },
  stateText: { ...type.body, fontFamily: fonts.body, color: colors.onSurfaceVariant, textAlign: "center" },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
});
