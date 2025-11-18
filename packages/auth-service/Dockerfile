FROM node:18-alpine

WORKDIR /usr/src/app

COPY package.json ./
# Install production dependencies based on package.json (ignore stale package-lock)
RUN npm install --no-package-lock --only=production

COPY . .

RUN npm run build || true

# service listens on 3010 by default in this project
EXPOSE 3010
CMD ["node", "dist/src/main.js"]
