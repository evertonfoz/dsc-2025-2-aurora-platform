Plano de ensino e execução: Extração incremental do `auth` (material referencial)

Data: 10/11/2025

Objetivo

Este documento serve como material referencial para suas aulas: justifica a sequência de passos proposta (provider minimal → testes → conversão para Nest → PR-style extraction → canary/cutover), detalha cada etapa, traz comandos práticos para os alunos e checklists para validação. Use-o como roteiro em sala e como checklist para os exercícios.

Sumário executivo — por que essa sequência

1) Provider minimal (PoC)
- Justificativa: cria um alvo simples e controlado que implementa o contrato. Permite demonstrar rapidamente a ideia de "service" e validar contratos sem lidar com complexidade do framework.
- Resultado esperado: um servidor pequeno (Express ou Nest) que responde aos endpoints necessários com respostas mockadas.

2) Testes (contrato + integração)
- Justificativa: contratos previnem regressões entre consumer e provider; integração garante que o provedor responde conforme o contrato.
- Resultado esperado: testes de contrato (validação da OpenAPI) e testes de integração (supertest) verdes.

3) Converter provider minimal para Nest (full-fidelity)
- Justificativa: se o monolito usa Nest, a extração em produção tende a usar a mesma stack — isso minimiza mudanças de convenções e facilita reutilização de código (pipes, guards, interceptors).
- Resultado esperado: provider com mesma arquitetura do monolito, pronto para migrar handlers reais.

4) PR-style extraction (copiar handlers reais)
- Justificativa: demonstra o fluxo real de engenharia (branching, commits, CI, revisão) e prepara o time para lidar com ajustes (imports, shared libs).
- Resultado esperado: branch contendo os handlers adaptados, testes passados e PR pronto para revisão.

5) Canary / Cutover
- Justificativa: técnica de menor risco para comutar tráfego a novo serviço. Permite validação em produção com rollback rápido.
- Resultado esperado: tráfego gradualmente migrado, monitoramento de erros/latência e validação de business metrics.

Requisitos e pré-requisitos

- Node 18+, npm
- Docker e Docker Compose (para demonstrações de deploy)
- Projeto com monolito (esta repo) e scaffold `packages/auth-service` (já criado)
- Acesso ao GitHub (para PRs), ou procedimento de revisão local se preferir

Passos detalhados e comandos (para aula)

Passo 0 — Preparação do instrutor
- Garanta que o repositório está atualizado (branch `main`).
- Abra o projeto no editor e localize `src/auth` (monolito) e `packages/auth-service` (scaffold).

Passo 1 — Provider minimal (PoC)
- Objetivo: demonstrar o contrato sem complexidade do framework.

Comandos (na máquina do aluno):

```bash
cd path/to/repo/packages/auth-service
npm install
npm run dev          # start em modo dev (hot reload)
# alternativa (Docker):
docker build -t auth-service:dev .
docker run --rm -p 3000:3000 auth-service:dev
```

Verificações:
- Acesse `http://localhost:3000/health` ou `curl http://localhost:3000/health`.
- Teste manual: `curl -X POST http://localhost:3000/auth/login -d '{"email":"test@x.com","password":"x"}' -H 'Content-Type: application/json'`

Passo 2 — Testes (contrato + integração)

Contrato (OpenAPI presence checks):

```bash
npm run contract:test
```

Integração (supertest contra a app exportada):

```bash
npm run integration:test
```

Se testes falharem:
- Revisar mensagens do Jest.
- Conferir `openapi.yaml` e o `src/controllers` do provider.

Passo 3 — Converter provider minimal para Nest (full‑fidelity)

Motivo: manter mesma stack do monolito facilita reaproveitamento, testes e patterns.

Atividades (resumo):
- Instalar dependências Nest no pacote:
  - `npm i @nestjs/core @nestjs/common @nestjs/platform-express rxjs reflect-metadata`
  - Dependências de dev: `@nestjs/testing` se for criar testes de módulo.
- Criar arquivos Nest básicos:
  - `src/main.ts` — bootstrap com NestFactory.
  - `src/app.module.ts` — composição de módulos.
  - `src/auth/auth.controller.ts` — handlers equivalentes aos do express.
- Adaptar testes de integração para instanciar Nest app (usando Test.createTestingModule) ou exportar o `app.getHttpServer()` para supertest.

Dica de exercício: peça para os alunos reescreverem apenas o `auth.controller` (Express → Nest) mantendo os testes verdes.

Passo 4 — Extração PR-style (copiar handlers reais)

Fluxo sugerido (instrutor/estudante):

1. Criar branch de trabalho:

```bash
git checkout -b feat/extract-auth-service
```

2. Copiar arquivos do monolito:
- `src/auth/auth.controller.ts` → `packages/auth-service/src/auth/auth.controller.ts`
- `src/auth/auth.service.ts` → `packages/auth-service/src/auth/auth.service.ts`
- DTOs, entidades e validadores necessários.

3. Adaptar imports:
- Remover dependências diretas a `../../common/...` e substituir por `packages/shared-lib` ou duplicar temporariamente.

4. Rodar testes no pacote:

```bash
cd packages/auth-service
npm install
npm run contract:test
npm run integration:test
```

5. Commitar, abrir PR com descrição clara e checklist de testes executados.

CI/Quality gates sugeridos para o PR:
- Build e lint do pacote.
- Execução de `contract:test` e `integration:test`.
- Smoke test do monolito (opcional) para garantir interoperabilidade.

Passo 5 — Canary / Cutover (alto nível)

1. Deploy do novo serviço em paralelo.
2. Direcionar pequena fração do tráfego (1-5%) para o novo serviço (load balancer/proxy).
3. Monitorar erros, logs e métricas de negócio.
4. Aumentar gradualmente ou rollback se necessário.

Checklist de aceitação por PR/aula

- [ ] Provider minimal responde corretamente e testes de integração passam.
- [ ] Testes de contrato verdes.
- [ ] Handlers do monolito permanecem até validação completa.
- [ ] PR contém descrição, testes executados e plano de rollback.
- [ ] CI executa testes de contrato como gate.

Registro e evidências (o que o instrutor deve coletar)

- Branch nome e timestamp.
- Logs dos testes (Jest output) e screenshots se desejar.
- Notas sobre ajustes realizados (imports, mudanças de contrato, migrations).

Sugestão de exercício para avaliação final

- Cada aluno/dupla cria uma branch, extrai um handler do monolito para o scaffold (Nest), passa os testes e abre PR com checklist e screenshots. Avaliar pela qualidade do PR e pelos testes.

---

Observação: posso criar a branch `feat/extract-auth-service` e começar a preparar a cópia PR-style dos handlers do monolito (sem remover nada do monolito). Peça autorização se deseja que eu proceda com essa etapa.

## Glossário rápido e justificativa das escolhas técnicas

O objetivo desta seção é explicar, de forma didática, o que é Express, o que é a especificação OpenAPI e por que escolhemos essa combinação para a etapa inicial (provider minimal + testes). Use este texto diretamente nas suas aulas para contextualizar as decisões.

O que é Express?

- Express é um framework web minimalista para Node.js. Ele fornece um sistema simples de roteamento, middleware e handlers HTTP. É conhecido por:
  - Ser leve e com pouca boilerplate — ótimo para protótipos e provas de conceito.
  - Ter grande ecossistema e integração com middlewares (body-parser, cors, helmet etc.).
  - Permitir iniciar um servidor HTTP com poucas linhas de código.

Quando usar Express na migração?

- Para um provider minimal (PoC) e para aulas: Express reduz a curva de aprendizado dos alunos, permitindo focar em conceitos centrais (contrato, teste, deploy) sem explicar padrões e abstrações de um framework mais completo.
- Em produção, se você já usa Nest (com DI, decorators e patterns), provavelmente vai preferir manter Nest no serviço final. Express é uma escolha tática para ensino e validação rápida.

O que é OpenAPI?

- OpenAPI (antigo Swagger) é uma especificação padronizada para descrever APIs RESTful em formato legível por máquinas (YAML/JSON). Principais benefícios:
  - Documentação automática e legível (geração de Swagger UI).
  - Fonte de verdade para contratos entre consumer e provider.
  - Possibilidade de gerar clientes/servidores automaticamente e criar testes de contrato.

Por que usar OpenAPI nesta etapa?

- Especificar a API antes de mover código ajuda a definir claramente o contrato entre serviços (o que o consumer espera).
- Permite criar testes de contrato (como o teste que adicionamos) que verificam se a especificação contém os endpoints e schemas necessários.
- Facilita discussões em sala: alunos veem a especificação e o código do provider, e aprendem sobre a importância de contratos explícitos.

Por que a combinação Express + OpenAPI para o PoC?

- Express permite implementar rapidamente os endpoints que a OpenAPI descreve. Em sala, o instructor pode demonstrar em minutos como uma especificação vira um servidor funcional.
- OpenAPI dá disciplina ao design da API: os alunos aprendem a primeiro definir contratos e depois implementar, prática que reduz regressões e ambiguidades.

Limitações e próximos passos

- O provider Express é propositalmente simples e não inclui padrões avançados (injeção de dependência, pipes, interceptors). Para projetos reais, ou para exercícios avançados, convertemos para Nest, mantendo os mesmos contratos e testes.
- A extração final dos handlers reais (PR-style) deve considerar dependências do monolito (shared libs, migrations e modelos). A estratégia ensinada é migrar em pequenos passos, testando cada etapa.

Recursos úteis (links para leitura e referência rápida)

- Express: https://expressjs.com/
- OpenAPI: https://spec.openapis.org/
- Swagger UI: https://swagger.io/tools/swagger-ui/

Nota sobre validação e versão OpenAPI

- Durante a validação do scaffold do `auth-service` verificamos um aviso do linter que exige OpenAPI >= 3.1.x. Para resolver rapidamente e garantir conformidade com as ferramentas do workspace, atualizamos a primeira linha de `packages/auth-service/openapi.yaml` de `openapi: 3.0.3` para `openapi: 3.1.0`.
- Essa mudança é segura para a especificação mínima que usamos aqui (paths e schemas simples). Em casos mais complexos pode ser necessário revisar schemas que utilizem recursos específicos do JSON Schema — o que não se aplica ao PoC atual.
- Testes executados durante a validação:
  - `npm install` (pacote `packages/auth-service`) — instalou dependências (com avisos de depreciação, sem vulnerabilidades críticas detectadas).
  - `npm run contract:test` — PASS
  - `npm run integration:test` — PASS

Registre isso em evidências da aula: a alteração da versão e os resultados dos testes (logs do Jest). Isso ajuda alunos a entenderem a importância de ferramentas de validação e de manter especificações alinhadas com o ambiente.

