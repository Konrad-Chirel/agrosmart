import { MaterialIcons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Image, ImageBackground, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppButton } from "../components/AppButton";
import { images } from "../data/mockData";
import { useOnboarding } from "../data/onboardingState";
import { colors, fonts, radius, shadow, spacing, type } from "../theme";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

const cities = ["Cotonou", "Porto-Novo", "Parakou", "Djougou", "Abomey-Calavi", "Bohicon", "Natitingou", "Ouidah"];

export function ProfileScreen({ navigation }: Props) {
  const {
    firstName,
    setFirstName,
    city,
    setCity,
    phone,
    setPhone,
    password,
    setPassword,
    passwordConfirmation,
    setPasswordConfirmation,
    profileImage,
  } = useOnboarding();
  const [cityOpen, setCityOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const nameError = validateFirstName(firstName);
  const cityError = city ? "" : "Veuillez sélectionner une région valide";
  const phoneError = validatePhone(phone);
  const passwordError = validatePassword(password);
  const confirmError = passwordConfirmation === password ? "" : "Les deux mots de passe ne correspondent pas";
  const isValid = !nameError && !cityError && !phoneError && !passwordError && !confirmError;

  const continueToNextStep = () => {
    setSubmitted(true);
    if (!isValid) return;
    navigation.navigate("CultureRegistration");
  };

  return (
    <ImageBackground source={{ uri: images.splash }} style={styles.bg} blurRadius={8}>
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
            <View style={styles.panel}>
              {cityOpen ? <Pressable style={styles.dismissLayer} onPress={() => setCityOpen(false)} /> : null}

              <View style={styles.topBar}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                  <MaterialIcons name="arrow-back" size={28} color={colors.primary} />
                </Pressable>
                <View style={styles.progressPill} />
                <View style={styles.topSpacer} />
              </View>

              <View style={styles.avatarWrap}>
                <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                <View style={styles.editBadge}>
                  <MaterialIcons name="edit" size={24} color={colors.onSecondary} />
                </View>
              </View>

              <Text style={styles.title}>Faisons connaissance</Text>
              <Text style={styles.copy}>Personnalisez votre expérience d'arrosage.</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Prénom</Text>
                <View style={[styles.inputField, submitted && nameError && styles.fieldError]}>
                  <MaterialIcons name="person" size={22} color={colors.outline} />
                  <TextInput
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Ex: Koffi"
                    placeholderTextColor="#4b5563"
                    autoCapitalize="words"
                    returnKeyType="done"
                    style={[styles.input, styles.webInputReset]}
                  />
                </View>
                {submitted && nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
              </View>

              <View style={[styles.fieldGroup, styles.cityBlock]}>
                <Text style={styles.fieldLabel}>Région</Text>
                {cityOpen ? (
                  <View style={styles.cityList}>
                    <Text style={styles.cityTitle}>Choisir une ville</Text>
                    {cities.map((item) => (
                      <Pressable
                        key={item}
                        onHoverIn={() => setHoveredCity(item)}
                        onHoverOut={() => setHoveredCity(null)}
                        onPress={() => {
                          setCity(item);
                          setCityOpen(false);
                          setHoveredCity(null);
                        }}
                        style={[styles.cityOption, hoveredCity === item && styles.cityOptionHover, item === city && styles.cityOptionActive]}
                      >
                        <Text style={[styles.cityText, item === city && styles.cityTextActive]}>{item}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}

                <Pressable style={[styles.citySelect, submitted && cityError && styles.fieldError]} onPress={() => setCityOpen((value) => !value)}>
                  <MaterialIcons name="place" size={25} color={colors.outline} />
                  <Text style={[styles.cityValue, !city && styles.placeholderText]}>{city || "Choisir une ville"}</Text>
                  <MaterialIcons name={cityOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={26} color={colors.onSurfaceVariant} />
                </Pressable>
                {submitted && cityError ? <Text style={styles.errorText}>{cityError}</Text> : null}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Numéro de téléphone</Text>
                <View style={[styles.inputField, submitted && phoneError && styles.fieldError]}>
                  <MaterialIcons name="phone" size={22} color={colors.outline} />
                  <Text style={{ ...type.bodyLg, fontFamily: fonts.body, color: colors.onSurface }}>+229</Text>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="0153801870"
                    placeholderTextColor="#4b5563"
                    keyboardType="numeric"
                    maxLength={10}
                    returnKeyType="done"
                    style={[styles.input, styles.webInputReset]}
                  />
                </View>
                {submitted && phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Mot de passe</Text>
                <View style={[styles.inputField, submitted && passwordError && styles.fieldError]}>
                  <MaterialIcons name="lock" size={22} color={colors.outline} />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Au moins 6 caractères"
                    placeholderTextColor="#4b5563"
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    style={[styles.input, styles.webInputReset]}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <MaterialIcons name={showPassword ? "visibility" : "visibility-off"} size={22} color={colors.outline} />
                  </Pressable>
                </View>
                {submitted && passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Confirmation du mot de passe</Text>
                <View style={[styles.inputField, submitted && confirmError && styles.fieldError]}>
                  <MaterialIcons name="lock-outline" size={22} color={colors.outline} />
                  <TextInput
                    value={passwordConfirmation}
                    onChangeText={setPasswordConfirmation}
                    placeholder="Retapez le mot de passe"
                    placeholderTextColor="#4b5563"
                    secureTextEntry={!showConfirmPassword}
                    returnKeyType="done"
                    style={[styles.input, styles.webInputReset]}
                  />
                  <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <MaterialIcons name={showConfirmPassword ? "visibility" : "visibility-off"} size={22} color={colors.outline} />
                  </Pressable>
                </View>
                {submitted && confirmError ? <Text style={styles.errorText}>{confirmError}</Text> : null}
              </View>

              <AppButton label="Continuer" icon="arrow-forward" onPress={isValid ? continueToNextStep : () => setSubmitted(true)} style={{ marginTop: 18, opacity: isValid ? 1 : 0.45 }} />
              
              <Pressable onPress={() => navigation.navigate("Login" as any)} style={{ marginTop: 24, alignItems: "center" }}>
                <Text style={{ ...type.body, fontFamily: fonts.body, color: colors.primary, textDecorationLine: "underline" }}>Déjà inscrit ? Se connecter</Text>
              </Pressable>
              <Text style={styles.step}>Étape 2 sur 5</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

function validateFirstName(value: string) {
  const valid = /^\p{L}+(?:[ -]\p{L}+)*$/u.test(value);
  if (value.length < 2 || value.length > 50 || !valid) {
    return "Le prénom ne peut contenir que des lettres, un tiret ou un espace entre les lettres";
  }
  return "";
}

function validatePhone(value: string) {
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length !== 10 || !cleaned.startsWith("01")) {
    return "Veuillez entrer un numéro valide au Bénin (10 chiffres, commençant par 01)";
  }
  return "";
}

function validatePassword(value: string) {
  if (value.length < 6 || !/\p{L}/u.test(value) || !/\d/.test(value)) {
    return "Le mot de passe doit contenir au moins 6 caractères dont une lettre et un chiffre";
  }
  return "";
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,69,13,0.28)" },
  safe: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "flex-end", alignItems: "center", paddingTop: 14 },
  panel: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    padding: spacing.mobile,
    paddingBottom: 36,
    position: "relative",
    ...shadow.lift,
  },
  dismissLayer: { ...StyleSheet.absoluteFillObject, zIndex: 1, backgroundColor: "transparent" },
  topBar: { height: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  backButton: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: radius.full },
  progressPill: { width: 30, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  topSpacer: { width: 48 },
  avatarWrap: { alignSelf: "center", width: 116, height: 116, marginBottom: 18 },
  avatarImage: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 4,
    borderColor: colors.surfaceContainerLowest,
    backgroundColor: colors.surfaceContainerHigh,
    ...shadow.card,
  },
  editBadge: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.secondaryContainer,
    borderWidth: 3,
    borderColor: colors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { ...type.h1Mobile, fontFamily: fonts.heading, color: colors.onSurface, textAlign: "center" },
  copy: { ...type.body, fontFamily: fonts.body, color: colors.onSurfaceVariant, textAlign: "center", marginBottom: 18 },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { ...type.label, fontFamily: fonts.body, color: colors.onSurface, marginBottom: 8, paddingLeft: 4 },
  inputField: {
    minHeight: 58,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  input: { ...type.bodyLg, fontFamily: fonts.body, color: colors.onSurface, padding: 0, flex: 1 },
  webInputReset: { outlineStyle: "none", outlineWidth: 0, boxShadow: "none", borderWidth: 0, backgroundColor: "transparent" } as never,
  cityBlock: { zIndex: 2 },
  cityList: { borderWidth: 1, borderColor: colors.outline, backgroundColor: colors.surfaceContainerLowest, overflow: "hidden", marginBottom: 8 },
  cityTitle: { ...type.bodyLg, fontFamily: fonts.body, color: colors.onSurfaceVariant, textAlign: "center", paddingTop: 6, paddingBottom: 2 },
  cityOption: { minHeight: 36, justifyContent: "center", paddingHorizontal: 60 },
  cityOptionHover: { backgroundColor: "#d2d2d2" },
  cityOptionActive: { backgroundColor: "#888888" },
  cityText: { fontSize: 20, lineHeight: 28, fontFamily: fonts.body, color: "#000000" },
  cityTextActive: { color: colors.onPrimary, fontWeight: "700" },
  citySelect: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    backgroundColor: colors.surfaceContainerLow,
  },
  cityValue: { ...type.bodyLg, fontFamily: fonts.body, color: colors.onSurface, flex: 1 },
  placeholderText: { color: colors.outline },
  fieldError: { borderColor: colors.error, backgroundColor: "#fff5f5" }, // fond rose très clair pour garder placeholder lisible
  errorText: { ...type.labelSm, fontFamily: fonts.body, color: colors.error, marginTop: 6, paddingLeft: 4 },
  step: { ...type.labelSm, fontFamily: fonts.body, textAlign: "center", color: colors.onSurfaceVariant, marginTop: 16 },
});
