# Deploy bundle (release) — por que temos e como usar

Este documento descreve o conceito do *deploy bundle* (arquivo `.tar.gz` anexado a uma GitHub Release) criado automaticamente pelo CI após um push na `main`.

O objetivo do deploy bundle é entregar à equipe de operações (ops) apenas os artefatos necessários para executar a aplicação em produção — sem incluir o código fonte completo da aplicação. Isso mantém uma separação clara entre desenvolvimento e execução.

## O que o bundle contém

- `docker-compose.deploy.yml` — um arquivo docker-compose com referência às imagens publicadas no GHCR (apontando para tags imutáveis do commit). Esse compose é "deploy-only": não contém instruções de build.
- `.env.prod.example` — template das variáveis de ambiente para produção. Ops deve criar `.env.prod` localmente com segredos.
- `postgres-init/` — scripts SQL que são usados pelo container do PostgreSQL na primeira inicialização para criar DBs/schemas básicos.
- `README-deploy.md` — instruções resumidas de deploy e boas práticas.

## Como o CI gera o bundle

- Um workflow CI (`.github/workflows/create-release-bundle.yml`) é executado no push para `main`.
- Ele resolve o template `docker-compose.deploy.yml` substituindo placeholders pelo owner do repositório e criando tags baseadas no commit (ex.: `sha-<short>`).
- Gera `deploy-bundle-<short-sha>.tar.gz` e cria um GitHub Release com essa artefato anexado.

## Benefícios dessa abordagem

- Ops tem um artefato imutável e auditável para deploy — sem precisar do código fonte.
- Facilita rollback (usar outra tag/artefato do release).
- Melhora segurança — a equipe de execução não precisa ter acesso ao código ou ao processo de build.
- Mantém rastreabilidade: cada bundle refere-se a um commit exato.

## Fluxo recomendado para ops

1. Baixar o bundle a partir da Release no GitHub.
2. Extrair o bundle: `tar xzf deploy-bundle-<short-sha>.tar.gz`.
3. Ajustar/editar `.env.prod` com segredos no host (não comitar).
4. Opcionalmente verificar assinaturas das imagens (cosign) se política ativa.
5. `docker compose -f docker-compose.deploy.yml up -d`.
6. Monitorar healthchecks e logs.

## Observações finais

- Se preferir, o CI pode assinar as imagens (cosign) e o script `scripts/deploy-prod.sh` pode verificar as assinaturas antes de fazer o `docker-compose up`.
- Se quiser que eu implemente também a verificação com cosign no CI e novos artefatos firmados, posso configurar isso (requer segredos para chaves de cosign). 

***

Scripts disponíveis:
- `scripts/deploy-prod.sh`: usa `docker-compose.prod.yml` + `.env.prod` para subir o stack de produção.
- `scripts/deploy-deploy.sh`: helper para o compose de deploy (imagens pré-buildadas).
