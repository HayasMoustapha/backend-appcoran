# Déploiement VPS (Ubuntu 22.04) — Backend AppCoran

Ce guide explique **pas à pas** comment déployer le backend sur un VPS.
Il est écrit pour **débutants**, avec le **pourquoi**, le **comment** et le **résultat attendu**.

## 1) Ce que ce guide met en place
- **Node.js en production**
- **PM2** (gestion du process + redémarrage auto)
- **PostgreSQL** (local ou managé)
- **Sécurité de base** (UFW, SSH key only, fail2ban)

## 2) Pré‑requis
- Ubuntu 22.04
- Un utilisateur non‑root (ex: `deploy`)
- Le domaine `api.appcoran.com` pointé vers l’IP du VPS

## 3) Installer Node.js LTS et PM2
Pourquoi : garantir stabilité et performance en prod.

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm i -g pm2
```

**Résultat attendu :** `node -v` et `pm2 -v` fonctionnent.

## 4) Préparer le backend
```bash
sudo mkdir -p /var/www/appcoran
sudo chown -R $USER:$USER /var/www/appcoran
cd /var/www/appcoran
git clone <URL_BACKEND> backend
cd backend
cp .env.production.example .env.production
```

**Dans `.env.production`**, renseigne :
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`
- `CORS_ORIGIN=https://appcoran.com`
- `PUBLIC_APP_URL=https://appcoran.com`

**Résultat attendu :** toutes les variables critiques sont définies.

## 5) Lancer le backend via PM2
Le fichier PM2 est déjà prêt :
`backend-appcoran/deploy/vps/ecosystem.config.cjs`.

```bash
cd /var/www/appcoran/backend
npm ci --omit=dev
mkdir -p logs
pm2 start deploy/vps/ecosystem.config.cjs
pm2 save
pm2 startup
```

**Résultat attendu :**
- `pm2 status` montre `appcoran-backend` en ligne.
- `curl -i http://127.0.0.1:4000/health` renvoie `{"status":"ok"}`.

## 6) Sécurité VPS (recommandé)
### UFW
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### Fail2ban
```bash
sudo apt-get install -y fail2ban
sudo systemctl enable --now fail2ban
```

**Résultat attendu :** firewall actif + protection anti‑bruteforce.

## 7) Check rapide
```bash
pm2 logs appcoran-backend
curl -i http://127.0.0.1:4000/health
```

## 8) Dépannage
- **503** : backend down → `pm2 status`.
- **CORS** : vérifier `CORS_ORIGIN`.
- **DB** : vérifier `DB_HOST`/`DB_PASSWORD` et accès réseau.
