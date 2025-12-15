# Testes do docker-compose de deploy

**Data:** 15/12/2025

## Descrição
Executar e validar o docker-compose voltado ao deploy (ploy), garantindo que os containers anteriores sejam baixados/derrubados e que o ambiente suba limpo para testes.

## Contexto
- Precisamos validar o compose de deploy após revisões de arquitetura e configurações recentes.
- É necessário garantir que os containers previamente levantados sejam corretamente baixados/parados antes de novos testes.

## Critérios de Aceite
- [ ] Comando/documentação para baixar/derrubar containers existentes registrado.
- [ ] docker-compose de deploy executado com sucesso em ambiente limpo.
- [ ] Logs principais coletados ou resumidos no relatório.
- [ ] Resultado registrado em `docs/relatorio-revisao-arquitetura-2025-12-12.md`.

## Observações
- Evitar mudanças de configuração não relacionadas; focar apenas na rotina de derrubar e testar o compose de deploy.

## Execução e verificações
- 15/12/2025: stack dev derrubado; deploy subiu com `.env.prod` exportado e volume limpo (`pgdata` recriado). `aurora-*` em `Up`; `aurora-db-deploy` saudável.
- Health checks internos:
  - `events-service`: `GET http://127.0.0.1:3012/health` → 200 `{"status":"ok"}` (via `docker compose exec events-service`).
  - `registrations-service`: `GET http://127.0.0.1:3013/registrations/health` → 200 `{"status":"ok"}`.
  - `auth-service` e `users-service`: `GET /health` retornavam 404 (sem endpoint); endpoints implementados agora respondem 200 `{"status":"ok"}`.
