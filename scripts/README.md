# Scripts

This folder contains helper scripts used by the project's Docker image and by developers to run database migrations.

Files

- `start.sh`
  - Shell script used by the Docker image to ensure migrations are applied before starting the application.
  - Behaviour: waits for the DB to be ready, runs `npm run migration:run`, then starts the app with `npm run start:prod`.
  - Location: `./scripts/start.sh` (the `Dockerfile` executes this script).

- `run-migrations.ts`
  - TypeScript script that uses the project's `AppDataSource` to run migrations programmatically.
  - Useful for local development or CI where you prefer to run migrations using `ts-node` or via `npm` scripts.
  - Location: `./scripts/run-migrations.ts`.

How to run migrations

Locally (Node):

1. Ensure your `.env` or environment variables are set (see project root `.env`).
2. Run migrations with:

```bash
npm run migration:run
```

Using the TypeScript helper (if you want to run via ts-node):

```bash
npx ts-node -r tsconfig-paths/register scripts/run-migrations.ts
```

Using Docker Compose (the `app` service runs `scripts/start.sh`, which runs migrations automatically on start):

```bash
docker-compose up --build
```

Notes

- `scripts/start.sh` is intentionally simple and defensive: it attempts to run migrations multiple times while waiting for the DB to accept connections. If you need finer control (for example, different retry counts, logging, or conditional behaviour), edit the script.
- We intentionally do not drop the `citext` extension in migration down() to avoid accidental data loss if other objects depend on it.
