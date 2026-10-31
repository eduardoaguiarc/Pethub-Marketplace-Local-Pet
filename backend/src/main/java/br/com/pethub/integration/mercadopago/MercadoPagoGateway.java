package br.com.pethub.integration.mercadopago;

import br.com.pethub.config.MpConfig;
import br.com.pethub.payment.PaymentGateway;

import static br.com.pethub.domain.Domain.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;

@Component
@ConditionalOnProperty(name = "pethub.payment-mode", havingValue = "mercadopago")
public class MercadoPagoGateway implements PaymentGateway {
    final RestClient client;
    final MercadoPagoAccounts accounts;
    final MpConfig config;

    public MercadoPagoGateway(MercadoPagoAccounts accounts, MpConfig config) {
        this.accounts = accounts;
        this.config = config;
        client = MercadoPagoAccounts.client(config.baseUrl());
    }

    JsonNode request(Payment p, HttpMethod method, String path, Object body, String operation) {
        var request = client.method(method).uri(path).header("Authorization", "Bearer " + accounts.token(p.storeId));
        if (operation != null)
            request.header("X-Idempotency-Key", p.id + "-" + operation);
        if (body != null)
            request.body(body);
        return request.retrieve().body(JsonNode.class);
    }

    public Snapshot create(Payment p, Map<String, Object> body) {
        if (!config.webhookUrl().isBlank())
            body.put("notification_url", config.webhookUrl());
        return snapshot(request(p, HttpMethod.POST, "/v1/payments", body, "create"));
    }

    public Snapshot fetch(Payment p) {
        return snapshot(request(p, HttpMethod.GET, "/v1/payments/" + safeId(p.providerId), null, null));
    }

    public Snapshot capture(Payment p) {
        return snapshot(
                request(p, HttpMethod.PUT, "/v1/payments/" + safeId(p.providerId), Map.of("capture", true), "capture"));
    }

    public Snapshot cancel(Payment p) {
        return snapshot(request(p, HttpMethod.PUT, "/v1/payments/" + safeId(p.providerId),
                Map.of("status", "cancelled"), "cancel"));
    }

    public void refund(Payment p, BigDecimal amount, String key) {
        JsonNode n = request(p, HttpMethod.POST, "/v1/payments/" + safeId(p.providerId) + "/refunds",
                Map.of("amount", amount), key);
        if (n == null || !n.path("status").asString().equals("approved"))
            throw new IllegalStateException("Estorno ainda não confirmado pelo provedor");
    }

    static String safeId(String id) {
        if (id == null || !id.matches("[A-Za-z0-9-]{1,100}"))
            throw new IllegalStateException("ID financeiro inválido");
        return id;
    }

    static Snapshot snapshot(JsonNode n) {
        if (n == null || !n.hasNonNull("id") || !n.hasNonNull("status") || !n.hasNonNull("transaction_amount"))
            throw new IllegalStateException("Resposta financeira incompleta");
        PaymentStatus status = switch (n.path("status").asString()) {
            case "approved" ->
                n.path("transaction_amount_refunded").asDouble() > 0 ? PaymentStatus.PARCIALMENTE_ESTORNADO
                        : PaymentStatus.PAGO;
            case "authorized" -> PaymentStatus.AUTORIZADO;
            case "rejected" -> PaymentStatus.RECUSADO;
            case "cancelled" -> PaymentStatus.CANCELADO;
            case "refunded" -> PaymentStatus.ESTORNADO;
            case "charged_back", "in_mediation" -> PaymentStatus.CONTESTADO;
            case "pending", "in_process" -> PaymentStatus.PENDENTE;
            default -> throw new IllegalStateException("Status financeiro desconhecido");
        };
        JsonNode transaction = n.path("point_of_interaction").path("transaction_data");
        String release = n.path("money_release_date").asString("");
        return new Snapshot(n.path("id").asString(), status, n.path("transaction_amount").decimalValue(),
                n.path("transaction_amount_refunded").isNumber() ? n.path("transaction_amount_refunded").decimalValue()
                        : BigDecimal.ZERO,
                transaction.path("qr_code").asString(null), transaction.path("qr_code_base64").asString(null),
                release.isBlank() ? null : OffsetDateTime.parse(release).toInstant(),
                n.path("external_reference").asString());
    }
}
