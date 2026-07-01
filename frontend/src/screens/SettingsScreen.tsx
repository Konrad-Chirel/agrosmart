import { MaterialIcons } from "@expo/vector-icons";
import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { AppHeader } from "../components/AppHeader";
import { Screen } from "../components/Screen";
import { useOnboarding } from "../data/onboardingState";
import { colors, fonts, radius, shadow, spacing, type } from "../theme";
import { AgrosmartService } from "../services/AgrosmartService";
import { AppButton } from "../components/AppButton";

type IconName = keyof typeof MaterialIcons.glyphMap;

export function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { firstName, setFirstName, lastName, setLastName, city, setCity, phone, setPhone, profileImage } = useOnboarding();
  const [pushEnabled, setPushEnabled] = useState(true);
  
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [editName, setEditName] = useState(firstName);
  const [editLastName, setEditLastName] = useState(lastName);
  const [editPhone, setEditPhone] = useState(phone);
  const [editCity, setEditCity] = useState(city);
  const [editPassword, setEditPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [displayPhone, setDisplayPhone] = useState(phone);
  const [errors, setErrors] = useState<{name?: string, phone?: string}>({});

  const loadProfile = async () => {
    try {
      const data = await AgrosmartService.getProfile();
      if (data && data.user) {
        const user = data.user;
        if (user.prenom) setFirstName(user.prenom);
        if (user.nom) setLastName(user.nom);
        if (user.region) setCity(user.region);
        if (user.telephone) setPhone(user.telephone);
        
        setEditName(user.prenom || "");
        setEditLastName(user.nom || "");
        setEditCity(user.region || "");
        
        let p = user.telephone || "";
        if (p.startsWith("+229")) p = p.substring(4);
        else if (p.startsWith("229")) p = p.substring(3);
        
        setEditPhone(p);
        setDisplayPhone(p);
      }
    } catch (e) {
      console.log("Failed to load profile", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const displayName = [firstName, lastName].filter(Boolean).join(" ") || "Koffi";

  const handleLogout = async () => {
    await AgrosmartService.logout();
    navigation.reset({ index: 0, routes: [{ name: "Splash" }] });
  };

  const handleSaveProfile = async () => {
    setErrors({});
    let hasError = false;
    let newErrors: {name?: string, phone?: string} = {};

    // Validations
    if (!editName.trim() || !editLastName.trim()) {
      newErrors.name = "Le nom et le prénom sont obligatoires.";
      hasError = true;
    } else if (!/^[\p{L}\s\-]+$/u.test(editName) || !/^[\p{L}\s\-]+$/u.test(editLastName)) {
      newErrors.name = "Le nom et le prénom ne doivent contenir que des lettres.";
      hasError = true;
    }
    
    // Check phone number format (10 digits starting with 01)
    if (!/^01\d{8}$/.test(editPhone)) {
      newErrors.phone = "Le numéro doit comporter exactement 10 chiffres et commencer par 01.";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSaving(true);
      const fullPhone = `229${editPhone}`;
      await AgrosmartService.updateProfile({
        prenom: editName.trim(),
        nom: editLastName.trim(),
        telephone: fullPhone,
        region: "Parakou", // Force Parakou
        ...(editPassword ? { password: editPassword } : {})
      });
      setFirstName(editName.trim());
      setLastName(editLastName.trim());
      setPhone(fullPhone);
      setCity("Parakou");
      
      setDisplayPhone(editPhone);
      
      setEditPassword(""); // clear it
      setErrors({});
      setProfileModalVisible(false);
    } catch (e: any) {
      console.error(e);
      let backendError = e.response?.data?.message;
      if (e.response?.data?.errors) {
        const firstError = Object.values(e.response.data.errors)[0] as string[];
        if (firstError && firstError.length > 0) {
          backendError = firstError[0];
        }
      }
      Alert.alert("Erreur", backendError || "Impossible de mettre à jour le profil");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.headerBand}>
        <AppHeader onBack={() => navigation.openDrawer()} />
      </View>

      <View style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.profilePhotoWrap}>
            <Image source={{ uri: profileImage }} style={styles.profilePhoto} />
            <Pressable style={styles.editButton} onPress={() => setProfileModalVisible(true)}>
              <MaterialIcons name="edit" size={20} color={colors.onPrimary} />
            </Pressable>
          </View>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82} style={styles.phone}>
            +229 {displayPhone || "00 00 00 00"}{city ? ` · ${city}` : ""}
          </Text>
          <Pressable style={styles.profileButton} onPress={() => setProfileModalVisible(true)}>
            <MaterialIcons name="person" size={20} color={colors.onPrimary} />
            <Text style={styles.profileButtonText}>Modifier le profil</Text>
          </Pressable>
        </View>

        <SettingsSection title="Compte & Préférences">
          <SettingsRow icon="security" title="Sécurité" tone="primary" />
          <ToggleRow
            icon="notifications-active"
            title="Notifications push"
            enabled={pushEnabled}
            onPress={() => setPushEnabled((value) => !value)}
          />
        </SettingsSection>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Équipement & IoT</Text>
          <View style={styles.iotGrid}>
            <View style={styles.iotCard}>
              <View style={styles.iotIcon}>
                <MaterialIcons name="sensors" size={28} color={colors.primary} />
              </View>
              <Text style={styles.iotTitle}>Gérer mes capteurs</Text>
              <Text style={styles.iotDetail}>3 capteurs actifs</Text>
            </View>
            <View style={styles.iotCard}>
              <View style={styles.iotIcon}>
                <MaterialIcons name="water" size={28} color={colors.primary} />
              </View>
              <Text style={styles.iotTitle}>État de la pompe</Text>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Fonctionnement optimal</Text>
              </View>
            </View>
            <View style={styles.networkCard}>
              <View style={styles.networkLeft}>
                <View style={styles.smallCircle}>
                  <MaterialIcons name="router" size={22} color={colors.primary} />
                </View>
                <Text style={styles.networkTitle}>Configuration réseau</Text>
              </View>
              <Text style={styles.networkChip}>4G Connecté</Text>
            </View>
          </View>
        </View>

        <SettingsSection title="Assistance">
          <SettingsRow icon="help" title="Aide & Support" tone="muted" onPress={() => navigation.navigate("Support")} />
          <SettingsRow icon="info" title="À propos d'AgroSmart" tone="muted" onPress={() => navigation.navigate("About")} />
          <Pressable style={[styles.row, styles.logoutRow]} onPress={handleLogout}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, styles.logoutIcon]}>
                <MaterialIcons name="logout" size={22} color={colors.error} />
              </View>
              <Text style={styles.logoutText}>Déconnexion</Text>
            </View>
            <MaterialIcons name="arrow-forward" size={22} color="rgba(186,26,26,0.55)" />
          </Pressable>
        </SettingsSection>

        <Text style={styles.version}>Version 2.4.0 (Build 892)</Text>
      </View>

      <Modal visible={profileModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Text style={[styles.modalTitle, { marginBottom: 0 }]}>Modifier mon profil</Text>
              <Pressable onPress={() => { setProfileModalVisible(false); setErrors({}); }} style={{ padding: 4 }}>
                <MaterialIcons name="close" size={24} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>
            
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Nom</Text>
              <TextInput
                value={editLastName}
                onChangeText={setEditLastName}
                style={[styles.modalInput, errors.name && { borderColor: colors.error }]}
                placeholderTextColor={colors.outline}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Prénom</Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                style={[styles.modalInput, errors.name && { borderColor: colors.error }]}
                placeholderTextColor={colors.outline}
              />
              {errors.name && <Text style={{ ...type.labelSm, color: colors.error, marginTop: 4 }}>{errors.name}</Text>}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Téléphone</Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ ...type.bodyLg, fontFamily: fonts.body, color: colors.onSurfaceVariant, marginRight: 8 }}>+229</Text>
                <TextInput
                  value={editPhone}
                  onChangeText={setEditPhone}
                  style={[styles.modalInput, { flex: 1 }, errors.phone && { borderColor: colors.error }]}
                  keyboardType="phone-pad"
                  placeholderTextColor={colors.outline}
                />
              </View>
              {errors.phone && <Text style={{ ...type.labelSm, color: colors.error, marginTop: 4 }}>{errors.phone}</Text>}
            </View>
            
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Région / Ville</Text>
              <TextInput
                value="Parakou"
                editable={false}
                style={[styles.modalInput, { backgroundColor: colors.surfaceContainer, color: colors.onSurfaceVariant }]}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Nouveau mot de passe</Text>
              <TextInput
                value={editPassword}
                onChangeText={setEditPassword}
                style={styles.modalInput}
                placeholder="Laisser vide pour ne pas changer"
                placeholderTextColor={colors.outline}
                secureTextEntry
              />
            </View>

            <View style={styles.modalActions}>
              <AppButton label="Annuler" variant="ghost" style={{ flex: 1 }} onPress={() => setProfileModalVisible(false)} />
              <AppButton label={isSaving ? "En cours..." : "Enregistrer"} style={{ flex: 1, opacity: isSaving ? 0.6 : 1 }} onPress={handleSaveProfile} />
            </View>
          </View>
        </View>
      </Modal>

    </Screen>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.list}>{children}</View>
    </View>
  );
}

function SettingsRow({
  icon,
  title,
  detail,
  tone,
  trailing = "chevron-right",
  onPress,
}: {
  icon: IconName;
  title: string;
  detail?: string;
  tone: "primary" | "secondary" | "muted";
  trailing?: IconName;
  onPress?: () => void;
}) {
  const isSecondary = tone === "secondary";
  const isMuted = tone === "muted";
  const Wrapper = onPress ? Pressable : View;
  
  return (
    <Wrapper style={styles.row} onPress={onPress}>
      <View style={styles.rowLeft}>
        <View style={[styles.rowIcon, isSecondary && styles.secondaryIcon, isMuted && styles.mutedIcon]}>
          <MaterialIcons name={icon} size={22} color={isSecondary ? colors.secondary : isMuted ? colors.onSurfaceVariant : colors.primary} />
        </View>
        <View style={styles.rowTextWrap}>
          <Text numberOfLines={2} style={styles.rowTitle}>{title}</Text>
          {detail ? <Text numberOfLines={1} style={[styles.rowDetail, isSecondary && styles.secondaryDetail]}>{detail}</Text> : null}
        </View>
      </View>
      <MaterialIcons name={trailing} size={24} color={colors.outline} />
    </Wrapper>
  );
}

function ToggleRow({
  icon,
  title,
  detail,
  enabled,
  onPress,
}: {
  icon: IconName;
  title: string;
  detail?: string;
  enabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={styles.rowLeft}>
        <View style={styles.secondaryIcon}>
          <MaterialIcons name={icon} size={22} color={colors.secondary} />
        </View>
        <View style={styles.rowTextWrap}>
          <Text numberOfLines={2} style={styles.rowTitle}>{title}</Text>
          {detail ? <Text numberOfLines={1} style={styles.secondaryDetail}>{detail}</Text> : null}
        </View>
      </View>
      <View style={[styles.switchTrack, enabled && styles.switchTrackOn]}>
        <View style={[styles.switchThumb, enabled && styles.switchThumbOn]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0, paddingTop: 0 },
  headerBand: {
    paddingHorizontal: spacing.mobile,
    paddingTop: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,69,13,0.08)",
    backgroundColor: colors.surface,
  },
  content: { paddingHorizontal: spacing.mobile, paddingTop: spacing.stackMd, width: "100%" },
  profileCard: {
    alignItems: "center",
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(192,201,187,0.45)",
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.stackMd,
    ...shadow.card,
  },
  profilePhotoWrap: { width: 96, height: 96, marginBottom: spacing.stackSm },
  profilePhoto: { width: 96, height: 96, borderRadius: 48, borderWidth: 4, borderColor: colors.primaryFixed },
  editButton: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.card,
  },
  profileName: { ...type.h2, fontFamily: fonts.heading, color: colors.onSurface },
  phone: { ...type.body, fontFamily: fonts.body, color: colors.onSurfaceVariant, marginTop: 2, marginBottom: spacing.stackMd, maxWidth: "100%" },
  profileButton: {
    minHeight: 52,
    alignSelf: "stretch",
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  profileButtonText: { ...type.label, fontFamily: fonts.body, color: colors.onPrimary },
  section: { marginTop: spacing.stackMd },
  sectionTitle: {
    ...type.label,
    fontFamily: fonts.body,
    color: colors.onSurfaceVariant,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.base,
    paddingHorizontal: 8,
  },
  list: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(192,201,187,0.45)",
    backgroundColor: colors.surfaceContainerLowest,
    overflow: "hidden",
  },
  row: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(192,201,187,0.22)",
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1, minWidth: 0, paddingRight: 8 },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(27,94,32,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,143,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  mutedIcon: { backgroundColor: colors.surfaceContainer },
  rowTextWrap: { flex: 1, minWidth: 0 },
  rowTitle: { ...type.h2, fontSize: 17, lineHeight: 23, fontFamily: fonts.heading, color: colors.onSurface, flexShrink: 1 },
  rowDetail: { ...type.labelSm, fontFamily: fonts.body, color: colors.primary, marginTop: 2, flexShrink: 1 },
  secondaryDetail: { ...type.labelSm, fontFamily: fonts.body, color: colors.secondary, marginTop: 2, flexShrink: 1 },
  switchTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerHighest,
    padding: 4,
    justifyContent: "center",
  },
  switchTrackOn: { backgroundColor: colors.primary },
  switchThumb: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.surfaceContainerLowest },
  switchThumbOn: { transform: [{ translateX: 20 }] },
  iotGrid: { gap: spacing.gutter },
  iotCard: {
    minHeight: 136,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(192,201,187,0.45)",
    backgroundColor: colors.surfaceContainerLowest,
    padding: 14,
    ...shadow.card,
  },
  iotIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(0,69,13,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.base,
  },
  iotTitle: { ...type.h2, fontSize: 18, lineHeight: 24, fontFamily: fonts.heading, color: colors.onSurface },
  iotDetail: { ...type.labelSm, fontFamily: fonts.body, color: colors.onSurfaceVariant, marginTop: 4 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22c55e" },
  statusText: { ...type.labelSm, fontFamily: fonts.body, color: "#16a34a" },
  networkCard: {
    minHeight: 72,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(192,201,187,0.45)",
    backgroundColor: colors.surfaceContainerLowest,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    ...shadow.card,
  },
  networkLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1, minWidth: 0 },
  smallCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,69,13,0.08)", alignItems: "center", justifyContent: "center" },
  networkTitle: { ...type.label, fontFamily: fonts.body, color: colors.onSurface, flexShrink: 1, minWidth: 0 },
  networkChip: {
    ...type.labelSm,
    fontFamily: fonts.body,
    color: colors.primary,
    backgroundColor: "rgba(0,69,13,0.06)",
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  logoutRow: { borderBottomWidth: 0 },
  logoutIcon: { backgroundColor: "rgba(186,26,26,0.10)" },
  logoutText: { ...type.h2, fontSize: 18, lineHeight: 24, fontFamily: fonts.heading, color: colors.error },
  version: {
    ...type.labelSm,
    fontFamily: fonts.body,
    color: colors.outline,
    textAlign: "center",
    paddingVertical: spacing.stackMd,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 24,
    ...shadow.lift,
  },
  modalTitle: { ...type.h2, fontFamily: fonts.heading, color: colors.onSurface, marginBottom: 20 },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { ...type.label, fontFamily: fonts.body, color: colors.onSurface, marginBottom: 8 },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.md,
    padding: 12,
    ...type.bodyLg,
    fontFamily: fonts.body,
    color: colors.onSurface,
  },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 10 },
});
