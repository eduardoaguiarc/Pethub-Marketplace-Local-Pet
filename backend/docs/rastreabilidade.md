# Rastreabilidade dos documentos para a implementação

| Referência | Comportamento | Implementação | Evidência automatizada |
|---|---|---|---|
| PRC-01 | Comanda de produtos e/ou estética, validação conjunta e aceite | `OrderService`, `PaymentQueue`, `PaymentWorker` | `BusinessRulesTest`, `MercadoPagoSimulationTest` |
| PRC-02 | Chegada, triagem, execução, adicionais e retirada | máquina de estados em `OrderService` | cenários sanitários e conclusão |
| PRC-03 | Credenciamento, catálogo, preços, inventário e agenda | `CatalogService`, endpoints `/merchant` e `/admin` | fixtures e testes de catálogo/raio/reservas |
| RN-01 | Antecedência mínima de 2h | `checkout`, `availability` | 1h59m59s recusado; 2h aceito |
| RN-02 | Aceite em 15min, timeout e restituição | `accept`, `expire`, `Jobs`, cancelamento financeiro | limite exato, estoque restaurado, estorno idempotente |
| RN-03 | Reserva dos produtos até retirada do pet | reserva transacional, retirada conjunta, ordem de separação | comanda híbrida, bloqueio de conclusão prematura |
| RN-04 | Comissão 10%, previsão 90%, D+7 ou D+1 | `application_fee`, `Receivable`, preferência do lojista | split/centavos e previsão D+7; condições bancárias dependem do Mercado Pago |
| RN-05 | 15min de tolerância, liberação da baia e multa de 20% do serviço | `checkIn`, `noShow`, `expire` | limite exato e após limite; produtos fora da base da multa |
| RN-06 | Terapêutico obrigatório com consentimento | triagem, bloqueio, adicional confirmado ou serviço base terapêutico | rejeição bloqueia; aprovação só libera após pagamento |
| REQ-01 | Lojas ativas por proximidade e tempo estimado | Haversine, raio configurável e estimativa de deslocamento | loja suspensa/fora do raio não aparece; entrega validada |
| REQ-02 | Baias por porte sem sobreposição | lock da loja, janelas e intervalos completos | concorrência real entre duas transações; horários adjacentes |
| REQ-03 | Alertas e prazo no painel | eventos persistidos, SSE, `slaDeadline` | autorização HTTP; transporte/áudio final dependem da integração da tela |
| REQ-04 | Adicionais mediante decisão mobile | catálogo referenciado, decisão idempotente e cobrança separada | não duplica aprovação; não invade próximo horário |
| REQ-05 | PIX/cartão e split no gateway | adaptador Mercado Pago, OAuth, webhook, fila e reconciliação | cliente real contra simulação HTTP; conta real ainda não homologada |
| REQ-06 | Avaliação 1–5 e histórico comportamental | avaliação única após conclusão, notas por pet | histórico persistido, avaliação antes/depois de conclusão, isolamento |

## Decisões para lacunas dos PDFs

- No-show de comanda mista cancela tudo, restaura produtos e devolve o valor que exceder 20% do serviço original. A documentação não especifica retirada avulsa desses produtos.
- Uma loja por conta de lojista; um pet/agendamento por comanda; múltiplas baias físicas por porte são permitidas. Cada baia tem janelas concretas em vez de uma regra semanal abstrata.
- O tutor cancela enquanto o pedido ainda aguarda aceite. Cancelamento sanitário é específico da triagem. Não se inventou multa genérica de cancelamento.
- Serviço adicional aumenta o intervalo reservado e precisa caber na agenda. Cada adicional usa uma cobrança própria para preservar a imutabilidade de valores já autorizados.
- Checkout com estética usa retirada conjunta. Transporte taxi dog é adicional opcional da loja; roteirização GPS está fora do MVP conforme Entrega 1.
- Tempo estimado de deslocamento usa 25 km/h como aproximação configurada no código; não é uma integração de trânsito/geocodificação.
- D+7/D+1 e taxa de antecipação são previsões, separadas da liberação efetiva informada pelo Mercado Pago. Não existe transferência bancária fictícia executada por job.
- Planos patrocinados, aquisição comercial, suporte via WhatsApp e infraestrutura específica Firebase/Google Cloud são propostas de negócio, não requisitos funcionais delimitados na Entrega 2.

## Limites que precisam de trabalho externo

Credenciais e homologação Mercado Pago; condições de taxas/recebimento; configuração HTTPS/webhook real; execução com PostgreSQL; conexão das telas do protótipo e teste de áudio/permissões do navegador. Esses pontos não são declarados concluídos pelos testes locais.
