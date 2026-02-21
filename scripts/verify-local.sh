#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKEND_DIR="${ROOT_DIR}"
FRONTEND_DIR="$(cd "${SCRIPT_DIR}/../../frontend-appcoran" && pwd)"

LOG_FILE="/tmp/appcoran-backend.log"
AUTH_FILE="/tmp/appcoran-auth.json"
UPLOAD_FILE="/tmp/appcoran-upload.json"
SURAH_FILE="/tmp/appcoran-surah.json"

BACK_PID=""

cleanup() {
  if [[ -n "${BACK_PID}" ]]; then
    kill "${BACK_PID}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

echo "==> 1) Checking PostgreSQL connectivity"
PGPASSWORD="${DB_PASSWORD:-postgres}" psql -h "${DB_HOST:-127.0.0.1}" -U "${DB_USER:-postgres}" -d "${DB_NAME:-appcoran}" -c "select 1;" >/dev/null
echo "OK: PostgreSQL reachable"

echo "==> 2) Ensuring backend is running"
if ss -lntp | grep -q ":4000"; then
  echo "OK: Backend already running on :4000"
else
  echo "Starting backend (production mode)..."
  (cd "${BACKEND_DIR}" && HOST=0.0.0.0 NODE_ENV=production npm run start >"${LOG_FILE}" 2>&1 &)
  BACK_PID=$!
  for i in {1..20}; do
    if curl -s http://localhost:4000/health >/dev/null; then
      echo "OK: Backend healthy"
      break
    fi
    sleep 0.5
    if [[ $i -eq 20 ]]; then
      echo "ERROR: Backend did not become healthy" >&2
      echo "Logs: ${LOG_FILE}" >&2
      tail -n 100 "${LOG_FILE}" >&2 || true
      exit 1
    fi
  done
fi

echo "==> 3) Fetching surah reference (for canonical name)"
curl -s http://localhost:4000/api/surah-reference > "${SURAH_FILE}"
SURAH_NUMBER=80
SURAH_NAME=$(python3 - <<'PY'
import json
surah_number=80
with open("/tmp/appcoran-surah.json","r") as f:
  data=json.load(f)
for s in data:
  if s.get("number")==surah_number:
    print(s.get("name_phonetic") or s.get("name_fr") or s.get("name_local") or s.get("name_ar") or "Abassa")
    break
else:
  print("Abassa")
PY
)
echo "OK: Surah ${SURAH_NUMBER} => ${SURAH_NAME}"

echo "==> 4) Getting admin token"
cat > /tmp/appcoran-login.json <<'JSON'
{"email":"imam@example.com","password":"ChangeMe123!"}
JSON
curl -s http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d @/tmp/appcoran-login.json > "${AUTH_FILE}"
TOKEN=$(python3 - <<'PY'
import json
print(json.load(open("/tmp/appcoran-auth.json"))["token"])
PY
)
echo "OK: token acquired"

echo "==> 5) Upload test audio"
TEST_FILE="${BACKEND_DIR}/assets/audios/Sourate Abassa.mp4"
if [[ ! -f "${TEST_FILE}" ]]; then
  echo "ERROR: Test file not found: ${TEST_FILE}" >&2
  exit 1
fi

UPLOAD_TITLE="Test Upload Abassa $(date +%s)"
HTTP_CODE=$(curl -s -o "${UPLOAD_FILE}" -w "%{http_code}" \
  -X POST http://localhost:4000/api/audios \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "file=@${TEST_FILE}" \
  -F "title=${UPLOAD_TITLE}" \
  -F "sourate=${SURAH_NAME}" \
  -F "numeroSourate=${SURAH_NUMBER}" \
  -F "versetStart=1" \
  -F "versetEnd=42" \
  -F "description=Upload test")

if [[ "${HTTP_CODE}" != "201" ]]; then
  echo "ERROR: Upload failed (HTTP ${HTTP_CODE})" >&2
  cat "${UPLOAD_FILE}" >&2 || true
  exit 1
fi
echo "OK: Upload completed"

AUDIO_ID=$(python3 - <<'PY'
import json
payload=json.load(open("/tmp/appcoran-upload.json"))
if isinstance(payload, dict) and "data" in payload and isinstance(payload["data"], dict):
    print(payload["data"].get("id"))
else:
    print(payload.get("id"))
PY
)
echo "OK: Audio ID ${AUDIO_ID}"

echo "==> 6) Stream check"
curl -s -I "http://localhost:4000/api/audios/${AUDIO_ID}/stream" | head -n 5

echo "==> 7) Running backend tests"
(cd "${BACKEND_DIR}" && npm run test)

echo "==> 8) Running frontend tests"
(cd "${FRONTEND_DIR}" && npm run test)

echo "==> Done."
