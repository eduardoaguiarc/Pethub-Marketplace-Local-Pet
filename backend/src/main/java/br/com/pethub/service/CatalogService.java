package br.com.pethub.service;

import br.com.pethub.dto.Requests;
import br.com.pethub.exception.ApiException;
import br.com.pethub.repository.Db;
import br.com.pethub.security.AuthService;

import static br.com.pethub.domain.Domain.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CatalogService {
    private final Db db;
    private final Clock clock;

    public CatalogService(Db db, Clock clock) {
        this.db = db;
        this.clock = clock;
    }

    public Shop ownedShop(Account actor, boolean lock) {
        AuthService.role(actor, Role.LOJISTA);
        var shops = db.list(Shop.class, "from Shop s where s.ownerId=?1", actor.id);
        if (shops.isEmpty())
            throw ApiException.notFound("Cadastre seu estabelecimento");
        return lock ? db.lock(Shop.class, shops.getFirst().id) : shops.getFirst();
    }

    public Shop createShop(Account actor, Requests.ShopInput r) {
        AuthService.role(actor, Role.LOJISTA);
        db.lock(Account.class, actor.id);
        if (db.count("select count(s) from Shop s where s.ownerId=?1", actor.id) > 0)
            throw ApiException.conflict("Lojista já possui estabelecimento");
        Shop s = new Shop();
        s.ownerId = actor.id;
        apply(s, r);
        return db.save(s);
    }

    public Shop updateShop(Account actor, Requests.ShopInput r) {
        Shop s = ownedShop(actor, true);
        apply(s, r);
        return s;
    }

    private void apply(Shop s, Requests.ShopInput r) {
        try {
            ZoneId.of(r.timeZone());
        } catch (DateTimeException e) {
            throw ApiException.invalid("Fuso horário inválido");
        }
        s.name = r.name();
        s.description = r.description();
        s.address = r.address();
        s.neighborhood = r.neighborhood();
        s.latitude = r.latitude();
        s.longitude = r.longitude();
        s.serviceRadiusKm = r.serviceRadiusKm();
        s.deliveryPreparationMinutes = r.deliveryPreparationMinutes();
        s.deliveryFee = r.deliveryFee();
        s.taxiDogFee = r.taxiDogFee();
        s.timeZone = r.timeZone();
        s.logoUrl = r.logoUrl();
        s.bannerUrl = r.bannerUrl();
    }

    public Shop approve(Account admin, String id) {
        AuthService.role(admin, Role.ADMIN);
        Shop s = db.lock(Shop.class, id);
        s.status = StoreStatus.ATIVA;
        return s;
    }

    public Shop suspend(Account admin, String id) {
        AuthService.role(admin, Role.ADMIN);
        Shop s = db.lock(Shop.class, id);
        s.status = StoreStatus.SUSPENSA;
        return s;
    }

    @Transactional(readOnly = true)
    public Shop publicShop(String id) {
        Shop s = db.get(Shop.class, id);
        if (s.status != StoreStatus.ATIVA)
            throw ApiException.notFound("Loja não disponível");
        return s;
    }

    public record StoreResult(Shop store, double distanceKm, int estimatedTravelMinutes, int estimatedDeliveryMinutes,
            double rating, long reviewCount) {
    }

    @Transactional(readOnly = true)
    public List<StoreResult> discover(double lat, double lon, double radius, String sort, int page, int size) {
        if (!Double.isFinite(lat) || !Double.isFinite(lon) || !Double.isFinite(radius) || lat < -90 || lat > 90
                || lon < -180 || lon > 180 || radius <= 0 || radius > 100)
            throw ApiException.invalid("Coordenadas ou raio inválidos");
        if (!List.of("distance", "time").contains(sort))
            throw ApiException.invalid("sort deve ser distance ou time");
        var results = new ArrayList<StoreResult>();
        // Bounding box reduces candidates before the exact great-circle distance
        // calculation.
        double delta = radius / 111.0,
                lonDelta = Math.min(180, radius / (111.0 * Math.max(.001, Math.cos(Math.toRadians(lat)))));
        var shops = db.list(Shop.class, "from Shop s where s.status=?1 and s.latitude between ?2 and ?3",
                StoreStatus.ATIVA, lat - delta, lat + delta);
        for (Shop s : shops) {
            double longitudeDifference = Math.min(Math.abs(lon - s.longitude), 360 - Math.abs(lon - s.longitude));
            if (longitudeDifference > lonDelta)
                continue;
            double d = distance(lat, lon, s.latitude, s.longitude);
            if (d > radius || d > s.serviceRadiusKm)
                continue;
            int travel = (int) Math.ceil(d / 25.0 * 60);
            long count = db.count("select count(r) from Review r where r.storeId=?1", s.id);
            Double avg = db.list(Double.class, "select avg(r.rating) from Review r where r.storeId=?1", s.id)
                    .getFirst();
            results.add(new StoreResult(s, Math.round(d * 100) / 100.0, travel, travel + s.deliveryPreparationMinutes,
                    avg == null ? 0 : avg, count));
        }
        Comparator<StoreResult> comparator = sort.equals("time")
                ? Comparator.comparingInt(StoreResult::estimatedTravelMinutes)
                        .thenComparingDouble(StoreResult::distanceKm)
                : Comparator.comparingDouble(StoreResult::distanceKm)
                        .thenComparingInt(StoreResult::estimatedTravelMinutes);
        return results.stream().sorted(comparator.thenComparing(r -> r.store().id)).skip((long) page * size).limit(size)
                .toList();
    }

    public static double distance(double lat1, double lon1, double lat2, double lon2) {
        double a = Math.pow(Math.sin(Math.toRadians(lat2 - lat1) / 2), 2) + Math.cos(Math.toRadians(lat1))
                * Math.cos(Math.toRadians(lat2)) * Math.pow(Math.sin(Math.toRadians(lon2 - lon1) / 2), 2);
        return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
    }

    public Product product(Account actor, String id, Requests.ProductInput r) {
        Shop s = ownedShop(actor, true);
        Product p = id == null ? new Product() : db.get(Product.class, id);
        if (id != null && !s.id.equals(p.storeId))
            throw ApiException.forbidden();
        p.storeId = s.id;
        p.name = r.name();
        p.description = r.description();
        p.category = r.category();
        p.price = r.price();
        p.stock = r.stock();
        p.unitLabel = r.unitLabel();
        p.imageUrl = r.imageUrl();
        p.active = r.active();
        return id == null ? db.save(p) : p;
    }

    public GroomingService service(Account actor, String id, Requests.ServiceInput r) {
        Shop s = ownedShop(actor, true);
        GroomingService g = id == null ? new GroomingService() : db.get(GroomingService.class, id);
        if (id != null && !s.id.equals(g.storeId))
            throw ApiException.forbidden();
        g.storeId = s.id;
        g.name = r.name();
        g.description = r.description();
        g.category = r.category();
        g.durationMinutes = r.durationMinutes();
        g.smallPrice = r.smallPrice();
        g.mediumPrice = r.mediumPrice();
        g.largePrice = r.largePrice();
        g.therapeutic = r.therapeutic();
        g.imageUrl = r.imageUrl();
        g.active = r.active();
        return id == null ? db.save(g) : g;
    }

    public Bay bay(Account actor, String id, Requests.BayInput r) {
        Shop s = ownedShop(actor, true);
        Bay b = id == null ? new Bay() : db.get(Bay.class, id);
        if (id != null && !s.id.equals(b.storeId))
            throw ApiException.forbidden();
        if (id != null && (b.size != r.size() || !r.active()) && db.count(
                "select count(o) from Purchase o where o.bayId=?1 and o.bayReleased=false and o.scheduledEnd>?2", id,
                clock.instant()) > 0)
            throw ApiException.conflict("Baia possui reservas futuras");
        b.storeId = s.id;
        b.name = r.name();
        b.size = r.size();
        b.active = r.active();
        return id == null ? db.save(b) : b;
    }

    public BayWindow window(Account actor, Requests.WindowInput r) {
        Shop s = ownedShop(actor, true);
        Bay b = db.get(Bay.class, r.bayId());
        if (!b.storeId.equals(s.id))
            throw ApiException.forbidden();
        if (!b.active || !r.startsAt().isBefore(r.endsAt()) || r.startsAt().isBefore(clock.instant())
                || Duration.between(r.startsAt(), r.endsAt()).toHours() > 24)
            throw ApiException.invalid("Janela deve ser futura e ter no máximo 24 horas");
        if (db.count("select count(w) from BayWindow w where w.bayId=?1 and w.startsAt<?2 and w.endsAt>?3", b.id,
                r.endsAt(), r.startsAt()) > 0)
            throw ApiException.conflict("Janelas sobrepostas");
        BayWindow w = new BayWindow();
        w.storeId = s.id;
        w.bayId = b.id;
        w.startsAt = r.startsAt();
        w.endsAt = r.endsAt();
        return db.save(w);
    }

    public void removeWindow(Account actor, String id) {
        Shop s = ownedShop(actor, true);
        BayWindow w = db.get(BayWindow.class, id);
        if (!s.id.equals(w.storeId))
            throw ApiException.forbidden();
        if (db.count(
                "select count(o) from Purchase o where o.bayId=?1 and o.bayReleased=false and o.scheduledAt<?2 and o.scheduledEnd>?3",
                w.bayId, w.endsAt, w.startsAt) > 0)
            throw ApiException.conflict("Janela possui reservas");
        db.remove(w);
    }

    public boolean bayAvailable(String bayId, Instant start, Instant end, String excludingOrder) {
        return db.count("select count(w) from BayWindow w where w.bayId=?1 and w.startsAt<=?2 and w.endsAt>=?3", bayId,
                start, end) > 0
                && db.count(
                        "select count(o) from Purchase o where o.bayId=?1 and o.bayReleased=false and o.scheduledAt<?2 and o.scheduledEnd>?3 and o.id<>?4",
                        bayId, end, start, excludingOrder == null ? "" : excludingOrder) == 0;
    }

    public Bay reserveBay(Shop s, PetSize size, Instant start, Instant end) {
        for (Bay b : db.list(Bay.class, "from Bay b where b.storeId=?1 and b.size=?2 and b.active=true order by b.id",
                s.id, size))
            if (bayAvailable(b.id, start, end, null))
                return b;
        throw ApiException.conflict("Sem baia disponível para o porte e intervalo solicitados");
    }

    public record Slot(Instant startsAt, Instant endsAt, PetSize size, int availableBays) {
    }

    @Transactional(readOnly = true)
    public List<Slot> availability(String storeId, String serviceId, PetSize size, LocalDate date) {
        Shop s = publicShop(storeId);
        GroomingService g = db.get(GroomingService.class, serviceId);
        if (!g.storeId.equals(storeId) || !g.active)
            throw ApiException.notFound("Serviço não disponível");
        Instant dayStart = date.atStartOfDay(ZoneId.of(s.timeZone)).toInstant(),
                dayEnd = date.plusDays(1).atStartOfDay(ZoneId.of(s.timeZone)).toInstant();
        if (dayStart.isAfter(clock.instant().plus(Duration.ofDays(180))))
            throw ApiException.invalid("Agenda disponível até 180 dias");
        var bays = db.list(Bay.class, "from Bay b where b.storeId=?1 and b.size=?2 and b.active=true", storeId, size);
        var result = new ArrayList<Slot>();
        for (Instant start = dayStart; start.isBefore(dayEnd); start = start.plusSeconds(900)) {
            if (start.isBefore(clock.instant().plusSeconds(7200)))
                continue;
            Instant end = start.plusSeconds(g.durationMinutes * 60L);
            int count = 0;
            for (Bay b : bays)
                if (bayAvailable(b.id, start, end, null))
                    count++;
            if (count > 0)
                result.add(new Slot(start, end, size, count));
        }
        return result;
    }
}
