## Demo e artefatos: auth-service (scaffold)

Resumo rápido
- Local: `packages/auth-service`
- Objetivo: scaffold didático do serviço `auth` com OpenAPI, testes de contrato e testes de integração, e um provider mínimo (Express) que retorna valores mocados para demonstração em sala.
- Branch alvo para a extração: `new-release` (PR-style extraction foi aplicada nessa branch — o monólito ficou inalterado).

O que foi criado
- `packages/auth-service/openapi.yaml` — especificação OpenAPI do contrato (atualizada para `openapi: 3.1.0`).
- `packages/auth-service/src/` — provider Express mínimo (endpoints `/auth/login`, `/auth/refresh`, etc.) com respostas mocadas úteis para demonstração.
- `packages/auth-service/test/contract/openapi.spec.ts` — testes de contrato que validam o OpenAPI.
- `packages/auth-service/test/integration/auth.integration.spec.ts` — testes de integração (supertest) contra o app exportado.
- Copia PR-style dos artefatos do monólito em `packages/auth-service/src/auth/` (arquivos NestJS: controllers, services, DTOs, entity `refresh-token.entity.ts`, `users-http.client.ts`) — presente como referência/PR candidate.

Porta e conflitos locais
- O provider padrão foi ajustado para evitar conflitos locais: porta padrão é `3002`.

Comandos principais (no repositório)
1) Entrar no pacote e instalar dependências
```bash
cd packages/auth-service
npm install
```

2) Rodar testes de contrato
```bash
npm run contract:test
```

3) Rodar testes de integração
```bash
npm run integration:test
```

4) Iniciar servidor para demo (dev)
Observação: o scaffold usa um dev runner (ex: `ts-node-dev` ou `node` pré-build dependendo do script). Se houver script `dev`:
```bash
npm run dev
# ou, se existir, build + start
npm run build && npm start
```
Após iniciar, o servidor deve logar algo como: `auth-service listening on port 3002`.

Exemplos de requisições (curl)
- POST /auth/refresh (exemplo correto — single-line com curl):
```bash
curl -s -X POST "http://localhost:3002/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"some-refresh-token"}' | jq .
```

- Multiline (cada linha termina com \):
```bash
curl -s -X POST "http://localhost:3002/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"some-refresh-token"}' \
  | jq .
```

Nota: se você esquece de colocar `curl` no início (ex.: começar com `http://...`), o shell tentará executar essa URL como um comando e retornará `zsh: no such file or directory`.

Comportamento atual
- Endpoints retornam valores mocados (úteis para demos e para validar contratos antes da extração completa).
- Testes executados durante a sessão:
  - `npm run contract:test` → PASS
  - `npm run integration:test` → PASS

Onde inspecionar o código relevante
- Provider Express minimal: `packages/auth-service/src/app.ts`, `packages/auth-service/src/controllers/*`.
- OpenAPI: `packages/auth-service/openapi.yaml`.
- Testes: `packages/auth-service/test/**`.
- Cópia do monólito (PR-style): `packages/auth-service/src/auth/`.

Problemas encontrados e resoluções rápidas
- Problema: porta 3000 já em uso localmente → solução: alterar porta padrão para 3002 e atualizar `Dockerfile`/docs.
- Problema: OpenAPI linter/validator exigia `3.1.0` → atualização do `openapi.yaml` para `openapi: 3.1.0`.

Próximos passos sugeridos
1. Converter o scaffold para NestJS (se quiser executar diretamente os arquivos copiados do monólito) — isso torna a integração com TypeORM/DI idêntica ao monólito.
2. Adicionar pipeline de CI que roda os testes de contrato + integração para `packages/auth-service`.
3. Preparar um `docker-compose` local de demonstração para rodar o monólito e o novo serviço lado a lado (modo comparativo) durante a aula.
4. Opcional: adaptar os controllers copiados para o provider Express (ou portar o scaffold para Nest) para demonstrar a substituição do provider por provider real.

Script de demonstração (opcional)
-------------------------------------------------
Para facilitar a execução em sala, você pode adicionar um script `demo` no `package.json` de `packages/auth-service`.

Exemplo (`packages/auth-service/package.json` -> `scripts`):

```json
{
  "scripts": {
    "demo": "ts-node-dev --respawn --transpile-only src/main.ts",
    "contract:test": "jest --config jest.contract.config.js",
    "integration:test": "jest --config jest.integration.config.js"
  }
}
```

Uso (a partir da raiz do pacote):
```bash
cd packages/auth-service
npm run demo
```

Makefile (opcional) — útil para slides/execução rápida:
```make
demo:
	cd packages/auth-service && npm run demo

contract-test:
	cd packages/auth-service && npm run contract:test

integration-test:
	cd packages/auth-service && npm run integration:test
```

Coloquei instruções e exemplos aqui no `docs/auth-service-demo.md`, mas se preferir eu posso também adicionar o `demo` script direto em `packages/auth-service/package.json` e commitar essa mudança; confirme se quer que eu faça isso.

Notas finais
- O objetivo deste scaffold é ser didático: validar contrato (OpenAPI) + behavior (mocked provider) antes de extrair o serviço real do monólito.
- Se quiser, posso abrir um PR automatizado contra `new-release` com este arquivo de documentação ou adicionar um checklist/README específico dentro de `packages/auth-service` com passos para alunos.

Atualizações aplicadas nesta sessão
- Backup do README original criado em `packages/auth-service/README.original.md`.
- README do pacote atualizado: `packages/auth-service/README.md` (passo-a-passo para alunos).
- Script `demo` adicionado ao `packages/auth-service/package.json` (use `npm run demo`).

Arquivo criado por automação de scaffold — revise e ajuste exemplos/campos sensíveis (chaves, formatos de token) conforme a necessidade da aula.
