#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/appcoran/backend"
SERVICE_NAME="appcoran-backend"

echo "==> Préparation du backend (${APP_DIR})"

if [ ! -d "$APP_DIR" ]; then
  echo "Erreur: ${APP_DIR} introuvable. Clone d'abord le repo backend."
  exit 1
fi

cd "$APP_DIR"

if [ ! -f ".env.production" ]; then
  echo "Erreur: .env.production manquant."
  echo "Copie backend-appcoran/.env.production.example vers .env.production et remplis les variables."
  exit 1
fi

echo "==> Installation des dépendances"
npm ci --omit=dev

echo "==> Vérification des dossiers logs"
mkdir -p logs

echo "==> Démarrage via PM2"
pm2 start deploy/vps/ecosystem.config.cjs --only "$SERVICE_NAME"
pm2 save

echo "==> Backend lancé."
echo "Test rapide: curl -i http://127.0.0.1:4000/health"
