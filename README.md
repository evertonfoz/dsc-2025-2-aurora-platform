# Users Service — NestJS + TypeORM + PostgreSQL

Microserviço **users** com **NestJS** (TypeScript), **TypeORM** e **PostgreSQL**, pronto para desenvolvimento colaborativo:
Docker/Compose, migrações, DTOs/validação, documentação **Swagger**, **testes** (unit/E2E) e **health check**. Arquitetura
database-per-service, preparada para evolução com eventos (Outbox/Sagas) e API Gateway/BFF.

> Porta padrão da API: **3000** · Banco: **usersdb** (PostgreSQL)

---

## Sumário

- [Visão Rápida](#visão-rápida)
- [Stack e Requisitos](#stack-e-requisitos)
- [Como Começar](#como-começar)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Scripts NPM](#scripts-npm)
- [Rodando com Docker](#rodando-com-docker)
- [Migrações](#migrações)
- [Documentação e Endpoints](#documentação-e-endpoints)
- [Estrutura de Diretórios](#estrutura-de-diretórios)
- [Testes](#testes)
- [Contribuindo](#contribuindo)
- [Checklist de Aceite (MVP)](#checklist-de-aceite-mvp)
- [Roadmap](#roadmap)
- [Licença](#licença)

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
