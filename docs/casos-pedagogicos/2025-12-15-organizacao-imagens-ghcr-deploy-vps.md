# Caso pedagógico 01 — Organização de imagens Docker no GHCR e deploy em VPS

**Data:** 2025-12-15
**Contexto:** Correção da organização de imagens Docker no GitHub Container Registry e atualização do deploy na VPS

---

## Problema identificado

As imagens Docker dos microsserviços estavam sendo publicadas **na raiz da conta do usuário** no GitHub Container Registry (GHCR):
- ❌ `ghcr.io/evertonfoz/users-service:latest`
- ❌ `ghcr.io/evertonfoz/auth-service:latest`
- ❌ `ghcr.io/evertonfoz/events-service:latest`
- ❌ `ghcr.io/evertonfoz/registrations-service:latest`

Em vez de estarem **organizadas por repositório**:
- ✅ `ghcr.io/evertonfoz/dsc-2025-2-aurora-platform/users-service:latest`
- ✅ `ghcr.io/evertonfoz/dsc-2025-2-aurora-platform/auth-service:latest`
- ✅ `ghcr.io/evertonfoz/dsc-2025-2-aurora-platform/events-service:latest`
- ✅ `ghcr.io/evertonfoz/dsc-2025-2-aurora-platform/registrations-service:latest`

### Causa raiz
Nos workflows de build dos serviços (`.github/workflows/build-*-service.yml`), estava sendo usado:
```yaml
images: ghcr.io/${{ github.repository_owner }}/service-name
```

A variável `github.repository_owner` retorna apenas o nome do usuário/organização (`evertonfoz`), sem incluir o nome do repositório.

---

## Impacto potencial

### 1. **Desorganização e escalabilidade**
- Todas as imagens de todos os repositórios ficam misturadas na raiz da conta
- Com múltiplos projetos, torna-se impossível identificar qual imagem pertence a qual repositório
- Dificulta a gestão de permissões e visibilidade por projeto

### 2. **Conflitos de nomenclatura**
- Se dois repositórios diferentes tiverem serviços com o mesmo nome (ex: `users-service`), haverá conflito
- Não há isolamento entre projetos, podendo sobrescrever imagens acidentalmente

### 3. **Falhas no deploy**
- O `docker-compose.prod.yml` estava configurado para buscar imagens no caminho com repositório
- As imagens estavam sendo publicadas em caminho diferente
- Deploy falhava por não encontrar as imagens no caminho esperado

### 4. **Dificuldade de auditoria**
- Impossível rastrear facilmente quais imagens pertencem a qual projeto
- Logs e métricas de uso de imagens ficam misturados

---

## Solução fundamentada

### Conceito: Namespacing de imagens Docker
Docker e registries de containers seguem uma hierarquia de namespacing:
```
registry / namespace / image : tag
```

No GHCR (GitHub Container Registry):
- **Registry:** `ghcr.io`
- **Namespace:** deve incluir `owner/repository` para organização adequada
- **Image:** nome do serviço
- **Tag:** versão (latest, sha, etc)

### Referência GitHub Actions
A variável correta a usar é `github.repository`, que retorna o caminho completo `owner/repo`:
- `github.repository_owner` → `evertonfoz` (apenas o owner)
- `github.repository` → `evertonfoz/dsc-2025-2-aurora-platform` (owner + repo)

**Documentação oficial:** https://docs.github.com/en/actions/learn-github-actions/contexts#github-context

### Abordagem aplicada
1. Corrigir workflows para usar `github.repository` em vez de `github.repository_owner`
2. Atualizar `docker-compose.prod.yml` para usar variáveis de ambiente `GITHUB_ORG` e `GITHUB_REPO`
3. Configurar `.env.prod` com valores corretos das variáveis
4. Fazer deploy na VPS com as novas imagens
5. Expor porta do `auth-service` para acesso público

---

## Implementações (delta)

### 1. `.github/workflows/build-users-service.yml` (e demais serviços)
**Antes:**
```yaml
- uses: docker/metadata-action@v5
  id: meta
  with:
    images: ghcr.io/${{ github.repository_owner }}/users-service
```

**Depois:**
```yaml
- uses: docker/metadata-action@v5
  id: meta
  with:
    images: ghcr.io/${{ github.repository }}/users-service
```

**Efeito:** Imagens passam a ser publicadas em `ghcr.io/evertonfoz/dsc-2025-2-aurora-platform/users-service`, organizadas por repositório.

---

### 2. `docker-compose.prod.yml` (todos os serviços)
**Antes:**
```yaml
auth-service:
  image: ghcr.io/${GITHUB_ORG}/${GITHUB_REPO}/auth-service:${AUTH_IMAGE_TAG:-latest}
  restart: unless-stopped
  env_file:
    - .env.prod
  environment:
    NODE_ENV: production
    # ...
```

**Depois (com exposição de porta):**
```yaml
auth-service:
  image: ghcr.io/${GITHUB_ORG}/${GITHUB_REPO}/auth-service:${AUTH_IMAGE_TAG:-latest}
  restart: unless-stopped
  env_file:
    - .env.prod
  ports:
    - '3010:3010'  # ← ADICIONADO para acesso público
  environment:
    NODE_ENV: production
    # ...
```

**Efeito:**
- Imagens agora usam variáveis de ambiente para compor o caminho completo
- Porta 3010 do auth-service exposta para acesso externo
- Permite flexibilidade para diferentes ambientes/organizações

---

### 3. `.env.prod`
**Antes:** (variáveis não existiam ou estavam vazias)

**Depois:**
```env
# ---- GitHub Container Registry (GHCR) ----
GITHUB_ORG=evertonfoz
GITHUB_REPO=dsc-2025-2-aurora-platform
REPO_OWNER=evertonfoz
USERS_IMAGE_TAG=latest
AUTH_IMAGE_TAG=latest
EVENTS_IMAGE_TAG=latest
REGISTRATIONS_IMAGE_TAG=latest
```

**Efeito:** Docker Compose consegue resolver corretamente o caminho completo das imagens no GHCR.

---

### 4. `scripts/deploy-prod.sh`
**Antes:** (sem nota sobre deploy local)

**Depois:**
```bash
echo "[deploy-prod] usando imagens:"
echo "  users:           ghcr.io/${GITHUB_ORG}/${GITHUB_REPO}/users-service:${USERS_TAG}"
echo "  auth:            ghcr.io/${GITHUB_ORG}/${GITHUB_REPO}/auth-service:${AUTH_TAG}"
echo "  events:          ghcr.io/${GITHUB_ORG}/${GITHUB_REPO}/events-service:${EVENTS_TAG}"
echo "  registrations:   ghcr.io/${GITHUB_ORG}/${GITHUB_REPO}/registrations-service:${REGISTRATIONS_TAG}"
echo ""
echo "NOTA: Este script faz deploy LOCAL (docker compose)."
echo "Para deploy na VPS, use o workflow: .github/workflows/deploy-to-vps.yml"
```

**Efeito:** Deixa claro para desenvolvedores que o script é para deploy local, não para VPS.

---

### 5. `DEPLOYMENT_GUIDE.md`
**Antes:**
```yaml
images: ghcr.io/${{ github.repository_owner }}/auth-service
```

**Depois:**
```yaml
images: ghcr.io/${{ github.repository }}/auth-service
```

**Efeito:** Documentação atualizada reflete as melhores práticas.

---

## Efeito prático pós-correção

### 1. **Organização e governança**
✅ Imagens agora organizadas hierarquicamente por repositório
✅ Fácil identificar e gerenciar imagens de cada projeto
✅ Evita conflitos de nomenclatura entre diferentes repositórios
✅ Facilita configuração de permissões por projeto no GHCR

### 2. **Deploy funcional**
✅ Pull das imagens funciona corretamente na VPS
✅ Containers sobem com as novas imagens do GHCR
✅ Processo de CI/CD totalmente funcional
✅ Auth-service acessível publicamente em `http://64.181.173.121:3010`

### 3. **Auditoria e rastreabilidade**
✅ Possível rastrear quais imagens pertencem a cada repositório
✅ Logs e métricas de uso organizados por projeto
✅ Facilita troubleshooting e gestão de versões

### 4. **Alinhamento com boas práticas**
✅ Segue convenções do Docker e GitHub Container Registry
✅ Escalável para múltiplos projetos e repositórios
✅ Documentação alinhada com a implementação

---

## Processo completo executado

### Fase 1: Diagnóstico
1. Identificação do problema ao tentar executar `deploy-prod.sh`
2. Erro de autenticação ao fazer pull das imagens
3. Descoberta que as imagens estavam no caminho errado no GHCR

### Fase 2: Correção dos workflows
1. Análise dos workflows de build (4 serviços)
2. Correção de `github.repository_owner` → `github.repository`
3. Criação de branch `fix/ghcr-image-paths`
4. Commit com mensagem descritiva
5. Push e criação de PR #90

### Fase 3: CI/CD
1. Workflows CI executados (lint, build, testes)
2. Build das 4 imagens Docker com novos caminhos
3. Publicação no GHCR nos caminhos corretos
4. Merge do PR com squash

### Fase 4: Deploy na VPS
1. Checkout da branch main atualizada
2. Down dos containers antigos na VPS
3. Cópia de `.env.prod` e `docker-compose.prod.yml` atualizados para VPS
4. Pull das novas imagens na VPS
5. Up dos containers com novas imagens
6. Verificação de status e health checks

### Fase 5: Testes
1. Teste de acesso público ao auth-service
2. Verificação de logs dos serviços
3. Confirmação de funcionamento correto

---

## Próximas fases a implementar

### Fase 6: Exposição controlada de serviços (Curto prazo - 1-2 dias)
**Problema:** Apenas auth-service está exposto publicamente na porta 3010. Outros serviços podem precisar de acesso externo controlado.

**Tarefas:**
- [ ] Avaliar quais serviços precisam estar acessíveis externamente
- [ ] Implementar API Gateway (Nginx/Traefik) como ponto único de entrada
- [ ] Configurar rotas do gateway para cada serviço
- [ ] Remover exposição direta das portas dos serviços
- [ ] Todo tráfego externo passa pelo gateway com autenticação/rate-limiting

**Benefícios:**
- Segurança: ponto único de entrada com autenticação centralizada
- Observabilidade: logs centralizados de todas as requisições
- Controle: rate limiting, CORS, e políticas de segurança em um só lugar

---

### Fase 7: Monitoramento e observabilidade (Médio prazo - 1 semana)
**Problema:** Não há visibilidade sobre o comportamento dos serviços em produção.

**Tarefas:**
- [ ] Implementar health checks completos em todos os serviços
- [ ] Configurar Prometheus para coleta de métricas
- [ ] Implementar Grafana para dashboards
- [ ] Adicionar alertas para eventos críticos (serviço down, latência alta, etc)
- [ ] Implementar logging estruturado com correlação de request-id
- [ ] Adicionar tracing distribuído (OpenTelemetry/Jaeger)

**Benefícios:**
- Detecção proativa de problemas
- Troubleshooting mais rápido
- Insights sobre performance e uso
- SLA e métricas de disponibilidade

---

### Fase 8: Segurança e hardening (Médio prazo - 1-2 semanas)
**Problema:** Serviços em produção precisam de camadas adicionais de segurança.

**Tarefas:**
- [ ] Implementar HTTPS com certificados SSL/TLS (Let's Encrypt)
- [ ] Configurar firewall (UFW/iptables) restringindo apenas portas necessárias
- [ ] Implementar autenticação mútua (mTLS) entre serviços
- [ ] Rotação automática de secrets (JWT secrets, DB passwords)
- [ ] Implementar rate limiting por IP/usuário
- [ ] Adicionar WAF (Web Application Firewall)
- [ ] Configurar backup automático do banco de dados
- [ ] Implementar scanning de vulnerabilidades nas imagens Docker

**Benefícios:**
- Proteção contra ataques comuns (DDoS, SQL injection, XSS)
- Criptografia de dados em trânsito
- Recuperação de desastres
- Conformidade com boas práticas de segurança

---

### Fase 9: CI/CD avançado (Médio prazo - 2 semanas)
**Problema:** Deploy manual na VPS é propenso a erros e não escala.

**Tarefas:**
- [ ] Automatizar deploy na VPS via workflow GitHub Actions
- [ ] Implementar deploy blue-green ou canary
- [ ] Adicionar testes de integração no pipeline
- [ ] Implementar rollback automático em caso de falha
- [ ] Configurar ambientes de staging separado de produção
- [ ] Implementar aprovações manuais para deploy em produção
- [ ] Adicionar smoke tests pós-deploy

**Benefícios:**
- Deploys mais rápidos e confiáveis
- Redução de downtime
- Maior confiança nas mudanças
- Facilita rollback em caso de problemas

---

### Fase 10: Alta disponibilidade e escalabilidade (Longo prazo - 1 mês)
**Problema:** VPS única é ponto único de falha e não escala.

**Tarefas:**
- [ ] Migrar para orquestrador de containers (Kubernetes/Docker Swarm)
- [ ] Implementar múltiplas réplicas de cada serviço
- [ ] Configurar load balancer
- [ ] Separar banco de dados em instância gerenciada
- [ ] Implementar cache distribuído (Redis)
- [ ] Configurar auto-scaling baseado em métricas
- [ ] Implementar disaster recovery e backup geográfico

**Benefícios:**
- Zero downtime em deploys
- Resiliência a falhas
- Capacidade de escalar horizontalmente
- Melhor performance sob carga

---

### Fase 11: Segregação de dados (Longo prazo - 1 mês)
**Problema:** Todos os serviços compartilham o mesmo banco de dados PostgreSQL.

**Tarefas:**
- [ ] Avaliar separação de bancos de dados por serviço
- [ ] Implementar bancos isolados ou instâncias separadas
- [ ] Migrar schemas para bancos dedicados
- [ ] Implementar estratégia de backup por serviço
- [ ] Configurar permissões de acesso granulares
- [ ] Implementar saga pattern para transações distribuídas

**Benefícios:**
- Isolamento total entre serviços
- Falha em um serviço não afeta outros
- Escalabilidade independente por serviço
- Melhor segurança e governança de dados

---

## Lições aprendidas (para alunos)

### 1. **Importância de variáveis de contexto do GitHub Actions**
Usar a variável correta (`github.repository` vs `github.repository_owner`) faz toda diferença na organização de artefatos.

### 2. **Namespacing e organização hierárquica**
Registries de containers seguem hierarquias. Não respeitá-las causa desorganização e conflitos.

### 3. **Configuração por ambiente**
Uso de variáveis de ambiente (`.env.prod`) permite flexibilidade e portabilidade entre ambientes.

### 4. **Documentação alinhada com implementação**
Manter documentação (DEPLOYMENT_GUIDE.md) sincronizada com o código evita confusão.

### 5. **Processo incremental**
Resolver problemas em fases (correção → PR → merge → deploy → teste) é mais seguro que fazer tudo de uma vez.

### 6. **Exposição controlada de serviços**
Em produção, expor apenas o necessário e preferencialmente através de um gateway centralizado.

### 7. **Testes em múltiplas camadas**
- Local (dentro do container via localhost)
- Público (acesso externo via IP)
- Ambos são importantes para validar o funcionamento completo

---

## Referências

1. **GitHub Actions Context:** https://docs.github.com/en/actions/learn-github-actions/contexts#github-context
2. **GHCR Documentation:** https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry
3. **Docker Image Naming:** https://docs.docker.com/engine/reference/commandline/tag/#extended-description
4. **Docker Compose Environment Variables:** https://docs.docker.com/compose/environment-variables/
5. **Container Registry Best Practices:** https://cloud.google.com/architecture/best-practices-for-building-containers

---

## Comandos úteis para reproduzir

### Verificar imagens locais
```bash
docker images | grep ghcr.io
```

### Pull manual de uma imagem
```bash
docker pull ghcr.io/evertonfoz/dsc-2025-2-aurora-platform/auth-service:latest
```

### Verificar containers na VPS
```bash
ssh ubuntu@64.181.173.121 'docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"'
```

### Testar health check
```bash
curl -I http://64.181.173.121:3010/health
```

### Ver logs de um serviço na VPS
```bash
ssh ubuntu@64.181.173.121 'cd ~/dsc-2025-2-aurora-platform && docker compose --env-file .env.prod -f docker-compose.prod.yml logs --tail=50 auth-service'
```
