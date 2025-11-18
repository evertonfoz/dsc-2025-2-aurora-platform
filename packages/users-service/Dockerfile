FROM node:18-alpine AS builder
WORKDIR /usr/src/app

# copy package files and install all deps for build
COPY package.json package-lock.json* ./
RUN npm install --no-package-lock

# copy sources and build
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /usr/src/app
COPY package.json ./
# install only production deps
RUN npm install --no-package-lock --only=production

# copy built artifacts
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3011
CMD ["node", "dist/main.js"]
