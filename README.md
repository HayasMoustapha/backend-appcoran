# AppCoran — Backend (guide très simple)

Ce guide explique comment démarrer le **serveur** qui gère les données (audios, profils, connexion). Il est écrit **pour débutants**.

---

## 1) C’est quoi le backend ?
Le **backend** est le serveur qui :
- reçoit les fichiers audio
- ajoute la basmala si besoin
- stocke les récitations en base de données
- envoie les données au frontend

Sans backend, l’application affiche l’interface **mais aucune donnée**.

---

## 2) Petit glossaire
- **API** : portes d’accès pour lire/écrire des données.
- **Base de données (PostgreSQL)** : stockage des informations.
- **FFmpeg** : outil pour traiter les fichiers audio.
- **JWT** : méthode de connexion sécurisée.
- **.env** : fichier de configuration.

---

## 3) Prérequis (à installer)
- Node.js 18+
- PostgreSQL
- FFmpeg
- Redis (si vous activez la file d’attente audio asynchrone)

Vérifiez :
```bash
node -v
psql --version
ffmpeg -version
```

Si vous utilisez la file d’attente audio (recommandé) :
```bash
redis-cli ping
```
**Résultat attendu :** `PONG`

---

## 4) Installation (première fois)
Depuis `backend-appcoran` :
```bash
npm install
```

---

## 5) Configuration `.env`
Créer le fichier :
```bash
cp .env.example .env
```

Dans `.env`, configurez :
- `DATABASE_URL` ou `DB_HOST`/`DB_USER`/`DB_PASSWORD`
- `JWT_SECRET`
- `CORS_ORIGIN` (ex. : `http://localhost:5173`)
- `PUBLIC_APP_URL` (URL du frontend pour les liens de partage, ex. : `http://localhost:5173`)
- `BASMALA_PATH` (fichier audio basmala)

**Résultat attendu :** le serveur peut se connecter à la base.

---

## 6) Lancer le serveur
```bash
npm run dev
```

**Résultat attendu :**
- `Server listening on http://0.0.0.0:4000`
- `/health` renvoie `{"status":"ok"}`

Tester :
```bash
curl -i http://localhost:4000/health
```

---

## 7) Fonctionnalités principales
- Connexion admin
- Upload audio
- Ajout basmala automatique
- Streaming audio (lecture dans navigateur)
- Téléchargement audio
- Statistiques (écoutes, téléchargements)

**Formats audio supportés (upload/lecture) :**  
`mp3`, `mp4`, `m4a`, `ogg`, `wav`, `flac`, `aac`, `webm`

---

## File d’attente audio (recommandé)
Le traitement audio (FFmpeg + basmala + scan) peut être **asynchrone** pour éviter que l’upload ne bloque.

### Architecture (API + Worker)
- **API** : reçoit l’upload, écrit en base, met en file d’attente.
- **Worker** : consomme la queue BullMQ et traite les fichiers (FFmpeg).

### Activer la queue (mode pro)
1. Installer et démarrer Redis (Ubuntu) :
```bash
sudo apt-get update
sudo apt-get install -y redis-server
sudo systemctl start redis
sudo systemctl enable redis-server
redis-cli ping
```
> Note : selon la distribution, le service peut s’appeler `redis-server` (et non `redis`).

Ou via script :
```bash
./scripts/start-redis.sh
```

### Lancer toute la stack localement (Redis + API + Worker)
```bash
./scripts/start-stack.sh
```
Les logs sont envoyés dans :
- `./tmp-api.log`
- `./tmp-worker.log`


2. Configurer `.env` :
```bash
AUDIO_QUEUE_ENABLED=true
REDIS_URL=redis://localhost:6379
AUDIO_PROCESSING_ASYNC=true
```

3. Lancer l’API **et** le worker :
```bash
npm run start
npm run start:worker
```

**Résultat attendu :**
- upload rapide
- traitement en arrière‑plan
- pas de blocage côté utilisateur

### Diagnostic queue rapide
```bash
REDIS_URL=redis://localhost:6379 \
WORKER_HEALTH_URL=http://localhost:4010/health \
API_HEALTH_URL=http://localhost:4000/health \
./scripts/diagnose-queue.sh
```

### Mode fallback (sans Redis)
Si Redis n’est pas disponible :
```bash
AUDIO_QUEUE_ENABLED=false
AUDIO_PROCESSING_ASYNC=true
```
Le traitement reste asynchrone mais moins robuste en cas de redémarrage serveur.

---

## 8) API (exemples simples)
- `POST /api/auth/login`
- `GET /api/audios`
- `GET /api/audios/:id/stream`

Documentation Swagger : `http://localhost:4000/api/docs`

---

## 9) Docker (optionnel)
```bash
docker compose up --build
```

**Résultat attendu :** backend + base de données démarrés.

**Note importante (build Docker) :**  
Le build installe `bcrypt` en production. Sur les images `node:*-slim`, il faut des outils de compilation.
Si vous voyez une erreur `npm ci --omit=dev` :
- vérifiez que le Dockerfile installe `python3`, `make`, `g++` avant `npm ci`.

---

## 10) Sécurité & Production
Voir : `docs/SECURITY_PRODUCTION_GUIDE.md`

---

## 11) Dépannage rapide
- **Pas de données** : vérifiez la base PostgreSQL.
- **Erreur FFmpeg** : vérifiez que FFmpeg est installé et accessible.
- **CORS** : vérifiez `CORS_ORIGIN`.

---

## 12) Antivirus (ClamAV) – Installation & Configuration

### Installation (Linux)
```bash
sudo apt-get update
sudo apt-get install -y clamav clamav-daemon
sudo systemctl stop clamav-freshclam
sudo freshclam
sudo systemctl start clamav-freshclam
```

### Configuration (.env)
```bash
VIRUS_SCAN_ENABLED=true
VIRUS_SCAN_AUTO=true
VIRUS_SCAN_TOOL=clamscan
VIRUS_SCAN_TIMEOUT_MS=60000
```

### Notes
- `VIRUS_SCAN_ENABLED=true` force le scan (erreur si ClamAV absent).
- `VIRUS_SCAN_AUTO=true` active le scan uniquement si ClamAV est détecté.
- En production, utilisez `clamscan` avec une base à jour.
