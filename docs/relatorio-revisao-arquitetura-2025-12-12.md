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

## Caso pedagógico 02 — Falha de autenticação no Postgres e migrações não aplicadas
- **Problema identificado:** credenciais de DB inconsistentes (`DB_PASS` vs `DB_PASSWORD` em `docker-compose.prod.yml`) e volume de dev com senha antiga. Além disso, a execução de migrações do users-service a partir do container falhava porque o caminho do data-source compilado não era usado.
- **Impacto potencial:** serviços reiniciando por erro de senha, indisponibilidade em dev/prod, tabelas ausentes (`relation "users.users" does not exist`), seeds não aplicados, ambiente instável para testes e aulas.
- **Solução fundamentada:** padronizar nome de variável (`DB_PASS`) em compose e código (TypeORM usa `DB_PASS`). Em dev, quando permitido perder dados, resetar o volume para alinhar a senha; em seguida rodar migrações com o data-source compilado. Proceder sempre com migrations antes de validar health.
- **Implementações (delta):**
  - `docker-compose.prod.yml`: alterado `DB_PASSWORD` → `DB_PASS` em todos os serviços para alinhar com `process.env.DB_PASS` no código.
  - Dev: `docker compose -f docker-compose.dev.yml down -v` para recriar volume com senha `postgres`; subida com `docker compose -f docker-compose.dev.yml up -d`.
  - Migrações (users-service): `docker compose -f docker-compose.dev.yml run --rm users-service npx typeorm-ts-node-commonjs -d dist/app/src/data-source.js migration:run` usando o data-source compilado.
- **Efeito prático:** serviços sobem com credenciais corretas, tabelas criadas e seeds aplicados; health do events-service responde 200 (via IPv4). O fluxo de migração fica documentado para dev, reduzindo reincidência do erro.
