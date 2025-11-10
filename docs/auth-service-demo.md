# Guia: auth-service (scaffold Express mínimo)## Demo e artefatos: auth-service (scaffold)



## 📋 ResumoResumo rápido

- **Local**: `packages/auth-service`- Local: `packages/auth-service`

- **Objetivo**: Scaffold didático do serviço `auth` demonstrando:- Objetivo: scaffold didático do serviço `auth` com OpenAPI, testes de contrato e testes de integração, e um provider mínimo (Express) que retorna valores mocados para demonstração em sala.

  - Contract-first approach (OpenAPI → testes → implementação)- Branch alvo para a extração: `new-release` (PR-style extraction foi aplicada nessa branch — o monólito ficou inalterado).

  - Provider mínimo Express com respostas mocadas

  - Testes de contrato e integraçãoO que foi criado

- **Branch**: `new-release`- `packages/auth-service/openapi.yaml` — especificação OpenAPI do contrato (atualizada para `openapi: 3.1.0`).

- **Status**: ✅ Provider Express funcional (porta 3002)- `packages/auth-service/src/` — provider Express mínimo (endpoints `/auth/login`, `/auth/refresh`, etc.) com respostas mocadas úteis para demonstração.

- `packages/auth-service/test/contract/openapi.spec.ts` — testes de contrato que validam o OpenAPI.

## 📁 Estrutura criada- `packages/auth-service/test/integration/auth.integration.spec.ts` — testes de integração (supertest) contra o app exportado.

```- Copia PR-style dos artefatos do monólito em `packages/auth-service/src/auth/` (arquivos NestJS: controllers, services, DTOs, entity `refresh-token.entity.ts`, `users-http.client.ts`) — presente como referência/PR candidate.

packages/auth-service/

├── package.json          # Scripts: demo, contract:test, integration:testPorta e conflitos locais

├── tsconfig.json         # Configuração TypeScript- O provider padrão foi ajustado para evitar conflitos locais: porta padrão é `3002`.

├── Dockerfile            # Imagem Docker (porta 3002)

├── openapi.yaml          # Contrato OpenAPI 3.1.0Comandos principais (no repositório)

├── README.md             # Guia para alunos1) Entrar no pacote e instalar dependências

├── src/```bash

│   ├── app.ts            # Factory Express (exporta app)cd packages/auth-service

│   ├── main.ts           # Bootstrap (inicia servidor na porta 3002)npm install

│   └── controllers/```

│       └── auth.controller.ts  # Rotas Express mocadas

└── test/2) Rodar testes de contrato

    ├── contract/```bash

    │   └── openapi.spec.ts     # Valida OpenAPInpm run contract:test

    └── integration/```

        └── auth.integration.spec.ts  # Testes HTTP (supertest)

```3) Rodar testes de integração

```bash

## 🚀 Comandos para alunos (passo a passo)npm run integration:test

```

### 1. Instalar dependências

```bash4) Iniciar servidor para demo (dev)

cd packages/auth-serviceObservação: o scaffold usa um dev runner (ex: `ts-node-dev` ou `node` pré-build dependendo do script). Se houver script `dev`:

npm install```bash

```npm run dev

# ou, se existir, build + start

### 2. Rodar testes de contrato (valida OpenAPI)npm run build && npm start

```bash```

npm run contract:testApós iniciar, o servidor deve logar algo como: `auth-service listening on port 3002`.

```

**Resultado esperado**:Exemplos de requisições (curl)

```- POST /auth/refresh (exemplo correto — single-line com curl):

✓ deve conter o path /auth/login com POST```bash

✓ deve conter o path /auth/refresh com POSTcurl -s -X POST "http://localhost:3002/auth/refresh" \

```  -H "Content-Type: application/json" \

  -d '{"refreshToken":"some-refresh-token"}' | jq .

### 3. Rodar testes de integração (testa endpoints)```

```bash

npm run integration:test- Multiline (cada linha termina com \):

``````bash

**Resultado esperado**:curl -s -X POST "http://localhost:3002/auth/refresh" \

```  -H "Content-Type: application/json" \

✓ POST /auth/login should return tokens  -d '{"refreshToken":"some-refresh-token"}' \

✓ POST /auth/refresh should return new access token  | jq .

✓ POST /auth/refresh without token should return 400```

```

Nota: se você esquece de colocar `curl` no início (ex.: começar com `http://...`), o shell tentará executar essa URL como um comando e retornará `zsh: no such file or directory`.

### 4. Iniciar servidor demo

```bashComportamento atual

npm run demo- Endpoints retornam valores mocados (úteis para demos e para validar contratos antes da extração completa).

```- Testes executados durante a sessão:

**Saída esperada**:  - `npm run contract:test` → PASS

```  - `npm run integration:test` → PASS

auth-service listening on port 3002

```Onde inspecionar o código relevante

- Provider Express minimal: `packages/auth-service/src/app.ts`, `packages/auth-service/src/controllers/*`.

### 5. Testar endpoints (curl)- OpenAPI: `packages/auth-service/openapi.yaml`.

- Testes: `packages/auth-service/test/**`.

**Login**:- Cópia do monólito (PR-style): `packages/auth-service/src/auth/`.

```bash

curl -s -X POST "http://localhost:3002/auth/login" \Problemas encontrados e resoluções rápidas

  -H "Content-Type: application/json" \- Problema: porta 3000 já em uso localmente → solução: alterar porta padrão para 3002 e atualizar `Dockerfile`/docs.

  -d '{"email":"aluno@example.com","password":"senha123"}' | jq .- Problema: OpenAPI linter/validator exigia `3.1.0` → atualização do `openapi.yaml` para `openapi: 3.1.0`.

```

Próximos passos sugeridos

**Refresh**:1. Converter o scaffold para NestJS (se quiser executar diretamente os arquivos copiados do monólito) — isso torna a integração com TypeORM/DI idêntica ao monólito.

```bash2. Adicionar pipeline de CI que roda os testes de contrato + integração para `packages/auth-service`.

curl -s -X POST "http://localhost:3002/auth/refresh" \3. Preparar um `docker-compose` local de demonstração para rodar o monólito e o novo serviço lado a lado (modo comparativo) durante a aula.

  -H "Content-Type: application/json" \4. Opcional: adaptar os controllers copiados para o provider Express (ou portar o scaffold para Nest) para demonstrar a substituição do provider por provider real.

  -d '{"refreshToken":"some-refresh-token"}' | jq .

```Script de demonstração (opcional)

-------------------------------------------------

**Resposta esperada**:Para facilitar a execução em sala, você pode adicionar um script `demo` no `package.json` de `packages/auth-service`.

```json

{Exemplo (`packages/auth-service/package.json` -> `scripts`):

  "accessToken": "mock-access-token",

  "refreshToken": "mock-refresh-token"```json

}{

```  "scripts": {

    "demo": "ts-node-dev --respawn --transpile-only src/main.ts",

## ⚠️ Troubleshooting    "contract:test": "jest --config jest.contract.config.js",

    "integration:test": "jest --config jest.integration.config.js"

### Erro: "zsh: no such file or directory: http://..."  }

**Causa**: Esqueceu de colocar `curl` no início do comando.  }

**Solução**: O comando deve começar com `curl`, não com `http://`.```



### Erro: porta já em usoUso (a partir da raiz do pacote):

**Causa**: Outro serviço rodando na porta 3002.  ```bash

**Solução**:cd packages/auth-service

```bashnpm run demo

# Usar outra porta:```

PORT=3003 npm run demo

```Makefile (opcional) — útil para slides/execução rápida:

```make

### Falta `jq`demo:

**Solução**: Instalar jq ou remover `| jq .` do comando curl.	cd packages/auth-service && npm run demo

```bash

brew install jqcontract-test:

```	cd packages/auth-service && npm run contract:test



## 🎯 Conceitos demonstradosintegration-test:

	cd packages/auth-service && npm run integration:test

1. **Contract-first**: OpenAPI define o contrato antes da implementação```

2. **Testes de contrato**: Validam que o código segue a especificação OpenAPI

3. **Testes de integração**: Validam comportamento HTTP dos endpointsColoquei instruções e exemplos aqui no `docs/auth-service-demo.md`, mas se preferir eu posso também adicionar o `demo` script direto em `packages/auth-service/package.json` e commitar essa mudança; confirme se quer que eu faça isso.

4. **Provider mínimo**: Implementação simples para validar contrato antes de migrar lógica real

5. **Separação de concerns**: `app.ts` (factory) vs `main.ts` (bootstrap)Notas finais

- O objetivo deste scaffold é ser didático: validar contrato (OpenAPI) + behavior (mocked provider) antes de extrair o serviço real do monólito.

## 🔍 Arquivos para revisar com os alunos- Se quiser, posso abrir um PR automatizado contra `new-release` com este arquivo de documentação ou adicionar um checklist/README específico dentro de `packages/auth-service` com passos para alunos.



| Arquivo | O que mostrar |Atualizações aplicadas nesta sessão

|---------|---------------|- Backup do README original criado em `packages/auth-service/README.original.md`.

| `openapi.yaml` | Definição do contrato: paths, schemas, responses |- README do pacote atualizado: `packages/auth-service/README.md` (passo-a-passo para alunos).

| `src/controllers/auth.controller.ts` | Handlers Express simples retornando mocks |- Script `demo` adicionado ao `packages/auth-service/package.json` (use `npm run demo`).

| `test/contract/openapi.spec.ts` | Como validar OpenAPI programaticamente |

| `test/integration/auth.integration.spec.ts` | Como testar endpoints com supertest |Arquivo criado por automação de scaffold — revise e ajuste exemplos/campos sensíveis (chaves, formatos de token) conforme a necessidade da aula.


## 📝 Exercícios sugeridos para alunos

### Exercício 1: Modificar resposta mocada
1. Abrir `src/controllers/auth.controller.ts`
2. Alterar o campo `accessToken` para `"novo-token-mock"`
3. Rodar testes de integração — verificar se passam
4. Testar com curl e observar nova resposta

### Exercício 2: Adicionar novo endpoint
1. Adicionar `/auth/logout` no `openapi.yaml`
2. Atualizar teste de contrato para validar novo path
3. Implementar handler no controller
4. Criar teste de integração

### Exercício 3: Quebrar contrato (intencional)
1. Remover campo `refreshToken` do schema no `openapi.yaml`
2. Rodar `npm run contract:test` — deve FALHAR
3. Observar mensagem de erro
4. Reverter mudança e testes passam novamente

## 🚢 Docker (opcional)

### Build
```bash
docker build -t auth-service:demo .
```

### Run
```bash
docker run -p 3002:3002 auth-service:demo
```

### Test
```bash
curl http://localhost:3002/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}' | jq .
```

## 🎓 Para o instrutor

### Ordem sugerida de apresentação
1. Mostrar `openapi.yaml` — explicar contract-first
2. Rodar testes de contrato — mostrar que validam spec
3. Mostrar controller Express — código simples, mocks
4. Rodar testes de integração — validam comportamento
5. Iniciar servidor e fazer chamadas curl — demonstração prática
6. Propor exercícios aos alunos

### Tempo estimado
- Apresentação: 15-20 min
- Exercícios guiados: 20-30 min
- Perguntas e exploração livre: 10-15 min

### Pontos de atenção
- Reforçar diferença entre testes de contrato (validam spec) vs integração (validam comportamento)
- Explicar por que usamos Express mínimo (simplicidade, foco no contrato)
- Mencionar que próximo passo seria converter para NestJS ou extrair lógica real

## 📚 Próximos passos (fora do escopo deste scaffold)

1. **Converter para NestJS**: Adicionar `@nestjs/platform-express`, módulos, DI
2. **Extrair lógica real**: Copiar controllers/services do monólito
3. **Adicionar banco de dados**: TypeORM + Postgres
4. **CI/CD**: Pipeline para rodar testes automaticamente
5. **Deploy**: Kubernetes manifests ou docker-compose para produção

## ℹ️ Notas técnicas

- **Porta 3002**: Escolhida para evitar conflitos com monólito (porta 3000) e outros serviços
- **OpenAPI 3.1.0**: Versão mais recente, compatível com JSON Schema 2020-12
- **ts-node-dev**: Hot reload durante desenvolvimento (mais rápido que tsc + node)
- **supertest**: Biblioteca popular para testes HTTP em Node.js

## 📞 Suporte

- README do pacote: `packages/auth-service/README.md`
- Documentação de migração: `docs/microservices-migration.md`
- Plano de extração: `docs/auth-extraction-plan.md`

---

**Versão do documento**: 2.0 (Express mínimo — limpo)  
**Última atualização**: Novembro 2025  
**Branch**: `new-release`  
**PR**: #59
