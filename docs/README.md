# Projeto: Users Service - Convenções e Guia Rápido

Este documento reúne convenções mínimas e um fluxograma rápido para contribuir neste repositório.

1) Antes de começar
- Leia `LLM-UNIFIED-GUIDE.md` já presente no repositório.
- Leia `AGENTS.md` para instruções rápidas do time humano.

2) Fluxo obrigatório
- Crie uma issue em `docs/issues/` antes de implementar mudanças não triviais.
- Crie uma branch com prefixo `issue/YYYY-MM-DD/` ou `issue/<YYYY-MM-DD>/nome-da-issue`.
- Faça commits pequenos e atômicos; escreva mensagens claras (ex: `feat(users): add dto validation`).
- Rode `npm run lint` e `npm run build` antes de abrir PR.

3) Convenções de código
- Pastas:
  - `src/.../dto` — DTOs (nome no singular `dto`).
  - `src/.../enums` — enums.
  - `src/common/validators`, `src/common/interceptors`, `src/common/guards`, `src/common/decorators` — infra compartilhada.
- Tests: `test/.../controllers` e `test/.../services`.
- Não use `as any` em produção; em testes prefira `Partial<T>` ou explicitar o motivo com comentário e `// eslint-disable-next-line @typescript-eslint/no-explicit-any` apenas localmente.

4) MCP Context7 — Uso automático antes de PRs (configuração do agente)

Recomendação: antes de abrir qualquer PR que altere ou utilize APIs de bibliotecas críticas, o agente deve consultar o MCP Context7 para recuperar documentação e trechos oficiais.

Comportamento a ser aplicado automaticamente em cada PR:
1. Resolver o identificador Context7 da(s) biblioteca(s) alvo (ex: `/nestjs/nest`, `/nestjs/typeorm`, `/typestack/class-transformer`, `/typestack/class-validator`, `/reactivex/rxjs`, `/jestjs/jest`, `/eslint/eslint`).
2. Recuperar até 2000 tokens de documentação relevante (API, exemplos e notas de breaking changes) focando nas APIs utilizadas pelo PR.
3. Incluir no corpo do PR um pequeno resumo com os IDs consultados e 1-3 trechos ou recomendações que justificam as mudanças.
4. Se a documentação indicar mudanças maiores (breaking changes ou migração), abrir uma issue em `docs/issues/` e não avançar sem revisão humana.

5) PRs e descrições
- Cada PR deve conter:
  - Referência à issue (se aplicável).
  - Um resumo curto das mudanças.
  - Lista de arquivos principais alterados.
  - Se aplicável, bloco "MCP Context7 references" com IDs consultados e links.

6) Exemplo mínimo de PR body
```
Summary: Add RolesGuard and Roles decorator

Files changed: src/common/guards/roles.guard.ts, src/common/decorators/roles.decorator.ts

MCP Context7 references:
- /nestjs/nest (interceptors, global providers)
- /typestack/class-validator (custom decorators)

Notes: RolesGuard reads request.user.roles and checks metadata set by @Roles.
```

7) Onde pedir ajuda
- Abra uma issue em `docs/issues/` e marque `@team` no PR description.

---

Se quiser, eu crio também os templates de issue/PR e atualizo o `README.md` no root para apontar para este arquivo.
