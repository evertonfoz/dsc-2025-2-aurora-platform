FROM node:20-alpine AS builder
WORKDIR /usr/src/app

# copy the local common package into the image so npm can resolve file:../common
COPY packages/common /usr/src/common

# build and install @aurora/common first so its deps are available
WORKDIR /usr/src/common
RUN npm install --no-package-lock
RUN npm run build

# now install events-service with its deps (including @aurora/common file:../common)
WORKDIR /usr/src/app
COPY packages/events-service/package.json packages/events-service/package-lock.json* ./

RUN npm install --no-package-lock

# copy source files for events-service and build
COPY packages/events-service .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /usr/src/app

# copy package.json so npm commands in compose can run (compose overrides command)
COPY packages/events-service/package.json ./package.json

# copy node_modules and built artifacts from builder to runner
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
## ensure the local common package copied in the builder is available at runtime
COPY --from=builder /usr/src/common /usr/src/common

EXPOSE 3012
CMD ["node", "dist/main.js"]
