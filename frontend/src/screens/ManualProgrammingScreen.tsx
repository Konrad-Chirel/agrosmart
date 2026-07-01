import { MaterialIcons } from "@expo/vector-icons";
import { AgrosmartService } from "../services/AgrosmartService";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState, useRef } from "react";
import { Alert, GestureResponderEvent, PanResponder, Pressable, StyleSheet, Text, View, ScrollView } from "react-native";
import { AppButton } from "../components/AppButton";
import { AppHeader } from "../components/AppHeader";
import { Screen } from "../components/Screen";
import { PumpWarningModal } from "../components/PumpWarningModal";
import { ActivePumpModal } from "../components/ActivePumpModal";
import { TimePickerModal } from "../components/TimePickerModal";
import { DurationPickerModal } from "../components/DurationPickerModal";
import { colors, fonts, radius, shadow, spacing } from "../theme";
import * as theme from "../theme";
const type = theme.type;
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "ManualProgramming">;

const parcels = ["Parcelle Nord", "Parcelle Est"];
const durations = ["15", "30", "45", "1 HEURE", "Personnalisé"];
const startModes = ["Maintenant", "Plus tard"];

export function ManualProgrammingScreen({ navigation }: Props) {
  const [parcel, setParcel] = useState("Parcelle Nord");
  const [duration, setDuration] = useState("30");
  const [startMode, setStartMode] = useState("Maintenant");
  const [warningVisible, setWarningVisible] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [activePumpModalVisible, setActivePumpModalVisible] = useState(false);
  const [pendingMins, setPendingMins] = useState(30);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [durationPickerVisible, setDurationPickerVisible] = useState(false);
  const [customDurationMins, setCustomDurationMins] = useState<number | null>(null);
  
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledLabel, setScheduledLabel] = useState("");
  const [scheduledTimestamp, setScheduledTimestamp] = useState(0);

  const [activeDecision, setActiveDecision] = useState<any>(null);
  const [loadingDecision, setLoadingDecision] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isPumpActive, setIsPumpActive] = useState(false);
  const [pumpStatus, setPumpStatus] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      async function fetchData() {
        setLoadingDecision(true);
        try {
          const [decision, status] = await Promise.all([
            AgrosmartService.getActiveProgrammation(),
            AgrosmartService.getPumpStatus()
          ]);
          if (isActive) {
            setActiveDecision(decision);
            setIsPumpActive(status?.active);
            setPumpStatus(status?.arrosage);
          }
        } catch (e) {
          console.log("Erreur init:", e);
        } finally {
          if (isActive) setLoadingDecision(false);
        }
      }
      fetchData();
      return () => { isActive = false; };
    }, [])
  );

  const [volumeLitres, setVolumeLitres] = useState(Math.round(180 + 0.68 * 620));

  const handleStart = async () => {
    if (isStarting) return;
    try {
      setIsStarting(true);
      
      if (startMode === "Maintenant" && isPumpActive) {
        setActivePumpModalVisible(true);
        setIsStarting(false);
        return;
      }

      let mins = 30;
      if (duration === "15") mins = 15;
      if (duration === "45") mins = 45;
      if (duration === "1 HEURE") mins = 60;
      if (duration === "Personnalisé" && customDurationMins !== null) mins = customDurationMins;

      if (startMode === "Plus tard" && !scheduledDate) {
        Alert.alert("Veuillez choisir une heure de programmation en cliquant sur Plus tard.");
        setIsStarting(false);
        return;
      }

      setPendingMins(mins);
      const check = await AgrosmartService.checkPumpConditions();
      
      if (check?.status === 'warning') {
        setWarningMessage(check.message);
        setWarningVisible(true);
        setIsStarting(false);
        return;
      }

      if (startMode === "Plus tard") {
        await AgrosmartService.programPump(mins, volumeLitres, scheduledDate);
        navigation.navigate("IrrigationStarted", {
          isScheduled: true,
          scheduledLabel,
          scheduledTimestamp,
          durationMins: mins,
          volumeLitres,
          parcel,
        });
      } else {
        await AgrosmartService.startPump(mins, volumeLitres);
        navigation.navigate("IrrigationStarted", {
          durationMins: mins,
          volumeLitres,
          parcel,
        });
      }
    } catch (error: any) {
      console.log("Erreur demarrage pompe:", error);
      Alert.alert("Erreur", error?.response?.data?.message || error?.message || "Erreur de connexion avec le capteur.");
    } finally {
      setIsStarting(false);
    }
  };

  const handleSelectMode = (item: string) => {
    if (item === "Maintenant" && isPumpActive) {
      setActivePumpModalVisible(true);
      return;
    }
    setStartMode(item);
    if (item === "Plus tard") {
      setPickerVisible(true);
    } else {
      setScheduledDate("");
      setScheduledLabel("");
      setScheduledTimestamp(0);
    }
  };

  const handleSelectDuration = (item: string) => {
    setDuration(item);
    if (item === "Personnalisé") {
      setDurationPickerVisible(true);
    } else {
      setCustomDurationMins(null);
    }
  };

  return (
    <Screen scroll={false} contentStyle={{ flex: 1 }}>
      <AppHeader 
        title="Programmer" 
        back 
        onBack={() => navigation.goBack()} 
        rightElement={
          isPumpActive ? (
            <Pressable 
              onPress={() => {
                let remainingMins = pumpStatus?.duree_minutes !== undefined ? pumpStatus.duree_minutes : null;
                let volume = pumpStatus?.volume_litres !== undefined ? pumpStatus.volume_litres : null;
                let startedAt = pumpStatus?.debut_arrosage ? new Date(pumpStatus.debut_arrosage).getTime() : Date.now();
                
                // If backend provides elapsed time, use it, else calculate locally
                let passedSecs = pumpStatus?.duree_ecoulee_secondes !== undefined 
                    ? pumpStatus.duree_ecoulee_secondes 
                    : Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
                
                navigation.navigate("IrrigationStarted", { 
                  isScheduled: false, 
                  durationMins: remainingMins, 
                  volumeLitres: volume, 
                  parcel,
                  passedSecs
                });
              }}
              style={styles.eyeButton}
            >
              <MaterialIcons name="visibility" size={24} color={colors.primary} />
            </Pressable>
          ) : null
        }
      />
      <Text style={styles.title}>Programmer l'arrosage</Text>

      {loadingDecision ? (
        <Text style={{ textAlign: 'center', marginTop: 40 }}>Vérification...</Text>
      ) : activeDecision ? (
        <View style={styles.lockedContainer}>
          <MaterialIcons name="lock-clock" size={64} color={colors.secondary} />
          <Text style={styles.lockedTitle}>Arrosage déjà programmé</Text>
          <Text style={styles.lockedSubtitle}>
            Un arrosage est prévu à {activeDecision.heure_programmee?.slice(0, 5) || "une heure ultérieure"}. Vous ne pouvez pas programmer un autre arrosage pour le moment.
          </Text>
          <AppButton
            label="Voir l'état"
            icon="visibility"
            onPress={() => {
              navigation.navigate("IrrigationStarted", {
                isScheduled: true,
                scheduledLabel: `Aujourd'hui à ${activeDecision.heure_programmee?.slice(0, 5)}`,
              });
            }}
            style={{ marginTop: 24, width: '100%' }}
          />
          <Pressable onPress={async () => {
            try {
              await AgrosmartService.cancelProgrammation();
              setActiveDecision(null);
              Alert.alert("Succès", "Programmation annulée.");
            } catch (e: any) {
              Alert.alert("Erreur", e.message);
            }
          }} style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}>
            <MaterialIcons name="cancel" size={20} color={colors.error} />
            <Text style={styles.cancelButtonText}>Annuler la programmation</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          <Text style={styles.section}>Choisir la parcelle</Text>
          <View style={styles.parcels}>
            {parcels.map((item) => (
              <ChoicePill key={item} label={item} active={parcel === item} onPress={() => setParcel(item)} />
            ))}
          </View>

          <Text style={styles.section}>Durée</Text>
          <View style={styles.grid}>
            {durations.map((item) => {
              let displayLabel = item;
              if (item === "Personnalisé" && customDurationMins !== null) {
                const m = Math.floor(customDurationMins);
                const s = Math.round((customDurationMins - m) * 60);
                displayLabel = `${m}m ${s}s`;
              }
              return (
                <Pressable key={item} onPress={() => handleSelectDuration(item)} style={({ pressed }) => [styles.duration, duration === item && styles.durationActive, pressed && styles.pressed]}>
                  <Text style={[styles.durationText, duration === item && styles.durationTextActive]}>{displayLabel}</Text>
                </Pressable>
              );
            })}
          </View>

      <VolumeSlider initialVolume={volumeLitres} onChange={setVolumeLitres} />

      <Text style={styles.section}>Démarrage</Text>
      <View style={styles.parcels}>
        {startModes.map((item) => (
          <ChoicePill key={item} label={item} active={startMode === item} onPress={() => handleSelectMode(item)} />
        ))}
      </View>
      
      {startMode === "Plus tard" && scheduledLabel ? (
        <Text style={{ fontFamily: fonts.body, color: colors.primary, textAlign: 'center', marginBottom: 12 }}>
          Prévu pour : {scheduledLabel}
        </Text>
      ) : null}

      <AppButton isLoading={isStarting} label={startMode === "Plus tard" ? "Programmer l'arrosage" : "Démarrer l'arrosage"} icon="play-arrow" onPress={handleStart} style={{ marginTop: spacing.stackLg }} />

      <PumpWarningModal
        visible={warningVisible}
        message={warningMessage}
        onCancel={() => setWarningVisible(false)}
        onConfirm={async () => {
          setWarningVisible(false);
          try {
            if (startMode === "Plus tard") {
              await AgrosmartService.programPump(pendingMins, volumeLitres, scheduledDate);
              navigation.navigate("IrrigationStarted", {
                isScheduled: true,
                scheduledLabel,
                scheduledTimestamp,
                durationMins: pendingMins,
                volumeLitres,
                parcel,
              });
            } else {
              await AgrosmartService.startPump(pendingMins, volumeLitres);
              navigation.navigate("IrrigationStarted", {
                durationMins: pendingMins,
                volumeLitres,
                parcel,
              });
            }
          } catch (error: any) {
            console.log("Erreur bypass:", error);
            Alert.alert("Erreur", error?.response?.data?.message || error?.message || "Erreur de connexion");
          }
        }}
      />

      <TimePickerModal
        visible={pickerVisible}
        onCancel={() => {
          setPickerVisible(false);
          if (!scheduledDate) setStartMode("Maintenant");
        }}
        onSelect={(date, label, timestamp) => {
          setScheduledDate(date);
          setScheduledLabel(label);
          setScheduledTimestamp(timestamp);
          setPickerVisible(false);
        }}
      />

      <DurationPickerModal
        visible={durationPickerVisible}
        onCancel={() => {
          setDurationPickerVisible(false);
          if (customDurationMins === null) setDuration("30");
        }}
        onSelect={(min, sec) => {
          setCustomDurationMins(min + sec / 60);
          setDurationPickerVisible(false);
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
            Alert.alert("Succès", "L'arrosage a été arrêté.");
          } catch (error: any) {
            Alert.alert("Erreur", error?.message || "Impossible d'arrêter la pompe.");
          }
        }}
      />
      </ScrollView>
      )}
    </Screen>
  );
}

function ChoicePill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.choice, active && styles.choiceActive, pressed && styles.pressed]}>
      <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{label}</Text>
    </Pressable>
  );
}

function VolumeSlider({ initialVolume, onChange }: { initialVolume: number, onChange: (v: number) => void }) {
  const [sliderWidth, setSliderWidth] = useState(1);
  const [volumePercent, setVolumePercent] = useState((initialVolume - 180) / 620);
  const volumeRef = useRef(volumePercent);
  const volumeLitres = Math.round(180 + volumePercent * 620);
  const startPercentRef = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => {
        const locX = evt.nativeEvent.locationX;
        const initialP = Math.max(0, Math.min(1, locX / sliderWidth));
        startPercentRef.current = initialP;
        volumeRef.current = initialP;
        setVolumePercent(initialP);
      },
      onPanResponderMove: (evt, gestureState) => {
        const newP = Math.max(0, Math.min(1, startPercentRef.current + (gestureState.dx / sliderWidth)));
        volumeRef.current = newP;
        setVolumePercent(newP);
      },
      onPanResponderRelease: () => {
        onChange(Math.round(180 + volumeRef.current * 620));
      },
    })
  ).current;

  return (
    <View style={styles.volumeCard}>
      <View style={styles.volumeRow}>
        <MaterialIcons name="water-drop" size={34} color={colors.water} />
        <View style={{ flex: 1 }}>
          <Text style={styles.volumeLabel}>Volume estimé</Text>
          <Text style={styles.volume}>{volumeLitres} Litres</Text>
        </View>
      </View>
      <View
        onLayout={(event) => setSliderWidth(event.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
        style={styles.slider}
      >
        <View style={styles.sliderTrack} pointerEvents="none" />
        <View style={[styles.sliderFill, { width: `${volumePercent * 100}%` }]} pointerEvents="none" />
        <View style={[styles.knob, { left: `${Math.max(0, Math.min(100 - (24/sliderWidth)*100, volumePercent * 100))}%` }]} pointerEvents="none" />
      </View>
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabel}>180 L</Text>
        <Text style={styles.sliderLabel}>800 L</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { ...type.h1Mobile, fontFamily: fonts.heading, color: colors.onSurface, marginBottom: spacing.stackMd },
  section: { ...type.label, fontFamily: fonts.body, color: colors.onSurfaceVariant, marginBottom: 10, marginTop: 8 },
  parcels: { flexDirection: "row", gap: 10, marginBottom: 18 },
  choice: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radius.full,
    paddingHorizontal: 10,
  },
  choiceActive: { backgroundColor: colors.primary },
  choiceText: { ...type.label, fontFamily: fonts.body, color: colors.onSurfaceVariant, textAlign: "center" },
  choiceTextActive: { color: colors.onPrimary },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  duration: {
    width: "48%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.card,
    paddingVertical: 24,
    overflow: "hidden",
    ...shadow.card,
  },
  durationActive: { backgroundColor: colors.secondary },
  durationText: { ...type.label, fontFamily: fonts.body, color: colors.onSurface, textAlign: "center", fontSize: 20 },
  durationTextActive: { color: colors.onSurface, fontFamily: fonts.heading },
  volumeCard: { borderRadius: radius.card, backgroundColor: colors.surfaceContainerLowest, padding: 18, marginVertical: 18, ...shadow.card },
  volumeRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  volumeLabel: { ...type.labelSm, fontFamily: fonts.body, color: colors.onSurfaceVariant, textTransform: "uppercase" },
  volume: { ...type.h1Mobile, fontFamily: fonts.heading, color: colors.onSurface },
  slider: { height: 44, justifyContent: "center", overflow: "visible" },
  sliderTrack: { height: 12, borderRadius: 6, backgroundColor: colors.surfaceContainerHigh, position: "absolute", left: 0, right: 0 },
  sliderFill: { height: 12, borderRadius: 6, backgroundColor: colors.secondary, position: "absolute", left: 0 },
  knob: { position: "absolute", width: 24, height: 24, borderRadius: 12, backgroundColor: colors.secondary, borderWidth: 4, borderColor: colors.surfaceContainerLowest, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3 },
  sliderLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  sliderLabel: { ...type.labelSm, fontFamily: fonts.body, color: colors.outline },
  lockedContainer: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.card,
    padding: spacing.stackLg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.stackMd,
    ...shadow.card,
  },
  lockedTitle: { ...type.h2, fontFamily: fonts.heading, color: colors.secondary, marginTop: 16, marginBottom: 8, textAlign: "center" },
  lockedSubtitle: { ...type.body, fontFamily: fonts.body, color: colors.onSurfaceVariant, textAlign: "center", marginBottom: 24 },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
    marginTop: 12,
  },
  cancelButtonText: { ...type.label, fontFamily: fonts.heading, color: colors.error },
  eyeButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryContainer, borderRadius: 20 },
});
