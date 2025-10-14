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

Colocar estas regras no fluxo de geração de código reduzirá regressões por lint/test e facilitará a revisão humana das mudanças.

## Convenções de Nomenclatura

- **Diretórios de DTOs**: Sempre use `dto` (singular) em vez de `dtos` (plural) para diretórios contendo Data Transfer Objects. Exemplo: `src/users/dto/` ao invés de `src/users/dtos/`.

## Leituras recomendadas

- Estratégia para índices e colunas de texto (citext): `docs/citext-index-strategy.md`