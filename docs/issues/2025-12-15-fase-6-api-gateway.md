# Fase 6 — Exposição controlada de serviços via gateway

**Data:** 15/12/2025

## Descrição
Implementar um gateway reverso (Nginx/Traefik) para expor os microsserviços de forma controlada, concentrando roteamento, segurança básica e observabilidade, e remover exposições diretas de portas nos serviços de aplicação.

## Contexto
- Fase 6 permanece pendente no relatório (`docs/relatorio-revisao-arquitetura-2025-12-12.md`), com os serviços expostos diretamente (auth-service na porta 3010; demais internos).
- `docker-compose.prod.yml` e `docker-compose.deploy.yml` não possuem gateway; existe um template em `production/docker-compose.prod.yml` + `production/nginx/default.conf` que pode ser aproveitado.
- Objetivo é padronizar entrada via gateway único (paths /auth, /users, /events, /registrations) com autenticação/rate-limiting básico e suporte a TLS/domínio quando disponível.

## Critérios de Aceite
- [ ] Serviço de gateway incluído e ativo nos composes de dev/prod/deploy com imagem e configuração versionadas.
- [ ] Roteamento funcionando para `/auth`, `/users`, `/events`, `/registrations`, com health checks acessíveis via gateway.
- [ ] Serviços de aplicação sem blocos `ports:` (exposição apenas via gateway) em dev/prod/deploy e validação manual de acessibilidade via gateway (local e VPS).
- [ ] TLS e cabeçalhos de segurança/CORS/rate limiting configurados ou documentados com defaults claros para produção.
- [ ] Documentação atualizada (`.env.prod`, `docker-compose*.yml`, scripts de deploy e relatórios) descrevendo uso do gateway e comandos de validação.

## Observações
- Validar primeiro em ambiente local; depois replicar na VPS.
- Manter compatibilidade de paths para evitar breaking changes; confirmar domínio e certificados antes de ativar TLS/redirects.
