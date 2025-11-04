## O que foi feito
- Descreva resumidamente as mudanças.

## Checklist técnico (obrigatório)
- [ ] Rodei `npm run lint` — sem erros
- [ ] Rodei `npm test` — testes unitários pertinentes passaram
- [ ] Tipagem: tipar chamadas HTTP externas (usar generics do axios: `axios.get<T>()` / `axios.post<T>()`) ou validar com zod/ajv
- [ ] Evitar `any` e `as any`; quando necessário, usar `Partial<T>` ou `as unknown as T` com justificativa
- [ ] Não deixar `catch (e)` sem uso — prefira `catch {}` ou use `_e` com justificativa
- [ ] Removi imports não usados gerados automaticamente
- [ ] Não usei `eslint-disable` global sem justificativa; quando usado, incluí comentário curto justificando
- [ ] Alterações em infra (docker/docker-compose) estão documentadas e justificadas

## Como testar localmente
- Comandos executados:
  - `npm run lint`
  - `npm test`
  - (se houver smoke tests) `docker compose up -d db` e `npm run test -- test/smoke`

## Observações
- Referencie issues relacionadas (se houver)
- Adicione contexto adicional aqui
