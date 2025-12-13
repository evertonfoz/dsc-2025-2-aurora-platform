# Guia Completo de Deploy — Aurora Platform

> **Tutorial Passo a Passo para Alunos**  
> Este guia foi elaborado com base em problemas reais encontrados durante o deploy do projeto Aurora Platform. Siga cada passo com atenção.

## Índice

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Parte 1: Criar a VPS na Oracle Cloud](#parte-1-criar-a-vps-na-oracle-cloud)
3. [Parte 2: Configurar Secrets no GitHub](#parte-2-configurar-secrets-no-github)
4. [Parte 3: Preparar a VPS (SSH, Docker, Git)](#parte-3-preparar-a-vps-ssh-docker-git)
5. [Parte 4: Configurar o `.env.prod`](#parte-4-configurar-o-envprod)
6. [Parte 5: Primeiro Deploy (Manual)](#parte-5-primeiro-deploy-manual)
7. [Parte 6: Testar Localmente (Máquina de Desenvolvimento)](#parte-6-testar-localmente-máquina-de-desenvolvimento)
8. [Parte 7: Deploy Automático (CI/CD)](#parte-7-deploy-automático-cicd)
9. [Parte 8: Solução de Problemas (Troubleshooting)](#parte-8-solução-de-problemas-troubleshooting)
10. [Parte 9: SSH Tunnel — Acessar VPS de Redes Bloqueadas](#parte-9-ssh-tunnel--acessar-vps-de-redes-bloqueadas)
11. [Apêndice: Comandos Úteis](#apêndice-comandos-úteis)

---

## 1. Visão Geral do Sistema

### Arquitetura de Microsserviços

A Aurora Platform é composta por 4 microsserviços + 1 banco de dados:

| Serviço | Porta | Descrição |
|---------|-------|-----------|
| `auth-service` | 3010 | Autenticação (login, logout, JWT tokens) |
| `users-service` | 3011 | Gerenciamento de usuários |
| `events-service` | 3012 | Gerenciamento de eventos |
| `registrations-service` | 3013 | Inscrições em eventos |
| `db` (PostgreSQL) | 5432 | Banco de dados (schemas separados por serviço) |

### Schemas do Banco de Dados

Cada microsserviço tem seu próprio schema no PostgreSQL:

```
aurora_db/
├── auth          # Tabelas do auth-service
├── users         # Tabelas do users-service
├── events        # Tabelas do events-service
└── registrations # Tabelas do registrations-service
```

### Pipeline CI/CD

```
┌─────────────────────────────────────────────────────────────────────┐
│                         GitHub Actions                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Push em main → Build Workflow → Publica imagem no GHCR            │
│                        ↓                                            │
│              Deploy Workflow → SSH na VPS → Atualiza containers    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Workflows disponíveis** (`.github/workflows/`):

| Workflow | Trigger | Descrição |
|----------|---------|-----------|
| `build-auth-service.yml` | Push em `packages/auth-service/**` | Build e push da imagem |
| `build-users-service.yml` | Push em `packages/users-service/**` | Build e push da imagem |
| `build-events-service.yml` | Push em `packages/events-service/**` | Build e push da imagem |
| `build-registrations-service.yml` | Push em `packages/registrations-service/**` | Build e push da imagem |
| `deploy-to-vps.yml` | Após qualquer build ou manual | Deploy na VPS via SSH |

---

## Parte 1: Criar a VPS na Oracle Cloud

### 1.1 Criar Conta na Oracle Cloud

1. Acesse: https://cloud.oracle.com
2. Clique em **"Start for free"**
3. Complete o cadastro (requer cartão de crédito, mas não será cobrado no Free Tier)
4. Aguarde a ativação da conta (pode levar alguns minutos)

### 1.2 Criar a Instância (VM)

1. No painel Oracle Cloud, vá para **Compute** → **Instances**
2. Clique em **Create instance**
3. Configure:

| Campo | Valor |
|-------|-------|
| **Name** | `aurora-platform-vm` |
| **Compartment** | Seu compartment (geralmente root) |
| **Image** | **Canonical Ubuntu 22.04** (clique em "Change image") |
| **Shape** | **VM.Standard.E2.1.Micro** (Always Free) |

4. Em **Networking**:
   - **Virtual cloud network**: Create new → nome: `vcn-aurora`
   - **Subnet**: Create new public subnet → nome: `subnet-aurora`
   - **Public IP**: ✅ **Assign a public IPv4 address**

5. Em **Add SSH keys**:
   - Selecione **Paste public key**
   - No seu terminal local, execute:
     ```bash
     cat ~/.ssh/id_rsa.pub
     ```
   - Cole a chave pública completa

6. Clique em **Create**

7. **Anote o IP público** (ex: `64.181.173.121`) — você vai precisar dele

### 1.3 Liberar Portas no Security List

Por padrão, apenas a porta 22 (SSH) está aberta. Você precisa liberar as portas dos serviços:

1. No Oracle Cloud, vá para **Networking** → **Virtual Cloud Networks**
2. Clique na sua VCN (`vcn-aurora`)
3. Clique em **Security Lists** → **Default Security List for vcn-aurora**
4. Na aba **Ingress Rules**, clique em **Add Ingress Rules**
5. Preencha:

| Campo | Valor |
|-------|-------|
| **Stateless** | ❌ (desmarcado) |
| **Source Type** | CIDR |
| **Source CIDR** | `0.0.0.0/0` |
| **IP Protocol** | TCP |
| **Source Port Range** | (deixe vazio) |
| **Destination Port Range** | `3010-3013` |
| **Description** | Aurora Platform Services |

6. Clique em **Add Ingress Rules**

> ⚠️ **Importante**: As regras podem levar **2-5 minutos** para propagar. Seja paciente!

---

## Parte 2: Configurar Secrets no GitHub

O workflow de deploy precisa de credenciais para acessar a VPS. Configure os seguintes secrets:

1. No GitHub, vá para **Settings** → **Secrets and variables** → **Actions**
2. Clique em **New repository secret** para cada um:

| Secret | Valor | Como obter |
|--------|-------|------------|
| `VPS_HOST` | IP público da VPS | Ex: `64.181.173.121` |
| `VPS_USERNAME` | `ubuntu` | Usuário padrão do Ubuntu |
| `VPS_PORT` | `22` | Porta SSH padrão |
| `VPS_PRIVATE_KEY` | Conteúdo de `~/.ssh/id_rsa` | `cat ~/.ssh/id_rsa` (copie TUDO) |
| `VPS_PROJECT_DIR` | `dsc-2025-2-aurora-platform` | Nome do diretório na VPS |
| `GH_PAT` | Personal Access Token | Ver instruções abaixo |

### Criar o GH_PAT (Personal Access Token)

1. No GitHub, vá para **Settings** (do seu perfil) → **Developer settings**
2. Clique em **Personal access tokens** → **Tokens (classic)**
3. Clique em **Generate new token** → **Generate new token (classic)**
4. Configure:
   - **Note**: `AURORA_DEPLOY_VPS`
   - **Expiration**: 90 days (ou mais)
   - **Scopes**: ✅ `read:packages`
5. Clique em **Generate token**
6. **Copie imediatamente** (não será mostrado novamente!)
7. Cole como valor do secret `GH_PAT`

---

## Parte 3: Preparar a VPS (SSH, Docker, Git)

### 3.1 Conectar via SSH

```bash
ssh ubuntu@<IP_DA_VPS>
# Exemplo: ssh ubuntu@64.181.173.121
```

Na primeira conexão, digite `yes` quando perguntado sobre o fingerprint.

### 3.2 Instalar Docker e Git

Execute os comandos abaixo **na VPS**:

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker e Git
sudo apt install -y git docker.io docker-compose-plugin

# Adicionar usuário ao grupo docker (evita usar sudo)
sudo usermod -aG docker $USER

# IMPORTANTE: Sair e reconectar para aplicar permissões
exit
```

Reconecte:
```bash
ssh ubuntu@<IP_DA_VPS>
```

Verifique a instalação:
```bash
docker --version
# Docker version 24.x.x

docker compose version
# Docker Compose version v2.x.x
```

### 3.3 Configurar Chave SSH para GitHub

Para o `git pull` funcionar, configure uma chave SSH na VPS:

```bash
# Gerar nova chave (sem passphrase para automação)
ssh-keygen -t ed25519 -C "deploy@aurora" -f ~/.ssh/id_ed25519 -N ""

# Exibir a chave pública
cat ~/.ssh/id_ed25519.pub
```

Copie a chave pública e adicione no GitHub:
1. Vá para **Settings** (do repositório) → **Deploy keys**
2. Clique em **Add deploy key**
3. Cole a chave e marque ❌ "Allow write access" (apenas leitura)
4. Clique em **Add key**

Teste a conexão:
```bash
ssh -T git@github.com
# Esperado: "Hi username! You've successfully authenticated..."
```

### 3.4 Clonar o Repositório

```bash
cd ~
git clone git@github.com:evertonfoz/dsc-2025-2-aurora-platform.git
cd dsc-2025-2-aurora-platform
```

---

## Parte 4: Configurar o `.env.prod`

O arquivo `.env.prod` contém as variáveis de ambiente sensíveis. **Nunca commite este arquivo!**

### 4.1 Criar o arquivo

```bash
cd ~/dsc-2025-2-aurora-platform
nano .env.prod
```

### 4.2 Conteúdo do `.env.prod`

Cole o seguinte conteúdo (substitua os valores marcados com `<...>`):

```bash
# =============================================
# BANCO DE DADOS
# =============================================
POSTGRES_USER=aurora_user
POSTGRES_PASSWORD=<SENHA_FORTE_AQUI>
POSTGRES_DB=aurora_db

DB_HOST=db
DB_PORT=5432
DB_USER=aurora_user
DB_PASS=<MESMA_SENHA_ACIMA>
DB_NAME=aurora_db
DB_SSL=false
DB_LOGGING=false

# =============================================
# GITHUB CONTAINER REGISTRY
# =============================================
REPO_OWNER=evertonfoz
GH_PAT=<SEU_PERSONAL_ACCESS_TOKEN>

# Tags das imagens (deixe latest)
AUTH_IMAGE_TAG=latest
USERS_IMAGE_TAG=latest
EVENTS_IMAGE_TAG=latest
REGISTRATIONS_IMAGE_TAG=latest

# =============================================
# SEGURANÇA (JWT)
# =============================================
JWT_ACCESS_SECRET=<CHAVE_SECRETA_64_CHARS>
JWT_REFRESH_SECRET=<OUTRA_CHAVE_SECRETA_64_CHARS>
JWT_ACCESS_EXPIRES_IN=900

# =============================================
# COMUNICAÇÃO ENTRE SERVIÇOS
# =============================================
SERVICE_TOKEN=<TOKEN_32_CHARS>
HASH_PEPPER=<VALOR_OPCIONAL>

# URLs internas (docker network)
USERS_API_URL=http://users-service:3011
EVENTS_API_URL=http://events-service:3012
AUTH_API_URL=http://auth-service:3010

# =============================================
# DESENVOLVIMENTO (remover em produção real)
# =============================================
DEV_AUTO_AUTH=true
```

### 4.3 Gerar valores seguros

Use estes comandos para gerar senhas e tokens:

```bash
# POSTGRES_PASSWORD (32 chars)
openssl rand -hex 16

# JWT_ACCESS_SECRET (64 chars)
openssl rand -hex 32

# JWT_REFRESH_SECRET (64 chars)
openssl rand -hex 32

# SERVICE_TOKEN (32 chars)
openssl rand -hex 16
```

### 4.4 Proteger o arquivo

```bash
chmod 600 .env.prod
```

---

## Parte 5: Primeiro Deploy (Manual)

### 5.1 Login no GitHub Container Registry

```bash
cd ~/dsc-2025-2-aurora-platform

# Carregar variáveis
export $(grep -v '^#' .env.prod | xargs)

# Login no GHCR
echo "$GH_PAT" | docker login ghcr.io -u $REPO_OWNER --password-stdin
# Esperado: Login Succeeded
```

### 5.2 Baixar imagens e subir containers

```bash
# Baixar imagens
docker compose --env-file .env.prod -f docker-compose.deploy.yml pull

# Subir containers
docker compose --env-file .env.prod -f docker-compose.deploy.yml up -d

# Aguardar inicialização
sleep 15

# Verificar status
docker compose --env-file .env.prod -f docker-compose.deploy.yml ps
```

**Saída esperada:**
```
NAME                          STATUS                PORTS
aurora-auth-deploy            Up 10 seconds         0.0.0.0:3010->3010/tcp
aurora-db-deploy              Up 30 seconds (healthy) 5432/tcp
aurora-events-deploy          Up 10 seconds         0.0.0.0:3012->3012/tcp
aurora-registrations-deploy   Up 10 seconds         0.0.0.0:3013->3013/tcp
aurora-users-deploy           Up 10 seconds         0.0.0.0:3011->3011/tcp
```

### 5.3 Testar endpoints (internamente)

```bash
# Health checks (devem retornar {"status":"ok"})
curl -s localhost:3011/users/health
curl -s localhost:3012/health
curl -s localhost:3013/registrations/health
```

### 5.4 Testar externamente

Do seu computador local (não da VPS):

```bash
IP_VPS="64.181.173.121"  # Substitua pelo seu IP

curl http://$IP_VPS:3011/users/health
curl http://$IP_VPS:3012/health
curl http://$IP_VPS:3013/registrations/health
```

> ⚠️ **Se der timeout**, veja a [Parte 9: SSH Tunnel](#parte-9-ssh-tunnel--acessar-vps-de-redes-bloqueadas)

---

## Parte 6: Testar Localmente (Máquina de Desenvolvimento)

Antes de fazer deploy na VPS, é recomendado testar no seu computador.

### 6.1 Pré-requisitos

- Docker Desktop instalado e rodando
- Arquivo `.env.prod` no diretório raiz do projeto

### 6.2 Criar `.env.prod` local

```bash
cd ~/path/to/dsc-2025-2-aurora-platform

cat > .env.prod << 'EOF'
NODE_ENV=production
POSTGRES_USER=postgres
POSTGRES_PASSWORD=LocalTest123!
POSTGRES_DB=aurora_db
DB_HOST=db
DB_PORT=5432
DB_USER=postgres
DB_PASS=LocalTest123!
DB_NAME=aurora_db
DB_SSL=false
DB_LOGGING=false
REPO_OWNER=evertonfoz
AUTH_IMAGE_TAG=latest
USERS_IMAGE_TAG=latest
EVENTS_IMAGE_TAG=latest
REGISTRATIONS_IMAGE_TAG=latest
JWT_ACCESS_SECRET=LocalTestJwtSecret123456789012345678901234567890
JWT_REFRESH_SECRET=LocalTestRefreshSecret12345678901234567890123456
JWT_ACCESS_EXPIRES_IN=900
SERVICE_TOKEN=LocalTestServiceToken123456
HASH_PEPPER=
USERS_API_URL=http://users-service:3011
DEV_AUTO_AUTH=true
EOF
```

### 6.3 Subir a stack

```bash
# Login no GHCR (se imagens privadas)
echo "<SEU_GH_PAT>" | docker login ghcr.io -u evertonfoz --password-stdin

# Validar configuração
docker compose --env-file .env.prod -f docker-compose.deploy.yml config > /dev/null

# Baixar e subir
docker compose --env-file .env.prod -f docker-compose.deploy.yml pull
docker compose --env-file .env.prod -f docker-compose.deploy.yml up -d

# Verificar
docker compose --env-file .env.prod -f docker-compose.deploy.yml ps
```

### 6.4 Testar

```bash
# Health
curl http://localhost:3011/users/health
curl http://localhost:3012/health
curl http://localhost:3013/registrations/health

# Criar uma inscrição
curl -X POST http://localhost:3013/registrations \
  -H "Content-Type: application/json" \
  -d '{"eventId": 1, "origin": "local-test"}'

# Listar inscrições
curl http://localhost:3013/registrations/my
```

### 6.5 Parar

```bash
# Parar (preserva dados)
docker compose --env-file .env.prod -f docker-compose.deploy.yml down

# Parar e remover volumes (APAGA dados do banco)
docker compose --env-file .env.prod -f docker-compose.deploy.yml down -v
```

---

## Parte 7: Deploy Automático (CI/CD)

### 7.1 Como funciona

1. Você faz `git push` para a branch `main`
2. Se alterou arquivos em `packages/<serviço>/**`, o workflow de build é disparado
3. O build cria uma imagem Docker e publica no GitHub Container Registry (GHCR)
4. Após o build, o workflow `deploy-to-vps.yml` é disparado automaticamente
5. O deploy conecta na VPS via SSH, baixa a nova imagem e reinicia o container

### 7.2 Disparar manualmente

Você pode disparar o deploy manualmente:

**Via GitHub CLI:**
```bash
gh workflow run deploy-to-vps.yml -R evertonfoz/dsc-2025-2-aurora-platform
```

**Via GitHub UI:**
1. Vá para: https://github.com/evertonfoz/dsc-2025-2-aurora-platform/actions
2. Clique em "Deploy to VPS"
3. Clique em "Run workflow" → "Run workflow"

### 7.3 Verificar execução

1. Vá para **Actions** no GitHub
2. Clique na execução mais recente
3. Veja os logs em tempo real

**Tempo esperado:** 30-60 segundos

---

## Parte 8: Solução de Problemas (Troubleshooting)

### Problema 1: Container reiniciando em loop

**Sintoma:** `docker ps` mostra "Restarting (1) X seconds ago"

**Diagnóstico:**
```bash
docker logs aurora-<SERVICO>-deploy --tail 50
```

**Causa comum:** Schema não existe no banco

**Solução:**
```bash
# Verificar schemas existentes
docker exec aurora-db-deploy psql -U aurora_user -d aurora_db -c '\dn'

# Criar schema faltante (ex: registrations)
docker exec aurora-db-deploy psql -U aurora_user -d aurora_db \
  -c 'CREATE SCHEMA IF NOT EXISTS registrations;'

# Reiniciar serviço
docker compose --env-file .env.prod -f docker-compose.deploy.yml restart registrations-service
```

---

### Problema 2: "password authentication failed"

**Sintoma:** Erro de autenticação no banco

**Causa:** Volume do PostgreSQL foi criado com senha diferente

**Solução A — Alterar senha no banco:**
```bash
docker exec -it aurora-db-deploy psql -U postgres -c \
  "ALTER ROLE aurora_user WITH PASSWORD 'NovaSenhaAqui';"
```

**Solução B — Recriar volume (APAGA dados):**
```bash
docker compose --env-file .env.prod -f docker-compose.deploy.yml down -v
docker compose --env-file .env.prod -f docker-compose.deploy.yml up -d
```

---

### Problema 3: Porta não acessível externamente (timeout)

**Sintoma:** Funciona via `curl localhost:3013` na VPS, mas não do seu computador

**Diagnóstico:**
```bash
# Na VPS, verificar se porta está escutando
sudo ss -tlnp | grep :3013

# Verificar iptables
sudo iptables -L INPUT -n | grep 301
```

**Causa 1 — Falta regra no iptables:**
```bash
sudo iptables -I INPUT 5 -p tcp --dport 3013 -j ACCEPT
```

**Causa 2 — Security List da Oracle Cloud não liberada:**
1. Oracle Cloud → Networking → VCN → Security Lists
2. Editar regra de ingress para incluir porta 3013 (ou 3010-3013)

**Causa 3 — Firewall da sua rede local:**
Veja [Parte 9: SSH Tunnel](#parte-9-ssh-tunnel--acessar-vps-de-redes-bloqueadas)

---

### Problema 4: POST retorna erro 500

**Sintoma:** Health funciona, mas POST `/registrations` retorna 500

**Causa:** `DEV_AUTO_AUTH` não está habilitado

**Solução:**
```bash
# Adicionar variável no .env.prod
echo "DEV_AUTO_AUTH=true" >> ~/dsc-2025-2-aurora-platform/.env.prod

# Recriar container
cd ~/dsc-2025-2-aurora-platform
docker compose --env-file .env.prod -f docker-compose.deploy.yml up -d registrations-service
```

> ⚠️ **ATENÇÃO:** `DEV_AUTO_AUTH=true` é apenas para testes! Em produção real, use JWT tokens.

---

### Problema 5: Imagem não atualiza após deploy

**Sintoma:** Código novo não aparece mesmo após deploy

**Solução:**
```bash
docker compose --env-file .env.prod -f docker-compose.deploy.yml pull
docker compose --env-file .env.prod -f docker-compose.deploy.yml up -d --force-recreate
```

---

### Problema 6: "permission denied" no docker

**Solução:**
```bash
sudo usermod -aG docker $USER
exit  # Desconectar
# Reconectar SSH
```

---

## Parte 9: SSH Tunnel — Acessar VPS de Redes Bloqueadas

### O Problema

Muitas redes institucionais (universidades, empresas) bloqueiam portas não-padrão (3010-3013) no firewall de saída. Isso significa que:

- ✅ SSH (porta 22) funciona
- ✅ HTTP/HTTPS (portas 80/443) funcionam
- ❌ Portas 3010-3013 são bloqueadas

**Sintomas:**
- Timeout ao acessar `http://<IP_VPS>:3011/users/health`
- Mas funciona do celular (4G) ou de casa

**Como diagnosticar:**

```bash
# Teste externo (do seu computador)
curl --connect-timeout 5 http://<IP_VPS>:3011/users/health
# Se der timeout após 5 segundos, a porta está bloqueada

# Teste interno (via SSH na VPS)
ssh ubuntu@<IP_VPS> "curl -s localhost:3011/users/health"
# Se retornar {"status":"ok"}, o serviço está funcionando

# Conclusão: Se interno funciona e externo não, sua rede está bloqueando
```

### A Solução: SSH Tunnel

O SSH Tunnel cria um "túnel criptografado" através da porta 22 (que está liberada) e redireciona o tráfego para as portas internas da VPS.

```
┌─────────────────────────────────────────────────────────────────────┐
│  SEU COMPUTADOR              INTERNET              VPS ORACLE       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  localhost:3011  ──→  [Túnel SSH porta 22]  ──→  localhost:3011    │
│  localhost:3012  ──→  [Túnel SSH porta 22]  ──→  localhost:3012    │
│  localhost:3013  ──→  [Túnel SSH porta 22]  ──→  localhost:3013    │
│                                                                     │
│  Sua rede bloqueia 3011-3013, mas permite SSH (22)                 │
│  O túnel "esconde" o tráfego dentro da conexão SSH                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Como Usar

#### 1. Criar o túnel

No seu terminal local:

```bash
ssh -f -N \
  -L 3010:localhost:3010 \
  -L 3011:localhost:3011 \
  -L 3012:localhost:3012 \
  -L 3013:localhost:3013 \
  ubuntu@<IP_DA_VPS>
```

Explicação das flags:
- `-f`: Roda em background
- `-N`: Não executa comando remoto (apenas túnel)
- `-L 3011:localhost:3011`: Redireciona porta local 3011 para porta 3011 da VPS

#### 2. Testar os serviços

Agora você pode acessar os serviços como se estivessem rodando localmente:

```bash
# Health checks
curl http://localhost:3011/users/health
# {"status":"ok"}

curl http://localhost:3012/health
# {"status":"ok"}

curl http://localhost:3013/registrations/health
# {"status":"ok"}

# Criar inscrição
curl -X POST http://localhost:3013/registrations \
  -H "Content-Type: application/json" \
  -d '{"eventId": 1, "origin": "ssh-tunnel-test"}'
# {"id":1,"userId":1,"eventId":1,"status":"pending",...}

# Listar inscrições
curl http://localhost:3013/registrations/my
# [{"id":1,...}]
```

#### 3. Encerrar o túnel

```bash
pkill -f "ssh -f -N -L"
```

### Exemplo Prático Completo

```bash
# 1. Criar túnel (substitua o IP)
ssh -f -N \
  -L 3010:localhost:3010 \
  -L 3011:localhost:3011 \
  -L 3012:localhost:3012 \
  -L 3013:localhost:3013 \
  ubuntu@64.181.173.121

# 2. Verificar se o túnel está ativo
ps aux | grep "ssh -f -N"
# Deve mostrar o processo SSH rodando

# 3. Testar serviços
curl http://localhost:3011/users/health
# {"status":"ok"}

curl http://localhost:3013/registrations/health  
# {"status":"ok"}

# 4. Fazer operações CRUD
curl -X POST http://localhost:3013/registrations \
  -H "Content-Type: application/json" \
  -d '{"eventId": 1, "origin": "meu-teste"}'
# {"id":5,"userId":1,"eventId":1,"status":"pending","origin":"meu-teste",...}

curl http://localhost:3013/registrations/my
# [{"id":5,...}]

# 5. Quando terminar, encerrar túnel
pkill -f "ssh -f -N -L"
```

### Alternativa: Solicitar Liberação de Portas

Se preferir não usar SSH Tunnel, você pode solicitar à equipe de TI da sua instituição que libere as portas. Use o modelo abaixo:

---

**Assunto:** Solicitação de liberação de portas TCP para acesso a servidor de desenvolvimento

Prezada equipe de TI,

Solicito a liberação das seguintes portas TCP no firewall de saída da rede para acesso a um servidor de desenvolvimento hospedado na Oracle Cloud Infrastructure:

**Destino:** `<IP_DA_SUA_VPS>` (ex: 64.181.173.121)  
**Portas TCP:** 3010, 3011, 3012, 3013  
**Protocolo:** TCP  
**Direção:** Saída (Outbound)

**Justificativa:**  
Estou desenvolvendo um projeto acadêmico (Aurora Platform) que utiliza uma arquitetura de microsserviços. O servidor na nuvem hospeda os seguintes serviços:

| Porta | Serviço | Descrição |
|-------|---------|-----------|
| 3010 | auth-service | Serviço de autenticação |
| 3011 | users-service | Gerenciamento de usuários |
| 3012 | events-service | Gerenciamento de eventos |
| 3013 | registrations-service | Gerenciamento de inscrições |

**Diagnóstico realizado:**
- Acesso via rede móvel (4G): ✅ Funcional
- Acesso via rede institucional: ❌ Timeout (conexão bloqueada)
- O servidor está operacional e acessível de outras redes

A liberação pode ser restrita ao IP de destino específico se necessário por questões de segurança.

Agradeço a atenção e fico à disposição para esclarecimentos.

Atenciosamente,  
[Seu nome]  
[Seu departamento/curso]  
[Seu contato]

---

## Apêndice: Comandos Úteis

### Gerenciamento de Containers

```bash
# Ver status de todos os containers
docker compose --env-file .env.prod -f docker-compose.deploy.yml ps

# Ver logs (todos)
docker compose --env-file .env.prod -f docker-compose.deploy.yml logs -f

# Ver logs (específico)
docker compose --env-file .env.prod -f docker-compose.deploy.yml logs -f registrations-service

# Reiniciar um serviço
docker compose --env-file .env.prod -f docker-compose.deploy.yml restart registrations-service

# Parar tudo
docker compose --env-file .env.prod -f docker-compose.deploy.yml down

# Parar e remover volumes (CUIDADO: apaga banco!)
docker compose --env-file .env.prod -f docker-compose.deploy.yml down -v

# Forçar recriação de containers
docker compose --env-file .env.prod -f docker-compose.deploy.yml up -d --force-recreate
```

### Debug de Containers

```bash
# Entrar em um container
docker exec -it aurora-registrations-deploy sh

# Ver variáveis de ambiente
docker exec aurora-registrations-deploy printenv | sort

# Ver uso de recursos
docker stats

# Ver todos os containers (incluindo parados)
docker ps -a
```

### Banco de Dados

```bash
# Conectar no PostgreSQL
docker exec -it aurora-db-deploy psql -U aurora_user -d aurora_db

# Listar schemas
\dn

# Listar tabelas de um schema
\dt registrations.*

# Executar query
SELECT * FROM registrations.registrations;

# Criar schema manualmente
CREATE SCHEMA IF NOT EXISTS registrations;

# Sair
\q
```

### Rede e Firewall

```bash
# Ver portas escutando
sudo ss -tlnp

# Ver regras iptables
sudo iptables -L INPUT -n --line-numbers

# Adicionar regra iptables
sudo iptables -I INPUT 5 -p tcp --dport 3013 -j ACCEPT

# Salvar regras (persistente)
sudo netfilter-persistent save

# Testar conectividade (da VPS para ela mesma)
curl -s localhost:3011/users/health
```

### Git e Deploy

```bash
# Atualizar código
git pull origin main

# Forçar pull (descarta mudanças locais)
git fetch --all
git reset --hard origin/main

# Ver último commit
git log -1 --oneline

# Ver status
git status
```

### SSH Tunnel (resumo)

```bash
# Criar túnel
ssh -f -N -L 3010:localhost:3010 -L 3011:localhost:3011 -L 3012:localhost:3012 -L 3013:localhost:3013 ubuntu@<IP_VPS>

# Verificar se está ativo
ps aux | grep "ssh -f -N"

# Encerrar túnel
pkill -f "ssh -f -N -L"
```

---

## Checklist Final

Antes de considerar o deploy completo, verifique:

### Infraestrutura
- [ ] VPS criada na Oracle Cloud com IP público
- [ ] Security List liberando portas 3010-3013
- [ ] Docker e Git instalados na VPS
- [ ] Chave SSH configurada para git clone

### Configuração
- [ ] Secrets configurados no GitHub (6 secrets)
- [ ] Repositório clonado na VPS
- [ ] `.env.prod` configurado com senhas seguras
- [ ] `chmod 600 .env.prod` aplicado

### Containers
- [ ] Todos os containers rodando (`docker compose ps`)
- [ ] Banco de dados healthy
- [ ] Todos os schemas criados (auth, users, events, registrations)

### Testes
- [ ] Health endpoints respondendo (interno via SSH)
- [ ] Health endpoints respondendo (externo ou via SSH Tunnel)
- [ ] CRUD funcionando (POST, GET)

### CI/CD
- [ ] Workflow de build executando corretamente
- [ ] Workflow de deploy executando corretamente
- [ ] Push em main dispara pipeline automaticamente

---

> **Última atualização:** 09/12/2025  
> **Testado com:** Ubuntu 22.04, Docker 24.x, PostgreSQL 16, NestJS 11  
> **Autores:** Equipe Aurora Platform
