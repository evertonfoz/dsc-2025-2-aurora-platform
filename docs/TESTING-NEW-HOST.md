# Testando a Aurora Platform em uma nova máquina (produção)

Este documento explica passo-a-passo como preparar uma máquina nova e testar a stack completa (DB + microserviços) usando as imagens publicadas no GitHub Container Registry (GHCR) e o arquivo `docker-compose.prod.yml` do repositório.

IMPORTANTE: Não comite o arquivo `.env.prod` com segredos. Use `.env.prod.example` como modelo.

---

## Pré-requisitos

- Docker e Docker Compose instalados na máquina.
- Acesso ao GHCR (se as imagens forem privadas): Personal Access Token (PAT) com `read:packages`.
- 4GB+ de RAM recomendado para rodar a stack localmente.

---

## 1) Confirmar que as imagens estão publicadas no GHCR

Tente puxar as imagens (do usuário/organização `evertonfoz`):

```bash
docker pull ghcr.io/evertonfoz/users-service:latest
docker pull ghcr.io/evertonfoz/auth-service:latest
docker pull ghcr.io/evertonfoz/events-service:latest
```

Se o repositório/packges estiver privado, autentique antes:

```bash
# usar um token em GHCR_TOKEN (exportado no ambiente)
echo "$GHCR_TOKEN" | docker login ghcr.io -u <github-user> --password-stdin
```

Se o pull falhar com `unauthorized`, autentique corretamente com um PAT com scope `read:packages`.

---

## 2) Clonar o repositório e preparar `.env.prod`

```bash
git clone https://github.com/evertonfoz/dsc-2025-2-aurora-platform.git
cd dsc-2025-2-aurora-platform
cp .env.prod.example .env.prod
# Edite .env.prod com valores reais (POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, JWT_ACCESS_SECRET etc.)
```

Exemplo mínimo do que editar em `.env.prod`:

```
POSTGRES_USER=aurora_user
POSTGRES_PASSWORD=senha_super_segura
POSTGRES_DB=aurora_db
JWT_ACCESS_SECRET=um_segredo_super_longo
```

> Dica: use um gerador de segredos para `JWT_ACCESS_SECRET` (64+ chars) e armazene `.env.prod` em local seguro (secrets manager).

---

## 3) Subir a stack (produção)

```bash
# no diretório do repo
docker-compose -f docker-compose.prod.yml up -d
```

Verificar containers:

```bash
docker-compose -f docker-compose.prod.yml ps
```

Se algum container falhar, veja os logs:

```bash
docker-compose -f docker-compose.prod.yml logs -f users-service
docker-compose -f docker-compose.prod.yml logs -f auth-service
docker-compose -f docker-compose.prod.yml logs -f events-service
docker-compose -f docker-compose.prod.yml logs -f db
```

---

## 4) Confirmação do banco (inicialização)

- O `db` foi configurado para executar scripts em `./postgres-init` na primeira inicialização.
- Para checar se o banco está pronto:

```bash
# verificar health do postgres
docker-compose -f docker-compose.prod.yml exec db pg_isready -U $POSTGRES_USER -d $POSTGRES_DB

# entrar no psql do container
docker-compose -f docker-compose.prod.yml exec db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
# dentro do psql, rode: \dt para listar tabelas
```

Se as tabelas/schemas existirem, os scripts de `postgres-init` rodaram corretamente.

---

## 5) Rodar migrações (se necessário)

Alguns serviços podem rodar migrações automaticamente. Se precisar forçar:

```bash
# exemplo para users-service
docker-compose -f docker-compose.prod.yml exec users-service npm run migration:run
```

Confira os `package.json` dos serviços para ter certeza do nome do script de migração.

---

## 6) Testar endpoints

Exemplos rápidos (substitua HOST se não for localhost):

```bash
curl -sS http://localhost:3011/health
curl -sS http://localhost:3010/health
curl -sS http://localhost:3012/health
```

Use as coleções em `https/` do repositório para cenários mais completos (Postman/HTTPie/VS Code REST Client).

---

## 7) Limpeza

```bash
# Parar e remover containers (sem remover volumes)
docker-compose -f docker-compose.prod.yml down

# Se quiser apagar volumes (atenção: perde dados!)
docker-compose -f docker-compose.prod.yml down -v
```

---

## 8) Problemas comuns & soluções rápidas

- Postgres não inicializa: confira `.env.prod` e que o volume `pgdata` não contenha dados incompatíveis.
- Serviço falha por JWT: verifique `JWT_ACCESS_SECRET` em `.env.prod`.
- Imagem não encontrada: confirmar pull do GHCR ou build local.

---

Se quiser, eu posso gerar um script bash que automatize esses passos (checagens GHCR, clone, .env.prod templating e `docker-compose up`).