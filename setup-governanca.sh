#!/usr/bin/env bash
set -euo pipefail

: "${OWNER:?Defina OWNER}"; : "${REPO:?Defina REPO}";
: "${PROJECT_TITLE:?Defina PROJECT_TITLE}"; : "${PROJECT_DESC:?Defina PROJECT_DESC}"

api() { gh api -H "Accept: application/vnd.github+json" "$@"; }

ensure_label() {
  local name="$1" color="$2" desc="$3"
  if api "/repos/$OWNER/$REPO/labels/$name" >/dev/null 2>&1; then
    api -X PATCH "/repos/$OWNER/$REPO/labels/$name" -f color="$color" -f description="$desc" >/dev/null
    echo "✓ Label atualizada: $name"
  else
    api -X POST "/repos/$OWNER/$REPO/labels" -f name="$name" -f color="$color" -f description="$desc" >/dev/null
    echo "✓ Label criada: $name"
  fi
}

ensure_milestone() {
  local title="$1" desc="$2" due_on="$3"
  local number
  number=$(api "/repos/$OWNER/$REPO/milestones?state=all" --jq ".[] | select(.title==\"$title\") | .number" || true)
  if [[ -z "${number:-}" ]]; then
    api -X POST "/repos/$OWNER/$REPO/milestones" -f title="$title" -f description="$desc" -f due_on="$due_on" >/dev/null
    echo "✓ Milestone criada: $title"
  else
    api -X PATCH "/repos/$OWNER/$REPO/milestones/$number" -f description="$desc" -f due_on="$due_on" >/dev/null
    echo "✓ Milestone atualizada: $title"
  fi
}

ensure_project() {
  local title="$1" desc="$2"
  local number

  # 1) Tenta encontrar o project pelo título
  number=$(
    gh project list --owner "$OWNER" --format json \
    | jq -r --arg t "$title" '.projects[] | select(.title==$t) | .number' \
    | head -n1
  )

  # 2) Cria se não existir; senão, atualiza descrição
  if [ -z "$number" ]; then
    number=$(gh project create --owner "$OWNER" --title "$title" --format json --jq '.number')
    gh project edit "$number" --owner "$OWNER" --description "$desc" >/dev/null
    echo "✓ Project criado: $title (#$number)"
  else
    gh project edit "$number" --owner "$OWNER" --description "$desc" >/dev/null
    echo "✓ Project já existe e foi atualizado: $title (#$number)"
  fi

  echo "$number"
}


ensure_priority_field() {
  local project_number="$1"
  if gh project field-list --owner "$OWNER" --number "$project_number" >/dev/null 2>&1; then
    local exists
    exists=$(gh project field-list --owner "$OWNER" --number "$project_number" --format json --jq '.[] | select(.name=="Priority") | .name' || true)
    if [[ -z "${exists:-}" ]]; then
      gh project field-create --owner "$OWNER" --number "$project_number" --name "Priority" --type SINGLE_SELECT --options "P1,P2,P3" >/dev/null || {
        echo "ℹ Não foi possível criar campo Priority (versão do gh). Use labels P1/P2/P3 como alternativa."; }
      [[ -z "${exists:-}" ]] && echo "✓ Campo Priority criado (ou já existia)."
    else
      echo "✓ Campo Priority já existe."
    fi
  else
    echo "ℹ Sua versão do gh não suporta fields; use labels P1/P2/P3."
  fi
}

echo "==> Criando/atualizando labels…"
ensure_label "feat"  "2ea44f" "Nova funcionalidade"
ensure_label "bug"   "d73a4a" "Correção de defeito"
ensure_label "docs"  "0075ca" "Documentação"
ensure_label "test"  "e4e669" "Testes"
ensure_label "chore" "cfd3d7" "Tarefas de manutenção"
ensure_label "infra" "5319e7" "Infraestrutura/DevOps"
ensure_label "P1"    "b60205" "Alta prioridade"
ensure_label "P2"    "dbab09" "Prioridade média"
ensure_label "P3"    "0e8a16" "Baixa prioridade"

echo "==> Criando/atualizando milestones…"
ensure_milestone "M1 – Users MVP"       "CRUD + validações + Swagger"        "2025-10-15T23:59:59Z"
ensure_milestone "M2 – Observabilidade" "Logs + métricas (nível básico)"     "2025-11-05T23:59:59Z"
ensure_milestone "M3 – Endurecimento"   "Segurança, limites e testes extras" "2025-11-25T23:59:59Z"

echo "==> Criando/checando Project…"
PROJECT_NUMBER=$(ensure_project "$PROJECT_TITLE" "$PROJECT_DESC")

echo "==> Garantindo campo Priority (opcional)…"
ensure_priority_field "$PROJECT_NUMBER"

echo "Tudo pronto. Labels, milestones e Project configurados."
