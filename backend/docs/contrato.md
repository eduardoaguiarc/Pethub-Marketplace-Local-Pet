# Contrato e decisões antes da implementação

Fonte: Entregas 1 e 2 fornecidas pelo usuário. A Entrega 2 delimita o MVP por PRC-01–03, RN-01–06 e REQ-01–06; prevalece a comissão normativa de 10% sobre a faixa exploratória de 8–12% da Entrega 1.

API REST `/api/v1`, JSON, autenticação Bearer com sessões revogáveis, perfis TUTOR/LOJISTA/ADMIN. Cadastro público não concede ADMIN. IDs opacos; dinheiro decimal BRL; instantes UTC e agenda no fuso da loja. Erros Problem Details. Listagens paginadas e acesso restrito ao proprietário.

| Área | Operações |
|---|---|
| Autenticação | POST /auth/register, /auth/login, /auth/logout; GET /auth/me |
| Pets | GET/POST /pets; PUT/DELETE /pets/{id}; GET /pets/{id}/history |
| Descoberta | GET /stores?latitude=&longitude=&radiusKm=&sort=distance; GET /stores/{id}, /products, /services, /availability |
| Onboarding | POST/GET/PUT /merchant/store; POST /admin/stores/{id}/approve |
| Catálogo | POST/PUT /merchant/products, /merchant/services, /merchant/bays, /merchant/windows; DELETE de janelas futuras livres |
| Comanda | POST /orders (Idempotency-Key); GET /orders, /orders/{id}; POST /orders/{id}/cancel |
| Operação | GET /merchant/orders; POST /merchant/orders/{id}/accept, /reject, /check-in, /triage, /stage, /ready, /dispatch, /complete, /behavior |
| Adicionais | POST /merchant/orders/{id}/addons; POST /orders/{id}/addons/{addonId}/decision |
| Histórico | POST /orders/{id}/review; GET /stores/{id}/reviews |
| Pagamento | GET /orders/{id}/payments; POST /webhooks/mercadopago; OAuth do lojista; conciliação de recebíveis |
| Eventos | GET /notifications e /notifications/stream, cursor persistente e prazo SLA no evento |

Checkout aceita IDs e quantidades, nunca preços confiados ao cliente. Uma comanda pertence a uma loja. Pedido misto força retirada conjunta sem frete. Reservas usam bloqueio transacional da loja e verificação de intervalos completos, por baia e porte, incluindo duração. A antecedência mínima é 2h; SLA é de 15min desde a criação. Estoque reservado é restaurado exatamente uma vez no cancelamento.

Estados: PENDENTE_CONFIRMACAO → ACEITO_EM_PREPARO → EM_ATENDIMENTO_ESTETICA (se serviço) → PRONTO_RETIRADA ou SAIU_PARA_ENTREGA → CONCLUIDO. Terminais alternativos: RECUSADO_OU_TIMEOUT, CANCELADO, NO_SHOW. Check-in até o instante agendado +15min; após esse instante o job libera baia e aplica 20% exclusivamente ao serviço. Decisão adotada para a lacuna do documento: no-show cancela a comanda inteira, devolve produtos ao estoque e solicita devolução de tudo menos a multa.

Triagem sanitária é obrigatória antes de iniciar estética. Dermatite severa histórica ou suspeita de parasitas exige adicional terapêutico aprovado e pago. Recusa bloqueia execução; cancelamento sanitário devolve integralmente. Adicionais são imutáveis após decisão e usam cobrança própria para não tentar aumentar uma pré-autorização existente.

Pagamentos são processados por tarefas persistentes e idempotentes, separadas da transação de checkout. Erro transitório mantém tarefa para nova tentativa; nenhuma falha de rede é interpretada como estorno concluído. PIX exige confirmação assíncrona; cartão usa token do SDK do provedor e captura após aceite. Nunca enviar número de cartão/CVV ao backend.

RN-04: razão contábil de 10%/90%, previsão D+7 e opção D+1 com taxa configurável. A data real de disponibilidade e tarifas do Mercado Pago vêm do provedor; o backend não declara transferência bancária realizada a partir de um cronômetro local. Habilitação do marketplace e condições comerciais precisam de homologação.

REQ-03: backend fornece eventos SSE persistentes, alerta pendente e deadline. Som contínuo, vibração e contagem regressiva são responsabilidades do frontend. Geolocalização usa coordenadas fornecidas pelo cliente; tempo é estimativa por distância, sem trânsito em tempo real. Destaque patrocinado e antecipação comercial da Entrega 1 são extensões, sem cobrança fictícia de assinatura.
