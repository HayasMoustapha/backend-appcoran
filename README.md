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

Vérifiez :
```bash
node -v
psql --version
ffmpeg -version
```

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
