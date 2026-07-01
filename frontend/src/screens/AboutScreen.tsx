import { Linking, Pressable, ScrollView, StyleSheet, Text, View, Image } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { AppHeader } from "../components/AppHeader";
import { Screen } from "../components/Screen";
import { colors, fonts, radius, shadow, spacing, type } from "../theme";
import { images } from "../data/mockData";

export function AboutScreen() {
  const navigation = useNavigation();

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.headerBand}>
        <AppHeader title="À propos d'AgroSmart" back onBack={() => navigation.goBack()} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.logoContainer}>
          <Image source={{ uri: images.logo }} style={styles.logo} resizeMode="contain" />
          <Text style={styles.appName}>AgroSmart</Text>
          <Text style={styles.appVersion}>Version 2.4.0 (Build 892)</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notre Mission</Text>
          <View style={styles.card}>
            <Text style={styles.paragraph}>
              AgroSmart a pour mission de révolutionner l'agriculture en fournissant aux agriculteurs des outils numériques intelligents et connectés. 
              Grâce à l'analyse de données en temps réel et à l'IoT, nous aidons à optimiser les ressources, 
              réduire la consommation d'eau et augmenter les rendements de manière durable.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.list}>
            <Pressable style={styles.row} onPress={() => {}}>
              <View style={styles.rowLeft}>
                <View style={styles.rowIcon}>
                  <MaterialIcons name="description" size={22} color={colors.primary} />
                </View>
                <View style={styles.rowTextWrap}>
                  <Text numberOfLines={1} style={styles.rowTitle}>Conditions d'utilisation</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.outline} />
            </Pressable>
            
            <Pressable style={styles.row} onPress={() => {}}>
              <View style={styles.rowLeft}>
                <View style={styles.rowIcon}>
                  <MaterialIcons name="privacy-tip" size={22} color={colors.primary} />
                </View>
                <View style={styles.rowTextWrap}>
                  <Text numberOfLines={1} style={styles.rowTitle}>Politique de confidentialité</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.outline} />
            </Pressable>
            
            <Pressable style={[styles.row, { borderBottomWidth: 0 }]} onPress={() => Linking.openURL('https://agrosmart.com')}>
              <View style={styles.rowLeft}>
                <View style={styles.rowIcon}>
                  <MaterialIcons name="language" size={22} color={colors.primary} />
                </View>
                <View style={styles.rowTextWrap}>
                  <Text numberOfLines={1} style={styles.rowTitle}>Visiter notre site web</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.outline} />
            </Pressable>
          </View>
        </View>
        
        <Text style={styles.footerText}>© 2026 AgroSmart. Tous droits réservés.</Text>

      </ScrollView>
    </Screen>
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
  content: { paddingHorizontal: spacing.mobile, paddingTop: spacing.stackMd, paddingBottom: 40, width: "100%" },
  logoContainer: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: spacing.s,
  },
  appName: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: colors.primary,
  },
  appVersion: {
    ...type.body,
    fontFamily: fonts.body,
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
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
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(192,201,187,0.45)",
    backgroundColor: colors.surfaceContainerLowest,
    padding: 16,
  },
  paragraph: {
    ...type.body,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts.body,
    color: colors.onSurfaceVariant,
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
  rowTextWrap: { flex: 1, minWidth: 0 },
  rowTitle: { ...type.h2, fontSize: 17, lineHeight: 23, fontFamily: fonts.heading, color: colors.onSurface, flexShrink: 1 },
  footerText: {
    ...type.labelSm,
    fontFamily: fonts.body,
    color: colors.outline,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
