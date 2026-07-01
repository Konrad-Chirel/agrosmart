import { Platform } from "react-native";

export const colors = {
  surface: "#ffffff", // Cards are white
  surfaceDim: "#e0e4db",
  surfaceBright: "#ffffff",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f6f8f3",
  surfaceContainer: "#ecefe6",
  surfaceContainerHigh: "#e6e9e0",
  surfaceContainerHighest: "#e0e4db",
  onSurface: "#191d17", // Primary text
  onSurfaceVariant: "#41493e", // Secondary text
  inverseSurface: "#2d322c",
  inverseOnSurface: "#eff2e9",
  outline: "#a0a8a0",        // Gris-vert lisible pour les bordures subtiles
  outlineVariant: "#c0c9bb",
  surfaceTint: "#2a6b2c",
  primary: "#00450d", // Dark green buttons/titles
  onPrimary: "#ffffff",
  primaryContainer: "#1b5e20",
  onPrimaryContainer: "#90d689",
  inversePrimary: "#91d78a",
  secondary: "#ff9500", // Bright orange for active tabs and badges
  onSecondary: "#ffffff",
  secondaryContainer: "#ffeed4", // Light orange background for badges
  onSecondaryContainer: "#623400",
  tertiary: "#721900",
  onTertiary: "#ffffff",
  tertiaryContainer: "#9b2500",
  onTertiaryContainer: "#ffb29d",
  error: "#ba1a1a",
  onError: "#ffffff",
  errorContainer: "#ffdad6",
  onErrorContainer: "#93000a",
  background: "#f6f8f3", // Light green/beige background from mockups
  water: "#4aa7ff",
  
  // Material 3 mapped fixed colors
  primaryFixed: "#c4ffd0",
  primaryFixedDim: "#90d689",
  onPrimaryFixed: "#002104",
  secondaryFixed: "#ffddb3",
  secondaryFixedDim: "#ffb45e",
  onSecondaryFixed: "#291800",
};

export const spacing = {
  base: 8,
  gutter: 16,
  mobile: 20,
  stackSm: 12,
  stackMd: 24,
  stackLg: 40,
};

export const radius = {
  sm: 4,
  md: 12,
  lg: 16,
  xl: 24,
  card: 16, // Softer rounding for cards
  full: 999, // Pill shape
};

export const fonts = {
  heading: "Outfit_700Bold",
  headingExtra: "Outfit_800ExtraBold",
  body: "Outfit_400Regular",
  bodyMedium: "Outfit_500Medium",
};

export const type = {
  display: { fontSize: 48, lineHeight: 56, fontFamily: fonts.headingExtra },
  h1: { fontSize: 32, lineHeight: 40, fontFamily: fonts.headingExtra },
  h1Mobile: { fontSize: 24, lineHeight: 32, fontFamily: fonts.heading },
  h2: { fontSize: 20, lineHeight: 28, fontFamily: fonts.heading },
  bodyLg: { fontSize: 18, lineHeight: 26, fontFamily: fonts.bodyMedium },
  body: { fontSize: 16, lineHeight: 24, fontFamily: fonts.body },
  label: { fontSize: 14, lineHeight: 20, fontFamily: fonts.heading },
  labelSm: { fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyMedium },
};

export const shadow = {
  card: {
    shadowColor: "#00450d",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  lift: {
    shadowColor: "#00450d",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
};
