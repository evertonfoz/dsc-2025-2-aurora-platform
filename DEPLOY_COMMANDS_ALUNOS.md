# Comandos de Deploy — Referência para Alunos

> **Instruções:** Substitua os placeholders abaixo pelos seus dados reais antes de executar os comandos.

## Placeholders

| Placeholder | Descrição | Exemplo |
|-------------|-----------|---------|
| `<SEU_USUARIO_GITHUB>` | Seu usuário do GitHub | `joaosilva` |
| `<SEU_REPOSITORIO>` | Nome do repositório | `aurora-platform` |
| `<IP_DA_VPS>` | IP público da sua VPS Oracle | `123.456.789.100` |
| `<GH_PAT>` | Personal Access Token (read:packages) | `ghp_xxxxxxxxxxxx` |
| `<DIRETORIO_PROJETO>` | Nome do diretório na VPS | `aurora-platform` |

---

> Nota: em produção/stage os serviços de aplicação não expõem portas diretamente; o acesso externo deve passar por gateway/ingress (reverse proxy). No compose de produção, os containers usam apenas a rede interna do stack.

## 1. Configurar Secrets no GitHub (executar localmente)

```bash
# Defina suas variáveis
REPO="<SEU_USUARIO_GITHUB>/<SEU_REPOSITORIO>"
VPS_HOST="<IP_DA_VPS>"
VPS_USER="ubuntu"

# Criar secrets no GitHub
echo -n "$VPS_HOST" | gh secret set VPS_HOST -R "$REPO"
echo -n "$VPS_USER" | gh secret set VPS_USERNAME -R "$REPO"
echo -n "22" | gh secret set VPS_PORT -R "$REPO"
echo -n "<DIRETORIO_PROJETO>" | gh secret set VPS_PROJECT_DIR -R "$REPO"

# Gerar chave SSH dedicada para deploy
ssh-keygen -t ed25519 -f ~/.ssh/aurora_deploy -C "deploy@aurora" -N ""

# Copiar chave pública para a VPS
ssh-copy-id -i ~/.ssh/aurora_deploy.pub ${VPS_USER}@${VPS_HOST}

# Enviar chave privada como secret
gh secret set VPS_PRIVATE_KEY -R "$REPO" --body "$(cat ~/.ssh/aurora_deploy)"

# Enviar GH_PAT (substitua pelo seu token real)
echo -n "<GH_PAT>" | gh secret set GH_PAT -R "$REPO"
```

---

## 2. Conectar na VPS via SSH

```bash
ssh ubuntu@<IP_DA_VPS>
```

---

## 3. Preparar a VPS (executar na VPS)

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker e Git
sudo apt install -y git docker.io docker-compose-plugin

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# IMPORTANTE: Sair e reconectar para aplicar permissões
exit
```

Depois de reconectar:

```bash
# Verificar instalação
docker --version
docker compose version
```

---

## 4. Clonar o Repositório (executar na VPS)

### Opção A: Via SSH (recomendado)

Primeiro, gere uma chave SSH na VPS:

```bash
ssh-keygen -t ed25519 -C "deploy@aurora" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub
```

Adicione a chave pública como **Deploy Key** no GitHub (Settings → Deploy keys).

Depois clone:

```bash
git clone git@github.com:<SEU_USUARIO_GITHUB>/<SEU_REPOSITORIO>.git ~/<DIRETORIO_PROJETO>
```

### Opção B: Via HTTPS com PAT

```bash
GITHUB_PAT="<GH_PAT>"
git clone https://$GITHUB_PAT@github.com/<SEU_USUARIO_GITHUB>/<SEU_REPOSITORIO>.git ~/<DIRETORIO_PROJETO>
unset GITHUB_PAT
```

---

## 5. Configurar o `.env.prod` (executar na VPS)

```bash
cd ~/<DIRETORIO_PROJETO>
nano .env.prod
```

Conteúdo mínimo:

```bash
# Banco de dados
POSTGRES_USER=aurora_user
POSTGRES_PASSWORD=<GERAR_COM_openssl_rand_-hex_16>
POSTGRES_DB=aurora_db

DB_HOST=db
DB_PORT=5432
DB_USER=aurora_user
DB_PASS=<MESMA_SENHA_ACIMA>
DB_NAME=aurora_db
DB_SSL=false
DB_LOGGING=false

# GitHub Container Registry
REPO_OWNER=<SEU_USUARIO_GITHUB>
GH_PAT=<SEU_GH_PAT>

# Tags das imagens
AUTH_IMAGE_TAG=latest
USERS_IMAGE_TAG=latest
EVENTS_IMAGE_TAG=latest
REGISTRATIONS_IMAGE_TAG=latest

# Segurança
JWT_ACCESS_SECRET=<GERAR_COM_openssl_rand_-hex_32>
JWT_REFRESH_SECRET=<GERAR_COM_openssl_rand_-hex_32>
JWT_ACCESS_EXPIRES_IN=900

# Comunicação entre serviços
SERVICE_TOKEN=<GERAR_COM_openssl_rand_-hex_16>
HASH_PEPPER=

# URLs internas
USERS_API_URL=http://users-service:3011
EVENTS_API_URL=http://events-service:3012
AUTH_API_URL=http://auth-service:3010

# Desenvolvimento (remover em produção real)
DEV_AUTO_AUTH=true
```

Proteger o arquivo:

```bash
chmod 600 .env.prod
```

Gerar senhas seguras:

```bash
# POSTGRES_PASSWORD
openssl rand -hex 16

# JWT_ACCESS_SECRET
openssl rand -hex 32

# JWT_REFRESH_SECRET  
openssl rand -hex 32

# SERVICE_TOKEN
openssl rand -hex 16
```

---

## 6. Primeiro Deploy (executar na VPS)

```bash
cd ~/<DIRETORIO_PROJETO>

# Carregar variáveis
export $(grep -v '^#' .env.prod | xargs)

# Login no GitHub Container Registry
echo "$GH_PAT" | docker login ghcr.io -u $REPO_OWNER --password-stdin

# Baixar imagens
docker compose --env-file .env.prod -f docker-compose.deploy.yml pull

# Subir containers
docker compose --env-file .env.prod -f docker-compose.deploy.yml up -d

# Verificar status
docker compose --env-file .env.prod -f docker-compose.deploy.yml ps
```

---

## 7. Testar os Serviços

### Internamente (na VPS):

```bash
curl -s localhost:3010/health        # auth-service
curl -s localhost:3011/users/health  # users-service
curl -s localhost:3012/health        # events-service
curl -s localhost:3013/registrations/health  # registrations-service
```

### Externamente (do seu computador):

```bash
curl http://<IP_DA_VPS>:3011/users/health
curl http://<IP_DA_VPS>:3012/health
curl http://<IP_DA_VPS>:3013/registrations/health
```

---

## 8. SSH Tunnel — Contornar Bloqueio de Rede

### O Problema

Muitas redes institucionais (universidades, empresas) bloqueiam portas não-padrão (3010-3013). Se você consegue acessar via SSH mas não consegue acessar as portas dos serviços, sua rede está bloqueando.

**Sintomas:**
- `ssh ubuntu@<IP_DA_VPS>` funciona ✅
- `curl http://<IP_DA_VPS>:3011/users/health` dá timeout ❌
- Do celular (4G) funciona ✅

### A Solução: SSH Tunnel

O túnel SSH encapsula o tráfego das portas bloqueadas dentro da conexão SSH (porta 22).

```
┌─────────────────────────────────────────────────────────────────────┐
│  SEU COMPUTADOR              INTERNET              VPS ORACLE       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  localhost:3011  ──→  [Túnel SSH porta 22]  ──→  localhost:3011    │
│  localhost:3012  ──→  [Túnel SSH porta 22]  ──→  localhost:3012    │
│  localhost:3013  ──→  [Túnel SSH porta 22]  ──→  localhost:3013    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Criar o Túnel

Execute no seu computador local:

```bash
ssh -f -N \
  -L 3010:localhost:3010 \
  -L 3011:localhost:3011 \
  -L 3012:localhost:3012 \
  -L 3013:localhost:3013 \
  ubuntu@<IP_DA_VPS>
```

**Explicação das flags:**
- `-f`: Roda em background
- `-N`: Não executa comando remoto (apenas túnel)
- `-L 3011:localhost:3011`: Redireciona porta local para porta da VPS

### Usar o Túnel

Agora acesse os serviços via `localhost`:

```bash
# Health checks
curl http://localhost:3011/users/health
curl http://localhost:3012/health
curl http://localhost:3013/registrations/health

# Criar uma inscrição
curl -X POST http://localhost:3013/registrations \
  -H "Content-Type: application/json" \
  -d '{"eventId": 1, "origin": "meu-teste"}'

# Listar inscrições
curl http://localhost:3013/registrations/my
```

### Verificar se o Túnel Está Ativo

```bash
ps aux | grep "ssh -f -N"
```

### Encerrar o Túnel

```bash
pkill -f "ssh -f -N -L"
```

### Erro: "Address already in use"

Se ao criar o túnel você receber esse erro, significa que já existe um túnel ativo:

```
bind [127.0.0.1]:3011: Address already in use
```

**Solução:**

```bash
# Encerrar túneis existentes
pkill -f "ssh -f -N -L"

# Criar novo túnel
ssh -f -N -L 3010:localhost:3010 -L 3011:localhost:3011 -L 3012:localhost:3012 -L 3013:localhost:3013 ubuntu@<IP_DA_VPS>
```

---

## 9. Disparar Deploy Automático (CI/CD)

### Via GitHub CLI:

```bash
gh workflow run deploy-to-vps.yml -R <SEU_USUARIO_GITHUB>/<SEU_REPOSITORIO>
```

### Via GitHub UI:

1. Acesse: `https://github.com/<SEU_USUARIO_GITHUB>/<SEU_REPOSITORIO>/actions`
2. Clique em "Deploy to VPS"
3. Clique em "Run workflow" → "Run workflow"

---

## 10. Comandos Úteis

### Ver logs dos serviços:

```bash
docker compose --env-file .env.prod -f docker-compose.deploy.yml logs -f
docker compose --env-file .env.prod -f docker-compose.deploy.yml logs -f registrations-service
```

### Reiniciar um serviço:

```bash
docker compose --env-file .env.prod -f docker-compose.deploy.yml restart registrations-service
```

### Parar todos os serviços:

```bash
docker compose --env-file .env.prod -f docker-compose.deploy.yml down
```

### Parar e remover volumes (APAGA dados do banco):

```bash
docker compose --env-file .env.prod -f docker-compose.deploy.yml down -v
```

### Conectar no banco de dados:

```bash
docker exec -it aurora-db-deploy psql -U aurora_user -d aurora_db

# Listar schemas
\dn

# Listar tabelas
\dt registrations.*

# Sair
\q
```

### Criar schema manualmente (se necessário):

```bash
docker exec aurora-db-deploy psql -U aurora_user -d aurora_db \
  -c 'CREATE SCHEMA IF NOT EXISTS registrations;'
```

### Ver variáveis de ambiente de um container:

```bash
docker exec aurora-registrations-deploy printenv | sort
```

### Adicionar regra no iptables (se porta bloqueada):

```bash
sudo iptables -I INPUT 5 -p tcp --dport 3013 -j ACCEPT
```

---

## Checklist de Validação

### Infraestrutura
- [ ] VPS criada na Oracle Cloud com IP público
- [ ] Security List liberando portas 3010-3013
- [ ] Docker e Git instalados na VPS

### Configuração
- [ ] Secrets configurados no GitHub (6 secrets)
- [ ] Repositório clonado na VPS
- [ ] `.env.prod` configurado
- [ ] `chmod 600 .env.prod` aplicado

### Deploy
- [ ] Containers rodando (`docker compose ps`)
- [ ] Banco de dados healthy
- [ ] Health endpoints respondendo (interno)
- [ ] Health endpoints respondendo (externo ou via tunnel)

### CI/CD
- [ ] Workflow de build funcionando
- [ ] Workflow de deploy funcionando

---

> **Dica:** Se estiver em uma rede que bloqueia as portas, use sempre o SSH Tunnel para acessar os serviços. O túnel funciona porque usa a porta 22 (SSH), que geralmente está liberada.
