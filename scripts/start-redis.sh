#!/usr/bin/env bash
set -euo pipefail

if ! command -v redis-server >/dev/null 2>&1; then
  echo "redis-server non trouvé. Installe Redis avant de lancer ce script."
  echo "Ubuntu: sudo apt-get update && sudo apt-get install -y redis-server"
  exit 1
fi

if command -v systemctl >/dev/null 2>&1; then
  echo "Démarrage Redis via systemd..."
  sudo systemctl start redis-server
  sudo systemctl enable redis-server
else
  echo "systemctl non disponible. Démarrage Redis en mode manuel..."
  redis-server --daemonize yes
fi

echo "Vérification..."
redis-cli ping
