# DigitalOcean Spaces (Object Storage) — Feuille de route

Le code actuel stocke les fichiers audio **en local**.  
Pour utiliser Spaces (S3 compatible), il faut **ajouter** un adaptateur backend.

## Étapes recommandées
1. Ajouter un client S3 (AWS SDK v3)
2. Env variables :
   - `SPACES_KEY`
   - `SPACES_SECRET`
   - `SPACES_ENDPOINT=https://fra1.digitaloceanspaces.com`
   - `SPACES_BUCKET=appcoran`
   - `SPACES_PUBLIC_URL=https://appcoran.fra1.digitaloceanspaces.com`
3. Écrire le fichier dans Spaces au lieu de `/uploads`
4. Stocker dans la DB l’URL publique/signée
5. Activer Range Requests (HTTP 206) pour streaming

## Important
Cette partie **n’est pas encore implémentée** dans le code.  
Elle nécessite une évolution backend.
