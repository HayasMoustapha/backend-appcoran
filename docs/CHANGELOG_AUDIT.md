# Change Log – Audit & Stabilisation (AppCoran)

## Backend
- Validation stricte des formats audio (mimetype + extension si octet-stream).
- Extensions supportées élargies: mp3, ogg, wav, m4a, mp4, aac, flac, webm.
- Streaming: Content-Type audio correctement servi.

## Frontend
- MediaRecorder: sélection automatique du mimeType supporté par navigateur.
- Extension du fichier enregistré adaptée au codec.
- Upload accept élargi aux formats audio courants.
- URLs publiques corrigées pour `recent/popular`.
- `PUBLIC_BASE_URL` basé sur l’origine du site (évite `/api/public`).
- Boutons Profil mobile responsive (full‑width).
- API fetch plus robuste (retry sur 5xx).
- Service Worker: pas de cache sur `/api` et `/public`.

## Infrastructure locale
- Proxy local prod stabilisé (Caddy).
- Alias `/api/health` ajouté côté backend.
