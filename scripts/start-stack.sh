#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "== AppCoran Local Stack =="
echo "1) Redis"
cd "${ROOT_DIR}"
./scripts/start-redis.sh

echo "Nettoyage des ports (4000, 4010) si déjà occupés..."
if command -v ss >/dev/null 2>&1; then
  for port in 4000 4010; do
    pid="$(ss -lptn "sport = :${port}" 2>/dev/null | awk -F',' 'NR>1 {print $2}' | awk -F'=' '{print $2}' | head -n 1)"
    if [[ -n "${pid}" ]]; then
      echo "Port ${port} occupé par PID ${pid} → kill"
      kill -9 "${pid}" || true
    fi
  done
fi

echo "2) Backend API"
nohup env HOST=0.0.0.0 NODE_ENV=production LOG_PRETTY=true LOG_LEVEL=info npm run start > ./tmp-api.log 2>&1 &
echo "API PID: $!"

echo "3) Worker"
nohup env NODE_ENV=production LOG_PRETTY=true LOG_LEVEL=info npm run start:worker > ./tmp-worker.log 2>&1 &
echo "Worker PID: $!"

echo "Logs:"
echo "  API   -> tail -f ./tmp-api.log"
echo "  Worker-> tail -f ./tmp-worker.log"
