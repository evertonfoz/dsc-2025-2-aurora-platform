# Users Service (canonical package)

This package is the canonical implementation of the Users service for the monorepo.

What changed
- The package exposes a standalone NestJS app with its own `data-source.ts` and `migrations/` so migrations can be run per-package.
- Routes and DTOs were aligned with the monolith (`src/users`) semantics and authorization model.
- Email column uses `citext` to provide case-insensitive unique constraint semantics.
- Password hashing aligns with the monolith and uses `bcryptjs` (salted). The package seeds two users on startup for labs/tests.

Quick start (development)

1. Ensure the DB and schemas exist (see root `postgres-init` or use `scripts/bootstrap-db.sh`).

2. Run migrations for the package from the repo root:

```bash
npx typeorm-ts-node-commonjs -d packages/users-service/src/data-source.ts migration:run
```

3. Build & run the service (or use docker-compose):

```bash
# from repo root
docker compose up -d --build users-service
docker compose logs -f users-service
```

Seeded users
- `admin.user@example.com` / `AdminP@ss1` (admin)
- `test.user@example.com` / `StrongP@ssw0rd` (regular)

Notes
- The package exposes protected routes and uses a JWT guard that validates tokens against `JWT_ACCESS_SECRET` (defaults to `dev_access_secret`).
- The endpoint `/users/:id/last-logout` remains public to allow `auth-service` to call it during logout flows.
# users-service (PoC)

Minimal provider PoC for users (Express + TypeScript). Mocked responses, no persistence.

Quick start

1. Install dependencies

```bash
cd packages/users-service
npm install
```

2. Run in dev (hot reload)

```bash
npm run dev
```

3. Try endpoints

Health:

```bash
curl http://localhost:3003/health
# { "status": "ok" }
```

Create user:

```bash
curl -X POST http://localhost:3003/users -H 'Content-Type: application/json' -d '{"email":"test@x.com","name":"Test"}'
# 201 { "id": "...", "email": "test@x.com", "name": "Test" }
```

Get user (mocked found id):

```bash
curl http://localhost:3003/users/mocked-user-id
# 200 { "id": "mocked-user-id", "email": "mock@x.com", "name": "Mock User" }
```

Get user (not found):

```bash
curl http://localhost:3003/users/some-other-id
# 404 { "message": "User not found" }
```

Notes

- Spec is in `openapi.yaml` (OpenAPI 3.1.0).
- App is exported from `src/app.ts` so tests can import it (supertest). Entrypoint is `src/server.ts`.
