# Banco único com múltiplos schemas — Guia prático para uso via containers

Este documento substitui o README anterior e foca em como operar o ambiente do curso usando containers (Docker + docker-compose). Contém a fundamentação, decisões arquiteturais e um passo-a-passo prático para criar, subir e preparar o banco (e os microserviços) em um laboratório.

Sumário
- Motivação e decisões arquiteturais
- Arquitetura proposta (one DB, multi-schema)
- Como o projeto está organizado hoje (resumo)
- Passo a passo prático (containers)
  - Preparar o ambiente
  - Inicializar o banco (docker-init)
  - Bootstrap idempotente (script)
  - Rodar migrations por package
  - Construir e rodar o `events-service` em container
- Boas práticas e checklist para as aulas
- Troubleshooting comum
- Exercícios práticos para a turma
- Referências

Motivação e decisões arquiteturais (resumo)
- Para um ambiente de laboratório, preferimos reduzir a superfície de infra: um único Postgres com schemas por serviço facilita o setup e o ensino.
- Mantemos isolamento lógico (schema) e versionamento via migrations por package. Evitamos synchronize em produção.

Arquitetura proposta
- Banco físico: `aurora_db`.
- Schemas lógicos: `events`, `users`, `auth` (um por serviço).
- Cada serviço aponta para o mesmo DB físico (`DB_NAME=aurora_db`) e define `DB_SCHEMA` com seu schema.

O que já existe no repositório (resumo rápido)
- `docker-compose.yml` (root) — já definido para `db` (Postgres) e um `app` dev service.
- `packages/events-service/src/data-source.ts` — DataSource local para migrations do events.
- `packages/events-service/src/migrations/*` — inclui migration para criação de schemas.
- `scripts/run-migrations.ts` — utilitário para rodar migrations do monólito.
- `scripts/bootstrap-db.sh` — script de bootstrap (cria DB/schemas e roda migrations por package).
- `postgres-init/01-create-db-and-schemas.sql` — script SQL para inicialização automática (montado em docker-compose).

Passo a passo prático (containers)

1) Pré-requisitos

- Instale Docker e Docker Compose.
- Tenha `npx` disponível para rodar comandos Node (usado para migrations via TypeORM).

2) Preparar o ambiente (checkout e variáveis)

No diretório raiz do repo:

```bash
# garanta que você está na branch correta
git checkout new-release

# (opcional) defina variáveis locais no shell para testes rápidos
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=postgres
export DB_PASS=postgres
export DB_NAME=aurora_db
export DB_SCHEMA=events
```

Nota: o `data-source.ts` dos packages usa `dotenv.config()` sem path, então o `.env` carregado depende de onde você executa o comando. Para as aulas, recomendamos manter um `.env` no root e executar os comandos a partir do root.

3) Inicializar o Postgres com scripts de init (primeira vez)

O `docker-compose.yml` foi atualizado para montar `./postgres-init` dentro do container (`/docker-entrypoint-initdb.d`). Coloquei um arquivo `postgres-init/01-create-db-and-schemas.sql` que cria `aurora_db` e os schemas `events`, `users`, `auth`.

Para subir o banco (primeira vez, o SQL será aplicado automaticamente):

```bash
docker compose up -d db
```

Se já existir um volume antigo, os scripts não serão executados — remova o volume se quiser reaplicar:

```bash
docker compose down -v
docker compose up -d db
```

4) Bootstrap idempotente (espera o DB e roda migrations por package)

Use o script `scripts/bootstrap-db.sh` para um fluxo idempotente que:
- espera o Postgres ficar pronto;
- cria `aurora_db` se necessário;
- cria os schemas `events`, `users`, `auth` (IF NOT EXISTS);
- executa as migrations dos packages que expõem `packages/*/src/data-source.ts`.

Como usar:

```bash
chmod +x ./scripts/bootstrap-db.sh
./scripts/bootstrap-db.sh
```

O script também tenta rodar `scripts/run-migrations.ts` (monólito) ao final, se aplicável.

5) Rodar migrations por package (manual)

Se preferir rodar manualmente por package:

```bash
# rodar migrations do events-service (a partir do root - carrega .env do root)
npx typeorm-ts-node-commonjs -d packages/events-service/src/data-source.ts migration:run
```

6) Build e execução do `events-service` em container

Há duas opções para testar o `events-service` em container:

- A) Usar o `app` service já definido no `docker-compose.yml` (monta o repo e roda `npm run start:dev`). Este service é um exemplo e pode ser adaptado para cada package.

  - Para rodar o `app` (dev) com o DB do compose:

  ```bash
  docker compose up -d app
  docker compose logs -f app
  ```

  - Atenção: o `app` do compose é um exemplo genérico. Para criar um container específico para `events-service`, recomendamos criar um `Dockerfile` no `packages/events-service` e um serviço no `docker-compose.yml` que construa essa imagem.

- B) Criar um serviço específico para `events-service`.

  - Exemplo minimal de `docker-compose` service (adicionar ao `docker-compose.yml`):

  ```yaml
  services:
    events:
      build: ./packages/events-service
      container_name: aurora_events
      environment:
        DB_HOST: db
        DB_PORT: 5432
        DB_NAME: aurora_db
        DB_USER: postgres
        DB_PASS: postgres
        DB_SCHEMA: events
      depends_on:
        db:
          condition: service_healthy
      volumes:
        - ./packages/events-service:/app
      command: npm run start:dev
  ```

  - Build + run:

  ```bash
  docker compose up -d --build events-service
  docker compose logs -f events-service
  ```

  Observação: este repositório já inclui um `Dockerfile` exemplo em `packages/events-service/Dockerfile` e o serviço `events-service` foi adicionado ao `docker-compose.yml`. Use os comandos acima para construir/rodar o container (`events-service` expõe a porta 3001 internamente e está mapeado para a porta 3002 no host por padrão).

7) Como adicionar outros services (users, auth)

- Crie `packages/<service>/Dockerfile` que exponha a aplicação (copiar package.json, instalar deps, build/start).
- Adicione `packages/<service>/src/data-source.ts` (ou garanta que existe) e `packages/<service>/src/migrations` com as migrations do serviço.
- Atualize `docker-compose.yml` com um service para o novo package, passando `DB_SCHEMA=<service>` em `environment`.
- Use `scripts/bootstrap-db.sh` para aplicar migrations no novo package.

Boas práticas e checklist para as aulas

- Não use `synchronize: true` em produção; reserve-o apenas para experimentos rápidos em dev.
- Documente e versione migrations por package.
- Defina `DB_SCHEMA` explicitamente por service (via env) para evitar ambiguidade.
- Para reproducibilidade do lab, prefira o `scripts/bootstrap-db.sh` ou `postgres-init/` para evitar passos manuais.

Troubleshooting comum

- Erro: "database \"aurora_db\" does not exist"
  - Solução: rode `docker compose up -d db` ou use `scripts/bootstrap-db.sh`.

- Erro: "schema 'events' does not exist" ou "no schema has been selected to create in"
  - Solução: garanta que `DB_SCHEMA` esteja setado, que o `data-source` defina `extra.options: -c search_path=...` ou crie os schemas antes de rodar migrations (o bootstrap faz isso).

- Erro de `.env` carregado errado
  - Lembre: `dotenv.config()` carrega o `.env` do `process.cwd()`. Execute comandos a partir do root para usar o `.env` do root, ou exporte variáveis explicitamente.

Exercícios práticos para a turma

1) Containerize o `events-service`: crie um `Dockerfile` em `packages/events-service`, adicione um service no `docker-compose.yml` e verifique que o container sobe apontando para `DB_SCHEMA=events`.

2) Crie uma migration no `events-service` que adicione a tabela `events.logs` e rode via `scripts/bootstrap-db.sh`.

3) Adicione um novo package `packages/notifications` com `data-source.ts` e uma migration; atualize `docker-compose.yml` e use o bootstrap para aplicar as migrations.

Referências

- PostgreSQL schemas — https://www.postgresql.org/docs/current/ddl-schemas.html
- TypeORM documentation — https://typeorm.io/

---

Se quiser, eu:
- adapto `docker-compose.yml` para incluir um service `events` pronto para rodar em container;
- gero um `Dockerfile` template em `packages/events-service/Dockerfile`;
- faço pequenos ajustes no `scripts/bootstrap-db.sh` para executar as migrations em ordem fixa (events -> users -> auth).

Diga qual desses itens você quer que eu gere a seguir e eu implemento e testo localmente.

---

## Automatizando o bootstrap (script & init SQL)

Adicionei dois artefatos para facilitar o fluxo de laboratório e evitar passos manuais:

- `postgres-init/01-create-db-and-schemas.sql` — script SQL que será executado automaticamente pelo Postgres na primeira inicialização do volume. Ele cria o database `aurora_db` e os schemas `events`, `users` e `auth`.
- `scripts/bootstrap-db.sh` — script bash que espera o Postgres ficar pronto, cria o database (se necessário), garante os schemas e executa as migrations de cada package que exporta um `data-source` em `packages/<pkg>/src/data-source.ts`.

Como usar

1. Se preferir que o DB e os schemas sejam criados automaticamente na primeira inicialização do container, o `docker-compose.yml` já foi atualizado para montar `./postgres-init` no container Postgres, então basta (na primeira vez):

```bash
docker compose up -d db
```

2. Para um bootstrap idempotente (espera o DB e roda migrations por package) rode o script:

```bash
chmod +x ./scripts/bootstrap-db.sh
./scripts/bootstrap-db.sh
```

O script faz (resumo):
- espera o Postgres responder (usa `pg_isready` dentro do container);
- cria o database `aurora_db` se não existir;
- cria os schemas `events`, `users`, `auth` (idempotente);
- procura por `packages/*/src/data-source.ts` e executa `npx typeorm-ts-node-commonjs -d <data-source> migration:run` para cada package que encontrar;
- tenta também rodar `scripts/run-migrations.ts` (monólito) como passo opcional.

Notas e segurança

- O `postgres-init` só é executado na primeira inicialização do volume do container. Se você já tem um volume com dados, remova o volume com cuidado antes de recriar o compose (ex.: `docker compose down -v`) para que o script SQL seja aplicado.
- O `bootstrap-db.sh` usa `docker compose exec` para executar comandos `psql` dentro do container — funcione onde o compose esteja disponível e o usuário tenha permissão para executar docker.
- Em ambiente de produção não recomendamos criar DBs/schemas automaticamente; isso é específico para o fluxo de laboratório e ensino.

Se quiser eu adapto o `bootstrap-db.sh` para usar `PGPASSWORD`/psql remoto (sem docker) ou para rodar as migrations em paralelo ou em ordem definida (ex.: events -> users -> auth).