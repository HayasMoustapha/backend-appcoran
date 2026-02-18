# Swagger визу — AppCoran API

## Objectif
Fournir une documentation visuelle claire et testable de l’API via Swagger UI, avec exemples prêts à l’emploi.

## Accès
Une fois le serveur démarré :

- Swagger UI : `http://localhost:4000/api/docs`
- Health check : `http://localhost:4000/health`
- FFmpeg check : `http://localhost:4000/health/ffmpeg`

## Authentification
Les routes protégées utilisent un JWT (Bearer).

1. `POST /api/auth/login`
2. Récupère le champ `token`
3. Dans Swagger UI, clique sur **Authorize** et colle :

```
Bearer <votre_token>
```

## Exemples rapides

### Créer un audio (multipart/form-data)
- `file`: un fichier audio (mp3, mp4, ogg...)
- `title`: string
- `sourate`: string
- `numeroSourate`: integer
- `addBasmala`: boolean (true/false)

### Partage public
- `POST /public/audios/{slug}/share`

### Profil public pour frontend
- `GET /public/profile`

## Conseils de test
- Utilise le bouton **Try it out** dans Swagger UI
- Vérifie les réponses HTTP attendues (200/201)
- Les routes publiques ne nécessitent pas de token

## Notes
- FFmpeg/FFprobe doivent être installés si `FFMPEG_REQUIRED=true`
- Les fichiers uploadés sont stockés dans `uploads/`
