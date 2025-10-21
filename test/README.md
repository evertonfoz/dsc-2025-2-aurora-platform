# Test directory — architecture & conventions

This repository centralizes all tests under the `test/` folder. The goal of this document is to explain the layout, the conventions we followed while adding tests for `events`, and how to run them locally.

This file was added/updated in branch `test/events` while migrating and standardizing the `events` tests to follow the existing `users` pattern.

## Directory layout (top-level)

- `test/controllers/` — (not used centrally here) controller unit specs by domain live under `test/<domain>/controllers`.
- `test/services/` — (not used centrally here) service unit specs by domain live under `test/<domain>/services`.
- `test/<feature>/controllers/` — unit tests for controllers (one file per route/method recommended).
- `test/<feature>/services/` — unit tests for services (one file per method recommended).
- `test/factories/` — domain factories to create DTOs and Entities for tests.
  - e.g. `test/factories/event.factory.ts`, `test/factories/user.factory.ts`
- `test/mocks/` — shared mock factories (e.g. `repository.mock.ts` with `repositoryMockFactory`).
- `test/utils/` — small pure helpers used across specs (assert helpers, date normalizers, etc.).
- `test/smoke/` — smoke/integration tests that may depend on DB or external services. Use `test/smoke/<feature>/...`.

## Conventions we follow

- All tests live under `test/` at the repo root. Do not put `*.spec.ts` under `src/`.
- Organize by domain and layer:
  - `test/events/controllers` and `test/events/services` (same for `users` and other domains).
  - Prefer one spec file per method/route for clarity and faster targeted runs.
- Use typed DTOs and Entities in tests where possible. Prefer `Partial<T>` for partial objects.
- Centralize TypeORM repository mocks in `test/mocks/repository.mock.ts` and provide `MockType<Repository<T>>`.
- Create domain factories under `test/factories/` to generate valid test payloads (`makeCreateXxxDto`, `makeXxxEntity`).
- Add small assertion helpers in `test/utils/asserts.ts` to compare DTO ↔ Entity and to assert absence of sensitive fields.

## New/changed files in this branch (summary)

- `test/events/services/`
  - `events.service.create.spec.ts`
  - `events.service.findOne.spec.ts`
  - `events.service.update.spec.ts`
  - `events.service.publish.spec.ts`
  - (deleted the old combined `events.service.spec.ts`)
- `test/events/controllers/`
  - `events.controller.create.spec.ts`
  - `events.controller.update.spec.ts`
  - `events.controller.publish.spec.ts`
  - (kept/updated existing `find.spec.ts` and `findOne.spec.ts`)
- `test/utils/asserts.ts` — added helper asserts used by controller specs.
- `test/factories/event.factory.ts` — factory for create DTO and event entity.
- `test/smoke/events/events.smoke.spec.ts` — moved smoke test (was `test/app.e2e-spec.ts`) to `test/smoke/events/`.
- `LLM-UNIFIED-GUIDE.md` — sections added/updated: tests location, factories, helpers and PR checklist.

## How to run tests locally

- Run all unit tests (fast):

```bash
npx jest --colors
```

- Run only domain tests (example: events controllers + services):

```bash
npx jest test/events --colors --runInBand
```

- Run smoke/integration tests (these may require DB or other infra):

```bash
# start db/container if needed (docker-compose up -d db)
npx jest test/smoke --colors --runInBand
```

Notes:
- The repo Jest config ignores `/e2e/` paths and expects smoke/integration tests under `test/smoke/`.
- If a test requires Postgres, start the DB using `docker compose up -d db` before running smoke tests.

## Best practices for contributors & LLMs

- When generating tests via LLMs, follow the `test/` layout and use factories and `repositoryMockFactory` for mocked repos.
- If you find a large combined spec file, split it into per-method specs, add factories/helpers, and only delete the original file after the new specs pass.
- Always run `npm run lint` and `npm test` locally before opening a PR.

## Checklist for PRs touching tests

- [ ] Tests placed under `test/` following domain/layer layout.
- [ ] Reused `test/mocks/repository.mock.ts` for repository mocks.
- [ ] Factories used for DTOs/entities (`test/factories/`).
- [ ] Helpers used from `test/utils/` instead of duplicating asserts.
- [ ] Smoke tests placed under `test/smoke/` and documented how to run (docker-compose if needed).

---

If you want I can also add a short CONTRIBUTING_TESTS.md with a quick checklist and sample commands for CI.
