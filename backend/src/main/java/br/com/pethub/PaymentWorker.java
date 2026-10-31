package br.com.pethub;

import static br.com.pethub.Domain.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientResponseException;
import tools.jackson.databind.ObjectMapper;

/** Durable payment work: intentions commit before any HTTP call. A store lock serializes retries/callbacks. */
@Service
public class PaymentWorker {
    final Db db; final PaymentGateway gateway; final Crypto crypto; final ObjectMapper json; final Clock clock; final OrderService orders;
    public PaymentWorker(Db db,PaymentGateway gateway,Crypto crypto,ObjectMapper json,Clock clock,OrderService orders) {
        this.db=db; this.gateway=gateway; this.crypto=crypto; this.json=json; this.clock=clock; this.orders=orders;
    }
    @Transactional
    @SuppressWarnings("unchecked")
    public void process(String id) {
        Payment p=db.get(Payment.class,id); db.lock(Shop.class,p.storeId); db.refresh(p);
        if(p.retryAt==null||p.retryAt.isAfter(clock.instant())) return;
        if(p.providerId==null&&p.attempts>0&&p.createdAt.isBefore(clock.instant().minus(Duration.ofHours(23)))) {
            p.errorCode="MANUAL_RECONCILIATION_REQUIRED"; p.task="MANUAL_RECONCILIATION"; p.retryAt=null;
            orders.reconciliationRequired(p); return;
        }
        PaymentStatus before=p.status;
        try {
            if(p.cancelRequested&&p.providerId==null&&p.attempts==0) {
                p.status=PaymentStatus.CANCELADO; p.encryptedRequest=null; p.retryAt=null; p.task="DONE"; return;
            }
            p.attempts++;
            if(p.providerId==null) {
                p.task="CREATE";
                apply(p,gateway.create(p,json.readValue(crypto.decrypt(p.encryptedRequest),Map.class)));
                p.encryptedRequest=null;
            } else if(!p.localSimulation) { p.task="RECONCILE"; apply(p,gateway.fetch(p)); }

            if(p.cancelRequested) {
                if(p.status==PaymentStatus.AUTORIZADO&&p.desiredRefund.compareTo(p.amount)<0) {
                    p.task="CAPTURE"; apply(p,gateway.capture(p));
                }
                if(p.status==PaymentStatus.AUTORIZADO||p.status==PaymentStatus.PENDENTE) {
                    p.task="CANCEL"; apply(p,gateway.cancel(p));
                } else if(Set.of(PaymentStatus.PAGO,PaymentStatus.PARCIALMENTE_ESTORNADO).contains(p.status)&&p.desiredRefund.compareTo(p.refundedAmount)>0) {
                    p.task="REFUND"; BigDecimal remaining=p.desiredRefund.subtract(p.refundedAmount);
                    gateway.refund(p,remaining,"refund-"+p.desiredRefund.toPlainString());
                    p.refundedAmount=p.desiredRefund; p.status=p.refundedAmount.compareTo(p.amount)>=0?PaymentStatus.ESTORNADO:PaymentStatus.PARCIALMENTE_ESTORNADO;
                }
            } else if(p.captureRequested&&p.status==PaymentStatus.AUTORIZADO) {
                p.task="CAPTURE"; apply(p,gateway.capture(p));
            }
            p.errorCode=null;
            boolean finished=Set.of(PaymentStatus.RECUSADO,PaymentStatus.CANCELADO,PaymentStatus.ESTORNADO,PaymentStatus.CONTESTADO).contains(p.status)
                ||(p.cancelRequested&&p.refundedAmount.compareTo(p.desiredRefund)>=0);
            p.retryAt=finished?null:clock.instant().plusSeconds(p.status==PaymentStatus.PAGO?300:15);
            p.task=finished?"DONE":"RECONCILE";
            if(before!=p.status) orders.paymentUpdated(p);
            if(p.status==PaymentStatus.CONTESTADO||p.status==PaymentStatus.ESTORNADO||p.status==PaymentStatus.PARCIALMENTE_ESTORNADO) {
                db.list(Receivable.class,"from Receivable r where r.orderId=?1",p.orderId).forEach(r->{ if(!p.cancelRequested) r.status="RECONCILIACAO_NECESSARIA"; });
            }
        } catch(RestClientResponseException e) {
            int status=e.getStatusCode().value(); p.errorCode="PROVIDER_HTTP_"+status;
            if(p.providerId==null&&Set.of(400,402,422).contains(status)) {
                p.status=PaymentStatus.RECUSADO; p.encryptedRequest=null; p.retryAt=null; p.task="DONE"; orders.paymentUpdated(p);
            } else retry(p);
        } catch(Exception e) {
            // Do not persist/log upstream bodies: they may contain payer data or credentials.
            p.errorCode="PROVIDER_UNAVAILABLE_OR_INVALID_RESPONSE"; retry(p);
        }
    }
    private void retry(Payment p) { p.retryAt=clock.instant().plusSeconds(Math.min(900,5L << Math.min(p.attempts,7))); }
    @Transactional
    public Payment reconcile(Account actor,String id,String providerId) {
        AuthService.role(actor,Role.ADMIN); Payment p=db.get(Payment.class,id); db.lock(Shop.class,p.storeId); db.refresh(p);
        if(p.providerId!=null&&!p.providerId.equals(providerId)) throw ApiException.conflict("Cobrança já vinculada a outro pagamento");
        p.providerId=providerId;
        // A wrong manual association must roll back, including the supplied providerId.
        apply(p,gateway.fetch(p)); p.encryptedRequest=null; p.errorCode=null; p.retryAt=clock.instant(); p.task="RECONCILE";
        orders.paymentUpdated(p); return p;
    }
    private void apply(Payment p,PaymentGateway.Snapshot s) {
        if(!p.id.equals(s.externalReference())||p.amount.compareTo(s.amount())!=0||(p.providerId!=null&&!p.providerId.equals(s.id()))) throw new IllegalStateException("Resposta financeira não pertence à cobrança");
        p.providerId=s.id(); p.status=s.status(); p.refundedAmount=s.refunded(); p.qrCode=s.qrCode(); p.qrCodeBase64=s.qrCodeBase64(); p.providerReleaseDate=s.releaseDate();
    }
}
