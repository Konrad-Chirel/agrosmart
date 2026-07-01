import { MaterialIcons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppButton } from "../components/AppButton";
import { pairingSensors, images } from "../data/mockData";
import { useOnboarding } from "../data/onboardingState";
import { AgrosmartService } from "../services/AgrosmartService";
import { colors, fonts, radius, shadow, spacing, type } from "../theme";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "SensorConnection">;

export function SensorConnectionScreen({ navigation, route }: Props) {
  const { addCurrentCropAsCulture } = useOnboarding();
  const [pairedIds, setPairedIds] = useState(() => new Set<string>());
  const [showSimulation, setShowSimulation] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Recherche de vos sondes en cours...");
  const [simulationLoading, setSimulationLoading] = useState(false);
  const mode = route.params?.mode;
  const addedRef = useRef(false);
  const pulseA = useRef(new Animated.Value(0)).current;
  const pulseB = useRef(new Animated.Value(0)).current;
  const pulseC = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  const connectedCount = pairedIds.size;
  const pairingActive = connectedCount < pairingSensors.length && !showSimulation;
  const finishAddParcel = useCallback(() => {
    if (addedRef.current) return;
    addedRef.current = true;
    addCurrentCropAsCulture();
    navigation.navigate("MainTabs", { screen: "Crops" });
  }, [addCurrentCropAsCulture, navigation]);

  useEffect(() => {
    const pulse = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, { toValue: 1, duration: 1600, useNativeDriver: true }),
          Animated.timing(value, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ).start();

    pulse(pulseA, 0);
    pulse(pulseB, 520);
    pulse(pulseC, 1040);

    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ]),
    ).start();
  }, [float, pulseA, pulseB, pulseC]);

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      const status = await AgrosmartService.getSensorConnectionStatus().catch(() => null);
      if (cancelled) return;

      if (status?.statut === "connecte") {
        setPairedIds(new Set(pairingSensors.map((sensor) => sensor.id)));
        setStatusMessage("Vos sondes sont connectées.");
        setShowSimulation(false);
        return;
      }

      setStatusMessage("Vos sondes ne sont pas détectées.");
      setShowSimulation(true);
    }, 10000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const buttonLabel = useMemo(
    () => (showSimulation ? "Sondes non détectées" : pairingActive ? `Recherche en cours... (${connectedCount}/6)` : "Tout est connecté - Continuer"),
    [connectedCount, pairingActive, showSimulation],
  );

  // Navigation sans attendre backend en mode simulation
  const handleSimulationSafe = async () => {
    if (simulationLoading) return;
    try {
      setSimulationLoading(true);
      await AgrosmartService.startSimulationMode().catch(() => null); // ignore si pas de backend
      addCurrentCropAsCulture();
      navigation.navigate("MainTabs", { screen: "Dashboard" });
    } finally {
      setSimulationLoading(false);
    }
  };

  const continueToNextStep = () => {
    if (mode === "addParcel") {
      finishAddParcel();
      return;
    }

    navigation.navigate("NotificationsIntro");
  };

  const handleSimulation = async () => {
    try {
      setSimulationLoading(true);
      await AgrosmartService.startSimulationMode();
      addCurrentCropAsCulture();
      navigation.navigate("MainTabs", { screen: "Dashboard" });
    } finally {
      setSimulationLoading(false);
    }
  };

  return (
    <ImageBackground source={{ uri: images.splash }} style={styles.bg} blurRadius={12}>
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.card}>
            <View style={styles.topBar}>
              <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={26} color={colors.primary} />
              </Pressable>
              <View style={styles.progress}>
                {[0, 1, 2, 3].map((item) => (
                  <View key={item} style={[styles.progressDot, item === 2 && styles.progressActive]} />
                ))}
              </View>
              <View style={styles.topSpacer} />
            </View>

            <Text style={styles.title}>Connectons vos sondes</Text>
            <Text style={styles.copy}>{statusMessage}</Text>

            <View style={styles.radar}>
              <View style={styles.gridTint} />
              <View style={styles.signalLineLeft} />
              <View style={styles.signalLineRight} />
              <View style={styles.signalLineBottom} />

              <Animated.View style={[styles.pulseRing, pulseStyle(pulseA)]} />
              <Animated.View style={[styles.pulseRing, pulseStyle(pulseB)]} />
              <Animated.View style={[styles.pulseRing, pulseStyle(pulseC)]} />

              <View style={styles.phoneHub}>
                <MaterialIcons name="smartphone" size={42} color={colors.secondaryContainer} />
              </View>

              <Animated.View style={[styles.floatIconOne, floatStyle(float)]}>
                <MaterialIcons name="sensors" size={26} color={colors.primaryContainer} />
              </Animated.View>
              <Animated.View style={[styles.floatIconTwo, floatStyle(float, true)]}>
                <MaterialIcons name="water-drop" size={24} color={colors.primaryContainer} />
              </Animated.View>
              <Animated.View style={[styles.floatIconThree, floatStyle(float)]}>
                <MaterialIcons name="wb-sunny" size={26} color={colors.secondaryContainer} />
              </Animated.View>
            </View>

            <View style={styles.grid}>
              {pairingSensors.map((sensor) => {
                const paired = pairedIds.has(sensor.id);
                return (
                  <View key={sensor.id} style={[styles.sensorCard, !paired && styles.sensorPending]}>
                    <View style={[styles.sensorIcon, { backgroundColor: `${sensor.tone}18` }]}>
                      <MaterialIcons name={sensor.icon} size={24} color={sensor.tone} />
                    </View>
                    <Text style={styles.sensorLabel}>{sensor.label}</Text>
                    <View style={[styles.status, paired ? styles.statusOk : styles.statusSync]}>
                      <MaterialIcons name={paired ? "check-circle" : "sync"} size={11} color={paired ? "#047857" : colors.outline} />
                      <Text style={[styles.statusText, paired && styles.statusTextOk]}>{paired ? "Connecte" : showSimulation ? "Non detecte" : "Recherche"}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <AppButton
              label={buttonLabel}
              icon={pairingActive ? "sync" : "arrow-forward"}
              onPress={() => {
                if (!pairingActive && !showSimulation) {
                  continueToNextStep();
                }
              }}
              style={pairingActive || showSimulation ? styles.buttonWaiting : styles.button}
            />

            {showSimulation ? (
              <View style={styles.simulationBox}>
                <AppButton
                  label={simulationLoading ? "Chargement..." : "Continuer en mode simulation"}
                  icon="arrow-forward"
                  iconPosition="right"
                  onPress={handleSimulationSafe}
                  style={styles.simulationButton}
                />
                <Text style={styles.simulationText}>
                  Vos sondes ne sont pas détectées. Les données seront simulées jusqu'à la connexion de votre prototype.
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.step}>Étape 4 sur 5</Text>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

function pulseStyle(value: Animated.Value) {
  return {
    opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
    transform: [{ scale: value.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1.9] }) }],
  };
}

function floatStyle(value: Animated.Value, reverse = false) {
  return {
    transform: [
      {
        translateY: value.interpolate({ inputRange: [0, 1], outputRange: reverse ? [4, -5] : [-4, 5] }),
      },
    ],
  };
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(10,30,10,0.35)" }, // sombre pour laisser les couleurs respirer
  safe: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: spacing.mobile },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#ffffff", // Blanc pur, pas de teinte qui lève un voile
    borderRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: "#d1d5db",
    ...shadow.lift,
  },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  backButton: { width: 42, height: 42, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  progress: { flex: 1, flexDirection: "row", gap: 6, justifyContent: "center", paddingHorizontal: 14 },
  progressDot: { width: 24, height: 7, borderRadius: 4, backgroundColor: `${colors.primaryFixed}66` },
  progressActive: { backgroundColor: colors.primary },
  topSpacer: { width: 42 },
  title: { ...type.h2, fontFamily: fonts.heading, color: colors.primary, textAlign: "center" },
  copy: { ...type.labelSm, fontFamily: fonts.body, color: colors.onSurfaceVariant, textAlign: "center", marginTop: 6, marginBottom: 16 },
  radar: {
    height: 150,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: `${colors.outlineVariant}55`,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 16,
  },
  gridTint: { ...StyleSheet.absoluteFillObject, backgroundColor: `${colors.primaryFixed}1f` },
  signalLineLeft: { position: "absolute", width: 104, height: 2, backgroundColor: colors.primaryFixed, transform: [{ rotate: "-24deg" }], left: 68, top: 58, opacity: 0.75 },
  signalLineRight: { position: "absolute", width: 112, height: 2, backgroundColor: colors.primaryFixed, transform: [{ rotate: "18deg" }], right: 62, top: 68, opacity: 0.75 },
  signalLineBottom: { position: "absolute", width: 78, height: 2, backgroundColor: colors.primaryFixed, transform: [{ rotate: "88deg" }], bottom: 35, opacity: 0.75 },
  pulseRing: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: colors.primaryFixedDim,
    backgroundColor: `${colors.primaryFixed}22`,
  },
  phoneHub: { width: 64, height: 64, borderRadius: 18, backgroundColor: colors.surfaceContainerLowest, alignItems: "center", justifyContent: "center", ...shadow.card },
  floatIconOne: { position: "absolute", left: 86, top: 38 },
  floatIconTwo: { position: "absolute", right: 95, bottom: 38 },
  floatIconThree: { position: "absolute", right: 48, top: 70 },
  grid: { flexDirection: "row", flexWrap: "wrap", columnGap: 10, rowGap: 10, marginBottom: 20 },
  sensorCard: {
    width: "30.9%",
    minHeight: 100,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.primary}35`,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    ...shadow.card,
  },
  sensorPending: { opacity: 1 }, // pas de réduction d'opacité qui rendait le texte illisible
  sensorIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  sensorLabel: { fontSize: 11, lineHeight: 15, fontFamily: fonts.heading, color: "#111827", textTransform: "uppercase" }, // texte foncé toujours visible
  status: { flexDirection: "row", gap: 4, alignItems: "center", borderRadius: radius.full, paddingHorizontal: 7, paddingVertical: 3, marginTop: 6 },
  statusOk: { backgroundColor: "#d1fae5" },
  statusSync: { backgroundColor: "#f3f4f6" },
  statusText: { fontSize: 9, lineHeight: 11, fontFamily: fonts.bodyMedium, color: "#6b7280", textTransform: "uppercase" },
  statusTextOk: { color: "#065f46" },
  button: { minHeight: 54 },
  buttonWaiting: { minHeight: 54, backgroundColor: "#1b5e20" }, // vert foncé quand en attente
  simulationBox: { marginTop: 14, gap: 10 },
  simulationButton: { minHeight: 54, backgroundColor: "#ff9500" }, // orange vif, pas de transparence
  simulationText: { ...type.labelSm, fontFamily: fonts.body, color: "#374151", textAlign: "center", lineHeight: 19 },
  step: { ...type.labelSm, fontFamily: fonts.body, textAlign: "center", color: colors.outline, marginTop: 14, textTransform: "uppercase" },
});
