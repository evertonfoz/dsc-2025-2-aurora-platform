# Deploy quando o repositório é público (imagens GHCR públicas)

Se o repositório e as imagens publicadas no GHCR são públicas, o processo de deploy em um host novo fica mais simples porque não é necessário autenticar no registry para `docker pull`.

Este documento lista as diferenças, cuidados de segurança e o passo-a-passo reduzido para o caso de imagens públicas.

---

## Diferenças principais entre repositório privado e público

- Repositório/Package privado: exige autenticação em GHCR (`docker login ghcr.io`) com um token que tenha `read:packages`.
- Repositório/Package público: `docker pull ghcr.io/<user>/<image>:tag` funciona sem autenticação.
- Mesmo com imagens públicas, variáveis sensíveis e segredos (ex: `.env.prod`, JWT_SECRETS) devem permanecer privados; não comitar no repo.

---

## Segurança — pontos a cumprir em ambiente público

- Nunca exponha o `.env.prod` no repositório.
- Use um mecanismo de gerenciamento de segredos no servidor (ex: AWS Secrets Manager, HashiCorp Vault, GitHub Secrets + runner protegido) e carregue `.env.prod` de forma segura no host antes do deploy.
- Não exponha portas do banco (5432) na internet — use VPCs, firewalls ou SSH tunnel para acesso remoto.
- Configure um usuário de banco com privilégios limitados, não use `postgres` root em produção.

---

## Passo-a-passo rápido para deploy (imagens públicas)

1. Clone o repositório no host:
```bash
git clone https://github.com/evertonfoz/dsc-2025-2-aurora-platform.git
cd dsc-2025-2-aurora-platform
```
2. Preparar `.env.prod` com segredos no host (copie o template):
```bash
cp .env.prod.example .env.prod
# editar .env.prod no editor com os valores reais
```
3. Subir a stack com o compose (as imagens serão puxadas do GHCR publicamente):
```bash
docker-compose -f docker-compose.prod.yml up -d
```
4. Verificar status e logs:
```bash
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f
```

---

## Confirmando a publicação pública das imagens (verificação)

- Pull test (sem autenticação):
```bash
docker pull ghcr.io/evertonfoz/users-service:latest
```
- Se retornar `404` ou `unauthorized`, as imagens não estão públicas — é preciso revisar permissões (Settings > Packages > Change visibility) ou rodar login no GHCR.

---

## Boas práticas para deploy público

- Use tags imutáveis para deploys (evite apenas `latest` em produção):
  - Preferir `ghcr.io/your-org/users-service:sha-<commit-hash>` para rollback e rastreabilidade.
- Mantenha um processo de CI que crie e publique imagens com tags correspondentes ao commit/semver.
- Automatize atualizações no host: `docker-compose pull && docker-compose up -d` em um job seguro ou via orquestrador.

---

Se quiser, posso adicionar um script `scripts/deploy-prod.sh` que faz:
- baixar imagens
- validar health
- aplicar migrações (opcional)
- enviar notificações (opcional)

Status atual: `scripts/deploy-prod.sh` já existe e usa `docker-compose.prod.yml` com `.env.prod`. Para subir o compose de deploy (sem build), use `scripts/deploy-deploy.sh`.

Deseja que eu gere esse script também?
