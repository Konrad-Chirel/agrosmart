import React, { useEffect, useRef, useState } from "react";
import { Alert, FlatList, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fonts, radius, shadow } from "../theme";
import * as theme from "../theme";
const type = theme.type;

interface Props {
  visible: boolean;
  onSelect: (minutes: number, seconds: number) => void;
  onCancel: () => void;
}

const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 5;

export function DurationPickerModal({ visible, onSelect, onCancel }: Props) {
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedSecond, setSelectedSecond] = useState(30);

  useEffect(() => {
    if (visible) {
      // Retain last selected values if desired, or reset
    }
  }, [visible]);

  const handleConfirm = () => {
    if (selectedMinute === 0 && selectedSecond === 0) {
      if (Platform.OS === 'web') {
        window.alert("La durée doit être supérieure à 0.");
      } else {
        Alert.alert("Durée invalide", "La durée doit être supérieure à 0.");
      }
      return;
    }
    onSelect(selectedMinute, selectedSecond);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Durée personnalisée</Text>

          <View style={styles.wheelContainer}>
            <View style={styles.selectionHighlight} />
            <ScrollWheel
              data={Array.from({ length: 121 }, (_, i) => i)} // 0 to 120 minutes
              selected={selectedMinute}
              onSelect={setSelectedMinute}
              formatItem={(m: number) => m.toString().padStart(2, '0')}
              label="min"
              visible={visible}
            />
            <Text style={styles.wheelSeparator}>:</Text>
            <ScrollWheel
              data={Array.from({ length: 60 }, (_, i) => i)} // 0 to 59 seconds
              selected={selectedSecond}
              onSelect={setSelectedSecond}
              formatItem={(s: number) => s.toString().padStart(2, '0')}
              label="sec"
              visible={visible}
            />
          </View>

          <Pressable onPress={handleConfirm} style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}>
            <MaterialIcons name="check" size={22} color={colors.onPrimary} />
            <Text style={styles.confirmText}>
              Confirmer {selectedMinute}m {selectedSecond.toString().padStart(2, '0')}s
            </Text>
          </Pressable>

          <Pressable onPress={onCancel} style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}>
            <Text style={styles.cancelText}>Annuler</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ScrollWheel({ data, selected, onSelect, formatItem, label, visible }: {
  data: number[];
  selected: number;
  onSelect: (v: number) => void;
  formatItem: (v: number) => string;
  label: string;
  visible: boolean;
}) {
  const flatListRef = useRef<FlatList>(null);
  const initialIndex = data.indexOf(selected);

  useEffect(() => {
    if (visible && flatListRef.current) {
      const idx = data.indexOf(selected);
      if (idx >= 0) {
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({ offset: idx * ITEM_HEIGHT, animated: false });
        }, 100);
      }
    }
  }, [visible]); 

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
              style={{ height: ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4 }}
            >
              <Text style={[
                styles.wheelItem,
                isSelected && styles.wheelItemSelected,
              ]}>
                {formatItem(item)}
              </Text>
              {isSelected && (
                <Text style={styles.wheelItemLabel}>{label}</Text>
              )}
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
  title: { ...type.h2, fontFamily: fonts.heading, color: colors.onSurface, marginBottom: 16, textAlign: "center" },
  cancel: { paddingVertical: 16, alignItems: "center", marginTop: 8 },
  cancelText: { ...type.label, fontFamily: fonts.body, color: colors.outline },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
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
    width: 90,
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
  wheelItemLabel: {
    ...type.labelSm,
    fontFamily: fonts.body,
    color: colors.primary,
    marginTop: 6,
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
