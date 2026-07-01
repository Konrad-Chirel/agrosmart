#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

// ========================================================
// 1. VOS PINS ET COMPOSANTS
// ========================================================
#define PIN_DHT22      4
#define PIN_SOL_AOUT   34
#define PIN_LDR        35
#define PIN_RELAIS     27

#define RELAIS_ON      HIGH
#define RELAIS_OFF     LOW

#define DHT_TYPE DHT22
DHT dht(PIN_DHT22, DHT_TYPE);

// ========================================================
// 2. CONFIGURATION RÉSEAU
// ========================================================
const char* ssid = "////_________////";
const char* password = "B40C3280@";

// ========================================================
// 3. CONFIGURATION AGROSMART (MQTT)
// ========================================================
const char* mqtt_server = "broker.emqx.io";
const int mqtt_port = 1883;

const String parcelle_id = "1";
String topic_capteurs = "agrosmart/sensors/" + parcelle_id;
String topic_pompe = "agrosmart/pompes/" + parcelle_id;

WiFiClient espClient;
PubSubClient client(espClient);

unsigned long lastMsg = 0;
const long INTERVALLE_ENVOI = 10000;

bool modeTestTermine = false;

// ========================================================
// SETUP
// ========================================================
void setup() {
  Serial.begin(115200);
  delay(500);

  // Initialisation des capteurs
  dht.begin();
  pinMode(PIN_RELAIS, OUTPUT);
  digitalWrite(PIN_RELAIS, RELAIS_OFF);

  Serial.println("\n====================================");
  Serial.println(" AGROSMART - DEMARRAGE DU SYSTEME ");
  Serial.println("====================================");

  // Lancement du menu de test matériel
  menuTestMateriel();

  // Connexion Wi-Fi après les tests
  setup_wifi();

  // Configuration MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

// ========================================================
// MENU DE TEST MATERIEL (NOUVEAU)
// ========================================================
void menuTestMateriel() {
  Serial.println("\n--- MODE TEST MATERIEL ---");
  Serial.println("Tapez le numero correspondant dans la console :");
  Serial.println("1 : Tester le Relais (Pompe)");
  Serial.println("2 : Tester le capteur de Temperature/Humidite (DHT22)");
  Serial.println("3 : Tester le capteur d'Humidite du Sol");
  Serial.println("4 : Tester le capteur de Lumiere (LDR)");
  Serial.println("5 : TOUT TESTER");
  Serial.println("0 : QUITTER LE TEST ET DEMARRER NORMALEMENT");
  Serial.println("--------------------------");

  while (!modeTestTermine) {
    if (Serial.available() > 0) {
      char choix = Serial.read();
      
      switch (choix) {
        case '1':
          Serial.println("\n-> Test du Relais (clic attendu)...");
          digitalWrite(PIN_RELAIS, RELAIS_ON);
          Serial.println("Relais ON (Pompe allumée). Attente de 3s...");
          delay(3000);
          digitalWrite(PIN_RELAIS, RELAIS_OFF);
          Serial.println("Relais OFF (Pompe éteinte). Test terminé.");
          break;
          
        case '2':
          Serial.println("\n-> Test du DHT22...");
          Serial.print("Temperature : ");
          Serial.print(dht.readTemperature());
          Serial.print(" °C | Humidite Air : ");
          Serial.print(dht.readHumidity());
          Serial.println(" %");
          break;
          
        case '3':
          Serial.println("\n-> Test du Capteur Sol...");
          Serial.print("Valeur brute : ");
          Serial.print(analogRead(PIN_SOL_AOUT));
          Serial.println(" (0 = mouillé, 4095 = sec)");
          break;
          
        case '4':
          Serial.println("\n-> Test de la Lumiere (LDR)...");
          Serial.print("Valeur brute : ");
          Serial.print(analogRead(PIN_LDR));
          Serial.println(" (0 = sombre, 4095 = lumineux)");
          break;

        case '5':
          Serial.println("\n-> Test de tous les capteurs :");
          Serial.print("DHT22 - Temp: "); Serial.print(dht.readTemperature()); Serial.print("°C, Hum: "); Serial.print(dht.readHumidity()); Serial.println("%");
          Serial.print("Sol - Brut: "); Serial.println(analogRead(PIN_SOL_AOUT));
          Serial.print("Lumiere - Brut: "); Serial.println(analogRead(PIN_LDR));
          Serial.println("Test relais ignoré en mode global pour sécurité.");
          break;

        case '0':
          Serial.println("\n-> Fin des tests. Démarrage du programme principal...");
          modeTestTermine = true;
          break;
          
        case '\n':
        case '\r':
          // Ignorer les sauts de ligne
          break;
          
        default:
          Serial.println("\nChoix invalide. Tapez 1, 2, 3, 4, 5 ou 0.");
          break;
      }
      
      if (!modeTestTermine) {
        Serial.println("\nTapez un autre chiffre pour tester, ou 0 pour quitter.");
      }
    }
  }
}

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connexion au Wi-Fi : ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("Wi-Fi connecte !");
  Serial.print("Adresse IP : ");
  Serial.println(WiFi.localIP());
}

// ========================================================
// RECEPTION D'UN ORDRE DEPUIS L'APPLICATION MOBILE
// ========================================================
void callback(char* topic, byte* payload, unsigned int length) {
  String messageTemp;
  for (int i = 0; i < length; i++) {
    messageTemp += (char)payload[i];
  }
  
  Serial.print("Ordre recu du serveur sur [");
  Serial.print(topic);
  Serial.print("] : ");
  Serial.println(messageTemp);

  if (String(topic) == topic_pompe) {
    if(messageTemp.indexOf("demarrer_pompe") != -1) {
      Serial.println("=> ACTION : ALLUMAGE DE LA POMPE !");
      digitalWrite(PIN_RELAIS, RELAIS_ON);
    } 
    else if(messageTemp.indexOf("arreter_pompe") != -1) {
      Serial.println("=> ACTION : EXTINCTION DE LA POMPE !");
      digitalWrite(PIN_RELAIS, RELAIS_OFF);
    }
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Connexion au serveur AgroSmart (MQTT)... ");
    String clientId = "ESP32-AgroSmart-" + String(random(0, 1000));
    
    if (client.connect(clientId.c_str())) {
      Serial.println("Connecte !");
      client.subscribe(topic_pompe.c_str(), 1);
    } else {
      Serial.print("Echec, rc=");
      Serial.print(client.state());
      Serial.println(" (Nouvelle tentative dans 5 secondes)");
      delay(5000);
    }
  }
}

// ========================================================
// BOUCLE PRINCIPALE
// ========================================================
void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  unsigned long now = millis();
  if (now - lastMsg > INTERVALLE_ENVOI) { 
    lastMsg = now;

    float temperature = dht.readTemperature();
    float humidite_air = dht.readHumidity();

    int valSol = analogRead(PIN_SOL_AOUT);
    int pourcentage_sol = map(valSol, 4095, 0, 0, 100);
    pourcentage_sol = constrain(pourcentage_sol, 0, 100);

    int valLdr = analogRead(PIN_LDR);
    int pourcentage_lumiere = map(valLdr, 0, 4095, 0, 100);
    pourcentage_lumiere = constrain(pourcentage_lumiere, 0, 100);

    if (isnan(temperature) || isnan(humidite_air)) {
      Serial.println("Avertissement : Echec de lecture du DHT22.");
      temperature = 0;
      humidite_air = 0;
    }

    String jsonPayload = "{";
    jsonPayload += "\"humidite\":" + String(pourcentage_sol) + ",";
    jsonPayload += "\"temperature\":" + String(temperature, 1) + ",";
    jsonPayload += "\"vent\":" + String(0) + ","; 
    jsonPayload += "\"luminosite\":" + String(pourcentage_lumiere);
    jsonPayload += "}";

    Serial.print("Envoi des mesures : ");
    Serial.println(jsonPayload);
    client.publish(topic_capteurs.c_str(), jsonPayload.c_str());
  }
}
