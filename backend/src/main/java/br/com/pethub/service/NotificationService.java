package br.com.pethub.service;

import br.com.pethub.repository.Db;

import static br.com.pethub.domain.Domain.*;
import java.time.*;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class NotificationService {
    final Db db;
    final Clock clock;

    public NotificationService(Db db, Clock clock) {
        this.db = db;
        this.clock = clock;
    }

    public void send(String user, String order, String type, String message, Instant deadline) {
        Notification n = new Notification();
        n.recipientId = user;
        n.orderId = order;
        n.type = type;
        n.message = message;
        n.deadline = deadline;
        n.createdAt = clock.instant();
        db.save(n);
    }

    public void both(Purchase o, String type, String message) {
        send(o.tutorId, o.id, type, message, o.slaDeadline);
        send(db.get(Shop.class, o.storeId).ownerId, o.id, type, message, o.slaDeadline);
    }

    @Transactional(readOnly = true)
    public List<Notification> since(String user, long after) {
        return db.page(Notification.class, "from Notification n where n.recipientId=?1 and n.id>?2 order by n.id", 0,
                100, user, after);
    }
}
