# Livrables — Projet Application Web de Lectures Coraniques

Ce document résume **ce qui est livré** et explique simplement l’architecture.

---

## 1) Rôles (qui fait quoi)
- **Imam (admin)** : enregistre, publie, modifie les récitations.
- **Fidèle (public)** : écoute, télécharge, partage.

---

## 2) Fonctionnalités livrées (en mots simples)
- Connexion admin sécurisée
- Upload et enregistrement audio
- Ajout automatique de la basmala
- Lecture en streaming
- Téléchargement audio
- Statistiques d’écoute et de téléchargement
- Profil imam
- Dashboard admin

---

## 3) Architecture générale (simple)
```
Navigateur (Frontend)
        |
        v
     API Backend (Express)
        |
   ┌────┴─────┐
   v          v
PostgreSQL   Fichiers audio (uploads)
        |
        v
     FFmpeg (traitement audio)
```

**Résultat attendu :** chaque partie a une mission claire.

---

## 4) Modèle de données (simplifié)
- **users** : comptes admin
- **audios** : récitations publiées
- **audio_stats** : statistiques d’écoute/téléchargement
- **imam_profile** : informations du profil imam

---

## 5) Exemple simple de scénario
### Ajouter une récitation avec basmala
1) L’imam remplit le formulaire sur le frontend.
2) Le backend reçoit l’audio.
3) FFmpeg fusionne la basmala + l’audio.
4) Le fichier final est stocké.
5) La récitation apparaît sur la page d’accueil.

---

## 6) Stack technique réellement utilisée
- **Frontend** : Vite + React + MUI
- **Backend** : Node.js + Express
- **DB** : PostgreSQL
- **Audio** : FFmpeg CLI
- **Déploiement** : Docker + Caddy

---

## 7) Résultat attendu
- Application fonctionnelle
- Interface moderne
- Audio stable et fluide
- Admin sécurisé

---

## 8) Où trouver les guides complets ?
- Frontend : `frontend-appcoran/README.md`
- Backend : `backend-appcoran/README.md`
- Mobile : `frontend-appcoran/DEPLOYMENT_MOBILE.md`
- Production : `frontend-appcoran/deploy/production/README.md`
