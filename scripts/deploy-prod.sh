#!/usr/bin/env bash
set -euo pipefail

# Deploy helper para produção (compose prod).
# - Usa docker-compose.prod.yml
# - Requer .env.prod (copia de exemplo se faltar)
# - Puxa imagens (opcional: --no-pull) e sobe com compose
# - Health básico via exec (interno) opcional

set -euo pipefail

GITHUB_ORG=${GITHUB_ORG:-"evertonfoz"}
GITHUB_REPO=${GITHUB_REPO:-"dsc-2025-2-aurora-platform"}
USERS_TAG=${USERS_IMAGE_TAG:-"latest"}
AUTH_TAG=${AUTH_IMAGE_TAG:-"latest"}
EVENTS_TAG=${EVENTS_IMAGE_TAG:-"latest"}
REGISTRATIONS_TAG=${REGISTRATIONS_IMAGE_TAG:-"latest"}
PULL_IMAGES=${PULL_IMAGES:-"true"}
COSIGN_VERIFY=${COSIGN_VERIFY:-"false"}

echo "[deploy-prod] usando imagens:"
echo "  users:           ghcr.io/${GITHUB_ORG}/${GITHUB_REPO}/users-service:${USERS_TAG}"
echo "  auth:            ghcr.io/${GITHUB_ORG}/${GITHUB_REPO}/auth-service:${AUTH_TAG}"
echo "  events:          ghcr.io/${GITHUB_ORG}/${GITHUB_REPO}/events-service:${EVENTS_TAG}"
echo "  registrations:   ghcr.io/${GITHUB_ORG}/${GITHUB_REPO}/registrations-service:${REGISTRATIONS_TAG}"

if [ ! -f .env.prod ]; then
  if [ -f .env.prod.example ]; then
    echo ".env.prod não encontrado — copiando de .env.prod.example"
    cp .env.prod.example .env.prod
    echo "ATENÇÃO: edite .env.prod e substitua segredos (JWT_ACCESS_SECRET, credenciais DB, etc.)"
    read -p "Deseja abrir .env.prod agora em nano? (s/N) " OPEN
    if [[ "$OPEN" =~ ^([sS]|[yY])$ ]]; then
      nano .env.prod
    fi
  else
    echo "Arquivo .env.prod.example não existe. Saindo." >&2
    exit 1
  fi
fi

if [ "$PULL_IMAGES" = "true" ]; then
  docker pull ghcr.io/${GITHUB_ORG}/${GITHUB_REPO}/users-service:${USERS_TAG}
  docker pull ghcr.io/${GITHUB_ORG}/${GITHUB_REPO}/auth-service:${AUTH_TAG}
  docker pull ghcr.io/${GITHUB_ORG}/${GITHUB_REPO}/events-service:${EVENTS_TAG}
  docker pull ghcr.io/${GITHUB_ORG}/${GITHUB_REPO}/registrations-service:${REGISTRATIONS_TAG}
fi

if [ "$COSIGN_VERIFY" = "true" ]; then
  if ! command -v cosign >/dev/null 2>&1; then
    echo "COSIGN_VERIFY=true mas cosign não está instalado. Instale cosign para verificação." >&2
    exit 1
  fi
  echo "Verificando assinaturas com cosign..."
  cosign verify --key cosign.pub ghcr.io/${GITHUB_ORG}/${GITHUB_REPO}/users-service:${USERS_TAG}
  cosign verify --key cosign.pub ghcr.io/${GITHUB_ORG}/${GITHUB_REPO}/auth-service:${AUTH_TAG}
  cosign verify --key cosign.pub ghcr.io/${GITHUB_ORG}/${GITHUB_REPO}/events-service:${EVENTS_TAG}
  cosign verify --key cosign.pub ghcr.io/${GITHUB_ORG}/${GITHUB_REPO}/registrations-service:${REGISTRATIONS_TAG}
fi

echo "Subindo com docker compose (prod)"
docker compose --env-file .env.prod \
  -f docker-compose.prod.yml \
  up -d

echo "Status pós-subida:"
docker compose --env-file .env.prod -f docker-compose.prod.yml ps

echo "Dica: para checar health internamente:"
echo "  docker compose --env-file .env.prod -f docker-compose.prod.yml exec events-service curl -sf http://127.0.0.1:3012/health"
echo "  docker compose --env-file .env.prod -f docker-compose.prod.yml exec registrations-service curl -sf http://127.0.0.1:3013/registrations/health"
echo "  docker compose --env-file .env.prod -f docker-compose.prod.yml exec auth-service curl -sf http://127.0.0.1:3010/health || true"
echo "  docker compose --env-file .env.prod -f docker-compose.prod.yml exec users-service curl -sf http://127.0.0.1:3011/health || true"

echo "Deploy (compose prod) concluído. Use logs/health para confirmar."
