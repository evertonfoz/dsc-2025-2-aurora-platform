#!/bin/bash

echo "🚀 Aguardando banco de dados..."
sleep 10

echo "📊 Executando migrações..."
npm run migration:run

echo "🎯 Iniciando aplicação..."
npm run start:prod