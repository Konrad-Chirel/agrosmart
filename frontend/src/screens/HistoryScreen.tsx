import { MaterialIcons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { AppHeader } from "../components/AppHeader";
import { Screen } from "../components/Screen";
import { AgrosmartService } from "../services/AgrosmartService";
import { colors, fonts, radius, shadow, type } from "../theme";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "History">;

const FILTERS = [
  { label: "Cette semaine", value: "semaine" },
  { label: "Ce mois", value: "mois" },
  { label: "Tout", value: "tout" },
];

export function HistoryScreen({ navigation }: Props) {
  const [filter, setFilter] = useState("semaine");
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const data = await AgrosmartService.getHistorique(undefined, filter);
      setHistory(data.data || data); // handle pagination wrapper
    } catch (error) {
      console.log("Erreur de chargement de l'historique", error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const renderItem = ({ item }: { item: any }) => {
    const dateObj = new Date(item.debut_arrosage);
    const dateStr = dateObj.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
    const timeStr = dateObj.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    
    const isManual = item.type_declenchement === "manuel";
    const iconName = isManual ? "touch-app" : "auto-awesome";
    const iconColor = isManual ? colors.secondary : colors.primary;
    const iconBg = isManual ? colors.secondaryContainer : colors.primaryContainer;

    const formatDuree = (minutes: number) => {
      if (!minutes) return '0 min';
      if (minutes < 1) {
        const secs = Math.round(minutes * 60);
        return `${secs} s`;
      }
      return `${Math.round(minutes)} min`;
    };

    return (
      <View style={styles.card}>
        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
          <MaterialIcons name={iconName} size={24} color={iconColor} />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.dateText}>{dateStr} à {timeStr}</Text>
          <Text style={styles.detailText}>
            {Math.round(item.volume_litres)}L • {formatDuree(item.duree_minutes)}
          </Text>
        </View>
        <View style={styles.badgeWrap}>
          <View style={[styles.badge, isManual && styles.badgeManual]}>
            <Text style={[styles.badgeText, isManual && styles.badgeTextManual]}>
              {isManual ? "Manuel" : "Auto"}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Screen scroll={false} contentStyle={{ flex: 1, paddingBottom: 0 }}>
      <AppHeader back onBack={() => navigation.goBack()} title="Historique" />

      {/* Filter Bar */}
      <View style={styles.filterContainer}>
        {FILTERS.map((f) => {
          const isActive = filter === f.value;
          return (
            <Pressable
              key={f.value}
              onPress={() => setFilter(f.value)}
              style={[styles.filterPill, isActive && styles.filterPillActive]}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement de l'historique...</Text>
        </View>
      ) : history.length === 0 ? (
        <View style={styles.center}>
          <MaterialIcons name="history" size={64} color={colors.outlineVariant} />
          <Text style={styles.emptyText}>Aucun arrosage trouvé</Text>
          <Text style={styles.emptySubText}>pour la période sélectionnée.</Text>
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={history}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radius.full,
    alignItems: "center",
  },
  filterPillActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    ...type.labelSm,
    color: colors.onSurfaceVariant,
  },
  filterTextActive: {
    color: colors.onPrimary,
    fontFamily: fonts.heading,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 60,
  },
  loadingText: {
    ...type.body,
    color: colors.onSurfaceVariant,
    marginTop: 16,
  },
  emptyText: {
    ...type.h2,
    color: colors.onSurface,
    marginTop: 16,
  },
  emptySubText: {
    ...type.body,
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 16,
    marginBottom: 12,
    ...shadow.card,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  cardBody: {
    flex: 1,
  },
  dateText: {
    ...type.h3,
    color: colors.onSurface,
    marginBottom: 4,
  },
  detailText: {
    ...type.body,
    color: colors.onSurfaceVariant,
  },
  badgeWrap: {
    alignItems: "flex-end",
  },
  badge: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeText: {
    ...type.labelSm,
    color: colors.onPrimaryContainer,
  },
  badgeManual: {
    backgroundColor: colors.secondaryContainer,
  },
  badgeTextManual: {
    color: colors.tertiary, // dark enough for text
  },
});