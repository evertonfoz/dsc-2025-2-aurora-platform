# Comandos prontos (pré-preenchidos com seus dados reais)

Abaixo estão os comandos prontos que você pode executar localmente e na VPS já com os valores reais do seu ambiente (`evertonfoz/dsc-2025-2-aurora-platform`, VPS IP `64.181.173.121`, usuário `ubuntu`, diretório `dsc-2025-2-aurora-platform`). Substitua apenas `<GH_PAT>` pelo seu token quando indicado.

**Checklist rápido — Teste local do deploy (VPS)**

- Conectar via SSH ao servidor `ubuntu@64.181.173.121`.
- Garantir que o diretório `/home/ubuntu/dsc-2025-2-aurora-platform` contém o repositório e o arquivo `.env.prod`.
- Gerar/usar uma chave dedicada (`~/.ssh/aurora_deploy`) e registrar os `Secrets` no GitHub (`VPS_HOST`, `VPS_PRIVATE_KEY`, `GH_PAT`, `VPS_PROJECT_DIR`).
- Rodar o script helper na VPS para checagens e deploy:

```bash
cd /home/ubuntu/dsc-2025-2-aurora-platform
chmod +x scripts/run-deploy-test.sh
./scripts/run-deploy-test.sh --dir dsc-2025-2-aurora-platform --deploy
```

Esses passos reproduzem o fluxo do workflow `deploy-to-vps.yml` e são úteis para validar tudo localmente antes de acionar o CI.

> Nota: em produção/stage os serviços de aplicação não expõem portas diretamente; o acesso externo deve passar pelo gateway/ingress (reverse proxy). No compose de produção, os containers rodam apenas na rede interna `aurora_network`.

## 1) Criar os secrets no GitHub (execute localmente)

```bash
# Defina o repositório (OWNER/REPO)
REPO=evertonfoz/dsc-2025-2-aurora-platform

# VPS host (IP público)
echo -n "64.181.173.121" | gh secret set VPS_HOST -R "$REPO"

# VPS username
echo -n "ubuntu" | gh secret set VPS_USERNAME -R "$REPO"

# VPS SSH port
echo -n "22" | gh secret set VPS_PORT -R "$REPO"

# VPS project dir (apenas o nome do diretório em /home/ubuntu)
echo -n "dsc-2025-2-aurora-platform" | gh secret set VPS_PROJECT_DIR -R "$REPO"

# VPS private key: envia o conteúdo de uma chave dedicada (recomendado) ou da sua chave privada local
# RECOMENDADO: gere uma chave dedicada chamada ~/.ssh/aurora_deploy e use-a como secret.
# Veja a seção "Fluxo recomendado (não interativo)" abaixo para comandos completos.
gh secret set VPS_PRIVATE_KEY -R "$REPO" --body "$(cat ~/.ssh/aurora_deploy)"

# GitHub PAT (GHCR read:packages) - substitua <GH_PAT> pelo seu token quando executar
echo -n "<GH_PAT>" | gh secret set GH_PAT -R "$REPO"
```

## Nota: se estiver executando na VPS (Ubuntu)

Se você executar esses comandos diretamente na VPS (por exemplo via SSH) e vir o erro "Command 'gh' not found", instale o GitHub CLI (`gh`) no Ubuntu antes de tentar criar os secrets. Exemplo de instalação (repositório oficial, recomendado):

```bash
# Instalar GitHub CLI (repositório oficial)
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install -y gh

# Alternativa via snap:
# sudo snap install gh

# Verifique e autentique (se precisar):
gh --version
gh auth login
```

Após a instalação/autenticação, execute os mesmos comandos `echo -n ... | gh secret set ...` mostrados acima para criar os secrets.

Se preferir não instalar nada na VPS, crie os secrets pela interface do GitHub no navegador: `Repository` → `Settings` → `Secrets and variables` → `Actions` → `New repository secret`.

## 2) Conectar na VPS (execute no seu computador local)

```bash
# Conectar via SSH usando sua chave privada local
ssh -i ~/.ssh/id_rsa ubuntu@64.181.173.121

## Fluxo recomendado (não interativo) — gerar chave dedicada, copiar pubkey para VPS e criar secrets localmente

Execute as etapas abaixo no SEU COMPUTADOR LOCAL (zsh). Elas geram uma chave dedicada, copiam a public key para a VPS, e criam todos os secrets no GitHub sem prompts interativos.

```bash
# ajuste se já tiver definido REPO
REPO=evertonfoz/dsc-2025-2-aurora-platform
VPS_HOST=64.181.173.121
VPS_USER=ubuntu

# 1) gerar chave dedicada localmente (sem passphrase)
ssh-keygen -t ed25519 -f ~/.ssh/aurora_deploy -C "deploy@aurora" -N ""

# 2) copiar a public key para a VPS (adiciona em authorized_keys do usuário ubuntu)
ssh-copy-id -i ~/.ssh/aurora_deploy.pub ${VPS_USER}@${VPS_HOST}

# alternativa (se ssh-copy-id não disponível):
# cat ~/.ssh/aurora_deploy.pub | ssh ${VPS_USER}@${VPS_HOST} 'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys'

# 3) criar secrets no GitHub (executar localmente, evita prompts)
echo -n "${VPS_HOST}" | gh secret set VPS_HOST -R "$REPO"
echo -n "${VPS_USER}" | gh secret set VPS_USERNAME -R "$REPO"
echo -n "22" | gh secret set VPS_PORT -R "$REPO"
echo -n "dsc-2025-2-aurora-platform" | gh secret set VPS_PROJECT_DIR -R "$REPO"

# enviar a chave privada dedicada como secret (não envie sua chave pessoal)
gh secret set VPS_PRIVATE_KEY -R "$REPO" --body "$(cat ~/.ssh/aurora_deploy)"

# criar/atualizar GH_PAT (substitua <GH_PAT> pelo token que você gerou no GitHub UI)
echo -n "<GH_PAT>" | gh secret set GH_PAT -R "$REPO"

``` 

## O que colar se o `gh` pedir "Paste your secret:" (modo interativo)

- Se você usar o comando interativo `gh secret set VPS_PRIVATE_KEY -R "$REPO"` e o cliente pedir "Paste your secret:", cole o conteúdo inteiro do arquivo de chave privada que está no SEU COMPUTADOR LOCAL (não na VPS). Exemplo de início/fim do conteúdo:

```
-----BEGIN OPENSSH PRIVATE KEY-----
... (muitas linhas) ...
-----END OPENSSH PRIVATE KEY-----
```

- Não cole esse conteúdo em chats ou locais públicos. O modo recomendado é executar `gh secret set --body "$(cat path)"` no seu computador local para evitar prompts e erros de path.

```

## 3) Comandos para executar na VPS (como usuário `ubuntu`)

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Git, Docker e Docker Compose (v2)
sudo apt install -y git docker.io docker-compose

# Adicionar ubuntu ao grupo docker (reconecte após executar)
sudo usermod -aG docker ubuntu

# Criar/ajustar diretório do projeto (se necessário)
sudo mkdir -p /home/ubuntu/dsc-2025-2-aurora-platform
sudo chown ubuntu:ubuntu /home/ubuntu/dsc-2025-2-aurora-platform

# (Opcional, preferível) Clonar via SSH usando Deploy Key gerada na VPS
# git clone git@github.com:evertonfoz/dsc-2025-2-aurora-platform.git /home/ubuntu/dsc-2025-2-aurora-platform

# Alternativa com HTTPS usando PAT (substitua <GH_PAT> antes de executar)
GITHUB_PAT="<GH_PAT>"
git clone https://$GITHUB_PAT@github.com/evertonfoz/dsc-2025-2-aurora-platform.git /home/ubuntu/dsc-2025-2-aurora-platform
unset GITHUB_PAT

# Entrar no diretório do projeto
cd /home/ubuntu/dsc-2025-2-aurora-platform

# Garantir permissões no script helper e executá-lo para checagens
chmod +x scripts/run-deploy-test.sh
./scripts/run-deploy-test.sh --dir dsc-2025-2-aurora-platform

# Para executar e aplicar o deploy (pull + up -d):
./scripts/run-deploy-test.sh --dir dsc-2025-2-aurora-platform --deploy

# Login no GHCR (se precisar testar manualmente) - substitua <GH_PAT> pelo seu token
export GH_PAT="<GH_PAT>"
echo "$GH_PAT" | docker login ghcr.io -u evertonfoz --password-stdin
unset GH_PAT

# Exemplo de verificação dos containers
docker compose -f docker-compose.deploy.yml ps
docker compose -f docker-compose.deploy.yml logs -f
```

## 4) Comando para parar (na VPS)

```bash
cd /home/ubuntu/dsc-2025-2-aurora-platform
./scripts/run-deploy-test.sh --dir dsc-2025-2-aurora-platform --down
```

## Observações finais
- Substitua `<GH_PAT>` pelos seus tokens reais somente no terminal local ao executar os comandos; não os salve em arquivos não protegidos.
- A presença de `/home/ubuntu/dsc-2025-2-aurora-platform` na VPS indica que o valor de `VPS_PROJECT_DIR` será `dsc-2025-2-aurora-platform`.
