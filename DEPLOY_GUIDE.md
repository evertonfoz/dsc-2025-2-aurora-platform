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
git clone https://github.com/seu-usuario/seu-repositorio.git /home/ubuntu/dsc-2025-2-aurora-platform
```
**Importante:** Após executar `sudo usermod -aG docker ${USER}`, você precisa **sair da sessão SSH e reconectar** para que a permissão tenha efeito.