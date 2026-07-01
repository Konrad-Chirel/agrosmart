# AgroSmart Backend Laravel

Backend REST JSON de l'application mobile React Native AgroSmart. Il reçoit les mesures ESP32 via MQTT, sauvegarde les données dans SQLite (dev) ou PostgreSQL (prod), consulte la base agronomique, calcule les décisions d'arrosage, pilote la pompe et envoie des notifications Firebase Cloud Messaging.

## Prérequis

- PHP 8.2 ou plus
- Composer
- SQLite (dev local) ou PostgreSQL 14+ (production)
- Mosquitto MQTT Broker (quand les capteurs ESP32 sont branchés)
- Une clé OpenWeatherMap
- Une clé serveur Firebase Cloud Messaging (optionnel)

## Installation rapide

```bash
cd backend
composer setup
```

Cette commande crée `.env`, le fichier SQLite, lance les migrations et seed la base agronomique FAO/INRAB.

Configurer ensuite `.env` :

```env
DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite

MQTT_HOST=127.0.0.1
MQTT_PORT=1883

OPENWEATHER_API_KEY=votre_cle
FIREBASE_SERVER_KEY=

RESERVOIR_CAPACITE_LITRES=1000
```

## Lancer le backend complet (capteurs IoT)

Quand Mosquitto et les ESP32 sont branchés, lancer **4 processus** :

```bash
composer dev
```

Ou manuellement dans 4 terminaux :

```bash
php artisan serve
php artisan queue:listen
php artisan schedule:work
php artisan mqtt:listen
```

| Processus | Rôle |
|-----------|------|
| `serve` | API REST pour l'app mobile |
| `queue:listen` | Jobs d'analyse capteurs, arrêt pompe, arrosages programmés |
| `schedule:work` | Analyse périodique, météo, exécution des arrosages |
| `mqtt:listen` | Réception des mesures ESP32 sur `champ/capteurs` |

## Mosquitto et ESP32

Le backend écoute les mesures sur :

```text
champ/capteurs
```

Payload ESP32 attendu :

```json
{
  "champ_id": 1,
  "humidite": 45.2,
  "vent": 18.5,
  "luminosite": 75000,
  "niveau_reservoir": 72.5
}
```

Le champ `niveau_reservoir` est optionnel (0-100 %).

La pompe reçoit les commandes sur :

```text
champ/pompe
```

Payload ON :

```json
{"champ_id":1,"action":"ON","duree_minutes":30}
```

Payload OFF :

```json
{"champ_id":1,"action":"OFF"}
```

## Tester sans matériel ESP32

Après avoir créé une parcelle (id = 1 par exemple) :

```bash
php artisan agrosmart:simuler-lecture 1 --humidite=22 --vent=15 --luminosite=70000
```

La lecture est enregistrée et l'analyse d'arrosage est déclenchée via la queue.

## Scheduler

Taches programmees :

- analyse capteurs toutes les 5 minutes
- execution des arrosages programmes toutes les heures
- rafraichissement meteo toutes les 30 minutes

## API React Native

Prefixe : `/api/v1`

Toutes les reponses suivent :

```json
{
  "success": true,
  "message": "Description",
  "data": {}
}
```

### Authentification

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`

### Parcelles

- `GET /api/v1/parcelles`
- `POST /api/v1/parcelles`
- `GET /api/v1/parcelles/{id}`
- `DELETE /api/v1/parcelles/{id}`

### Cultures

- `POST /api/v1/cultures`
- `GET /api/v1/cultures/{id}`
- `GET /api/v1/cultures/{id}/programme`

### Dashboard

- `GET /api/v1/parcelles/{id}/dashboard`

Retourne en un seul appel : parcelle, culture active, stade agronomique, besoin du jour, derniere lecture ESP32, decision, meteo, reservoir, alertes et prochain arrosage.

### Capteurs

- `GET /api/v1/parcelles/{id}/capteurs?periode=7`
- `GET /api/v1/parcelles/{id}/capteurs?periode=30`

### Pompe

- `POST /api/v1/pompe/demarrer`
- `POST /api/v1/pompe/arreter`
- `GET /api/v1/pompe/{parcelle_id}/statut`

### Alertes

- `GET /api/v1/alertes`
- `PATCH /api/v1/alertes/{id}/lue`

### Meteo

- `GET /api/v1/meteo/{parcelle_id}`

### Base agronomique

- `GET /api/v1/agronomie/cultures`
- `GET /api/v1/agronomie/{culture}/stades`

## Moteur de decision

`MoteurArrosageService` croise :

- humidite sol, vent, luminosite
- culture active et semaine de croissance
- besoin hydrique FAO/INRAB
- arrosages deja effectues aujourd'hui
- pluie detectee ou prevue
- chaleur et vent prevus

Il cree une ligne dans `decisions_arrosage` par nouvelle lecture capteur (pas a chaque consultation du dashboard).
