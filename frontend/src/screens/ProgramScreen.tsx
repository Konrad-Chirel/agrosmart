import { MaterialIcons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState, useMemo } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppButton } from "../components/AppButton";
import { useOnboarding } from "../data/onboardingState";
import { AgrosmartService } from "../services/AgrosmartService";
import { colors, fonts, radius, shadow, spacing, type } from "../theme";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Program">;

type CalendarItem = {
  date: string;
  jour: string;
  heure: string;
  type: string;
  titre: string;
  description: string;
  volume_litres: number;
  stade?: string;
  source?: string;
  status?: "done" | "upcoming" | "planned"; // Mock status for UI
};

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const TODAY_INDEX = 2; // "Mer" default for mockup

export function ProgramScreen({ navigation }: Props) {
  const { profileImage } = useOnboarding();
  const [culture, setCulture] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1); // Default to today

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const dashboard = await AgrosmartService.getDashboard();
      if (!dashboard?.culture?.id) {
        throw new Error("Aucune culture en cours trouvée.");
      }
      const data = await AgrosmartService.getCulture(dashboard.culture.id);
      setCulture(data);
    } catch (e) {
      console.log(e);
      setError("Impossible de charger le programme.");
    } finally {
      setLoading(false);
    }
  };

  const dayEvents = useMemo(() => {
    if (!culture?.calendrier_arrosage) return [];
    
    // Convert selectedDayIndex (0 = Lun, 6 = Dim) to JS getDay() (0 = Dim, 1 = Lun)
    const targetJsDay = selectedDayIndex === 6 ? 0 : selectedDayIndex + 1;
    
    return culture.calendrier_arrosage.filter((item: any) => {
      if (!item.date) return false;
      const d = new Date(item.date);
      return d.getDay() === targetJsDay;
    });
  }, [culture, selectedDayIndex]);

  // Determine next irrigation for the big card
  const nextIrrigation = useMemo(() => {
    if (!culture?.calendrier_arrosage) return null;
    const upcoming = culture.calendrier_arrosage.filter((i: any) => 
      i.statut === "a_venir" || i.statut === "planifie" || i.statut === "annule"
    );
    if (upcoming.length > 0) return upcoming[0];
    return null;
  }, [culture]);

  const showNextIrrigationCard = useMemo(() => {
    const targetJsDay = selectedDayIndex === 6 ? 0 : selectedDayIndex + 1;
    if (nextIrrigation && nextIrrigation.date) {
      return new Date(nextIrrigation.date).getDay() === targetJsDay;
    }
    // If no next irrigation, show it only on today's tab
    return new Date().getDay() === targetJsDay;
  }, [nextIrrigation, selectedDayIndex]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <MaterialIcons name="arrow-back" size={28} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>AgroSmart</Text>
        <Image source={{ uri: profileImage }} style={styles.avatar} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Programme Intelligent ⚡</Text>
          <Text style={styles.subTitle}>{culture?.calendrier_arrosage?.some((i: any) => i.source?.includes('pluie')) ? "Recalculé suite à la pluie" : "Basé sur les besoins de la plante"}</Text>
        </View>

        <View style={styles.daysRow}>
          {WEEKDAYS.map((day, index) => (
            <Pressable 
              key={day} 
              onPress={() => setSelectedDayIndex(index)}
              style={[styles.dayPill, selectedDayIndex === index && styles.dayPillActive]}
            >
              <Text style={[styles.dayText, selectedDayIndex === index && styles.dayTextActive]} numberOfLines={1}>
                {day}
              </Text>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {showNextIrrigationCard && (
              <View style={styles.nextIrrigationCard}>
                <Text style={styles.nextSubtitle}>PROCHAIN ARROSAGE</Text>
                {nextIrrigation ? (
                  nextIrrigation.statut === "annule" ? (
                    <>
                      <Text style={[styles.nextTime, { fontSize: 28 }]}>Annulé</Text>
                      <Text style={styles.nextDetail}>{nextIrrigation.jour} • {nextIrrigation.description}</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.nextTime}>{nextIrrigation.heure}</Text>
                      <Text style={styles.nextDetail}>{nextIrrigation.jour} • Parcelle {culture?.nom || "En cours"} • {nextIrrigation.volume_litres} L</Text>
                    </>
                  )
                ) : (
                  <>
                    <Text style={styles.nextTime}>Aucun</Text>
                    <Text style={styles.nextDetail}>Aucun arrosage prévu prochainement</Text>
                  </>
                )}
              </View>
            )}

            <View style={styles.eventsList}>
              {dayEvents.map((item: any, i: number) => {
                const isUpcoming = item.statut === "a_venir";
                const isDone = item.statut === "fait";
                const isPlanned = item.statut === "planifie";
                const isMissed = item.statut === "manque";
                const isCancelled = item.statut === "annule";

                return (
                  <View key={i} style={[styles.eventCard, isCancelled && { opacity: 0.6 }]}>
                    <View style={[
                      styles.timeBadge, 
                      isUpcoming ? styles.timeBadgeUpcoming : 
                      isMissed ? styles.timeBadgeMissed : 
                      isCancelled ? styles.timeBadgeMissed :
                      styles.timeBadgeDone
                    ]}>
                      <Text style={[
                        styles.timeText, 
                        isUpcoming ? styles.timeTextUpcoming : 
                        isMissed ? styles.timeTextMissed : 
                        isCancelled ? styles.timeTextMissed :
                        styles.timeTextDone
                      ]}>
                        {isCancelled ? "---" : item.heure}
                      </Text>
                    </View>
                    <View style={styles.eventInfo}>
                      <Text style={[styles.eventVolume, isCancelled && { textDecorationLine: "line-through" }]}>
                        {item.volume_litres} Litres
                      </Text>
                      <Text style={styles.eventDesc}>{item.description}</Text>
                    </View>
                    <View style={styles.eventStatus}>
                      {isUpcoming && <MaterialIcons name="check-circle" size={16} color={colors.secondary} />}
                      {isDone && <MaterialIcons name="check-circle" size={16} color={colors.outline} />}
                      {isMissed && <MaterialIcons name="cancel" size={16} color={colors.error} />}
                      {isCancelled && <MaterialIcons name="block" size={16} color={colors.error} />}
                      <Text style={[
                        styles.statusText, 
                        isUpcoming && { color: colors.secondary },
                        isPlanned && { color: colors.secondary },
                        isMissed && { color: colors.error },
                        isCancelled && { color: colors.error }
                      ]}>
                        {isUpcoming ? "À venir" : isDone ? "Fait" : isMissed ? "Manqué" : isCancelled ? "Annulé" : "Planifié"}
                      </Text>
                    </View>
                  </View>
                );
              })}
              {dayEvents.length === 0 && (
                <Text style={{ textAlign: 'center', color: colors.onSurfaceVariant, marginTop: 20 }}>Aucun arrosage ce jour-là.</Text>
              )}
            </View>
          </>
        )}

        <View style={styles.bottomActions}>
          <Pressable onPress={() => navigation.navigate("ManualProgramming")} style={({ pressed }) => [styles.manualBtn, pressed && styles.pressed]}>
            <MaterialIcons name="add" size={20} color={colors.onPrimary} />
            <Text style={styles.manualBtnText}>Programmer manuellement</Text>
          </Pressable>
          
          <Pressable onPress={() => navigation.navigate("History")} style={({ pressed }) => [styles.historyBtn, pressed && styles.pressed]}>
            <MaterialIcons name="history" size={20} color={colors.onPrimary} />
            <Text style={styles.historyBtnText}>Voir historique des arrosages</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fbfcf8" }, // matches typical surface background
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    ...type.h2,
    fontFamily: fonts.heading,
    color: colors.primary, // AgroSmart green
    marginLeft: 8,
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerHigh,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  titleSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  mainTitle: {
    ...type.h1Mobile,
    fontFamily: fonts.heading,
    color: colors.onSurface,
  },
  subTitle: {
    ...type.label,
    fontFamily: fonts.body,
    color: "#a3704c", // Brownish/orange color from mockup
    marginTop: 4,
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 4,
  },
  dayPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#e8ede4", // light greenish gray
    alignItems: "center",
  },
  dayPillActive: {
    backgroundColor: "#0d5c22", // dark green
  },
  dayText: {
    ...type.label,
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.onSurfaceVariant,
  },
  dayTextActive: {
    color: colors.onPrimary,
    fontWeight: "600",
  },
  nextIrrigationCard: {
    backgroundColor: "#0d5c22", // dark green
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    ...shadow.lift,
  },
  nextSubtitle: {
    ...type.labelSm,
    fontFamily: fonts.body,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1,
    marginBottom: 4,
  },
  nextTime: {
    ...type.display,
    fontFamily: fonts.heading,
    fontSize: 32,
    color: colors.onPrimary,
    marginBottom: 8,
  },
  nextDetail: {
    ...type.label,
    fontFamily: fonts.body,
    color: "rgba(255,255,255,0.9)",
  },
  eventsList: {
    gap: 12,
    marginBottom: 32,
  },
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 20,
    padding: 16,
    ...shadow.card,
  },
  timeBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  timeBadgeUpcoming: {
    backgroundColor: "#0d5c22", // dark green
  },
  timeBadgeDone: {
    backgroundColor: "#e8ede4", // light grey/green
  },
  timeBadgeMissed: {
    backgroundColor: "#ffdad6", // light red background
  },
  timeText: {
    ...type.label,
    fontFamily: fonts.body,
  },
  timeTextUpcoming: {
    color: colors.onPrimary,
  },
  timeTextDone: {
    color: colors.onSurfaceVariant,
  },
  timeTextMissed: {
    color: colors.error,
  },
  eventInfo: {
    flex: 1,
  },
  eventVolume: {
    ...type.h2,
    fontSize: 16,
    color: colors.onSurface,
    marginBottom: 4,
  },
  eventDesc: {
    ...type.body,
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  eventStatus: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  statusText: {
    ...type.labelSm,
    fontFamily: fonts.body,
    color: colors.onSurfaceVariant, // default gray
  },
  bottomActions: {
    gap: 16,
    marginTop: 10,
  },
  manualBtn: {
    backgroundColor: "#0d5c22", // dark green
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    paddingVertical: 16,
    gap: 8,
  },
  manualBtnText: {
    ...type.label,
    fontFamily: fonts.body,
    color: colors.onPrimary,
  },
  historyBtn: {
    backgroundColor: colors.secondary, // Orange color
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    paddingVertical: 16,
    gap: 8,
  },
  historyBtnText: {
    ...type.label,
    fontFamily: fonts.body,
    color: colors.onPrimary,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  }
});
