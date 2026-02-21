# Rapport Technique – Audit & Stabilisation (AppCoran)

Date: 2026-02-21  
Portée: frontend + backend  
Contexte: application de lecture/enregistrement audio (Quran recitations).

## 1) Résumé Exécutif
L’application a été stabilisée sur les points critiques qui impactaient l’usage réel: proxy local, disponibilité des données, enregistrement audio multi‑navigateurs, compatibilité de formats, et comportements sur mobile.  
Les corrections visent la robustesse (API et fichiers audio), la compatibilité (formats/mime types), l’UX (responsive) et la fiabilité (moins d’erreurs intermittentes).

## 2) Problèmes Identifiés et Corrections

### 2.1 Upload audio limité / erreurs MIME
**Symptôme**: certains fichiers (mobile, Safari) arrivent en `application/octet-stream` et échouent.  
**Correctif**:
- Validation stricte **mimetype + extension**.
- Extensions prises en charge: `.mp3 .ogg .wav .m4a .mp4 .aac .flac .webm .weba`.

**Fichier**: `backend-appcoran/src/modules/audio/audio.routes.js`

### 2.2 Enregistrement audio non supporté (navigateurs)
**Symptôme**: MediaRecorder indisponible ou mauvais codec par défaut.  
**Correctif**:
- Détection du **mimeType supporté** par navigateur.
- Extension de fichier cohérente avec le codec.
- Fallback propre si MediaRecorder indisponible.

**Fichier**: `frontend-appcoran/src/app/pages/RecordPage.tsx`

### 2.3 Lecture audio échoue (format non supporté)
**Symptôme**: “Format non supporté” sur PC pour certains fichiers.  
**Correctif**:
- Extension des formats “streamables”.
- Content‑Type audio correct envoyé par le serveur.
- Conversion MP3 déjà en place utilisée si nécessaire.

**Fichier**: `backend-appcoran/src/modules/audio/audio.service.js`

### 2.4 Données qui “disparaissent” / chargement instable
**Symptôme**: données front absentes ou incomplètes (imam/recitations/sourates).  
**Cause**: Service Worker cache des appels API.  
**Correctif**:
- Désactivation explicite du cache SW pour `/api` et `/public`.
- Retry côté fetch GET sur erreurs 5xx.

**Fichiers**:
- `frontend-appcoran/public/sw.js`
- `frontend-appcoran/dist/sw.js`
- `frontend-appcoran/src/app/api/client.ts`

### 2.5 URLs publiques invalides
**Symptôme**: `/api/public/...` ou “Route not found” sur mobile.  
**Cause**: `PUBLIC_BASE_URL` pointait vers `/api`.  
**Correctif**:
- `PUBLIC_BASE_URL` basé sur `window.location.origin`.
- Correction des URLs `recent/popular`.

**Fichiers**:
- `frontend-appcoran/src/app/api/client.ts`
- `frontend-appcoran/src/app/pages/HomePage.tsx`
- `frontend-appcoran/.env`
- `frontend-appcoran/.env.production.example`

### 2.6 Responsive sur mobile (Profil)
**Symptôme**: boutons "Enregistrer/Annuler" dépassent l’écran.  
**Correctif**:
- Flex responsive, boutons full‑width sur mobile.

**Fichier**: `frontend-appcoran/src/app/pages/ImamProfilePage.tsx`

## 3) État de Compatibilité
- Navigateurs: Chrome, Firefox, Edge, Safari (MediaRecorder + fallback).
- OS: iOS, Android, Windows, macOS, Linux.
- Formats audio: mp3, ogg, wav, m4a, mp4, aac, flac, webm.

## 4) Sécurité & Robustesse
- Validation stricte du type audio côté backend (415 si non supporté).
- Gestion d’erreurs homogène via middleware.
- Flux audio en Range + Content-Type correct.

## 5) Recommandations (Prochaines étapes)
1. Ajouter des tests E2E pour l’upload audio multi‑formats (mobile/web).
2. CI/CD léger (lint + tests + build).
3. Monitoring simple (logs + alertes).
4. (Optionnel) file integrity check (hash MD5) pour uploads.

## 6) Checklist Déploiement Local (Production)
1. `npm run build` côté frontend.  
2. Lancer Caddy local prod avec `Caddyfile.local.prod`.  
3. Backend `npm run dev` (ou `npm run start`).  
4. Vérifier:
   - `curl http://localhost/api/health`
   - `curl http://localhost/api/audios`
   - `curl http://localhost/api/surah-reference`

## 7) Notes
Ce rapport reflète les corrections livrées dans le codebase actuel.  
Si tu souhaites un **audit complet automatisé** (tests unitaires + intégration + E2E), il faut valider l’exécution des tests dans ce projet.
