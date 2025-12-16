#!/usr/bin/env bash
set -euo pipefail

# Helper para subir o compose de deploy (deploy-only).
# - Puxa imagens (tags via env ou 'latest')
# - (Opcional) verifica assinatura com cosign se COSIGN_VERIFY=true
# - Garante .env.prod (copia de .env.prod.example se não existir)
# - Executa docker compose -f docker-compose.deploy.yml up -d
# - Faz health básico nas portas expostas (dev/teste)

REPO_OWNER=${REPO_OWNER:-"evertonfoz"}
USERS_TAG=${USERS_IMAGE_TAG:-"latest"}
AUTH_TAG=${AUTH_IMAGE_TAG:-"latest"}
EVENTS_TAG=${EVENTS_IMAGE_TAG:-"latest"}
COSIGN_VERIFY=${COSIGN_VERIFY:-"false"}

echo "[deploy-deploy] usando imagens:"
echo "  users:   ghcr.io/${REPO_OWNER}/users-service:${USERS_TAG}"
echo "  auth:    ghcr.io/${REPO_OWNER}/auth-service:${AUTH_TAG}"
echo "  events:  ghcr.io/${REPO_OWNER}/events-service:${EVENTS_TAG}"

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

docker pull ghcr.io/${REPO_OWNER}/users-service:${USERS_TAG}
docker pull ghcr.io/${REPO_OWNER}/auth-service:${AUTH_TAG}
docker pull ghcr.io/${REPO_OWNER}/events-service:${EVENTS_TAG}

if [ "$COSIGN_VERIFY" = "true" ]; then
  if ! command -v cosign >/dev/null 2>&1; then
    echo "COSIGN_VERIFY=true mas cosign não está instalado. Instale cosign para verificação." >&2
    exit 1
  fi
  echo "Verificando assinaturas com cosign..."
  cosign verify --key cosign.pub ghcr.io/${REPO_OWNER}/users-service:${USERS_TAG}
  cosign verify --key cosign.pub ghcr.io/${REPO_OWNER}/auth-service:${AUTH_TAG}
  cosign verify --key cosign.pub ghcr.io/${REPO_OWNER}/events-service:${EVENTS_TAG}
fi

echo "Subindo com docker compose (deploy-only)"
docker compose -f docker-compose.deploy.yml up -d

echo "Aguardando serviços ficarem saudáveis (aguarde alguns segundos)"

# wait_for_url: tenta acessar uma URL com retries e backoff
# args: URL max_attempts initial_delay_seconds
wait_for_url() {
  local URL=$1
  local MAX_ATTEMPTS=${2:-12}
  local DELAY=${3:-2}
  local ATTEMPT=1
  local RET=1

  while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    if curl -sfS "$URL" >/dev/null; then
      echo "OK: $URL"
      RET=0
      break
    else
      echo "Attempt $ATTEMPT/$MAX_ATTEMPTS: $URL not ready (sleep ${DELAY}s)"
      sleep $DELAY
      # exponential-ish backoff (grow by factor 1.5, integer)
      DELAY=$(( (DELAY * 3) / 2 ))
      ATTEMPT=$((ATTEMPT + 1))
    fi
  done

  return $RET
}

# wait_for_port: verifica se porta TCP está ouvindo (timeout por tentativa)
wait_for_port() {
  local HOST=${1:-localhost}
  local PORT=${2}
  local MAX_ATTEMPTS=${3:-12}
  local DELAY=${4:-1}
  local ATTEMPT=1

  while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    if nc -z "$HOST" "$PORT" >/dev/null 2>&1; then
      echo "port $HOST:$PORT is open"
      return 0
    fi
    echo "port check $ATTEMPT/$MAX_ATTEMPTS: $HOST:$PORT (sleep ${DELAY}s)"
    sleep $DELAY
    ATTEMPT=$((ATTEMPT + 1))
  done
  return 1
}

# Prefer testar via gateway (NGINX) para validar o ponto único de entrada
GATEWAY_HOST=${GATEWAY_HOST:-localhost}
GATEWAY_PORT=${GATEWAY_PORT:-80}
GATEWAY_BASE_URL="http://${GATEWAY_HOST}:${GATEWAY_PORT}"

echo "Aguardando gateway em ${GATEWAY_HOST}:${GATEWAY_PORT}..."
if wait_for_port "$GATEWAY_HOST" "$GATEWAY_PORT" 20 1; then
  echo "Gateway disponível em ${GATEWAY_BASE_URL}"
else
  echo "Gateway não respondeu na porta ${GATEWAY_PORT} após várias tentativas" >&2
fi

echo "Testando endpoints via gateway (${GATEWAY_BASE_URL})"
# autenticação/paths esperados via gateway: /auth, /users, /events, /registrations
wait_for_url "${GATEWAY_BASE_URL}/auth/health" 12 2 || echo "  (auth pode exigir token; verifique rota /auth/health)"
wait_for_url "${GATEWAY_BASE_URL}/users/health" 12 2 || echo "  (users health falhou)"
wait_for_url "${GATEWAY_BASE_URL}/events/health" 12 2 || echo "  (events health falhou)"
wait_for_url "${GATEWAY_BASE_URL}/registrations/health" 12 2 || echo "  (registrations health falhou)"

echo "Deploy (compose deploy) concluído. Verifique logs se necessário."
