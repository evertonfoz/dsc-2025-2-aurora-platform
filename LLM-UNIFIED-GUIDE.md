# LLM-UNIFIED-GUIDE.md

## Guia Unificado para Interação Eficiente com LLMs (Copilot Chat)

Este guia foi elaborado a partir de um fluxo real de desenvolvimento, desde o envio de um prompt até a documentação, testes e validação final. Siga estas orientações para obter melhores resultados ao interagir com modelos de linguagem como o GitHub Copilot Chat.

---

### 1. Estruture seu Pedido de Forma Clara e Objetiva
- **Seja específico**: Detalhe o que deseja (ex: "Implemente o endpoint PATCH /users/:id com soft delete").
- **Contextualize**: Informe o contexto do projeto, tecnologias e padrões adotados.
- **Exemplo**: "Estou usando NestJS, TypeORM e quero CRUD completo para users, incluindo soft delete."

### 2. Solicite e Valide por Etapas
- **Divida tarefas grandes em etapas menores**: Peça para implementar, depois testar, depois documentar.
- **Valide cada etapa**: Peça para rodar testes, revisar código, corrigir problemas antes de avançar.
- **Exemplo**: "Implemente o endpoint GET /users/:id. Agora crie os testes. Rode os testes. Corrija se necessário."

### 3. Peça Geração e Registro de Prompts/Documentação
- **Solicite prompts de análise ou instruções**: Peça para gerar e salvar arquivos de prompt ou documentação.
- **Exemplo**: "Gere um prompt de análise CRUD e salve em docs/prompts."

### 4. Use Testes Automatizados como Critério de Aceite
- **Peça para criar e rodar testes unitários**: Use o resultado dos testes como validação objetiva.
- **Exemplo**: "Crie testes para o endpoint PATCH. Rode os testes. Ajuste até todos passarem."

### 5. Corrija e Refatore Sempre que Necessário
- **Peça para corrigir erros de sintaxe, lógica ou estrutura**: Não avance com código quebrado.
- **Exemplo**: "Corrija métodos fora da classe. Ajuste retornos conforme esperado nos testes."

### 6. Documente o Processo e Gere Relatórios
- **Solicite relatórios de execução e guias de validação**: Peça para registrar o que foi feito e como validar.
- **Exemplo**: "Gere um relatório de tudo que foi feito a partir do prompt. Crie um guia de validação para a equipe."

### 7. Versione e Submeta via Pull Request
- **Peça para criar branch, commit, push e PR**: Garanta rastreabilidade e revisão do trabalho.
- **Exemplo**: "Crie uma branch docs/feature, faça commit, push e abra um PR para main."



### 8. Organize os Testes em Subpastas controllers/ e services/
- Crie subpastas `controllers/` e `services/` dentro de `test/users/`.
- Cada método principal deve ter seu próprio arquivo de teste, por exemplo:
  - `test/users/services/users.service.create.spec.ts`
  - `test/users/controllers/users.controller.findOne.spec.ts`
- Ajuste os imports relativos conforme a estrutura de pastas.
- Remova arquivos antigos/unificados após a migração para a estrutura modular.

### 9. Boas Práticas para Testes
- Sempre mocke métodos privados e dependências relevantes (ex: hash de senha).
- Garanta que os testes reflitam o fluxo real do serviço, especialmente para métodos que envolvem lógica adicional (ex: hashing, normalização).
- Após grandes mudanças de estrutura, rode todos os testes para garantir que tudo está funcionando.


### 10. Workflow Obrigatório: Criação de Issue Antes de Qualquer Ação

**NUNCA realize nenhuma ação (implementação, refatoração, teste, documentação, etc.) sem antes criar uma issue.**

**Fluxo obrigatório:**
1. Sempre solicite ao LLM: "Crie uma issue para esta demanda antes de qualquer coisa."
2. A issue deve ser criada como um arquivo Markdown dentro de `docs/issues/`, com um nome descritivo e data.
3. Após a issue criada, crie uma branch específica para ela (ex: `issue/2025-10-07-nome-da-issue`).
4. Realize as alterações necessárias na branch.
5. Faça commit das mudanças, referenciando a issue.
6. Faça push da branch para o repositório remoto.
7. Abra um Pull Request (PR) para a branch principal (`main`), mencionando a issue.
8. Aguarde revisão e aprovação do PR antes de mergear.

**Importante:**
- Sempre peça explicitamente a criação da issue antes de qualquer ação.
- Não avance para implementação, testes ou documentação sem a issue registrada.
- Use o template de issue para descrever claramente o objetivo, contexto, critérios de aceite e data.

#### Exemplo de template de issue (docs/issues/2025-10-07-exemplo.md):
```markdown
# Título da Issue

**Data:** 07/10/2025

## Descrição
Descreva claramente o objetivo da demanda.

## Contexto
Explique o contexto do projeto e a motivação da tarefa.

## Critérios de Aceite
- [ ] Critério 1
- [ ] Critério 2
- [ ] ...

## Observações
Adicione informações relevantes, links ou anexos.
```

---

### 11. Checklist para Pedidos Eficientes
[ ] Pedido claro, objetivo e contextualizado
[ ] Issue criada em docs/issues antes de qualquer ação
[ ] Branch criada para a issue
[ ] Tarefas divididas em etapas
[ ] Testes automatizados criados e executados, organizados por método e pasta
[ ] Documentação e relatórios gerados
[ ] Código revisado e validado
[ ] Versionamento e PR realizados
[ ] Estrutura de testes modular e limpa
[ ] Imports relativos revisados
[ ] Arquivos antigos removidos após migração

---

## Dicas Finais
- **Interaja de forma iterativa**: Implemente, teste, corrija, documente, valide.
- **Peça explicações e exemplos sempre que necessário**.
- **Use o Copilot Chat como parceiro ativo, não apenas executor.**

### Uso de MCP Context7 (recomendado)

- Para obter documentação atualizada e exemplos oficiais de bibliotecas críticas do projeto (por exemplo: NestJS, TypeORM, class-transformer, class-validator, RxJS, Jest, ESLint), consulte o servidor MCP Context7 antes de implementar mudanças não triviais.
- Fluxo recomendado ao usar MCP Context7:
  1. Resolver o identificador da biblioteca (p.ex. `nest.js` ou `/vercel/next.js`) usando a API do MCP Context7.
  2. Recuperar a documentação e trechos relevantes (hooks, exemplos de configuração, breaking changes).
  3. Aplicar mudanças pequenas e seguras com base nas recomendações e citar a fonte no PR.

### Verificação obrigatória de AGENTS.md

- Antes de iniciar qualquer tarefa, abra e leia `AGENTS.md` para conferir instruções rápidas do time humano e proceder conforme o fluxo indicado.


Seguindo este guia, suas interações com LLMs serão mais produtivas, assertivas e alinhadas com as melhores práticas de desenvolvimento colaborativo.

---

## Prevenção de erros comuns de lint e testes ao gerar código/tests

Quando geramos código automaticamente (especialmente testes), alguns padrões frequentes podem disparar erros do ESLint ou falhas de tipagem em TypeScript. Abaixo há práticas recomendadas e exemplos que devem ser seguidos pelo LLM ao gerar código para este repositório.

- Evitar imports não usados
  - Problema: imports ou variáveis declaradas e não usadas geram erros `no-unused-vars`.
  - Recomendações:
    - Só importe o que será realmente usado no arquivo de teste/implementação.
    - Se o LLM gerar um bloco de imports, valide e remova os que não são usados.

- Evitar casts genéricos `as any`
  - Problema: `as any` contorna o sistema de tipos e gera avisos `no-explicit-any` e `no-unsafe-argument`.
  - Recomendações:
    - Importe e use os DTOs e tipos reais (ex: `CreateUserDto`, `UpdateUserDto`, `PaginationQueryDto`) nos testes para tipar as entradas corretamente.
    - Quando necessário mockar objetos, crie objetos com a forma exata esperada pelo método (mesmo que seja parcial), e use tipos como `Partial<T>` para marcar parcialmente preenchidos.
  - Exemplo:
    - Bom: `await controller.create(body as CreateUserDto)` (com `CreateUserDto` importado)
    - Melhor: tipar `const body: CreateUserDto = { ... }` e usar `await controller.create(body)`

- Evitar acessos inseguros em valores `any`
  - Problema: `no-unsafe-member-access` quando se faz `(result as any).passwordHash`.
  - Recomendações:
    - Use `as unknown as Partial<Entity>` ou declare `const resultUser = result as Partial<User>` para acesso seguro a propriedades em asserts.

- Preferir `??` sobre `||` para defaults
  - Problema: `||` trata valores falsy (como 0, false, '') como falsos, o que pode levar a bugs. `??` só trata null/undefined.
  - Recomendações:
    - Sempre use `??` para defaults, especialmente em guards, decorators e validações.
  - Exemplo:
    - Ruim: `return user?.sub || 0;` (se sub for 0, retorna 0 incorretamente)
    - Bom: `return user?.sub ?? 0;`

- Tratamento de request.user em decorators e guards
  - Problema: `request.user` é tipado como `any` no Express, causando `no-unsafe-assignment` e `no-unsafe-member-access`.
  - Recomendações:
    - Defina interfaces locais para User (ex: `interface User { sub: number; }`).
    - Use casts como `const user = (request as { user?: User }).user;`.
    - Para placeholders em DEV (ex: injeção de usuário fake), use `// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access` e documente como placeholder.
    - Evite `as any` direto; prefira casts específicos.

- Mocks e typings para repositórios/serviços
  - Problema: factories de mocks do TypeORM com tipagem incorreta causam erros de compilação (tipo 'never' ou propriedades faltantes) ou warnings `no-explicit-any`.
  - Recomendações:
    - Defina uma factory de mock reutilizável (ex.: `test/mocks/repository.mock.ts`) que exponha apenas os métodos usados nos testes e que seja tipada como `MockType<Repository<Entity>>`.
    - É aceitável (e comum) usar `jest.Mock<any, any[]>` para os mocks, envolver a definição com `/* eslint-disable @typescript-eslint/no-explicit-any */` localmente e documentar o motivo no arquivo.

- spyOn e métodos privados/protected
  - Problema: ao mockar métodos internos (ex: `hash`), a tipagem pode exigir conversões que disparam `no-explicit-any`.
  - Recomendações:
    - Sempre prefira tornar o teste agressivo em relação ao comportamento esperado (testar efeitos observáveis) em vez de mockar implantações internas. Quando for necessário, use um `// eslint-disable-next-line @typescript-eslint/no-explicit-any` apenas na linha do spy e documente no teste.

- Regras práticas para o LLM gerar testes e código:
  1. Sempre verificar as importações e remover as não usadas.
  2. Preferir tipos concretos (DTOs/Entities) ao invés de `any`.
  3. Ao criar mocks, usar `repositoryMockFactory()` centralizada em `test/mocks/`.
  4. Evitar alterar regras do ESLint globalmente; usar `// eslint-disable-next-line` apenas quando for realmente necessário e documentar por que.
  5. Rodar `npm run lint` e `npm test` após alterações geradas pelo LLM e somente avançar se ambos passarem.

### Regras obrigatórias e checklist final (instruções práticas para o LLM)

Ao gerar código (especialmente testes) para este repositório, o LLM deve seguir obrigatoriamente as regras abaixo e incluir um pequeno checklist no corpo do PR indicando que cada item foi verificado:

- Uso de imports e dotenv
  - Nunca usar `require('dotenv').config()` dentro de arquivos TypeScript. Use um import compatível com TS, por exemplo:
    - `import dotenv from 'dotenv'; dotenv.config();`
    - ou `import 'dotenv/config';` (quando apropriado)
  - Remova `require()` em arquivos `.ts` — isso dispara a regra `no-require` do ESLint.

- Defaults de variáveis de ambiente
  - Use `??` (nullish coalescing) para valores padrão de `process.env` — nunca `||`. Exemplo:
    - Ruim: `process.env.DB_HOST || 'localhost'`
    - Bom: `process.env.DB_HOST ?? 'localhost'`

- Tipagem e `any`
  - Evitar `any` em testes e produção. Sempre importar e usar DTOs/Tipos reais.
  - Quando for necessário um mock parcial, use `Partial<T>`:
    - `const body: Partial<CreateUserDto> = { email: 'x@x.com' }`
  - Se for inevitável um cast, prefira casts específicos: `as unknown as Partial<User>` ao invés de `as any`.

- Acessos inseguros e asserts
  - Evitar tocar propriedades de objetos sem tipagem. Use casts localizados:
    - `const resultUser = result as Partial<User>` antes de acessar `resultUser.passwordHash`.

- Mocks e factories
  - Centralize mocks em `test/mocks/` (p.ex. `repository.mock.ts`) e exporte `MockType<Repository<T>>` para reuso.

- Testes que usam DB (smoke/integration)
  - Testes que dependem de Postgres devem residir em `test/smoke/` ou `test/integration/`.
  - Garanta que o teste fecha o módulo de Nest: `await moduleRef.close();` para evitar open handles no Jest.
  - Não use `synchronize: true` em ambientes que refletem produção; prefira executar migrations previamente para validar schema.

- Uso de `eslint-disable` e exceções
  - `// eslint-disable-next-line` só pode ser usado com justificativa em linha acima e curta explicação do motivo.
  - Preferir corrigir o código em vez de desabilitar regras.

- Execução e validação local antes do PR
  - Antes de abrir PR, executar sequence:
    1. `npm run lint` — não deve haver erros (warnings são aceitáveis, porém preferível corrigi-los).
    2. `npm test` — todos os testes relevantes devem passar. Tests que dependem de infra devem ser executados separadamente depois de subir serviços (ex: docker-compose up -d db).
  - Incluir no corpo do PR um checklist com os comandos executados e seus resultados.

### Exemplo de checklist para a descrição do PR

```
- [x] Rodei `npm run lint` — sem erros
- [x] Rodei `npm test` — todos os testes unitários passaram
- [x] Para smoke tests dependentes de DB: subi `docker compose up -d db` e rodei `npm run test -- test/smoke` — passou
- [x] Removi imports não usados e evitei `any`
- [x] Não usei `require()` em arquivos TypeScript
```

Adicionar este checklist ao `LLM-UNIFIED-GUIDE.md` como uma verificação obrigatória instruirá os LLMs e contributors humanos a seguirem o fluxo e evitar regressões de lint/typings no CI.


Colocar estas regras no fluxo de geração de código reduzirá regressões por lint/test e facilitará a revisão humana das mudanças.

## Convenções de Nomenclatura

- **Diretórios de DTOs**: Sempre use `dto` (singular) em vez de `dtos` (plural) para diretórios contendo Data Transfer Objects. Exemplo: `src/users/dto/` ao invés de `src/users/dtos/`.

## Ambiente de Desenvolvimento

- **Banco de Dados**: PostgreSQL rodando em Docker Compose (container `aurora_db`).
- **Acesso ao Banco**: Use `docker-compose exec db psql -U postgres -d aurora_users` para conectar via psql dentro do container. Não assuma que ferramentas como `psql` estão instaladas localmente.
- **Migrations**: Execute via `npx typeorm-ts-node-commonjs -d src/database/data-source.ts <command>`. Garanta que o container do banco esteja rodando antes.
- **Testes**: Use `npm run test` para unit + e2e. Em DEV, o `JwtAuthGuard` injeta usuário fake.
- **Gerenciamento de Dependências**: Se ocorrer erro de permissões no cache npm (arquivos root-owned), execute `sudo chown -R $(whoami) ~/.npm` seguido de `npm cache clean --force` e `npm install` para regenerar package-lock.json.

## Leituras recomendadas

- Estratégia para índices e colunas de texto (citext): `docs/citext-index-strategy.md`

### HTTP example files and template

- Store HTTP examples under the `https/` folder and keep one template file named `https/http-template.http`.
- Template variables to use at the top of HTTP files:
  - `@host` — base host (e.g. `http://localhost:3001`).
  - `@apiBase` — base API including version, e.g. `{{host}}/v1`.
  - `@token` — bearer token for Authorization header (leave empty for local testing).
  - `@resourceId` / `@eventId` — default ids used in example requests.

- Example pattern at the top of each HTTP file:

```
@host = http://localhost:3001
@apiBase = {{host}}/v1
@token = 
@resourceId = 1
```

- Always use `{{apiBase}}` (not hard-coded `/v1`) so API versioning is explicit and easy to update.
- Include `Accept: application/json` and `Authorization: Bearer {{token}}` headers where appropriate.

Add the `https/http-template.http` to new feature branches when creating new HTTP examples and document the usage in the PR body so reviewers can validate the requests quickly.

---

## Migrations — post-mortem e checklist preventivo

Durante a implementação e validação desta feature (entidade RefreshToken + migrations) encontramos vários problemas recorrentes de migrations que causaram falhas no CI. Documentar estes pontos e a checklist abaixo vai ajudar a evitar regressões semelhantes no futuro.

Problemas observados
- Migrations que alteravam objetos (ALTER TABLE, CREATE INDEX, ADD CONSTRAINT) foram executadas antes das migrations que criavam as tabelas (ordem de timestamps inconsistente). Resultado: `relation "users" does not exist`.
- Blocos PL/pgSQL em `DO $$ ... END$$;` com sintaxe inválida (declaração de variáveis dentro do `BEGIN`, comentários SQL dentro de arquivos TypeScript) causaram parse errors no runtime do Postgres.
- Opções de `docker run`/`--health-cmd` sem aspas causavam parsing incorreto das flags (ex: `-U` sendo interpretado como flag do docker) e faziam o container não ser criado no CI.
- Logs insuficientes no CI (stderr suprimido) dificultavam identificar a query exata que falhou.

Correções aplicadas nesta branch
- Tornamos migrations idempotentes e seguras: todas as operations que mexem em `users` foram envoltas em `IF EXISTS` e `DO $$ ... END$$;` para só executar quando a tabela existir.
- Corrigimos blocos PL/pgSQL declarando variáveis com `DECLARE` antes do `BEGIN` e removemos comentários SQL que quebravam o parser TypeScript.
- Ajustamos o workflow do GitHub Actions: colocamos `--health-cmd "pg_isready -U postgres"` (com aspas), adicionamos espera por readiness e tornamos a etapa de migrations verbosa (DEBUG=typeorm, set -x) e capturamos `migration.log` como artifact.

Checklist preventivo para novas migrations
1. Ordem das migrations
  - Sempre crie migrations que criam tabelas antes de migrations que alteram essas mesmas tabelas. Use timestamps coerentes (ou gere a migration logo após a criação da tabela).
  - Se uma migration depende de outra existente, documente a dependência no cabeçalho do arquivo de migration.
2. Segurança / idempotência
  - Ao escrever uma migration que altera uma tabela, envolva a operação em um bloco `DO $$ ... END$$;` que verifica `IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '<table>') THEN ... END IF;`.
  - Use `IF EXISTS`/`IF NOT EXISTS` nas operações (DROP INDEX IF EXISTS, CREATE INDEX IF NOT EXISTS) onde possível.
3. PL/pgSQL correto
  - Declare variáveis na seção `DECLARE` antes de `BEGIN` dentro de `DO $$` blocks.
  - Teste o bloco PL/pgSQL localmente com psql antes de commitar quando possível.
4. Comentários e sintaxe
  - Não deixe comentários `--` soltos em arquivos TypeScript fora de strings; comentários SQL dentro de strings são OK, mas não confundam com comentários fora do literal.
5. CI readiness e healthchecks
  - No workflow, passe `--health-cmd "pg_isready -U $PGUSER"` entre aspas para evitar parsing de flags.
  - Aguarde readiness explícita (pg_isready ou psql check) antes de rodar migrations.
6. Logging e debug
  - Deixe a etapa de migrations com saída verbosa em PRs/CI: `DEBUG=typeorm:*` e capture logs para artifact (`migration.log`) em caso de falha.
7. Rollback seguro
  - Garanta que a função `down` de cada migration também seja segura (usar IF EXISTS) para evitar falhas ao reverter.
8. Teste local rápido
  - Sempre rode `npm run migration:run` contra um Postgres local (docker-compose) em um ambiente limpo antes de abrir PR.

Exemplo mínimo seguro (pattern) para uma migration que altera `users.email`:

```sql
DO $$
DECLARE
  _dummy int;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
   -- safe drop constraint/index if exists
   IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_key') THEN
    ALTER TABLE users DROP CONSTRAINT users_email_key;
   END IF;

   -- alter column
   EXECUTE 'ALTER TABLE users ALTER COLUMN email TYPE citext';

   -- recreate unique constraint safely
   IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_key') THEN
    ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
   END IF;
  END IF;
END$$;
```

Adicione essa seção ao `LLM-UNIFIED-GUIDE.md` para que contribuições futuras (manualmente ou via LLM) sigam este padrão.