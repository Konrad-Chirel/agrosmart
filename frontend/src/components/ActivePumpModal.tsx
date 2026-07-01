import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useState, useRef } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, shadow } from "../theme";

interface ActivePumpModalProps {
  visible: boolean;
  pumpStatus: any;
  onCancel: () => void;
  onStopPump: () => void;
}

export function ActivePumpModal({ visible, pumpStatus, onCancel, onStopPump }: ActivePumpModalProps) {
  const [timeValue, setTimeValue] = useState(0);
  const hasDuration = pumpStatus?.duree_minutes && pumpStatus.duree_minutes > 0;
  
  const currentId = pumpStatus?.id ? String(pumpStatus.id) : (pumpStatus?.debut_arrosage || 'unknown');
  const lastIdRef = useRef<string | null>(null);
  const timeReceivedRef = useRef<number>(Date.now());
  
  if (currentId !== lastIdRef.current) {
    lastIdRef.current = currentId;
    timeReceivedRef.current = Date.now();
  }

  useEffect(() => {
    if (!visible || !pumpStatus) {
      return;
    }
    
    // We calculate the time inside the interval so it updates perfectly every second
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedSinceApi = Math.max(0, Math.floor((now - timeReceivedRef.current) / 1000));
      
      let initialElapsed = 0;
      if (pumpStatus.duree_ecoulee_secondes !== undefined && pumpStatus.duree_ecoulee_secondes !== null) {
        initialElapsed = Math.max(0, Math.floor(pumpStatus.duree_ecoulee_secondes) + elapsedSinceApi);
      } else if (pumpStatus.debut_arrosage) {
        const startMs = new Date(pumpStatus.debut_arrosage).getTime();
        if (!isNaN(startMs)) {
          initialElapsed = Math.max(0, Math.floor((now - startMs) / 1000));
        }
      }

      if (hasDuration) {
        const totalSecs = Math.floor(pumpStatus.duree_minutes * 60);
        const remaining = Math.max(0, totalSecs - initialElapsed);
        setTimeValue(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
        }
      } else {
        setTimeValue(initialElapsed); // Count up
      }
    }, 1000);

    // Initial manual calculation to prevent waiting 1 second for the first update
    const initialElapsedSinceApi = Math.max(0, Math.floor((Date.now() - timeReceivedRef.current) / 1000));
    let startElapsed = 0;
    if (pumpStatus.duree_ecoulee_secondes !== undefined && pumpStatus.duree_ecoulee_secondes !== null) {
      startElapsed = Math.max(0, Math.floor(pumpStatus.duree_ecoulee_secondes) + initialElapsedSinceApi);
    } else if (pumpStatus.debut_arrosage) {
      const startMs = new Date(pumpStatus.debut_arrosage).getTime();
      if (!isNaN(startMs)) {
        startElapsed = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      }
    }
    if (hasDuration) {
        const totalSecs = Math.floor(pumpStatus.duree_minutes * 60);
        setTimeValue(Math.max(0, totalSecs - startElapsed));
    } else {
        setTimeValue(startElapsed);
    }

    return () => clearInterval(interval);
  }, [visible, pumpStatus, hasDuration, currentId]);

  const mins = Math.floor(timeValue / 60);
  const secs = timeValue % 60;
  const timeString = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <MaterialIcons name="water-drop" size={40} color={colors.primary} />
          </View>
          <Text style={styles.title}>Arrosage en cours</Text>
          <Text style={styles.message}>
            Un arrosage est actuellement actif sur cette parcelle.{"\n\n"}
            {hasDuration ? "Il reste environ " : "Actif depuis "}
            <Text style={styles.timeText}>{timeString}</Text>.
          </Text>
          <View style={styles.buttons}>
            <Pressable onPress={onCancel} style={({ pressed }) => [styles.btnCancel, pressed && styles.pressed]}>
              <Text style={styles.btnCancelText} numberOfLines={2} adjustsFontSizeToFit>Ne pas perturber</Text>
            </Pressable>
            <Pressable onPress={onStopPump} style={({ pressed }) => [styles.btnConfirm, pressed && styles.pressed]}>
              <Text style={styles.btnConfirmText} numberOfLines={2} adjustsFontSizeToFit>Arrêter l'arrosage</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    ...shadow.lift,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.onSurface,
    marginBottom: 12,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  timeText: {
    fontFamily: fonts.heading,
    color: colors.primary,
    fontSize: 18,
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    justifyContent: "center",
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: "center",
    justifyContent: "center",
  },
  btnCancelText: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: colors.onSurface,
    textAlign: "center",
  },
  btnConfirm: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.error,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  btnConfirmText: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: colors.error,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
});
