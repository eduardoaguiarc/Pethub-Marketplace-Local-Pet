package br.com.pethub.service;

import br.com.pethub.dto.Requests;
import br.com.pethub.exception.ApiException;
import br.com.pethub.payment.PaymentQueue;
import br.com.pethub.repository.Db;
import br.com.pethub.security.AuthService;

import static br.com.pethub.domain.Domain.*;
import java.math.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import tools.jackson.databind.ObjectMapper;

@Service
@Transactional
public class OrderService {
    final Db db;
    final CatalogService catalog;
    final PetService pets;
    final PaymentQueue payments;
    final NotificationService notifications;
    final Clock clock;
    final ObjectMapper json;
    final BigDecimal advanceRate;

    public OrderService(Db db, CatalogService catalog, PetService pets, PaymentQueue payments,
            NotificationService notifications, Clock clock, ObjectMapper json,
            @Value("${pethub.advance-fee-rate}") BigDecimal rate) {
        this.db = db;
        this.catalog = catalog;
        this.pets = pets;
        this.payments = payments;
        this.notifications = notifications;
        this.clock = clock;
        this.json = json;
        this.advanceRate = rate;
        if (rate.signum() < 0 || rate.compareTo(BigDecimal.ONE) >= 0)
            throw new IllegalArgumentException("Taxa de antecipação inválida");
    }

    public static BigDecimal money(BigDecimal n) {
        return n.setScale(2, RoundingMode.HALF_UP);
    }

    public static boolean terminal(Purchase o) {
        return Set
                .of(OrderStatus.CANCELADO, OrderStatus.RECUSADO_OU_TIMEOUT, OrderStatus.NO_SHOW, OrderStatus.CONCLUIDO)
                .contains(o.status);
    }

    public record Detail(Purchase order, List<OrderItem> products, List<AddOn> addons, List<Payment> payments,
            List<BehaviorNote> behavioralNotes, List<Review> reviews) {
    }

    public Detail detail(Account a, String id) {
        Purchase o = db.get(Purchase.class, id);
        authorize(a, o);
        return new Detail(o, items(o), addons(o), paymentList(o),
                db.list(BehaviorNote.class, "from BehaviorNote n where n.orderId=?1 order by n.createdAt", o.id),
                db.list(Review.class, "from Review r where r.orderId=?1", o.id));
    }

    public List<OrderItem> items(Purchase o) {
        return db.list(OrderItem.class, "from OrderItem i where i.orderId=?1 order by i.id", o.id);
    }

    public List<AddOn> addons(Purchase o) {
        return db.list(AddOn.class, "from AddOn a where a.orderId=?1 order by a.id", o.id);
    }

    public List<Payment> paymentList(Purchase o) {
        return db.list(Payment.class, "from Payment p where p.orderId=?1 order by p.id", o.id);
    }

    public void authorize(Account a, Purchase o) {
        if (!a.id.equals(o.tutorId) && !(a.role == Role.LOJISTA && db.get(Shop.class, o.storeId).ownerId.equals(a.id)))
            throw ApiException.forbidden();
    }

    public Purchase locked(String id) {
        Purchase snapshot = db.get(Purchase.class, id);
        db.lock(Shop.class, snapshot.storeId);
        // A fresh read under the store mutex also serializes inventory, schedule and
        // payment callbacks.
        db.refresh(snapshot);
        return snapshot;
    }

    private Purchase merchant(Account actor, String id) {
        AuthService.role(actor, Role.LOJISTA);
        Purchase o = locked(id);
        if (!db.get(Shop.class, o.storeId).ownerId.equals(actor.id))
            throw ApiException.forbidden();
        return o;
    }

    private Purchase tutor(Account actor, String id) {
        Purchase o = locked(id);
        if (!o.tutorId.equals(actor.id))
            throw ApiException.forbidden();
        return o;
    }

    public Purchase checkout(Account actor, String key, Requests.Checkout r) {
        AuthService.role(actor, Role.TUTOR);
        if (key == null || !key.matches("[A-Za-z0-9_-]{8,100}"))
            throw ApiException.invalid("Idempotency-Key deve ter entre 8 e 100 caracteres alfanuméricos, _ ou -");
        db.lock(Account.class, actor.id);
        String hash = AuthService.hash(json.writeValueAsString(r));
        var prior = db.list(Purchase.class, "from Purchase o where o.tutorId=?1 and o.idempotencyKey=?2", actor.id,
                key);
        if (!prior.isEmpty()) {
            if (!prior.getFirst().requestHash.equals(hash))
                throw ApiException.conflict("Idempotency-Key já usada com outro conteúdo");
            return prior.getFirst();
        }
        Shop s = db.lock(Shop.class, r.storeId());
        if (s.status != StoreStatus.ATIVA)
            throw ApiException.conflict("Estabelecimento não está ativo");
        if (r.products().isEmpty() && r.booking() == null)
            throw ApiException.invalid("Comanda vazia");
        Purchase o = new Purchase();
        o.tutorId = actor.id;
        o.storeId = s.id;
        o.idempotencyKey = key;
        o.requestHash = hash;
        o.createdAt = clock.instant();
        o.slaDeadline = o.createdAt.plusSeconds(900);
        o.paymentMethod = r.payment().method();
        o.fulfillmentMode = r.booking() != null ? Fulfillment.RETIRADA_HIBRIDA : r.fulfillmentMode();
        if (o.fulfillmentMode == Fulfillment.ENTREGA_LOCAL) {
            if (r.deliveryAddress() == null || r.deliveryAddress().isBlank() || r.latitude() == null
                    || r.longitude() == null)
                throw ApiException.invalid("Entrega exige endereço e coordenadas");
            if (!Double.isFinite(r.latitude()) || !Double.isFinite(r.longitude()) || CatalogService.distance(s.latitude,
                    s.longitude, r.latitude(), r.longitude()) > s.serviceRadiusKm)
                throw ApiException.conflict("Endereço fora do raio de entrega");
            o.deliveryAddress = r.deliveryAddress();
            o.deliveryFee = s.deliveryFee;
        }
        Set<String> ids = new HashSet<>();
        var lines = new ArrayList<OrderItem>();
        for (var line : r.products()) {
            if (!ids.add(line.productId()))
                throw ApiException.invalid("Produto repetido na comanda");
            Product p = db.get(Product.class, line.productId());
            if (!p.storeId.equals(s.id) || !p.active || p.stock < line.quantity())
                throw ApiException.conflict("Produto indisponível ou estoque insuficiente");
            p.stock -= line.quantity();
            OrderItem i = new OrderItem();
            i.orderId = o.id;
            i.productId = p.id;
            i.productName = p.name;
            i.quantity = line.quantity();
            i.unitPrice = p.price;
            lines.add(i);
            o.subtotal = o.subtotal.add(p.price.multiply(BigDecimal.valueOf(i.quantity)));
        }
        if (r.booking() != null) {
            var booking = r.booking();
            Pet p = pets.owned(actor, booking.petId());
            if (!p.active)
                throw ApiException.conflict("Pet inativo");
            GroomingService g = db.get(GroomingService.class, booking.serviceId());
            if (!g.storeId.equals(s.id) || !g.active)
                throw ApiException.conflict("Serviço indisponível");
            if (booking.startsAt().isBefore(clock.instant().plusSeconds(7200)))
                throw ApiException.conflict("RN-01: antecedência mínima de 2 horas");
            if (booking.startsAt().isAfter(clock.instant().plus(Duration.ofDays(180))))
                throw ApiException.invalid("Agende até 180 dias à frente");
            o.scheduledAt = booking.startsAt();
            o.scheduledEnd = o.scheduledAt.plusSeconds(g.durationMinutes * 60L);
            o.bayId = catalog.reserveBay(s, p.size, o.scheduledAt, o.scheduledEnd).id;
            o.petId = p.id;
            o.petName = p.name;
            o.petSize = p.size;
            o.serviceId = g.id;
            o.serviceName = g.name;
            o.servicePrice = g.price(p.size);
            o.therapeuticService = g.therapeutic;
            o.taxiDog = booking.taxiDog();
            o.taxiDogFee = o.taxiDog ? s.taxiDogFee : BigDecimal.ZERO;
            o.sanitaryRequired = p.severeDermatitisHistory;
            o.subtotal = o.subtotal.add(o.servicePrice).add(o.taxiDogFee);
        }
        recalculate(o);
        db.save(o);
        lines.forEach(db::save);
        payments.create(o, null, r.payment(), actor.email);
        notifications.both(o, "NEW_ORDER", "Nova comanda: aguardando confirmação em até 15 minutos");
        return o;
    }

    void recalculate(Purchase o) {
        o.subtotal = money(o.subtotal);
        o.total = money(o.subtotal.add(o.deliveryFee));
        o.platformTakeRateAmount = money(o.total.multiply(new BigDecimal("0.10")));
        o.merchantNetAmount = o.total.subtract(o.platformTakeRateAmount);
    }

    public boolean localPaymentMode() {
        return payments.isLocalSimulation();
    }

    public void reconciliationRequired(Payment p) {
        notifications.both(db.get(Purchase.class, p.orderId), "PAYMENT_RECONCILIATION_REQUIRED",
                "Pagamento com resultado desconhecido; conciliação necessária");
    }

    public Purchase accept(Account actor, String id) {
        Purchase o = merchant(actor, id);
        if (o.acceptedAt != null && !terminal(o))
            return o;
        if (o.status != OrderStatus.PENDENTE_CONFIRMACAO)
            throw ApiException.conflict("Pedido não aguarda confirmação");
        if (!clock.instant().isBefore(o.slaDeadline)) {
            cancel(o, OrderStatus.RECUSADO_OU_TIMEOUT, "SLA de 15 minutos excedido", BigDecimal.ZERO);
            return o;
        }
        Payment p = basePayment(o);
        if (!Set.of(PaymentStatus.AUTORIZADO, PaymentStatus.PAGO).contains(p.status))
            throw ApiException.conflict("Aguarde autorização do cartão ou confirmação do PIX");
        o.status = OrderStatus.ACEITO_EM_PREPARO;
        o.acceptedAt = clock.instant();
        p.captureRequested = true;
        payments.wake(p);
        notifications.both(o, "ORDER_ACCEPTED", "Comanda aceita; ordens de serviço e separação disponíveis");
        return o;
    }

    public Purchase reject(Account actor, String id, String reason) {
        Purchase o = merchant(actor, id);
        if (o.status != OrderStatus.PENDENTE_CONFIRMACAO)
            throw ApiException.conflict("Só é possível recusar pedidos pendentes");
        cancel(o, OrderStatus.RECUSADO_OU_TIMEOUT, reason, BigDecimal.ZERO);
        return o;
    }

    public Purchase cancelByTutor(Account actor, String id, String reason) {
        Purchase o = tutor(actor, id);
        if (o.status == OrderStatus.CANCELADO)
            return o;
        if (o.status != OrderStatus.PENDENTE_CONFIRMACAO)
            throw ApiException.conflict("Cancelamento pelo tutor permitido antes do aceite");
        cancel(o, OrderStatus.CANCELADO, reason, BigDecimal.ZERO);
        return o;
    }

    public Purchase cancelSanitary(Account actor, String id, String reason) {
        Purchase o = merchant(actor, id);
        if (terminal(o) || !o.sanitaryRequired || !o.triageDone || o.groomingStage != Stage.TRIAGEM)
            throw ApiException.conflict("Cancelamento sanitário exige triagem pendente de liberação");
        cancel(o, OrderStatus.CANCELADO, reason, BigDecimal.ZERO);
        return o;
    }

    void cancel(Purchase o, OrderStatus status, String reason, BigDecimal retain) {
        if (terminal(o))
            return;
        o.status = status;
        o.rejectionReason = reason;
        o.noShowFee = money(retain);
        o.bayReleased = true;
        if (!o.resourcesReleased) {
            for (OrderItem i : items(o))
                db.get(Product.class, i.productId).stock += i.quantity;
            for (AddOn a : addons(o))
                if (a.stockReserved) {
                    db.get(Product.class, a.productId).stock += a.quantity;
                    a.stockReserved = false;
                }
            o.resourcesReleased = true;
        }
        for (Payment p : paymentList(o)) {
            p.cancelRequested = true;
            p.desiredRefund = money(p.amount.subtract(p.addonId == null ? retain : BigDecimal.ZERO));
            payments.wake(p);
        }
        if (retain.signum() > 0)
            ledger(o, retain);
        notifications.both(o, "ORDER_CANCELLED", reason + "; devolução financeira solicitada");
    }

    public Purchase checkIn(Account actor, String id) {
        Purchase o = merchant(actor, id);
        if (o.checkedInAt != null)
            return o;
        if (o.serviceId == null || o.status != OrderStatus.ACEITO_EM_PREPARO)
            throw ApiException.conflict("Pedido não está aguardando chegada do pet");
        if (clock.instant().isAfter(o.scheduledAt.plusSeconds(900))) {
            noShow(o);
            return o;
        }
        if (clock.instant().isBefore(o.scheduledAt.minusSeconds(900)))
            throw ApiException.conflict("Check-in disponível a partir de 15 minutos antes do agendamento");
        requirePaid(o);
        o.checkedInAt = clock.instant();
        o.status = OrderStatus.EM_ATENDIMENTO_ESTETICA;
        o.groomingStage = Stage.TRIAGEM;
        notifications.both(o, "PET_CHECKED_IN", "Pet recebido para triagem");
        return o;
    }

    public Purchase triage(Account actor, String id, Requests.Triage r) {
        Purchase o = merchant(actor, id);
        if (o.status != OrderStatus.EM_ATENDIMENTO_ESTETICA || o.groomingStage != Stage.TRIAGEM)
            throw ApiException.conflict("Triagem não disponível neste estágio");
        o.triageDone = true;
        o.sanitaryRequired = o.sanitaryRequired || r.severeDermatitis() || r.suspectedEctoparasites()
                || db.get(Pet.class, o.petId).severeDermatitisHistory;
        if (r.severeDermatitis())
            db.get(Pet.class, o.petId).severeDermatitisHistory = true;
        notifications.both(o, "TRIAGE_UPDATED",
                o.sanitaryRequired ? "Banho terapêutico exige aprovação do tutor" : "Triagem concluída");
        return o;
    }

    public Purchase stage(Account actor, String id, Stage next) {
        Purchase o = merchant(actor, id);
        if (o.status != OrderStatus.EM_ATENDIMENTO_ESTETICA)
            throw ApiException.conflict("Pet não está em atendimento");
        if (o.groomingStage == next)
            return o;
        boolean allowed = (o.groomingStage == Stage.TRIAGEM && next == Stage.BANHO)
                || (o.groomingStage == Stage.BANHO && (next == Stage.TOSA || next == Stage.FINALIZADO))
                || (o.groomingStage == Stage.TOSA && next == Stage.FINALIZADO);
        if (!allowed)
            throw ApiException.conflict("Transição de estágio inválida");
        if (clock.instant().isBefore(o.scheduledAt))
            throw ApiException.conflict("Execução não pode iniciar antes do horário reservado");
        sanitaryGuard(o);
        requirePaid(o);
        noPendingAddons(o);
        o.groomingStage = next;
        notifications.both(o, "GROOMING_PROGRESS", next.name());
        return o;
    }

    void sanitaryGuard(Purchase o) {
        if (!o.triageDone)
            throw ApiException.conflict("Triagem obrigatória");
        boolean baseTherapeutic = o.therapeuticService;
        if (o.sanitaryRequired && !baseTherapeutic
                && addons(o).stream().noneMatch(a -> a.mandatorySanitary && a.status == Decision.APROVADO))
            throw ApiException.conflict("RN-06: banho terapêutico exige aprovação e pagamento do tutor");
    }

    void noPendingAddons(Purchase o) {
        if (addons(o).stream()
                .anyMatch(a -> a.status == Decision.PENDENTE_TUTOR || a.status == Decision.AGUARDANDO_PAGAMENTO))
            throw ApiException.conflict("Resolva os adicionais pendentes");
    }

    public Purchase ready(Account actor, String id) {
        Purchase o = merchant(actor, id);
        if (o.status == OrderStatus.PRONTO_RETIRADA)
            return o;
        if (o.fulfillmentMode != Fulfillment.RETIRADA_HIBRIDA)
            throw ApiException.conflict("Pedido é de entrega");
        if (o.serviceId != null) {
            if (o.status != OrderStatus.EM_ATENDIMENTO_ESTETICA || o.groomingStage != Stage.FINALIZADO)
                throw ApiException.conflict("Finalize a estética antes de liberar a comanda");
            sanitaryGuard(o);
        } else if (o.status != OrderStatus.ACEITO_EM_PREPARO)
            throw ApiException.conflict("Pedido não está em preparo");
        requirePaid(o);
        noPendingAddons(o);
        o.status = OrderStatus.PRONTO_RETIRADA;
        notifications.both(o, "READY_FOR_PICKUP", "Pet e produtos prontos para retirada conjunta");
        return o;
    }

    public Purchase dispatch(Account actor, String id) {
        Purchase o = merchant(actor, id);
        if (o.status == OrderStatus.SAIU_PARA_ENTREGA)
            return o;
        if (o.status != OrderStatus.ACEITO_EM_PREPARO || o.fulfillmentMode != Fulfillment.ENTREGA_LOCAL
                || o.serviceId != null)
            throw ApiException.conflict("Pedido não pode sair para entrega");
        requirePaid(o);
        o.status = OrderStatus.SAIU_PARA_ENTREGA;
        notifications.both(o, "OUT_FOR_DELIVERY", "Pedido saiu para entrega local");
        return o;
    }

    public Purchase complete(Account actor, String id) {
        Purchase o = merchant(actor, id);
        if (o.status == OrderStatus.CONCLUIDO)
            return o;
        if (!Set.of(OrderStatus.PRONTO_RETIRADA, OrderStatus.SAIU_PARA_ENTREGA).contains(o.status))
            throw ApiException.conflict("Pedido não está pronto para conclusão");
        requirePaid(o);
        noPendingAddons(o);
        o.status = OrderStatus.CONCLUIDO;
        o.completedAt = clock.instant();
        o.bayReleased = true;
        ledger(o, o.total);
        notifications.both(o, "ORDER_COMPLETED", "Comanda concluída; avaliação disponível");
        return o;
    }

    void requirePaid(Purchase o) {
        if (paymentList(o).stream().anyMatch(p -> p.status != PaymentStatus.PAGO))
            throw ApiException.conflict("Aguarde a confirmação de todos os pagamentos");
    }

    Payment basePayment(Purchase o) {
        return paymentList(o).stream().filter(p -> p.addonId == null).findFirst().orElseThrow();
    }

    void ledger(Purchase o, BigDecimal gross) {
        if (db.count("select count(r) from Receivable r where r.orderId=?1", o.id) > 0)
            return;
        Shop s = db.get(Shop.class, o.storeId);
        Receivable r = new Receivable();
        r.orderId = o.id;
        r.storeId = o.storeId;
        r.gross = money(gross);
        r.platformFee = money(gross.multiply(new BigDecimal("0.10")));
        r.merchantAmount = r.gross.subtract(r.platformFee);
        r.advanceFee = s.advancePayout ? money(r.merchantAmount.multiply(advanceRate)) : money(BigDecimal.ZERO);
        r.expectedNet = r.merchantAmount.subtract(r.advanceFee);
        r.expectedAt = clock.instant().plus(Duration.ofDays(s.advancePayout ? 1 : 7));
        db.save(r);
    }

    public AddOn addOn(Account actor, String id, Requests.AddOnInput r) {
        Purchase o = merchant(actor, id);
        if (o.status != OrderStatus.EM_ATENDIMENTO_ESTETICA || o.groomingStage == Stage.FINALIZADO)
            throw ApiException.conflict("Adicionais disponíveis durante o atendimento");
        if ((r.productId() == null) == (r.serviceId() == null))
            throw ApiException.invalid("Informe exatamente um produto ou serviço");
        AddOn a = new AddOn();
        a.orderId = o.id;
        a.reason = r.reason();
        a.quantity = r.quantity();
        a.productId = r.productId();
        a.serviceId = r.serviceId();
        a.mandatorySanitary = r.mandatorySanitary();
        if (a.productId != null) {
            Product p = db.get(Product.class, a.productId);
            if (!p.storeId.equals(o.storeId) || !p.active)
                throw ApiException.conflict("Produto indisponível");
            if (a.mandatorySanitary)
                throw ApiException.invalid("Adicional sanitário deve ser serviço terapêutico");
            a.title = p.name;
            a.price = money(p.price.multiply(BigDecimal.valueOf(a.quantity)));
        } else {
            GroomingService g = db.get(GroomingService.class, a.serviceId);
            if (!g.storeId.equals(o.storeId) || !g.active || a.quantity != 1)
                throw ApiException.conflict("Serviço indisponível ou quantidade diferente de 1");
            if (a.mandatorySanitary
                    && (!g.therapeutic || !o.sanitaryRequired || !o.triageDone || o.groomingStage != Stage.TRIAGEM))
                throw ApiException.conflict("Adicional sanitário exige triagem e serviço terapêutico");
            a.title = g.name;
            a.price = g.price(o.petSize);
            a.durationMinutes = g.durationMinutes;
        }
        db.save(a);
        notifications.both(o, "ADDON_REQUESTED", "Aprovação solicitada: " + a.title);
        return a;
    }

    public AddOn decide(Account actor, String orderId, String addonId, Requests.AddOnDecision r) {
        Purchase o = tutor(actor, orderId);
        AddOn a = db.get(AddOn.class, addonId);
        if (!a.orderId.equals(o.id))
            throw ApiException.notFound("Adicional não encontrado");
        if (r.decision() != Decision.APROVADO && r.decision() != Decision.RECUSADO)
            throw ApiException.invalid("Decisão deve ser APROVADO ou RECUSADO");
        if (a.status != Decision.PENDENTE_TUTOR) {
            if ((r.decision() == Decision.APROVADO
                    && (a.status == Decision.APROVADO || a.status == Decision.AGUARDANDO_PAGAMENTO))
                    || r.decision() == a.status)
                return a;
            throw ApiException.conflict("Decisão já registrada");
        }
        if (o.status != OrderStatus.EM_ATENDIMENTO_ESTETICA)
            throw ApiException.conflict("Pedido não está em atendimento");
        if (r.decision() == Decision.RECUSADO) {
            a.status = Decision.RECUSADO;
            notifications.both(o, "ADDON_DECLINED", a.title);
            return a;
        }
        if (r.payment() == null)
            throw ApiException.invalid("Aprovação exige dados de pagamento");
        if (a.productId != null) {
            Product p = db.get(Product.class, a.productId);
            if (!p.active || p.stock < a.quantity)
                throw ApiException.conflict("Estoque insuficiente");
            p.stock -= a.quantity;
            a.stockReserved = true;
        }
        if (a.durationMinutes > 0) {
            Instant end = o.scheduledEnd.plusSeconds(a.durationMinutes * 60L);
            if (!catalog.bayAvailable(o.bayId, o.scheduledAt, end, o.id))
                throw ApiException.conflict("Adicional excede a disponibilidade da baia");
            o.scheduledEnd = end;
        }
        a.status = Decision.AGUARDANDO_PAGAMENTO;
        payments.create(o, a, r.payment(), actor.email);
        notifications.both(o, "ADDON_PAYMENT_PENDING", a.title);
        return a;
    }

    public void paymentUpdated(Payment p) {
        Purchase o = db.get(Purchase.class, p.orderId);
        if (terminal(o))
            return;
        if (p.status == PaymentStatus.RECUSADO || p.status == PaymentStatus.CANCELADO
                || p.status == PaymentStatus.CONTESTADO || p.status == PaymentStatus.ESTORNADO
                || p.status == PaymentStatus.PARCIALMENTE_ESTORNADO) {
            cancel(o, OrderStatus.CANCELADO, "Pagamento recusado, cancelado ou contestado", BigDecimal.ZERO);
            return;
        }
        if (p.addonId != null && p.status == PaymentStatus.PAGO) {
            AddOn a = db.get(AddOn.class, p.addonId);
            if (a.status == Decision.AGUARDANDO_PAGAMENTO) {
                a.status = Decision.APROVADO;
                o.subtotal = o.subtotal.add(a.price);
                recalculate(o);
                notifications.both(o, "ADDON_APPROVED", a.title);
            }
        }
        notifications.both(o, "PAYMENT_UPDATED", p.status.name());
    }

    public Review review(Account actor, String id, Requests.ReviewInput r) {
        Purchase o = tutor(actor, id);
        if (o.status != OrderStatus.CONCLUIDO)
            throw ApiException.conflict("Avaliação disponível após conclusão");
        if (db.count("select count(r) from Review r where r.orderId=?1", o.id) > 0)
            throw ApiException.conflict("Comanda já avaliada");
        Review review = new Review();
        review.orderId = o.id;
        review.storeId = o.storeId;
        review.rating = r.rating();
        review.comment = r.comment();
        review.createdAt = clock.instant();
        return db.save(review);
    }

    public BehaviorNote behavior(Account actor, String id, String text) {
        Purchase o = merchant(actor, id);
        if (o.petId == null || o.checkedInAt == null)
            throw ApiException.conflict("Observação exige atendimento de pet recebido");
        BehaviorNote n = new BehaviorNote();
        n.orderId = o.id;
        n.petId = o.petId;
        n.storeId = o.storeId;
        n.note = text;
        n.createdAt = clock.instant();
        return db.save(n);
    }

    void noShow(Purchase o) {
        cancel(o, OrderStatus.NO_SHOW, "RN-05: pet não chegou na tolerância de 15 minutos",
                money(o.servicePrice.multiply(new BigDecimal("0.20"))));
    }

    public void expire(String id) {
        Purchase o = locked(id);
        Instant now = clock.instant();
        if (o.status == OrderStatus.PENDENTE_CONFIRMACAO && !now.isBefore(o.slaDeadline))
            cancel(o, OrderStatus.RECUSADO_OU_TIMEOUT, "RN-02: timeout de confirmação", BigDecimal.ZERO);
        else if (o.status == OrderStatus.ACEITO_EM_PREPARO && o.scheduledAt != null && o.checkedInAt == null
                && now.isAfter(o.scheduledAt.plusSeconds(900)))
            noShow(o);
    }
}
