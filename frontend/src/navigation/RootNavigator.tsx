import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { NavigatorScreenParams } from "@react-navigation/native";

import { BottomTabs } from "../components/BottomTabs";

import { AlertsScreen } from "../screens/AlertsScreen";
import { CultureDetailScreen } from "../screens/CultureDetailScreen";
import { CropsScreen } from "../screens/CropsScreen";
import { CultureRegistrationScreen } from "../screens/CultureRegistrationScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { DetailedForecastScreen } from "../screens/DetailedForecastScreen";
import { HarvestForecastScreen } from "../screens/HarvestForecastScreen";
import { HistoryScreen } from "../screens/HistoryScreen";
import { IrrigationStartedScreen } from "../screens/IrrigationStartedScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { ManualProgrammingScreen } from "../screens/ManualProgrammingScreen";
import { ProgramScreen } from "../screens/ProgramScreen";
import { NotificationsIntroScreen } from "../screens/NotificationsIntroScreen";
import { ProfileScreen } from "../screens/ProfileScreen";

import { SensorConnectionScreen } from "../screens/SensorConnectionScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { SplashScreen } from "../screens/SplashScreen";
import { SupportScreen } from "../screens/SupportScreen";
import { AboutScreen } from "../screens/AboutScreen";
import { WeatherScreen } from "../screens/WeatherScreen";
import { WelcomeSuccessScreen } from "../screens/WelcomeSuccessScreen";

import { WeeklyScheduleScreen } from "../screens/WeeklyScheduleScreen";

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Profile: undefined;
  NotificationsIntro: undefined;
  CultureRegistration: { mode?: "onboarding" | "addParcel" } | undefined;
  CultureDetail: { cultureId?: number; cultureName?: string } | undefined;
  SensorConnection: { mode?: "onboarding" | "addParcel" } | undefined;
  WelcomeSuccess: { heureRecommandee?: string } | undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Program: undefined;
  History: undefined;
  ManualProgramming: undefined;
  DetailedForecast: undefined;
  HarvestForecast: { cultureId?: number } | undefined;
  IrrigationStarted: { isScheduled?: boolean; scheduledLabel?: string; scheduledTimestamp?: number; durationMins?: number; volumeLitres?: number; parcel?: string } | undefined;
  WateringActive: { cultureName?: string } | undefined;
  WeeklySchedule: { cultureId?: number } | undefined;
  Support: undefined;
  About: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Crops: undefined;
  Weather: undefined;
  Alerts: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <BottomTabs {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: "Accueil" }} />
      <Tab.Screen name="Crops" component={CropsScreen} options={{ tabBarLabel: "Cultures" }} />
      <Tab.Screen name="Weather" component={WeatherScreen} options={{ tabBarLabel: "M\u00e9t\u00e9o" }} />
      <Tab.Screen name="Alerts" component={AlertsScreen} options={{ tabBarLabel: "Alertes" }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: "Param\u00e8tres" }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="NotificationsIntro" component={NotificationsIntroScreen} />
      <Stack.Screen name="CultureRegistration" component={CultureRegistrationScreen} />
      <Stack.Screen name="CultureDetail" component={CultureDetailScreen} />
      <Stack.Screen name="SensorConnection" component={SensorConnectionScreen} />
      <Stack.Screen name="WelcomeSuccess" component={WelcomeSuccessScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
      
      <Stack.Screen name="Program" component={ProgramScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="ManualProgramming" component={ManualProgrammingScreen} />
      <Stack.Screen name="DetailedForecast" component={DetailedForecastScreen} />
      <Stack.Screen name="HarvestForecast" component={HarvestForecastScreen} />
      <Stack.Screen name="IrrigationStarted" component={IrrigationStartedScreen} />
      
      <Stack.Screen name="WeeklySchedule" component={WeeklyScheduleScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
    </Stack.Navigator>
  );
}
