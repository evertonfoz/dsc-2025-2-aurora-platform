#!/usr/bin/env bash
set -euo pipefail

USAGE="Usage: $0 <ghcr-pat>
Places or updates the GH_PAT entry inside .env.prod so workflows/deploys work on the VPS."

if [ $# -ne 1 ]; then
  echo "$USAGE" >&2
  exit 1
fi

GHCR_PAT="$1"
ENV_FILE=".env.prod"

if [ ! -f "$ENV_FILE" ]; then
  if [ -f ".env.prod.example" ]; then
    echo "$ENV_FILE not found; copying sample."
    cp .env.prod.example "$ENV_FILE"
  else
    echo "$ENV_FILE not found and .env.prod.example missing. Please create the file before running this script." >&2
    exit 1
  fi
fi

python - "$ENV_FILE" "$GHCR_PAT" <<'PY'
import sys
from pathlib import Path

env_path = Path(sys.argv[1])
token = sys.argv[2]

lines = env_path.read_text().splitlines()
updated = False

for idx, line in enumerate(lines):
    if line.startswith("GH_PAT="):
        lines[idx] = f"GH_PAT={token}"
        updated = True
        break

if not updated:
    lines.append(f"GH_PAT={token}")

env_path.write_text("\n".join(lines) + "\n")
PY

echo "Updated GH_PAT in $ENV_FILE."
