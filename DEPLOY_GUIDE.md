# Guia de Deploy Automatizado na VPS (Oracle Cloud)

Este documento descreve o processo de configuração de uma máquina virtual (VM) na Oracle Cloud Infrastructure (OCI) e a configuração dos segredos necessários no GitHub para habilitar o deploy contínuo (CD) da aplicação Aurora Platform.

## Índice

- [Visão Geral do Processo](#visão-geral-do-processo)
- [Parte 1: Configuração da Instância na Oracle Cloud (VPS)](#parte-1-configuração-da-instância-na-oracle-cloud-vps)
- [Parte 2: Configuração dos Segredos no GitHub](#parte-2-configuração-dos-segredos-no-github)
- [Parte 3: Preparação Inicial da VPS](#parte-3-preparação-inicial-da-vps)
- [Parte 4: Configuração do Arquivo `.env.prod`](#parte-4-configuração-do-arquivo-envprod)
- [Parte 4.5: Teste Local (Máquina de Desenvolvimento)](#parte-45-teste-local-máquina-de-desenvolvimento)
- [Parte 5: Primeiro Deploy e Validação](#parte-5-primeiro-deploy-e-validação)
- [Parte 6: Troubleshooting - Problemas Comuns](#parte-6-troubleshooting---problemas-comuns)

---

## Visão Geral do Processo

O pipeline de CI/CD funciona em duas etapas principais:
1.  **CI (Integração Contínua):** Workflows (`build-*.yml`) constroem as imagens Docker de cada microsserviço e as publicam no GitHub Container Registry (GHCR) a cada push na branch `main`.
2.  **CD (Deploy Contínuo):** Um workflow (`deploy-to-vps.yml`) é acionado após a conclusão bem-sucedida dos workflows de build. Ele se conecta à VPS via SSH, atualiza o repositório, baixa as novas imagens do GHCR e reinicia os serviços usando `docker-compose`.

### Arquitetura dos Serviços

| Serviço | Porta | Descrição |
|---------|-------|-----------|
| `auth-service` | 3010 | Autenticação (login, logout, refresh token) |
| `users-service` | 3011 | Gerenciamento de usuários |
| `events-service` | 3012 | Gerenciamento de eventos |
| `registrations-service` | 3013 | Gerenciamento de registros/inscrições em eventos |
| `db` (PostgreSQL) | 5432 | Banco de dados compartilhado com schemas separados |

### Workflows de CI/CD

Os workflows do GitHub Actions estão localizados em `.github/workflows/`:

#### Build Workflows (CI)

Cada microsserviço tem seu próprio workflow de build que:
1. É disparado quando há mudanças no código do serviço ou no próprio workflow (via `paths` trigger)
2. Compila a imagem Docker usando Docker Buildx (suporta multi-plataforma: `linux/amd64` e `linux/arm64`)
3. Faz login no GitHub Container Registry (GHCR) usando `GITHUB_TOKEN`
4. Publica a imagem com tags `latest`, `short-sha`, e `branch-name`

**Workflows de build disponíveis:**
- `build-auth-service.yml` — Disparado por mudanças em `packages/auth-service/**`
- `build-users-service.yml` — Disparado por mudanças em `packages/users-service/**`
- `build-events-service.yml` — Disparado por mudanças em `packages/events-service/**`
- `build-registrations-service.yml` — Disparado por mudanças em `packages/registrations-service/**`

#### Deploy Workflow (CD)

O workflow `deploy-to-vps.yml`:
1. É acionado **automaticamente** após a conclusão bem-sucedida de **qualquer** um dos workflows de build (via `workflow_run` trigger)
2. Pode também ser disparado **manualmente** via `workflow_dispatch` (útil para redeployment de emergência)
3. Conecta à VPS via SSH (usando secrets: `VPS_HOST`, `VPS_USERNAME`, `VPS_PRIVATE_KEY`, `VPS_PORT`)
4. Executa os seguintes passos na VPS:
   - Atualiza o repositório local com `git pull origin main`
   - Carrega variáveis de `.env.prod`
   - Faz login no GHCR com `GH_PAT`
   - Baixa as imagens mais recentes
   - Reinicia os containers com `docker compose up -d`

---

## Parte 1: Configuração da Instância na Oracle Cloud (VPS)

Siga estes passos para criar a VM que servirá como nosso ambiente de produção.

### 1. Criação da Instância (VM)

1.  Acesse o painel da **Oracle Cloud**.
2.  Navegue até **Compute** > **Instances**.
3.  Clique em **Create instance**.

### 2. Configurações Principais

Preencha os campos da seguinte forma:

*   **Name:** Dê um nome descritivo, como `aurora-platform-vm`.
*   **Image and shape:**
    *   **Image:** Clique em "Change image" e selecione **Canonical Ubuntu 22.04** (ou a versão LTS mais recente). Evite as versões "Minimal" ou "aarch64".
    *   **Shape:** Escolha uma "Always Free-eligible", como a **VM.Standard.E2.1.Micro**.
*   **Networking:**
    *   **Virtual cloud network:** Selecione `Create new virtual cloud network`. Dê um nome como `vcn-aurora-project`.
    *   **Subnet:** Selecione `Create new public subnet`. Dê um nome como `subnet-public-aurora`.
    *   **Public IP address:** Marque a opção **`Assign a public IPv4 address`**.
*   **Add SSH keys:**
    *   Selecione a opção **`Paste public key`**.
    *   No seu computador local, execute `cat ~/.ssh/id_rsa.pub` para obter sua chave pública.
    *   Cole o conteúdo completo da chave na caixa de texto.
*   **Boot volume:**
    *   Marque a opção **`Use in-transit encryption`**.
    *   Mantenha as outras configurações padrão.

4.  Clique em **Create**.

### 3. (Opcional) Corrigindo a Falta de IP Público

Se, após a criação, a instância aparecer com "Public IP address: -", siga estes passos:
1.  Na página de detalhes da instância, vá para a aba **Networking**.
2.  Role para baixo até a seção **"Attached VNICs"** e clique no nome da sua VNIC (ex: `vnic-aurora-vm-01`).
3.  Na página de detalhes da VNIC, vá para a seção **"IPv4 Addresses"** (ou "IP Administration").
4.  Na linha do seu IP privado, clique no menu de três pontos (⋮) e selecione **Edit**.
5.  Na janela que abrir, em "Public IP Type", selecione **"Ephemeral public IP"**.
6.  Clique em **Update**.

### 4. Configurar Security List (Liberar Portas dos Serviços)

Por padrão, a Oracle Cloud bloqueia todo o tráfego de entrada, exceto SSH (porta 22). Para acessar os serviços da Aurora Platform externamente, você precisa liberar as portas 3010-3013 na Security List da VCN.

#### Passo a passo:

1.  No painel da Oracle Cloud, vá em **Networking** → **Virtual cloud networks**.
2.  Clique na VCN da sua instância (ex: `vcn-aurora-project`).
3.  No menu lateral ou na lista de recursos, clique em **Security Lists**.
4.  Clique na security list padrão (ex: `Default Security List for vcn-aurora-project`).
5.  Na aba **Ingress Rules**, clique em **Add Ingress Rules**.
6.  Preencha os campos:

| Campo | Valor |
|-------|-------|
| **Stateless** | Não (deixe desmarcado) |
| **Source Type** | CIDR |
| **Source CIDR** | `0.0.0.0/0` |
| **IP Protocol** | TCP |
| **Source Port Range** | (deixe vazio - All) |
| **Destination Port Range** | `3010-3013` |
| **Description** | `Aurora Platform Services (auth, users, events, registrations)` |

7.  Clique em **Add Ingress Rules**.

> **Nota de Segurança:** Em produção real, considere restringir o `Source CIDR` para IPs específicos ou usar um Load Balancer/API Gateway.

#### Verificação

Após adicionar a regra, você deve ter 4 regras de Ingress:
- TCP porta 22 (SSH)
- TCP portas 3010-3012 (Aurora Platform)
- ICMP (diagnósticos de rede)

---

## Parte 2: Configuração dos Segredos no GitHub

Para que o workflow de deploy (`deploy-to-vps.yml`) funcione, ele precisa de credenciais para acessar a VPS e o registro de pacotes do GitHub.

Navegue até o seu repositório no GitHub e vá para **Settings** > **Secrets and variables** > **Actions**. Crie os 5 segredos a seguir:

#### 1. `VPS_HOST`
*   **Descrição:** O endereço IP público da sua instância na Oracle Cloud.
*   **Como obter:** Na página de detalhes da sua instância na OCI, copie o valor do campo **Public IP address**.

#### 2. `VPS_USERNAME`
*   **Descrição:** O nome de usuário para a conexão SSH.
*   **Como obter:** Como usamos uma imagem Ubuntu, o valor é sempre `ubuntu`.

#### 3. `VPS_PORT`
*   **Descrição:** A porta para a conexão SSH.
*   **Como obter:** O valor padrão é `22`.

#### 4. `VPS_PRIVATE_KEY`
*   **Descrição:** A chave SSH privada do seu computador, que corresponde à chave pública que você inseriu na Oracle.
*   **Como obter:**
    1.  No seu terminal local, execute o comando: `cat ~/.ssh/id_rsa`
    2.  Copie **todo o conteúdo exibido**, incluindo as linhas `-----BEGIN ... KEY-----` e `-----END ... KEY-----`.
    3.  Cole este conteúdo no valor do segredo.

#### 5. `GH_PAT`
*   **Descrição:** Um Personal Access Token (PAT) do GitHub para permitir que a VPS baixe as imagens Docker privadas.
*   **Como obter:**
    1.  No GitHub, vá para **Settings** > **Developer settings** > **Personal access tokens** > **Tokens (classic)**.
    2.  Clique em **Generate new token**.
    3.  Dê um nome (ex: `AURORA_DEPLOY_VPS`) e marque o escopo (permissão) **`read:packages`**.
    4.  Gere o token e copie o valor para este segredo.

#### Segurança — token exposto e rotação

Se um PAT for acidentalmente exposto (por exemplo, colado em um chat ou log), revogue-o imediatamente e gere um novo. Abaixo estão passos rápidos e comandos úteis:

- Revogar o token (UI): GitHub → sua foto → Settings → Developer settings → Personal access tokens → Tokens (classic) → Revoke/Delete o token comprometido.
- Gerar novo token: crie com o nome `AURORA_DEPLOY_VPS` e scopes mínimos (`read:packages`; adicione `repo` só se necessário). Copie o valor IMEDIATAMENTE — não será possível visualizá-lo depois.
- Atualizar secret `GH_PAT` no repositório (recomendado a partir do seu computador local):

```bash
# substituir <SEU_NOVO_TOKEN_AQUI> pelo token copiado
echo -n "<SEU_NOVO_TOKEN_AQUI>" | gh secret set GH_PAT -R evertonfoz/dsc-2025-2-aurora-platform
```

- Alternativa pela UI: Repositório → Settings → Secrets and variables → Actions → New repository secret / Update existing → Name `GH_PAT` → Value = token.
- Testar login no GitHub Container Registry (GHCR) na VPS:

```bash
# no servidor (substitua <OWNER> pelo seu usuário/org)
echo -n "<SEU_NOVO_TOKEN_AQUI>" | docker login ghcr.io -u <OWNER> --password-stdin
```

- Se você estiver autenticando a CLI `gh` na VPS, use (cole o token no terminal do VPS):

```bash
echo -n "<SEU_NOVO_TOKEN_AQUI>" | gh auth login --with-token
```

Observações importantes:
- Nunca cole tokens em chats ou repositórios públicos.
- Se não tiver certeza se um token foi exposto, revogue-o e gere outro — é a maneira mais segura.


#### 6. `VPS_PROJECT_DIR`
*   **Descrição:** Nome do diretório no servidor onde o projeto será clonado/executado (ex: `dsc-2025-2-aurora-platform` ou `aurora-platform`).
*   **Como obter/configurar:** Defina um valor consistente com o diretório que você usará na VPS. Este valor é usado pelo workflow `deploy-to-vps.yml` para navegar até o projeto antes de atualizar imagens e reiniciar os serviços.
*   **Como adicionar:** Vá em **Settings** > **Secrets and variables** > **Actions** e crie `VPS_PROJECT_DIR` com o nome do diretório desejado.

**Como confirmar o valor de `VPS_PROJECT_DIR` na VPS**

Se você não tem certeza qual é o nome do diretório que contém o projeto na VPS, conecte-se à máquina e execute estas verificações (substitua `<POSSIVEL_DIR>` conforme necessário):

```bash
# listar diretórios em /home/ubuntu
ls -la /home/ubuntu

# procurar pastas com nome parecido
find /home/ubuntu -maxdepth 2 -type d -name '*aurora*' -print

# confirmar que é um repositório Git e checar o remote
git -C /home/ubuntu/<POSSIVEL_DIR> remote get-url origin
```

O valor do secret `VPS_PROJECT_DIR` deve ser apenas o nome do diretório (por exemplo `dsc-2025-2-aurora-platform`), sem `/home/ubuntu/`.

**Criando os secrets via GitHub CLI (`gh`)**

Se preferir criar os secrets pela linha de comando com a GitHub CLI, autentique o `gh` com uma conta que tenha permissão no repositório e execute os comandos abaixo substituindo `OWNER/REPO` pelo seu repositório (ex: `evertonfoz/dsc-2025-2-aurora-platform`) e os valores correspondentes:

```bash
# substitua OWNER/REPO pelo seu repositório
REPO=OWNER/REPO

# VPS host (IP)
echo -n "<VPS_HOST_IP>" | gh secret set VPS_HOST -R "$REPO"

# VPS username (ex: ubuntu)
echo -n "ubuntu" | gh secret set VPS_USERNAME -R "$REPO"

# VPS SSH port (ex: 22)
echo -n "22" | gh secret set VPS_PORT -R "$REPO"

# VPS private key (conteúdo do arquivo ~/.ssh/id_rsa)
gh secret set VPS_PRIVATE_KEY -R "$REPO" --body "$(cat ~/.ssh/id_rsa)"

# GitHub PAT para ler packages (GHCR)
echo -n "<GH_PAT>" | gh secret set GH_PAT -R "$REPO"

# Diretório do projeto na VPS (apenas o nome)
echo -n "dsc-2025-2-aurora-platform" | gh secret set VPS_PROJECT_DIR -R "$REPO"
```

Notas:
- O comando `gh secret set` sobrescreve o segredo se ele já existir.
- Para `VPS_PRIVATE_KEY` use um arquivo seguro; o exemplo acima usa `--body "$(cat file)"` para enviar o conteúdo do arquivo.
- Assegure-se de que `gh auth login` esteja configurado com uma conta que tenha permissão de escrita nos secrets do repositório.

## Nota: executando os comandos diretamente na VPS (Ubuntu)

Se você tentar executar os comandos `gh secret set` diretamente na VPS e receber o erro "Command 'gh' not found", instale o GitHub CLI (`gh`) na VPS antes de criar os secrets. Exemplos de instalação para Ubuntu (recomendado via repositório oficial):

```bash
# Instalar GitHub CLI (repositório oficial)
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install -y gh

# Alternativa via snap:
# sudo snap install gh

# Verifique e autentique (se necessário):
gh --version
gh auth login
```

Depois da instalação e autenticação, você pode executar os mesmos comandos `echo -n ... | gh secret set ...` mostrados acima para criar os secrets.

Se preferir não instalar nada na VPS, crie os secrets pela interface do GitHub no navegador: `Repository` → `Settings` → `Secrets and variables` → `Actions` → `New repository secret`.

---

Com a VPS criada e os segredos configurados, o pipeline de CI/CD está completo.

---

## Parte 3: Preparação Inicial da VPS

Antes que o primeiro deploy automático possa funcionar, precisamos acessar a VPS e instalar o software necessário (Git, Docker e Docker Compose).

### 1. Conectar à VPS via SSH

1.  Abra seu terminal local.
2.  Use o seguinte comando para se conectar, substituindo `<SEU_VPS_HOST>` pelo endereço IP público da sua instância:
    ```bash
    ssh -i ~/.ssh/id_rsa ubuntu@<SEU_VPS_HOST>
    ```
3.  Na primeira conexão, ele perguntará se você confia no host. Digite `yes` e pressione Enter.

### 2. Instalar Software e Clonar o Repositório

Uma vez conectado à VPS, execute os seguintes comandos, um por um:

```bash
# Atualiza a lista de pacotes e o sistema
sudo apt update && sudo apt upgrade -y

# Instala Git, Docker e Docker Compose
sudo apt install -y git docker.io docker-compose

# Adiciona seu usuário ao grupo do Docker para poder executar comandos sem 'sudo'
sudo usermod -aG docker ${USER}

# Clona o repositório do projeto para o diretório home
git clone https://github.com/seu-usuario/seu-repositorio.git /home/ubuntu/<SEU_DIRETORIO_DO_PROJETO>

Nota: o workflow de deploy (`deploy-to-vps.yml`) usa o segredo `VPS_PROJECT_DIR` para navegar até `/home/ubuntu/<SEU_DIRETORIO_DO_PROJETO>` antes de executar `docker compose`. Garanta que o valor do segredo corresponda ao diretório em que o repositório foi clonado na VPS.

Se o diretório não existir no servidor, você pode criá-lo e ajustar a propriedade para `ubuntu` (execute como usuário com sudo):

```bash
sudo mkdir -p /home/ubuntu/<SEU_DIRETORIO_DO_PROJETO>
sudo chown ubuntu:ubuntu /home/ubuntu/<SEU_DIRETORIO_DO_PROJETO>
```

### Teste manual do fluxo de deploy (recomendado antes de acionar o workflow)

Antes de acionar o workflow `deploy-to-vps.yml`, é uma boa prática executar manualmente os mesmos comandos na VPS para validar configurações e evitar falhas no CI. Siga estes passos **como usuário `ubuntu`** na VPS.

**Checklist rápido — Teste local do deploy (VPS)**

- **1.** Conecte-se à VPS via SSH como `ubuntu`.
- **2.** Confirme que `/home/ubuntu/<SEU_DIRETORIO_DO_PROJETO>` existe e contém o repositório.
- **3.** Verifique presença de `.env.prod` e `docker-compose.deploy.yml`.
- **4.** Faça login no GHCR com `GH_PAT` temporário e teste `docker login ghcr.io`.
- **5.** Execute o script helper para checagens e (opcional) deploy:

```bash
cd /home/ubuntu/<SEU_DIRETORIO_DO_PROJETO>
chmod +x scripts/run-deploy-test.sh
./scripts/run-deploy-test.sh --dir <SEU_DIRETORIO_DO_PROJETO> --deploy
```

Siga a sequência acima antes de acionar o workflow automático; ela reproduz o que o CI fará e facilita resolução de problemas locais.

1) Conectar na VPS (exemplo):

```bash
ssh -i ~/.ssh/id_rsa ubuntu@<SEU_VPS_HOST>
```

2) Verificações iniciais

```bash
# confirmar que o diretório do projeto existe
ls -la /home/ubuntu/<SEU_DIRETORIO_DO_PROJETO>

# checar se o repositório tem o remote correto
git -C /home/ubuntu/<SEU_DIRETORIO_DO_PROJETO> remote get-url origin

# verificar arquivos essenciais
test -f /home/ubuntu/<SEU_DIRETORIO_DO_PROJETO>/.env.prod || echo ".env.prod não encontrado"
test -f /home/ubuntu/<SEU_DIRETORIO_DO_PROJETO>/docker-compose.deploy.yml || echo "docker-compose.deploy.yml não encontrado"

# checar docker / compose
docker --version || echo "Docker não encontrado"
docker compose version || echo "Docker Compose (v2) não encontrado"
```

3) Atualizar código e preparar variáveis de ambiente

```bash
cd /home/ubuntu/<SEU_DIRETORIO_DO_PROJETO>
git fetch --all
git checkout main
git pull origin main

# exportar variáveis do .env.prod (opção 1 - conforme workflow)
export $(grep -v '^#' .env.prod | xargs)

# alternativa (mais segura se .env.prod contém espaços ou caracteres especiais):
# set -o allexport; source .env.prod; set +o allexport
```

4) Validar o arquivo docker-compose (dry-run)

```bash
docker compose -f docker-compose.deploy.yml config >/dev/null || { echo "Erro no docker-compose.deploy.yml"; exit 1; }
```

5) Fazer login no GitHub Container Registry (GHCR)

Defina o token temporariamente como variável de ambiente (`GH_PAT`) ou use o prompt interativo. NÃO deixe o token em texto claro em arquivos.

```bash
# Exemplo (substitua <OWNER> e exporte GH_PAT temporariamente)
export GH_PAT=<seu_pat_aqui>
echo "$GH_PAT" | docker login ghcr.io -u <OWNER> --password-stdin

# (remova a variável após o teste)
unset GH_PAT
```

6) Baixar novas imagens e reiniciar serviços

```bash
docker compose -f docker-compose.deploy.yml pull
docker compose -f docker-compose.deploy.yml up -d
```

7) Verificar status dos serviços

```bash
docker compose -f docker-compose.deploy.yml ps
docker ps --format "table {{.Names}}	{{.Status}}	{{.Ports}}"
# acompanhar logs de um serviço específico
docker compose -f docker-compose.deploy.yml logs -f <SERVICE_NAME>
```

8) Limpeza e resumo

```bash
# Se precisar parar os serviços (apenas para teste)
docker compose -f docker-compose.deploy.yml down
```

Notas e cuidados
- Execute os comandos como `ubuntu` (sem `sudo`) quando possível; usar `sudo` muda o contexto do usuário e das chaves SSH.
- Se o usuário `ubuntu` não tiver permissão para rodar `docker` sem sudo, execute `sudo usermod -aG docker ubuntu` e reconecte a sessão SSH.
- Nunca exponha `GH_PAT` em arquivos ou logs públicos. Use secrets do GitHub Actions para deploys automatizados.

Se este teste manual for bem-sucedido, o workflow `deploy-to-vps.yml` deve executar os mesmos passos automaticamente quando acionado.

O repositório inclui um script helper `scripts/run-deploy-test.sh` que automatiza as checagens e (opcionalmente) executa o deploy localmente na VPS. Ele deve ser executado na VPS como o usuário `ubuntu` e aceita as opções `--dir`, `--deploy`, `--down`, `--no-pull` e `--skip-git`.

#### Usando o script `scripts/run-deploy-test.sh`

1) Dê permissão de execução e rode o script a partir do diretório clonado (exemplo):

```bash
cd /home/ubuntu/<SEU_DIRETORIO_DO_PROJETO>
chmod +x scripts/run-deploy-test.sh
./scripts/run-deploy-test.sh --dir <SEU_DIRETORIO_DO_PROJETO>
```

2) Para rodar as checagens e aplicar o deploy (pull + up -d):

```bash
./scripts/run-deploy-test.sh --dir <SEU_DIRETORIO_DO_PROJETO> --deploy
```

3) Para parar os serviços (docker compose down):

```bash
./scripts/run-deploy-test.sh --dir <SEU_DIRETORIO_DO_PROJETO> --down
```

Opções úteis:
- `--no-pull` — usado com `--deploy` para evitar `docker compose pull`.
- `--skip-git` — pula os passos de git fetch/checkout/pull.


### Opções de autenticação (SSH recomendado)

Prefira autenticar via SSH gerando uma chave na própria VPS e adicionando a chave pública no GitHub como *Deploy Key* (apenas leitura) ou como chave SSH da conta.

Como fazer (execute como `ubuntu`, sem `sudo`):

```bash
# 1) Gerar chave ED25519 na VPS (sem passphrase para automação)
ssh-keygen -t ed25519 -C "deploy@aurora" -f ~/.ssh/id_ed25519

# 2) Ajustar permissões
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub

# 3) Copiar a chave pública e adicioná-la no GitHub
cat ~/.ssh/id_ed25519.pub
# Cole o conteúdo em: Repository → Settings → Deploy keys → Add deploy key

# 4) Testar a autenticação SSH
ssh -T git@github.com

# 5) Clonar sem usar sudo
rm -rf /home/ubuntu/<SEU_DIRETORIO_DO_PROJETO>
git clone git@github.com:seu-usuario/seu-repositorio.git /home/ubuntu/<SEU_DIRETORIO_DO_PROJETO>
```

Observações:
- **Não use `sudo git clone`** — `sudo` faz o SSH usar `/root/.ssh` (root provavelmente não tem sua chave).
- Para permitir apenas pull do repositório, use *Deploy Key* no repositório e não marque *Allow write access*.

### Alternativa: HTTPS com Personal Access Token (PAT)

Se preferir não configurar SSH, use HTTPS com um PAT com permissão `repo`/`read:packages` (útil para recuperar imagens do GHCR). Exemplo rápido (não recomendado deixar token em histórico):

```bash
export GITHUB_TOKEN=<seu_PAT>
git clone https://$GITHUB_TOKEN@github.com/seu-usuario/seu-repositorio.git /home/ubuntu/<SEU_DIRETORIO_DO_PROJETO>
unset GITHUB_TOKEN
```

Melhor prática: configure o token via `git credential` ou use a CLI `gh auth login`.

### Complemento (menos recomendado): copiar chave privada local para a VPS

É possível copiar sua chave privada do seu PC para a VPS, mas isso aumenta risco de exposição. Caso decida fazê-lo, siga estes passos com cuidado e somente se compreender os riscos:

```bash
# No seu PC local (não no VPS):
scp ~/.ssh/id_rsa ubuntu@<VPS_IP>:/home/ubuntu/.ssh/id_rsa

# No VPS (execute como ubuntu):
chmod 600 ~/.ssh/id_rsa
chown ubuntu:ubuntu ~/.ssh/id_rsa
ssh -T git@github.com

# Remova o arquivo do PC local se desejar (opcional):
# shred -u ~/.ssh/id_rsa.backup
```

Aviso: copiar chaves privadas é arriscado — prefira gerar um par de chaves exclusivo na VPS ou usar *Deploy Key*.
```
**Importante:** Após executar `sudo usermod -aG docker ${USER}`, você precisa **sair da sessão SSH e reconectar** para que a permissão tenha efeito.

---

## Parte 4: Configuração do Arquivo `.env.prod`

O arquivo `.env.prod` contém todas as variáveis de ambiente necessárias para o deploy. Este arquivo **NÃO deve ser commitado no repositório** por conter senhas e tokens sensíveis.

### 1. Criar o arquivo `.env.prod` na VPS

Conecte-se à VPS e crie o arquivo:

```bash
ssh -i ~/.ssh/id_rsa ubuntu@<SEU_VPS_HOST>
cd /home/ubuntu/<SEU_DIRETORIO_DO_PROJETO>
nano .env.prod
```

### 2. Conteúdo do `.env.prod`

Cole o seguinte conteúdo, substituindo os valores entre `< >`:

```bash
# ============================================
# CONFIGURAÇÃO DO BANCO DE DADOS (PostgreSQL)
# ============================================
POSTGRES_USER=aurora_user
POSTGRES_DB=aurora_db
POSTGRES_PASSWORD=<SENHA_FORTE_AQUI>

# ============================================
# CONFIGURAÇÃO DO REPOSITÓRIO (GHCR)
# ============================================
REPO_OWNER=<SEU_USUARIO_GITHUB>
GH_PAT=<SEU_PERSONAL_ACCESS_TOKEN>

# ============================================
# CONFIGURAÇÃO DE SEGURANÇA (JWT)
# ============================================
JWT_ACCESS_SECRET=<CHAVE_SECRETA_JWT_AQUI>
JWT_EXPIRES_IN=15m

# ============================================
# CONFIGURAÇÃO INTER-SERVIÇOS
# ============================================
SERVICE_TOKEN=<TOKEN_COMUNICACAO_SERVICOS>

# ============================================
# OPCIONAL: HASH PEPPER (segurança adicional para senhas)
# ============================================
HASH_PEPPER=<VALOR_OPCIONAL>

# ============================================
# TAGS DAS IMAGENS (opcional - padrão: latest)
# ============================================
# AUTH_IMAGE_TAG=latest
# USERS_IMAGE_TAG=latest
# EVENTS_IMAGE_TAG=latest
```

### 3. Gerar senhas e tokens seguros

Use os comandos abaixo para gerar valores seguros:

```bash
# Gerar POSTGRES_PASSWORD (48 caracteres hexadecimais)
openssl rand -hex 24

# Gerar JWT_ACCESS_SECRET (64 caracteres hexadecimais)
openssl rand -hex 32

# Gerar SERVICE_TOKEN (32 caracteres hexadecimais)
openssl rand -hex 16
```

### 4. Proteger o arquivo

```bash
chmod 600 .env.prod
```

### 5. Verificar se o arquivo está correto

```bash
# Listar variáveis (sem mostrar valores sensíveis)
grep -E "^[A-Z_]+=" .env.prod | cut -d'=' -f1

# Deve mostrar:
# POSTGRES_USER
# POSTGRES_DB
# POSTGRES_PASSWORD
# REPO_OWNER
# GH_PAT
# JWT_ACCESS_SECRET
# JWT_EXPIRES_IN
# SERVICE_TOKEN
```

> ⚠️ **IMPORTANTE**: Nunca commite o arquivo `.env.prod` no Git. Ele já está no `.gitignore`.

---

## Parte 4.5: Teste Local (Máquina de Desenvolvimento)

Antes de fazer deploy na VPS, é recomendado testar a stack Docker localmente (no seu Mac ou PC de desenvolvimento). Isso ajuda a identificar problemas de configuração antes de subir para produção.

### Pré-requisitos

- Docker Desktop instalado e rodando
- Arquivo `.env.prod` preenchido no root do repositório
- Login no GHCR (se as imagens forem privadas)

### 1. Criar/verificar o arquivo `.env.prod`

Crie o arquivo `.env.prod` no root do repositório com as variáveis necessárias:

```bash
# Exemplo mínimo de .env.prod para teste local
NODE_ENV=production

# Postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=SuaSenhaSegura123!
POSTGRES_DB=aurora_db

# App DB connection
DB_HOST=db
DB_PORT=5432
DB_USER=postgres
DB_PASS=SuaSenhaSegura123!
DB_NAME=aurora_db
DB_SSL=false
DB_LOGGING=false

# GitHub Container Registry
REPO_OWNER=evertonfoz
USERS_IMAGE_TAG=latest
AUTH_IMAGE_TAG=latest
EVENTS_IMAGE_TAG=latest

# JWT
JWT_ACCESS_SECRET=SeuSegredoJwtAqui
JWT_REFRESH_SECRET=SeuSegredoRefreshAqui

# Service token
SERVICE_TOKEN=SeuServiceTokenAqui
HASH_PEPPER=

# URLs internas (docker network)
USERS_API_URL=http://users-service:3011
```

### 2. Login no GHCR (se imagens privadas)

```bash
export GH_PAT="<SEU_GH_PAT>"
echo -n "$GH_PAT" | docker login ghcr.io -u evertonfoz --password-stdin
unset GH_PAT
```

### 3. Baixar imagens e subir serviços

⚠️ **Importante:** Use `--env-file .env.prod` para carregar as variáveis corretamente:

```bash
# Validar o docker-compose (dry-run)
docker compose --env-file .env.prod -f docker-compose.deploy.yml config

# Baixar imagens
docker compose --env-file .env.prod -f docker-compose.deploy.yml pull

# Subir serviços
docker compose --env-file .env.prod -f docker-compose.deploy.yml up -d
```

### 4. Verificar status

```bash
docker compose --env-file .env.prod -f docker-compose.deploy.yml ps
```

Saída esperada:
```
NAME                   STATUS                    PORTS
aurora-auth-deploy     Up X seconds              0.0.0.0:3010->3010/tcp
aurora-db-deploy       Up X minutes (healthy)    5432/tcp
aurora-events-deploy   Up X seconds              0.0.0.0:3012->3012/tcp
aurora-users-deploy    Up X seconds              0.0.0.0:3011->3011/tcp
```

### 5. Testar endpoints de health

```bash
# users-service
curl http://localhost:3011/users/health

# events-service
curl http://localhost:3012/health

# Swagger docs (abrir no navegador)
open http://localhost:3011/docs
open http://localhost:3012/docs
```

### 6. Ver logs

```bash
# Todos os serviços
docker compose --env-file .env.prod -f docker-compose.deploy.yml logs -f

# Serviço específico
docker compose --env-file .env.prod -f docker-compose.deploy.yml logs -f users-service
```

### 7. Parar serviços

```bash
# Parar (preserva volumes/dados)
docker compose --env-file .env.prod -f docker-compose.deploy.yml down

# Parar E remover volumes (reseta banco)
docker compose --env-file .env.prod -f docker-compose.deploy.yml down -v
```

### Problemas comuns no teste local

#### Erro: `invalid reference format`

**Causa:** Variáveis como `REPO_OWNER` não estão definidas, gerando nomes de imagem inválidos (ex: `ghcr.io//users-service:latest`).

**Solução:** Use `--env-file .env.prod` em todos os comandos `docker compose`, ou exporte as variáveis no shell:

```bash
export REPO_OWNER=evertonfoz
docker compose -f docker-compose.deploy.yml pull
```

#### Erro: `password authentication failed for user "postgres"`

**Causa:** O volume do PostgreSQL foi criado com uma senha diferente da atual no `.env.prod`.

**Solução:** Remover o volume e recriar (apaga dados do banco local):

```bash
docker compose --env-file .env.prod -f docker-compose.deploy.yml down -v
docker compose --env-file .env.prod -f docker-compose.deploy.yml up -d
```

#### Containers reiniciando em loop

**Diagnóstico:**
```bash
docker compose --env-file .env.prod -f docker-compose.deploy.yml logs --tail 50
```

Procure por erros de conexão com banco ou variáveis faltando.

---

## Parte 5: Primeiro Deploy e Validação

### 1. Exportar variáveis de ambiente

```bash
cd /home/ubuntu/<SEU_DIRETORIO_DO_PROJETO>
export $(grep -v '^#' .env.prod | xargs)
```

### 2. Login no GitHub Container Registry

```bash
echo "$GH_PAT" | docker login ghcr.io -u $REPO_OWNER --password-stdin
```

Você deve ver: `Login Succeeded`

### 3. Baixar imagens e iniciar serviços

```bash
docker compose -f docker-compose.deploy.yml pull
docker compose -f docker-compose.deploy.yml up -d
```

### 4. Verificar status dos containers

```bash
docker compose -f docker-compose.deploy.yml ps
```

Saída esperada (todos com status `Up`):
```
NAME                   STATUS                    PORTS
aurora-auth-deploy     Up X seconds              0.0.0.0:3010->3010/tcp
aurora-db-deploy       Up X minutes (healthy)    5432/tcp
aurora-events-deploy   Up X seconds              0.0.0.0:3012->3012/tcp
aurora-users-deploy    Up X seconds              0.0.0.0:3011->3011/tcp
```

### 5. Verificar logs dos serviços

```bash
# Ver logs de todos os serviços
docker compose -f docker-compose.deploy.yml logs --tail 50

# Ver logs de um serviço específico
docker compose -f docker-compose.deploy.yml logs --tail 30 users-service
```

Procure por mensagens de sucesso como:
- `Nest application successfully started`
- `listening on port 30XX`

### 6. Testar endpoints de health

```bash
# users-service
curl http://localhost:3011/users/health
# Esperado: {"status":"ok"}

# events-service
curl http://localhost:3012/health
# Esperado: {"status":"ok"}

# auth-service (testar se responde)
curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:3010/auth/login
# Esperado: HTTP 400 ou 401 (endpoint existe mas precisa de credenciais)
```

### 7. Testar acesso externo (do seu computador local)

Após configurar a Security List da Oracle Cloud (Parte 1, seção 4), você pode testar o acesso externo diretamente do seu computador:

```bash
# Substitua <IP_VPS> pelo IP público da sua instância
# Exemplo: 64.181.173.121

# users-service
curl http://<IP_VPS>:3011/users/health
# Esperado: {"status":"ok"}

# events-service
curl http://<IP_VPS>:3012/health
# Esperado: {"status":"ok"}

# auth-service - testar login (sem credenciais)
curl -s -o /dev/null -w "HTTP %{http_code}" http://<IP_VPS>:3010/auth/login
# Esperado: HTTP 400 ou 404 (endpoint existe)

# auth-service - testar login com credenciais
curl -X POST http://<IP_VPS>:3010/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@aurora.com", "password": "SuaSenhaAqui"}'
# Esperado: JSON com access_token e refresh_token
```

> **Se o teste externo falhar com timeout:**
> 1. Verifique se a Security List está configurada (Parte 1, seção 4)
> 2. Verifique se o iptables da VPS tem as portas abertas:
>    ```bash
>    ssh ubuntu@<IP_VPS> "sudo iptables -L INPUT -n | grep -E '301[0-2]'"
>    ```
> 3. Se necessário, abra as portas no iptables:
>    ```bash
>    ssh ubuntu@<IP_VPS> "sudo iptables -I INPUT 5 -p tcp --dport 3010 -j ACCEPT && \
>      sudo iptables -I INPUT 5 -p tcp --dport 3011 -j ACCEPT && \
>      sudo iptables -I INPUT 5 -p tcp --dport 3012 -j ACCEPT"
>    ```

---

## Parte 6: Troubleshooting - Problemas Comuns

### Problema 1: "password authentication failed for user"

**Sintoma:** Os serviços NestJS falham ao conectar no banco com erro:
```
error: password authentication failed for user "aurora_user"
```

**Causa:** O volume do PostgreSQL foi inicializado com uma senha diferente da atual no `.env.prod`.

**Solução A - Resetar a senha no banco (preserva dados):**

```bash
# Conectar no container do banco
docker exec -it aurora-db-deploy bash

# Dentro do container, conectar no psql
psql -U $POSTGRES_USER -d $POSTGRES_DB

# Alterar a senha (substitua pela senha do .env.prod)
ALTER ROLE aurora_user WITH PASSWORD 'SUA_SENHA_DO_ENV_PROD';

# Sair
\q
exit

# Reiniciar os serviços
docker compose -f docker-compose.deploy.yml restart users-service auth-service events-service
```

**Solução B - Recriar o volume (APAGA todos os dados):**

```bash
docker compose -f docker-compose.deploy.yml down -v
docker compose -f docker-compose.deploy.yml up -d
```

---

### Problema 2: "role 'postgres' does not exist"

**Sintoma:** O script de inicialização do banco falha com:
```
ERROR: role "postgres" does not exist
```

**Causa:** O `POSTGRES_USER` está configurado como `aurora_user`, mas o script SQL usa `AUTHORIZATION postgres`.

**Solução:** Criar o role `postgres` manualmente:

```bash
docker exec -it aurora-db-deploy bash -c "
  PGPASSWORD=\$POSTGRES_PASSWORD psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c '
    CREATE ROLE postgres WITH LOGIN;
  '
"

# Re-executar o script de inicialização
docker exec -it aurora-db-deploy bash -c "
  PGPASSWORD=\$POSTGRES_PASSWORD psql -U \$POSTGRES_USER -d \$POSTGRES_DB \
    -f /docker-entrypoint-initdb.d/01-create-db-and-schemas.sql
"
```

---

### Problema 3: Container reiniciando em loop (CrashLoopBackOff)

**Sintoma:** `docker compose ps` mostra containers reiniciando constantemente.

**Diagnóstico:**
```bash
# Ver logs do container problemático
docker compose -f docker-compose.deploy.yml logs --tail 100 users-service

# Ver status detalhado
docker inspect aurora-users-deploy --format='{{.State.Status}} - {{.State.Error}}'
```

**Causas comuns:**
1. Variáveis de ambiente faltando
2. Banco de dados não está healthy
3. Erro na aplicação

**Solução - Verificar variáveis:**
```bash
# Comparar variáveis do container com o esperado
docker exec aurora-users-deploy printenv | grep -E "^(DB_|POSTGRES_)" | sort
```

---

### Problema 4: Serviços não conseguem se comunicar

**Sintoma:** `auth-service` não consegue chamar `users-service`.

**Diagnóstico:**
```bash
# Verificar se estão na mesma rede
docker network inspect dsc-2025-2-aurora-platform_aurora_network

# Testar DNS interno
docker exec aurora-auth-deploy ping -c 2 users-service
```

**Solução:** Verificar se os serviços estão na mesma network no `docker-compose.deploy.yml`.

---

### Problema 5: "permission denied" ao executar docker

**Sintoma:** Erro de permissão ao rodar comandos docker.

**Solução:**
```bash
sudo usermod -aG docker $USER
# IMPORTANTE: Desconectar e reconectar SSH
exit
ssh -i ~/.ssh/id_rsa ubuntu@<VPS_HOST>
```

---

### Problema 6: Imagens não atualizam após deploy

**Sintoma:** Mesmo após `docker compose pull`, a aplicação não reflete as mudanças.

**Solução:** Forçar recriação dos containers:
```bash
docker compose -f docker-compose.deploy.yml up -d --force-recreate
```

---

### Problema 7: Disco cheio

**Sintoma:** Erros de "no space left on device".

**Solução - Limpar recursos Docker não utilizados:**
```bash
# Ver uso de disco
docker system df

# Limpar imagens, containers e volumes não utilizados
docker system prune -a --volumes
```

---

### Comandos Úteis para Debug

```bash
# Ver todos os containers (incluindo parados)
docker ps -a

# Ver logs em tempo real
docker compose -f docker-compose.deploy.yml logs -f

# Entrar em um container
docker exec -it aurora-users-deploy sh

# Ver uso de recursos
docker stats

# Reiniciar um serviço específico
docker compose -f docker-compose.deploy.yml restart users-service

# Parar tudo
docker compose -f docker-compose.deploy.yml down

# Parar tudo E remover volumes (CUIDADO: apaga dados do banco)
docker compose -f docker-compose.deploy.yml down -v

# Ver variáveis de ambiente de um container
docker exec aurora-users-deploy printenv | sort

# Testar conexão com o banco de dentro de um serviço
docker exec aurora-db-deploy bash -c "PGPASSWORD=\$POSTGRES_PASSWORD psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c 'SELECT version();'"
```

---

### Checklist de Verificação Pós-Deploy

- [ ] Todos os containers estão rodando (`docker compose ps`)
- [ ] O banco está healthy (status `healthy`)
- [ ] `users-service` responde em `/users/health`
- [ ] `events-service` responde em `/health`
- [ ] `auth-service` está aceitando requisições na porta 3010
- [ ] Logs não mostram erros de conexão com banco
- [ ] Variáveis sensíveis não estão expostas nos logs