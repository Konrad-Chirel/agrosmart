import { MaterialIcons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Screen } from "../components/Screen";
import { useOnboarding } from "../data/onboardingState";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { AgrosmartService } from "../services/AgrosmartService";
import { colors, fonts, radius, shadow, spacing, type } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "HarvestForecast">;
type HarvestData = {
  nom: string;
  stade: string;
  humidite_sol: { texte: string };
  recolte: {
    date_estimee: string;
    jours_restants: number;
    progression: number;
    rendement_estime_kg: number;
    rendement_estime_tonnes: number;
    rendement_kg_m2: number;
    impact_sante?: string;
    source: string;
    conseils: Array<{ titre: string; texte: string }>;
  };
};

export function HarvestForecastScreen({ navigation, route }: Props) {
  const { profileImage } = useOnboarding();
  const [culture, setCulture] = useState<HarvestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch {
      setError("Impossible de charger les prévisions de récolte.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [route.params?.cultureId]);

  const progress = culture?.recolte?.progression ?? 0;
  const circumference = 2 * Math.PI * 80;

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={10}>
          <MaterialIcons name="arrow-back" size={26} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>Prévisions de récolte</Text>
        <Image source={{ uri: profileImage }} style={styles.avatar} />
      </View>

      {loading ? (
        <StateBox text="Chargement des prévisions..." />
      ) : error || !culture ? (
        <Pressable onPress={load}>
          <StateBox text={`${error || "Prévision introuvable."} Touchez pour réessayer.`} />
        </Pressable>
      ) : (
        <>
          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>Temps restant estimé</Text>
            <View style={styles.daysRow}>
              <Text style={styles.daysNumber}>{culture.recolte.jours_restants}</Text>
              <Text style={styles.daysText}>jours</Text>
            </View>
            <View style={styles.heroProgressTrack}>
              <View style={[styles.heroProgressFill, { width: `${Math.min(100, Math.max(0, progress))}%` }]} />
            </View>
            <Text style={styles.heroCopy}>
              Récolte prévue le <Text style={styles.heroDate}>{formatLongDate(culture.recolte.date_estimee)}</Text>
            </Text>
          </View>

          <View style={styles.yieldCard}>
            <View style={styles.cardTitleRow}>
              <View style={styles.smallIconWarm}>
                <MaterialIcons name="analytics" size={22} color={colors.secondary} />
              </View>
              <Text style={styles.cardLabel}>Rendement estimé</Text>
            </View>
            <View style={styles.gaugeWrap}>
              <Svg width={184} height={184} viewBox="0 0 184 184">
                <Circle cx="92" cy="92" r="80" stroke={colors.surfaceContainerHighest} strokeWidth="12" fill="transparent" />
                <Circle
                  cx="92"
                  cy="92"
                  r="80"
                  stroke={colors.secondary}
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={`${circumference}`}
                  strokeDashoffset={`${circumference * (1 - Math.min(100, progress) / 100)}`}
                  rotation="-90"
                  origin="92, 92"
                  strokeLinecap="round"
                />
              </Svg>
              <View style={styles.gaugeCenter}>
                <Text style={styles.yieldValue}>{culture.recolte.rendement_estime_tonnes}</Text>
                <Text style={styles.yieldUnit}>tonnes estimées</Text>
              </View>
            </View>
            <View style={styles.yieldFooter}>
              <View style={styles.yieldCell}>
                <Text style={styles.mutedLabel}>Poids total</Text>
                <Text style={styles.yieldSmall}>{Math.round(culture.recolte.rendement_estime_kg)} kg</Text>
              </View>
              <View style={[styles.yieldCell, styles.yieldCellRight]}>
                <Text style={styles.mutedLabel}>Référence</Text>
                <Text style={styles.yieldSmallGreen}>{culture.recolte.rendement_kg_m2} kg/m²</Text>
              </View>
            </View>
            {culture.recolte.impact_sante && (
              <View style={styles.impactBadge}>
                <MaterialIcons name="trending-down" size={16} color="#ef4444" />
                <Text style={styles.impactText}>{culture.recolte.impact_sante}</Text>
              </View>
            )}
          </View>

          <View style={styles.factorStack}>
            <FactorCard icon="grass" label="Culture" value={culture.nom} tone={colors.primary} bg={colors.primaryFixed} />
            <FactorCard icon="timeline" label="Stade actuel" value={culture.stade} tone={colors.onSecondary} bg={colors.secondary} />
            <FactorCard icon="water-drop" label="Humidité sol" value={culture.humidite_sol?.texte || "En attente"} tone={colors.water} bg="#eff6ff" />
          </View>

          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="psychology" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Conseils du système</Text>
          </View>
          {culture.recolte.conseils.map((tip) => (
            <TipCard key={tip.titre} icon="tips-and-updates" title={tip.titre} text={tip.texte} />
          ))}

          <Text style={styles.updateText}>{culture.recolte.source}</Text>
        </>
      )}
    </Screen>
  );
}

function formatLongDate(value?: string) {
  if (!value) return "Non définie";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function StateBox({ text }: { text: string }) {
  return (
    <View style={styles.stateBox}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.stateText}>{text}</Text>
    </View>
  );
}

function FactorCard({ icon, label, value, tone, bg }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; value: string; tone: string; bg: string }) {
  return (
    <View style={styles.factorCard}>
      <View style={[styles.factorIcon, { backgroundColor: bg }]}>
        <MaterialIcons name={icon} size={24} color={tone} />
      </View>
      <View style={styles.factorText}>
        <Text style={styles.factorLabel}>{label}</Text>
        <Text style={styles.factorValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

function TipCard({ icon, title, text }: { icon: keyof typeof MaterialIcons.glyphMap; title: string; text: string }) {
  return (
    <View style={styles.tipCard}>
      <View style={styles.tipIcon}>
        <MaterialIcons name={icon} size={21} color={colors.onPrimaryFixed} />
      </View>
      <View style={styles.tipText}>
        <Text style={styles.tipTitle}>{title}</Text>
        <Text style={styles.tipBody}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0, paddingTop: 0 },
  header: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: spacing.mobile, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: `${colors.outlineVariant}60` },
  backButton: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, ...type.h2, fontFamily: fonts.heading, color: colors.primary },
  avatar: { width: 40, height: 40, borderRadius: radius.full, borderWidth: 2, borderColor: colors.primaryFixed },
  stateBox: { minHeight: 220, margin: spacing.mobile, borderRadius: radius.card, backgroundColor: colors.surfaceContainerLowest, alignItems: "center", justifyContent: "center", gap: 10, padding: 18, ...shadow.card },
  stateText: { ...type.body, fontFamily: fonts.body, color: colors.onSurfaceVariant, textAlign: "center" },
  heroCard: { margin: spacing.mobile, marginBottom: 0, borderRadius: radius.card, backgroundColor: colors.primaryContainer, padding: spacing.stackMd, alignItems: "center", overflow: "hidden", ...shadow.lift },
  heroLabel: { ...type.labelSm, fontFamily: fonts.body, color: colors.onPrimaryContainer, textTransform: "uppercase", letterSpacing: 0.8 },
  daysRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginVertical: 10 },
  daysNumber: { fontSize: 54, lineHeight: 62, fontWeight: "800", fontFamily: fonts.heading, color: colors.onPrimary },
  daysText: { ...type.h2, fontFamily: fonts.heading, color: colors.onPrimaryContainer },
  heroProgressTrack: { width: "100%", height: 12, borderRadius: radius.full, backgroundColor: "rgba(0,0,0,0.22)", overflow: "hidden", marginBottom: 12 },
  heroProgressFill: { height: "100%", borderRadius: radius.full, backgroundColor: colors.primaryFixed },
  heroCopy: { ...type.body, fontFamily: fonts.body, color: colors.onPrimaryContainer, textAlign: "center" },
  heroDate: { fontWeight: "800", color: colors.onPrimary },
  yieldCard: { marginHorizontal: spacing.mobile, marginTop: spacing.stackMd, borderRadius: radius.card, backgroundColor: "rgba(255,255,255,0.88)", borderWidth: 1, borderColor: `${colors.outlineVariant}80`, padding: spacing.stackMd, alignItems: "center", ...shadow.card },
  cardTitleRow: { alignSelf: "stretch", flexDirection: "row", alignItems: "center", gap: 10 },
  smallIconWarm: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.secondaryFixed, alignItems: "center", justifyContent: "center" },
  cardLabel: { ...type.label, fontFamily: fonts.body, color: colors.onSurfaceVariant, textTransform: "uppercase" },
  gaugeWrap: { width: 184, height: 184, marginVertical: 16, alignItems: "center", justifyContent: "center" },
  gaugeCenter: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  yieldValue: { fontSize: 48, lineHeight: 54, fontWeight: "800", fontFamily: fonts.heading, color: colors.primary },
  yieldUnit: { ...type.labelSm, fontFamily: fonts.body, color: colors.onSurfaceVariant, textAlign: "center" },
  yieldFooter: { alignSelf: "stretch", flexDirection: "row", borderTopWidth: 1, borderTopColor: colors.outlineVariant, paddingTop: 14 },
  yieldCell: { flex: 1, alignItems: "center" },
  yieldCellRight: { borderLeftWidth: 1, borderLeftColor: colors.outlineVariant },
  mutedLabel: { ...type.labelSm, fontFamily: fonts.body, color: colors.outline },
  yieldSmall: { ...type.h2, fontFamily: fonts.heading, color: colors.onSurface },
  yieldSmallGreen: { ...type.h2, fontFamily: fonts.heading, color: colors.primary },
  impactBadge: { marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#fee2e2", paddingVertical: 4, paddingHorizontal: 12, borderRadius: radius.full },
  impactText: { fontSize: 12, fontWeight: "600", color: "#ef4444" },
  factorStack: { gap: 12, marginHorizontal: spacing.mobile, marginTop: spacing.stackMd },
  factorCard: { minHeight: 76, flexDirection: "row", alignItems: "center", gap: 14, borderRadius: radius.card, backgroundColor: "rgba(255,255,255,0.88)", borderWidth: 1, borderColor: `${colors.outlineVariant}80`, padding: 14, ...shadow.card },
  factorIcon: { width: 50, height: 50, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  factorText: { flex: 1, minWidth: 0 },
  factorLabel: { ...type.labelSm, fontFamily: fonts.body, color: colors.onSurfaceVariant },
  factorValue: { ...type.h2, fontFamily: fonts.heading, color: colors.onSurface },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: spacing.mobile, marginTop: spacing.stackMd, marginBottom: spacing.stackSm },
  sectionTitle: { ...type.h2, fontFamily: fonts.heading, color: colors.onSurface },
  tipCard: { marginHorizontal: spacing.mobile, marginBottom: 10, flexDirection: "row", alignItems: "flex-start", gap: 12, borderRadius: radius.xl, backgroundColor: colors.surfaceContainerLowest, borderWidth: 1, borderColor: colors.outlineVariant, padding: 14, ...shadow.card },
  tipIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryFixed },
  tipText: { flex: 1, minWidth: 0 },
  tipTitle: { ...type.label, fontFamily: fonts.heading, color: colors.onSurface },
  tipBody: { ...type.labelSm, fontFamily: fonts.body, color: colors.onSurfaceVariant, marginTop: 4 },
  updateText: { ...type.labelSm, fontFamily: fonts.body, color: colors.outline, textAlign: "center", marginTop: spacing.stackMd, marginHorizontal: spacing.mobile },
});
