# Revisão de arquitetura e práticas NestJS – 12/12/2025

## Contexto
- Plataforma acadêmica com múltiplos microsserviços NestJS (`packages/auth-service`, `users-service`, `events-service`, `registrations-service`) compartilhando um Postgres único via schemas lógicos (compose principal em `docker-compose.yml`).
- Objetivo: identificar pontos de melhoria em arquitetura de microsserviços e uso de NestJS/TypeORM/axios/segurança, sugerindo ações priorizadas.

## Achados principais
- **Comunicação e resiliência:** chamadas HTTP diretas sem timeout/circuit-breaker/retry e com URL default divergente do compose (`packages/auth-service/src/users-http.client.ts` usa `http://users:3000` enquanto o compose expõe `users-service:3011`). Falta padronização de contrato, autenticação mútua e observabilidade de requests.
- **Configuração e secrets:** uso direto de `process.env` com `||` em alguns serviços (`packages/events-service/src/app.module.ts`) e sem `ConfigModule`/validação de schema. Segredos são injetados via `.env` comum no compose, sem segregação por serviço ou variáveis obrigatórias validadas.
- **Banco e isolação:** todos os serviços compartilham o mesmo Postgres e database, mudando apenas o schema; falha de um serviço ou migração pode afetar os demais. `migrationsRun: true` em runtime aumenta risco de drift e tempos de boot.
- **Segurança:** ausência de rate limiting/CORS/Helmet configurados nos bootstraps (ex.: `packages/events-service/src/main.ts`, `packages/users-service/src/main.ts`). Token de serviço em header simples (`x-service-token`) sem verificação centralizada nem rotação. `DEV_AUTO_AUTH` no `registrations-service` habilita user fake em dev, mas não há guard rails para produção.
- **Observabilidade:** não há tracing/metrics ou correlação de logs. Logging pouco estruturado e com `try/catch` silencioso (ex.: `packages/events-service/src/events.service.ts`), dificultando troubleshooting.
- **Saúde e readiness:** apenas `events-service` traz `HealthController`; demais carecem de endpoints de liveness/readiness padronizados e checks de dependências (DB/serviços externos).
- **Boas práticas NestJS:** falta `ConfigModule` global, pipes/filters/interceptors compartilhados via módulo comum; validação e padronização de respostas variam entre serviços. `registrations-service` inicializa TypeORM fora do lifecycle Nest (em `main.ts`), perdendo DI/health integrados.

## Recomendações (rápidas – 1 a 3 dias)
- Ajustar URLs dos clientes internos e adicionar timeout + retries exponencial em `axios` com headers/service-token padronizados (`packages/auth-service/src/users-http.client.ts`).
- Introduzir `ConfigModule` + `ConfigService` em todos os serviços com validação via `Joi`/`zod` e defaults usando `??`, removendo `process.env ||` diretos (ex.: `packages/events-service/src/app.module.ts`).
- Adicionar middleware de segurança (`helmet`, `cors`, rate limiting) e pipes/filters globais unificados (aproveitar `@aurora/common`).
- Criar endpoints `/health` e `/ready` para todos os serviços com checks de DB e dependências HTTP.
- Desativar `migrationsRun` em runtime; executar migrations via job/CI ou script de entrypoint antes do start.
- Remover `DEV_AUTO_AUTH` de ambientes não-dev e condicionar via flag segura; adicionar guard para impedir uso em prod.

## Recomendações (estruturais – 1 a 4 semanas)
- Avaliar separar bancos ou pelo menos instâncias lógicas/creds distintos por serviço; mover para migrações gerenciadas e versionadas por serviço (sem auto-run em produção).
- Adotar observabilidade: OpenTelemetry (tracing) + métricas (Prometheus) + correlação de request-ids; padronizar logger estruturado com contexto (service, requestId, userId).
- Padronizar comunicação assíncrona/event-driven onde couber (ex.: inscrições, publicação de eventos) usando broker (Redis/Kafka/Rabbit) e contratos claros; manter HTTP apenas para queries síncronas.
- Introduzir API Gateway/BFF para roteamento, autenticação central e throttling, evitando exposição direta de cada serviço.
- Implementar validação de schemas de payload/resposta (class-validator + DTOs) e error envelopes consistentes entre serviços.
- Rever estratégia de tokens de serviço (rotação, TTL, mutual TLS entre serviços ou assinaturas JWT com audience/issuer).

## Próximos passos sugeridos
1) Corrigir cliente de usuários + timeouts/retries; 2) Centralizar config/validação e segurança básica; 3) Padronizar health/readiness e desligar migrations auto-run; 4) Planejar observabilidade e isolamento de dados; 5) Definir roadmap para mensageria/API Gateway e hardening de auth interna.

## Perguntas frequentes (material didático)

- **Por que existe `USERS_API_URL` e só no auth-service?** Porque o auth-service depende do serviço de usuários para validar credenciais e montar o payload do access token. É o único cliente HTTP direto para `users-service`, então precisa parametrizar a URL. Os demais serviços não chamam `users-service` via HTTP hoje, portanto não precisam dessa env. Se outros serviços passarem a consumir outro serviço, siga o mesmo padrão: cliente dedicado por domínio com `SERVICE_X_API_URL` + timeout/retry/backoff e service token.
  
- **Qual deve ser o valor correto de `USERS_API_URL`?** No compose atual, o hostname de serviço é `users-service` e a porta interna é `3011`; use `http://users-service:3011`. O fallback atual (`http://users:3000`) é inconsistente e deve ser removido ou mantido apenas como valor de desenvolvimento local explícito.
  
- **Cada microsserviço expondo porta no host é correto?** Em desenvolvimento local, é aceitável mapear portas para testes manuais. Em produção (ou ambientes compartilhados), o ideal é não expor cada serviço diretamente; manter apenas o gateway/ingress exposto e comunicar os serviços internamente via rede do cluster/compose sem port bindings (`ports:`) ou com `expose:` apenas para saúde interna. Isso reduz superfície de ataque e força a passagem por autenticação/observabilidade centralizadas.

## Ação imediata aplicada (portas e compose)
- `docker-compose.prod.yml` e `docker-compose.deploy.yml` foram ajustados para não expor portas dos serviços de aplicação; comunicação segue interna na rede `aurora_network`. `docker-compose.dev.yml` continua expondo portas para desenvolvimento e testes manuais.
- Os guias de deploy serão atualizados para frisar que em prod/stage o tráfego externo deve passar por gateway/ingress, não por binds de porta individuais.

## Plano prático (para alunos aplicarem)
1) **Ambientes:** mantenha portas expostas só em `docker-compose.dev.yml` para desenvolvimento; em prod/stage remova `ports:` e, se necessário, use `expose:` para health interno.  
2) **Cliente interno:** configure `USERS_API_URL=http://users-service:3011` (compose já referencia) e aplique timeout (3–5s) + retries com backoff no cliente HTTP; remova fallbacks inconsistentes.  
3) **Docs de deploy:** registre nos guias que serviços não ficam expostos em prod e que todo acesso externo deve passar pelo gateway/ingress (ou reverse proxy).  
4) **Gateway/ingress (planejamento):** adotar um gateway (Nginx/Traefik/API Gateway) para: roteamento por host/path, TLS, rate limiting, autenticação centralizada e observabilidade. Passos mínimos: definir domínios/paths, terminar TLS, propagar request-id, checar `/health`/`/ready` internos e embarcar a configuração no compose de produção (há Nginx em `production/docker-compose.prod.yml` como referência).

## Caso pedagógico 01 — Exposição de portas em produção

- **Problema identificado:** os microsserviços expunham portas diretamente no host em arquivos de produção (`docker-compose.prod.yml`, `docker-compose.deploy.yml`). Isso amplia a superfície de ataque, bypassa autenticação/observabilidade centralizadas e dificulta padronizar TLS/rate limiting.
- **Impacto potencial:** acesso direto a serviços sem passar por gateway; exploração de endpoints internos; métricas/tracing/logs não centralizados; maior custo de manutenção de certificados e regras de segurança em múltiplos pontos.
- **Solução fundamentada:** em produção, apenas o gateway/ingress deve expor portas públicas. Os serviços de aplicação devem comunicar-se pela rede interna do cluster/compose. Para troubleshooting ou saúde interna, use `expose:` (não mapeia porta no host). Essa prática segue o padrão de 12-factor, defense-in-depth e simplifica o hardening (TLS, WAF, rate limiting, auth) concentrados no gateway.
- **Implementações (delta):**
  - `docker-compose.prod.yml`: removidos todos os blocos `ports:` de `users-service`, `auth-service`, `events-service`. Agora os serviços só escutam na rede interna `aurora_network`.
  - `docker-compose.deploy.yml`: removidos `ports:` de `users-service`, `auth-service`, `events-service`, `registrations-service`. Comunicação permanece interna.
- **Efeito prático:** tráfego externo não alcança diretamente os microsserviços; exige gateway/reverse proxy para acesso público, reduzindo exposição e forçando passagem por autenticação/observabilidade centralizadas. Dev/QA continuam podendo expor portas em `docker-compose.dev.yml` para testes locais.
- **Status:** concluído; arquivos `docker-compose.prod.yml` e `docker-compose.deploy.yml` conferidos sem blocos `ports:` para serviços de aplicação.

## Caso pedagógico 02 — Falha de autenticação no Postgres e migrações não aplicadas

- **Problema identificado:** credenciais de DB inconsistentes (`DB_PASS` vs `DB_PASSWORD` em `docker-compose.prod.yml`) e volume de dev com senha antiga. Além disso, a execução de migrações do users-service a partir do container falhava porque o caminho do data-source compilado não era usado.
- **Impacto potencial:** serviços reiniciando por erro de senha, indisponibilidade em dev/prod, tabelas ausentes (`relation "users.users" does not exist`), seeds não aplicados, ambiente instável para testes e aulas.
- **Solução fundamentada:** padronizar nome de variável (`DB_PASS`) em compose e código (TypeORM usa `DB_PASS`). Em dev, quando permitido perder dados, resetar o volume para alinhar a senha; em seguida rodar migrações com o data-source compilado. Proceder sempre com migrations antes de validar health.
- **Implementações (delta):**
  - `docker-compose.prod.yml`: alterado `DB_PASSWORD` → `DB_PASS` em todos os serviços para alinhar com `process.env.DB_PASS` no código.
  - Dev: `docker compose -f docker-compose.dev.yml down -v` para recriar volume com senha `postgres`; subida com `docker compose -f docker-compose.dev.yml up -d`.
  - Migrações (users-service): `docker compose -f docker-compose.dev.yml run --rm users-service npx typeorm-ts-node-commonjs -d dist/app/src/data-source.js migration:run` usando o data-source compilado.
- **Efeito prático:** serviços sobem com credenciais corretas, tabelas criadas e seeds aplicados; health do events-service responde 200 (via IPv4). O fluxo de migração fica documentado para dev, reduzindo reincidência do erro.
- **Status:** concluído; compose atual padronizado com `DB_PASS` e `.env.prod` alinhada, comando de migração documentado permanece válido.

## Caso pedagógico 03 — Cliente de usuários no auth-service

- **Problema identificado:** cliente HTTP usava fallback inconsistente (`http://users:3000`), sem timeout ou retries, e montava headers a cada chamada sem validar `SERVICE_TOKEN`.
- **Impacto potencial:** indisponibilidade do serviço de autenticação em caso de latência/restart do users-service, risco de chamadas sem token de serviço e endpoints inválidos em produção.
- **Solução fundamentada:** remover fallback e padronizar a URL interna (`http://users-service:3011`), criar instância axios única com timeout (5s), retries exponenciais e header `x-service-token` obrigatório (fail-fast).
- **Implementações (delta):**
  - `.env.prod` e compose (prod/deploy) já usam `USERS_API_URL=http://users-service:3011`.
  - `packages/auth-service/src/users-http.client.ts`: usa baseURL consistente, cria client axios com timeout 5s e retries (3 tentativas, backoff), exige `SERVICE_TOKEN` na construção e reaproveita header em todas as chamadas.
- **Efeito prático:** chamadas internas ao users-service tornam-se mais resilientes e consistentes; falha explícita se faltar token de serviço.
- **Status:** concluído. Próximas melhorias (opcional): adicionar logs/métricas das tentativas e validar contrato de resposta com DTO/schema.

## Caso pedagógico 04 — Config/validação e segurança básica (auth/users/events/registrations)

- **Problema identificado:** uso direto de `process.env` com `||`, ausência de validação de variáveis e bootstraps sem proteção mínima (helmet/cors/rate limit) em todos os serviços NestJS, abrindo margem para falhas de configuração e abuso de requisições.
- **Impacto potencial:** subida com envs faltantes/errados (tokens, DB), falta de CORS e cabeçalhos de segurança, risco de saturação por ausência de rate limiting.
- **Solução fundamentada:** adotar `ConfigModule` global com schema (Joi), defaults via `??`, ler envs via `ConfigService`; aplicar `helmet`, `enableCors` parametrizado e middleware de rate limit simples com TTL/limite configuráveis; guardar rate limiting também via `ThrottlerGuard` quando a dependência estiver disponível.
- **Implementações (delta):**
  - `packages/auth-service/src/app.module.ts` e `src/main.ts`: ConfigModule global com validação (PORT, DB_*, JWTs, SERVICE_TOKEN, USERS_API_URL, RATE_LIMIT_*), ThrottlerModule/guard, TypeORM assíncrono com ConfigService, helmet/CORS/rate limit in-memory.
  - `packages/users-service/src/app.module.ts` e `src/main.ts`: ConfigModule global (PORT, DB_*, JWTs, SERVICE_TOKEN, RATE_LIMIT_*), ThrottlerModule/guard, TypeORM e JWT usando ConfigService, helmet/CORS/rate limit in-memory.
  - `packages/events-service/src/app.module.ts` e `src/main.ts`: ConfigModule global (PORT, DB_*, JWTs, SERVICE_TOKEN, RATE_LIMIT_*), ThrottlerModule/guard, TypeORM e JWT via ConfigService, helmet/CORS/rate limit in-memory.
  - `packages/registrations-service/src/registrations.module.ts` e `src/main.ts`: ConfigModule global (PORT, DB_*, SERVICE_TOKEN, RATE_LIMIT_*, DEV_AUTO_AUTH), ThrottlerModule/guard, helmet/CORS/rate limit in-memory.
  - Dependências adicionadas nos package.json dos serviços: `@nestjs/throttler`, `joi`, `helmet` (não foi atualizado o package-lock).
- **Efeito prático:** startup falha rápido se envs críticos faltarem, headers de segurança e CORS ficam ativos, requisições limitadas por janela, reduzindo abuso acidental.
- **Status:** concluído nos quatro serviços. Pendência: trocar o middleware custom de rate limit pelo interceptor do `@nestjs/throttler` com storage externo (ex.: Redis/memory compartilhada) quando disponível, e adicionar logs/métricas das tentativas.

  **Complemento operacional:** durante a validação prática neste repositório identificaram-se dois pontos operacionais que vale explicitar no caso pedagógico:

  - O uso do `@nestjs/throttler` requer atenção à ordem de inicialização e às opções fornecidas ao módulo — o guard pode lançar erros em `onModuleInit` se as opções (`ttl` / `limit`) não existirem no tempo de inicialização. Documentar claramente a necessidade de importar o `ConfigModule` antes do `ThrottlerModule.forRootAsync` e de fornecer valores default/defensivos para evitar falhas em ambiente de bootstrap.
  - Reforçar que `migrationsRun: true` não é prática segura para produção. Incluir instruções operacionais para executar migrations por script/CI/entrypoint controlado (ordem sugerida: rodar migrations → executar smoke tests mínimos → iniciar processo de aplicação) e destacar como evitar downtime por migrations longas.

  Além disso, recomenda-se explicitar no texto do caso que a correção deve ser aplicada de forma incremental: validar a configuração e o Throttler em um serviço de prova de conceito (POC) antes de propagar para todos os serviços, e documentar passos de rollback caso algo cause indisponibilidade. Essas observações ajudam alunos a entender trade-offs práticos entre segurança, disponibilidade e operabilidade.

  **Correções adicionais aplicadas em 13/12/2025:**

  Durante a implementação prática, foram identificados e corrigidos problemas críticos de configuração que causavam falhas recorrentes de acesso ao banco de dados:

  1. **Data-sources com configurações incorretas:**
     - `packages/events-service/src/data-source.ts`: database default era `aurora_users` (deveria ser `aurora_db`), schema default era `public` (deveria ser `events`), host default era `localhost` (deveria ser `db` para ambiente containerizado).
     - `packages/auth-service/src/data-source.ts`: schema default era `public` (deveria ser `auth`), host default era `localhost` (deveria ser `db`).
     - **Solução:** padronizados defaults corretos e adicionado `public` ao `search_path` em `extra.options` para garantir acesso à extensão `citext`.

  2. **search_path incompleto em app.module:**
     - `packages/events-service/src/app.module.ts`: TypeORM configurado sem incluir schema `public` no `search_path`, impedindo acesso à extensão `citext` (case-insensitive text) criada em `postgres-init/`.
     - **Solução:** alterado de `-c search_path=${schema}` para `-c search_path=${schema},public`.

  3. **TypeORM ausente no registrations-service:**
     - `packages/registrations-service/src/registrations.module.ts`: módulo não importava `TypeOrmModule.forRootAsync`, apesar de ter migrations e data-source definidos.
     - **Solução:** adicionada configuração completa do TypeORM seguindo o mesmo padrão dos outros serviços.

  4. **Credenciais hardcoded vs variáveis de ambiente:**
     - `docker-compose.dev.yml`: credenciais do PostgreSQL estavam hardcoded, enquanto os compose de prod/deploy usavam variáveis do `.env.prod`, criando inconsistência.
     - **Solução:** padronizado uso de variáveis `${DB_USER}`, `${DB_PASS}`, `${DB_NAME}` em todos os compose files com documentação clara sobre gerenciamento de volumes.

  5. **Problema de volume persistente do PostgreSQL (causa raiz):**
     - Scripts de `postgres-init/` **só executam quando o volume está vazio**. Se o volume `pgdata` já existe com credenciais antigas, o PostgreSQL não re-executa os scripts, mantendo credenciais antigas e não criando schemas/extensões necessárias.
     - **Impacto:** mudanças no `.env` não surtiam efeito, causando erros de autenticação e tabelas não encontradas, forçando remoção manual frequente do volume.
     - **Solução:** documentação clara em todos os compose files alertando que ao alterar credenciais é obrigatório executar `docker compose down -v` para remover o volume. Ver `docs/issues/SOLUCIONADO-2025-12-13-db-credentials-volume.md` para análise completa.

  6. **Crash no seed de usuários antes das migrations:**
     - `packages/users-service/src/users.service.ts`: `onModuleInit` tentava fazer query no banco para seed de usuários, mas crashava se migrations não tivessem sido executadas ainda (tabela não existe).
     - **Solução:** envolvido todo bloco de seeding em `try-catch` com log de warning ao invés de crash, permitindo que o serviço suba mesmo se tabelas não existirem ainda.

  7. **registrations-service ausente no compose de produção:**
     - `docker-compose.prod.yml`: serviço não estava listado, causando deploy incompleto.
     - **Solução:** adicionado registrations-service com todas as configurações necessárias.

  **Aprendizados operacionais:**
  - Volumes persistentes do Docker mantêm estado entre execuções, incluindo credenciais do PostgreSQL. Scripts de init só rodam em volume vazio.
  - Defaults em DataSource devem ser apropriados para ambiente de container (`db` não `localhost`), evitando falhas de conexão.
  - search_path do PostgreSQL deve incluir `public` quando há extensões (como `citext`) que residem nesse schema.
  - Seed automático em `onModuleInit` deve ser defensivo com try-catch para evitar crash em race condition com migrations.
  - Documentação inline em arquivos de infraestrutura (compose) é crucial para prevenir erros operacionais recorrentes.

  **Documentação detalhada:** `docs/issues/SOLUCIONADO-2025-12-13-db-credentials-volume.md`

  8. **ThrottlerModule v6.0 - Breaking change na configuração (afetou todos os 4 serviços):**
     - **Problema:** Atualização do `@nestjs/throttler` para versão 6.0 mudou a estrutura de configuração. A versão antiga aceitava `{ ttl, limit }` diretamente, mas a v6.0 exige um array `throttlers: [{ ttl, limit }]` e o TTL passou de segundos para milissegundos.
     - **Erro observado:** `TypeError: Cannot read properties of undefined (reading 'sort')` em `ThrottlerGuard.onModuleInit`.
     - **Causa raiz:** Configuração antiga não fornecia o objeto esperado pelo guard, causando crash durante inicialização do módulo.
     - **Solução aplicada em todos os serviços:**
       ```typescript
       // ANTES (v5 - causava crash na v6)
       ThrottlerModule.forRootAsync({
         inject: [ConfigService],
         useFactory: (config: ConfigService) => ({
           ttl: Number(config.get<number>('RATE_LIMIT_TTL')) ?? 60,
           limit: Number(config.get<number>('RATE_LIMIT_LIMIT')) ?? 100,
         }),
       })

       // DEPOIS (v6 - estrutura correta)
       ThrottlerModule.forRootAsync({
         inject: [ConfigService],
         useFactory: (config: ConfigService) => ({
           throttlers: [{
             ttl: (Number(config.get<number>('RATE_LIMIT_TTL')) ?? 60) * 1000, // milissegundos
             limit: Number(config.get<number>('RATE_LIMIT_LIMIT')) ?? 100,
           }],
         }),
       })
       ```
     - **Arquivos corrigidos:**
       - `packages/auth-service/src/app.module.ts:35-42`
       - `packages/users-service/src/app.module.ts:35-42`
       - `packages/events-service/src/app.module.ts:35-42`
       - `packages/registrations-service/src/registrations.module.ts:31-38`

  9. **registrations-service - Polyfill crypto para Node 18:**
     - **Problema:** `@nestjs/typeorm` v11 usa `crypto.randomUUID()` que não está disponível no escopo global do Node 18, causando `ReferenceError: crypto is not defined`.
     - **Causa raiz:** NestJS 11 requer Node 20+, mas registrations-service estava configurado para Node 18 no Dockerfile.
     - **Solução imediata:** Adicionado polyfill que injeta `require('crypto')` no `globalThis` antes de importar módulos do NestJS.
     - **Arquivos criados/modificados:**
       - `packages/registrations-service/src/polyfill-crypto.ts` (novo arquivo)
       - `packages/registrations-service/src/main.ts:1` - adicionado `import './polyfill-crypto'` como primeira linha
     - **Solução definitiva recomendada:** Atualizar Dockerfile para `FROM node:20-alpine` (já implementado em outros serviços).

  10. **users-service - Path de compilação TypeScript incorreto:**
      - **Problema:** O `tsconfig.json` com `rootDir: ".."` compila código para `dist/app/src/`, mas os scripts `start` e `start:prod` no `package.json` apontavam para `dist/src/` ou `dist/users-service/src/`, causando erro `Cannot find module`.
      - **Impacto:** Mesmo após rebuild completo com `--no-cache`, o serviço não iniciava porque o caminho estava errado.
      - **Solução:** Atualizado package.json para usar o caminho correto:
        ```json
        "start": "node dist/app/src/main.js",
        "start:prod": "node dist/app/src/main.js"
        ```
      - **Lição aprendida:** `rootDir` no tsconfig influencia a estrutura de diretórios no `outDir`. Sempre validar que scripts npm apontam para o caminho correto após mudanças no tsconfig.

  11. **Docker build cache - Compilação incremental do TypeScript:**
      - **Problema:** Mesmo usando `docker build --no-cache`, o código compilado dentro do container estava desatualizado. Mudanças no código fonte TypeScript não apareciam no build final.
      - **Causa raiz:** O `.dockerignore` bloqueia `dist/`, mas o tsconfig tinha `incremental: true`, criando `tsconfig.tsbuildinfo` que persistia localmente. O Docker copiava código fonte, mas a compilação incremental reutilizava cache antigo.
      - **Solução:** Remover `dist/` e `tsconfig.tsbuildinfo` localmente antes de rebuild:
        ```bash
        rm -rf packages/users-service/dist
        rm -f packages/users-service/tsconfig.tsbuildinfo
        docker compose build users-service --no-cache
        ```
      - **Prevenção futura:** Adicionar script de "clean build" no package.json que remove artefatos antes de compilar.

  **Validação final realizada em 13/12/2025:**
  - ✅ Todos os 4 serviços (auth, users, events, registrations) inicializam corretamente
  - ✅ Health checks respondendo em todas as portas (3010, 3011, 3012, 3013)
  - ✅ PostgreSQL com schemas corretos e extensão citext disponível
  - ✅ Migrations executam automaticamente via `migrationsRun: true`
  - ✅ Seeding de usuários (admin e test) funciona sem crash
  - ✅ ThrottlerGuard ativo em todos os serviços sem erros
  - ✅ Nenhum erro de "relation does not exist" ou "crypto is not defined"
