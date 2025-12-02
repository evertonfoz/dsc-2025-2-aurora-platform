# Guia de Deploy em Produção na Oracle Cloud VM

Este guia detalha o processo de implantação da plataforma Aurora em um ambiente de produção, como uma Virtual Private Server (VPS) na Oracle Cloud, de forma que ela coexista com outras aplicações já em execução (como o ClassHero).

A estratégia adotada é o **isolamento completo**. Criaremos um ambiente Docker Compose totalmente independente para a Aurora, com seu próprio Nginx e gerenciamento de SSL, sem interferir nos serviços existentes.

## Visão Geral da Arquitetura

-   **Docker Compose Independente:** Usaremos um arquivo `production/docker-compose.prod.yml` que define todos os serviços da Aurora.
-   **Nginx Dedicado:** A Aurora terá seu próprio container Nginx, configurado para escutar em portas não padrão (ex: `81` para HTTP e `444` para HTTPS), evitando conflitos com o Nginx principal da VM que usa as portas `80` e `443`.
-   **Certbot Integrado:** O serviço do Certbot está incluído no mesmo Docker Compose para gerar e renovar certificados SSL para o subdomínio da Aurora.
-   **Rede Isolada:** Todos os serviços da Aurora se comunicarão em uma rede Docker privada (`aurora-network`), invisível para outras aplicações na VM.

---

## Pré-requisitos

Antes de começar, garanta que sua VM na Oracle Cloud atenda aos seguintes requisitos:

1.  **Acesso SSH:** Você deve ter acesso à VM via SSH.
2.  **Docker e Docker Compose:** Instalados e funcionando.
    ```bash
    # Verifique as versões
    docker --version
    docker compose version
    ```
3.  **Git:** Instalado para clonar o repositório.
    ```bash
    git --version
    ```
4.  **Firewall Configurado:** As portas que o Nginx da Aurora usará devem estar liberadas no firewall da sua VCN (Virtual Cloud Network) na Oracle Cloud. Para este guia, libere as portas:
    -   `81/tcp` (para o desafio inicial do Let's Encrypt)
    -   `444/tcp` (para o acesso HTTPS final)

---

## Passo a Passo do Deploy

Siga estes passos dentro da sua VM, via SSH.

### Passo 1: Preparar o Diretório e Clonar o Repositório

Primeiro, criamos um diretório para a aplicação e clonamos o código-fonte.

```bash
# Crie um diretório para a plataforma (ex: 'aurora-platform')
mkdir ~/aurora-platform
cd ~/aurora-platform

# Clone o repositório do projeto
git clone https://github.com/evertonfoz/dsc-2025-2-aurora-platform.git .
```

### Passo 2: Configurar as Variáveis de Ambiente

A configuração da produção depende de um arquivo `.env.prod`. Crie-o a partir do exemplo fornecido e preencha as variáveis.

```bash
# Navegue até o diretório 'production'
cd production

# Crie o arquivo .env.prod a partir do exemplo
# (Assumindo que .env.prod.example será criado no projeto)
# Por enquanto, crie-o manualmente:
nano .env.prod
```

Preencha o arquivo `.env.prod` com o seguinte conteúdo, **substituindo os valores de exemplo**:

```dotenv
# --- Domínio e SSL ---
# O seu subdomínio para a aplicação Aurora. Ex: aurora.seudominio.com
DOMAIN_NAME=seu-dominio-aqui.com
# Seu e-mail para notificações do Let's Encrypt
EMAIL=seu-email@exemplo.com

# --- Banco de Dados PostgreSQL ---
DB_DATABASE=aurora
DB_USERNAME=postgres
# Use uma senha forte e segura
DB_PASSWORD=CHANGEME_DB_PASSWORD

# --- Segredos da Aplicação (JWT) ---
# Use senhas fortes e seguras. Você pode gerar com: openssl rand -hex 32
JWT_SECRET=CHANGEME_JWT_SECRET
JWT_REFRESH_SECRET=CHANGEME_JWT_REFRESH_SECRET

# --- Tags das Imagens Docker ---
# Deixe em branco ou use 'latest' para usar a imagem mais recente
AUTH_IMAGE_TAG=latest
USERS_IMAGE_TAG=latest
EVENTS_IMAGE_TAG=latest
```

### Passo 3: Obter o Certificado SSL (Execução Única)

Com as variáveis de ambiente configuradas, execute o script de inicialização para obter o primeiro certificado SSL.

**Importante:** Este script subirá temporariamente o Nginx na porta `81` para completar o desafio do Let's Encrypt.

```bash
# Dê permissão de execução ao script
chmod +x init-letsencrypt.sh

# Execute o script com as variáveis de ambiente
./init-letsencrypt.sh
```

**Se tudo correr bem**, você verá uma mensagem de sucesso. O script usa a flag `--staging` por padrão para testes. Para gerar um certificado de produção real, edite `init-letsencrypt.sh` e remova a flag `--staging` antes de executar.

### Passo 4: Iniciar a Aplicação Completa

Após a obtenção do certificado, você pode iniciar todos os serviços da plataforma Aurora.

```bash
# Suba todos os containers em background
docker compose -f docker-compose.prod.yml up -d
```

### Passo 5: Validar a Implantação

1.  **Verifique os Containers:**
    ```bash
    docker compose -f docker-compose.prod.yml ps
    ```
    Você deve ver todos os serviços (`auth-service`, `users-service`, `postgres`, `nginx`, etc.) com o status `Up` ou `running`.

2.  **Verifique os Logs:**
    ```bash
    # Ver logs de um serviço específico (ex: auth-service)
    docker compose -f docker-compose.prod.yml logs -f auth-service

    # Ver logs de todos os serviços
    docker compose -f docker-compose.prod.yml logs -f
    ```

3.  **Teste a API:**
    Acesse seus endpoints através do domínio configurado, lembrando de usar a porta HTTPS `444`.
    -   `https://<seu-dominio>:444/auth/health`
    -   `https://<seu-dominio>:444/users/health`
    -   `https://<seu-dominio>:444/events/health`

    Você pode usar o `curl` ou um cliente de API para testar:
    ```bash
    curl https://<seu-dominio>:444/auth/health
    ```

---

## Gerenciamento da Aplicação

-   **Para Parar a Aplicação:**
    ```bash
    docker compose -f docker-compose.prod.yml down
    ```

-   **Para Atualizar as Imagens:**
    Antes de subir os contêineres, você pode puxar as imagens mais recentes:
    ```bash
    docker compose -f docker-compose.prod.yml pull
    docker compose -f docker-compose.prod.yml up -d
    ```

-   **Renovação de Certificado:**
    O serviço `certbot` no `docker-compose.prod.yml` é configurado para tentar renovar os certificados automaticamente a cada 12 horas. Nenhuma ação manual é necessária.