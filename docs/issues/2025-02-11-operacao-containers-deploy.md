# Operação de containers de deploy

**Data:** 11/02/2025

## Descrição
Executar manutenção operacional nos containers: derrubar os serviços atuais, subir o container de deploy e verificar os logs, corrigindo eventuais falhas encontradas no processo.

## Contexto
Solicitação para garantir que o ambiente de deploy esteja saudável. É necessário controlar os containers via docker-compose e inspecionar os logs para identificar e mitigar problemas durante o ciclo de parada e subida dos serviços.

## Critérios de Aceite
- [ ] Containers existentes foram derrubados com sucesso.
- [ ] Container de deploy foi iniciado sem erros.
- [ ] Logs foram inspecionados e eventuais problemas corrigidos ou registrados.
- [ ] Status final documentado.

## Observações
- Usar os arquivos docker-compose fornecidos no repositório, priorizando o ambiente de deploy.
- Registrar qualquer erro encontrado e a ação tomada para correção.
