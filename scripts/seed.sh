#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
FORCE_FLAG="${2:-}"
SEED_TOKEN_VALUE="${SEED_TOKEN:-}"

if [ -z "$SEED_TOKEN_VALUE" ]; then
  echo "SEED_TOKEN env var is required."
  echo "Example: SEED_TOKEN=your-token npm run seed:local"
  exit 1
fi

QUERY=""
if [ "$FORCE_FLAG" = "--force" ]; then
  QUERY="?force=true"
fi

curl -sS -X POST \
  -H "x-seed-token: ${SEED_TOKEN_VALUE}" \
  "${BASE_URL}/api/seed${QUERY}"
echo
