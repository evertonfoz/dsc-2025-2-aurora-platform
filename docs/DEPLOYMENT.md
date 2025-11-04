# Deploy — Produção

Esta seção descreve passos e notas rápidas para executar a aplicação em modo de produção usando os artefatos providos (`Dockerfile.prod`, `docker-compose.prod.yml` e o arquivo de exemplo `.env.prod.example`). Ela assume que você tem permissões para publicar imagens em um registry e para provisionar os segredos (ex.: secrets manager, CI/CD variables).

Principais pontos de atenção
- Nunca comitar segredos. Use `.env.prod.example` como modelo e mantenha o arquivo real `.env.prod` fora do repositório (já estamos adicionando `.env.prod` em `.gitignore`).
- A aplicação exige `JWT_ACCESS_SECRET` em produção; ela falha ao iniciar se essa variável não estiver definida quando `NODE_ENV=production`.
- `docker-compose.prod.yml` foi feito para usar uma imagem pronta (variável `DOCKER_IMAGE`) e não monta o código (sem bind-mounts).

Passo-a-passo rápido

1) Preparar a imagem (build & push)

```bash
# build (local) e tagueie conforme seu registry
docker build -f Dockerfile.prod -t your-registry/your-project:latest .

# push para o registry (autentique-se antes)
docker push your-registry/your-project:latest
```

2) Criar o arquivo de ambiente de produção localmente

```bash
# copie o template e edite os valores (DOCKER_IMAGE, JWT_ACCESS_SECRET, DB creds, etc.)
cp .env.prod.example .env.prod
# editar .env.prod -> definir JWT_ACCESS_SECRET e credenciais/URLs
```

3) Atualizar `.env.prod` com a imagem publicada

Edite `DOCKER_IMAGE` em `.env.prod` apontando para `your-registry/your-project:latest` (ou exporte a variável no ambiente de CI antes do deploy).

4) Subir com Docker Compose (produção)

```bash
docker compose -f docker-compose.prod.yml up -d
```

5) Rodar migrações (após o banco estar saudável)

```bash
# este comando sobe um container temporário do serviço e executa as migrations
docker compose -f docker-compose.prod.yml run --rm app npm run migration:run
```

Notas úteis
- Se você usa um pipeline CI (recomendado), faça o build da imagem no CI, publique no registry e execute o `docker compose` no ambiente alvo (servidor/VM/manager) com a `.env.prod` provida por um secrets store.
- Não use bind-mounts em produção: a imagem deve conter o `dist` já compilado. `Dockerfile.prod` é multi-stage e gera isso.
- Se precisar de acesso remoto ao banco para debug, prefira ferramentas seguras (SSH tunneling) em vez de expor a porta do Postgres publicamente.

Ver também
- `docker-compose.prod.yml` (serviços: `db`, `app`) — o serviço `app` espera o `DB` no host `db` e define `command: ["node","dist/main.js"]`.
- `.env.prod.example` — template para variáveis de produção (sem segredos). Preencha e armazene o `.env.prod` em local seguro.
