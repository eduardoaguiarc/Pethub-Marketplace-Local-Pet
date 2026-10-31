# Validação realizada — 31/10/2026

Backend executado com Java 25, Maven 3.9.11 e Spring Boot 4.0.9. Código compilado para Java 21. Banco usado nas verificações: H2 em modo PostgreSQL, com migração Flyway aplicada e esquema validado pelo Hibernate.

| Verificação | Resultado |
|---|---|
| `BusinessRulesTest` | 18 testes, zero falhas/erros |
| `HttpSecurityTest` | 3 testes, zero falhas/erros |
| `MercadoPagoSimulationTest` | 6 testes, zero falhas/erros, cliente HTTP real contra simulação Postman |
| Build Maven `verify` | Concluído; JAR executável gerado |
| Coleção `pethub-smoke` | 19 requisições HTTP, 31 asserções, zero falhas |
| Sintaxe da coleção Postman | 19 requisições; zero erros/avisos |
| OpenAPI 3.1 | 54 caminhos; validação sintática Postman sem problemas |
| SSE em aplicação iniciada | `NEW_ORDER` recebido com destinatário, pedido e prazo corretos; replay persistente e cursor verificados |

## O que foi exercitado

### Revalidação após organização em pacotes

Em 31/10/2026, o backend foi recompilado do zero com `clean verify`, após mover as classes para pacotes por responsabilidade e os testes para `br.com.pethub.integration`. Os **27 testes passaram, sem falhas, erros ou testes ignorados**, incluindo os seis cenários contra a simulação HTTP Postman do Mercado Pago. O JAR executável foi gerado novamente. Os logs da simulação confirmaram chamadas de pagamentos e OAuth, incluindo respostas 503 injetadas e recuperação idempotente. Essa execução preserva o escopo local/simulado da validação e não representa homologação com o provedor real.

O novo JAR também iniciou com o banco local persistente existente: o health check retornou `UP`, a migração permaneceu na versão 1 e o documento OpenAPI exportado foi comparado integralmente com o contrato versionado, sem diferenças nos 54 caminhos ou demais definições.

### Cenários cobertos

- Estoque e baia disputados por duas transações concorrentes; somente uma reserva aceita.
- Antecedência de 2h, sobreposição por duração, horários adjacentes e extensão de serviço adicional.
- SLA no instante limite de 15min, restauração de estoque e liberação de agenda sem duplicação.
- No-show após a tolerância, multa somente sobre o serviço e proteção de pets com check-in registrado.
- Triagem obrigatória, recusa do terapêutico bloqueando execução e aprovação condicionada ao pagamento.
- Comanda híbrida, preço calculado no servidor e arredondamento da comissão entre múltiplas cobranças.
- Propriedade de pets/pedidos, impedimento de cadastro ADMIN público, restrição de perfil, logout e revogação.
- Histórico comportamental e avaliação única após conclusão.
- OAuth com estado de uso único, criptografia de tokens e webhook assinado.
- PIX pendente, cartão autorizado e captura após aceite.
- Cobrança criada no provedor simulado com resposta perdida: a repetição usa a mesma chave e não cria outra cobrança.
- Estorno indisponível: o servidor preserva o estado pendente e confirma somente após a nova tentativa bem-sucedida.
- Cadastro de tutor/lojista, credenciamento, produto, checkout e repetição idempotente, aceite, retirada, conclusão, avaliação e eventos via HTTP.

O mock está em `postman/mocks/mercadopago`; seus pressupostos e limites estão em `postman/simulations/mercadopago.context.yaml`. Não houve chamada financeira real, publicação de mock, deploy ou envio de mensagens a terceiros.

## Ainda não verificado em ambiente real

PostgreSQL/Docker não foram executados nesta máquina. Credenciais e conta de teste do usuário no Mercado Pago não foram fornecidas; split, taxas, repasse D+7/D+1 e antecipação precisam de homologação comercial e técnica. O frontend existente permanece com dados simulados; áudio/contagem regressiva, tokenização de cartão e telas de OAuth precisam consumir os endpoints disponibilizados.

A validação de governança Postman exige login; apenas a validação sintática local foi executada. Isso não limita os testes HTTP locais já concluídos.
