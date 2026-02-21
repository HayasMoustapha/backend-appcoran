# Audit Sécurité & Production (Backend)

## 1) Correctifs appliqués
- **Rate‑limiting Auth** (login/register) pour limiter bruteforce.
- **Filtrage des uploads** (audio/video uniquement).
- **Super‑admin** via variables d’environnement (plus de credentials en dur).
- **Docker durci** (utilisateur non‑root, healthcheck).

## 2) Variables de production
Utiliser `.env.production.example` comme base.

Essentielles:
- `JWT_SECRET`, `REFRESH_TOKEN_SECRET`
- `CORS_ORIGIN=https://appcoran.com`
- `AUTO_MIGRATE=false`, `AUTO_SEED=false`

## 3) Rôles
Routes admin protégées par:
- `admin`
- `super-admin`

Ajouter un rôle supplémentaire = modifier `requireRole()`.

## 4) Déploiement
1. Build image
```bash
docker build -t appcoran-backend .
```
2. Lancer avec `.env.production`
3. Vérifier `/health`

## 5) Recommandations
- Ajouter un **WAF** (Cloudflare ou Caddy)
- Activer **logs centralisés**
- Ajouter un **queue manager** si volume d’audio élevé
