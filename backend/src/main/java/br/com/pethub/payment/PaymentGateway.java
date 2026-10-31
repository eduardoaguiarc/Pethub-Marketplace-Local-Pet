package br.com.pethub.payment;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import static br.com.pethub.domain.Domain.*;

public interface PaymentGateway {
    record Snapshot(String id, PaymentStatus status, BigDecimal amount, BigDecimal refunded, String qrCode,
            String qrCodeBase64, Instant releaseDate, String externalReference) {
    }

    Snapshot create(Payment p, Map<String, Object> body);

    Snapshot fetch(Payment p);

    Snapshot capture(Payment p);

    Snapshot cancel(Payment p);

    void refund(Payment p, BigDecimal amount, String operationKey);
}
