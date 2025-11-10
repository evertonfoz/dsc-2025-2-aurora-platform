FROM node:18-alpine

WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
RUN npm ci --only=production || true

COPY . .

RUN npm run build || true

EXPOSE 3000
CMD ["node", "dist/main.js"]
