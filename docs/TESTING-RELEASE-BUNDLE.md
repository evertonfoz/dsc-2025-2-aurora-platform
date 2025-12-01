# How to test the release bundle (deploy-only) — quick guide

This document shows two approaches to validate the release bundle created by CI:

- Manual steps (download the Release from GitHub, extract, configure .env, run docker compose)
- Automated script (new helper: `scripts/test-release-bundle.sh`) to perform the download, extract and smoke tests

Prerequisites
------------

- Docker (Engine) + Docker Compose v2 available as `docker compose`
- Either `gh` (GitHub CLI) installed or `curl` available
- Optional: `gh` / a PAT with `read:packages` if images are private in GHCR

Manual quick steps
------------------

1. Create a new folder for the test and go in there:

   mkdir ~/aurora-deploy-test
   cd ~/aurora-deploy-test

2. Download the release asset. Two options:
   - Using `gh` (recommended):

     gh release download <TAG-or-latest> --repo evertonfoz/dsc-2025-2-aurora-platform --pattern "deploy-bundle-*.tar.gz"

   - Using `curl` (if you prefer):

     curl -L -o deploy-bundle.tar.gz "https://github.com/evertonfoz/dsc-2025-2-aurora-platform/releases/download/<TAG>/deploy-bundle-<SHORTSHA>.tar.gz"

3. Extract the release bundle:

   tar -xzf deploy-bundle-*.tar.gz

4. Prepare environment: copy the example env and edit values

   cp .env.prod.example .env.prod
   # Edit .env.prod and set passwords, secrets and any GHCR credentials if needed

5. (Optional) Authenticate Docker to GHCR if images are private

   # using GitHub CLI
   gh auth refresh -h ghcr.io --scopes read:packages
   # or PAT
   echo "<PERSONAL_ACCESS_TOKEN>" | docker login ghcr.io -u <USER> --password-stdin

6. Start the compose bundle

   docker compose -f docker-compose.deploy.yml --env-file .env.prod up -d

7. Check containers, logs and health endpoints

   docker compose -f docker-compose.deploy.yml --env-file .env.prod ps
   docker compose -f docker-compose.deploy.yml --env-file .env.prod logs -f users-service
   curl -i http://localhost:3011/health

8. Tear down and cleanup

   docker compose -f docker-compose.deploy.yml --env-file .env.prod down -v

Automated script (recommended)
--------------------------------

The repo includes `scripts/test-release-bundle.sh` to automate the download, extraction, env preparation and bringing the compose bundle up. It also performs basic health checks against the microservices.

Basic usage (from anywhere):

  # create a clean directory and run the script
  mkdir -p /tmp/aurora-test && cd /tmp/aurora-test
  /path/to/repo/scripts/test-release-bundle.sh --repo evertonfoz/dsc-2025-2-aurora-platform --tag latest --dir .

Arguments:
- `--repo owner/repo` (optional) — default: evertonfoz/dsc-2025-2-aurora-platform
- `--tag TAG|latest` (optional) — release tag, default: latest
- `--dir PATH` (optional) — where the bundle is extracted and executed
- `--no-up` — download + extract only; do not run docker compose
- `--login-ghcr TOKEN` — provide a PAT to authenticate the Docker client to ghcr.io before pulling images

Troubleshooting & notes
-------------------------

- If the GHCR images are private you'll need to login (see step above)
- The script waits up to 120 seconds for the health endpoints; if your services take longer adjust the script or run `docker compose logs` to debug
- If you want to test local images instead of GHCR, tag your locally-built images with the same names used by `docker-compose.deploy.yml` so Compose will use them (e.g. `ghcr.io/evertonfoz/dsc-2025-2-aurora-platform/users-service:sha-<SHORT>`)

Want me to:
- create a small wrapper to run full e2e smoke tests after the deployment?
- add an example Makefile task and CI job to run this script in a runner for nightly tests?

If you want, I can also add safe defaults to `docker-compose.deploy.yml` to make the testing flow even smoother (for example: local-friendly fallbacks and clearer comments). 
