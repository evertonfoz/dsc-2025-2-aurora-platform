#!/usr/bin/env bash
# Automated helper to run the manual deploy-test steps on the VPS.
# Intended to be executed on the VPS as the `ubuntu` user.

set -euo pipefail

readonly PROGNAME=$(basename "$0")

usage() {
  cat <<EOF
Usage: $PROGNAME --dir <project_dir> [--deploy] [--down] [--no-pull] [--skip-git]

Options:
  --dir <project_dir>   Directory name under /home/ubuntu (required)
  --deploy              Perform 'docker compose pull' and 'docker compose up -d'
  --down                Run 'docker compose down' (stop services)
  --no-pull             Skip 'docker compose pull' when --deploy is set
  --skip-git            Skip git fetch/checkout/pull steps
  -h, --help            Show this help

Examples:
  # Run checks and show commands (no deploy)
  ./scripts/run-deploy-test.sh --dir dsc-2025-2-aurora-platform

  # Run checks and deploy (pull + up)
  ./scripts/run-deploy-test.sh --dir dsc-2025-2-aurora-platform --deploy

  # Stop services
  ./scripts/run-deploy-test.sh --dir dsc-2025-2-aurora-platform --down

Note: run this script on the VPS as the 'ubuntu' user.
EOF
}

if [ "$#" -eq 0 ]; then
  usage
  exit 1
fi

PROJECT_DIR=""
DO_DEPLOY=0
DO_DOWN=0
NO_PULL=0
SKIP_GIT=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --dir)
      PROJECT_DIR="$2"; shift 2;;
    --deploy)
      DO_DEPLOY=1; shift;;
    --down)
      DO_DOWN=1; shift;;
    --no-pull)
      NO_PULL=1; shift;;
    --skip-git)
      SKIP_GIT=1; shift;;
    -h|--help)
      usage; exit 0;;
    *)
      echo "Unknown arg: $1" >&2; usage; exit 2;;
  esac
done

if [ -z "$PROJECT_DIR" ]; then
  echo "Error: --dir <project_dir> is required" >&2
  usage
  exit 2
fi

PROJECT_PATH="/home/ubuntu/${PROJECT_DIR}"

echo "== Deploy test helper"
echo "Project path: ${PROJECT_PATH}"

if [ ! -d "$PROJECT_PATH" ]; then
  echo "Error: project directory does not exist: ${PROJECT_PATH}" >&2
  exit 3
fi

echo "- Checking docker..."
if ! command -v docker >/dev/null 2>&1; then
  echo "Docker not found. Install docker and try again." >&2
  exit 4
fi

echo "- Checking docker compose..."
if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose v2 not found (docker compose)." >&2
  echo "You may have docker-compose (v1) installed; update to use 'docker compose' or run commands manually." >&2
fi

echo "- Checking repository and files"
if [ ! -d "$PROJECT_PATH/.git" ]; then
  echo "Warning: no .git directory found at ${PROJECT_PATH}" >&2
fi

if [ ! -f "$PROJECT_PATH/docker-compose.deploy.yml" ]; then
  echo "Warning: docker-compose.deploy.yml not found in ${PROJECT_PATH}" >&2
fi

if [ ! -f "$PROJECT_PATH/.env.prod" ]; then
  echo "Warning: .env.prod not found in ${PROJECT_PATH}" >&2
fi

if [ "$SKIP_GIT" -ne 1 ]; then
  echo "- Running git fetch/checkout/pull"
  git -C "$PROJECT_PATH" fetch --all || echo "git fetch failed"
  git -C "$PROJECT_PATH" checkout main || echo "git checkout main failed"
  git -C "$PROJECT_PATH" pull origin main || echo "git pull failed"
else
  echo "- Skipping git operations ( --skip-git )"
fi

echo "- Exporting environment variables from .env.prod"
if [ -f "$PROJECT_PATH/.env.prod" ]; then
  # safer export: use set -o allexport so complex values are supported
  (cd "$PROJECT_PATH" && set -o allexport; source .env.prod; set +o allexport)
else
  echo "No .env.prod to export (skipping)"
fi

if [ "$DO_DOWN" -eq 1 ]; then
  echo "- Running: docker compose -f docker-compose.deploy.yml down"
  (cd "$PROJECT_PATH" && docker compose -f docker-compose.deploy.yml down)
  echo "Done."
  exit 0
fi

if [ "$DO_DEPLOY" -eq 1 ]; then
  if [ "$NO_PULL" -eq 0 ]; then
    echo "- Pulling images: docker compose -f docker-compose.deploy.yml pull"
    (cd "$PROJECT_PATH" && docker compose -f docker-compose.deploy.yml pull)
  else
    echo "- Skipping pull (--no-pull)"
  fi

  # Login to GHCR if GH_PAT is present
  if [ -n "${GH_PAT:-}" ]; then
    echo "- Logging in to GHCR..."
    echo "$GH_PAT" | docker login ghcr.io -u "${GHCR_USER:-$GITHUB_REPOSITORY_OWNER}" --password-stdin || echo "docker login failed"
  else
    echo "- GH_PAT not set. Skipping GHCR login. If images are private, set GH_PAT before running."
  fi

  echo "- Starting services: docker compose -f docker-compose.deploy.yml up -d"
  (cd "$PROJECT_PATH" && docker compose -f docker-compose.deploy.yml up -d)
  echo "Deploy finished."
else
  echo "- No --deploy or --down specified; only checks performed."
fi

echo "== Done"
