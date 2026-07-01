import { MaterialIcons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "../components/AppHeader";

import { Screen } from "../components/Screen";
import { AgrosmartService } from "../services/AgrosmartService";
import { colors, fonts, radius, shadow, spacing, type } from "../theme";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "DetailedForecast">;
type IconName = keyof typeof MaterialIcons.glyphMap;

type WeatherPayload = {
  city: string;
  current: {
    temperature: number | null;
    feels_like: number | null;
    description: string;
    icon?: string;
    rain_probability: number;
    wind_kmh: number;
    humidity?: number;
    pressure?: number;
    sunrise?: string | null;
    sunset?: string | null;
    uv_index?: number | null;
    uv_label?: string | null;
  };
  daily: Array<{ day: string; icon?: string; rain_probability: number; temp_max: number | null; temp_min: number | null }>;
  updated_at: string;
};

export function DetailedForecastScreen({ navigation }: Props) {
  const [meteo, setMeteo] = useState<WeatherPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AgrosmartService.getWeather();
      setMeteo(data?.meteo || data);
    } catch {
      setError("Impossible de charger les prévisions détaillées.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const current = meteo?.current;
  const details = current ? [
    { icon: "water-drop" as const, label: "Humidité", value: `${current.humidity ?? "--"}%`, tone: "#dbeafe", iconColor: colors.water },
    { icon: "compress" as const, label: "Pression", value: `${current.pressure ?? "--"} hPa`, tone: "#f5e8e8", iconColor: colors.tertiary },
    { icon: "visibility" as const, label: "Pluie prob.", value: `${current.rain_probability ?? 0}%`, tone: colors.secondaryFixed, iconColor: colors.secondary },
    { icon: "wb-twilight" as const, label: "Coucher de soleil", value: current.sunset || "--:--", tone: colors.primaryFixed, iconColor: colors.primary },
  ] : [];

  const uvStyle = buildUvStyle(current?.uv_index, colors);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.inner}>
          <View style={styles.headerBand}>
            <AppHeader title="Prévisions Détaillées" back onBack={() => navigation.goBack()} />
          </View>

          <View style={styles.content}>
            {loading ? (
              <StateBox text="Chargement des prévisions..." />
            ) : error || !meteo || !current ? (
              <Pressable onPress={load}>
                <StateBox text={`${error || "Prévisions indisponibles."} Touchez pour réessayer.`} />
              </Pressable>
            ) : (
              <>
                <View style={styles.hero}>
                  <View style={styles.heroCopy}>
                    <Text style={styles.heroPlace}>Aujourd'hui, {meteo.city}</Text>
                    <View style={styles.heroTempRow}>
                      <Text style={styles.temp}>{current.temperature ?? "--"}°</Text>
                      <View style={styles.sunTextWrap}>
                        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.76} style={styles.sun}>{current.description}</Text>
                        <Text numberOfLines={1} style={styles.feels}>Ressenti {current.feels_like ?? "--"}°</Text>
                      </View>
                    </View>
                    <View style={styles.heroChips}>
                      <WeatherChip icon="water-drop" text={`${current.rain_probability ?? 0}% Pluie`} />
                      <WeatherChip icon="air" text={`${current.wind_kmh ?? 0} km/h`} />
                    </View>
                  </View>
                  {current.icon ? <Image source={{ uri: weatherIcon(current.icon) }} style={styles.heroIcon} /> : null}
                </View>

                <View style={[styles.uvCard, { backgroundColor: uvStyle.bg }]}>
                  <MaterialIcons name="wb-sunny" size={54} color={uvStyle.icon} />
                  <Text style={[styles.uvLabel, { color: uvStyle.label }]}>INDICE UV</Text>
                  <Text style={[styles.uvValue, { color: uvStyle.value }]}>{current.uv_index == null ? "Indisponible" : `${current.uv_index} - ${current.uv_label || "Mesuré"}`}</Text>
                  <View style={[styles.uvPill, { backgroundColor: uvStyle.pillBg }]}>
                    <Text style={[styles.uvPillText, { color: uvStyle.pillText }]}>{uvAdvice(current.uv_index)}</Text>
                  </View>
                </View>

                <View style={styles.titleRow}>
                  <MaterialIcons name="insights" size={23} color={colors.primary} />
                  <Text numberOfLines={1} style={styles.sectionTitle}>Détails du jour</Text>
                </View>
                <View style={styles.detailGrid}>
                  {details.map((item) => (
                    <View key={item.label} style={styles.detailCard}>
                      <View style={[styles.detailIcon, { backgroundColor: item.tone }]}>
                        <MaterialIcons name={item.icon} size={18} color={item.iconColor} />
                      </View>
                      <Text style={styles.detailLabel}>{item.label}</Text>
                      <Text style={styles.detailValue}>{item.value}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.weekHeader}>
                  <View style={styles.titleRow}>
                    <MaterialIcons name="calendar-month" size={23} color={colors.primary} />
                    <Text numberOfLines={2} style={styles.sectionTitle}>Prévisions sur 7 jours</Text>
                  </View>
                  <Text numberOfLines={2} style={styles.updated}>Prochaine mise à jour : {meteo.updated_at}</Text>
                </View>
                <View style={styles.weekList}>
                  {(meteo.daily || []).map((day) => (
                    <View key={`${day.day}-${day.temp_max}-${day.temp_min}`} style={styles.dayRow}>
                      <Text numberOfLines={1} style={styles.dayName}>{day.day}</Text>
                      <View style={styles.dayWeather}>
                        {day.icon ? <Image source={{ uri: weatherIcon(day.icon) }} style={styles.dayIcon} /> : <MaterialIcons name="cloud" size={28} color={colors.outline} />}
                        <Text style={[styles.dayRain, day.rain_probability >= 50 && { color: colors.water, fontWeight: "800" }]}>{day.rain_probability}%</Text>
                      </View>
                      <View style={styles.dayTemps}>
                        <Text style={styles.high}>{day.temp_max ?? "--"}°</Text>
                        <Text style={styles.low}>{day.temp_min ?? "--"}°</Text>
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.advice}>
                  <View style={styles.adviceIcon}>
                    <MaterialIcons name="agriculture" size={34} color={colors.onPrimary} />
                  </View>
                  <Text style={styles.adviceTitle}>Conseil d'irrigation</Text>
                  <Text style={styles.adviceText}>{irrigationAdvice(meteo)}</Text>
                  <Pressable onPress={() => navigation.navigate("ManualProgramming")} style={styles.programButton}>
                    <Text style={styles.programText}>Programmer l'arrosage</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

function WeatherChip({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.chip}>
      <MaterialIcons name={icon} size={18} color={colors.surfaceContainerLowest} />
      <Text style={styles.chipText}>{text}</Text>
    </View>
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

function weatherIcon(icon?: string) {
  return `https://openweathermap.org/img/wn/${icon || "01d"}@2x.png`;
}

function uvAdvice(uv?: number | null) {
  if (uv == null) return "DONNÉE UV NON FOURNIE";
  return uv >= 6 ? "PROTECTION REQUISE" : "SURVEILLANCE NORMALE";
}

function buildUvStyle(uv: number | null | undefined, colors: any) {
  if (uv != null && uv >= 8) {
    return { bg: "#ef4444", icon: "#ffffff", label: "#fee2e2", value: "#ffffff", pillBg: "rgba(255,255,255,0.25)", pillText: "#ffffff" }; // Extreme (Rouge)
  }
  if (uv != null && uv >= 6) {
    return { bg: "#ff8c00", icon: "rgba(0,0,0,0.1)", label: "#7c2d12", value: "#431407", pillBg: "rgba(255,255,255,0.35)", pillText: "#431407" }; // Elevé (Orange)
  }
  if (uv != null && uv >= 3) {
    return { bg: "#fcd34d", icon: "#b45309", label: "#78350f", value: "#451a03", pillBg: "rgba(255,255,255,0.5)", pillText: "#451a03" }; // Modéré (Jaune)
  }
  return { bg: colors.primary, icon: "#ffffff", label: "rgba(255,255,255,0.8)", value: "#ffffff", pillBg: "rgba(0,0,0,0.2)", pillText: "#ffffff" }; // Faible ou Indisponible (Vert foncé)
}

function irrigationAdvice(meteo: WeatherPayload) {
  const tomorrow = meteo.daily?.[0];
  if ((tomorrow?.rain_probability || 0) >= 50) return "Pluie probable demain : réduisez l'arrosage pour économiser votre eau.";
  if ((tomorrow?.temp_max || 0) >= 35) return "Forte chaleur prévue : privilégiez un arrosage tôt le matin.";
  if ((meteo.current.wind_kmh || 0) >= 25) return "Vent marqué : évitez d'arroser aux heures les plus venteuses.";
  return "Les conditions sont favorables : gardez le programme d'arrosage prévu.";
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { flexGrow: 1, paddingBottom: 40 },
  inner: { width: "100%", maxWidth: 430, alignSelf: "center" },
  headerBand: { paddingHorizontal: spacing.mobile, paddingTop: spacing.base, borderBottomWidth: 1, borderBottomColor: "rgba(0, 69, 13, 0.08)" },
  content: { paddingHorizontal: spacing.mobile, paddingTop: 20 },
  hero: { minHeight: 220, borderRadius: 30, backgroundColor: colors.primary, overflow: "hidden", padding: 22, marginBottom: 22, ...shadow.lift },
  heroCopy: { flex: 1, zIndex: 2 },
  heroPlace: { ...type.label, fontSize: 14, lineHeight: 18, fontFamily: fonts.body, color: "rgba(255,255,255,0.78)" },
  heroTempRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginTop: 12 },
  sunTextWrap: { flex: 1, minWidth: 0 },
  temp: { fontSize: 56, lineHeight: 62, fontWeight: "900", fontFamily: fonts.heading, color: colors.onPrimary },
  sun: { fontSize: 22, lineHeight: 29, fontWeight: "900", fontFamily: fonts.heading, color: colors.onPrimary, marginTop: 4 },
  feels: { ...type.body, fontFamily: fonts.body, color: "rgba(255,255,255,0.82)" },
  heroChips: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 42 },
  heroIcon: { position: "absolute", right: -18, top: 18, width: 150, height: 150, opacity: 0.5 },
  chip: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: radius.full, backgroundColor: "rgba(255,255,255,0.24)", paddingHorizontal: 12, paddingVertical: 9 },
  chipText: { ...type.label, fontFamily: fonts.body, color: colors.surfaceContainerLowest },
  uvCard: { minHeight: 170, borderRadius: 26, backgroundColor: colors.secondaryContainer, alignItems: "center", justifyContent: "center", padding: 18, marginBottom: 24, ...shadow.card },
  uvLabel: { ...type.labelSm, letterSpacing: 1.3, fontFamily: fonts.body, color: colors.onSecondaryContainer, marginTop: 8 },
  uvValue: { fontSize: 28, lineHeight: 34, fontWeight: "900", fontFamily: fonts.heading, color: colors.onSecondaryContainer, marginTop: 4 },
  uvPill: { marginTop: 10, borderRadius: radius.full, backgroundColor: colors.surfaceContainerLowest, paddingHorizontal: 14, paddingVertical: 7 },
  uvPillText: { ...type.labelSm, fontFamily: fonts.body, color: colors.primary },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  sectionTitle: { flexShrink: 1, ...type.h2, fontFamily: fonts.heading, color: colors.onSurface },
  detailGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 14, marginBottom: 12 },
  detailCard: { width: "47%", minHeight: 112, borderRadius: 20, backgroundColor: colors.surfaceContainerLowest, borderWidth: 1, borderColor: colors.outlineVariant, padding: 14, ...shadow.card, marginBottom: 16 },
  detailIcon: { width: 34, height: 34, borderRadius: radius.full, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  detailLabel: { ...type.labelSm, fontFamily: fonts.body, color: colors.onSurfaceVariant },
  detailValue: { ...type.h2, fontFamily: fonts.heading, color: colors.onSurface, marginTop: 3 },
  weekHeader: { marginBottom: 12 },
  updated: { ...type.labelSm, fontFamily: fonts.body, color: colors.onSurfaceVariant, marginTop: 5 },
  weekList: { borderRadius: 24, backgroundColor: colors.surfaceContainerLowest, borderWidth: 1, borderColor: colors.outlineVariant, overflow: "hidden", marginBottom: 24, ...shadow.card },
  dayRow: { minHeight: 62, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "rgba(0,69,13,0.08)" },
  dayName: { flex: 1, ...type.body, fontFamily: fonts.heading, color: colors.onSurface },
  dayWeather: { width: 105, flexDirection: "row", alignItems: "center", gap: 6 },
  dayIcon: { width: 34, height: 34 },
  dayRain: { ...type.label, fontFamily: fonts.body, color: colors.onSurfaceVariant },
  dayTemps: { width: 70, flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  high: { ...type.body, fontFamily: fonts.heading, color: colors.onSurface },
  low: { ...type.body, fontFamily: fonts.body, color: colors.onSurfaceVariant },
  advice: { borderRadius: 30, backgroundColor: colors.primary, padding: 22, alignItems: "center", marginBottom: 20, ...shadow.lift },
  adviceIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  adviceTitle: { ...type.h2, fontFamily: fonts.heading, color: colors.onPrimary },
  adviceText: { ...type.body, fontFamily: fonts.body, color: "rgba(255,255,255,0.86)", textAlign: "center", marginTop: 6 },
  programButton: { minHeight: 48, borderRadius: radius.full, backgroundColor: colors.surfaceContainerLowest, paddingHorizontal: 20, alignItems: "center", justifyContent: "center", marginTop: 16 },
  programText: { ...type.label, fontFamily: fonts.body, color: colors.primary },
  stateBox: { minHeight: 240, borderRadius: radius.card, backgroundColor: colors.surfaceContainerLowest, alignItems: "center", justifyContent: "center", gap: 10, padding: 18, ...shadow.card },
  stateText: { ...type.body, fontFamily: fonts.body, color: colors.onSurfaceVariant, textAlign: "center" },
});
