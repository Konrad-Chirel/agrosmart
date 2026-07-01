import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, shadow } from "../theme";

interface PumpWarningModalProps {
  visible: boolean;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function PumpWarningModal({ visible, message, onCancel, onConfirm }: PumpWarningModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <MaterialIcons name="warning-amber" size={40} color="#f59e0b" />
          </View>
          <Text style={styles.title}>Attention</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttons}>
            <Pressable onPress={onCancel} style={({ pressed }) => [styles.btnCancel, pressed && styles.pressed]}>
              <Text style={styles.btnCancelText} numberOfLines={2} adjustsFontSizeToFit>Ne pas arroser</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={({ pressed }) => [styles.btnConfirm, pressed && styles.pressed]}>
              <Text style={styles.btnConfirmText} numberOfLines={2} adjustsFontSizeToFit>Arroser quand même</Text>
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
    backgroundColor: "#fef3c7",
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
    backgroundColor: "#d97706",
    alignItems: "center",
    justifyContent: "center",
  },
  btnConfirmText: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: "#ffffff",
    textAlign: "center",
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
});
