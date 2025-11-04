# Auth module — developer notes

Este README documenta as mudanças recentes adicionadas ao módulo `auth` e o fluxo necessário para testar o login localmente no ambiente de desenvolvimento com Docker Compose.

Sumário rápido
- Endpoints importantes:
  - POST /v1/auth/login — faz login (retorna accessToken + refreshToken)
  - POST /v1/auth/refresh — troca refresh token
  - POST /v1/auth/logout — revoga refresh
  - GET  /v1/auth/me — introspecção do access token (Bearer)

- Dependência: o AuthService valida credenciais consultando um serviço de Users via `UsersHttpClient`.

O problema que resolvemos
------------------------
Originalmente `AuthService` chamava um serviço de Users externo via HTTP (`UsersHttpClient`) em `${USERS_API_URL}/users/validate`. No mono-repo local esse endpoint não existia, então o fluxo de login falhava (401) mesmo com a rota `/v1/auth/login` ativa.

O que foi implementado
----------------------
1. Endpoint `POST /v1/users/validate` (em `src/users`) — recebe { email, password } e retorna a identidade do usuário quando as credenciais batem.
   - DTO: `src/users/dto/validate-user.dto.ts`
   - Controller: `src/users/users.controller.ts` (rota `POST /users/validate`)
   - Service: `UsersService.validateCredentials(email,password)` — compara bcrypt(password + HASH_PEPPER, passwordHash) e retorna `{ id, email, name, roles }` quando válido.

2. Ajuste em `UsersHttpClient` (em `src/auth/users-http.client.ts`) para aceitar respostas com o formato `{ data: ... }` (padrão usado internamente) ou payload cru.

3. Adicionei `USERS_API_URL` na configuração do `app` em `docker-compose.yml` apontando para `http://localhost:3001/v1` (dentro do container isso referencia a própria API), assim `AuthService` passa a chamar o endpoint local `/v1/users/validate`.

4. Testes manuais realizados com sucesso:
   - Criação de usuário: POST /v1/users
   - Login: POST /v1/auth/login → devolveu accessToken + refreshToken
   - Me: GET /v1/auth/me com Bearer token → devolveu identidade do usuário

Como reproduzir localmente (passo-a-passo)
---------------------------------------
1) (opcional) Certifique-se de estar na branch `feature/auth-controller`:

   git checkout feature/auth-controller

2) Construir/reconstruir containers (recomendado após alterações de código):

   docker compose build app
   docker compose up -d app

3) Verificar logs da aplicação:

   docker logs --tail 200 aurora_app

4) Criar um usuário de teste (exemplo):

   curl -i -X POST http://localhost:3001/v1/users \
     -H 'Content-Type: application/json' \
     -d '{"name":"Test User","email":"test.user@example.com","password":"StrongP@ssw0rd","role":"student"}'

   Observação: `CreateUserDto` valida `role` como `student | teacher | admin`.

5) Fazer login com o usuário criado:

   curl -i -X POST http://localhost:3001/v1/auth/login \
     -H 'Content-Type: application/json' \
     -d '{"email":"test.user@example.com","password":"StrongP@ssw0rd"}'

   Resposta esperada: JSON com `accessToken`, `refreshToken` e `user`.

6) Validar /me com o access token retornado:

   curl -i -X GET http://localhost:3001/v1/auth/me \
     -H 'Authorization: Bearer <accessToken>'

Variáveis de ambiente relevantes
--------------------------------
- `JWT_ACCESS_SECRET` — segredo para assinatura/verificação do access token (dev usa `dev_access_secret` se não definido).
- `REFRESH_EXPIRES_DAYS` — TTL do refresh token em dias (padrão 7).
- `HASH_PEPPER` — valor extra opcional concatenado à senha antes do hash (deve ser consistente entre criação e validação).
- `USERS_API_URL` — URL base que `UsersHttpClient` usa para chamar o serviço de usuários (no docker-compose foi fixado para `http://localhost:3001/v1` para apuntar para a API local durante dev).

Segurança e notas
-----------------
- Em produção, não exponha `USERS_API_URL` apontando para `localhost` — em arquiteturas distribuídas esse valor deve apontar ao serviço correto.
- Para aplicações web, considere armazenar `refreshToken` em cookie `httpOnly`, `SameSite` e `Secure`.
- Nunca comite `JWT_ACCESS_SECRET` ou `HASH_PEPPER` em repositório. Use um secret manager para ambientes reais.

Decisões de implementação rápidas
---------------------------------
- `UsersHttpClient` agora aceita respostas embrulhadas `{ data: ... }` para compatibilidade com controladores que retornam esse formato.
- Mantivemos `AuthService` usando `UsersHttpClient` (HTTP) em vez de injetar `UsersService` diretamente; isso preserva a separação de serviços caso, no futuro, `users` seja migrado para um microserviço.

Se quiser, eu posso:
- Adicionar um script de seed para criar automaticamente um usuário de teste ao subir os containers.
- Adicionar exemplos no arquivo `https/auth/auth.http` mostrando o fluxo completo (criar usuário → login → usar token em /me).

---
Arquivo(s) alterados/novos relevantes:
- src/auth/auth.controller.ts (controller implementado)
- src/auth/users-http.client.ts (ajuste de payload)
- src/users/dto/validate-user.dto.ts (novo)
- src/users/users.controller.ts (rota POST /users/validate adicionada)
- src/users/users.service.ts (validateCredentials adicionada)
- https/auth/auth.http (exemplos HTTP adicionados)
- docker-compose.yml (USERS_API_URL adicionado)

Qualquer dúvida me diz que eu explico ou ajusto o README.
