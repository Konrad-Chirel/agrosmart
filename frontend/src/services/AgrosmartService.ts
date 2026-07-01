import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";

function normalizeCropName(name: string) {
  const value = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");

  if (value.includes("tomate")) return "tomate";
  if (value.includes("piment")) return "piment";
  if (value.includes("oignon")) return "oignon";
  if (value.includes("laitue")) return "laitue";
  if (value.includes("mais") || value.includes("mas")) return "mais";
  if (value.includes("carotte")) return "carotte";
  return "tomate";
}

async function getCurrentParcelleId() {
  const parcelleId = await AsyncStorage.getItem("current_parcelle_id");
  if (!parcelleId) throw new Error("Aucune parcelle configuree");
  return parcelleId;
}

export const AgrosmartService = {
  async registerAndSetup(data: {
    firstName: string;
    city: string;
    phone: string;
    password: string;
    passwordConfirmation: string;
    cropName: string;
    sowingDate: string;
    surface: string;
    surfaceUnit: string;
  }) {
    const phoneNumber = data.phone.startsWith("229") ? data.phone : `229${data.phone}`;
    const surfaceNumber = Number(String(data.surface).replace(",", "."));
    const superficie_m2 = data.surfaceUnit === "ha" ? surfaceNumber * 10000 : surfaceNumber;
    const cropType = normalizeCropName(data.cropName);

    const auth = await api.post("/auth/register", {
      nom: "Utilisateur",
      prenom: data.firstName || "AgroSmart",
      telephone: phoneNumber,
      region: data.city || "Parakou",
      date_naissance: "01/01/1990",
      langue: "fr",
      password: data.password,
      password_confirmation: data.passwordConfirmation,
    });

    const token = auth.data?.data?.token;
    if (!token) throw new Error("Token absent");
    await AsyncStorage.setItem("auth_token", token);
    await AsyncStorage.setItem("user_phone", phoneNumber);

    const parcelle = await api.post("/parcelles", {
      nom_parcelle: "Parcelle principale",
      superficie_m2,
      latitude: 9.3372,
      longitude: 2.6282,
    });

    const parcelleId = parcelle.data?.data?.id;
    if (!parcelleId) throw new Error("Parcelle absente");
    await AsyncStorage.setItem("current_parcelle_id", String(parcelleId));

    const culture = await api.post("/cultures", {
      parcelle_id: parcelleId,
      type_culture: cropType,
      date_semis: data.sowingDate,
    });

    const cultureId = culture.data?.data?.culture?.id || culture.data?.data?.id;
    if (cultureId) {
      await AsyncStorage.setItem("current_culture_id", String(cultureId));
      try {
        const programme = await api.get(`/cultures/${cultureId}/programme`);
        const firstProgram = programme.data?.data?.[0];
        if (firstProgram?.heure_recommandee) {
          return { success: true, heureRecommandee: firstProgram.heure_recommandee.slice(0, 5).replace(':', 'h') };
        }
      } catch (e) {
        console.log("Could not fetch program for initial setup");
      }
    }

    return { success: true, heureRecommandee: "06h30" };
  },

  async login(telephone: string, password: string) {
    const phoneNumber = telephone.startsWith("229") ? telephone : `229${telephone}`;
    const auth = await api.post("/auth/login", {
      telephone: phoneNumber,
      password,
    });

    const token = auth.data?.data?.token;
    if (!token) throw new Error("Token absent");
    await AsyncStorage.setItem("auth_token", token);
    await AsyncStorage.setItem("user_phone", phoneNumber);

    try {
      // Refresh user's parcelle and culture to setup local storage
      const parcelles = await api.get("/parcelles");
      const firstParcelle = parcelles.data?.data?.[0];
      if (firstParcelle) {
        await AsyncStorage.setItem("current_parcelle_id", String(firstParcelle.id));
        const cultures = await api.get("/cultures");
        const firstCulture = cultures.data?.data?.[0];
        if (firstCulture) {
          await AsyncStorage.setItem("current_culture_id", String(firstCulture.id));
        }
      }
    } catch (e) {
      console.log("Could not load initial data on login", e);
    }

    return true;
  },

  async getProfile() {
    const res = await api.get("/auth/profile");
    return res.data?.data;
  },

  async updateProfile(data: { prenom?: string; nom?: string; telephone?: string; region?: string; password?: string }) {
    const res = await api.put("/auth/profile", data);
    return res.data;
  },

  async logout() {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      console.log("Logout api error", e);
    }
    await AsyncStorage.removeItem("auth_token");
    await AsyncStorage.removeItem("current_parcelle_id");
    await AsyncStorage.removeItem("current_culture_id");
    // We intentionally DO NOT remove "user_phone" so it can be pre-filled
  },

  async addCulture(data: {
    cropName: string;
    sowingDate: string;
    surface: string;
    surfaceUnit: string;
  }) {
    const surfaceNumber = Number(String(data.surface).replace(",", "."));
    const superficie_m2 = data.surfaceUnit === "ha" ? surfaceNumber * 10000 : surfaceNumber;
    const cropType = normalizeCropName(data.cropName);

    // 1. Créer une nouvelle parcelle pour cette culture
    const parcelle = await api.post("/parcelles", {
      nom_parcelle: `Parcelle ${Date.now().toString().slice(-4)}`,
      superficie_m2,
      latitude: 9.3372,
      longitude: 2.6282,
    });

    const parcelleId = parcelle.data?.data?.id;
    if (!parcelleId) throw new Error("Parcelle absente");

    // 2. Ajouter la culture sur cette nouvelle parcelle
    const culture = await api.post("/cultures", {
      parcelle_id: parcelleId,
      type_culture: cropType,
      date_semis: data.sowingDate,
    });

    const cultureId = culture.data?.data?.culture?.id || culture.data?.data?.id;
    if (cultureId) await AsyncStorage.setItem("current_culture_id", String(cultureId));

    return true;
  },

  async getDashboard() {
    const parcelleId = await getCurrentParcelleId();
    const response = await api.get(`/parcelles/${parcelleId}/dashboard`);
    return response.data?.data || response.data;
  },

  async getWeather() {
    const parcelleId = await getCurrentParcelleId();
    const response = await api.get(`/meteo/${parcelleId}`);
    return response.data?.data || response.data;
  },

  async getAlerts() {
    const response = await api.get("/alertes");
    const data = response.data?.data?.data || response.data?.data || [];
    const conseil_expert = response.data?.conseil_expert || "L'arrosage matinal réduit l'évaporation de 30%.";
    return { alertes: data, conseil_expert };
  },

  async getHistorique(parcelleId?: number, filtre?: string) {
    const pid = parcelleId || (await getCurrentParcelleId());
    const params = filtre && filtre !== 'tout' ? { filtre } : {};
    const response = await api.get(`/parcelles/${pid}/historique-arrosages`, { params });
    return response.data.data;
  },

  async getCultures() {
    const response = await api.get("/cultures");
    return response.data?.data || response.data;
  },

  async getCulture(id: number | string) {
    const response = await api.get(`/cultures/${id}`);
    return response.data?.data || response.data;
  },

  async getSensors() {
    const parcelleId = await getCurrentParcelleId();
    const response = await api.get(`/parcelles/${parcelleId}/capteurs`);
    return response.data?.data || response.data;
  },

  async getSensorConnectionStatus() {
    const parcelleId = await getCurrentParcelleId();
    const response = await api.get(`/parcelles/${parcelleId}/capteurs/statut`);
    return response.data?.data || response.data;
  },

  async startSimulationMode() {
    const parcelleId = await getCurrentParcelleId();
    const response = await api.post(`/parcelles/${parcelleId}/capteurs/simulation`);
    return response.data?.data || response.data;
  },

  async getProgram(cultureId?: number) {
    let id = cultureId || Number(await AsyncStorage.getItem("current_culture_id"));
    if (!id) {
      const dashboard = await this.getDashboard();
      id = Number(dashboard?.culture?.id);
      if (id) await AsyncStorage.setItem("current_culture_id", String(id));
    }
    if (!id) throw new Error("Aucune culture configuree");
    const response = await api.get(`/cultures/${id}/programme`);
    return response.data?.data || [];
  },

  async getPumpStatus() {
    const parcelleId = await getCurrentParcelleId();
    const response = await api.get(`/parcelles/${parcelleId}/pompe/statut`);
    return response.data?.data || response.data;
  },

  async checkPumpConditions() {
    const parcelleId = await getCurrentParcelleId();
    const response = await api.post(`/parcelles/${parcelleId}/pompe/verifier`, {});
    return response.data?.data || response.data;
  },

  async startPump(minutes?: number | null, volume?: number) {
    const parcelleId = await getCurrentParcelleId();
    const response = await api.post(`/parcelles/${parcelleId}/pompe/demarrer`, {
      duree_minutes: minutes,
      volume_litres: volume,
    });
    return response.data?.data || response.data;
  },

  async programPump(duree_minutes: number, volume_litres: number, heure_programmee: string) {
    const parcelleId = await getCurrentParcelleId();
    const response = await api.post(`/parcelles/${parcelleId}/pompe/programmer`, {
      duree_minutes,
      volume_litres,
      heure_programmee,
    });
    return response.data;
  },

  async stopPump() {
    const parcelleId = await getCurrentParcelleId();
    const response = await api.post(`/parcelles/${parcelleId}/pompe/arreter`, {});
    return response.data;
  },

  async getActiveProgrammation() {
    const parcelleId = await getCurrentParcelleId();
    const response = await api.get(`/parcelles/${parcelleId}/pompe/programmation-active`);
    return response.data?.data?.decision || null;
  },

  async cancelProgrammation() {
    const parcelleId = await getCurrentParcelleId();
    const response = await api.post(`/parcelles/${parcelleId}/pompe/annuler-programmation`, {});
    return response.data;
  },
};
