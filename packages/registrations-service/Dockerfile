FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# copy local common package so npm can resolve file:../common
COPY packages/common /usr/src/common

# build and install @aurora/common first so its deps are available
WORKDIR /usr/src/common
RUN npm install --no-package-lock
RUN npm run build

# now install registrations-service with its deps (including @aurora/common file:../common)
WORKDIR /usr/src/app
COPY packages/registrations-service/package.json packages/registrations-service/package-lock.json* ./

RUN npm install --no-package-lock || true

# copy source and build
COPY packages/registrations-service .
RUN npm run build || true

FROM node:18-alpine AS runner
WORKDIR /usr/src/app

# copy package.json so npm commands in compose can run (compose may override command)
COPY packages/registrations-service/package.json ./package.json

# copy node_modules and built artifacts from builder
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

# ensure the local common package copied in the builder is available at runtime
COPY --from=builder /usr/src/common /usr/src/common

EXPOSE 3013
CMD ["node", "dist/app/src/main.js"]
