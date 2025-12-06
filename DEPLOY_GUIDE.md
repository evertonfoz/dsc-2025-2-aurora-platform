# Guia de Deploy Automatizado na VPS (Oracle Cloud)

Este documento descreve o processo de configuração de uma máquina virtual (VM) na Oracle Cloud Infrastructure (OCI) e a configuração dos segredos necessários no GitHub para habilitar o deploy contínuo (CD) da aplicação Aurora Platform.

## Visão Geral do Processo

O pipeline de CI/CD funciona em duas etapas principais:
1.  **CI (Integração Contínua):** Workflows (`build-*.yml`) constroem as imagens Docker de cada microsserviço e as publicam no GitHub Container Registry (GHCR) a cada push na branch `main`.
2.  **CD (Deploy Contínuo):** Um workflow (`deploy-to-vps.yml`) é acionado após a conclusão bem-sucedida dos workflows de build. Ele se conecta à VPS via SSH, atualiza o repositório, baixa as novas imagens do GHCR e reinicia os serviços usando `docker-compose`.

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