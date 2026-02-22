#!/usr/bin/env bash
set -euo pipefail

echo "== AppCoran Local Stack =="
echo "1) Redis"
./scripts/start-redis.sh

echo "2) Backend API"
nohup npm run start > ./tmp-api.log 2>&1 &
echo "API PID: $!"

echo "3) Worker"
nohup npm run start:worker > ./tmp-worker.log 2>&1 &
echo "Worker PID: $!"

echo "Logs:"
echo "  API   -> tail -f ./tmp-api.log"
echo "  Worker-> tail -f ./tmp-worker.log"
