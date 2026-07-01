import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../theme";

const icons: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  Dashboard: "home",
  Crops: "eco",
  Weather: "cloud-queue",
  Alerts: "notifications-none",
  Settings: "settings",
};

export function BottomTabs({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.wrap}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const options = descriptors[route.key].options;
        const label = options.tabBarLabel?.toString() ?? options.title ?? route.name;
        
        return (
          <Pressable
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            style={styles.itemContainer}
          >
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <MaterialIcons 
                name={icons[route.name]} 
                size={26} 
                color={focused ? colors.onSurface : colors.onSurfaceVariant} 
              />
            </View>
            <Text numberOfLines={1} style={[styles.label, focused && styles.activeLabel]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 70,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  itemContainer: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center",
  },
  iconWrap: {
    width: 64,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  iconWrapActive: {
    backgroundColor: "#f97316",
  },
  label: { 
    fontSize: 11, 
    fontFamily: fonts.bodyMedium, 
    color: colors.onSurfaceVariant,
  },
  activeLabel: { 
    color: colors.onSurface, 
    fontFamily: fonts.heading,
    fontWeight: "bold",
  },
});
