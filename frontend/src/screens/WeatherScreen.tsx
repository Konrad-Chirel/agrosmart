import { MaterialIcons } from "@expo/vector-icons";
import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Line, Path, Stop } from "react-native-svg";
import { AppHeader } from "../components/AppHeader";
import { Screen } from "../components/Screen";
import { WeatherAnimation } from "../components/WeatherAnimations";
import { AgrosmartService } from "../services/AgrosmartService";
import { colors, fonts, radius, shadow, spacing, type } from "../theme";
import type { MainTabParamList, RootStackParamList } from "../navigation/RootNavigator";

type Props = CompositeScreenProps<BottomTabScreenProps<MainTabParamList, "Weather">, NativeStackScreenProps<RootStackParamList>>;

type WeatherHour = {
  label: string;
  temperature: number | null;
  description: string;
  icon?: string;
  rain_probability: number;
  wind_kmh: number;
};

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
  };
  hourly_48h: WeatherHour[];
  daily: Array<{ day: string; temp_max: number | null; temp_min: number | null; rain_probability: number; icon?: string }>;
  updated_at: string;
};

export function WeatherScreen({ navigation }: Props) {
  const [selectedForecast, setSelectedForecast] = useState(0);
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
      setError("Impossible de charger la météo réelle.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const displayHours = useMemo(() => {
    if (!meteo) return [];

    const nowCard: WeatherHour = {
      label: "Maintenant",
      temperature: meteo.current.temperature,
      description: meteo.current.description,
      icon: meteo.current.icon,
      rain_probability: meteo.current.rain_probability,
      wind_kmh: meteo.current.wind_kmh,
    };

    const nextHours = (meteo.hourly_48h || []).filter((item) => item.label !== "Maintenant");

    return [nowCard, ...nextHours];
  }, [meteo]);

  const selected = displayHours[selectedForecast] || displayHours[0];
  const impact = useMemo(() => buildImpact(meteo, colors), [meteo]);

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.headerBand}>
        <AppHeader />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Météo & Anticipation</Text>
        <Text style={styles.copy}>Données OpenWeather en temps réel pour protéger vos cultures.</Text>

        {loading ? (
          <StateBox text="Chargement de la météo..." />
        ) : error || !meteo ? (
          <Pressable onPress={load}>
            <StateBox text={`${error || "Météo indisponible."} Touchez pour réessayer.`} />
          </Pressable>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text numberOfLines={1} style={styles.sectionTitle}>Prévisions 48h</Text>
              <Pressable onPress={() => navigation.navigate("DetailedForecast")} hitSlop={10}>
                <Text numberOfLines={1} style={styles.seeAll}>VOIR TOUT</Text>
              </Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.forecastRow} style={styles.forecastScroller}>
              {displayHours.map((item, index) => (
                <ForecastCard
                  key={`${item.label}-${index}`}
                  label={item.label}
                  temp={item.temperature == null ? "--" : `${item.temperature}°`}
                  icon={item.icon}
                  active={selectedForecast === index}
                  onPress={() => setSelectedForecast(index)}
                />
              ))}
            </ScrollView>

            {/* Dynamic styles based on impact state */}
            <Pressable onPress={() => navigation.navigate("Program")} style={[styles.impactCard, { backgroundColor: impact.colors.bg }]}>
              <View style={[styles.warningBox, { backgroundColor: impact.colors.iconBg }]}>
                <WeatherAnimation type={impact.animationType as any} color={impact.colors.iconColor} flashColor={impact.colors.label} />
              </View>
              <View style={styles.impactTextBox}>
                <Text style={[styles.impactLabel, { color: impact.colors.label }]}>ANALYSE D'IMPACT</Text>
                <Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.74} style={[styles.impactTitle, { color: impact.colors.title }]}>
                  {impact.title}
                </Text>
                <View style={[styles.recoChip, { backgroundColor: impact.colors.chipBg }]}>
                  <MaterialIcons name="water-drop" size={14} color={impact.colors.chipText} />
                  <Text numberOfLines={2} style={[styles.recoText, { color: impact.colors.chipText }]}>{impact.recommendation}</Text>
                </View>
              </View>
              <View style={styles.impactGlow} />
            </Pressable>

            <View style={styles.graphCard}>
              <View style={styles.graphHeader}>
                <View>
                  <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78} style={styles.graphTitle}>Aujourd'hui, {meteo.city}</Text>
                  <Text numberOfLines={1} style={styles.graphSub}>{selected?.description || meteo.current.description}</Text>
                </View>
                <View style={styles.graphScore}>
                  <Text numberOfLines={1} style={styles.graphValue}>{meteo.current.humidity ?? "--"}%</Text>
                  <Text numberOfLines={1} style={styles.graphStatus}>HUMIDITÉ</Text>
                </View>
              </View>
              <HumidityCurve values={displayHours.map((item) => item.rain_probability)} />
            </View>

            <View style={styles.twoCols}>
              <Mini icon="thermostat" label="Ressenti" value={meteo.current.feels_like == null ? "--" : `${meteo.current.feels_like}°`} />
              <Mini icon="air" label="Vent" value={`${meteo.current.wind_kmh ?? 0} km/h`} />
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}

function ForecastCard({ label, temp, icon, active, onPress }: { label: string; temp: string; icon?: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.forecastCard, active && styles.forecastActive, pressed && styles.cardPressed]}>
      <Text numberOfLines={1} style={[styles.forecastLabel, active && styles.forecastLabelActive]}>{label}</Text>
      {icon ? <Image source={{ uri: weatherIcon(icon) }} style={styles.weatherIcon} /> : <MaterialIcons name="cloud" size={34} color={active ? colors.surfaceContainerLowest : colors.onSurfaceVariant} />}
      <Text style={[styles.forecastTemp, active && styles.forecastTempActive]}>{temp}</Text>
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

function HumidityCurve({ values }: { values: number[] }) {
  const points = values.slice(0, 8);
  const path = points.length
    ? points.map((value, index) => `${index === 0 ? "M" : "L"} ${index * (520 / Math.max(1, points.length - 1))} ${150 - Math.min(100, value)}`).join(" ")
    : "M0 130 C90 112 176 118 244 92 C320 62 430 72 520 44";

  return (
    <View style={styles.chartWrap}>
      <Svg width="100%" height={176} viewBox="0 0 520 176" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="weatherFill" x1="0" y1="48" x2="0" y2="150" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={colors.primary} stopOpacity="0.16" />
            <Stop offset="1" stopColor={colors.primary} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {[34, 82, 130].map((y) => (
          <Line key={y} x1="0" y1={y} x2="520" y2={y} stroke="rgba(0, 69, 13, 0.11)" strokeWidth="1" strokeDasharray="6 7" />
        ))}
        <Path d={`${path} L520 158 L0 158 Z`} fill="url(#weatherFill)" />
        <Path d={path} fill="none" stroke={colors.primary} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
      <View style={styles.axisLabels}>
        <Text style={styles.axisText}>Maint.</Text>
        <Text style={styles.axisText}>+12h</Text>
        <Text style={styles.axisText}>+24h</Text>
        <Text style={styles.axisText}>+36h</Text>
        <Text style={[styles.axisText, styles.axisNow]}>+48h</Text>
      </View>
    </View>
  );
}

function Mini({ icon, label, value }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.mini}>
      <View style={styles.miniIcon}>
        <MaterialIcons name={icon} size={24} color={colors.primary} />
      </View>
      <Text style={styles.miniLabel}>{label}</Text>
      <Text style={styles.miniValue}>{value}</Text>
    </View>
  );
}

function weatherIcon(icon?: string) {
  return `https://openweathermap.org/img/wn/${icon || "01d"}@2x.png`;
}

function buildImpact(meteo: WeatherPayload | null, colors: any) {
  const tomorrow = meteo?.daily?.[1] || meteo?.daily?.[0];
  const hot = (tomorrow?.temp_max || 0) >= 35;
  const rainy = (tomorrow?.rain_probability || 0) >= 50;
  const windy = (meteo?.current?.wind_kmh || 0) >= 25;
  const storm = (meteo?.current?.wind_kmh || 0) >= 40 || ((tomorrow?.rain_probability || 0) >= 80 && windy);
  const cloudy = (meteo?.current?.description || 800) > 800 && (meteo?.current?.description || 800) < 900; // Clouds

  if (storm) {
    return { 
      animationType: "storm", 
      title: `⚠️ Alerte : Conditions extrêmes`, 
      recommendation: "Protégez vos cultures des intempéries.",
      colors: { bg: "#7f1d1d", iconBg: "rgba(255,255,255,0.15)", iconColor: "#ffffff", label: "#fecaca", title: "#ffffff", chipBg: "rgba(0,0,0,0.3)", chipText: "#ffffff" }
    };
  }
  if (rainy) {
    return { 
      animationType: "rain", 
      title: `Demain : pluie probable (${tomorrow?.rain_probability}%)`, 
      recommendation: "Réduire l'arrosage pour économiser l'eau.",
      colors: { bg: "#1e3a8a", iconBg: "rgba(255,255,255,0.15)", iconColor: "#ffffff", label: "#bfdbfe", title: "#ffffff", chipBg: "rgba(0,0,0,0.3)", chipText: "#ffffff" }
    };
  }
  if (hot || windy || cloudy) {
    return { 
      animationType: "sun", 
      title: `⚠️ Demain : ${hot ? "38°C" : windy ? "Vent fort" : "Temps nuageux"}`, 
      recommendation: hot || windy ? "Arrosage préventif à 6h00 recommandé" : "Surveillez l'évolution de la météo.",
      colors: { bg: "#c2410c", iconBg: "rgba(255,255,255,0.15)", iconColor: "#ffffff", label: "#fed7aa", title: "#ffffff", chipBg: "rgba(0,0,0,0.25)", chipText: "#ffffff" }
    };
  }
  return { 
    animationType: "leaf", 
    title: "Conditions favorables pour les cultures", 
    recommendation: "Gardez le programme d'arrosage prévu.",
    colors: { bg: colors.primary, iconBg: "rgba(255,255,255,0.15)", iconColor: "#ffffff", label: "rgba(255,255,255,0.8)", title: "#ffffff", chipBg: "rgba(0,0,0,0.25)", chipText: "#ffffff" }
  };
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0, paddingTop: 0 },
  headerBand: { paddingHorizontal: spacing.mobile, paddingTop: spacing.base, borderBottomWidth: 1, borderBottomColor: "rgba(0, 69, 13, 0.08)", backgroundColor: colors.surface },
  content: { paddingHorizontal: spacing.mobile, paddingTop: 20, width: "100%" },
  title: { ...type.h1Mobile, fontSize: 29, lineHeight: 36, fontFamily: fonts.heading, color: colors.onSurface },
  copy: { ...type.body, fontFamily: fonts.body, color: colors.onSurfaceVariant, marginTop: 2, marginBottom: 28 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  sectionTitle: { ...type.h2, fontFamily: fonts.heading, color: colors.onSurface },
  seeAll: { ...type.label, letterSpacing: 0.8, fontFamily: fonts.body, color: colors.primary },
  forecastScroller: { marginBottom: 34, marginHorizontal: -spacing.mobile },
  forecastRow: { gap: spacing.gutter, paddingBottom: 8, paddingHorizontal: spacing.mobile },
  forecastCard: { width: 96, minHeight: 104, borderRadius: 12, backgroundColor: colors.surfaceContainerLowest, alignItems: "center", justifyContent: "space-between", paddingVertical: 8, paddingHorizontal: 8, borderWidth: 1, borderColor: colors.outlineVariant, ...shadow.card },
  forecastActive: { backgroundColor: colors.primary, borderColor: colors.primary, transform: [{ scale: 1.05 }] },
  cardPressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  forecastLabel: { fontSize: 13, lineHeight: 17, fontWeight: "600", fontFamily: fonts.body, color: colors.onSurfaceVariant },
  forecastLabelActive: { fontWeight: "800", color: colors.surfaceContainerLowest },
  weatherIcon: { width: 44, height: 44 },
  forecastTemp: { fontSize: 20, lineHeight: 26, fontWeight: "800", fontFamily: fonts.heading, color: colors.onSurface },
  forecastTempActive: { color: colors.surfaceContainerLowest },
  impactCard: { borderRadius: radius.xl, padding: 20, flexDirection: "row", gap: 16, marginBottom: 24, overflow: "hidden", ...shadow.lift },
  warningBox: { width: 56, height: 56, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  impactTextBox: { flex: 1, zIndex: 2 },
  impactLabel: { ...type.label, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 },
  impactTitle: { ...type.h2, fontSize: 20, marginBottom: 12 },
  recoChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.md, flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
  recoText: { flexShrink: 1, ...type.labelSm, fontFamily: fonts.body, color: colors.surfaceContainerLowest },
  impactGlow: { position: "absolute", right: -40, top: -40, width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.14)" },
  graphCard: { minHeight: 292, borderRadius: 26, backgroundColor: colors.surfaceContainerLowest, borderWidth: 1, borderColor: colors.outlineVariant, padding: 18, marginBottom: 24, ...shadow.card },
  graphHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  graphTitle: { fontSize: 24, lineHeight: 31, fontWeight: "700", fontFamily: fonts.heading, color: colors.onSurface },
  graphSub: { ...type.body, fontFamily: fonts.body, color: colors.onSurfaceVariant, marginTop: 2 },
  graphScore: { alignItems: "flex-end" },
  graphValue: { fontSize: 36, lineHeight: 42, fontWeight: "700", fontFamily: fonts.heading, color: colors.primary },
  graphStatus: { ...type.labelSm, fontFamily: fonts.body, color: colors.primary },
  chartWrap: { marginTop: 12 },
  axisLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: -4 },
  axisText: { fontSize: 11, lineHeight: 14, fontFamily: fonts.body, color: colors.onSurfaceVariant },
  axisNow: { color: colors.primary, fontWeight: "800" },
  twoCols: { flexDirection: "row", gap: spacing.gutter, marginBottom: 10 },
  mini: { flex: 1, minHeight: 122, borderRadius: 20, backgroundColor: colors.surfaceContainerLowest, borderWidth: 1, borderColor: colors.outlineVariant, padding: 16, ...shadow.card },
  miniIcon: { width: 48, height: 48, borderRadius: radius.full, backgroundColor: colors.primaryFixed, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  miniLabel: { ...type.body, fontFamily: fonts.body, color: colors.onSurfaceVariant },
  miniValue: { fontSize: 24, lineHeight: 30, fontWeight: "800", fontFamily: fonts.heading, color: colors.primary, marginTop: 2 },
  stateBox: { minHeight: 220, borderRadius: radius.card, backgroundColor: colors.surfaceContainerLowest, alignItems: "center", justifyContent: "center", gap: 10, padding: 18, ...shadow.card },
  stateText: { ...type.body, fontFamily: fonts.body, color: colors.onSurfaceVariant, textAlign: "center" },
});
