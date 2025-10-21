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
Crie subpastas `controllers/` e `services/` dentro de `test/<feature>/` (ex: `test/users/`, `test/events/`).
- Organização recomendada:
  - `test/<feature>/controllers/` — specs dos controllers (cada rota/método com arquivo próprio quando fizer sentido)
  - `test/<feature>/services/` — specs das unidades de negócio (cada ação importante em arquivo separado)

- Cada método principal deve ter seu próprio arquivo de teste quando isso melhorar clareza e manutenção. Exemplos de arquivos:
  - `test/users/services/users.service.create.spec.ts`
  - `test/users/controllers/users.controller.findOne.spec.ts`
  - `test/events/services/events.service.create.spec.ts`
  - `test/events/services/events.service.findOne.spec.ts`
  - `test/events/controllers/events.controller.find.spec.ts`
- Ajuste os imports relativos conforme a estrutura de pastas.
- Remova arquivos antigos/unificados após a migração para a estrutura modular.

IMPORTANT: LLMs devem sempre separar specs por método/ação automaticamente ao gerar testes.
 - Ao gerar testes, crie um arquivo por método/ação em `test/<feature>/services/` ou `test/<feature>/controllers/`.
 - Use `repositoryMockFactory` de `test/mocks/repository.mock.ts` para mocks de repositório.
 - Use factories em `test/factories/` para criar DTOs/Entities (ex: `makeRefreshTokenEntity`).

### 8.1 Convenção de localização de testes

- Todos os testes unitários e de integração deste repositório devem residir sob a pasta `test/` na raiz do projeto.
- Estrutura recomendada por domínio (ex: events, users):
  - `test/events/events.service.spec.ts`
  - `test/events/events.controller.spec.ts`
  - `test/users/services/users.service.create.spec.ts`
- Evite colocar arquivos `*.spec.ts` dentro de `src/` — isso facilita distinção entre código de produção e testes e alinha com a configuração Jest usada neste projeto.
- Ao mover testes para `test/`, ajuste os imports relativos para apontarem para `../../src/...` quando necessário.

Exemplo rápido de import em `test/events/events.service.spec.ts`:

```ts
import { EventsService } from '../../src/events/events.service';
import { Event } from '../../src/events/entities/event.entity';
```

Adicione este padrão à checklist do PR (ex: "[x] Testes colocados em `test/` conforme convenção").

### 8.2 Padrão detalhado para testes (para LLMs e contribuidores)

Este projeto segue um padrão consistente para testes que facilita manutenção, reuso de mocks e execução em CI. Registre e siga esse padrão sempre que gerar ou mover testes.

- Localização:
  - Todos os testes devem ficar em `test/` na raiz do repositório.
  - Separe por domínio/feature: `test/<feature>/controllers` e `test/<feature>/services`.

- Nome dos arquivos:
  - Use `*.spec.ts` e nomes descritivos: `events.service.spec.ts`, `users.controller.findOne.spec.ts`.
  - Para múltiplos casos do mesmo método, prefira sufixos: `users.service.create.spec.ts`, `users.service.remove.spec.ts`.

- Mocks e fábricas:
  - Centralize mocks reutilizáveis em `test/mocks/`.
  - Use a fábrica `repositoryMockFactory` para mocks de `Repository<T>` (já presente em `test/mocks/repository.mock.ts`). Exemplo:

```ts
import { repositoryMockFactory, MockType } from '../../mocks/repository.mock';
import { getRepositoryToken } from '@nestjs/typeorm';

providers: [
  YourService,
  { provide: getRepositoryToken(YourEntity), useFactory: repositoryMockFactory },
],
```

- Imports de testes:
  - Ao importar código de produção desde `test/`, use caminhos relativos para `src`, por exemplo:

```ts
import { EventsService } from '../../src/events/events.service';
import { Event } from '../../src/events/entities/event.entity';
```

- Testes unitários vs testes de integração:
  - Tests unitários: use mocks (test/mocks) e coloque em `test/<feature>/services` ou `test/<feature>/controllers`.
  - Tests de integração / smoke que usam DB real: coloque em `test/smoke/` ou `test/integration/` e documente dependências (ex: docker-compose up -d db).

- Convenções de estilo nos testes:
  - Use `describe` e `it` com strings descritivas em português claro (ou inglês quando o PR for internacional).
  - Limpe mocks entre testes com `jest.clearAllMocks()` quando necessário.
  - Feche módulos Nest em testes de integração: `await moduleRef.close();`.

- Checklist para PRs que alteram/ adicionam testes (adicionar ao template do PR):

```
- [ ] Testes adicionados em `test/` com estrutura `controllers/` e `services/`.
- [ ] Usado `test/mocks/repository.mock.ts` quando mockando repositórios TypeORM.
- [ ] `npm run lint` rodado sem erros (ou justificativa no PR se precisar de exceção).
- [ ] `npm test` — todos os testes unitários passaram localmente.
- [ ] Se houver testes que usam DB, documentar como rodar (comandos docker-compose) no PR.
```

Seguindo esse padrão, os LLMs e contribuidores manterão consistência com o restante do repositório e evitarão testes espalhados dentro de `src/`.

### 8.3 Padrão de Factories de Teste

Para reduzir duplicação e aumentar a clareza dos specs, adote factories de teste em `test/factories/` para cada domínio principal (ex: `event.factory.ts`, `user.factory.ts`).

- O que colocar na factory:
  - helpers para criar DTOs (ex: `makeCreateEventDto(overrides?)`) que retornam tipos dos DTOs usados pelos controllers/services.
  - helpers para criar entidades (`makeEventEntity(overrides?)`) que retornam objetos compatíveis com as entidades do TypeORM (úteis para mocks do repositório).

- Contrato das factories:
  - Inputs: `Partial<T>` (overrides) para customizar valores em cada teste.
  - Outputs: objetos tipados (`CreateEventDto`, `Partial<Event>`, etc.) prontos para uso em testes.

- Nome e localização:
  - `test/factories/<feature>.factory.ts` (ex: `test/factories/event.factory.ts`).
  - Expor funções `makeCreateXxxDto`, `makeXxxEntity`.

- Boas práticas:
  - Forneça valores padrão válidos (p.ex. datas em ISO quando DTO espera string, enums válidos).
  - Permita overrides para casos específicos.
  - Use `Partial<T>` para inputs nos factories para garantir tipagem.
  - Evite lógica complexa na factory; mantenha-a previsível.

- Exemplo mínimo (para events):

```ts
// test/factories/event.factory.ts
import { CreateEventDto } from '../../src/events/dto/create-event.dto';
import { Event } from '../../src/events/entities/event.entity';

export function makeCreateEventDto(overrides?: Partial<CreateEventDto>): CreateEventDto { /* ... */ }
export function makeEventEntity(overrides?: Partial<Event>): Partial<Event> { /* ... */ }
```

- Quando usar factories nos specs:
  - Em services: criar entidades retornadas pelo repositório e DTOs recebidos pelos métodos.
  - Em controllers: usar DTOs para requisições e entidades/DTOs para valores retornados pelo service.

- Checklist ao adicionar factories a um PR:

```
- [ ] Factory criada em `test/factories/` com função `makeCreateXxxDto` e `makeXxxEntity`.
- [ ] Specs atualizados para consumir a factory (evitar objetos inline repetidos).
- [ ] Testes locais rodaram (`npm test`) e passaram.
- [ ] Não há dependências pesadas dentro da factory (ex: acesso a DB ou chamadas de rede).
```

Adicionar esta seção ao `LLM-UNIFIED-GUIDE.md` ajudará LLMs e humanos a seguir um padrão consistente ao gerar testes automaticamente.

### 8.4 Padrão de Helpers / Utils de Teste

Além de factories e mocks, use helpers (utils) para reduzir duplicação nos specs e para centralizar assert checks que reaparecem entre controllers e services.

- Localização e naming:
  - Crie `test/utils/` para helpers genéricos (ex: `asserts.ts`, `date.ts`, `enums.ts`).
  - Exporte funções nomeadas de forma clara: `expectDtoMappedToEntity`, `expectNoSensitiveFields`, `normalizeDateForAssert`.

- O que deve conter um helper de asserts (`test/utils/asserts.ts`):
  - Funções que comparam DTO ↔ Entity por chaves selecionadas, tratando diferenças comuns (Date <-> ISO string) de forma previsível.
  - Funções que verificam ausência de campos sensíveis (`passwordHash`, `secret`) em objetos retornados por controllers.
  - Helpers leves — evite lógica complexa, IO, ou acesso a DB dentro de `test/utils`.

- Como o LLM deve usar helpers ao gerar ou refatorar tests:
  1. Ao gerar um controller spec, importe e use `expectDtoMappedToEntity` para comparar os campos essenciais entre resposta e factory/entity.
 2. Ao gerar/ajustar um spec que verifica remoção/retorno de usuário, use `expectNoSensitiveFields` em vez de asserts manuais repetidos.
 3. Sempre adicione novos helpers em `test/utils/` quando detectar padrões repetidos em >2 specs.

- Regras para arquivos combinados / duplicados:
  - Prefira specs modularizados (um método/arquivo por spec) em `test/<feature>/controllers` e `test/<feature>/services`.
  - Se encontrar arquivos combinados antigos (ex: `events.service.spec.ts` contendo muitos describes), o LLM deve:
    1. Dividir o spec em arquivos por método (ex: `events.service.create.spec.ts`, `events.service.findOne.spec.ts`, ...).
    2. Atualizar imports relativos e garantir que factories/mocks apontem para `../../factories` e `../../mocks` conforme necessário.
    3. Remover o arquivo combinado antigo apenas depois de confirmar que os novos arquivos passam localmente.

- Exemplo (uso mínimo em controller spec):

```ts
import { expectDtoMappedToEntity, expectNoSensitiveFields } from '../../utils/asserts';
// ...
const res = await controller.findOne('42');
expectDtoMappedToEntity({ id: 42, name: 'Grace' }, res, ['id','name']);
expectNoSensitiveFields(res);
```

- Checklist para PRs envolvendo helpers/refactor de specs:

```
- [ ] Novos helpers adicionados só em `test/utils/` e documentados (arquivo com JSDoc curto)
- [ ] Specs refatorados para importar helpers ao invés de duplicar asserts
- [ ] Arquivos combinados antigos (se existiam) foram removidos apenas após novos specs passarem localmente
- [ ] Rodei `npm run lint` e `npm test` — todos os specs relevantes passaram localmente
- [ ] Não adicionei IO/DB/network nos helpers; são funções puras
```

Registrar estas regras no guia garante que LLMs apliquem o mesmo padrão reproduzido manualmente neste repositório e evita regressões por duplicação de asserts.

### 8.5 Regra de documentação obrigatória para `events`

Toda alteração relacionada à feature `events` (código, testes, factories, mocks, helpers, e2e/smoke, docs) deve ser descrita no arquivo `test/README.md` antes de abrir o PR. O conteúdo mínimo exigido é:

- Resumo das alterações (arquivos adicionados/alterados/removidos).
- Instruções para rodar os testes locaismente e dependências necessárias (ex: `docker compose up -d db`).
- Lista de novas factories/helpers e sua localização em `test/factories` e `test/utils`.
- Quais testes foram adicionados e como rodá-los seletivamente (comando `npx jest <path>`).

Motivo: ter um ponto único de verdade facilita revisão humana, acelera automações de LLMs e evita perda de contexto ao gerar ou refatorar testes relacionados a `events`.

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

### Evitar editores interativos (IMPORTANTE)

Ao executar comandos Git ou scripts automatizados, NUNCA abra editores interativos (por exemplo: vi, vim, nano) que aguardem entrada do usuário. Em ambientes automatizados e em interações com LLMs, use sempre modos não-interativos e flags que evitem prompts. Exemplos recomendados:

- Para merges automáticos: `git merge --no-ff --no-edit origin/main`
- Para commits programáticos: `git commit -m "mensagem"` (evite `git commit` sem `-m`)
- Para rebase sem editor: `GIT_SEQUENCE_EDITOR=":wq" git rebase origin/main` ou usar `git rebase --autosquash --autostash --no-edit` quando aplicável
- Definir variável temporária para evitar editores: `GIT_MERGE_AUTOEDIT=no` ou `GIT_EDITOR=true` (dependendo do caso)

Adicione essa verificação ao checklist do PR quando um script/LLM executar comandos Git que possam disparar editores. Se um comando necessitar de intervenção manual, registre o motivo no PR e solicite revisão humana em vez de abrir o editor automaticamente.

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