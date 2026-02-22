#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="/var/www/appcoran/app-coran"
UNIT_DIR="/etc/systemd/system"

if [[ ! -d "${APP_ROOT}" ]]; then
  echo "App root not found: ${APP_ROOT}"
  echo "Clone the repo into ${APP_ROOT} first."
  exit 1
fi

sudo cp "${APP_ROOT}/backend-appcoran/deploy/vps/appcoran-api.service" "${UNIT_DIR}/appcoran-api.service"
sudo cp "${APP_ROOT}/backend-appcoran/deploy/vps/appcoran-worker.service" "${UNIT_DIR}/appcoran-worker.service"

sudo systemctl daemon-reload
sudo systemctl enable appcoran-api
sudo systemctl enable appcoran-worker
sudo systemctl restart appcoran-api
sudo systemctl restart appcoran-worker

echo "Systemd services installed."
sudo systemctl status appcoran-api --no-pager || true
sudo systemctl status appcoran-worker --no-pager || true
