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

### 8. Checklist para Pedidos Eficientes
- [ ] Pedido claro, objetivo e contextualizado
- [ ] Tarefas divididas em etapas
- [ ] Testes automatizados criados e executados
- [ ] Documentação e relatórios gerados
- [ ] Código revisado e validado
- [ ] Versionamento e PR realizados

---

## Dicas Finais
- **Interaja de forma iterativa**: Implemente, teste, corrija, documente, valide.
- **Peça explicações e exemplos sempre que necessário**.
- **Use o Copilot Chat como parceiro ativo, não apenas executor.**

Seguindo este guia, suas interações com LLMs serão mais produtivas, assertivas e alinhadas com as melhores práticas de desenvolvimento colaborativo.
