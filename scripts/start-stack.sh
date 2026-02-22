#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "== AppCoran Local Stack =="
echo "1) Redis"
cd "${ROOT_DIR}"
./scripts/start-redis.sh

echo "2) Backend API"
nohup HOST=0.0.0.0 NODE_ENV=production npm run start > ./tmp-api.log 2>&1 &
echo "API PID: $!"

echo "3) Worker"
nohup npm run start:worker > ./tmp-worker.log 2>&1 &
echo "Worker PID: $!"

echo "Logs:"
echo "  API   -> tail -f ./tmp-api.log"
echo "  Worker-> tail -f ./tmp-worker.log"
