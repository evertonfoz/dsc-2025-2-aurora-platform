# Contribuindo com o Serviço Users

## 1. Issues
- Use os **templates** (bug/feature) e preencha critérios de aceite.
- Rotule com `feat`, `bug`, `docs`, `test`, `chore` ou `infra`.

## 2. Branching
- A partir de `main`: `tipo/escopo/descricao-curta` (ex.: `feat/users/create`).

## 3. Commits (Conventional Commits)
- `tipo(escopo)?: mensagem`. Exemplos:
  - `feat(users): criar endpoint POST /users`
  - `fix(users): tratar conflito de e-mail duplicado`

## 4. Pull Requests
- Relacione a issue (`Closes #<id>`).
- Preencha o PR template e marque a checklist.
- Garanta **lint**, **build** e **testes** passando.

## 5. Testes e qualidade
- Rode unit/e2e localmente.
- Não reduza cobertura sem justificativa.

## 6. DoD (Definition of Done)
- Tests/Lint/Build ok, docs atualizadas e revisão aprovada.