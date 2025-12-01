# README-deploy — Instruções para a equipe de operação

Este arquivo é destinado à equipe que fará deploy das imagens construídas e publicadas pelo CI (artefato de release).

Objetivo:
- Fornecer um bundle de deploy que contenha apenas os artefatos necessários para subir a stack em produção — sem código fonte.

O bundle contém:
- `docker-compose.deploy.yml` — compose de deploy-only com imagens apontando ao GHCR
- `.env.prod.example` — template de variáveis de ambiente
- `postgres-init/` — scripts SQL adotados para a primeira inicialização do banco
- `README-deploy.md` — este arquivo

Passos básicos (resumido):
1. Baixe o artefato (release) disponibilizado pelo CI (deploy-bundle.tar.gz).
2. Extraia em um diretório do servidor: `tar xzf deploy-bundle.tar.gz` .
3. Edite `.env.prod` a partir do `.env.prod.example` e garanta os segredos.
4. Opcional: verificar assinatura das imagens (se for exigido pela política de segurança).
5. `docker compose -f docker-compose.deploy.yml up -d` (ou use `scripts/deploy-prod.sh` para automação).

Observações de segurança:
- Não modifique os arquivos do bundle se não for autorizado — preferir usar imagens imutáveis já testadas.
- Verifique que as imagens tenham tags imutáveis (ex.: `sha-<commit>`) para rastreabilidade.

Se houver problemas, consulte `docs/DEPLOYMENT-PUBLIC.md` e `docs/TESTING-NEW-HOST.md` para mais contexto.
