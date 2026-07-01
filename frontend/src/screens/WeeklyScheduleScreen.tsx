import { MaterialIcons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOnboarding } from "../data/onboardingState";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { AgrosmartService } from "../services/AgrosmartService";
import { colors, fonts, radius, shadow, spacing, type } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "WeeklySchedule">;

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
};

type CultureSchedule = {
  nom: string;
  stade: string;
  calendrier_arrosage: CalendarItem[];
};

export function WeeklyScheduleScreen({ navigation, route }: Props) {
  const { profileImage } = useOnboarding();
  const [culture, setCulture] = useState<CultureSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("tout");

  const load = async () => {
    try {
      setLoading(true);
      setError(null);

      let cid = route.params?.cultureId;
      if (!cid) {
        const cultures = await AgrosmartService.getCultures();
        if (cultures && cultures.length > 0) {
          cid = cultures[0].id;
        }
      }

      if (!cid) {
        setError("Aucune culture enregistrée pour générer un programme.");
        setLoading(false);
        return;
      }

      const data = await AgrosmartService.getCulture(cid);
      setCulture(data);
    } catch {
      setError("Impossible de charger le programme.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [route.params?.cultureId]);

  const visibleEvents = useMemo(() => {
    const events = culture?.calendrier_arrosage || [];
    if (filter === "arrosage") return events.filter((event) => event.type !== "entretien");
    if (filter === "fertilisation") return events.filter((event) => event.type === "fertilisation");
    if (filter === "maintenance") return events.filter((event) => event.type === "entretien");
    return events;
  }, [culture?.calendrier_arrosage, filter]);

  const grouped = useMemo(() => groupByDate(visibleEvents), [visibleEvents]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.headerButton} hitSlop={10}>
            <MaterialIcons name="arrow-back" size={28} color={colors.onSurface} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Programme Hebdomadaire</Text>
          <Image source={{ uri: profileImage }} style={styles.avatar} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters} contentContainerStyle={styles.filtersContent}>
          <FilterPill label="Tout voir" active={filter === "tout"} onPress={() => setFilter("tout")} />
          <FilterPill icon="water-drop" label="Arrosage" active={filter === "arrosage"} onPress={() => setFilter("arrosage")} />
          <FilterPill icon="eco" label="Fertilisation" active={filter === "fertilisation"} onPress={() => setFilter("fertilisation")} />
          <FilterPill icon="build" label="Maintenance" active={filter === "maintenance"} onPress={() => setFilter("maintenance")} />
        </ScrollView>

        {loading ? (
          <StateBox text="Chargement du programme..." />
        ) : error || !culture ? (
          <Pressable onPress={load}>
            <StateBox text={`${error || "Programme introuvable."} Touchez pour réessayer.`} />
          </Pressable>
        ) : grouped.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialIcons name="event-busy" size={34} color={colors.primary} />
            <Text style={styles.emptyTitle}>Aucun programme cette semaine</Text>
            <Text style={styles.emptyText}>Le calendrier sera rempli dès qu'une décision d'arrosage sera disponible.</Text>
          </View>
        ) : (
          <View style={styles.timeline}>
            {grouped.map((day, index) => (
              <DaySection key={day.date} {...day} last={index === grouped.length - 1} />
            ))}
          </View>
        )}

        <View style={styles.imageCard}>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1200&auto=format&fit=crop" }}
            style={styles.image}
          />
          <View style={styles.imageOverlay}>
            <Text style={styles.imageTitle}>Prévisions favorables</Text>
            <Text style={styles.imageCopy}>Le programme reste adapté au stade de votre culture.</Text>
          </View>
          <Pressable style={styles.imageAdd} onPress={() => navigation.navigate("ManualProgramming")}>
            <MaterialIcons name="add" size={30} color={colors.onPrimary} />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FilterPill({ label, icon, active, onPress }: { label: string; icon?: keyof typeof MaterialIcons.glyphMap; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.filterPill, active && styles.filterPillActive]}>
      {icon ? <MaterialIcons name={icon} size={18} color={active ? colors.onSecondaryContainer : colors.onSurfaceVariant} /> : null}
      <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
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

function groupByDate(items: CalendarItem[]) {
  const groups: Array<{ date: string; label: string; events: CalendarItem[] }> = [];

  items.forEach((item) => {
    const existing = groups.find((group) => group.date === item.date);
    if (existing) {
      existing.events.push(item);
    } else {
      groups.push({ date: item.date, label: item.jour || formatDayTitle(item.date), events: [item] });
    }
  });

  return groups;
}

function DaySection({ date, label, events, last }: { date: string; label: string; events: CalendarItem[]; last: boolean }) {
  const dayNumber = getDayNumber(date);
  const sectionMeta = isToday(date) ? `AUJOURD'HUI • ${events.length} ÉVÉNEMENT${events.length > 1 ? "S" : ""}` : `${events.length} ÉVÉNEMENT${events.length > 1 ? "S" : ""}`;

  return (
    <View style={styles.daySection}>
      <View style={styles.dayHeader}>
        <View style={[styles.dayBubble, isToday(date) ? styles.dayBubbleActive : styles.dayBubbleIdle]}>
          <Text style={[styles.dayNumber, !isToday(date) && styles.dayNumberIdle]}>{dayNumber}</Text>
        </View>
        <View>
          <Text style={styles.dayTitle}>{formatDayTitle(date, label)}</Text>
          <Text style={[styles.dayMeta, !isToday(date) && styles.dayMetaIdle]}>{sectionMeta}</Text>
        </View>
      </View>

      <View style={styles.eventColumn}>
        {!last ? <View style={styles.timelineLine} /> : null}
        {events.map((event, index) => (
          <EventCard key={`${event.date}-${event.heure}-${index}`} event={event} index={index} />
        ))}
      </View>
    </View>
  );
}

function EventCard({ event, index }: { event: CalendarItem; index: number }) {
  const style = getEventStyle(event, index);
  const finished = event.type === "termine" || event.type === "terminé";

  return (
    <View style={[styles.eventCard, finished && styles.eventCardDone]}>
      <View style={[styles.eventIcon, { backgroundColor: style.bg }]}>
        <MaterialIcons name={style.icon} size={25} color={style.color} />
      </View>
      <View style={styles.eventBody}>
        <View style={styles.eventTitleRow}>
          <Text style={styles.eventTitle} numberOfLines={1}>{event.titre || "Arrosage automatique"}</Text>
          {index < 3 ? <Text style={[styles.eventStatus, { backgroundColor: style.pillBg, color: style.pillColor }]}>{style.status}</Text> : null}
        </View>
        <Text style={styles.eventDescription} numberOfLines={1}>{event.description || "Programme calculé par le système"}</Text>
        <View style={styles.eventMetaRow}>
          <Meta icon="schedule" text={event.heure || "06:00"} />
          <Meta icon="opacity" text={`${Math.round(Number(event.volume_litres || 0))}L`} />
        </View>
      </View>
    </View>
  );
}

function Meta({ icon, text }: { icon: keyof typeof MaterialIcons.glyphMap; text: string }) {
  return (
    <View style={styles.meta}>
      <MaterialIcons name={icon} size={14} color={colors.outline} />
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

function getEventStyle(event: CalendarItem, index: number) {
  if (event.type === "fertilisation") {
    return { icon: "eco" as const, color: "#166534", bg: "#ecfdf3", pillBg: colors.surfaceContainerHighest, pillColor: colors.onSurfaceVariant, status: "À VENIR" };
  }
  if (event.type === "entretien" || event.type === "maintenance") {
    return { icon: "build" as const, color: "#ea580c", bg: "#fff7ed", pillBg: colors.secondaryContainer, pillColor: colors.onSecondaryContainer, status: "EN COURS" };
  }
  if (event.type === "urgent") {
    return { icon: "warning" as const, color: colors.error, bg: colors.errorContainer, pillBg: colors.errorContainer, pillColor: colors.onErrorContainer, status: "URGENT" };
  }
  return { icon: "water-drop" as const, color: "#2563eb", bg: "#eff6ff", pillBg: index === 0 ? colors.primaryContainer : colors.surfaceContainerHighest, pillColor: index === 0 ? colors.onPrimary : colors.onSurfaceVariant, status: index === 0 ? "PLANIFIÉ" : "À VENIR" };
}

function getDayNumber(date: string) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? "--" : String(parsed.getDate()).padStart(2, "0");
}

function isToday(date: string) {
  const parsed = new Date(date);
  const today = new Date();
  return parsed.toDateString() === today.toDateString();
}

function formatDayTitle(date: string, fallback?: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return fallback || date;
  const label = parsed.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { width: "100%", maxWidth: 430, alignSelf: "center", paddingHorizontal: spacing.mobile, paddingBottom: 40 },
  header: { height: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  headerButton: { width: 44, height: 44, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 24, lineHeight: 30, fontFamily: fonts.heading, color: colors.primary, flex: 1, textAlign: "center" },
  avatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: colors.primaryFixed },
  filters: { marginBottom: 22 },
  filtersContent: { flexDirection: "row", gap: 8, paddingRight: 8 },
  filterPill: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: radius.full, backgroundColor: colors.surfaceContainerLowest, borderWidth: 1, borderColor: colors.outlineVariant, paddingHorizontal: 13, paddingVertical: 8 },
  filterPillActive: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  filterText: { ...type.labelSm, fontFamily: fonts.body, color: colors.onSurfaceVariant, letterSpacing: 0.6 },
  filterTextActive: { color: "#ffffff", fontWeight: "700" },
  stateBox: { minHeight: 220, borderRadius: radius.card, backgroundColor: colors.surfaceContainerLowest, alignItems: "center", justifyContent: "center", gap: 10, padding: 18, ...shadow.card },
  stateText: { ...type.body, fontFamily: fonts.body, color: colors.onSurfaceVariant, textAlign: "center" },
  emptyCard: { borderRadius: radius.card, backgroundColor: colors.surfaceContainerLowest, borderWidth: 1, borderColor: colors.outlineVariant, padding: 24, alignItems: "center", gap: 8, ...shadow.card },
  emptyTitle: { ...type.h2, fontFamily: fonts.heading, color: colors.onSurface, textAlign: "center" },
  emptyText: { ...type.body, fontFamily: fonts.body, color: colors.onSurfaceVariant, textAlign: "center" },
  timeline: { gap: spacing.stackLg },
  daySection: { position: "relative" },
  dayHeader: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 14 },
  dayBubble: { zIndex: 2, width: 40, height: 40, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  dayBubbleActive: { backgroundColor: colors.primary },
  dayBubbleIdle: { backgroundColor: colors.surfaceContainerHighest },
  dayNumber: { ...type.label, fontFamily: fonts.heading, color: colors.onPrimary },
  dayNumberIdle: { color: colors.onSurface },
  dayTitle: { ...type.h2, fontFamily: fonts.heading, color: colors.onSurface },
  dayMeta: { ...type.labelSm, fontFamily: fonts.body, color: colors.primary, letterSpacing: 0.5 },
  dayMetaIdle: { color: colors.outline },
  eventColumn: { marginLeft: 20, paddingLeft: 28, gap: 14, position: "relative" },
  timelineLine: { position: "absolute", left: 0, top: 0, bottom: -38, width: 2, borderLeftWidth: 2, borderStyle: "dashed", borderLeftColor: colors.outlineVariant },
  eventCard: { flexDirection: "row", alignItems: "flex-start", gap: 14, borderRadius: radius.xl, backgroundColor: colors.surfaceContainerLowest, borderWidth: 1, borderColor: colors.outlineVariant, padding: 14, ...shadow.card },
  eventCardDone: { opacity: 0.78 },
  eventIcon: { width: 48, height: 48, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  eventBody: { flex: 1, minWidth: 0 },
  eventTitleRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  eventTitle: { flex: 1, fontSize: 16, lineHeight: 22, fontWeight: "700", fontFamily: fonts.heading, color: colors.onSurface },
  eventStatus: { fontSize: 10, lineHeight: 14, fontWeight: "800", fontFamily: fonts.body, overflow: "hidden", borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  eventDescription: { ...type.labelSm, fontFamily: fonts.body, color: colors.onSurfaceVariant, marginTop: 3 },
  eventMetaRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8, flexWrap: "wrap" },
  meta: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { ...type.labelSm, fontFamily: fonts.body, color: colors.outline },
  imageCard: { marginTop: 28, height: 190, borderRadius: radius.card, overflow: "hidden", backgroundColor: colors.primary, ...shadow.card },
  image: { width: "100%", height: "100%" },
  imageOverlay: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 18, backgroundColor: `${colors.primary}CC` },
  imageTitle: { ...type.h2, fontFamily: fonts.heading, color: colors.onPrimary },
  imageCopy: { ...type.labelSm, fontFamily: fonts.body, color: "#ffffffcc", marginTop: 3 },
  imageAdd: { position: "absolute", right: 0, bottom: 0, width: 58, height: 58, borderTopLeftRadius: 30, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
});
