# Usar imagem oficial do Node.js
FROM node:18-alpine

# Instalar bash para o script de inicialização
RUN apk add --no-cache bash

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar todas as dependências (incluindo dev para build e migrações)
RUN npm ci

# Copiar código fonte
COPY . .

# Construir a aplicação
RUN npm run build

# Dar permissão de execução ao script
RUN chmod +x scripts/start.sh

# Expor porta da aplicação
EXPOSE 3001

# Comando para iniciar a aplicação com migrações
CMD ["./scripts/start.sh"]