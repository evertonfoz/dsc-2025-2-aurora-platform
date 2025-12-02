# Guia de Acesso Remoto a uma VM com VS Code e SSH

## 1. Visão Geral: O que é e por que usar?

Trabalhar com uma Máquina Virtual (VM) remotamente, como uma VPS na Oracle Cloud, geralmente envolve conectar-se a um terminal via SSH. No entanto, para tarefas de desenvolvimento, como editar código, gerenciar contêineres Docker e executar scripts, o terminal puro pode ser limitante.

A funcionalidade **Remote SSH do Visual Studio Code** transforma essa experiência. Ela permite que você use o seu VS Code local para se conectar, abrir e editar arquivos diretamente em uma VM remota. Na prática, é como se a pasta do projeto na VM estivesse aberta na sua própria máquina, mas todo o processamento, execução de comandos e serviços (como o Docker) acontecem na VM.

**Principais Vantagens:**

*   **Edição Direta:** Você edita o código na VM com todos os recursos do seu VS Code (IntelliSense, debuggers, etc.), sem precisar copiar arquivos para frente e para trás.
*   **Terminal Integrado:** O terminal do VS Code se torna um terminal direto na VM, permitindo executar comandos (`docker ps`, `git pull`, etc.) no ambiente de produção.
*   **Ambiente Unificado:** Você usa a mesma ferramenta que já conhece para desenvolver tanto localmente quanto no servidor, agilizando o fluxo de trabalho.
*   **Segurança:** A conexão é feita sobre o protocolo seguro SSH, geralmente usando chaves criptográficas, que são muito mais seguras do que senhas.

Este guia mostra como configurar esse ambiente do zero.

---

## 2. Pré-requisitos

### 2.1. No seu Computador (Desenvolvedor)

1.  **Visual Studio Code:** É necessário ter o VS Code instalado, preferencialmente a versão `1.80` ou superior.
2.  **Extensões Essenciais:** Instale as seguintes extensões a partir do painel de Extensões do VS Code:
    *   **Remote - SSH**
        *   ID: `ms-vscode-remote.remote-ssh`
        *   **Finalidade:** É a extensão principal que habilita a conexão, o gerenciamento de hosts e a comunicação com o servidor remoto.
    *   **(Opcional) Remote - SSH: Editing Configuration Files**
        *   ID: `ms-vscode-remote.remote-ssh-edit`
        *   **Finalidade:** Oferece autocompletar e validação ao editar o arquivo de configuração do SSH (`~/.ssh/config`), facilitando a configuração.

![Instalando a extensão Remote SSH no VS Code](https://i.imgur.com/example.png)  <!-- Placeholder for an image showing the extension -->

### 2.2. Na sua VM (Servidor Oracle Cloud)

1.  **Acesso SSH:** Você precisa ter o endereço IP da sua VM e um usuário com permissão de acesso via SSH (ex: `ubuntu@123.45.67.89`). A porta padrão é a `22`.
2.  **Ferramentas Instaladas:**
    *   **Git:** Para clonar o repositório. Verifique com `git --version`.
    *   **Docker:** Para executar os contêineres da aplicação. Verifique com `docker --version`.
3.  **Permissão para Docker:** O usuário que você usa para conectar via SSH deve ter permissão para gerenciar o Docker. Isso geralmente é feito adicionando o usuário ao grupo `docker`.
    *   **Comando para adicionar (execute na VM):** `sudo usermod -aG docker $USER`
    *   **Importante:** Após executar este comando, você precisa **sair da sessão SSH e conectar novamente** para que a permissão seja aplicada.
    *   **Verificação:** Após reconectar, rode `docker ps`. Se o comando executar sem `sudo` e sem erro de "permission denied", a configuração está correta.

---

## 3. Configurando a Chave SSH (Segurança Primeiro)

Usar chaves SSH é a forma mais segura e recomendada de se conectar. O processo consiste em criar um par de chaves (uma pública e uma privada) na sua máquina. A chave privada fica com você, e a pública é colocada na VM.

### 3.1. Passo a Passo

1.  **Verifique se você já possui uma chave:**
    *   Abra um terminal na sua máquina local e digite: `ls -l ~/.ssh/id_*.pub`
    *   Se você vir arquivos como `id_rsa.pub` ou `id_ed25519.pub`, você já tem uma chave e pode pular para o passo 3.

2.  **Gere uma nova chave (se necessário):**
    *   Recomenda-se o algoritmo `ed25519`. Execute o comando abaixo, substituindo pelo seu e-mail.
    ```bash
    ssh-keygen -t ed25519 -C "seu_email@example.com"
    ```
    *   Pressione `Enter` para aceitar o local padrão (`~/.ssh/id_ed25519`).
    *   É altamente recomendado definir uma "passphrase" (senha) para sua chave. Isso adiciona uma camada extra de segurança.

3.  **Copie sua chave pública:**
    *   O conteúdo da sua chave pública precisa ser copiado para a VM. Exiba o conteúdo com o comando:
    ```bash
    cat ~/.ssh/id_ed25519.pub
    ```
    *   Selecione e copie todo o resultado (começa com `ssh-ed25519...` e termina com seu e-mail).

4.  **Adicione a chave pública à VM:**
    *   Conecte-se à sua VM usando o método que você já possui (seja via terminal web da Oracle Cloud ou SSH com senha).
    *   Execute o seguinte comando para abrir (ou criar) o arquivo `authorized_keys`:
    ```bash
    nano ~/.ssh/authorized_keys
    ```
    *   Cole a chave pública que você copiou no passo anterior em uma nova linha.
    *   Salve o arquivo e saia (`Ctrl+X`, depois `Y` e `Enter`).
    *   Ajuste as permissões para segurança:
    ```bash
    chmod 700 ~/.ssh
    chmod 600 ~/.ssh/authorized_keys
    ```
    *   Agora, você deve conseguir se conectar via SSH da sua máquina local sem precisar de senha (apenas a passphrase da chave, se você a definiu).

---

## 4. Configurando o Arquivo `~/.ssh/config`

Para facilitar a conexão, você pode criar um "atalho" no arquivo de configuração do SSH. Isso evita que você tenha que digitar o usuário, IP e caminho da chave toda vez.

1.  **Abra o arquivo de configuração no seu computador local:**
    ```bash
    nano ~/.ssh/config
    ```

2.  **Adicione uma entrada para sua VM.** Use um nome amigável no campo `Host`.

    ```ini
    # Bloco de configuração para a VM do projeto Aurora
    Host aurora-prod-oracle
      HostName 123.45.67.89 # <-- Substitua pelo IP da sua VM
      User ubuntu           # <-- Substitua pelo usuário da sua VM (comum ser 'ubuntu' na Oracle)
      IdentityFile ~/.ssh/id_ed25519 # <-- Caminho para a sua chave privada
      Port 22
      ForwardAgent yes
    ```
    *   `Host`: Um nome amigável que você usará para se referir a esta conexão.
    *   `HostName`: O endereço IP público da VM.
    *   `User`: O nome de usuário para login na VM.
    *   `IdentityFile`: O caminho para o arquivo da sua **chave privada**.
    *   `ForwardAgent`: Útil para cenários onde, de dentro da VM, você precisa se conectar a outro serviço (como o GitHub) usando a mesma chave SSH da sua máquina local.

---

## 5. Conectando à VM pelo VS Code

Com a configuração pronta, conectar é muito simples.

1.  No VS Code, clique no ícone verde no canto inferior esquerdo, ou abra a paleta de comandos (`Ctrl+Shift+P`) e digite `Remote-SSH: Connect to Host...`.
2.  Você verá uma lista dos hosts configurados no seu arquivo `~/.ssh/config`. Selecione o host que você criou (ex: `aurora-prod-oracle`).
3.  Uma nova janela do VS Code será aberta. Na primeira conexão, ele irá configurar o "VS Code Server" na VM automaticamente. Isso pode levar um minuto.
4.  Se você definiu uma passphrase para sua chave SSH, o VS Code irá pedi-la.
5.  Quando a conexão for bem-sucedida, o indicador verde no canto inferior esquerdo mostrará `SSH: aurora-prod-oracle`.

Parabéns, você está conectado! O VS Code agora está operando diretamente na sua VM.

---

## 6. Abrindo o Projeto na VM

Uma vez conectado, você pode abrir a pasta do projeto.

*   **Se o projeto ainda não existe na VM:**
    1.  Use o menu `Terminal > New Terminal` no VS Code. Isso abrirá um terminal **na VM**.
    2.  Clone o repositório:
        ```bash
        git clone https://github.com/dsc-utfpr-gp/dsc-2025-2-aurora-platform.git
        ```
    3.  Depois de clonar, clique em `File > Open Folder...` e selecione a pasta do repositório que você acabou de clonar (ex: `/home/ubuntu/dsc-2025-2-aurora-platform`).

*   **Se o projeto já existe:**
    *   Clique em `File > Open Folder...` e navegue até a pasta do projeto na VM.

O VS Code irá recarregar a janela com a pasta do projeto aberta. Agora você pode navegar pelos arquivos, editá-los e usar o terminal como se estivesse na sua máquina local.

---

## 7. Integração com Docker e Scripts

Com o projeto aberto no VS Code via Remote SSH, todas as operações acontecem na VM:

*   **Gerenciar Contêineres:** Abra um terminal (`Ctrl+'`) e execute os comandos do Docker Compose:
    ```bash
    # Navegue até a pasta do projeto, caso não esteja lá
    cd dsc-2025-2-aurora-platform

    # Suba os serviços em modo de produção
    docker compose -f docker-compose.prod.yml up -d
    ```
*   **Executar Scripts:** Execute qualquer script do projeto, como o de deploy:
    ```bash
    ./scripts/deploy-prod.sh
    ```
*   **Validar Serviços:** Verifique os logs dos contêineres diretamente no terminal do VS Code:
    ```bash
    docker compose -f docker-compose.prod.yml logs -f auth-service
    ```

Tudo isso é executado **na VM**, consumindo os recursos dela, não os da sua máquina.

---

## 8. Boas Práticas e Segurança

*   **Nunca comite segredos:** Arquivos como `.env` ou `.env.prod` contêm informações sensíveis e **nunca** devem ser enviados para o repositório Git. Use sempre um arquivo de exemplo (`.env.example`) e adicione o arquivo de produção ao `.gitignore`.
*   **Prefira chaves SSH:** Sempre use chaves SSH em vez de senhas. Elas são criptograficamente mais seguras.
*   **Restrinja o acesso:** Configure o firewall da sua VM (na Oracle Cloud, são os "Security Lists") para permitir acesso à porta `22` (SSH) apenas de IPs conhecidos, se possível.

---

## 9. Resolução de Problemas Comuns (FAQ)

*   **Erro: `Permission denied (publickey)`**
    *   **Sintoma:** Você tenta conectar e a conexão é recusada imediatamente.
    *   **Causa Provável:** Sua chave pública não está (ou está incorretamente) no arquivo `~/.ssh/authorized_keys` da VM, ou as permissões dos arquivos/pastas `.ssh` estão erradas.
    *   **Diagnóstico:** Refaça o passo 3.4 cuidadosamente.

*   **Erro: `Got permission denied while trying to connect to the Docker daemon socket`**
    *   **Sintoma:** O comando `docker ps` falha sem `sudo`.
    *   **Causa Provável:** Seu usuário na VM não pertence ao grupo `docker`.
    *   **Diagnóstico:** Execute `sudo usermod -aG docker $USER` na VM, **saia da sessão SSH e conecte-se novamente**.

*   **Erro: `Connection timed out`**
    *   **Sintoma:** A tentativa de conexão fica aguardando e falha após um tempo.
    *   **Causa Provável:**
        1.  O endereço IP da VM está incorreto no seu `~/.ssh/config`.
        2.  A VM está desligada.
        3.  O firewall (Security List na Oracle Cloud) está bloqueando a porta `22`.
    *   **Diagnóstico:** Verifique o IP, o status da VM no painel da Oracle e as regras de firewall.