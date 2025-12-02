# Guia de Deploy e Operação da Plataforma Aurora: Uma Análise Didática

## Introdução: O Que é Este Processo e Por Que Ele é Importante?

Bem-vindo a este guia didático sobre o ciclo de vida de deploy da plataforma Aurora. O que investigamos e documentamos aqui é um exemplo prático de um fluxo de trabalho moderno de **DevOps**, aplicando conceitos de **CI/CD (Integração e Entrega Contínua)**, **Conteinerização com Docker** e **Infraestrutura como Código (IaC)**.

-   **Para que serve?** O objetivo deste processo é criar um pipeline robusto, repetível e automatizado para transformar o código-fonte escrito por desenvolvedores em serviços funcionais e executáveis que qualquer pessoa (como um desenvolvedor de frontend) pode usar sem precisar configurar um ambiente de desenvolvimento complexo.

-   **Por que usamos essas tecnologias?**
    -   **Docker:** "Empacota" cada microsserviço com todas as suas dependências em uma **imagem** de contêiner. Isso garante que o serviço funcione da mesma forma em qualquer máquina, seja no computador de um desenvolvedor ou em um servidor de produção, eliminando o clássico problema do "funciona na minha máquina".
    -   **GitHub Actions (CI/CD):** Automatiza o processo de testar o código, construir as imagens Docker e publicá-las em um registro central (`ghcr.io`). Isso garante que cada alteração no código principal (`main`) gere uma nova versão estável e documentada dos serviços.
    -   **Docker Compose (Infraestrutura como Código):** Define, em um único arquivo de código (`docker-compose.yml`), todos os serviços que compõem a aplicação (banco de dados, serviço de usuários, etc.) e como eles se conectam. Isso permite "subir" todo o ambiente complexo com um único comando.

Este guia, portanto, não é apenas um "como fazer", mas um "por que fazemos assim". Ele servirá como material de estudo para entender como aplicações de microsserviços são gerenciadas no mundo real.

---

## 1. Fluxo de CI/CD: Da Fonte à Imagem Publicada

O coração da automação deste projeto está nos workflows do GitHub Actions (`.github/workflows`). Eles são acionados automaticamente para construir e publicar as imagens de cada microsserviço.

Analisemos o exemplo do `build-auth-service.yml`. Este padrão se repete para os outros serviços, com arquivos `build-users-service.yml` e `build-events-service.yml` correspondentes no mesmo diretório. Recomenda-se que os alunos consultem estes outros arquivos no repositório como referência para criar os workflows de seus próprios projetos.

```yaml
# .github/workflows/build-auth-service.yml

name: build-auth-service

on:
  push:
    branches: [ main ]
    # Dispara o workflow apenas se houver mudanças na pasta do serviço
    paths:
      - 'packages/auth-service/**'
      - '.github/workflows/build-auth-service.yml'
  pull_request:
    paths:
      - 'packages/auth-service/**'
      - '.github/workflows/build-auth-service.yml'

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      # Permissão necessária para publicar a imagem no registro do GitHub
      packages: write
    steps:
      # ... (passos de checkout e login) ...
      - uses: docker/metadata-action@v5
        id: meta
        with:
          images: ghcr.io/${{ github.repository_owner }}/auth-service
          # Gera tags automaticamente: 'main', 'latest' e o hash do commit
          tags: |
            type=ref,event=branch
            type=sha
            type=raw,value=latest,enable={{is_default_branch}}
      - uses: docker/build-push-action@v6
        with:
          context: .
          file: ./packages/auth-service/Dockerfile
          # Constrói a imagem, mas só publica se o evento NÃO for um pull request
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
```

**Pontos-chave a observar:**
1.  **Gatilho (`on: push: paths`):** O workflow é otimizado para rodar apenas quando o código de um serviço específico é alterado, economizando recursos computacionais.
2.  **Permissões (`permissions: packages: write`):** A segurança é granular. O workflow só pode escrever no registro de pacotes (imagens Docker), nada mais.
3.  **Metadados e Tags (`docker/metadata-action`):** O versionamento é automatizado. Cada imagem é tagueada com o nome da branch (`main`), o hash do commit (ex: `sha-a1b2c3d4`) para rastreabilidade precisa, e a tag `latest` para conveniência.
4.  **Build e Push Condicional (`push: ${{...}}`):** Em Pull Requests, o `build` é executado como uma validação para garantir que a imagem pode ser construída, mas o `push` é pulado para não poluir o registro com imagens de branches de funcionalidade.

---

## 2. Orquestração com Docker Compose: Definindo o Ambiente

Uma vez que as imagens estão publicadas, como as executamos juntas? É aqui que entra o **Docker Compose**. Ele age como um maestro, lendo um arquivo `yml` para orquestrar múltiplos contêineres.

O projeto usa diferentes arquivos para diferentes cenários, uma prática comum para separar ambientes.

### Desenvolvimento vs. Produção

O contraste entre o desenvolvimento local e o uso de imagens prontas é visível na comparação dos arquivos.

-   **`docker-compose.yml` (Desenvolvimento):** Usa a diretiva `build` para construir a imagem localmente a partir do `Dockerfile`.

    ```yaml
    # docker-compose.yml (trecho)
    services:
      auth-service:
        # Constrói a imagem a partir do código-fonte local
        build:
          context: .
          dockerfile: ./packages/auth-service/Dockerfile
        # ... resto da configuração
    ```

-   **`docker-compose.deploy.yml` (Uso/Produção):** Usa a diretiva `image` para baixar a imagem pronta do `ghcr.io`.

    ```yaml
    # docker-compose.deploy.yml (trecho)
    services:
      auth-service:
        # Baixa a imagem de um registro, não constrói localmente
        image: ghcr.io/REPO_OWNER/auth-service:${AUTH_IMAGE_TAG:-latest}
        # ... resto da configuração
    ```

Esta separação é fundamental: desenvolvedores do backend podem construir e testar suas alterações localmente, enquanto os consumidores (frontend, etc.) podem simplesmente baixar e executar uma versão estável e testada.

---

## 3. Gerenciamento do Banco de Dados: Um Ciclo de Vida em Duas Fases

O banco de dados, sendo um serviço com estado, requer um tratamento especial. Seu ciclo de vida é dividido em **inicialização** e **migrações**.

### 3.1. Fase 1: Inicialização

Quando o contêiner do PostgreSQL é iniciado pela primeira vez, o Docker executa automaticamente quaisquer scripts `.sql` encontrados no diretório `/docker-entrypoint-initdb.d`. Neste projeto, o `docker-compose.yml` mapeia o diretório local `postgres-init` para esse local no contêiner.

O arquivo `postgres-init/01-create-db-and-schemas.sql` prepara o terreno:

```sql
-- postgres-init/01-create-db-and-schemas.sql

-- Cria a extensão 'citext' para uso em todo o banco de dados (ex: emails case-insensitive)
-- É criada no schema 'public' por padrão.
CREATE EXTENSION IF NOT EXISTS citext;

-- Cria schemas separados para cada microsserviço, garantindo isolamento lógico.
CREATE SCHEMA IF NOT EXISTS events;
CREATE SCHEMA IF NOT EXISTS users;
CREATE SCHEMA IF NOT EXISTS auth;
```

#### O Desafio do `search_path` e `citext`

Um ponto crítico foi identificado aqui. A extensão `citext` é criada no schema `public`. Para que os outros schemas (`users`, `auth`) possam usá-la, a conexão de cada serviço precisa ter `public` em seu caminho de busca (`search_path`).

-   **A Solução Correta (`users-service`):** O serviço de usuários configura corretamente sua conexão no `app.module.ts`.

    ```typescript
    // packages/users-service/src/app.module.ts (trecho)
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        // ... outras configs
        schema, // ex: 'users'
        // Adiciona 'public' ao search_path
        extra: { options: `-c search_path=${schema},public` },
      }),
    }),
    ```

-   **A Inconsistência (`auth-service`):** Outros serviços, no momento da análise, não faziam isso de forma consistente, especialmente nos seus arquivos `data-source.ts` usados para migrações. Isso causa erros como `type "citext" does not exist`. A **recomendação** é padronizar todos os serviços para seguirem o modelo do `users-service`.

### 3.2. Fase 2: Migrações Automáticas

Após a criação inicial, como o schema do banco de dados evolui? A resposta é: **migrações (migrations)**, gerenciadas pelo TypeORM.

Em vez de um passo manual, este projeto inteligentemente configura cada serviço para executar suas migrações pendentes na inicialização.

Isto é definido pela flag `migrationsRun: true` no `AppModule` de cada serviço:

```typescript
// packages/auth-service/src/app.module.ts (trecho)
@Module({
  imports: [
    TypeOrmModule.forRoot({
      // ... outras configs
      migrations: [__dirname + '/migrations/*.{ts,js}'],
      // Instrução para o TypeORM rodar as migrações na inicialização
      migrationsRun: true,
      // ...
    }),
    AuthModule,
  ],
})
export class AppModule {}
```

-   **Implicações:** Isso simplifica enormemente o deploy. Um desenvolvedor não precisa se lembrar de rodar um comando de migração. Ao iniciar o contêiner com a nova versão do código, a aplicação se encarrega de atualizar o banco de dados.
-   **Atenção:** A conveniência vem com uma responsabilidade. Uma migração mal escrita pode impedir que a aplicação inicie. Testes rigorosos de migrações em ambientes de desenvolvimento são essenciais.

---

## 4. Como Usar os Serviços: Do Clone ao `docker-compose up`

Agora, o guia prático. Como um desenvolvedor pode ter todo o backend da Aurora rodando em sua máquina?

### Cenário 1: O repositório foi clonado (Recomendado)

Este é o método mais fácil, pois utiliza o script `deploy-prod.sh` que automatiza o processo.

```bash
# Na raiz do projeto, execute:
./scripts/deploy-prod.sh
```

O script é uma sequência de comandos bem pensada:
```bash
# scripts/deploy-prod.sh (lógica simplificada)

# Se .env.prod não existe, copia-o de .env.prod.example
if [ ! -f .env.prod ]; then
  if [ -f .env.prod.example ]; then
    cp .env.prod.example .env.prod
    # ... e pergunta se o usuário quer editar
  fi
fi

# Baixa as imagens mais recentes do registro público
docker pull ghcr.io/${REPO_OWNER}/users-service:${USERS_TAG}
# ... (para todos os serviços)

# Sobe os contêineres em background usando o arquivo de deploy
docker compose -f docker-compose.deploy.yml up -d

# ... (aguarda e faz health checks)
```

### Cenário 2: O repositório NÃO foi clonado

Se você precisa apenas dos serviços rodando e não quer clonar o código, pode recriar a configuração manualmente.

1.  **Crie o `docker-compose.deploy.yml`:** Copie o conteúdo de [deste link](https://github.com/evertonfoz/dsc-2025-2-aurora-platform/blob/main/docker-compose.deploy.yml).
2.  **Crie o `.env.prod`:** Copie o template de [deste link](https://github.com/evertonfoz/dsc-2025-2-aurora-platform/blob/main/.env.prod.example) e **preencha os segredos (`CHANGEME_...`)**.
3.  **Inicie os serviços:** No terminal, no mesmo diretório dos arquivos, execute `docker compose -f docker-compose.deploy.yml up -d`.

---

## 5. Validando os Serviços

Com os serviços no ar, como saber se estão funcionando?

### Verificação Básica (Health Checks)

O script `deploy-prod.sh` já faz isso, mas você pode verificar manualmente:
```bash
curl http://localhost:3011/health # Deve retornar {"status":"ok",...}
```

### Validação Completa da API (Recomendado)

O diretório `https/` contém arquivos `.http`, que são coleções de requisições prontas para testar a API.

1.  **Obtenha os arquivos:** Se você clonou o repo, eles já estão lá. Senão, baixe-os:
    -   [auth.http](https://github.com/evertonfoz/dsc-2025-2-aurora-platform/blob/main/https/auth/auth.http)
    -   [users.http](https://github.com/evertonfoz/dsc-2025-2-aurora-platform/blob/main/https/users/users.http)
    -   [events.http](https://github.com/evertonfoz/dsc-2025-2-aurora-platform/blob/main/https/events/events.http)
2.  **Use uma extensão como a [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) no VS Code.**
3.  **Execute as requisições:** Abra os arquivos `.http` e use a opção "Send Request" para interagir com a API, testando login, criação de usuários, etc.

```http
# Exemplo de uma requisição em users.http

### Local helper: login (named `loginUsers`)
# @name loginUsers
POST http://localhost:3010/auth/login
Accept: application/json
Content-Type: application/json

{
  "email": "test.user@example.com",
  "password": "StrongP@ssw0rd"
}

### List users (token from previous request is used automatically)
# @token = {{loginUsers.response.body.$.accessToken}}
GET http://localhost:3011/users
Accept: application/json
Authorization: Bearer {{token}}
```

---

## Conclusão e Próximos Passos

A investigação da plataforma Aurora revelou um sistema de deploy bem estruturado e moderno, embora com alguns pontos de melhoria.

**Conquistas:**
-   **Automação de Build:** O CI/CD para construção e versionamento de imagens é robusto.
-   **Infraestrutura como Código:** O uso de Docker Compose torna o ambiente declarativo e fácil de replicar.
-   **Deploy Simplificado:** A combinação do script `deploy-prod.sh` com a execução automática de migrações cria uma excelente experiência para o desenvolvedor.

**Recomendações e Passos Futuros:**
1.  **Padronizar o `search_path`:** A inconsistência na configuração do `search_path` entre os serviços deve ser corrigida para evitar erros de `citext` e garantir um comportamento uniforme.
2.  **Gerenciamento de Segredos:** Atualmente, os segredos são gerenciados em um arquivo `.env.prod`. Para ambientes de produção reais, o ideal seria usar um "vault" (como HashiCorp Vault, AWS Secrets Manager, etc.) para injetar segredos nos contêineres de forma mais segura.
3.  **Testes Automatizados no Pipeline:** O pipeline de CI/CD poderia ser aprimorado para rodar testes de unidade e integração *antes* de publicar a imagem. Uma imagem só seria publicada se todos os testes passassem.
4.  **Assinatura de Imagens:** O script `deploy-prod.sh` já prevê o uso de `cosign` para verificar assinaturas de imagens. Implementar a assinatura de imagens no pipeline de CI/CD adicionaria uma camada crucial de segurança, garantindo que apenas imagens confiáveis sejam implantadas.

Este projeto serve como um excelente estudo de caso para práticas de DevOps, demonstrando como as ferramentas modernas se unem para criar um fluxo de desenvolvimento e entrega mais eficiente e confiável.
