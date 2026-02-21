# Sécurité & Production — Backend (guide débutant)

Ce guide explique **quoi faire**, **pourquoi**, **comment**, et **le résultat attendu**.

## 1) Pourquoi la sécurité est importante ?
Le backend contient :
- des comptes admin
- des fichiers audio
- des données utilisateurs

Si la sécurité est faible, on peut :
- voler des données
- modifier ou supprimer des récitations

## 2) Mots simples à connaître
- **JWT** : “ticket” de connexion sécurisé.
- **CORS** : règle qui dit quels sites peuvent appeler l’API.
- **Rate limit** : limite le nombre de requêtes pour éviter les attaques.
- **HTTPS** : connexion sécurisée (cadenas).

## 3) Réglages essentiels en production
Dans `.env.production.example`, remplir :
- `JWT_SECRET` et `REFRESH_TOKEN_SECRET`
- `CORS_ORIGIN=https://appcoran.com`
- `AUTO_MIGRATE=false`
- `AUTO_SEED=false`

**Résultat attendu :** un serveur stable, sécurisé, sans surprises.

## 4) Upload audio sécurisé
Le serveur :
- accepte seulement des fichiers audio
- limite la taille d’upload
- refuse les formats dangereux

**Résultat attendu :** pas de fichiers invalides ou dangereux.

## 5) Comptes et rôles
Les routes sensibles sont protégées par des rôles :
- `admin`
- `super-admin`

**Pourquoi ?**
Seuls les utilisateurs autorisés peuvent modifier les données.

## 6) Déploiement sécurisé (résumé)
1) Utiliser HTTPS (Caddy/Nginx/Cloudflare)
2) Ne jamais exposer les mots de passe en dur
3) Sauvegarder la base de données
4) Surveiller les logs

## 7) Résultat attendu
- Le backend résiste aux attaques simples
- Les accès sensibles sont protégés
- Les données restent intactes
