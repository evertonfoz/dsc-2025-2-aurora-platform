# Registrations Service

Microservice responsible for managing event registrations (user <-> event relationship).

Schema: `registrations` (PostgreSQL schema)

Port (dev): 3013

See `src/entities/registration.entity.ts` and `src/migrations/*` for table definition.

## Build and run (local)

Install dependencies and build the package (mono-repo pattern):

```bash
npm --prefix packages/registrations-service run build
```

Build Docker image (replace `your-github-user` with your GH username/org):

```bash
docker build -t ghcr.io/your-github-user/registrations-service:local -f packages/registrations-service/Dockerfile .
```

Tip: in `zsh` do NOT use the literal placeholder `ghcr.io/<owner>/...` because `<owner>` will be interpreted by the shell as input-redirection. Use a real owner value, put the name in quotes, or use an env var:

```bash
OWNER=evertonfoz
docker build -t ghcr.io/$OWNER/registrations-service:local -f packages/registrations-service/Dockerfile .
```

Push to GHCR (optional):

```bash
echo "$GH_PAT" | docker login ghcr.io -u your-github-user --password-stdin
docker tag ghcr.io/your-github-user/registrations-service:local ghcr.io/your-github-user/registrations-service:latest
docker push ghcr.io/your-github-user/registrations-service:latest
```

## Notes

- The service follows the mono-repo patterns used across the project (see `packages/*-service`).
- Migrations should be executed against the database before starting the service in production.
