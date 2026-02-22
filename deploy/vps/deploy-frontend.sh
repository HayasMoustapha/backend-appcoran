#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/appcoran/frontend"
DIST_DIR="${APP_DIR}/dist"

echo "==> Préparation du frontend (${APP_DIR})"

if [ ! -d "$APP_DIR" ]; then
  echo "Erreur: ${APP_DIR} introuvable. Clone d'abord le repo frontend."
  exit 1
fi

cd "$APP_DIR"

if [ ! -f ".env.production" ]; then
  echo "Erreur: .env.production manquant."
  echo "Copie frontend-appcoran/.env.production.example vers .env.production et remplis les variables."
  exit 1
fi

echo "==> Installation des dépendances"
npm ci

echo "==> Build production"
npm run build

if [ ! -d "$DIST_DIR" ]; then
  echo "Erreur: build terminé mais dist introuvable."
  exit 1
fi

echo "==> Frontend prêt dans ${DIST_DIR}"
