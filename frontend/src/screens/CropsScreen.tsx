// @ts-nocheck
import { MaterialIcons } from "@expo/vector-icons";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { CompositeScreenProps, useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Animated, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { AppHeader } from "../components/AppHeader";
import { Screen } from "../components/Screen";
import { images } from "../data/mockData";
import type { MainTabParamList, RootStackParamList } from "../navigation/RootNavigator";
import { AgrosmartService } from "../services/AgrosmartService";
import { colors, fonts, radius, shadow, spacing, type } from "../theme";

type Props = CompositeScreenProps<BottomTabScreenProps<MainTabParamList, "Crops">, NativeStackScreenProps<RootStackParamList>>;
type CropApi = {
  id: number;
  type_culture: string;
  nom: string;
  emoji?: string;
  stade: string;
  sante: string;
  alerte: boolean;
  semaine_actuelle: number;
  cycle_semaines: number;
  progression: number;
  prochain_arrosage: string;
  humidite_sol: { texte: string; valeur: number | null; niveau: string };
};

// Image mapping per crop type using Unsplash URLs
const CROP_IMAGES: Record<string, string> = {
  tomate: "https://images.unsplash.com/photo-1546470427-e26264be0b0a?w=400&q=80",
  piment: "https://images.unsplash.com/photo-1596647225145-c4530fc6e7c7?w=400&q=80", // Vraie plante de piment sans fond blanc
  oignon: "https://images.unsplash.com/photo-1508747703725-719777637510?w=400&q=80",
  laitue: "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400&q=80",
  mais:   "https://images.unsplash.com/photo-1601593346740-925612772716?w=400&q=80",
  carotte:"https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80",
};

function imageForCulture(type: string) {
  const t = type?.toLowerCase() || "";
  if (t.includes("piment")) return { uri: images.chili };
  if (t.includes("oignon")) return { uri: images.onion };
  if (t.includes("laitue")) return { uri: images.lettuce };
  if (t.includes("mais") || t.includes("maïs")) return { uri: images.corn };
  if (t.includes("carotte")) return { uri: images.carrot };
  return { uri: images.tomatoes };
}

// ── Per-card health colors ────────────────────────────────────────────
function healthColor(sante: string, alerte: boolean) {
  if (alerte) {
    if (sante?.toLowerCase().includes("asphyxie")) return { dot: "#ef4444", text: "#b91c1c" }; // Red
    return { dot: "#f97316", text: "#c2410c" }; // Orange
  }
  if (sante?.toLowerCase().includes("excellent")) return { dot: "#16a34a", text: "#15803d" };
  return { dot: "#f59e0b", text: "#b45309" };
}

export function CropsScreen({ navigation }: Props) {
  const [cultures, setCultures] = useState<CropApi[]>([]);
  const [totalActives, setTotalActives] = useState(0);
  const [parcellesDisponibles, setParcellesDisponibles] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [hardwareModalVisible, setHardwareModalVisible] = useState(false);

  const loadCultures = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AgrosmartService.getCultures();
      const loadedCultures = Array.isArray(data) ? data : (data?.cultures || []);
      setCultures(loadedCultures);
      setTotalActives(Array.isArray(data) ? loadedCultures.length : (data?.total_actives || loadedCultures.length));
      setParcellesDisponibles(Array.isArray(data) ? 0 : (data?.parcelles_disponibles || 0));
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }).start();
    } catch {
      setError("Impossible de charger vos cultures.");
      setCultures([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadCultures(); }, [loadCultures]));

  return (
    <Screen contentStyle={{ paddingHorizontal: 16 }}>
      <AppHeader />

      {/* Heading */}
      <View style={styles.heading}>
        <View>
          <Text style={styles.title}>Mes Cultures</Text>
          <Text style={styles.subtitle}>Suivi de la santé et croissance</Text>
        </View>
        <Pressable style={styles.filterBtn}>
          <MaterialIcons name="filter-list" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.stateText}>Chargement de vos cultures...</Text>
          </View>
        ) : error ? (
          <Pressable onPress={loadCultures}>
            <View style={styles.stateBox}>
              <MaterialIcons name="wifi-off" size={36} color={colors.error} />
              <Text style={styles.stateText}>{error}</Text>
              <Text style={[styles.stateText, { color: colors.primary }]}>Touchez pour réessayer.</Text>
            </View>
          </Pressable>
        ) : cultures.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="grass" size={36} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Aucune culture enregistrée</Text>
            <Text style={styles.emptyCopy}>
              Ajoutez la culture plantée dans votre champ pour voir son stade, son humidité et son prochain arrosage.
            </Text>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            {cultures.map((culture) => {
              const hc = healthColor(culture.sante, culture.alerte);
              return (
                <Pressable
                  key={culture.id}
                  onPress={() => navigation.navigate("CultureDetail", { cultureId: culture.id, cultureName: culture.nom })}
                  style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                >
                  {/* Top section: image + details */}
                  <View style={styles.cardTop}>
                    <Image
                      source={imageForCulture(culture.type_culture)}
                      style={styles.cropImg}
                      resizeMode="cover"
                    />
                    <View style={styles.cardInfo}>
                      <View style={styles.nameBadgeRow}>
                        <Text style={styles.cropName} numberOfLines={1}>
                          {culture.emoji ? `${culture.emoji} ` : ""}{culture.nom}
                        </Text>
                        <View style={[styles.stageBadge, culture.alerte && styles.stageBadgeAlert]}>
                          <Text style={[styles.stageText, culture.alerte && styles.stageTextAlert]}>
                            {culture.stade}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.healthRow}>
                        <View style={[styles.healthDot, { backgroundColor: hc.dot }]} />
                        <Text style={[styles.healthText, { color: hc.text }]}>{culture.sante}</Text>
                      </View>

                      <View style={styles.progressRow}>
                        <Text style={styles.progressLabel}>
                          Croissance : Semaine {culture.semaine_actuelle}/{culture.cycle_semaines}
                        </Text>
                        <Text style={styles.progressVal}>{culture.progression}%</Text>
                      </View>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${culture.progression}%` }]} />
                      </View>
                    </View>
                  </View>

                  {/* Bottom section: watering + soil humidity */}
                  <View style={styles.cardBottom}>
                    <View style={styles.statLeft}>
                      <View style={[styles.statIconOrange, culture.alerte && culture.prochain_arrosage === "Immédiat" && styles.statIconUrgent]}>
                        <MaterialIcons 
                          name={culture.alerte && culture.prochain_arrosage === "Immédiat" ? "schedule" : "water-drop"} 
                          size={16} 
                          color={culture.alerte && culture.prochain_arrosage === "Immédiat" ? colors.error : "#ea580c"} 
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>PROCHAIN ARROSAGE</Text>
                        <Text style={[styles.statValue, culture.alerte && culture.prochain_arrosage === "Immédiat" && { color: colors.error }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                          {culture.prochain_arrosage}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.statRight}>
                      <View style={styles.statIconGreen}>
                        <MaterialIcons name={culture.alerte && culture.prochain_arrosage === "Immédiat" ? "grass" : "device-thermostat"} size={16} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>HUMIDITÉ SOL</Text>
                        <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{culture.humidite_sol?.texte || "En attente"}</Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </Animated.View>
        )}

        {/* Add culture CTA */}
        <AppButton
          label="Ajouter une culture"
          icon="add-circle-outline"
          iconPosition="left"
          onPress={() => setHardwareModalVisible(true)}
          style={{ marginTop: 8, marginBottom: 8 }}
        />
        <Text style={styles.countText}>
          {totalActives} culture{totalActives > 1 ? "s" : ""} active{totalActives > 1 ? "s" : ""} sur {totalActives + parcellesDisponibles} parcelles disponibles
        </Text>

        {/* Summary cells */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCell}>
            <MaterialIcons name="grass" size={26} color={colors.secondary} />
            <Text style={styles.summaryLabel}>Surface cultivée</Text>
            <Text style={styles.summaryValue}>1.2 Ha</Text>
          </View>
          <View style={[styles.summaryCell, styles.summaryCellGreen]}>
            <MaterialIcons name="show-chart" size={26} color={colors.primary} />
            <Text style={styles.summaryLabel}>Efficacité eau</Text>
            <Text style={styles.summaryValue}>84%</Text>
          </View>
        </View>
      </ScrollView>

      <Modal visible={hardwareModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconWrap}>
              <MaterialIcons name="memory" size={32} color={colors.primary} />
            </View>
            <Text style={styles.modalTitle}>Limite matérielle</Text>
            <Text style={styles.modalBody}>
              Vous avez déjà une culture en cours de suivi.
              {"\n\n"}
              Votre boîtier AgroSmart actuel est conçu pour gérer une seule parcelle (1 secteur / 1 électrovanne). Pour ajouter d'autres cultures, vous devez faire évoluer votre installation vers un boîtier multi-secteurs.
            </Text>
            <AppButton label="J'ai compris" onPress={() => setHardwareModalVisible(false)} style={styles.modalButton} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
  },
  title: { fontSize: 28, fontFamily: fonts.heading, color: colors.onSurface },
  subtitle: { fontSize: 14, fontFamily: fonts.body, color: colors.onSurfaceVariant, marginTop: 2 },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
  },

  scroll: { paddingBottom: 40 },

  stateBox: { alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 60 },
  stateText: { fontSize: 14, fontFamily: fonts.body, color: colors.onSurfaceVariant, textAlign: "center" },

  emptyCard: {
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: 28,
    alignItems: "center",
    marginBottom: 16,
    ...shadow.card,
  },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#dcfce7", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontFamily: fonts.heading, color: colors.onSurface, textAlign: "center" },
  emptyCopy: { fontSize: 14, fontFamily: fonts.body, color: colors.onSurfaceVariant, textAlign: "center", marginTop: 8, lineHeight: 22 },

  // Crop card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.outline,
    marginBottom: 16,
    overflow: "hidden",
    ...shadow.card,
  },
  cardPressed: { opacity: 0.94, transform: [{ scale: 0.99 }] },

  cardTop: { flexDirection: "row", padding: 14, gap: 14 },
  cropImg: { 
    width: 100, 
    height: 100, 
    borderRadius: radius.lg, 
    backgroundColor: "#e8f0e1",
    borderWidth: 1,
    borderColor: "rgba(22, 101, 52, 0.08)",
  },

  cardInfo: { flex: 1, minWidth: 0, justifyContent: "space-between" },
  nameBadgeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 },
  cropName: { fontSize: 20, fontFamily: fonts.heading, color: colors.onSurface, flex: 1, flexShrink: 1 },
  stageBadge: { backgroundColor: "#fce7f3", borderRadius: radius.md, paddingHorizontal: 8, paddingVertical: 4, flexShrink: 0 },
  stageBadgeAlert: { backgroundColor: "#fff7ed" },
  stageText: { fontSize: 13, fontFamily: fonts.bodyMedium, color: "#9d174d" },
  stageTextAlert: { color: "#c2410c" },

  healthRow: { flexDirection: "row", alignItems: "center", gap: 6, marginVertical: 4 },
  healthDot: { width: 8, height: 8, borderRadius: 4 },
  healthText: { fontSize: 14, fontFamily: fonts.body, color: colors.onSurfaceVariant },

  progressWrap: { gap: 6 },
  progressBar: { height: 6, backgroundColor: colors.surfaceContainerHigh, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 4 },
  progressRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  progressLabel: { fontSize: 13, fontFamily: fonts.body, color: colors.outline, flexShrink: 1 },
  progressVal: { fontSize: 13, fontFamily: fonts.heading, color: colors.primary, flexShrink: 0 },

  cardBottom: { flexDirection: "row", paddingVertical: 12, paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.04)" },
  statLeft: { flex: 1.3, flexDirection: "row", alignItems: "flex-start", gap: 8 },
  statRight: { flex: 0.9, flexDirection: "row", alignItems: "flex-start", gap: 8 },
  statIconOrange: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#fff7ed", alignItems: "center", justifyContent: "center", marginTop: 2 },
  statIconGreen: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#f0fdf4", alignItems: "center", justifyContent: "center", marginTop: 2 },
  statIconUrgent: { backgroundColor: "#fef2f2" },
  statLabel: { fontSize: 11, fontFamily: fonts.heading, color: colors.onSurfaceVariant, letterSpacing: 0.5 },
  statValue: { fontSize: 13, fontFamily: fonts.heading, color: colors.onSurface, marginTop: 4, flexShrink: 1 },
  statDivider: { width: 1, height: 36, backgroundColor: colors.outline },

  countText: { fontSize: 14, fontFamily: fonts.body, color: colors.onSurfaceVariant, textAlign: "center", marginBottom: 20, marginTop: 8 },

  summaryRow: { flexDirection: "row", gap: 12, marginBottom: 8 },
  summaryCell: {
    flex: 1,
    backgroundColor: colors.secondaryContainer,
    borderRadius: radius.xl,
    padding: 16,
    alignItems: "center",
    gap: 6,
  },
  summaryCellGreen: { backgroundColor: colors.surfaceContainerHigh },
  summaryLabel: { fontSize: 12, fontFamily: fonts.body, color: colors.onSurfaceVariant, textAlign: "center" },
  summaryValue: { fontSize: 22, fontFamily: fonts.heading, color: colors.onSurface },
  
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: spacing.mobile, zIndex: 100 },
  modalContent: { width: "100%", maxWidth: 360, backgroundColor: colors.surfaceContainerLowest, borderRadius: 24, padding: 24, alignItems: "center", ...shadow.lift },
  modalIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryContainer, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  modalTitle: { ...type.h2, fontFamily: fonts.heading, color: colors.onSurface, marginBottom: 12, textAlign: "center" },
  modalBody: { ...type.body, fontFamily: fonts.body, color: colors.onSurfaceVariant, textAlign: "center", marginBottom: 24 },
  modalButton: { width: "100%", minHeight: 54, borderRadius: radius.full },
});
