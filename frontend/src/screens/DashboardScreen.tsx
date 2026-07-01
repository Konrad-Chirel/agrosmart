// @ts-nocheck
import { MaterialIcons } from "@expo/vector-icons";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { CompositeScreenProps } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { AppHeader } from "../components/AppHeader";
import { Screen } from "../components/Screen";
import { useOnboarding } from "../data/onboardingState";
import { AgrosmartService } from "../services/AgrosmartService";
import { PumpWarningModal } from "../components/PumpWarningModal";
import { ActivePumpModal } from "../components/ActivePumpModal";
import { colors, fonts, radius, shadow, spacing } from "../theme";
import type { MainTabParamList, RootStackParamList } from "../navigation/RootNavigator";

type Props = CompositeScreenProps<BottomTabScreenProps<MainTabParamList, "Dashboard">, NativeStackScreenProps<RootStackParamList>>;
type MetricIcon = keyof typeof MaterialIcons.glyphMap;

// Animated circular gauge component
function CircularGauge({ pct }: { pct: number }) {
  const R = 38;
  const CIRCUMFERENCE = 2 * Math.PI * R;
  const strokeDashoffset = CIRCUMFERENCE * (1 - pct / 100);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: pct, duration: 1000, useNativeDriver: false }).start();
  }, [pct]);

  return (
    <View style={gaugeStyles.wrap}>
      <Svg width={96} height={96} viewBox="0 0 96 96">
        {/* Track */}
        <Circle cx="48" cy="48" r={R} stroke="#e0e4db" strokeWidth="9" fill="none" />
        {/* Progress */}
        <Circle
          cx="48"
          cy="48"
          r={R}
          stroke={colors.primary}
          strokeWidth="9"
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin="48,48"
        />
      </Svg>
      <View style={gaugeStyles.center}>
        <Text style={gaugeStyles.value}>{Math.round(pct)}%</Text>
      </View>
    </View>
  );
}

const gaugeStyles = StyleSheet.create({
  wrap: { width: 96, height: 96, alignItems: "center", justifyContent: "center" },
  center: { position: "absolute", alignItems: "center", justifyContent: "center" },
  value: { fontSize: 18, fontFamily: fonts.heading, color: colors.primary },
});

export function DashboardScreen({ navigation }: Props) {
  const { firstName } = useOnboarding();
  const [dashboard, setDashboard] = useState<any>(null);
  const [pumpActive, setPumpActive] = useState(true);
  const [pumpBusy, setPumpBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warningVisible, setWarningVisible] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [activePumpModalVisible, setActivePumpModalVisible] = useState(false);
  const [pumpStatus, setPumpStatus] = useState<any>(null);
  const displayName = firstName?.trim() || "Koffi";
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AgrosmartService.getDashboard();
      const pump = await AgrosmartService.getPumpStatus().catch(() => null);
      setDashboard(data);
      setPumpActive(pump?.active == null ? false : Boolean(pump.active));
      setPumpStatus(pump?.arrosage);
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    } catch {
      setError("Impossible de charger les données du champ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const lecture = dashboard?.capteurs;
  const decision = dashboard?.decision;
  const reservoirLevel = dashboard?.reservoir?.niveau == null ? 72 : Number(dashboard.reservoir.niveau);
  
  const humiditeVal = lecture?.humidite_sol == null ? 68 : Number(lecture.humidite_sol);
  const isSaturated = humiditeVal > 85;
  const isUrgent = isSaturated || decision?.type_decision === "arrosage_urgent" || decision?.type_decision === "alerte_asphyxie";
  const statusTitle = isSaturated ? "Alerte : Sol saturé d'eau !" : (decision?.type_decision === "arrosage_urgent" ? "Votre champ demande de l'eau" : "Votre champ est en bon état");

  const metrics: Array<{ label: string; value: string; suffix?: string; icon: MetricIcon; iconColor: string; iconBg: string }> = [
    { label: "Humidité Sol", value: lecture?.humidite_sol == null ? "68%" : `${Math.round(Number(lecture.humidite_sol))}%`, icon: "water-drop", iconColor: "#1d4ed8", iconBg: "#dbeafe" },
    { label: "Soleil", value: lecture?.luminosite == null ? "Fort" : Number(lecture.luminosite) > 80000 ? "Fort" : "Normal", icon: "wb-sunny", iconColor: "#ff9100", iconBg: "#fff8e1" },
    { label: "Température", value: lecture?.temperature == null ? "34°C" : `${Math.round(Number(lecture.temperature))}°C`, icon: "device-thermostat", iconColor: "#f97316", iconBg: "#fff0e6" },
    { label: "Vent", value: lecture?.vitesse_vent == null ? "18 km/h" : `${Math.round(Number(lecture.vitesse_vent))} km/h`, icon: "air", iconColor: "#64748b", iconBg: "#f1f5f9" },
  ];

  const togglePump = async () => {
    if (pumpBusy) return;
    
    if (pumpActive) {
      setPumpBusy(true);
      try {
        const pump = await AgrosmartService.getPumpStatus().catch(() => null);
        setPumpStatus(pump?.arrosage);
      } finally {
        setPumpBusy(false);
      }
      setActivePumpModalVisible(true);
      return;
    }
    
    setPumpBusy(true);
    setError(null);
    try {
      const check = await AgrosmartService.checkPumpConditions();
      if (check?.status === 'warning') {
        setWarningMessage(check.message);
        setWarningVisible(true);
        setPumpBusy(false);
        return;
      } else {
        await AgrosmartService.startPump(null);
        setPumpActive(true);
        
        // Refresh pump status to get the exact start time from backend
        const pump = await AgrosmartService.getPumpStatus().catch(() => null);
        setPumpStatus(pump?.arrosage);
      }
    } catch {
      setError("La commande de pompe n'a pas pu être envoyée.");
    } finally {
      setPumpBusy(false);
    }
  };

  return (
    <Screen scroll={false} contentStyle={styles.wrap}>
      <AppHeader />

      <View style={styles.heroHeader}>
        <Text style={styles.hello}>Bonjour, {displayName} 👋</Text>
        <Text style={styles.sub}>Voici l'état actuel de votre exploitation.</Text>
      </View>

      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.stateText}>Chargement du champ...</Text>
        </View>
      ) : error ? (
        <Pressable onPress={load}>
          <View style={styles.stateBox}>
            <MaterialIcons name="wifi-off" size={36} color={colors.error} />
            <Text style={styles.stateText}>{error}</Text>
            <Text style={[styles.stateText, { color: colors.primary }]}>Touchez pour réessayer.</Text>
          </View>
        </Pressable>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

            {/* ── STATUT GLOBAL ── */}
            <View style={[styles.statusCard, isUrgent && styles.statusCardUrgent]}>
              <View style={styles.statusBadgeRow}>
                <View style={[styles.statusDot, isUrgent && styles.statusDotUrgent]} />
                <Text style={styles.statusLabel}>STATUT GLOBAL</Text>
              </View>
              <Text style={[styles.statusTitle, isSaturated && { color: colors.error }]}>{statusTitle}</Text>
              <MaterialIcons name="agriculture" size={110} color="rgba(6,78,28,0.06)" style={styles.statusBgIcon} />
              <View style={styles.statusChips}>
                <View style={styles.chip}>
                  <Text style={styles.chipGreenText}>{isUrgent ? "À surveiller" : "Système OK"}</Text>
                </View>
                <View style={styles.chipOrange}>
                  <Text style={styles.chipOrangeText}>{dashboard?.culture?.stade_actuel || "Optimisé"}</Text>
                </View>
              </View>
            </View>

            {/* ── GRILLE CAPTEURS ── */}
            <View style={styles.metricGrid}>
              {metrics.map((m) => (
                <View key={m.label} style={styles.metricCard}>
                  <View style={[styles.metricIconWrap, { backgroundColor: m.iconBg }]}>
                    <MaterialIcons name={m.icon} size={26} color={m.iconColor} />
                  </View>
                  <Text style={styles.metricLabel}>{m.label}</Text>
                  <Text style={styles.metricValue}>{m.value}</Text>
                </View>
              ))}
            </View>

            {/* ── CONTRÔLE POMPE ── */}
            <Text style={styles.sectionTitle}>CONTRÔLE MANUEL</Text>
            <Pressable
              onPress={togglePump}
              style={({ pressed }) => [styles.pumpCard, !pumpActive && styles.pumpStopped, pressed && { opacity: 0.92 }]}
            >
              <View style={[styles.pumpIconWrap, !pumpActive && styles.pumpIconStopped]}>
                <MaterialIcons name={pumpActive ? "opacity" : "power-settings-new"} size={26} color={pumpActive ? "#064e1c" : "#7f1d1d"} />
              </View>
              <View style={styles.pumpTextWrap}>
                <Text style={styles.pumpTitle}>Pompe: {pumpActive ? "ACTIVE" : "ARRÊTÉE"}</Text>
                <Text style={styles.pumpCopy}>{pumpActive ? "Arrosage en cours..." : "Touchez pour démarrer"}</Text>
              </View>
              <View style={styles.pumpCheck}>
                {pumpBusy
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <MaterialIcons name={pumpActive ? "check-circle-outline" : "pause-circle-outline"} size={32} color="#ffffff" />
                }
              </View>
            </Pressable>

            {/* ── HISTORIQUE ── */}
            <Pressable onPress={() => navigation.navigate("History")} style={styles.historyCard}>
              <View style={styles.historyIconWrap}>
                <MaterialIcons name="history" size={24} color={colors.primary} />
              </View>
              <View style={styles.historyTextWrap}>
                <Text style={styles.historyTitle}>Historique des arrosages</Text>
                <Text style={styles.historyCopy}>Consultez vos consommations d'eau</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.onSurfaceVariant} />
            </Pressable>

            {/* ── RÉSERVOIR & PROGRAMMATION ── */}
            <Text style={styles.sectionTitle}>NIVEAU RÉSERVOIR</Text>
            <Pressable onPress={() => navigation.navigate("ManualProgramming")} style={styles.reservoirCard}>
              <CircularGauge pct={reservoirLevel} />
              <View style={styles.reservoirTextWrap}>
                <Text style={styles.reservoirTitle}>Disponible</Text>
                <Text style={styles.reservoirCopy}>Prévu pour 4 jours{"\n"}d'autonomie</Text>
              </View>
            </Pressable>

          </ScrollView>
        </Animated.View>
      )}

      <PumpWarningModal
        visible={warningVisible}
        message={warningMessage}
        onCancel={() => setWarningVisible(false)}
        onConfirm={async () => {
          setWarningVisible(false);
          if (!pumpBusy) {
            setPumpBusy(true);
            try {
              if (pumpActive) {
                await AgrosmartService.stopPump();
                setPumpActive(false);
                setPumpStatus(null);
              } else {
                await AgrosmartService.startPump(null);
                setPumpActive(true);
                const pump = await AgrosmartService.getPumpStatus().catch(() => null);
                setPumpStatus(pump?.arrosage);
              }
            } catch {
              setError("La commande de pompe n'a pas pu être envoyée.");
            } finally {
              setPumpBusy(false);
            }
          }
        }}
      />

      <ActivePumpModal
        visible={activePumpModalVisible}
        pumpStatus={pumpStatus}
        onCancel={() => setActivePumpModalVisible(false)}
        onStopPump={async () => {
          setActivePumpModalVisible(false);
          setPumpBusy(true);
          try {
            await AgrosmartService.stopPump();
            setPumpActive(false);
            setPumpStatus(null);
          } catch {
            setError("Impossible d'arrêter la pompe.");
          } finally {
            setPumpBusy(false);
          }
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.mobile, paddingTop: 12 },
  scrollContent: { paddingBottom: 16 },

  heroHeader: { marginBottom: 20 },
  hello: { fontSize: 26, fontFamily: fonts.heading, color: colors.onSurface },
  sub: { fontSize: 15, fontFamily: fonts.body, color: colors.onSurfaceVariant, marginTop: 4 },

  stateBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 60 },
  stateText: { fontSize: 15, fontFamily: fonts.body, color: colors.onSurfaceVariant, textAlign: "center" },

  // Status Card
  statusCard: {
    minHeight: 180,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.outline,
    paddingHorizontal: 22,
    paddingVertical: 20,
    marginBottom: 16,
    overflow: "hidden",
    position: "relative",
    ...shadow.card,
  },
  statusCardUrgent: { borderColor: "#fca5a5" },
  statusBadgeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#22c55e" },
  statusDotUrgent: { backgroundColor: colors.error },
  statusLabel: { fontSize: 12, fontFamily: fonts.heading, color: colors.primary, letterSpacing: 1.5 },
  statusTitle: { fontSize: 26, fontFamily: fonts.heading, color: colors.primary, lineHeight: 34, maxWidth: "75%", zIndex: 2 },
  statusBgIcon: { position: "absolute", right: -8, bottom: -8, zIndex: 1 },
  statusChips: { flexDirection: "row", gap: 8, marginTop: 16, zIndex: 2 },
  chip: { backgroundColor: "#dcfce7", borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 6 },
  chipGreenText: { fontSize: 13, fontFamily: fonts.bodyMedium, color: "#166534" },
  chipOrange: { backgroundColor: "#ffedd5", borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 6 },
  chipOrangeText: { fontSize: 13, fontFamily: fonts.bodyMedium, color: "#9a3412" },

  // Metric grid
  metricGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 20 },
  metricCard: {
    width: "48%", // 2 colonnes
    marginBottom: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.outline,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
    ...shadow.card,
  },
  metricIconWrap: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  metricLabel: { fontSize: 14, fontFamily: fonts.bodyMedium, color: colors.onSurfaceVariant, textAlign: "center" },
  metricValue: { fontSize: 30, fontFamily: fonts.heading, color: colors.primary, marginTop: 4, textAlign: "center" },

  // Section title
  sectionTitle: { fontSize: 12, fontFamily: fonts.heading, color: colors.onSurfaceVariant, letterSpacing: 2, marginBottom: 10, marginTop: 4 },

  // Pump
  pumpCard: {
    minHeight: 88,
    borderRadius: radius.card,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 14,
    marginBottom: 20,
    ...shadow.lift,
  },
  pumpStopped: { backgroundColor: "#7f1d1d" },
  pumpIconWrap: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#a7f3d0", alignItems: "center", justifyContent: "center" },
  pumpIconStopped: { backgroundColor: "#fecaca" },
  pumpTextWrap: { flex: 1 },
  pumpTitle: { fontSize: 18, fontFamily: fonts.heading, color: "#ffffff" },
  pumpCopy: { fontSize: 13, fontFamily: fonts.body, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  pumpCheck: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },

  // Reservoir
  reservoirCard: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.outline,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 20,
    marginBottom: 20,
    ...shadow.card,
  },
  reservoirTextWrap: { flex: 1 },
  reservoirTitle: { fontSize: 22, fontFamily: fonts.heading, color: colors.onSurface },
  reservoirCopy: { fontSize: 14, fontFamily: fonts.body, color: colors.onSurfaceVariant, marginTop: 4, lineHeight: 20 },

  // History
  historyCard: {
    borderRadius: radius.card,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 16,
    marginBottom: 20,
  },
  historyIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryContainer, alignItems: "center", justifyContent: "center" },
  historyTextWrap: { flex: 1 },
  historyTitle: { fontSize: 16, fontFamily: fonts.heading, color: colors.onSurface },
  historyCopy: { fontSize: 13, fontFamily: fonts.body, color: colors.onSurfaceVariant, marginTop: 2 },
});
