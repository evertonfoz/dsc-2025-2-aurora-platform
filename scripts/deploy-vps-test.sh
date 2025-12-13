#!/usr/bin/env bash
set -euo pipefail

# deploy-vps-test.sh
# Helper to test deploy on a remote VPS for the Aurora Platform.
# - copies local `.env.prod` to the VPS (backing up existing file)
# - pulls images on the VPS and runs `docker compose -f docker-compose.deploy.yml up -d`
# - shows `docker compose ps` and tail logs
#
# Usage:
#   ./scripts/deploy-vps-test.sh \ 
#     --host 1.2.3.4 \ 
#     --user ubuntu \ 
#     --repo-dir ~/dsc-2025-2-aurora-platform \ 
#     --identity ~/.ssh/id_rsa 
#

REPO_OWNER=${REPO_OWNER:-"evertonfoz"}
VPS_HOST=${VPS_HOST:-""}
VPS_USER=${VPS_USER:-"ubuntu"}
VPS_PORT=${VPS_PORT:-22}
VPS_IDENTITY=${VPS_IDENTITY:-""}
VPS_REPO_DIR=${VPS_REPO_DIR:-"~/dsc-2025-2-aurora-platform"}
FORCE=${FORCE:-"false"}
DRY_RUN=${DRY_RUN:-"false"}

function usage() {
  cat <<EOF
deploy-vps-test.sh - deploy helper for testing on a remote VPS

Environment variables respected: VPS_HOST, VPS_USER, VPS_PORT, VPS_IDENTITY, VPS_REPO_DIR

Options:
  --host HOST            VPS host or IP (can also set VPS_HOST env)
  --user USER            SSH user (default: ubuntu)
  --port PORT            SSH port (default: 22)
  --identity PATH        SSH private key to use for scp/ssh
  --repo-dir PATH        Path on VPS where repo is cloned (default: ~/dsc-2025-2-aurora-platform)
  --dry-run              Show actions without executing remote commands
  --yes                  Skip confirmation prompts
  -h|--help              Show this help

Example:
  ./scripts/deploy-vps-test.sh --host 1.2.3.4 --identity ~/.ssh/id_rsa --yes

EOF
}

while [[ ${#} -gt 0 ]]; do
  case "$1" in
    --host) VPS_HOST="$2"; shift 2;;
    --user) VPS_USER="$2"; shift 2;;
    --port) VPS_PORT="$2"; shift 2;;
    --identity) VPS_IDENTITY="$2"; shift 2;;
    --repo-dir) VPS_REPO_DIR="$2"; shift 2;;
    --dry-run) DRY_RUN="true"; shift;;
    --yes) FORCE="true"; shift;;
    -h|--help) usage; exit 0;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1;;
  esac
done

if [ -z "$VPS_HOST" ]; then
  echo "VPS host not specified. Use --host or set VPS_HOST env var." >&2
  usage
  exit 1
fi

if [ ! -f .env.prod ]; then
  echo ".env.prod not found in repository root. Create or copy .env.prod before running." >&2
  exit 1
fi


# Build ssh/scp base args
# Note: ssh uses lowercase -p for port, scp uses uppercase -P
SSH_OPTS=( -p "$VPS_PORT" -o StrictHostKeyChecking=accept-new )
if [ -n "$VPS_IDENTITY" ]; then
  SSH_OPTS+=( -i "$VPS_IDENTITY" )
fi

SCP_OPTS=( -P "$VPS_PORT" -o StrictHostKeyChecking=accept-new )
if [ -n "$VPS_IDENTITY" ]; then
  SCP_OPTS+=( -i "$VPS_IDENTITY" )
fi

SSH_CMD=(ssh "${SSH_OPTS[@]}" "${VPS_USER}@${VPS_HOST}")
SCP_CMD=(scp "${SCP_OPTS[@]}")

echo "[deploy-vps-test] target: ${VPS_USER}@${VPS_HOST}:${VPS_REPO_DIR}"
if [ "$DRY_RUN" = "true" ]; then
  echo "DRY RUN mode - no remote changes will be made";
fi

if [ "$FORCE" != "true" ]; then
  read -p "Proceed to copy .env.prod and deploy on ${VPS_HOST}? (y/N) " yn
  if [[ ! "$yn" =~ ^([yY]|[sS])$ ]]; then
    echo "Aborting."; exit 0
  fi
fi

REMOTE_ENV_PATH="${VPS_REPO_DIR%/}/.env.prod"
TMP_ENV=".env.prod.deploy.tmp"

echo "Uploading .env.prod to VPS (temporary file in repo)..."
REMOTE_TMP_PATH="${VPS_REPO_DIR%/}/${TMP_ENV}"
if [ "$DRY_RUN" = "true" ]; then
  echo "DRY: ${SCP_CMD[*]} .env.prod ${VPS_USER}@${VPS_HOST}:$REMOTE_TMP_PATH";
else
  "${SCP_CMD[@]}" .env.prod "${VPS_USER}@${VPS_HOST}:$REMOTE_TMP_PATH"
fi

echo "Running remote deploy sequence on VPS..."
REMOTE_SCRIPT=$(cat <<'REMOTE'
set -euo pipefail
REPO_DIR="${REPO_DIR}"
ENV_TMP="${ENV_TMP}"
ENV_PATH="${ENV_PATH}"
cd "$REPO_DIR"
echo "Backing up existing .env.prod (if any)"
if [ -f "$ENV_PATH" ]; then
  ts=$(date +%s)
  mv "$ENV_PATH" "$ENV_PATH.bak.$ts"
  echo "Backed up to $ENV_PATH.bak.$ts"
fi
mv "$ENV_TMP" "$ENV_PATH"
echo "Pulled .env.prod into repo"
echo "Fetching repo and pulling latest on main"
git fetch --all --prune || true
git checkout main || true
git pull origin main || true
echo "Pulling images and starting compose"
docker compose --env-file "$ENV_PATH" -f docker-compose.deploy.yml pull || true
docker compose --env-file "$ENV_PATH" -f docker-compose.deploy.yml up -d --build
sleep 5
echo "Compose ps:"
docker compose --env-file "$ENV_PATH" -f docker-compose.deploy.yml ps
echo "Tailing last 200 lines of logs:"
docker compose --env-file "$ENV_PATH" -f docker-compose.deploy.yml logs --tail 200
REMOTE
)

# Replace placeholders with real values
REMOTE_SCRIPT=${REMOTE_SCRIPT//\$\{REPO_DIR\}/$VPS_REPO_DIR}
REMOTE_SCRIPT=${REMOTE_SCRIPT//\$\{ENV_TMP\}/$TMP_ENV}
REMOTE_SCRIPT=${REMOTE_SCRIPT//\$\{ENV_PATH\}/$REMOTE_ENV_PATH}

if [ "$DRY_RUN" = "true" ]; then
  echo "DRY: SSH will run the following script on remote:"
  echo "---"
  echo "$REMOTE_SCRIPT"
  echo "---"
  echo "Done (dry run)"
  exit 0
fi

echo "Executing remote commands via SSH..."
printf "%s" "$REMOTE_SCRIPT" | "${SSH_CMD[@]}" bash -s

echo "Remote deploy finished. You may want to run health checks on the VPS or inspect logs further."
