#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/save-ghpat-to-env.sh [--ssh-key PATH] <user@host> <project_dir>
#
# This script reads the GitHub token from `gh auth token` (recommended) and
# sends it over a secure SSH session to update/replace the `GH_PAT` entry in
# `./.env.prod` on the remote host. The remote file is created if missing and
# written with permissions 600. Nothing is stored locally except in memory.
#
# Example:
#   ./scripts/save-ghpat-to-env.sh -i ~/.ssh/aurora_deploy ubuntu@64.181.173.121 /home/ubuntu/dsc-2025-2-aurora-platform

SSH_KEY="$HOME/.ssh/aurora_deploy"

print_usage() {
  cat <<EOF
Usage: $0 [-i /path/to/ssh_key] <user@host> <project_dir>

Example:
  $0 -i ~/.ssh/aurora_deploy ubuntu@64.181.173.121 /home/ubuntu/dsc-2025-2-aurora-platform

This script requires the GitHub CLI (`gh`) to be authenticated locally.
EOF
}

while getopts ":i:h" opt; do
  case $opt in
    i) SSH_KEY="$OPTARG" ;;
    h) print_usage; exit 0 ;;
    *) print_usage; exit 1 ;;
  esac
done
shift $((OPTIND -1))

if [ $# -ne 2 ]; then
  print_usage
  exit 1
fi

REMOTE="$1"
PROJECT_DIR="$2"

# Ensure gh is available locally
if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found locally. Install and authenticate first (gh auth login)." >&2
  exit 2
fi

# Try to read token from gh; allow piping token via stdin as fallback
TOKEN=""
if [ -t 0 ]; then
  # stdin is a terminal; try gh
  TOKEN=$(gh auth token 2>/dev/null || true)
else
  # token piped via stdin
  TOKEN=$(cat)
fi

if [ -z "$TOKEN" ]; then
  echo "No GH token found. Run 'gh auth login' locally or pipe a token via stdin." >&2
  echo "Example: echo -n '<TOKEN>' | $0 -i ~/.ssh/aurora_deploy ubuntu@host /path/to/project" >&2
  exit 3
fi

# Send token securely and update .env.prod on remote host
echo -n "$TOKEN" | ssh -i "$SSH_KEY" "$REMOTE" bash -s -- "$PROJECT_DIR" <<'REMOTE_SCRIPT'
set -euo pipefail
PROJECT_DIR="$1"
cd "$PROJECT_DIR"
umask 077
# create temp file without GH_PAT then append
if [ -f .env.prod ]; then
  grep -v "^GH_PAT=" .env.prod > .env.prod.tmp || true
else
  : > .env.prod.tmp
fi
printf "GH_PAT=%s\n" "$(cat)" >> .env.prod.tmp
mv .env.prod.tmp .env.prod
chmod 600 .env.prod
echo "GH_PAT updated in .env.prod (chmod 600)"
REMOTE_SCRIPT

echo "Done. GH_PAT updated on $REMOTE:$PROJECT_DIR/.env.prod"
