# auth-service — guia para alunos

Este diretório contém um scaffold didático do `auth-service` (provider Express mínimo) extraído do monólito para fins de demonstração em sala.

Objetivo rápido
- Demonstrar extração incremental: validar contrato (OpenAPI) + provider mínimo com respostas mocadas antes de migrar a lógica real.

Arquivos importantes
- `openapi.yaml` — especificação do contrato (login, refresh).
- `src/` — provider Express com endpoints de demo.
- `test/contract` — testes que validam a OpenAPI.
- `test/integration` — testes de integração (supertest) que executam o app em memória.

Pré-requisitos
- Node 18+ e npm
- Opcional: `jq` para formatar JSON em linha de comando (`brew install jq`).

Passo a passo (rápido)
1) Instalar dependências:

```bash
cd packages/auth-service
npm install
```

2) Rodar os testes de contrato (valida o `openapi.yaml`):

```bash
npm run contract:test
```

3) Rodar os testes de integração:

```bash
npm run integration:test
```

4) Rodar o serviço em modo demo:

```bash
npm run demo
# se preferir, equivalentes diretos:
npx ts-node-dev --respawn --transpile-only src/main.ts
```

Após iniciado, o serviço logará: `auth-service listening on port 3002`.

Exemplo de chamada (refresh):

```bash
curl -s -X POST "http://localhost:3002/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"some-refresh-token"}' | jq .
```

Notas para a aula
- O script `demo` foi adicionado ao `package.json` para facilitar a execução (`npm run demo`).
- A porta padrão é `3002` para evitar conflitos locais; sobrescreva com `PORT` se desejar.
- Os endpoints retornam respostas mocadas; use o scaffold para experimentar alterações e ver como os testes reagem.

Backup
- O README original foi preservado em `README.original.md` no mesmo diretório.

Exercício sugerido
1. Rode os testes de contrato e integração. 2. Modifique uma resposta mocada e observe os testes que falham. 3. Tente portar os controllers copiados do monólito em `src/auth/` para ver a integração com TypeORM e Nest.

Se quiser, posso também adicionar um `docker-compose` de demonstração ou inserir o script diretamente em `package.json` (já adicionado) e commitar—já adicionei o script `demo`.
# auth-service (scaffold)

Este diretório contém um scaffold didático para o `auth-service` extraído do monolito.
Ele serve como ponto de partida para demonstrar a migração incremental de `auth` para um microserviço.

Arquivos criados:

- `package.json` - dependências e scripts (build, start, test, contract:test).
- `tsconfig.json` - configuração TypeScript mínima.
- `Dockerfile` - imagem básica para executar o serviço.
- `openapi.yaml` - especificação OpenAPI mínima para `login` e `refresh`.
- `test/contract/openapi.spec.ts` - testes de contrato que validam a presença dos endpoints e schemas no `openapi.yaml`.

 Como usar (local):

1. Instale as dependências:

```bash
cd packages/auth-service
npm install
```

2. Rodar os testes de contrato (valida a OpenAPI):

```bash
npm run contract:test
```

 3. Rodar testes de integração (inicia o app em memória e chama os endpoints):

 ```bash
 npm run integration:test
 ```

3. Rodar todos os testes:

```bash
npm test
```

4. Rodar em modo dev (requer `ts-node-dev`):

```bash
npm run dev
```

Notas para a sala de aula:
- Os testes de contrato aqui são um exemplo simples: verificam a especificação OpenAPI localmente.
- Em uma migração real, os testes de contrato também podem ser usados entre consumer e provider (ex: Pact).
