import { MaterialIcons } from "@expo/vector-icons";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AppHeader } from "../components/AppHeader";
import { Screen } from "../components/Screen";
import { colors, fonts, radius, shadow, spacing, type } from "../theme";

export function SupportScreen() {
  const navigation = useNavigation();
  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.headerBand}>
        <AppHeader title="Aide & Support" back onBack={() => navigation.goBack()} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contactez-nous</Text>
          <Text style={styles.sectionDesc}>
            Une équipe est à votre disposition pour vous accompagner dans l'utilisation d'AgroSmart.
          </Text>

          <View style={styles.list}>
            <Pressable style={styles.row} onPress={() => Linking.openURL('tel:+22900000000')}>
              <View style={styles.rowLeft}>
                <View style={styles.rowIcon}>
                  <MaterialIcons name="phone" size={22} color={colors.primary} />
                </View>
                <View style={styles.rowTextWrap}>
                  <Text numberOfLines={1} style={styles.rowTitle}>Appel téléphonique</Text>
                  <Text numberOfLines={1} style={styles.rowDetail}>+229 00 00 00 00</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.outline} />
            </Pressable>

            <Pressable style={styles.row} onPress={() => Linking.openURL('https://wa.me/22900000000')}>
              <View style={styles.rowLeft}>
                <View style={styles.rowIcon}>
                  <MaterialIcons name="chat" size={22} color={colors.primary} />
                </View>
                <View style={styles.rowTextWrap}>
                  <Text numberOfLines={1} style={styles.rowTitle}>WhatsApp</Text>
                  <Text numberOfLines={1} style={styles.rowDetail}>Assistance rapide</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.outline} />
            </Pressable>

            <Pressable style={[styles.row, { borderBottomWidth: 0 }]} onPress={() => Linking.openURL('mailto:support@agrosmart.com')}>
              <View style={styles.rowLeft}>
                <View style={styles.rowIcon}>
                  <MaterialIcons name="email" size={22} color={colors.primary} />
                </View>
                <View style={styles.rowTextWrap}>
                  <Text numberOfLines={1} style={styles.rowTitle}>Email</Text>
                  <Text numberOfLines={1} style={styles.rowDetail}>support@agrosmart.com</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.outline} />
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Foire aux questions</Text>
          
          <View style={styles.list}>
            <View style={styles.faqCard}>
              <Text style={styles.faqQ}>Comment ajouter un capteur ?</Text>
              <Text style={styles.faqA}>Allez dans Paramètres {'>'} Équipement & IoT {'>'} Gérer mes capteurs et cliquez sur "Ajouter".</Text>
            </View>
            <View style={[styles.faqCard, { borderBottomWidth: 0 }]}>
              <Text style={styles.faqQ}>La pompe ne s'active pas ?</Text>
              <Text style={styles.faqA}>Vérifiez votre connexion internet et assurez-vous que la parcelle concernée a suffisamment de batterie.</Text>
            </View>
          </View>
        </View>

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
  sectionDesc: {
    ...type.body,
    fontFamily: fonts.body,
    color: colors.onSurfaceVariant,
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
  rowTextWrap: { flex: 1, minWidth: 0 },
  rowTitle: { ...type.h2, fontSize: 17, lineHeight: 23, fontFamily: fonts.heading, color: colors.onSurface, flexShrink: 1 },
  rowDetail: { ...type.labelSm, fontFamily: fonts.body, color: colors.primary, marginTop: 2, flexShrink: 1 },
  faqCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(192,201,187,0.22)",
  },
  faqQ: {
    ...type.h2,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fonts.heading,
    color: colors.onSurface,
    marginBottom: 6,
  },
  faqA: {
    ...type.body,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.body,
    color: colors.onSurfaceVariant,
  },
});
