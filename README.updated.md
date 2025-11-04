````markdown
# Notas de segurança e exemplos HTTP

- Segurança: em ambientes de produção o serviço exige que a variável de ambiente `JWT_ACCESS_SECRET` esteja configurada. A aplicação falha ao iniciar se essa variável não existir quando `NODE_ENV=production`.
- Não habilite fallbacks para segredos em produção — use variáveis de ambiente seguras (secrets manager) e fail-fast para evitar vazamentos.

- Exemplos HTTP: os exemplos ficam na pasta `https/` organizados por domínio (`https/auth`, `https/users`, `https/events`). Não é necessário mover ou editar os arquivos `.http` para executar os exemplos — abra-os no seu REST client (por exemplo, VS Code REST Client) e defina as variáveis (`{{apiBase}}`, `{{adminToken}}`, `{{teacherToken}}`, `{{studentToken}}`) no topo do arquivo ou em um arquivo de variáveis incluído.

-- Dica rápida: se estiver executando a aplicação dentro de Docker, confirme que a porta está exposta e que `{{apiBase}}` aponta para `http://localhost:<port>` no host, ou use o hostname do container quando executar os requests de dentro de outro container.
# Users Service — NestJS + TypeORM + PostgreSQL

Microserviço **users** com **NestJS** (TypeScript), **TypeORM** e **PostgreSQL**, pronto para desenvolvimento colaborativo:
Docker/Compose, migrações, DTOs/validação, documentação **Swagger**, **testes** (unit/E2E) e **health check**. Arquitetura
database-per-service, preparada para evolução com eventos (Outbox/Sagas) e API Gateway/BFF.

> Porta padrão da API: **3100** · Banco: **usersdb** (PostgreSQL)

---

## Sumário

- [Notas de segurança e exemplos HTTP](#notas-de-segurança-e-exemplos-http)
- [Users Service — NestJS + TypeORM + PostgreSQL](#users-service--nestjs--typeorm--postgresql)
  - [Sumário](#sumário)
  - [Visão Rápida](#visão-rápida)
  - [Stack e Requisitos](#stack-e-requisitos)
  - [Como Começar](#como-começar)
- [1) Clone o repositório](#1-clone-o-repositório)
- [2) Copie o .env de exemplo](#2-copie-o-env-de-exemplo)
- [3) Suba tudo com Docker](#3-suba-tudo-com-docker)
- [4) Aplique as migrações](#4-aplique-as-migrações)
- [5) Acesse](#5-acesse)
- [Health check](#health-check)
- [Swagger](#swagger)
- [Abra no navegador:](#abra-no-navegador)
- [http://localhost:3000/api/docs](#httplocalhost3000apidocs)
  - [Auditoria — Proteção da `main`](#auditoria--proteção-da-main)
    - [Evidências anexadas](#evidências-anexadas)

---

## Visão Rápida

- **Arquitetura**: microserviço isolado (database-per-service).
- **Camadas**: Controller → Service → Repository (TypeORM).
- **Contratos**: DTOs (entrada/saída) + validação `class-validator`.
- **Observabilidade**: health check (`/health`) com verificação do banco.
- **Dev Experience**: Swagger em `/api/docs`, scripts NPM, Compose.
- **Colaboração**: issues/PRs, Conventional Commits, templates.

---

## Stack e Requisitos

- **Node.js** ≥ 18 (LTS)
- **Docker** e **Docker Compose**
- **PostgreSQL** (provisionado via Compose)
- **Git** e uma conta no **GitHub**

Extensões úteis (VS Code): Docker, ESLint, EditorConfig.

---

## Como Começar

```bash
# 1) Clone o repositório
git clone https://github.com/ORG/users-service.git
cd users-service

# 2) Copie o .env de exemplo
cp .env.example .env

# 3) Suba tudo com Docker
docker compose up -d --build

# 4) Aplique as migrações
npm run migration:run

# 5) Acesse
# Health check
curl http://localhost:3000/health
# Swagger
# Abra no navegador:
# http://localhost:3000/api/docs


## Auditoria — Proteção da `main`
- [x] Pull Request obrigatório
- [x] Status checks obrigatórios: lint, build, test (**strict: true**)
- [x] Branch up-to-date exigida
- [x] Enforce admins (sem bypass)
- [x] 1 aprovação + dismiss stale + last push approval
- [x] Conversation resolution + linear history
- [ ] CODEOWNERS ativo (arquivo presente)
- [ ] Require review from Code Owners habilitado
### Evidências anexadas
- Screenshot das regras de Branch Protection
- Link de PR com “All checks have passed” (lint/build/test)
- Execução do workflow CI (link dos jobs)

- [Deploy — Produção](docs/DEPLOYMENT.md) (instruções detalhadas)

````