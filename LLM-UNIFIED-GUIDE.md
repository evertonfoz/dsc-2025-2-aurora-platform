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

Seguindo este guia, suas interações com LLMs serão mais produtivas, assertivas e alinhadas com as melhores práticas de desenvolvimento colaborativo.
