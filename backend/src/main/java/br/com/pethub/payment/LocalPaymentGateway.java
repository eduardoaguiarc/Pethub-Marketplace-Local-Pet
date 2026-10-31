package br.com.pethub.payment;

import static br.com.pethub.domain.Domain.*;
import java.math.BigDecimal;
import java.util.Map;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Explicit development simulator. Never a fallback from a failed real payment.
 */
@Component
@ConditionalOnProperty(name = "pethub.payment-mode", havingValue = "local")
public class LocalPaymentGateway implements PaymentGateway {
    Snapshot snapshot(Payment p, PaymentStatus status) {
        return new Snapshot("local-" + p.id, status, p.amount, p.refundedAmount, null, null, null, p.id);
    }

    public Snapshot create(Payment p, Map<String, Object> body) {
        return snapshot(p,
                p.method == PaymentMethod.PIX || p.captureRequested ? PaymentStatus.PAGO : PaymentStatus.AUTORIZADO);
    }

    public Snapshot fetch(Payment p) {
        return snapshot(p, p.status);
    }

    public Snapshot capture(Payment p) {
        return snapshot(p, PaymentStatus.PAGO);
    }

    public Snapshot cancel(Payment p) {
        return snapshot(p, PaymentStatus.CANCELADO);
    }

    public void refund(Payment p, BigDecimal amount, String key) {
    }
}
