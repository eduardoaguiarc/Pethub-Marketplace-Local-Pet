package br.com.pethub.scheduler;

import br.com.pethub.payment.PaymentWorker;
import br.com.pethub.repository.Db;
import br.com.pethub.service.OrderService;

import static br.com.pethub.domain.Domain.*;
import java.time.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
@ConditionalOnProperty(name = "pethub.jobs-enabled", havingValue = "true", matchIfMissing = true)
public class Jobs {
    final Db db;
    final Clock clock;
    final OrderService orders;
    final PaymentWorker worker;
    final Logger log = LoggerFactory.getLogger(Jobs.class);

    public Jobs(Db db, Clock clock, OrderService orders, PaymentWorker worker) {
        this.db = db;
        this.clock = clock;
        this.orders = orders;
        this.worker = worker;
    }

    @Scheduled(fixedDelay = 5000, initialDelay = 5000)
    public void deadlines() {
        var ids = db.page(String.class,
                "select o.id from Purchase o where (o.status=?1 and o.slaDeadline<=?2) or (o.status=?3 and o.checkedInAt is null and o.scheduledAt<?4) order by o.createdAt",
                0, 100,
                OrderStatus.PENDENTE_CONFIRMACAO, clock.instant(), OrderStatus.ACEITO_EM_PREPARO,
                clock.instant().minusSeconds(900));
        for (String id : ids)
            try {
                orders.expire(id);
            } catch (Exception e) {
                log.warn("Deadline job will retry order {} ({})", id, e.getClass().getSimpleName());
            }
    }

    @Scheduled(fixedDelay = 2000, initialDelay = 3000)
    public void payments() {
        var ids = db.page(String.class, "select p.id from Payment p where p.retryAt<=?1 order by p.retryAt,p.id", 0,
                100, clock.instant());
        for (String id : ids)
            try {
                worker.process(id);
            } catch (Exception e) {
                log.warn("Payment job will retry {} ({})", id, e.getClass().getSimpleName());
            }
    }
}
