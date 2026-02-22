#!/usr/bin/env bash
set -euo pipefail

REDIS_URL="${REDIS_URL:-redis://localhost:6379}"
WORKER_HEALTH_URL="${WORKER_HEALTH_URL:-http://localhost:4010/health}"
API_HEALTH_URL="${API_HEALTH_URL:-http://localhost:4000/health}"
QUEUE_PREFIX="${AUDIO_QUEUE_PREFIX:-appcoran}"

echo "== AppCoran Queue Diagnostic =="
echo "Redis URL: ${REDIS_URL}"
echo "Queue prefix: ${QUEUE_PREFIX}"
echo

echo "-- API health --"
if command -v curl >/dev/null 2>&1; then
  curl -sSf "${API_HEALTH_URL}" || echo "API health check failed (${API_HEALTH_URL})"
else
  echo "curl not found; skip API health"
fi
echo

echo "-- Worker health --"
if command -v curl >/dev/null 2>&1; then
  curl -sSf "${WORKER_HEALTH_URL}" || echo "Worker health check failed (${WORKER_HEALTH_URL})"
else
  echo "curl not found; skip worker health"
fi
echo

if ! command -v redis-cli >/dev/null 2>&1; then
  echo "redis-cli not found; skip Redis queue inspection"
  exit 0
fi

redis_host="$(echo "${REDIS_URL}" | sed -E 's#redis://([^:/]+).*#\1#')"
redis_port="$(echo "${REDIS_URL}" | sed -E 's#redis://[^:/]+:([0-9]+).*#\1#')"
if [[ "${redis_port}" == "${REDIS_URL}" ]]; then
  redis_port="6379"
fi

echo "-- Redis connectivity --"
redis-cli -h "${redis_host}" -p "${redis_port}" ping
echo

queue="audio-processing"

echo "-- Queue lengths (${QUEUE_PREFIX}:${queue}) --"
redis-cli -h "${redis_host}" -p "${redis_port}" LLEN "${QUEUE_PREFIX}:${queue}:wait"
redis-cli -h "${redis_host}" -p "${redis_port}" LLEN "${QUEUE_PREFIX}:${queue}:active"
redis-cli -h "${redis_host}" -p "${redis_port}" LLEN "${QUEUE_PREFIX}:${queue}:failed"
redis-cli -h "${redis_host}" -p "${redis_port}" LLEN "${QUEUE_PREFIX}:${queue}:delayed"
echo

echo "-- Active job IDs --"
redis-cli -h "${redis_host}" -p "${redis_port}" LRANGE "${QUEUE_PREFIX}:${queue}:active" 0 -1
echo

echo "Done."
