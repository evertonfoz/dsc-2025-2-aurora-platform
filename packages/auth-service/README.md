# auth-service — Guia para Alunos# auth-service — guia para alunos



> **Scaffold didático**: Provider Express mínimo demonstrando contract-first developmentEste diretório contém um scaffold didático do `auth-service` (provider Express mínimo) extraído do monólito para fins de demonstração em sala.



## 🎯 O que é este projeto?Objetivo rápido

- Demonstrar extração incremental: validar contrato (OpenAPI) + provider mínimo com respostas mocadas antes de migrar a lógica real.

Este é um **scaffold educacional** do serviço `auth` extraído do monólito. O objetivo é demonstrar:

- ✅ Abordagem contract-first (OpenAPI primeiro)Arquivos importantes

- ✅ Testes de contrato e integração- `openapi.yaml` — especificação do contrato (login, refresh).

- ✅ Provider mínimo com respostas mocadas- `src/` — provider Express com endpoints de demo.

- ✅ Estrutura preparada para evolução- `test/contract` — testes que validam a OpenAPI.

- `test/integration` — testes de integração (supertest) que executam o app em memória.

**Importante**: Este é um provider Express MÍNIMO, não contém lógica real do monólito.

Pré-requisitos

---- Node 18+ e npm

- Opcional: `jq` para formatar JSON em linha de comando (`brew install jq`).

## 📁 Estrutura do projeto

Passo a passo (rápido)

```1) Instalar dependências:

packages/auth-service/

├── openapi.yaml          ← Contrato OpenAPI (defin o que o serviço deve fazer)```bash

├── package.json          ← Dependências e scriptscd packages/auth-service

├── src/npm install

│   ├── app.ts            ← Express app (factory)```

│   ├── main.ts           ← Inicia servidor (porta 3002)

│   └── controllers/2) Rodar os testes de contrato (valida o `openapi.yaml`):

│       └── auth.controller.ts  ← Rotas mocadas (login, refresh)

└── test/```bash

    ├── contract/         ← Testes que validam OpenAPInpm run contract:test

    └── integration/      ← Testes que chamam endpoints HTTP```

```

3) Rodar os testes de integração:

---

```bash

## 🚀 Como rodar (passo a passo)npm run integration:test

```

### Pré-requisitos

- Node.js 18+ instalado4) Rodar o serviço em modo demo:

- npm instalado

- (Opcional) `jq` para formatar JSON: `brew install jq````bash

npm run demo

### 1️⃣ Instalar dependências# se preferir, equivalentes diretos:

```bashnpx ts-node-dev --respawn --transpile-only src/main.ts

cd packages/auth-service```

npm install

```Após iniciado, o serviço logará: `auth-service listening on port 3002`.



### 2️⃣ Rodar testes de contratoExemplo de chamada (refresh):

Estes testes **validam que o código segue o OpenAPI**:

```bash```bash

npm run contract:testcurl -s -X POST "http://localhost:3002/auth/refresh" \

```  -H "Content-Type: application/json" \

  -d '{"refreshToken":"some-refresh-token"}' | jq .

✅ **Deve passar 2 testes**: login e refresh existem no OpenAPI```



### 3️⃣ Rodar testes de integraçãoNotas para a aula

Estes testes **chamam os endpoints HTTP e validam respostas**:- O script `demo` foi adicionado ao `package.json` para facilitar a execução (`npm run demo`).

```bash- A porta padrão é `3002` para evitar conflitos locais; sobrescreva com `PORT` se desejar.

npm run integration:test- Os endpoints retornam respostas mocadas; use o scaffold para experimentar alterações e ver como os testes reagem.

```

Backup

✅ **Deve passar 3 testes**: login, refresh e erro 400- O README original foi preservado em `README.original.md` no mesmo diretório.



### 4️⃣ Iniciar o servidorExercício sugerido

```bash1. Rode os testes de contrato e integração. 2. Modifique uma resposta mocada e observe os testes que falham. 3. Tente portar os controllers copiados do monólito em `src/auth/` para ver a integração com TypeORM e Nest.

npm run demo

```Se quiser, posso também adicionar um `docker-compose` de demonstração ou inserir o script diretamente em `package.json` (já adicionado) e commitar—já adicionei o script `demo`.

# auth-service (scaffold)

✅ **Deve exibir**: `auth-service listening on port 3002`

Este diretório contém um scaffold didático para o `auth-service` extraído do monolito.

### 5️⃣ Testar manualmente com curlEle serve como ponto de partida para demonstrar a migração incremental de `auth` para um microserviço.



**Login**:Arquivos criados:

```bash

curl -X POST "http://localhost:3002/auth/login" \- `package.json` - dependências e scripts (build, start, test, contract:test).

  -H "Content-Type: application/json" \- `tsconfig.json` - configuração TypeScript mínima.

  -d '{"email":"aluno@test.com","password":"senha123"}' | jq .- `Dockerfile` - imagem básica para executar o serviço.

```- `openapi.yaml` - especificação OpenAPI mínima para `login` e `refresh`.

- `test/contract/openapi.spec.ts` - testes de contrato que validam a presença dos endpoints e schemas no `openapi.yaml`.

**Refresh**:

```bash Como usar (local):

curl -X POST "http://localhost:3002/auth/refresh" \

  -H "Content-Type: application/json" \1. Instale as dependências:

  -d '{"refreshToken":"token-qualquer"}' | jq .

``````bash

cd packages/auth-service

**Resposta esperada** (valores mocados):npm install

```json```

{

  "accessToken": "mock-access-token",2. Rodar os testes de contrato (valida a OpenAPI):

  "refreshToken": "mock-refresh-token"

}```bash

```npm run contract:test

```

---

 3. Rodar testes de integração (inicia o app em memória e chama os endpoints):

## ❓ Perguntas e respostas

 ```bash

### Por que Express e não NestJS? npm run integration:test

Para **simplicidade didática**. Express é mais simples de entender. A conversão para NestJS será uma etapa futura. ```



### Por que respostas mocadas?3. Rodar todos os testes:

Para **validar o contrato** antes de migrar a lógica complexa do monólito. O contrato (OpenAPI) está correto? Os testes passam? Então podemos evoluir com segurança.

```bash

### O que são testes de contrato?npm test

Testes que verificam se o **código segue a especificação OpenAPI**. Exemplo: se o OpenAPI diz que `/auth/login` existe, o teste valida que ele existe no código.```



### O que são testes de integração?4. Rodar em modo dev (requer `ts-node-dev`):

Testes que **executam requisições HTTP reais** contra o servidor e validam as respostas. Exemplo: chama `POST /auth/login` e verifica se retorna 200 e tem `accessToken`.

```bash

### Por que porta 3002?npm run dev

Para **evitar conflito** com o monólito (porta 3000) e outros serviços locais.```



---Notas para a sala de aula:

- Os testes de contrato aqui são um exemplo simples: verificam a especificação OpenAPI localmente.

## 🛠️ Troubleshooting- Em uma migração real, os testes de contrato também podem ser usados entre consumer e provider (ex: Pact).


### ❌ Erro: "zsh: no such file or directory: http://..."
**Problema**: Você esqueceu de escrever `curl` no início.  
**Solução**: O comando deve começar com `curl`, não com `http://`.

### ❌ Erro: "EADDRINUSE: address already in use"
**Problema**: A porta 3002 já está em uso.  
**Solução**: Usar outra porta:
```bash
PORT=3003 npm run demo
```

### ❌ Comando `jq` não encontrado
**Problema**: `jq` não está instalado.  
**Solução**: Instalar com `brew install jq` ou remover `| jq .` dos comandos curl.

---

## 📝 Exercícios práticos

### Exercício 1: Modificar resposta mocada ⭐
**Objetivo**: Entender como o código gera respostas

1. Abrir `src/controllers/auth.controller.ts`
2. Alterar o valor de `accessToken` para `"meu-token-modificado"`
3. Rodar `npm run demo`
4. Testar com curl e verificar que a resposta mudou

### Exercício 2: Adicionar validação ⭐⭐
**Objetivo**: Praticar validação de entrada

1. No controller, adicionar validação: email deve conter `@`
2. Se não conter, retornar erro 400
3. Adicionar teste de integração para validar o erro
4. Rodar `npm run integration:test`

### Exercício 3: Criar endpoint de logout ⭐⭐⭐
**Objetivo**: Ciclo completo (OpenAPI → código → testes)

1. Adicionar `/auth/logout` no `openapi.yaml`
2. Implementar handler no controller
3. Criar teste de contrato para o novo endpoint
4. Criar teste de integração
5. Rodar todos os testes

---

## 📚 Arquivos para estudar

| Arquivo | O que aprender |
|---------|----------------|
| `openapi.yaml` | Como definir contratos de API |
| `src/controllers/auth.controller.ts` | Como criar rotas Express |
| `src/app.ts` | Pattern de factory para Express |
| `src/main.ts` | Como inicializar um servidor |
| `test/contract/openapi.spec.ts` | Como testar contratos |
| `test/integration/auth.integration.spec.ts` | Como testar endpoints HTTP |

---

## 🚢 Docker (opcional)

### Build da imagem
```bash
docker build -t auth-service:demo .
```

### Executar container
```bash
docker run -p 3002:3002 auth-service:demo
```

### Testar container
```bash
curl http://localhost:3002/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass"}' | jq .
```

---

## 🎓 Para o instrutor

### Ordem sugerida
1. Explicar contract-first (mostrar `openapi.yaml`)
2. Rodar testes de contrato (explicar o que validam)
3. Mostrar controller (código simples)
4. Rodar testes de integração
5. Iniciar servidor e fazer chamadas curl
6. Propor exercícios

### Conceitos cobertos
- Contract-first development
- Testes de contrato vs integração
- Express básico
- Mocking e stubs
- Preparação para microserviços

---

## 📞 Ajuda e documentação

- **Documentação completa**: `docs/auth-service-demo.md`
- **Plano de migração**: `docs/microservices-migration.md`
- **Plano de extração**: `docs/auth-extraction-plan.md`

---

## 🔜 Próximos passos

Este scaffold é a **Etapa 1** da migração. Próximas etapas:

1. **Etapa 2**: Converter para NestJS (adicionar DI, módulos)
2. **Etapa 3**: Extrair lógica real do monólito (controllers, services, DTOs)
3. **Etapa 4**: Conectar banco de dados (TypeORM + Postgres)
4. **Etapa 5**: Deploy e integração com monólito

---

**Versão**: 2.0 (limpa e didática)  
**Atualizado**: Novembro 2025  
**Branch**: `new-release`
