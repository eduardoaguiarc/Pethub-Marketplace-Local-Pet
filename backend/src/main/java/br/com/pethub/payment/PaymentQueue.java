package br.com.pethub.payment;

import br.com.pethub.dto.Requests;
import br.com.pethub.exception.ApiException;
import br.com.pethub.repository.Db;
import br.com.pethub.security.Crypto;
import br.com.pethub.service.OrderService;

import static br.com.pethub.domain.Domain.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

@Service
public class PaymentQueue {
    final Db db;
    final Clock clock;
    final Crypto crypto;
    final ObjectMapper json;
    private final boolean local;

    public PaymentQueue(Db db, Clock clock, Crypto crypto, ObjectMapper json,
            @Value("${pethub.payment-mode}") String mode) {
        if (!Set.of("local", "mercadopago").contains(mode))
            throw new IllegalStateException("PAYMENT_MODE inválido");
        this.db = db;
        this.clock = clock;
        this.crypto = crypto;
        this.json = json;
        this.local = mode.equals("local");
    }

    public boolean isLocalSimulation() {
        return local;
    }

    public Payment create(Purchase o, AddOn addon, Requests.PaymentInput input, String email) {
        if (!local && db.count("select count(a) from PaymentAccount a where a.storeId=?1", o.storeId) == 0)
            throw ApiException.conflict("Lojista precisa conectar a conta Mercado Pago");
        if (input.method() == PaymentMethod.CARTAO && !local
                && (input.cardToken() == null || input.cardToken().isBlank() || input.paymentMethodId() == null
                        || input.paymentMethodId().equals("pix")))
            throw ApiException.invalid("Token e bandeira do cartão são obrigatórios");
        Payment p = new Payment();
        p.storeId = o.storeId;
        p.orderId = o.id;
        p.addonId = addon == null ? null : addon.id;
        p.method = input.method();
        p.amount = addon == null ? o.total : addon.price;
        p.platformFee = OrderService.money(p.amount.multiply(new BigDecimal("0.10")));
        p.retryAt = clock.instant();
        p.createdAt = clock.instant();
        p.localSimulation = local;
        if (addon != null) {
            var previous = db.list(Payment.class, "from Payment p where p.orderId=?1", o.id);
            BigDecimal gross = previous.stream().map(x -> x.amount).reduce(p.amount, BigDecimal::add);
            BigDecimal chargedFee = previous.stream().map(x -> x.platformFee).reduce(BigDecimal.ZERO, BigDecimal::add);
            p.platformFee = OrderService.money(gross.multiply(new BigDecimal("0.10"))).subtract(chargedFee);
        }
        p.captureRequested = addon != null;
        Map<String, Object> payer = new LinkedHashMap<>();
        payer.put("email", email);
        if (input.cpf() != null)
            payer.put("identification", Map.of("type", "CPF", "number", input.cpf()));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("transaction_amount", p.amount);
        body.put("application_fee", p.platformFee);
        body.put("description", "PetHub " + o.id);
        body.put("external_reference", p.id);
        body.put("payer", payer);
        if (input.method() == PaymentMethod.PIX) {
            body.put("payment_method_id", "pix");
            // Mercado Pago requires at least 30 minutes for PIX expiration; late payments
            // are refunded by cancellation reconciliation.
            body.put("date_of_expiration", clock.instant().plusSeconds(1800).atOffset(ZoneOffset.UTC).toString());
        } else {
            body.put("payment_method_id", input.paymentMethodId() == null ? "visa" : input.paymentMethodId());
            body.put("token", input.cardToken() == null ? "LOCAL_TOKEN" : input.cardToken());
            body.put("installments", input.installments());
            body.put("capture", addon != null);
            if (input.issuerId() != null)
                body.put("issuer_id", input.issuerId());
        }
        p.encryptedRequest = crypto.encrypt(json.writeValueAsString(body));
        return db.save(p);
    }

    public void wake(Payment p) {
        p.retryAt = clock.instant();
    }
}
