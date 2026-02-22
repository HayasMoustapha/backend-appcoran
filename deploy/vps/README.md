# Déploiement VPS DigitalOcean (Docker + Nginx + PM2)

Ce guide **prépare un déploiement complet** pour un VPS Ubuntu 22.04.
Il est écrit pour **débutants** et explique le **pourquoi**, le **comment** et le **résultat attendu**.

> Note importante : le frontend actuel est **React + Vite** (pas Next.js).  
> Le design et les animations ne sont **pas modifiés**.

## 1) Ce que ce dossier installe
- Backend **Node.js / Express** avec PM2 (dans un container)
- Worker **BullMQ** (traitement audio asynchrone)
- Frontend **Vite build** servi par Nginx (container)
- Reverse proxy **Nginx** côté VPS + HTTPS (Let’s Encrypt)
- Redis pour la file d’attente audio
- Configuration de sécurité (headers + limites)

## 2) Prérequis
1. VPS Ubuntu 22.04
2. Domaine pointé vers l’IP du VPS :
   - `appcoran.com`
   - `api.appcoran.com`
3. Accès SSH

## 3) Installer Docker + Nginx sur le VPS
```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin nginx libnginx-mod-brotli
sudo systemctl enable --now docker nginx
```

**Résultat attendu :** `docker version` et `nginx -v` fonctionnent.

## 4) Préparer l’environnement
Depuis le serveur :
```bash
sudo mkdir -p /var/www/appcoran
sudo chown -R $USER:$USER /var/www/appcoran
cd /var/www/appcoran
git clone <URL_REPO> app-coran
cd app-coran/deploy/vps
cp .env.vps.example .env.vps
```

Édite `.env.vps` avec tes vraies valeurs (DB, JWT, domaines, etc.).

## 5) Lancer les services Docker
```bash
docker compose -f docker-compose.vps.yml up -d --build
```

**Résultat attendu :**
- Backend écoute sur `127.0.0.1:4000`
- Frontend écoute sur `127.0.0.1:8080`
- Worker audio actif (BullMQ)

## 6) Configurer Nginx (Reverse Proxy)
```bash
sudo cp nginx.appcoran.conf /etc/nginx/sites-available/appcoran.conf
sudo ln -s /etc/nginx/sites-available/appcoran.conf /etc/nginx/sites-enabled/appcoran.conf
sudo nginx -t
sudo systemctl reload nginx
```

## 7) HTTPS (Let’s Encrypt)
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d appcoran.com -d api.appcoran.com
```

**Résultat attendu :** HTTPS actif sur les deux domaines.

## 8) Tests rapides
```bash
curl -i https://api.appcoran.com/health
```

Le frontend doit charger sans erreur CORS.

## 9) Mobile (iOS / Android)
- **HTTPS obligatoire** : sinon MediaRecorder est bloqué.
- L’enregistrement audio requiert une **interaction utilisateur**.

## 10) Object Storage (DigitalOcean Spaces)
Le code actuel **stocke en local**.  
Pour DO Spaces, il faut une adaptation backend (S3 compatible).  
Voir `docs/` pour la feuille de route (à implémenter avant prod).

## 11) CI/CD (plan rapide)
1. Build backend + frontend
2. Push image Docker dans registry
3. Déploiement via `docker compose pull && docker compose up -d`
4. Healthcheck `/health`

## 12) Dépannage
- **502** : backend down → `docker compose ps` + logs
- **CORS** : vérifier `.env.vps`
- **Audio** : vérifier `MAX_UPLOAD_MB` + ffmpeg présent
- **Queue bloquée** : vérifier `redis` + logs du worker

Logs utiles :
```bash
docker compose -f docker-compose.vps.yml logs -f backend
docker compose -f docker-compose.vps.yml logs -f worker
```
