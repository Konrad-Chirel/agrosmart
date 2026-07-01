import React, { useEffect, useRef, useState } from "react";
import { Alert, FlatList, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fonts, radius, shadow, spacing } from "../theme";
import * as theme from "../theme";
const type = theme.type;

interface Props {
  visible: boolean;
  onSelect: (dateString: string, label: string, timestamp: number) => void;
  onCancel: () => void;
}

const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 5;

export function TimePickerModal({ visible, onSelect, onCancel }: Props) {
  const [mode, setMode] = useState<'quick' | 'custom'>('quick');
  const now = new Date();
  const [selectedHour, setSelectedHour] = useState(now.getHours());
  const [selectedMinute, setSelectedMinute] = useState(0);

  // Reset mode when modal opens
  useEffect(() => {
    if (visible) {
      setMode('quick');
      const n = new Date();
      // Default to next minute
      const nextMin = n.getMinutes() + 1;
      if (nextMin >= 60) {
        setSelectedHour(n.getHours() + 1);
        setSelectedMinute(0);
      } else {
        setSelectedHour(n.getHours());
        setSelectedMinute(nextMin);
      }
    }
  }, [visible]);

  const getQuickOptions = () => {
    const n = new Date();
    const options = [];

    options.push({ label: "Dans 10 minutes", date: new Date(n.getTime() + 10 * 60 * 1000) });
    options.push({ label: "Dans 30 minutes", date: new Date(n.getTime() + 30 * 60 * 1000) });
    options.push({ label: "Dans 1 heure", date: new Date(n.getTime() + 60 * 60 * 1000) });

    if (n.getHours() < 18) {
      const tonight = new Date(n);
      tonight.setHours(19, 0, 0, 0);
      options.push({ label: "Ce soir à 19h00", date: tonight });
    } else {
      const tomorrowMorning = new Date(n);
      tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
      tomorrowMorning.setHours(6, 0, 0, 0);
      options.push({ label: "Demain matin à 06h00", date: tomorrowMorning });
    }

    return options.map((opt) => {
      const d = opt.date;
      const pad = (nn: number) => nn.toString().padStart(2, '0');
      const val = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
      return { label: opt.label, value: val, timestamp: opt.date.getTime() };
    });
  };

  const handleQuickSelect = (opt: { value: string; label: string; timestamp: number }) => {
    if (opt.timestamp < Date.now()) {
      if (Platform.OS === 'web') {
        window.alert("Cette heure est déjà passée.");
      } else {
        Alert.alert("Heure invalide", "Cette heure est déjà passée.");
      }
      return;
    }
    onSelect(opt.value, opt.label, opt.timestamp);
  };

  const handleCustomConfirm = () => {
    const date = new Date();
    date.setHours(selectedHour, selectedMinute, 0, 0);

    // Si l'heure est passée, on programme pour demain
    if (date.getTime() <= Date.now()) {
      date.setDate(date.getDate() + 1);
    }

    const pad = (n: number) => n.toString().padStart(2, '0');
    const val = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
    const dayLabel = date.getDate() !== new Date().getDate() ? 'Demain' : "Aujourd'hui";
    const label = `${dayLabel} à ${pad(selectedHour)}h${pad(selectedMinute)}`;

    onSelect(val, label, date.getTime());
  };

  const isPastTime = (() => {
    const d = new Date();
    d.setHours(selectedHour, selectedMinute, 0, 0);
    return d.getTime() <= Date.now();
  })();

  const options = getQuickOptions();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {mode === 'quick' ? (
            <>
              <Text style={styles.title}>Choisir l'heure de départ</Text>
              <Text style={styles.subtitle}>Le système vérifiera la météo 15 min avant le départ.</Text>

              {options.map((opt, i) => (
                <Pressable key={i} onPress={() => handleQuickSelect(opt)} style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
                  <Text style={styles.optionText}>{opt.label}</Text>
                </Pressable>
              ))}

              <Pressable
                onPress={() => setMode('custom')}
                style={({ pressed }) => [styles.option, styles.customOption, pressed && styles.pressed]}
              >
                <MaterialIcons name="schedule" size={20} color={colors.onPrimary} style={{ marginRight: 8 }} />
                <Text style={styles.customOptionText}>Heure personnalisée</Text>
              </Pressable>

              <Pressable onPress={onCancel} style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}>
                <Text style={styles.cancelText}>Annuler</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.title}>Choisir une heure</Text>

              <View style={styles.wheelContainer}>
                <View style={styles.selectionHighlight} />
                <ScrollWheel
                  data={Array.from({ length: 24 }, (_, i) => i)}
                  selected={selectedHour}
                  onSelect={setSelectedHour}
                  formatItem={(h: number) => h.toString().padStart(2, '0')}
                />
                <Text style={styles.wheelSeparator}>:</Text>
                <ScrollWheel
                  data={Array.from({ length: 60 }, (_, i) => i)}
                  selected={selectedMinute}
                  onSelect={setSelectedMinute}
                  formatItem={(m: number) => m.toString().padStart(2, '0')}
                />
              </View>

              {isPastTime && (
                <View style={styles.tomorrowNote}>
                  <MaterialIcons name="info-outline" size={16} color={colors.secondary} />
                  <Text style={styles.tomorrowText}>
                    Cette heure est passée. L'arrosage sera programmé pour demain.
                  </Text>
                </View>
              )}

              <Pressable onPress={handleCustomConfirm} style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}>
                <MaterialIcons name="check" size={22} color={colors.onPrimary} />
                <Text style={styles.confirmText}>
                  Confirmer {selectedHour.toString().padStart(2, '0')}h{selectedMinute.toString().padStart(2, '0')}
                </Text>
              </Pressable>

              <Pressable onPress={() => setMode('quick')} style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}>
                <Text style={styles.cancelText}>← Retour aux raccourcis</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function ScrollWheel({ data, selected, onSelect, formatItem }: {
  data: number[];
  selected: number;
  onSelect: (v: number) => void;
  formatItem: (v: number) => string;
}) {
  const flatListRef = useRef<FlatList>(null);
  const initialIndex = data.indexOf(selected);

  useEffect(() => {
    if (flatListRef.current && initialIndex >= 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: initialIndex * ITEM_HEIGHT, animated: false });
      }, 100);
    }
  }, []);

  const handleScrollEnd = (e: any) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const idx = Math.round(offsetY / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(data.length - 1, idx));
    if (data[clamped] !== selected) {
      onSelect(data[clamped]);
    }
  };

  return (
    <View style={styles.wheelColumn}>
      <FlatList
        ref={flatListRef}
        data={data}
        keyExtractor={(item) => item.toString()}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        contentContainerStyle={{
          paddingTop: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
          paddingBottom: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
        }}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        renderItem={({ item }) => {
          const isSelected = item === selected;
          return (
            <Pressable
              onPress={() => {
                onSelect(item);
                const idx = data.indexOf(item);
                flatListRef.current?.scrollToOffset({ offset: idx * ITEM_HEIGHT, animated: true });
              }}
              style={{ height: ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={[
                styles.wheelItem,
                isSelected && styles.wheelItemSelected,
              ]}>
                {formatItem(item)}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 },
  container: { backgroundColor: colors.surfaceContainerLowest, borderRadius: radius.card, padding: 24, width: "100%", maxWidth: 400, ...shadow.lift },
  title: { ...type.h2, fontFamily: fonts.heading, color: colors.onSurface, marginBottom: 8, textAlign: "center" },
  subtitle: { ...type.body, fontFamily: fonts.body, color: colors.onSurfaceVariant, marginBottom: 24, textAlign: "center" },
  option: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingVertical: 16,
    borderRadius: 24,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
    flexDirection: "row",
  },
  customOption: { backgroundColor: colors.primary },
  optionText: { ...type.label, fontFamily: fonts.heading, color: colors.onSurface },
  customOptionText: { ...type.label, fontFamily: fonts.heading, color: colors.onPrimary },
  cancel: { paddingVertical: 16, alignItems: "center", marginTop: 8 },
  cancelText: { ...type.label, fontFamily: fonts.body, color: colors.outline },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },

  // Custom time picker wheel
  wheelContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    marginVertical: 16,
    overflow: "hidden",
    position: "relative",
  },
  selectionHighlight: {
    position: "absolute",
    left: 20,
    right: 20,
    top: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
    height: ITEM_HEIGHT,
    backgroundColor: `${colors.primary}12`,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: `${colors.primary}30`,
  },
  wheelColumn: {
    width: 80,
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
  },
  wheelSeparator: {
    fontSize: 32,
    fontFamily: fonts.heading,
    color: colors.primary,
    marginHorizontal: 8,
  },
  wheelItem: {
    fontSize: 28,
    fontFamily: fonts.body,
    color: colors.outline,
    textAlign: "center",
  },
  wheelItemSelected: {
    fontSize: 32,
    fontFamily: fonts.heading,
    color: colors.primary,
  },
  tomorrowNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.secondaryContainer,
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 16,
  },
  tomorrowText: {
    ...type.labelSm,
    fontFamily: fonts.body,
    color: colors.onSecondaryContainer,
    flex: 1,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    minHeight: 56,
    ...shadow.card,
  },
  confirmText: {
    ...type.label,
    fontSize: 16,
    fontFamily: fonts.heading,
    color: colors.onPrimary,
  },
});
