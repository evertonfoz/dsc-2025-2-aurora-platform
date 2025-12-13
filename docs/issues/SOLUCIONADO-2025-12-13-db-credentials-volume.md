# [SOLUCIONADO] Problemas de Credenciais e Volume do PostgreSQL

**Data:** 13/12/2025
**Status:** ✅ Resolvido

## Problema Relatado

Sempre que eram feitas atualizações nos serviços e os containers eram levantados, ocorriam erros recorrentes de acesso ao banco de dados:
- Usuário inválido
- Senha incorreta
- Problemas na execução de migrations

A única solução era remover manualmente o volume do PostgreSQL com `docker compose down -v`.

## Análise dos Problemas Encontrados

### 1. Volume Persistente do PostgreSQL ⚠️ (Problema Principal)

**Causa Raiz:**
Os scripts de inicialização em `postgres-init/` **só são executados quando o volume está vazio** (primeira inicialização). Se o volume `pgdata` já existe com credenciais antigas, o PostgreSQL:
- **NÃO re-executa** os scripts de `/docker-entrypoint-initdb.d`
- Mantém as credenciais antigas do volume existente
- Não cria schemas ou extensões necessárias

**Impacto:**
- Credenciais no `.env` não surtem efeito se o volume já existe
- Schemas não são criados, causando erros nas migrations
- Extensões como `citext` ficam ausentes

### 2. Configurações Incorretas nos DataSources 🐛

**Arquivos Afetados:**
- `packages/events-service/src/data-source.ts`
- `packages/auth-service/src/data-source.ts`

**Problemas Identificados:**

#### events-service/src/data-source.ts
```typescript
// ❌ ANTES (ERRADO)
database: process.env.DB_NAME ?? 'aurora_users',  // Database incorreto!
schema: process.env.DB_SCHEMA ?? 'public',        // Schema incorreto!
host: process.env.DB_HOST ?? 'localhost',         // Host incorreto para container!
extra: { options: `-c search_path=${process.env.DB_SCHEMA ?? 'public'}` }  // Faltando 'public'

// ✅ DEPOIS (CORRETO)
database: process.env.DB_NAME ?? 'aurora_db',
schema: process.env.DB_SCHEMA ?? 'events',
host: process.env.DB_HOST ?? 'db',
extra: { options: `-c search_path=${schema},public` }  // Inclui 'public' para citext
```

#### auth-service/src/data-source.ts
```typescript
// ❌ ANTES (ERRADO)
schema: process.env.DB_SCHEMA ?? 'public',        // Schema incorreto!
host: process.env.DB_HOST ?? 'localhost',         // Host incorreto para container!
extra: { options: `-c search_path=${process.env.DB_SCHEMA ?? 'public'}` }

// ✅ DEPOIS (CORRETO)
schema: process.env.DB_SCHEMA ?? 'auth',
host: process.env.DB_HOST ?? 'db',
extra: { options: `-c search_path=${schema},public` }
```

### 3. search_path Sem 'public' 🔍

**Arquivo:** `packages/events-service/src/app.module.ts:71`

**Problema:**
```typescript
// ❌ ANTES
extra: { options: `-c search_path=${schema}` }

// ✅ DEPOIS
extra: { options: `-c search_path=${schema},public` }
```

**Por que isso importa:**
A extensão `citext` (case-insensitive text) está no schema `public`. Sem incluir `public` no `search_path`, o TypeORM não consegue encontrar a extensão, causando erros em queries que usam campos de email.

### 4. registrations-service Sem TypeORM ⚙️

**Arquivo:** `packages/registrations-service/src/registrations.module.ts`

**Problema:**
O módulo tinha configuração, mas não importava o `TypeOrmModule.forRootAsync()`, impedindo a conexão ao banco.

**Solução:**
Adicionado configuração completa do TypeORM ao módulo, seguindo o mesmo padrão dos outros serviços.

### 5. Credenciais Inconsistentes Entre Ambientes 🔐

**Problema:**
- `docker-compose.dev.yml`: Credenciais hardcoded diretamente no YAML
- `docker-compose.prod.yml` e `deploy.yml`: Credenciais via variáveis do `.env.prod`

**Impacto:**
Inconsistência ao migrar código entre ambientes e dificuldade em manter credenciais sincronizadas.

## Soluções Implementadas

### ✅ 1. Padronização de Credenciais nos Compose Files

**Todos os compose files agora usam variáveis de ambiente:**

```yaml
db:
  env_file:
    - .env  # ou .env.prod para prod/deploy
  environment:
    POSTGRES_USER: ${DB_USER:-postgres}
    POSTGRES_PASSWORD: ${DB_PASS:-postgres}
    POSTGRES_DB: ${DB_NAME:-aurora_db}
```

### ✅ 2. Documentação Clara Sobre Volume

**Adicionado em todos os compose files:**

```yaml
db:
  # IMPORTANT: If you change DB credentials in .env, you MUST remove the volume:
  #   docker compose -f docker-compose.dev.yml down -v
  # Otherwise, Postgres will keep using the old credentials from the existing volume.
```

### ✅ 3. Correção de Todos os DataSources

- Valores default corretos para database, schema e host
- `search_path` incluindo `public` para acesso à extensão `citext`
- Consistência entre todos os serviços

### ✅ 4. Adição de TypeORM ao registrations-service

Configuração completa adicionada ao módulo com:
- `migrationsRun: true` para executar migrations automaticamente
- `search_path` incluindo `public`
- Configuração via `ConfigService` com validação Joi

### ✅ 5. Adição do registrations-service ao docker-compose.prod.yml

O serviço estava faltando no compose de produção e foi adicionado com todas as configurações necessárias.

## Procedimento Correto de Uso

### Primeira Inicialização ou Reset Completo

```bash
# Remove containers e volumes (dados serão perdidos!)
docker compose -f docker-compose.dev.yml down -v

# Build e inicialização
docker compose -f docker-compose.dev.yml up -d --build

# Verificar logs
docker compose -f docker-compose.dev.yml logs -f
```

### Atualização Normal (Sem Mudança de Credenciais)

```bash
# Rebuild apenas
docker compose -f docker-compose.dev.yml up -d --build
```

### Se Mudar Credenciais no .env

```bash
# OBRIGATÓRIO: Remover volume para PostgreSQL aceitar novas credenciais
docker compose -f docker-compose.dev.yml down -v

# Rebuild e up
docker compose -f docker-compose.dev.yml up -d --build
```

## Prevenção de Problemas Futuros

### ⚠️ Regra de Ouro

**SE ALTERAR CREDENCIAIS NO `.env`, SEMPRE EXECUTE:**
```bash
docker compose -f docker-compose.dev.yml down -v
```

### ✅ Checklist Antes de Subir Containers

1. [ ] Credenciais no `.env` estão corretas
2. [ ] Se mudou credenciais, removeu o volume com `-v`
3. [ ] Todos os serviços têm `DB_SCHEMA` correto no compose
4. [ ] Scripts de init estão em `postgres-init/`

### 📋 Diagnóstico de Problemas

Se encontrar erros de autenticação:

```bash
# 1. Verificar logs do banco
docker compose -f docker-compose.dev.yml logs db

# 2. Verificar se volume existe
docker volume ls | grep pgdata

# 3. Se houver volume antigo, remover e reiniciar
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d --build
```

## Arquivos Modificados

### Correções de Código
- ✅ `packages/events-service/src/data-source.ts` - Database, schema, host e search_path
- ✅ `packages/auth-service/src/data-source.ts` - Schema, host e search_path
- ✅ `packages/events-service/src/app.module.ts` - search_path incluindo public
- ✅ `packages/registrations-service/src/registrations.module.ts` - Adição de TypeORM

### Compose Files
- ✅ `docker-compose.dev.yml` - Credenciais via variáveis + documentação
- ✅ `docker-compose.prod.yml` - Adição de registrations-service + documentação
- ✅ `docker-compose.deploy.yml` - Documentação sobre volume

## Resultado Esperado

Após aplicar todas as correções:

1. ✅ Credenciais consistentes em todos os ambientes
2. ✅ Volume gerenciado de forma previsível
3. ✅ Migrations executam sem erros
4. ✅ Extensão `citext` acessível em todos os schemas
5. ✅ Todos os 4 serviços conectam ao banco corretamente
6. ✅ Não é mais necessário remover volume frequentemente (apenas quando mudar credenciais)

## Lições Aprendidas

1. **Volumes persistentes do Docker** mantêm estado entre execuções - incluindo credenciais do PostgreSQL
2. **Scripts de init** só rodam quando o volume está vazio
3. **search_path** precisa incluir `public` quando há extensões como `citext`
4. **Defaults em DataSource** devem ser apropriados para ambiente de container (`db` não `localhost`)
5. **Documentação clara** previne erros operacionais

## Referências

- [PostgreSQL Docker Official Image - Initialization scripts](https://hub.docker.com/_/postgres)
- [Docker Compose - Volumes](https://docs.docker.com/compose/compose-file/07-volumes/)
- [TypeORM - PostgreSQL Schema Support](https://typeorm.io/connection-options#postgres--cockroachdb-connection-options)
