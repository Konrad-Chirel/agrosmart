# 🚀 Guide d'Installation d'AgroSmart

Ce guide vous explique étape par étape comment installer et faire tourner le projet **AgroSmart** (Backend Laravel, Frontend React Native, et Matériel ESP32) sur un tout nouvel ordinateur Windows, Mac ou Linux.

---

## 📦 1. Prérequis (À installer sur le nouveau PC)
Avant de commencer, assurez-vous d'avoir installé les logiciels suivants :
- **[PHP 8.2 ou supérieur](https://windows.php.net/download/)** (indispensable pour Laravel)
- **[Composer](https://getcomposer.org/download/)** (le gestionnaire de paquets de PHP)
- **[Node.js (v18 ou supérieur)](https://nodejs.org/en/download/)** (indispensable pour React Native et Vue/Vite)
- **[Git](https://git-scm.com/downloads)** (Optionnel, mais recommandé pour récupérer le projet)
- **[Arduino IDE](https://www.arduino.cc/en/software)** (Pour la partie matérielle ESP32)

---

## ⚙️ 2. Installation du Serveur (Backend Laravel)

Ouvrez un terminal, placez-vous dans le dossier `backend` de votre projet et tapez les commandes suivantes :

```bash
cd backend

# 1. Installer les dépendances PHP et Node
composer install
npm install

# 2. Créer le fichier de configuration
copy .env.example .env

# 3. Générer la clé de sécurité
php artisan key:generate

# 4. Créer la base de données SQLite (sur Windows)
type nul > database\database.sqlite

# 5. Créer les tables et insérer les fausses données de test
php artisan migrate:fresh --seed
```

> [!TIP]
> **Configuration MQTT** : 
> Ouvrez le fichier `.env` du backend et vérifiez que ces deux lignes sont bien présentes (nous utilisons un broker public pour éviter d'installer Mosquitto) :
> `MQTT_HOST=broker.hivemq.com`
> `MQTT_PORT=1883`

---

## 📱 3. Installation de l'Application Mobile (Frontend React Native)

Ouvrez un DEUXIÈME terminal, placez-vous dans le dossier `frontend` et tapez :

```bash
cd frontend

# 1. Installer les dépendances React Native / Expo
npm install
```

> [!WARNING]
> **Configuration de l'adresse IP** :
> Pour que le téléphone (ou l'émulateur) puisse communiquer avec le serveur, il faut lui donner la bonne adresse IP.
> - Ouvrez le fichier `frontend/src/services/AgrosmartService.ts`
> - Modifiez `BASE_URL` avec l'adresse IP Wi-Fi du nouveau PC (ex: `http://192.168.1.50:8000/api/v1`)

---

## ▶️ 4. Lancer le Projet Complet !

Maintenant que tout est installé, voici comment tout démarrer :

**Dans le terminal du Backend :**
```bash
composer run dev
```
*(Cette commande va lancer le serveur web, la queue de traitement et l'écouteur MQTT simultanément !)*

**Dans le terminal du Frontend :**
```bash
npx expo start -c
```
*(Scannez le QR Code avec l'application Expo Go sur votre téléphone pour lancer l'application)*

---

## 📟 5. Configuration de la Carte ESP32 (Matériel)

Si vous devez brancher l'ESP32 sur le nouveau PC :

1. Ouvrez **Arduino IDE**.
2. Allez dans `Fichier > Préférences` et ajoutez cette URL dans "URL de gestionnaire de cartes supplémentaires" : `https://dl.espressif.com/dl/package_esp32_index.json`
3. Allez dans `Outils > Type de carte > Gestionnaire de cartes`, cherchez **esp32** et installez-le.
4. Allez dans `Croquis > Inclure une bibliothèque > Gérer les bibliothèques` et installez :
   - **PubSubClient** (par Nick O'Leary)
   - **DHT sensor library** (par Adafruit)
5. Ouvrez le fichier `esp32/esp32.ino`, mettez à jour le nom de votre Wi-Fi et téléversez !
