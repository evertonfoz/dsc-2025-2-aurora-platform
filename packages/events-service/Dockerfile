FROM node:20-alpine AS base
WORKDIR /app

# Install deps (including devDeps because we use ts-node in dev)
# When building with `build: ./packages/events-service` the build context is the package folder.
# Copy only package.json and run `npm install` to avoid lockfile/package.json mismatches during image builds
# (lockfile in the repo is out-of-sync for this package which makes `npm ci` fail).
COPY package.json ./
RUN npm install --no-audit --no-fund

COPY . ./

# Build TypeScript (optional; start:dev uses ts-node)
RUN npm run build || true

EXPOSE 3012

CMD ["npm", "run", "start:dev"]
