
# Implementação do microserviço `registrations-service`

Este documento consolida a investigação (Etapa 1), a modelagem executada (Etapa 2) e o diagnóstico/soluções aplicadas para o build local e execução via Docker.

## Sumário
- Etapa 1: Convenções encontradas nos micros existentes
- Etapa 2: Modelagem da entidade `Registration` (código + migration)
- Diagnóstico e resolução do build local
- Próximos passos (Etapa 3 em diante)

---

## Etapa 1 — Relatório de Convenções (resumo)

- Mono-repo com pacotes em `packages/`.
- Serviços existentes: `auth-service`, `users-service`, `events-service`.
- Cada serviço possui `src/entities`, `src/dto`, `src/migrations`, `src/data-source.ts`, `src/main.ts`.
- IDs: inteiros autoincrement (`SERIAL` / `PrimaryGeneratedColumn` do TypeORM com `int`).
- Timestamps: `timestamptz`, usados via `@CreateDateColumn({ name: 'created_at' })` e `@UpdateDateColumn({ name: 'updated_at' })`.
- Padrão de colunas: misto — optamos por snake_case no DB e mapear explicitamente no entity usando `name:` para compatibilidade com `users`.
- Migrations: arquivos `TIMESTAMP-Description.ts` em `src/migrations/` que criam schema e tabelas com SQL explícito.
- DataSource: cada pacote tem `src/data-source.ts` que lê `DB_SCHEMA` e configura `search_path`.

**Decisões principais:**
- Schema: `registrations`.
- Usar snake_case para nomes de colunas no DB.
- IDs do tipo `int` (autoincrement).
- Criar enum PostgreSQL `registrations.registration_status_enum` com valores em lowercase.

---

## Etapa 2 — Modelagem e Implementação executada

Criei um scaffold mínimo do microserviço em `packages/registrations-service` com os seguintes artefatos:

- `src/entities/registration.entity.ts`
- `src/enums/registration-status.enum.ts`
- `src/migrations/1790000000000-CreateRegistrationsTable.ts`
- `src/data-source.ts`
- `src/dto/create-registration.dto.ts`
- `src/registrations.module.ts`, `src/registrations.service.ts`, `src/registrations.controller.ts`
- `src/main.ts` (porta `3013` em dev)
- `package.json` e `README.md`

### Entity `Registration` (resumo)

- Table: `registrations.registrations`
- Columns (DB / entity mapping): `id`, `user_id`, `event_id`, `status`, `inscription_date`, `cancellation_date`, `origin`, `check_in_done`, `check_in_date`, `created_at`, `updated_at`.
- UNIQUE `(user_id,event_id)` para evitar duplicatas.

### Migration (resumo)

- Cria schema `registrations` se não existir.
- Cria enum `registration_status_enum` com: `'pending'`, `'confirmed'`, `'cancelled'`, `'waitlist'`, `'attended'`, `'no_show'`.
- Cria tabela `registrations.registrations` com colunas e índices apropriados.

---

## Diagnóstico e resolução do build local

- Data: 8 de dezembro de 2025
- Contexto: depois de adicionar o scaffold e o Dockerfile, a tentativa inicial de build da imagem local falhava no estágio runner com um erro de `COPY --from=builder /usr/src/app/dist` não encontrando os artefatos.

### O que foi verificado

1. Rodei build TypeScript localmente:

```bash
npm --prefix packages/registrations-service install
npm --prefix packages/registrations-service run build
ls -la packages/registrations-service/dist
find packages/registrations-service/dist -maxdepth 5 -type f -print
```

2. Inspecionei `packages/registrations-service/tsconfig.json`, `package.json` e `packages/registrations-service/Dockerfile`.
3. Comparei saída com outros serviços (ex.: `packages/users-service/dist`).

### Resultado do diagnóstico

- O TypeScript compilou com sucesso, porém a saída está em `dist/registrations-service/src/...` e `dist/common/...` (o `rootDir` atual produz esta hierarquia). O `Dockerfile` copia `dist` para o runner, então o problema inicial (COPY falhando) só ocorre se o builder realmente não tiver executado `npm run build` ou se houver mismatch de caminhos.
- Depois de confirmar que `npm run build` criou `dist`, reconstruí via `docker compose --build` e o builder passou a produzir `dist`; a cópia para o runner funcionou e o container foi iniciado.

### Estado após as ações

- Build TypeScript: OK — `dist` gerado.
- Docker build + compose: imagem construída e container `aurora-registrations` iniciado.
- O arquivo compilado de bootstrap ficou em `dist/registrations-service/src/main.js` — logo, o `command`/`start` precisa apontar para esse caminho ou o layout do `dist` deve ser ajustado.

## Problemas encontrados e soluções aplicadas

- Falha do COPY do `dist` no Docker:
  - Solução: confirmei/forcei execução de `npm install` e `npm run build` no contexto do pacote para gerar `dist` antes do COPY; então o build Docker completou.

- Layout do `dist` com subpasta `registrations-service`:
  - Solução temporária: usar `node dist/registrations-service/src/main.js` como comando de startup para testes locais.
  - Solução permanente recomendada: ajustar `tsconfig.json` (mudar `rootDir` para `src` ou `.`) para gerar artefatos no layout esperado e padronizar `start`/`start:prod`.

---

## Próximos passos (priorizados)

1. Correção limpa (recomendada): ajustar `packages/registrations-service/tsconfig.json` para alinhar `rootDir` e `outDir` com o padrão dos outros serviços; rodar `npm run build` e testar com `docker compose`.
2. Alternativa imediata: alterar `docker-compose.yml` `command` para `node dist/registrations-service/src/main.js` para habilitar testes rápidos.
3. Adicionar etapas de debug no `Dockerfile` (temporárias), como `RUN ls -la /usr/src/app/dist` logo após o build.
4. Implementar validações de domínio e integrações (Etapa 3): chamadas a `events-service`, `auth-service`, guards e endpoints adicionais.
5. Executar migrations locais (`DB_SCHEMA=registrations`) e rodar smoke tests.
6. Adicionar testes unitários e script de smoke-test no `README.md` do pacote; integrar ao CI.

## Comandos úteis para reproduzir (local)

```bash
# build TypeScript local
npm --prefix packages/registrations-service install
npm --prefix packages/registrations-service run build

# subir só o serviço local via docker-compose
docker compose -f docker-compose.yml up --build --no-deps registrations-service

# ver logs
docker compose -f docker-compose.yml logs -f aurora-registrations

# health check
curl http://localhost:3013/registrations/health
```

## Recomendação imediata

- Recomendo aplicar a correção limpa no `tsconfig.json` do `registrations-service` e validar o build/compose. Se preferir avançar rápido com testes de API, aplico o ajuste temporário no `docker-compose.yml` para o `command` apontar para `dist/registrations-service/src/main.js`.

---

Se desejar que eu aplique agora a correção limpa no `tsconfig` e rode o build/compose, responda com `corrija tsconfig`. Para ajuste rápido no compose, responda com `ajuste compose`.
# Implementação do microserviço `registrations-service`

Este documento consolida a investigação (Etapa 1) e a modelagem executada (Etapa 2) para o novo microserviço de Inscrições (`registrations-service`).

## Sumário
- Etapa 1: Convenções encontradas nos micros existentes
- Etapa 2: Modelagem da entidade `Registration` (código + migration)
- Próximos passos (Etapa 3 em diante)

---

## Etapa 1 — Relatório de Convenções (resumo)

- Mono-repo com pacotes em `packages/`.
- Serviços existentes: `auth-service`, `users-service`, `events-service`.
- Cada serviço possui `src/entities`, `src/dto`, `src/migrations`, `src/data-source.ts`, `src/main.ts`.
- IDs: inteiros autoincrement (`SERIAL` / `PrimaryGeneratedColumn` do TypeORM com `int`).
- Timestamps: `timestamptz`, usados via `@CreateDateColumn({ name: 'created_at' })` e `@UpdateDateColumn({ name: 'updated_at' })`.
- Padrão de colunas: misto — `users` usa snake_case no DB e mapeia com `name: 'created_at'`; `events` migrations usam camelCase entre aspas. Para consistência com `users`, optamos por usar snake_case no DB e mapear explicitamente no entity utilizando `name:`.
- Migrations: arquivos `TIMESTAMP-Description.ts` em `src/migrations/` que criam schema e tabelas com SQL explícito.
- DataSource: cada pacote tem `src/data-source.ts` que lê `DB_SCHEMA` e configura `extra.options: -c search_path=${schema},public`.

**Decisões principais:**
- Schema: `registrations` (in English, conforme solicitado).
- Usar snake_case para nomes de colunas no DB (e mapear com `name:` nos entities).
- IDs do tipo `int` (autoincrement).
- Criar enum PostgreSQL `registrations.registration_status_enum` com valores em lowercase.

---

## Etapa 2 — Modelagem e Implementação executada

Criei um scaffold mínimo do microserviço em `packages/registrations-service` com os seguintes artefatos:

- `src/entities/registration.entity.ts` — Entity TypeORM principal
- `src/enums/registration-status.enum.ts` — enum TypeScript para uso no código
- `src/migrations/1790000000000-CreateRegistrationsTable.ts` — migration TypeORM para criar schema, enum e tabela
- `src/data-source.ts` — DataSource (padrão do projeto)
- `src/dto/create-registration.dto.ts` — DTO de criação
- `src/registrations.module.ts`, `src/registrations.service.ts`, `src/registrations.controller.ts` — scaffolding mínimo de Nest
- `src/main.ts` — ponto de entrada (porta `3013` em dev)
- `package.json` e `README.md`

### Entity `Registration` (resumo)

- Table: `registrations.registrations`
- Columns (DB / entity mapping):
  - `id` (SERIAL PK) → `id: number`
  - `user_id` (int) → `userId: number`
  - `event_id` (int) → `eventId: number`
  - `status` (enum) → `status: RegistrationStatus` (default `'pending'`)
  - `inscription_date` (timestamptz) → `inscriptionDate: Date` (default now())
  - `cancellation_date` (timestamptz, nullable)
  - `origin` (varchar(50), nullable)
  - `check_in_done` (boolean, default false)
  - `check_in_date` (timestamptz, nullable)
  - `created_at`, `updated_at` (timestamptz)

Uma `UNIQUE` constraint foi adicionada no par `(user_id, event_id)` para evitar duplicatas.

### Migration (resumo)

- Cria schema `registrations` se não existir
- Cria `registrations.registration_status_enum` com valores:
  - `'pending'`, `'confirmed'`, `'cancelled'`, `'waitlist'`, `'attended'`, `'no_show'`
- Cria tabela `registrations.registrations` com colunas listadas acima
- Cria índices: único em `(user_id,event_id)`, índices em `event_id` e `user_id` para consultas

### Arquivos adicionados (caminhos)

```
packages/registrations-service/
├─ package.json
├─ README.md
└─ src/
   ├─ data-source.ts
   ├─ main.ts
   ├─ registrations.module.ts
   ├─ registrations.controller.ts
   ├─ registrations.service.ts
   ├─ dto/
   │  ├─ create-registration.dto.ts
   │  └─ index.ts
   ├─ entities/
   │  └─ registration.entity.ts
   ├─ enums/
   │  └─ registration-status.enum.ts
   └─ migrations/
      └─ 1790000000000-CreateRegistrationsTable.ts
```

### Por que cada campo foi escolhido

- `userId`, `eventId`: referências essenciais para ligar usuário e evento. Não há FK constraints diretas aqui porque a arquitetura mantém serviços separados e as referências são validadas via chamadas ao `events`/`users` (decisão arquitetural: manter FK opcionais para deploy independente). Podemos adicionar FK via migration caso desejarmos.
- `status`: representa o estado do vínculo (pendente/confirmada/cancelada/lista de espera/compareceu/não compareceu).
- `inscriptionDate`: momento em que o usuário fez a inscrição (útil para ordenação, filas de espera e auditoria).
- `cancellationDate`: quando cancelado.
- `origin`: para rastrear origem da inscrição (web/mobile/etc.).
- `checkInDone`/`checkInDate`: suporte a controle de presença (check-in).
- timestamps padrão `created_at`/`updated_at`.

---

## Próximos passos (Etapa 3 em diante)

1. Implementar validações de domínio em `RegistrationsService`:
   - Verificar existência do evento (chamar `events-service`).
   - Verificar janela de inscrições (registrationOpensAt/ClosesAt) e capacidade (`capacity`).
   - Verificar duplicidade (já adicionada no DB e no serviço).
2. Adicionar integração com `auth-service` (usar `OwnerId` decorator para pegar `userId` do token e aplicar `AuthGuard`).
3. Implementar endpoints adicionais (PATCH para status, DELETE para cancelamento, POST para check-in) e DTOs correspondentes.
4. Criar migrations adicionais se quisermos adicionar FK direto para `users.users(id)` e `events.events(id)` (recomendo cuidado com deploy e acoplamento entre schemas).
5. Escrever testes unitários e smoke tests (seguindo padrão dos outros micros).

---

## Como rodar localmente (dev)

1. Ajuste as variáveis de ambiente (p.ex. `.env`) para apontar para DB e schema `registrations` ou exporte `DB_SCHEMA=registrations` antes de rodar.
2. Rodar a migration do pacote (modo manual):

```bash
# entrar no container/host com psql e rodar migrations com ts-node ou compilar
npm --prefix packages/registrations-service run build
# executar migration runner (padrão do projeto: manual ou script de migrações do mono-repo)
```

Observação: integrando este serviço ao pipeline de CI/CD seguir o padrão dos outros micros (build, publish images, deploy via docker-compose).

## Build da imagem Docker e publicação (GHCR)

Para testar localmente a imagem Docker ou publicar no GitHub Container Registry (GHCR), siga os passos abaixo.

1) Login no GHCR (caso vá push):

```bash
# Gere um PAT no GitHub com scope `write:packages` (ou use um token com `read:packages`/`write:packages` conforme necessidade)
echo "$GH_PAT" | docker login ghcr.io -u <your-github-username> --password-stdin
```

2) Build local (substitua `your-github-user` pelo seu usuário/organização no GitHub):

```bash
docker build -t ghcr.io/your-github-user/registrations-service:local -f packages/registrations-service/Dockerfile .
```

3) Tag & Push (opcional):

```bash
docker tag ghcr.io/your-github-user/registrations-service:local ghcr.io/your-github-user/registrations-service:latest
docker push ghcr.io/your-github-user/registrations-service:latest
```

### Erro comum no zsh ao usar `<owner>`

Se você executar o comando com o placeholder exatamente como `ghcr.io/<owner>/...` no `zsh`, o shell interpreta `<owner>` como redirecionamento de input e pode retornar um erro como:

```
zsh: no such file or directory: owner
```

Para evitar esse problema, sempre substitua o placeholder por seu usuário/organização real, ou coloque-o entre aspas. Exemplos corretos:

```bash
docker build -t ghcr.io/evertonfoz/registrations-service:local -f packages/registrations-service/Dockerfile .
# ou
docker build -t "ghcr.io/<owner>/registrations-service:local" -f packages/registrations-service/Dockerfile .
```

Também é comum usar variáveis de ambiente para o owner:

```bash
OWNER=evertonfoz
docker build -t ghcr.io/$OWNER/registrations-service:local -f packages/registrations-service/Dockerfile .
```

Incluí estas instruções aqui para registro e para que os alunos/testadores não encontrem o erro de sintaxe do shell.

---

Se quiser, prossigo agora com a Etapa 3 (Design da API REST), implementando controllers/DTOs adicionais e adicionando guards e exemplos de chamadas HTTP. Caso queira que eu ajuste nomes (por exemplo, usar português nos enums) diga e eu adapto.
