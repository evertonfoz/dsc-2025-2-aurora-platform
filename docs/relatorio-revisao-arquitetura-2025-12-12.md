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
- `docker-compose.dev.yml` removeu `ports:` dos serviços de aplicação e mantém apenas o gateway Nginx publicado em `8080:80` (TLS opcional comentado). Todo acesso em dev passa pelo gateway.
- `docker-compose.prod.yml` e `docker-compose.deploy.yml` seguem sem `ports:` nos serviços e agora incluem o gateway Nginx publicado em `80:80` (TLS opcional comentado). Comunicação entre serviços é interna na `aurora_network`.
- Os guias de deploy serão atualizados para frisar que em prod/stage o tráfego externo deve passar por gateway/ingress, não por binds de porta individuais.

## Plano prático (para alunos aplicarem)
1) **Ambientes:** em dev, acessar serviços via gateway em `http://localhost:8080` (sem `ports:` individuais); em prod/stage remover `ports:` e, se necessário, usar `expose:` para health interno, mantendo apenas o gateway publicado.  
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
  - `docker-compose.dev.yml`: removidos `ports:` dos quatro serviços de aplicação; o acesso passa pelo gateway em `8080:80` (TLS opcional comentado).
- **Efeito prático:** tráfego externo não alcança diretamente os microsserviços; exige gateway/reverse proxy para acesso público, reduzindo exposição e forçando passagem por autenticação/observabilidade centralizadas. Em dev/QA o acesso também passa pelo gateway (`http://localhost:8080`); reexpor portas individuais deve ser algo temporário para debugging.
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

## Execução 15/12/2025 — Teste do docker-compose.deploy (ploy)
- Issue dedicada: `docs/issues/2025-12-15-testes-compose-deploy.md`; branch `issue/2025-12-15-testes-compose-deploy`.
- Derrubamos o stack de dev com `docker compose -f docker-compose.dev.yml down` para liberar portas/recursos antes do teste de deploy.
- 1ª tentativa de `docker compose -f docker-compose.deploy.yml up -d` falhou por variáveis não exportadas no shell (imagens com `REPO_OWNER` vazio) e senha de Postgres divergente; `registrations-service` reiniciava com `28P01 password authentication failed for user "postgres"`.
- Reset do volume e reconfiguração: `docker compose -f docker-compose.deploy.yml down -v` para limpar `pgdata` e nova subida com `set -a; source .env.prod; set +a; docker compose -f docker-compose.deploy.yml up -d`.
- Resultado: containers `aurora-db-deploy` (healthy), `aurora-auth-deploy`, `aurora-users-deploy`, `aurora-events-deploy`, `aurora-registrations-deploy` em `Up`; logs do registrations confirmam migrações aplicadas com sucesso. Containers externos `classhero_*` mantidos.
- Health checks internos (via `docker compose exec ... node -e http.get(...)`):  
  - events-service: `GET http://127.0.0.1:3012/health` → 200 `{"status":"ok"}`  
  - registrations-service: `GET http://127.0.0.1:3013/registrations/health` → 200 `{"status":"ok"}`  
  - auth-service e users-service: `GET /health` retornam 404 (não implementado), indicando apenas que estão respondendo.

## Caso pedagógico 05 — Endpoints de health ausentes em auth-service e users-service

- **Problema identificado:** os serviços auth-service e users-service respondiam 404 em `/health` durante o teste do compose de deploy, dificultando checagem de disponibilidade.
- **Impacto potencial:** ausência de liveness/readiness padronizados impede automações de deploy/observabilidade e dificulta smoke tests.
- **Solução aplicada (15/12/2025):**
  - auth-service: criado `packages/auth-service/src/health.controller.ts` e registrado no `AuthModule`.
  - users-service: criado `packages/users-service/src/health.controller.ts` e registrado no `UsersModule`.
- **Efeito prático:** ambos os serviços agora respondem `200 {"status":"ok"}` em `/health`, alinhando com events/registrations e permitindo monitoramento básico.

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

---

## Caso pedagógico 06 — Organização de imagens Docker no GHCR e deploy em VPS

**Data:** 2025-12-15
**Contexto:** Correção da organização de imagens Docker no GitHub Container Registry e atualização do deploy na VPS

---

### Problema identificado

As imagens Docker dos microsserviços estavam sendo publicadas **na raiz da conta do usuário** no GitHub Container Registry (GHCR):
- ❌ `ghcr.io/evertonfoz/users-service:latest`
- ❌ `ghcr.io/evertonfoz/auth-service:latest`
- ❌ `ghcr.io/evertonfoz/events-service:latest`
- ❌ `ghcr.io/evertonfoz/registrations-service:latest`

Em vez de estarem **organizadas por repositório**:
- ✅ `ghcr.io/evertonfoz/dsc-2025-2-aurora-platform/users-service:latest`
- ✅ `ghcr.io/evertonfoz/dsc-2025-2-aurora-platform/auth-service:latest`
- ✅ `ghcr.io/evertonfoz/dsc-2025-2-aurora-platform/events-service:latest`
- ✅ `ghcr.io/evertonfoz/dsc-2025-2-aurora-platform/registrations-service:latest`

#### Causa raiz
Nos workflows de build dos serviços (`.github/workflows/build-*-service.yml`), estava sendo usado:
```yaml
images: ghcr.io/${{ github.repository_owner }}/service-name
```

A variável `github.repository_owner` retorna apenas o nome do usuário/organização (`evertonfoz`), sem incluir o nome do repositório.

---

### Impacto potencial

#### 1. **Desorganização e escalabilidade**
- Todas as imagens de todos os repositórios ficam misturadas na raiz da conta
- Com múltiplos projetos, torna-se impossível identificar qual imagem pertence a qual repositório
- Dificulta a gestão de permissões e visibilidade por projeto

#### 2. **Conflitos de nomenclatura**
- Se dois repositórios diferentes tiverem serviços com o mesmo nome (ex: `users-service`), haverá conflito
- Não há isolamento entre projetos, podendo sobrescrever imagens acidentalmente

#### 3. **Falhas no deploy**
- O `docker-compose.prod.yml` estava configurado para buscar imagens no caminho com repositório
- As imagens estavam sendo publicadas em caminho diferente
- Deploy falhava por não encontrar as imagens no caminho esperado

#### 4. **Dificuldade de auditoria**
- Impossível rastrear facilmente quais imagens pertencem a qual projeto
- Logs e métricas de uso de imagens ficam misturados

---

### Solução fundamentada

#### Conceito: Namespacing de imagens Docker
Docker e registries de containers seguem uma hierarquia de namespacing:
```
registry / namespace / image : tag
```

No GHCR (GitHub Container Registry):
- **Registry:** `ghcr.io`
- **Namespace:** deve incluir `owner/repository` para organização adequada
- **Image:** nome do serviço
- **Tag:** versão (latest, sha, etc)

#### Referência GitHub Actions
A variável correta a usar é `github.repository`, que retorna o caminho completo `owner/repo`:
- `github.repository_owner` → `evertonfoz` (apenas o owner)
- `github.repository` → `evertonfoz/dsc-2025-2-aurora-platform` (owner + repo)

**Documentação oficial:** https://docs.github.com/en/actions/learn-github-actions/contexts#github-context

#### Abordagem aplicada
1. Corrigir workflows para usar `github.repository` em vez de `github.repository_owner`
2. Atualizar `docker-compose.prod.yml` para usar variáveis de ambiente `GITHUB_ORG` e `GITHUB_REPO`
3. Configurar `.env.prod` com valores corretos das variáveis
4. Fazer deploy na VPS com as novas imagens
5. Expor porta do `auth-service` para acesso público

---

### Implementações (delta)

#### 1. `.github/workflows/build-users-service.yml` (e demais serviços)
**Antes:**
```yaml
- uses: docker/metadata-action@v5
  id: meta
  with:
    images: ghcr.io/${{ github.repository_owner }}/users-service
```

**Depois:**
```yaml
- uses: docker/metadata-action@v5
  id: meta
  with:
    images: ghcr.io/${{ github.repository }}/users-service
```

**Efeito:** Imagens passam a ser publicadas em `ghcr.io/evertonfoz/dsc-2025-2-aurora-platform/users-service`, organizadas por repositório.

---

#### 2. `docker-compose.prod.yml` (todos os serviços)
**Antes:**
```yaml
auth-service:
  image: ghcr.io/${GITHUB_ORG}/${GITHUB_REPO}/auth-service:${AUTH_IMAGE_TAG:-latest}
  restart: unless-stopped
  env_file:
    - .env.prod
  environment:
    NODE_ENV: production
    # ...
```

**Depois (com exposição de porta):**
```yaml
auth-service:
  image: ghcr.io/${GITHUB_ORG}/${GITHUB_REPO}/auth-service:${AUTH_IMAGE_TAG:-latest}
  restart: unless-stopped
  env_file:
    - .env.prod
  ports:
    - '3010:3010'  # ← ADICIONADO para acesso público
  environment:
    NODE_ENV: production
    # ...
```

**Efeito:**
- Imagens agora usam variáveis de ambiente para compor o caminho completo
- Porta 3010 do auth-service exposta para acesso externo
- Permite flexibilidade para diferentes ambientes/organizações

---

#### 3. `.env.prod`
**Antes:** (variáveis não existiam ou estavam vazias)

**Depois:**
```env
# ---- GitHub Container Registry (GHCR) ----
GITHUB_ORG=evertonfoz
GITHUB_REPO=dsc-2025-2-aurora-platform
REPO_OWNER=evertonfoz
USERS_IMAGE_TAG=latest
AUTH_IMAGE_TAG=latest
EVENTS_IMAGE_TAG=latest
REGISTRATIONS_IMAGE_TAG=latest
```

**Efeito:** Docker Compose consegue resolver corretamente o caminho completo das imagens no GHCR.

---

#### 4. `scripts/deploy-prod.sh`
**Antes:** (sem nota sobre deploy local)

**Depois:**
```bash
echo "[deploy-prod] usando imagens:"
echo "  users:           ghcr.io/${GITHUB_ORG}/${GITHUB_REPO}/users-service:${USERS_TAG}"
echo "  auth:            ghcr.io/${GITHUB_ORG}/${GITHUB_REPO}/auth-service:${AUTH_TAG}"
echo "  events:          ghcr.io/${GITHUB_ORG}/${GITHUB_REPO}/events-service:${EVENTS_TAG}"
echo "  registrations:   ghcr.io/${GITHUB_ORG}/${GITHUB_REPO}/registrations-service:${REGISTRATIONS_TAG}"
echo ""
echo "NOTA: Este script faz deploy LOCAL (docker compose)."
echo "Para deploy na VPS, use o workflow: .github/workflows/deploy-to-vps.yml"
```

**Efeito:** Deixa claro para desenvolvedores que o script é para deploy local, não para VPS.

---

#### 5. `DEPLOYMENT_GUIDE.md`
**Antes:**
```yaml
images: ghcr.io/${{ github.repository_owner }}/auth-service
```

**Depois:**
```yaml
images: ghcr.io/${{ github.repository }}/auth-service
```

**Efeito:** Documentação atualizada reflete as melhores práticas.

---

### Efeito prático pós-correção

#### 1. **Organização e governança**
✅ Imagens agora organizadas hierarquicamente por repositório
✅ Fácil identificar e gerenciar imagens de cada projeto
✅ Evita conflitos de nomenclatura entre diferentes repositórios
✅ Facilita configuração de permissões por projeto no GHCR

#### 2. **Deploy funcional**
✅ Pull das imagens funciona corretamente na VPS
✅ Containers sobem com as novas imagens do GHCR
✅ Processo de CI/CD totalmente funcional
✅ Auth-service acessível publicamente em `http://64.181.173.121:3010`

#### 3. **Auditoria e rastreabilidade**
✅ Possível rastrear quais imagens pertencem a cada repositório
✅ Logs e métricas de uso organizados por projeto
✅ Facilita troubleshooting e gestão de versões

#### 4. **Alinhamento com boas práticas**
✅ Segue convenções do Docker e GitHub Container Registry
✅ Escalável para múltiplos projetos e repositórios
✅ Documentação alinhada com a implementação

---

### Processo completo executado

#### Fase 1: Diagnóstico
1. Identificação do problema ao tentar executar `deploy-prod.sh`
2. Erro de autenticação ao fazer pull das imagens
3. Descoberta que as imagens estavam no caminho errado no GHCR

#### Fase 2: Correção dos workflows
1. Análise dos workflows de build (4 serviços)
2. Correção de `github.repository_owner` → `github.repository`
3. Criação de branch `fix/ghcr-image-paths`
4. Commit com mensagem descritiva
5. Push e criação de PR #90

#### Fase 3: CI/CD
1. Workflows CI executados (lint, build, testes)
2. Build das 4 imagens Docker com novos caminhos
3. Publicação no GHCR nos caminhos corretos
4. Merge do PR com squash

#### Fase 4: Deploy na VPS
1. Checkout da branch main atualizada
2. Down dos containers antigos na VPS
3. Cópia de `.env.prod` e `docker-compose.prod.yml` atualizados para VPS
4. Pull das novas imagens na VPS
5. Up dos containers com novas imagens
6. Verificação de status e health checks

#### Fase 5: Testes
1. Teste de acesso público ao auth-service
2. Verificação de logs dos serviços
3. Confirmação de funcionamento correto

---

## Caso pedagógico 07 — Gateway reverso (Nginx) e exposição controlada em VPS

**Data:** 2025-12-16  
**Contexto:** Configuração completa do gateway Nginx em VPS Oracle Cloud com resolução de problemas de firewall

---

### Problema identificado

Após o deploy dos microsserviços na VPS, o gateway Nginx estava funcionando **internamente** mas não respondia a requisições **externas**. Os testes via SSH dentro da VPS funcionavam perfeitamente, mas chamadas externas via `curl http://<IP_VPS>/` resultavam em **timeout**.

#### Sintomas observados
- `curl http://127.0.0.1/` (dentro da VPS) → **200 OK** ✅
- `curl http://64.181.173.121/` (externo) → **Timeout** ❌
- Todos os containers rodando normalmente
- Porta 80 escutando no host

---

### Causa raiz: Bloqueio em duas camadas

O acesso externo estava sendo bloqueado em **duas camadas** distintas:

#### 1. **Iptables na VPS (Linux)**
O firewall da VM tinha regras que permitiam apenas portas específicas (22, 3010, 3011, 3012) antes de uma regra **REJECT all** que bloqueava todo o resto:

```
Chain INPUT (policy ACCEPT)
1    ACCEPT     state RELATED,ESTABLISHED
2    ACCEPT     icmp
3    ACCEPT     all (loopback)
4    ACCEPT     tcp  dpt:22 (SSH)
5    ACCEPT     tcp  dpt:3012
6    ACCEPT     tcp  dpt:3011
7    ACCEPT     tcp  dpt:3010
8    REJECT     all  ← BLOQUEIA porta 80!
9    ACCEPT     tcp
```

#### 2. **Oracle Cloud Security List**
A Security List da VCN não tinha regra de ingresso liberando portas 80/443 (HTTP/HTTPS).

---

### Solução implementada

#### Passo 1: Adicionar regra iptables para portas 80 e 443

Executar na VPS via SSH:
```bash
# Adicionar regra para porta 80 ANTES da regra REJECT
sudo iptables -I INPUT 5 -p tcp --dport 80 -j ACCEPT

# Adicionar regra para porta 443 (HTTPS futuro)
sudo iptables -I INPUT 6 -p tcp --dport 443 -j ACCEPT

# Verificar as regras atualizadas
sudo iptables -L INPUT -n --line-numbers

# Salvar regras para persistir após reboot
sudo sh -c 'iptables-save > /etc/iptables.rules'
```

#### Passo 2: Liberar portas na Oracle Cloud Security List

1. Acessar o **Oracle Cloud Console**
2. Navegar para **Networking → Virtual Cloud Networks**
3. Clicar na VCN do projeto (ex: `vcn-aurora`)
4. Clicar em **Security Lists → Default Security List**
5. Na aba **Ingress Rules**, clicar em **Add Ingress Rules**
6. Configurar:

| Campo | Valor |
|-------|-------|
| Stateless | ❌ (desmarcado) |
| Source Type | CIDR |
| Source CIDR | `0.0.0.0/0` |
| IP Protocol | TCP |
| Destination Port Range | `80-443` |
| Description | HTTP/HTTPS Access |

7. Clicar em **Add Ingress Rules**

> ⚠️ **Nota:** As regras podem levar 2-5 minutos para propagar.

---

### Verificação do funcionamento

Após aplicar as correções, verificar o acesso:

```bash
# Teste interno (via SSH na VPS)
curl -s http://127.0.0.1/
# Esperado: "Aurora gateway ativo"

# Teste externo (de qualquer máquina)
curl -s http://<IP_VPS>/
# Esperado: "Aurora gateway ativo"

# Health checks via gateway
curl http://<IP_VPS>/auth/health
curl http://<IP_VPS>/users/health
curl http://<IP_VPS>/events/health
curl http://<IP_VPS>/registrations/health
# Esperado: {"status":"ok"}
```

---

### Workaround: SSH Tunnel (para redes com firewall corporativo)

Se sua rede local (universidade, empresa) bloquear portas não-padrão, use SSH Tunnel:

```bash
# Criar túnel (mapeia porta local 8080 para porta 80 da VPS)
ssh -f -N -L 8080:localhost:80 ubuntu@<IP_VPS>

# Acessar via localhost
curl http://localhost:8080/

# Encerrar túnel quando terminar
pkill -f "ssh -f -N -L"
```

O túnel funciona porque a porta 22 (SSH) geralmente está liberada.

---

### Workflows de automação criados

Para automatizar a verificação e correção, foram criados workflows GitHub Actions:

#### 1. `check-vps-gateway.yml` — Verificação de endpoints
Testa todos os endpoints via SSH na VPS:
```bash
gh workflow run check-vps-gateway.yml
gh run view <run_id> --log
```

#### 2. `check-vps-firewall.yml` — Diagnóstico de firewall
Mostra regras iptables e status de portas:
```bash
gh workflow run check-vps-firewall.yml
```

#### 3. `fix-vps-firewall.yml` — Correção automática
Adiciona regras iptables para portas 80/443:
```bash
gh workflow run fix-vps-firewall.yml
```

---

### Configuração do Nginx (gateway)

O arquivo `nginx/prod.conf` configura o roteamento:

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=5r/s;

server {
    listen 80;
    server_name _;

    # Cabeçalhos de segurança
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-XSS-Protection "1; mode=block";

    # Rota raiz
    location = / {
        return 200 'Aurora gateway ativo';
        add_header Content-Type text/plain;
    }

    # Rotas dos microsserviços
    location /auth/ {
        limit_req zone=api_limit burst=15 nodelay;
        proxy_pass http://auth-service:3010/;
    }

    location /users/ {
        limit_req zone=api_limit burst=15 nodelay;
        proxy_pass http://users-service:3011/;
    }

    location /events/ {
        limit_req zone=api_limit burst=15 nodelay;
        proxy_pass http://events-service:3012/;
    }

    location /registrations/ {
        limit_req zone=api_limit burst=15 nodelay;
        proxy_pass http://registrations-service:3013;
    }
}
```

---

### Arquitetura final

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                 │
├─────────────────────────────────────────────────────────────────┤
│                              ↓                                   │
│              Oracle Cloud Security List (80, 443)                │
│                              ↓                                   │
│                    iptables (ACCEPT 80, 443)                     │
│                              ↓                                   │
│              ┌──────────────────────────────┐                    │
│              │   Nginx Gateway (porta 80)   │                    │
│              │   aurora-gateway-deploy      │                    │
│              └──────────────────────────────┘                    │
│                              ↓                                   │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │                aurora_network (interna)                   │  │
│   │                                                           │  │
│   │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐ │  │
│   │  │  auth   │ │  users  │ │ events  │ │  registrations  │ │  │
│   │  │  :3010  │ │  :3011  │ │  :3012  │ │      :3013      │ │  │
│   │  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘ │  │
│   │                         ↓                                 │  │
│   │              ┌──────────────────────┐                     │  │
│   │              │   PostgreSQL (db)    │                     │  │
│   │              │     aurora-db        │                     │  │
│   │              └──────────────────────┘                     │  │
│   └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Checklist para alunos replicarem

#### Pré-requisitos
- [ ] VPS Oracle Cloud com Docker instalado
- [ ] Repositório clonado na VPS
- [ ] Arquivo `.env.prod` configurado
- [ ] Secret `GH_PAT` com token válido (scope: `read:packages`)

#### Configuração do firewall
- [ ] Adicionar regra iptables para porta 80: `sudo iptables -I INPUT 5 -p tcp --dport 80 -j ACCEPT`
- [ ] Adicionar regra para porta 443: `sudo iptables -I INPUT 6 -p tcp --dport 443 -j ACCEPT`
- [ ] Salvar regras: `sudo sh -c 'iptables-save > /etc/iptables.rules'`
- [ ] Liberar portas 80-443 na Oracle Cloud Security List

#### Deploy
- [ ] Login no GHCR: `echo "$GH_PAT" | docker login ghcr.io -u <usuario> --password-stdin`
- [ ] Pull das imagens: `docker compose --env-file .env.prod -f docker-compose.deploy.yml pull`
- [ ] Subir containers: `docker compose --env-file .env.prod -f docker-compose.deploy.yml up -d`
- [ ] Verificar status: `docker compose --env-file .env.prod -f docker-compose.deploy.yml ps`

#### Verificação
- [ ] Teste interno: `curl http://127.0.0.1/`
- [ ] Teste externo: `curl http://<IP_VPS>/`
- [ ] Health checks: `curl http://<IP_VPS>/auth/health`

---

### Lições aprendidas

1. **Firewall em camadas:** Em cloud providers, o bloqueio pode ocorrer em múltiplas camadas (VM + cloud networking). Verificar AMBAS.

2. **Ordem das regras iptables:** Regras são processadas em ordem. Uma regra `REJECT all` no meio da lista bloqueia tudo que vem depois.

3. **Debug sistemático:** 
   - Se funciona interno mas não externo → problema de firewall
   - Se não funciona nem interno → problema de aplicação/container

4. **Workflows de automação:** Criar workflows para tarefas repetitivas (verificação, correção) economiza tempo e padroniza processos.

5. **SSH Tunnel como workaround:** Útil para redes corporativas restritivas enquanto aguarda liberação da TI.

---

### Status

**Concluído em 16/12/2025:**
- ✅ Gateway Nginx operacional na VPS
- ✅ Todos os endpoints acessíveis via gateway
- ✅ Firewall (iptables + Oracle Cloud) configurado
- ✅ Workflows de verificação e correção criados
- ✅ Documentação completa para alunos



---

## Fases concluídas

### ✅ Fase 6: Exposição controlada de serviços (CONCLUÍDA - 16/12/2025)
**Problema original:** Serviços expostos diretamente em portas individuais sem gateway centralizado.

**Implementação realizada:**
- [x] Avaliar quais serviços precisam estar acessíveis externamente → Todos via gateway
- [x] Implementar API Gateway (Nginx) como ponto único de entrada → `aurora-gateway-deploy` na porta 80
- [x] Configurar rotas do gateway para cada serviço → `/auth`, `/users`, `/events`, `/registrations`
- [x] Remover exposição direta das portas dos serviços → Nenhum serviço expõe portas além do gateway
- [x] Todo tráfego externo passa pelo gateway com rate-limiting → `limit_req zone=api_limit burst=15 nodelay`

**Arquivos modificados:**
- `docker-compose.deploy.yml` - Gateway Nginx adicionado, serviços sem `ports:`
- `nginx/prod.conf` - Configuração de rotas e rate limiting
- `.github/workflows/deploy-to-vps.yml` - Deploy automático via SSH
- `.github/workflows/check-vps-gateway.yml` - Workflow de verificação
- `.github/workflows/fix-vps-firewall.yml` - Workflow de correção de firewall

**Benefícios alcançados:**
- ✅ Segurança: ponto único de entrada, serviços isolados na rede interna
- ✅ Observabilidade: logs centralizados no Nginx gateway
- ✅ Controle: rate limiting configurado (5 req/s por IP, burst 15)
- ✅ Headers de segurança: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection

**Validação:**
```bash
# Todos os endpoints respondem via gateway
curl http://64.181.173.121/auth/health     # 200 OK
curl http://64.181.173.121/users/health    # 200 OK
curl http://64.181.173.121/events/health   # 200 OK
curl http://64.181.173.121/registrations/health  # 200 OK
```

---

## Próximas fases a implementar



### Fase 7: Monitoramento e observabilidade (Médio prazo - 1 semana)
**Problema:** Não há visibilidade sobre o comportamento dos serviços em produção.

**Tarefas:**
- [ ] Implementar health checks completos em todos os serviços
- [ ] Configurar Prometheus para coleta de métricas
- [ ] Implementar Grafana para dashboards
- [ ] Adicionar alertas para eventos críticos (serviço down, latência alta, etc)
- [ ] Implementar logging estruturado com correlação de request-id
- [ ] Adicionar tracing distribuído (OpenTelemetry/Jaeger)

**Benefícios:**
- Detecção proativa de problemas
- Troubleshooting mais rápido
- Insights sobre performance e uso
- SLA e métricas de disponibilidade

---

### Fase 8: Segurança e hardening (Médio prazo - 1-2 semanas)
**Problema:** Serviços em produção precisam de camadas adicionais de segurança.

**Tarefas:**
- [ ] Implementar HTTPS com certificados SSL/TLS (Let's Encrypt)
- [ ] Configurar firewall (UFW/iptables) restringindo apenas portas necessárias
- [ ] Implementar autenticação mútua (mTLS) entre serviços
- [ ] Rotação automática de secrets (JWT secrets, DB passwords)
- [ ] Implementar rate limiting por IP/usuário
- [ ] Adicionar WAF (Web Application Firewall)
- [ ] Configurar backup automático do banco de dados
- [ ] Implementar scanning de vulnerabilidades nas imagens Docker

**Benefícios:**
- Proteção contra ataques comuns (DDoS, SQL injection, XSS)
- Criptografia de dados em trânsito
- Recuperação de desastres
- Conformidade com boas práticas de segurança

---

### Fase 9: CI/CD avançado (Médio prazo - 2 semanas)
**Problema:** Deploy manual na VPS é propenso a erros e não escala.

**Tarefas:**
- [ ] Automatizar deploy na VPS via workflow GitHub Actions
- [ ] Implementar deploy blue-green ou canary
- [ ] Adicionar testes de integração no pipeline
- [ ] Implementar rollback automático em caso de falha
- [ ] Configurar ambientes de staging separado de produção
- [ ] Implementar aprovações manuais para deploy em produção
- [ ] Adicionar smoke tests pós-deploy

**Benefícios:**
- Deploys mais rápidos e confiáveis
- Redução de downtime
- Maior confiança nas mudanças
- Facilita rollback em caso de problemas

---

### Fase 10: Alta disponibilidade e escalabilidade (Longo prazo - 1 mês)
**Problema:** VPS única é ponto único de falha e não escala.

**Tarefas:**
- [ ] Migrar para orquestrador de containers (Kubernetes/Docker Swarm)
- [ ] Implementar múltiplas réplicas de cada serviço
- [ ] Configurar load balancer
- [ ] Separar banco de dados em instância gerenciada
- [ ] Implementar cache distribuído (Redis)
- [ ] Configurar auto-scaling baseado em métricas
- [ ] Implementar disaster recovery e backup geográfico

**Benefícios:**
- Zero downtime em deploys
- Resiliência a falhas
- Capacidade de escalar horizontalmente
- Melhor performance sob carga

---

### Fase 11: Segregação de dados (Longo prazo - 1 mês)
**Problema:** Todos os serviços compartilham o mesmo banco de dados PostgreSQL.

**Tarefas:**
- [ ] Avaliar separação de bancos de dados por serviço
- [ ] Implementar bancos isolados ou instâncias separadas
- [ ] Migrar schemas para bancos dedicados
- [ ] Implementar estratégia de backup por serviço
- [ ] Configurar permissões de acesso granulares
- [ ] Implementar saga pattern para transações distribuídas

**Benefícios:**
- Isolamento total entre serviços
- Falha em um serviço não afeta outros
- Escalabilidade independente por serviço
- Melhor segurança e governança de dados

---

## Lições aprendidas (para alunos)

### 1. **Importância de variáveis de contexto do GitHub Actions**
Usar a variável correta (`github.repository` vs `github.repository_owner`) faz toda diferença na organização de artefatos.

### 2. **Namespacing e organização hierárquica**
Registries de containers seguem hierarquias. Não respeitá-las causa desorganização e conflitos.

### 3. **Configuração por ambiente**
Uso de variáveis de ambiente (`.env.prod`) permite flexibilidade e portabilidade entre ambientes.

### 4. **Documentação alinhada com implementação**
Manter documentação (DEPLOYMENT_GUIDE.md) sincronizada com o código evita confusão.

### 5. **Processo incremental**
Resolver problemas em fases (correção → PR → merge → deploy → teste) é mais seguro que fazer tudo de uma vez.

### 6. **Exposição controlada de serviços**
Em produção, expor apenas o necessário e preferencialmente através de um gateway centralizado.

### 7. **Testes em múltiplas camadas**
- Local (dentro do container via localhost)
- Público (acesso externo via IP)
- Ambos são importantes para validar o funcionamento completo

---

## Referências

1. **GitHub Actions Context:** https://docs.github.com/en/actions/learn-github-actions/contexts#github-context
2. **GHCR Documentation:** https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry
3. **Docker Image Naming:** https://docs.docker.com/engine/reference/commandline/tag/#extended-description
4. **Docker Compose Environment Variables:** https://docs.docker.com/compose/environment-variables/
5. **Container Registry Best Practices:** https://cloud.google.com/architecture/best-practices-for-building-containers

---

## Comandos úteis para reproduzir

### Verificar imagens locais
```bash
docker images | grep ghcr.io
```

### Pull manual de uma imagem
```bash
docker pull ghcr.io/evertonfoz/dsc-2025-2-aurora-platform/auth-service:latest
```

### Verificar containers na VPS
```bash
ssh ubuntu@64.181.173.121 'docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"'
```

### Testar health check
```bash
curl -I http://64.181.173.121:3010/health
```

### Ver logs de um serviço na VPS
```bash
ssh ubuntu@64.181.173.121 'cd ~/dsc-2025-2-aurora-platform && docker compose --env-file .env.prod -f docker-compose.prod.yml logs --tail=50 auth-service'
```

### Resumo executivo

- **Problema identificado:** Imagens Docker dos microsserviços sendo publicadas na raiz da conta do usuário no GitHub Container Registry (`ghcr.io/evertonfoz/service-name`) em vez de organizadas por repositório (`ghcr.io/evertonfoz/dsc-2025-2-aurora-platform/service-name`).

- **Impacto potencial:**
  - Desorganização e dificuldade de gerenciar múltiplos repositórios
  - Conflitos de nomenclatura entre projetos diferentes
  - Falhas no deploy por caminhos incorretos
  - Impossibilidade de rastrear imagens por projeto

- **Solução aplicada:**
  - Correção dos workflows GitHub Actions (`.github/workflows/build-*-service.yml`) para usar `github.repository` em vez de `github.repository_owner`
  - Atualização do `docker-compose.prod.yml` para usar variáveis `${GITHUB_ORG}/${GITHUB_REPO}`
  - Configuração do `.env.prod` com `GITHUB_REPO=dsc-2025-2-aurora-platform`
  - Deploy completo na VPS (64.181.173.121) com novas imagens
  - Exposição da porta 3010 do auth-service para acesso público

- **Efeito prático:**
  - ✅ Imagens organizadas hierarquicamente por repositório
  - ✅ Deploy funcional na VPS com pull correto das imagens
  - ✅ Auth-service acessível publicamente em `http://64.181.173.121:3010/health`
  - ✅ Processo de CI/CD totalmente funcional
  - ✅ Alinhamento com boas práticas de namespacing de containers

### Próximas fases identificadas

O caso pedagógico completo documenta **11 fases** de evolução identificadas:

1. **Fase 6:** Exposição controlada de serviços via API Gateway (curto prazo)
2. **Fase 7:** Monitoramento e observabilidade com Prometheus/Grafana (médio prazo)
3. **Fase 8:** Segurança e hardening com HTTPS/WAF/mTLS (médio prazo)
4. **Fase 9:** CI/CD avançado com deploy automatizado e blue-green (médio prazo)
5. **Fase 10:** Alta disponibilidade e escalabilidade com Kubernetes (longo prazo)
6. **Fase 11:** Segregação de dados com bancos isolados por serviço (longo prazo)

### Processo pedagógico

O caso documenta todo o processo executado:
- Diagnóstico do problema
- Correção incremental dos workflows
- CI/CD com validação de testes
- Pull Request e merge (#90)
- Deploy na VPS
- Testes de acesso público e interno

### Materiais de aprendizado incluídos

- ✅ Conceitos de namespacing de imagens Docker
- ✅ Variáveis de contexto do GitHub Actions
- ✅ Comandos úteis para reproduzir o processo
- ✅ Referências para documentação oficial
- ✅ Lições aprendidas para alunos

**Status:** Concluído em 15/12/2025. Documentação completa disponível em `docs/casos-pedagogicos/2025-12-15-organizacao-imagens-ghcr-deploy-vps.md`
