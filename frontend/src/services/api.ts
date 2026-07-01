import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Platform } from "react-native";
import Constants from "expo-constants";

// Extract the computer's local IP address dynamically provided by Expo
const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost ? debuggerHost.split(":")[0] : "127.0.0.1";

const LAN_BASE_URL = `http://${localhost}:8000/api/v1`;

const isRemoteWeb = Platform.OS === "web" && typeof window !== "undefined" && window.location?.hostname !== "localhost";

const DEFAULT_BASE_URL = Platform.OS !== "web"
  ? LAN_BASE_URL
  : isRemoteWeb
    ? LAN_BASE_URL
    : "http://localhost:8000/api/v1";

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_BASE_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error("API Error: ", error?.message, error?.response?.status, error?.response?.data);
    if (error?.response?.status === 401) {
      await AsyncStorage.multiRemove(["auth_token", "current_parcelle_id", "current_culture_id"]);
    }

    return Promise.reject(error);
  },
);
