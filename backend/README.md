# PetHub — backend Java + Spring

Backend dos processos PRC-01 (pedido/agendamento), PRC-02 (estética/comanda) e PRC-03 (onboarding/catálogo) descritos nas duas entregas. Java 21+, Spring Boot 4.0.9, Spring Security, JPA/Hibernate, Flyway, H2 local e PostgreSQL para implantação.

Veja a [matriz de requisitos](docs/rastreabilidade.md), o [contrato e decisões](docs/contrato.md) e os [resultados de validação](docs/validacao.md).

## Executar

No PowerShell, a partir desta pasta:

```powershell
.\mvnw.cmd test
.\mvnw.cmd spring-boot:run
```

Linux/macOS: `./mvnw test` e `./mvnw spring-boot:run`. O Wrapper baixa o Maven no primeiro uso. O JDK deve estar no PATH. Java 25 também foi usado na validação deste projeto.

- API: http://localhost:8080/api/v1
- Swagger: http://localhost:8080/swagger-ui.html
- OpenAPI: http://localhost:8080/v3/api-docs
- Health: http://localhost:8080/actuator/health
- Dados locais persistem em `backend/data/`.

O perfil padrão `local` simula pagamentos de forma explícita (`localSimulation: true`). Nenhum dinheiro é movimentado. PIX local é aprovado automaticamente; cartão local é autorizado e capturado após o aceite. O perfil `prod` exige Mercado Pago e recusa configuração incompleta.

## Administrador e credenciamento

Antes da primeira execução, defina `PETHUB_ADMIN_EMAIL` e `PETHUB_ADMIN_PASSWORD` no ambiente. A senha precisa ter no mínimo 12 caracteres e no máximo 72 bytes UTF-8. O bootstrap cria a conta administrativa se ela não existir; não altera senhas existentes nem promove contas públicas. Remova essas variáveis depois da criação.

1. Cadastre o lojista em `POST /auth/register` com `role: "LOJISTA"`.
2. Com o token do lojista, crie a loja em `POST /merchant/store`.
3. O administrador entra por `/auth/login`, consulta `/admin/stores` e aprova com `POST /admin/stores/{id}/approve`.
4. O lojista cadastra produtos, serviços, baias e janelas de funcionamento pelos endpoints `/merchant/*`.
5. Tutores se cadastram com `role: "TUTOR"`, cadastram pets e fazem pedidos.

Não há credenciais administrativas fixas nem endpoint público para conceder esse perfil. Uma conta de lojista possui uma loja neste MVP.

## Autenticação e contrato

```http
POST /api/v1/auth/register
Content-Type: application/json

{"name":"Maria","email":"maria@example.com","password":"uma-senha-forte","role":"TUTOR"}
```

Use `Authorization: Bearer <accessToken>` nas operações privadas. A sessão expira em 12h, é armazenada como hash SHA-256 e pode ser revogada com `POST /auth/logout`. Senhas usam BCrypt. Listagens usam `page=0&size=20`, com limite de 100. A resposta dessas listagens é um array, sem total global.

Dinheiro: números decimais em BRL com até duas casas. IDs: UUIDs. Datas: ISO-8601 com offset, por exemplo `2026-11-01T15:00:00-03:00`. Portes: `PEQUENO`, `MEDIO`, `GRANDE`. Espécies: `CAO`, `GATO`. Horários são persistidos em UTC e a agenda usa o fuso IANA da loja.

Erros usam `application/problem+json`, com `status`, `detail` e `code`. `400`: formato/validação; `401`: sessão ou assinatura inválida; `403`: perfil/propriedade; `404`: recurso ausente; `409`: conflito de negócio/concorrência; `429`: limitação de login/cadastro.

Checkout:

```http
POST /api/v1/orders
Authorization: Bearer <token-do-tutor>
Idempotency-Key: compra-uuid-unico
Content-Type: application/json

{
  "storeId": "<id-da-loja>",
  "products": [{"productId":"<id-do-produto>","quantity":2}],
  "booking": {
    "serviceId":"<id-do-servico>","petId":"<id-do-pet>",
    "startsAt":"2026-11-01T15:00:00-03:00","taxiDog":false
  },
  "fulfillmentMode":"RETIRADA_HIBRIDA",
  "payment":{"method":"PIX","installments":1}
}
```

Substitua a data por uma janela cadastrada, com pelo menos 2h de antecedência. Produtos e serviço são opcionais individualmente; a comanda não pode ficar vazia. Apenas IDs e quantidades são aceitos para precificação; o servidor consulta preços, estoque, porte do pet, frete e duração. Produtos de lojas diferentes não podem compartilhar comanda. Repetir a chave e o mesmo JSON devolve o pedido original; reutilizá-la com outro conteúdo retorna `409`.

Para entrega de produtos sem estética, envie `fulfillmentMode: "ENTREGA_LOCAL"`, `deliveryAddress`, `latitude` e `longitude`; o servidor valida o raio. Pedidos com estética usam retirada e não cobram frete de produtos. `taxiDog` é um adicional de transporte com preço definido pela loja; não implica roteirização de veículos.

O pedido é persistido antes do contato com o gateway. Consulte `/orders/{id}/payments` para acompanhar o resultado, QR PIX e eventuais tentativas. O lojista só consegue aceitar depois de autorização de cartão ou pagamento de PIX. Estética, expedição e conclusão exigem valores efetivamente confirmados.

## Fluxo operacional

- Aceitar ou recusar em até 15 minutos. Recusa exige justificativa. No limite de 15 minutos o aceite cancela por timeout; o job também verifica a cada 5 segundos e recupera pedidos vencidos após reinício.
- Cartão: autorizar no checkout e capturar depois do aceite. PIX: aguardar confirmação; não existe pré-autorização bancária de PIX.
- Estética: check-in, triagem, banho, tosa opcional, finalização, pronto para retirada e conclusão. Check-in abre 15 minutos antes; execução não começa antes do horário reservado.
- Adicionais de produto/serviço exigem decisão do tutor. Aprovação reserva estoque/duração e cria uma cobrança separada. Só fica `APROVADO` após pagamento; repetir a decisão não duplica valor ou cobrança.
- No-show: após o horário +15 minutos, cancela a comanda, libera baia/estoque e devolve tudo menos 20% do preço original do serviço. Essa política para produtos do pedido misto resolve uma lacuna dos PDFs e está documentada no contrato.
- Histórico de dermatite severa ou suspeita de ectoparasitas bloqueia o banho comum até aprovação e pagamento do terapêutico. Um serviço base já terapêutico também satisfaz a regra. Recusa mantém o bloqueio; o lojista pode cancelar sanitariamente com devolução integral.
- Produtos da comanda híbrida permanecem reservados até a retirada conjunta. Avaliação de 1–5 só é aceita após conclusão, uma por pedido. Observações comportamentais ficam no histórico do pet.

## Mercado Pago

Configure as variáveis do `.env.example` no ambiente do servidor. Spring não lê `.env` automaticamente; Docker Compose lê esse arquivo para interpolação.

Para habilitar o adaptador real localmente: `PAYMENT_MODE=mercadopago` e uma `PETHUB_ENCRYPTION_KEY` de 32 bytes aleatórios em Base64. Configure também `MP_CLIENT_ID`, `MP_CLIENT_SECRET`, `MP_REDIRECT_URI`, `MP_WEBHOOK_URL` e `MP_WEBHOOK_SECRET`.

1. Lojista chama `POST /merchant/mercadopago/connect` e abre `authorizationUrl`.
2. A tela em `MP_REDIRECT_URI` recebe `code` e `state` e envia ambos ao endpoint autenticado `POST /merchant/mercadopago/callback`. Há PKCE, estado de uso único e validade de 10 minutos.
3. Tokens do vendedor ficam cifrados com AES-256-GCM; a renovação usa o refresh token. Faça backup seguro da chave: trocar a chave sem recriptografar invalida as credenciais armazenadas.
4. O frontend obtém a chave pública em `GET /stores/{id}/payment-config` e tokeniza cartão com o SDK do Mercado Pago. Envie `cardToken`, `paymentMethodId`, `issuerId` quando necessário, `installments` e `cpf` opcional em `payment`. Nunca envie PAN ou CVV ao backend.
5. Cadastre o webhook HTTPS `/api/v1/webhooks/mercadopago` para eventos de pagamento. A assinatura HMAC usa `data.id`, `x-request-id` e `ts`, com tolerância de 5 minutos. O corpo do evento não decide valores/status: o worker consulta o provedor autenticado. Repetições são seguras.

O adaptador usa o access token OAuth de cada vendedor e `application_fee` para a comissão. Criação, captura, cancelamento e reembolso usam chaves idempotentes. Falha de rede mantém intenção persistida com retentativa; não há fallback para pagamento fictício. Resultado desconhecido de criação por mais de 23h exige conciliação manual, evitando repetição cega além de uma janela conservadora de idempotência.

O administrador consulta erros em `GET /admin/payments`. Após localizar a transação no painel do provedor, pode enviar `POST /admin/payments/{id}/reconcile` com `{"providerId":"..."}`. O servidor consulta o Mercado Pago e verifica referência externa e valor antes de associar a transação e retomar captura/estorno. Uma associação incompatível é desfeita.

**Limites da integração:** homologação em conta de teste/produção não foi realizada sem as credenciais do usuário. O contrato comercial deve permitir marketplace, PIX, pré-autorização e split. Taxas do Mercado Pago reduzem o líquido bancário do vendedor: `merchantNetAmount` representa os 90% antes dessas taxas. A previsão interna D+7/D+1 não comanda a agenda bancária do provedor. A API registra `providerReleaseDate` informado por ele, sem afirmar que houve transferência. Antecipação usa taxa parametrizada (`ADVANCE_FEE_RATE`, padrão assumido de 2%) apenas na previsão contábil; a contratação e execução financeira dependem de homologação comercial. Não há cobrança implementada de planos patrocinados, que a Entrega 1 apresenta como extensão do modelo de negócio.

Fontes do contrato externo: [marketplace e split](https://www.mercadopago.com.br/developers/pt/docs/checkout-api-payments/how-tos/integrate-marketplace), [captura](https://www.mercadopago.com.br/developers/pt/docs/checkout-api-payments/payment-management/capture-authorized-payment), [PIX](https://www.mercadopago.com.br/developers/pt/docs/checkout-api-payments/integration-configuration/integrate-pix), [webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks), [OAuth](https://www.mercadopago.com.br/developers/pt/docs/checkout-api-payments/additional-content/security/oauth/creation).

## Notificações e conexão com o frontend existente

`GET /notifications?after=<ultimo-id>` retorna eventos duráveis. `GET /notifications/stream` transmite SSE com `id`, `event` e `data`; retome usando `Last-Event-ID` ou `after`. Envie Bearer via `fetch` streaming, pois `EventSource` nativo não permite configurar esse header. A sessão é revalidada durante a conexão; há heartbeat, limite de 5 conexões por usuário e reconexão após 5 minutos.

Cada novo pedido possui `slaDeadline`, que permite contagem regressiva e alerta visual/sonoro contínuo no frontend até aceite, recusa ou timeout. A API publica os dados; reproduzir áudio exige permissão/interação no navegador.

O frontend em `../frontend` continua sendo o protótipo com estado local; **não está conectado automaticamente ao backend**. Seus objetos não são o contrato do servidor. Use o OpenAPI para gerar um cliente, traduza portes/espécies para os enums e envie IDs no checkout. Remova a criação local de pedidos e o fallback silencioso quando conectar as telas. A API mantém a base `/api/v1` já prevista no projeto.

## Banco e implantação

Para PostgreSQL local via Docker:

```powershell
Copy-Item .env.example .env
# Edite DATABASE_PASSWORD e, se necessário, as credenciais iniciais do administrador.
docker compose up --build
```

O Compose fornecido é de desenvolvimento e usa pagamentos simulados. Para produção, configure `SPRING_PROFILES_ACTIVE=prod`, `DATABASE_URL=jdbc:postgresql://...`, `DATABASE_USERNAME`, `DATABASE_PASSWORD` e as variáveis Mercado Pago. Swagger fica desabilitado. Use HTTPS no proxy e `CORS_ORIGINS` restrito ao frontend.

Flyway aplica `src/main/resources/db/migration`. Hibernate apenas valida o esquema. Não é preciso apagar dados para reiniciar. A reserva usa lock pessimista da loja: evita overselling/sobreposição entre processos, com custo de serializar as escritas de cada loja. O worker também usa esse lock e timeouts HTTP de 5s/10s. PostgreSQL e Docker estão configurados, mas a validação executada neste ambiente usa H2 em modo PostgreSQL.

## Testes e artefatos de API

- `mvnw test`: regras, concorrência, autenticação, autorização e contrato OpenAPI; simulação externa é ignorada se não estiver habilitada.
- `../postman/specs/pethub.openapi.json`: exportação do `/v3/api-docs`; o código anotado é a origem deste contrato.
- `../postman/collections/pethub-smoke`: testes HTTP reutilizáveis contra o backend em execução.
- `../postman/mocks/mercadopago`: mock derivado da documentação pública; não é mock oficial do provedor. Busca por workspace proprietário foi dispensada porque não havia sessão Postman de equipe autenticada.

Depois de alterar endpoints, atualize a exportação com a API em execução: `python scripts/export-openapi.py`. Para outra porta, use `--url http://localhost:8081/v3/api-docs`. O exportador preserva UTF-8 e o contrato usa servidor relativo para funcionar em qualquer ambiente.

Na raiz do repositório, inicie a simulação:

```powershell
postman simulation run postman/simulations/mercadopago.sim.yaml --port 4501 --no-history
```

Em outro terminal:

```powershell
cd backend
$env:MP_SIMULATION_URL='http://127.0.0.1:4501/mercadopago'
.\mvnw.cmd '-Dtest=MercadoPagoSimulationTest' test
```

Essa suíte exercita o cliente HTTP real e o banco: autorização/captura, PIX pendente, webhook assinado, OAuth, resposta perdida após cobrança, idempotência e falha de estorno. Não prova liquidação bancária real. O servidor de simulação só escuta em loopback. Artefatos de testes e documentação permanecem locais, sem publicação remota.

Para a coleção HTTP, com a API local e o administrador configurados:

```powershell
postman collection run postman/collections/pethub-smoke --no-report-events --delay-request 300 --env-var "adminEmail=$env:PETHUB_ADMIN_EMAIL" --env-var "adminPassword=$env:PETHUB_ADMIN_PASSWORD"
```

Execute esse comando na raiz do repositório. A coleção cria contas/loja/pedido de teste com UUID no nome/e-mail e usa tokens apenas no escopo da execução. Não a aponte para produção; o fluxo espera pagamento simulado. Para usar outra porta, acrescente `--env-var "baseUrl=http://localhost:8081"`.
