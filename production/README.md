# Guia de Deploy em Produção na Oracle Cloud (ou outra VM)

Este guia detalha o processo para implantar a plataforma Aurora em um ambiente de produção, utilizando uma máquina virtual (VM) limpa, como a oferecida no Free Tier da Oracle Cloud.

O objetivo é configurar um ambiente robusto, seguro e automatizado, com:
- **Proxy Reverso com Nginx**: Para centralizar o acesso aos microsserviços.
- **SSL/TLS com Let's Encrypt**: Para garantir comunicação segura (HTTPS).
- **Conteinerização com Docker**: Para isolar e gerenciar os serviços.
- **Orquestração com Docker Compose**: Para definir e executar a aplicação multi-serviço.

## Arquitetura de Produção

A arquitetura proposta consiste em:
1.  **Nginx**: Atua como a porta de entrada (edge service). Ele recebe todo o tráfego HTTP e HTTPS, encaminhando as requisições para os microsserviços apropriados.
2.  **Certbot**: Um cliente Let's Encrypt que automatiza a obtenção e renovação de certificados SSL, garantindo que nosso domínio tenha sempre HTTPS ativado.
3.  **Microsserviços**: `users-service`, `auth-service`, e `events-service` rodam em contêineres Docker, sem expor portas diretamente à internet. A comunicação é feita através da rede interna do Docker, gerenciada pelo Nginx.
4.  **Banco de Dados**: Um contêiner PostgreSQL, também acessível apenas pela rede interna do Docker.

## Pré-requisitos

Antes de começar, você precisará de:

1.  **Uma VM Linux**: Uma instância na Oracle Cloud, AWS, Google Cloud, DigitalOcean, etc. Este guia assume um sistema baseado em Debian/Ubuntu.
2.  **Um nome de domínio**: Um domínio registrado (ex: `meudominio.com`) apontando para o endereço IP público da sua VM. Isso é **obrigatório** para a geração do certificado SSL.
    - Crie um registro DNS do tipo `A` no seu provedor de domínio, associando seu domínio (`aurora.meudominio.com`, por exemplo) ao IP da VM.
3.  **Ferramentas na VM**:
    - `git`
    - `docker`
    - `docker-compose`

Se estas ferramentas não estiverem instaladas, você pode usar os seguintes comandos em um sistema Ubuntu/Debian:
```bash
# Atualizar o sistema
sudo apt update && sudo apt upgrade -y

# Instalar Git e Docker
sudo apt install -y git docker.io

# Adicionar seu usuário ao grupo do Docker para não precisar de 'sudo'
sudo usermod -aG docker $USER
# IMPORTANTE: Você precisará sair e entrar novamente na sessão SSH para que isso tenha efeito.

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```
---

*Esta é a primeira parte do guia. Continuarei com os próximos passos na sequência.*

## Passo a Passo para o Deploy

Siga estas etapas **dentro da sua VM** para colocar a aplicação no ar.

### Passo 1: Clonar o Repositório

Clone o projeto do GitHub para a sua VM:
```bash
git clone https://github.com/evertonfoz/dsc-2025-2-aurora-platform.git
cd dsc-2025-2-aurora-platform
```

### Passo 2: Configurar o Ambiente

A aplicação precisa de um arquivo de ambiente para carregar senhas e outras configurações.

1.  **Copie o template de exemplo**:
    ```bash
    cp .env.prod.example .env.prod
    ```

2.  **Edite o arquivo `.env.prod`**:
    Abra o arquivo com um editor de texto (como `nano` ou `vim`) e preencha **todas** as variáveis marcadas com `CHANGEME`.
    ```bash
    nano .env.prod
    ```
    - `POSTGRES_PASSWORD`: Uma senha forte para o banco de dados.
    - `JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET`: Segredos longos e aleatórios para os tokens de autenticação. Você pode gerar um com o comando `openssl rand -hex 32`.

### Passo 3: Obter o Certificado SSL (Primeira Execução)

Este é o passo mais crítico. Usaremos o script `init-letsencrypt.sh` para obter o certificado SSL do seu domínio.

**Importante**: Antes de executar, certifique-se de que o seu domínio já está apontando para o IP da VM. Pode levar algum tempo para a propagação do DNS.

Execute o script passando seu domínio e email como variáveis de ambiente:
```bash
# Lembre-se de tornar o script executável primeiro
chmod +x ./production/init-letsencrypt.sh

# Execute o script com suas informações
DOMAIN="seu.dominio.com" EMAIL="seu-email@exemplo.com" ./production/init-letsencrypt.sh
```
O script irá:
1.  Baixar as configurações recomendadas para o SSL.
2.  Gerar parâmetros de segurança (DHParam).
3.  Subir um Nginx temporário.
4.  Executar o Certbot para solicitar o certificado.
5.  Desligar o Nginx temporário.

Se tudo correr bem, você verá uma mensagem de sucesso.

### Passo 4: Iniciar a Aplicação Completa

Com o certificado SSL no lugar, você pode iniciar todos os serviços de produção.

Use o `docker-compose` apontando para o arquivo de produção:
```bash
docker-compose -f ./production/docker-compose.prod.yml up -d
```
O comando `-d` executa os contêineres em modo "detached" (em segundo plano).

### Passo 5: Verificar a Execução

Para verificar se os contêineres estão rodando:
```bash
docker-compose -f ./production/docker-compose.prod.yml ps
```
Você deve ver o status `Up` ou `running` para todos os serviços (`aurora-db-prod`, `aurora-users-prod`, `aurora-nginx-prod`, etc.).

Para ver os logs de um serviço específico (por exemplo, `users-service`):
```bash
docker-compose -f ./production/docker-compose.prod.yml logs -f users-service
```

Se tudo estiver correto, você poderá acessar sua aplicação em `https://seu.dominio.com`.
---

*Esta é a segunda parte do guia. Continuarei com a seção de manutenção e renovação de certificados.*

## Manutenção e Operação

### Atualizando a Aplicação

Para atualizar a aplicação com o código mais recente do repositório:
1.  **Puxe as últimas alterações**:
    ```bash
    git pull origin main
    ```
2.  **Baixe as novas imagens Docker**:
    Opcional, mas recomendado para garantir que você tem as últimas versões.
    ```bash
    docker-compose -f ./production/docker-compose.prod.yml pull
    ```
3.  **Reinicie os serviços**:
    O Docker Compose irá recriar apenas os contêineres cujas imagens foram atualizadas.
    ```bash
    docker-compose -f ./production/docker-compose.prod.yml up -d
    ```

### Renovação do Certificado SSL

O serviço `certbot` no `docker-compose.prod.yml` está configurado para tentar renovar os certificados automaticamente. O Let's Encrypt emite certificados válidos por 90 dias, e a recomendação é tentar a renovação a cada 60 dias.

Você pode simular o processo de renovação com o comando:
```bash
docker-compose -f ./production/docker-compose.prod.yml run --rm certbot renew --dry-run
```
Se o "dry run" for bem-sucedido, a renovação automática deverá funcionar sem problemas.

### Comandos Úteis

-   **Ver status dos contêineres**: `docker-compose -f ./production/docker-compose.prod.yml ps`
-   **Ver logs de todos os serviços**: `docker-compose -f ./production/docker-compose.prod.yml logs -f`
-   **Ver logs de um serviço específico**: `docker-compose -f ./production/docker-compose.prod.yml logs -f nginx`
-   **Parar todos os serviços**: `docker-compose -f ./production/docker-compose.prod.yml down`
-   **Parar e remover volumes (CUIDADO: apaga o banco de dados!)**: `docker-compose -f ./production/docker-compose.prod.yml down -v`

## Resolução de Problemas (Troubleshooting)

-   **Erro `permission denied` ao usar o Docker**:
    -   **Causa**: Seu usuário não pertence ao grupo `docker`.
    -   **Solução**: Execute `sudo usermod -aG docker $USER` e **saia e entre novamente na sessão SSH**.

-   **Certbot falha com erro "Timeout" ou "Connection refused"**:
    -   **Causa**: O Let's Encrypt não conseguiu acessar sua VM na porta 80.
    -   **Solução**: Verifique se:
        1.  O DNS do seu domínio está apontando corretamente para o IP da VM.
        2.  O firewall da sua VM (e do provedor de nuvem, como o da Oracle Cloud) tem a porta 80 (HTTP) e 443 (HTTPS) liberadas para o tráfego de entrada.

-   **Nginx retorna erro 502 Bad Gateway**:
    -   **Causa**: O Nginx não consegue se comunicar com um dos microsserviços.
    -   **Solução**: Verifique os logs do serviço para o qual o Nginx está tentando fazer proxy. Por exemplo, se o erro ocorre ao acessar `/users`, verifique os logs do `users-service`:
        ```bash
        docker-compose -f ./production/docker-compose.prod.yml logs users-service
        ```
        O erro geralmente está na inicialização do serviço, como uma variável de ambiente faltando no `.env.prod`.

