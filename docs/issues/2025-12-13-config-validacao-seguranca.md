# Configuração e segurança básicas nos serviços NestJS

**Data:** 13/12/2025

## Descrição
Aplicar `ConfigModule` global com validação de variáveis de ambiente e defaults via `??`, além de habilitar segurança básica (helmet, CORS e rate limiting) em todos os serviços NestJS (`auth`, `users`, `events`, `registrations`).

## Contexto
O relatório de revisão de arquitetura aponta uso direto de `process.env` com `||`, ausência de validação de envs, e bootstraps sem medidas de segurança mínimas (helmet/cors/rate limiting). Precisamos padronizar configuração e proteção básica em todos os microsserviços.

## Critérios de Aceite
- [ ] `ConfigModule.forRoot` global com schema (Joi ou zod) em cada serviço afetado.
- [ ] Variáveis obrigatórias (PORT, DB_*, SERVICE_TOKEN, JWTs e URLs internas) validadas e lidas via `ConfigService` com defaults usando `??`.
- [ ] Removidos acessos diretos a `process.env` nos pontos tocados.
- [ ] Bootstraps aplicam `helmet`, `enableCors` e rate limiting configurável via env/config.
- [ ] `npm run lint` e `npm test` executados nos serviços alterados (ou registrado impedimento).

## Observações
- Branch recomendada: `issue/2025-12-13-config-validacao-seguranca`.
- Registrar no relatório `docs/relatorio-revisao-arquitetura-2025-12-12.md` as mudanças e, se aplicável, um novo caso pedagógico.
