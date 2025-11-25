FROM node:20-alpine AS builder
WORKDIR /app

# copy local common package so npm can resolve file:../common
COPY packages/common /usr/src/common

# build and install @aurora/common first so its deps are available
WORKDIR /usr/src/common
RUN npm install --no-audit --no-fund
RUN npm run build

# now install events-service with its deps (including @aurora/common file:../common)
WORKDIR /app
COPY packages/events-service/package.json ./
RUN npm install --no-audit --no-fund

COPY packages/events-service .

# Build TypeScript (optional; start:dev uses ts-node)
RUN npm run build || true

FROM node:20-alpine AS runner
WORKDIR /app

# copy common so symlink resolves at runtime
COPY --from=builder /usr/src/common /usr/src/common

# copy package.json so npm commands work
COPY packages/events-service/package.json ./
COPY packages/events-service/package-lock.json ./

# copy node_modules and built artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# copy source files for ts-node
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/tsconfig.nest.json ./tsconfig.nest.json

EXPOSE 3012

CMD ["npm", "run", "start:dev"]
