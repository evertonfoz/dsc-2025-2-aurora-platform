#!/usr/bin/env bash
set -euo pipefail

# test-release-bundle.sh
# Download a release bundle (deploy-bundle-*.tar.gz), extract it, prepare .env.prod and
# bring it up with docker compose for a quick smoke test.
#
# Usage:
#   ./scripts/test-release-bundle.sh [--repo owner/repo] [--tag TAG|latest] [--dir ./target-dir]
#   ./scripts/test-release-bundle.sh --help

REPO_DEFAULT="evertonfoz/dsc-2025-2-aurora-platform"
TAG="latest"
TARGET_DIR="./deploy-test"

usage() {
  cat <<-USAGE
Usage: $0 [options]

Options:
  --repo owner/repo    GitHub repo (default: ${REPO_DEFAULT})
  --tag TAG|latest     Release tag or 'latest' (default: latest)
  --dir PATH           Directory where bundle will be extracted (default: ./deploy-test)
  --no-up              Download + extract only, do not run docker compose
  --login-ghcr TOKEN   Authenticate docker to ghcr.io using PAT (optional)
  -h, --help           Show this help

Examples:
  $0 --repo evertonfoz/dsc-2025-2-aurora-platform --tag latest --dir /tmp/aurora-test

This script requires either the GitHub CLI (gh) or curl to download the release asset.
It also requires Docker + Docker Compose v2 to run the deploy bundle.
USAGE
  exit 1
}

if [[ ${#} -eq 0 ]]; then
  : # allow defaults
fi

NO_UP=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo) REPO="$2"; shift 2;;
    --tag) TAG="$2"; shift 2;;
    --dir) TARGET_DIR="$2"; shift 2;;
    --no-up) NO_UP=true; shift 1;;
    --login-ghcr) GHCR_TOKEN="$2"; shift 2;;
    -h|--help) usage;;
    *) echo "Unknown option: $1"; usage;;
  esac
done

REPO=${REPO:-$REPO_DEFAULT}

mkdir -p "$TARGET_DIR"
pushd "$TARGET_DIR" >/dev/null

echo "Target dir: $(pwd)"

download_asset_with_gh() {
  echo "Using gh CLI to download release asset for $REPO@$TAG"
  gh release download "$TAG" --repo "$REPO" --pattern "deploy-bundle-*.tar.gz" || return 1
}

download_asset_with_curl() {
  echo "Falling back to using curl to query GitHub API for $REPO@$TAG"
  API=https://api.github.com/repos/${REPO}/releases
  if [[ "$TAG" == "latest" ]]; then
    url="$API/latest"
  else
    url="$API/tags/${TAG}"
  fi

  release_json=$(curl -sSfL "$url") || return 1
  asset_url=$(echo "$release_json" | grep -Eo 'https://[^\"]+deploy-bundle-[^\"]+\.tar\.gz' | head -n1)
  if [[ -z "$asset_url" ]]; then
    echo "Could not find deploy-bundle asset for $REPO@$TAG" >&2
    return 1
  fi

  echo "Downloading $asset_url"
  curl -L -o deploy-bundle.tar.gz "$asset_url"
}

if command -v gh >/dev/null 2>&1; then
  if ! download_asset_with_gh; then
    if ! download_asset_with_curl; then
      echo "Download failed (gh + curl both tried)" >&2; exit 2
    fi
  fi
else
  if ! download_asset_with_curl; then
    echo "gh CLI not available and curl fallback failed" >&2; exit 2
  fi
fi

asset_file=$(ls deploy-bundle-*.tar.gz 2>/dev/null || true)
if [[ -z "$asset_file" ]]; then
  echo "Release asset not found after download" >&2; ls -la; exit 2
fi

echo "Extracting $asset_file"
tar -xzf "$asset_file"

if [[ ! -f docker-compose.deploy.yml ]]; then
  echo "docker-compose.deploy.yml not found in bundle" >&2
  echo "List dir:"; ls -la
  exit 3
fi

if [[ -f .env.prod.example ]]; then
  if [[ ! -f .env.prod ]]; then
    cp .env.prod.example .env.prod
    echo "Copied .env.prod.example -> .env.prod"
    echo "Edit .env.prod now if needed. Press ENTER to open with EDITOR ($EDITOR) or Ctrl-C to cancel"
    read -r || true
    if [[ -n "${EDITOR:-}" ]]; then
      ${EDITOR} .env.prod || true
    else
      ${VISUAL:-${EDITOR:-vim}} .env.prod || true
    fi
  else
    echo ".env.prod already exists, keeping as-is"
  fi
else
  echo ".env.prod.example not present in the bundle — continue if you already have .env.prod configured"
fi

if [[ ${NO_UP} == true ]]; then
  echo "--no-up specified — finished (download + extract)"
  popd >/dev/null
  exit 0
fi

if [[ -n "${GHCR_TOKEN:-}" ]]; then
  echo "Logging into ghcr.io with provided token"
  echo "$GHCR_TOKEN" | docker login ghcr.io -u "$USER" --password-stdin
fi

echo "Bringing services up with docker compose"
docker compose -f docker-compose.deploy.yml --env-file .env.prod up -d

echo "Waiting for service health endpoints (users:3011 auth:3010 events:3012)"
timeout=120
step=3
elapsed=0
ok=0
urls=("http://localhost:3011/health" "http://localhost:3010/health" "http://localhost:3012/health")

until [[ $elapsed -ge $timeout ]]; do
  ok=0
  for u in "${urls[@]}"; do
    if curl -sSf "$u" >/dev/null 2>&1; then
      ok=$((ok+1))
    fi
  done
  if [[ $ok -eq ${#urls[@]} ]]; then
    echo "All services responded OK"
    break
  fi
  sleep $step
  elapsed=$((elapsed+step))
  echo "waiting... ($elapsed/$timeout)"
done

if [[ $ok -ne ${#urls[@]} ]]; then
  echo "One or more services didn't report healthy within timeout" >&2
  docker compose -f docker-compose.deploy.yml --env-file .env.prod ps
  echo "Check logs with: docker compose -f docker-compose.deploy.yml --env-file .env.prod logs -f"
  popd >/dev/null
  exit 4
fi

echo "Smoke tests: calling /health endpoints"
for u in "${urls[@]}"; do
  echo "-> $u"
  curl -sSf "$u" || true
  echo -e "\n---\n"
done

echo "All done. To tear down run: docker compose -f docker-compose.deploy.yml --env-file .env.prod down -v"
popd >/dev/null

exit 0
