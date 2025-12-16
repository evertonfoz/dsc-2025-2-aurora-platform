# Casos Pedagógicos - Aurora Platform

Esta pasta contém casos pedagógicos documentados do projeto Aurora Platform, utilizados como material didático para ensinar conceitos de arquitetura de microsserviços, DevOps, CI/CD e boas práticas de engenharia de software.

## Formato dos Casos Pedagógicos

Cada caso segue o template definido em [`template.md`](./template.md) e inclui:

- **Problema identificado:** Descrição clara do problema técnico encontrado
- **Impacto potencial:** Consequências práticas (segurança, disponibilidade, manutenção)
- **Solução fundamentada:** Abordagem recomendada com referências teóricas
- **Implementações (delta):** Mudanças específicas em arquivos (antes → depois)
- **Efeito prático:** Resultado observável após aplicação da solução

## Índice de Casos

### Caso 01 - Organização de imagens Docker no GHCR e deploy em VPS
**Arquivo:** [`2025-12-15-organizacao-imagens-ghcr-deploy-vps.md`](./2025-12-15-organizacao-imagens-ghcr-deploy-vps.md)
**Data:** 2025-12-15
**Tópicos:** Docker, GHCR, GitHub Actions, CI/CD, Deploy, Namespacing

**Resumo:** Correção da organização de imagens Docker no GitHub Container Registry, que estavam sendo publicadas na raiz da conta em vez de organizadas por repositório. Inclui processo completo de diagnóstico, correção de workflows, deploy na VPS e identificação de 11 fases futuras de evolução da plataforma.

**O que você aprenderá:**
- Variáveis de contexto do GitHub Actions (`github.repository` vs `github.repository_owner`)
- Namespacing e hierarquia de imagens Docker
- Processo de CI/CD completo (PR, testes, merge, deploy)
- Deploy em VPS com Docker Compose
- Exposição controlada de serviços
- Identificação de roadmap técnico

**Conceitos abordados:**
- GitHub Container Registry (GHCR)
- Docker image namespacing
- GitHub Actions workflows
- Environment variables em Docker Compose
- Health checks e troubleshooting
- Fases de evolução: API Gateway, Observabilidade, Segurança, Alta Disponibilidade

---

## Casos Relacionados (no relatório principal)

Além dos casos dedicados nesta pasta, há casos pedagógicos documentados no [`relatorio-revisao-arquitetura-2025-12-12.md`](../relatorio-revisao-arquitetura-2025-12-12.md):

### Caso 01 (Relatório) - Exposição de portas em produção
- **Problema:** Microsserviços expondo portas diretamente no host em produção
- **Solução:** Remover mapeamento de portas, usar apenas gateway/ingress público
- **Conceitos:** Defense-in-depth, 12-factor, segurança de rede

### Caso 02 (Relatório) - Falha de autenticação no Postgres e migrações
- **Problema:** Credenciais inconsistentes e volumes persistentes
- **Solução:** Padronização de variáveis e documentação de reset de volumes
- **Conceitos:** Docker volumes, PostgreSQL init scripts, TypeORM migrations

### Caso 03 (Relatório) - Cliente de usuários no auth-service
- **Problema:** Cliente HTTP sem timeout/retries e URL inconsistente
- **Solução:** Cliente axios com resiliência e configuração padronizada
- **Conceitos:** Resiliência, backoff exponencial, service tokens

### Caso 04 (Relatório) - Config/validação e segurança básica
- **Problema:** Uso direto de `process.env` sem validação
- **Solução:** ConfigModule com Joi, helmet, CORS, rate limiting
- **Conceitos:** Configuração como código, validação de schemas, segurança básica

### Caso 05 (Relatório) - Endpoints de health ausentes
- **Problema:** Auth e users sem endpoints /health
- **Solução:** Implementação de HealthController em todos os serviços
- **Conceitos:** Liveness probes, readiness probes, observabilidade

---

## Como usar este material

### Para estudantes:

1. **Leia o problema primeiro:** Tente entender por que aquilo é um problema antes de ver a solução
2. **Pesquise os conceitos:** Use as referências fornecidas para aprofundar
3. **Reproduza localmente:** Use os comandos úteis para experimentar
4. **Reflita sobre o impacto:** Pense em cenários onde esse problema poderia acontecer
5. **Aplique em seus projetos:** Identifique problemas similares em seus códigos

### Para instrutores:

1. **Use como base para aulas:** Cada caso pode ser uma aula ou workshop
2. **Crie exercícios:** Peça aos alunos para identificar problemas similares
3. **Demonstrações práticas:** Use os comandos documentados para live coding
4. **Discussões em grupo:** Debata alternativas de solução
5. **Projetos práticos:** Atribua a implementação de fases futuras identificadas

---

## Contribuindo com novos casos

Para adicionar um novo caso pedagógico:

1. Copie o [`template.md`](./template.md)
2. Nomeie o arquivo como `YYYY-MM-DD-titulo-descritivo.md`
3. Preencha todas as seções do template
4. Adicione o caso neste README.md
5. Referencie no relatório principal se aplicável
6. Crie um commit descritivo

**Dica:** Bons casos pedagógicos surgem de problemas reais encontrados durante o desenvolvimento. Documente-os enquanto resolve!

---

## Roadmap de casos futuros

Com base nas fases identificadas no Caso 01, futuros casos pedagógicos podem incluir:

- **Caso 02:** Implementação de API Gateway com Nginx/Traefik
- **Caso 03:** Observabilidade com Prometheus e Grafana
- **Caso 04:** Implementação de HTTPS com Let's Encrypt
- **Caso 05:** Deploy automatizado via GitHub Actions
- **Caso 06:** Blue-Green deployment
- **Caso 07:** Migração para Kubernetes
- **Caso 08:** Segregação de bancos de dados por serviço
- **Caso 09:** Implementação de circuit breaker
- **Caso 10:** Tracing distribuído com OpenTelemetry

---

## Recursos adicionais

### Documentação do projeto
- [Guia de Deploy](../DEPLOYMENT_GUIDE.md)
- [Relatório de Revisão de Arquitetura](../relatorio-revisao-arquitetura-2025-12-12.md)
- [Prevenção de Problemas de Configuração](../PREVENCAO-PROBLEMAS-CONFIGURACAO.md)

### Referências externas
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Documentation](https://docs.docker.com/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [12-Factor App](https://12factor.net/)
- [Microservices Patterns](https://microservices.io/patterns/index.html)

---

**Última atualização:** 2025-12-15
**Casos documentados:** 1 (+ 5 no relatório principal)
**Total de fases identificadas:** 11
