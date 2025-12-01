FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# copy local common package so npm can resolve file:../common
COPY packages/common /usr/src/common

# build and install @aurora/common first so its deps are available
WORKDIR /usr/src/common
RUN npm install --no-package-lock
RUN npm run build

# now install auth-service with its deps (including @aurora/common file:../common)
WORKDIR /usr/src/app
COPY packages/auth-service/package.json ./
COPY packages/auth-service/package-lock.json ./
RUN npm ci

# copy source and build
COPY packages/auth-service .
RUN npm run build || true

FROM node:18-alpine AS runner

WORKDIR /usr/src/app

# copy common so symlink in node_modules/@aurora/common resolves at runtime
COPY --from=builder /usr/src/common /usr/src/common

# copy node_modules and built artifacts from builder
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

# service listens on 3010 by default in this project
EXPOSE 3010
CMD ["node", "dist/app/src/main.js"]
