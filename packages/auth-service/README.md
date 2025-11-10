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
