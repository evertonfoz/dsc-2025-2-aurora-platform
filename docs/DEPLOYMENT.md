# Guia de Deploy para Produção - Aurora Platform

Este guia explica, passo a passo, como fazer o deploy da **Aurora Platform** (uma arquitetura de microserviços) em produção. A plataforma inclui três serviços principais (`users-service`, `auth-service`, `events-service`) e um banco de dados PostgreSQL, orquestrados via Docker Compose.

## Pré-requisitos
- Docker e Docker Compose instalados no servidor de produção.
- Acesso ao GitHub Container Registry (GHCR) para baixar as imagens (elas são publicadas automaticamente via GitHub Actions).
- Permissões para configurar secrets e variáveis de ambiente.
- Conhecimento básico de Docker e terminal.

## Visão Geral da Arquitetura
- **Serviços**: `users-service` (porta 3011), `auth-service` (porta 3010), `events-service` (porta 3012).
- **Banco de dados**: PostgreSQL 16, inicializado automaticamente com scripts em `postgres-init/`.
- **Imagens**: Publicadas no GHCR (ex: `ghcr.io/SEU_USERNAME/users-service:latest`).
- **Orquestração**: Tudo roda via `docker-compose.prod.yml`, que baixa as imagens e configura a rede interna.

## Passo 1: Preparar o Ambiente no Servidor
1. **Clone ou baixe o repositório** no servidor de produção:
   ```bash
   git clone https://github.com/SEU_USERNAME/dsc-2025-2-aurora-platform.git
   cd dsc-2025-2-aurora-platform
   ```

2. **Configure as variáveis de ambiente**:
   - Copie o template: `cp .env.prod.example .env.prod`
   - Edite `.env.prod` com valores reais (nunca commite este arquivo!):
     - `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`: Credenciais do banco.
     - `JWT_ACCESS_SECRET`: Segredo para tokens JWT (gere um seguro, ex: 64 caracteres aleatórios).
     - Outras variáveis específicas dos serviços (ex: `USERS_API_URL` para auth-service).
   - Exemplo de `.env.prod`:
     ```
     POSTGRES_USER=aurora_user
     POSTGRES_PASSWORD=senha_super_segura
     POSTGRES_DB=aurora_db
     JWT_ACCESS_SECRET=meu_segredo_jwt_super_longo_e_seguro
     ```

## Passo 2: Verificar as Imagens no GHCR
As imagens são publicadas automaticamente quando você faz push para a branch `main` (via workflows em `.github/workflows/`).
- Acesse o GHCR no GitHub: Vá em **Packages** no repositório.
- Confirme que as imagens existem: `users-service`, `auth-service`, `events-service`.
- Elas são tagged com `latest`, `sha-<commit>`, etc.

## Passo 3: Subir a Aplicação com Docker Compose
1. **Certifique-se de que as portas estão livres** (3010, 3011, 3012) ou ajuste no `docker-compose.prod.yml` se necessário.

2. **Execute o deploy**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```
   - Isso baixa as imagens do GHCR.
   - Inicializa o banco PostgreSQL com os scripts em `postgres-init/` (cria bancos, schemas, etc.).
   - Sobe os três serviços conectados ao banco.
   - Use `-d` para rodar em background.

3. **Verifique se tudo subiu**:
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```
   - Deve mostrar todos os containers como "Up".

4. **Verifique logs se houver problemas**:
   ```bash
   docker-compose -f docker-compose.prod.yml logs <nome-do-serviço>
   ```

## Passo 4: Testar a Aplicação
- **Acesse os serviços** via navegador ou API client (ex: Postman):
  - `auth-service`: http://SEU_SERVIDOR:3010
  - `users-service`: http://SEU_SERVIDOR:3011
  - `events-service`: http://SEU_SERVIDOR:3012
- **Teste endpoints**: Use os arquivos em `https/` (ex: `auth/auth.http`) como referência.
- **Verifique o banco**: Se precisar, conecte via `psql` no container:
  ```bash
  docker-compose -f docker-compose.prod.yml exec db psql -U $POSTGRES_USER -d $POSTGRES_DB
  ```

## Passo 5: Manutenção e Atualizações
- **Atualizar imagens**: Quando fizer push para `main`, as imagens são atualizadas no GHCR. Para aplicar:
  ```bash
  docker-compose -f docker-compose.prod.yml pull  # Baixa novas versões
  docker-compose -f docker-compose.prod.yml up -d  # Reinicia com novas imagens
  ```
- **Rodar migrações manuais** (se necessário, após mudanças no schema):
  - Para um serviço específico: `docker-compose -f docker-compose.prod.yml exec <serviço> npm run migration:run`
- **Backup do banco**: O volume `pgdata` persiste dados. Faça backups regulares.
- **Parar tudo**: `docker-compose -f docker-compose.prod.yml down`

## Dicas Importantes
- **Segurança**: Nunca exponha portas desnecessárias (ex: banco na 5432). Use firewalls.
- **Monitoramento**: Adicione logs e healthchecks (já configurados no compose).
- **CI/CD**: Os workflows cuidam do build/push; integre com seu pipeline para automação completa.
- **Troubleshooting**: Se um serviço não conectar ao banco, verifique variáveis em `.env.prod` e se o banco está saudável (`docker-compose ps`).

Se seguir esses passos, sua Aurora Platform estará rodando em produção! Para dúvidas, consulte os arquivos em `docs/` ou abra uma issue no repositório.
