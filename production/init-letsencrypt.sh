#!/bin/bash

# Script para a configuração inicial do Let's Encrypt e obtenção dos certificados SSL.
# DEVE ser executado na VM de produção.

# --- Configuração ---
# O domínio e o email devem ser passados como variáveis de ambiente.
# Exemplo: DOMAIN="meudominio.com" EMAIL="admin@meudominio.com" ./init-letsencrypt.sh

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "🚨 ERRO: As variáveis de ambiente DOMAIN e EMAIL são obrigatórias."
  echo "Uso: DOMAIN=\"seu.dominio.com\" EMAIL=\"seu-email@exemplo.com\" $0"
  exit 1
fi

echo "🚀 Iniciando configuração do SSL para o domínio: $DOMAIN"

# --- Validações ---
if ! [ -x "$(command -v docker)" ]; then
  echo "🚨 ERRO: Docker não está instalado ou não está no PATH." >&2
  exit 1
fi

if ! [ -x "$(command -v docker-compose)" ]; then
  echo "🚨 ERRO: docker-compose não está instalado ou não está no PATH." >&2
  exit 1
fi

# --- Preparação dos diretórios e arquivos de configuração ---
echo "🛠️  Preparando diretórios e configurações..."

# Cria os diretórios que o Certbot e o Nginx esperam
mkdir -p ./certbot/www ./certbot/conf

# Se o arquivo de opções do SSL não existir, baixa um recomendado.
if [ ! -f "./certbot/conf/options-ssl-nginx.conf" ]; then
  echo "    -> Baixando configuração SSL recomendada (options-ssl-nginx.conf)..."
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > ./certbot/conf/options-ssl-nginx.conf
fi

# Se o dhparam não existir, gera um novo.
# ATENÇÃO: Isso pode levar alguns minutos.
if [ ! -f "./certbot/conf/ssl-dhparams.pem" ]; {
  echo "    -> Gerando arquivo dhparams (2048 bits). Isso pode demorar alguns minutos..."
  openssl dhparam -out ./certbot/conf/ssl-dhparams.pem 2048
}

# --- Obtenção do Certificado SSL ---

echo "🔄 Criando um arquivo de configuração Nginx temporário para o desafio do Certbot..."
# Substitui o placeholder do domínio no arquivo de configuração do Nginx
# e cria uma versão temporária para o desafio.
sed "s/\\\$DOMAIN/$DOMAIN/g" ./nginx/default.conf > ./nginx/default.temp.conf

echo "🔌 Subindo o serviço Nginx em modo 'down' para criar o container..."
# Usamos `up --no-start` para que o container do Nginx seja criado mas não iniciado.
docker-compose -f docker-compose.prod.yml up --no-start nginx

echo "🏃 Executando o Certbot para obter o certificado..."

# Monta o volume do Nginx no Certbot para que ele possa criar o arquivo do desafio
docker-compose -f docker-compose.prod.yml run --rm --entrypoint \
  "certbot certonly --webroot -w /var/www/certbot \
    --email $EMAIL \
    -d $DOMAIN \
    --rsa-key-size 4096 \
    --agree-tos \
    --force-renewal \
    --non-interactive" certbot

echo "🛑 Parando o Nginx temporário..."
docker-compose -f docker-compose.prod.yml down

# Limpa o arquivo temporário
rm ./nginx/default.temp.conf

echo "✅ Certificado SSL obtido com sucesso para $DOMAIN!"
echo ""
echo "🎉 Processo concluído!"
echo "Agora você pode iniciar a aplicação completa com o comando:"
echo "  docker-compose -f docker-compose.prod.yml up -d"
echo ""
