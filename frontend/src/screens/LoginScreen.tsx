import { MaterialIcons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ImageBackground, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppButton } from "../components/AppButton";
import { images } from "../data/mockData";
import { colors, fonts, radius, shadow, spacing, type } from "../theme";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { AgrosmartService } from "../services/AgrosmartService";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSavedPhone() {
      const savedPhone = await AsyncStorage.getItem("user_phone");
      if (savedPhone) {
        setPhone(savedPhone.replace(/^229/, ""));
      }
    }
    loadSavedPhone();
  }, []);

  const handleLogin = async () => {
    setError(null);
    if (!phone || !password) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    try {
      setLoading(true);
      await AgrosmartService.login(phone, password);
      navigation.replace("MainTabs" as any);
    } catch (e: any) {
      console.log(e);
      setError("Numéro de téléphone ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={{ uri: images.splash }} style={styles.bg} blurRadius={8}>
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
            <View style={styles.panel}>
              <View style={styles.topBar}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                  <MaterialIcons name="arrow-back" size={28} color={colors.primary} />
                </Pressable>
              </View>

              <Text style={styles.title}>Rebonjour !</Text>
              <Text style={styles.copy}>Connectez-vous pour retrouver votre champ.</Text>

              {error && (
                <View style={styles.errorContainer}>
                  <MaterialIcons name="error-outline" size={20} color={colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Numéro de téléphone</Text>
                <View style={styles.inputField}>
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
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Mot de passe</Text>
                <View style={styles.inputField}>
                  <MaterialIcons name="lock" size={22} color={colors.outline} />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Votre mot de passe"
                    placeholderTextColor="#4b5563"
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    style={[styles.input, styles.webInputReset]}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <MaterialIcons name={showPassword ? "visibility" : "visibility-off"} size={22} color={colors.outline} />
                  </Pressable>
                </View>
              </View>

              {loading ? (
                <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 18 }} />
              ) : (
                <AppButton label="Se connecter" icon="login" onPress={handleLogin} style={{ marginTop: 18 }} />
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
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
    ...shadow.lift,
  },
  topBar: { height: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  backButton: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: radius.full },
  title: { ...type.h1Mobile, fontFamily: fonts.heading, color: colors.onSurface, textAlign: "center", marginTop: 20 },
  copy: { ...type.body, fontFamily: fonts.body, color: colors.onSurfaceVariant, textAlign: "center", marginBottom: 30 },
  errorContainer: { backgroundColor: "#fde7e7", padding: 12, borderRadius: radius.md, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 },
  errorText: { ...type.body, fontFamily: fonts.body, color: colors.error, flex: 1 },
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
});
