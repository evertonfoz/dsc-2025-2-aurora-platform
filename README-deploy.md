# README-deploy — Instruções para a equipe de operação

Este arquivo é destinado à equipe que fará deploy das imagens construídas e publicadas pelo CI (artefato de release).

Objetivo:
- Fornecer um bundle de deploy que contenha apenas os artefatos necessários para subir a stack em produção — sem código fonte.

O bundle contém:
- `docker-compose.deploy.yml` — compose de deploy-only com imagens apontando ao GHCR
- `.env.prod.example` — template de variáveis de ambiente
- `postgres-init/` — scripts SQL adotados para a primeira inicialização do banco
- `https/` — arquivos .http para testar os endpoints (VS Code REST Client)
- `README-deploy.md` — este arquivo

## Passos básicos

1. Baixe o artefato (release) disponibilizado pelo CI (deploy-bundle.tar.gz).
2. Extraia em um diretório do servidor: `tar xzf deploy-bundle.tar.gz`
3. Copie `.env.prod.example` para `.env.prod` e preencha os valores:
   ```bash
   cp .env.prod.example .env.prod
   nano .env.prod  # ou seu editor preferido
   ```
4. **Variáveis obrigatórias** no `.env.prod`:
   - `POSTGRES_PASSWORD` — senha do banco de dados
   - `JWT_ACCESS_SECRET` — segredo JWT (gere com `openssl rand -hex 32`)
   - `SERVICE_TOKEN` — token para comunicação entre serviços (gere com `openssl rand -hex 16`)
5. Suba os serviços:
   ```bash
   docker compose -f docker-compose.deploy.yml up -d
   ```

## Usuários de teste

Na primeira inicialização, o `users-service` cria automaticamente dois usuários:

| Email | Senha | Role |
|-------|-------|------|
| `test.user@example.com` | `StrongP@ssw0rd` | student |
| `admin.user@example.com` | `AdminP@ss1` | admin |

## Testando a API

Após subir os serviços, teste os endpoints:

```bash
# Health checks
curl http://localhost:3011/users/health   # users-service
curl http://localhost:3012/health         # events-service

# Login
curl -X POST http://localhost:3010/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test.user@example.com","password":"StrongP@ssw0rd"}'
```

Ou use os arquivos `.http` na pasta `https/` com o VS Code REST Client.

## Portas dos serviços

| Serviço | Porta | Health Check |
|---------|-------|--------------|
| auth-service | 3010 | `/auth/me` (requer token) |
| users-service | 3011 | `/users/health` |
| events-service | 3012 | `/health` |

## Observações de segurança

- Não modifique os arquivos do bundle se não for autorizado — preferir usar imagens imutáveis já testadas.
- Verifique que as imagens tenham tags imutáveis (ex.: `sha-<commit>`) para rastreabilidade.
- Nunca comite o arquivo `.env.prod` em repositórios!

Se houver problemas, consulte `docs/DEPLOYMENT-PUBLIC.md` e `docs/TESTING-NEW-HOST.md` para mais contexto.
