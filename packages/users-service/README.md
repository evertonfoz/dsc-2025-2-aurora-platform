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
