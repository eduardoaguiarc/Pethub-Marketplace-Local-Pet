package br.com.pethub.controller;

import br.com.pethub.dto.Requests;
import br.com.pethub.exception.ApiException;
import br.com.pethub.integration.mercadopago.MercadoPagoAccounts;
import br.com.pethub.integration.mercadopago.WebhookService;
import br.com.pethub.repository.Db;
import br.com.pethub.security.AuthService;
import br.com.pethub.service.CatalogService;
import br.com.pethub.service.OrderService;
import br.com.pethub.service.PetService;

import static br.com.pethub.domain.Domain.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.*;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

@RestController
@RequestMapping("/api/v1")
@Validated
@SecurityRequirement(name = "bearerAuth")
@io.swagger.v3.oas.annotations.responses.ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Formato ou validação inválida (Problem Details)"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Credencial ou assinatura inválida"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Perfil ou proprietário sem permissão"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Recurso não encontrado"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Regra de negócio ou concorrência impediu a operação")
})
public class ApiController {
    final AuthService auth;
    final PetService pets;
    final CatalogService catalog;
    final OrderService orders;
    final Db db;
    final MercadoPagoAccounts mp;
    final WebhookService webhooks;

    public ApiController(AuthService auth, PetService pets, CatalogService catalog, OrderService orders, Db db,
            MercadoPagoAccounts mp, WebhookService webhooks) {
        this.auth = auth;
        this.pets = pets;
        this.catalog = catalog;
        this.orders = orders;
        this.db = db;
        this.mp = mp;
        this.webhooks = webhooks;
    }

    @PostMapping("/auth/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthService.AuthResult register(@Valid @RequestBody Requests.Register r) {
        return auth.register(r);
    }

    @PostMapping("/auth/login")
    public AuthService.AuthResult login(@Valid @RequestBody Requests.Login r) {
        return auth.login(r);
    }

    @PostMapping("/auth/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@RequestHeader("Authorization") String token) {
        auth.logout(token.substring(7));
    }

    @GetMapping("/auth/me")
    public Account me(@AuthenticationPrincipal Account a) {
        return a;
    }

    @GetMapping("/pets")
    public List<Pet> pets(@AuthenticationPrincipal Account a,
            @RequestParam(defaultValue = "0") @Min(0) @Max(100000) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return pets.list(a, page, size);
    }

    @PostMapping("/pets")
    @ResponseStatus(HttpStatus.CREATED)
    public Pet pet(@AuthenticationPrincipal Account a, @Valid @RequestBody Requests.PetInput r) {
        return pets.save(a, null, r);
    }

    @PutMapping("/pets/{id}")
    public Pet pet(@AuthenticationPrincipal Account a, @PathVariable String id,
            @Valid @RequestBody Requests.PetInput r) {
        return pets.save(a, id, r);
    }

    @DeleteMapping("/pets/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePet(@AuthenticationPrincipal Account a, @PathVariable String id) {
        pets.delete(a, id);
    }

    @GetMapping("/pets/{id}/history")
    public Map<String, Object> history(@AuthenticationPrincipal Account a, @PathVariable String id,
            @RequestParam(defaultValue = "0") @Min(0) @Max(100000) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return pets.history(a, id, page, size);
    }

    @GetMapping("/stores")
    public List<CatalogService.StoreResult> stores(@RequestParam double latitude, @RequestParam double longitude,
            @RequestParam(defaultValue = "10") double radiusKm, @RequestParam(defaultValue = "distance") String sort,
            @RequestParam(defaultValue = "0") @Min(0) @Max(100000) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return catalog.discover(latitude, longitude, radiusKm, sort, page, size);
    }

    @GetMapping("/stores/{id}")
    public Shop store(@PathVariable String id) {
        return catalog.publicShop(id);
    }

    @GetMapping("/stores/{id}/payment-config")
    public Map<String, Object> paymentConfig(@PathVariable String id) {
        catalog.publicShop(id);
        if (orders.localPaymentMode())
            return Map.of("mode", "local", "simulated", true);
        var account = db.list(PaymentAccount.class, "from PaymentAccount a where a.storeId=?1", id);
        return Map.of("mode", "mercadopago", "simulated", false, "publicKey",
                account.isEmpty() || account.getFirst().publicKey == null ? "" : account.getFirst().publicKey);
    }

    @GetMapping("/stores/{id}/products")
    public List<Product> products(@PathVariable String id, @RequestParam(defaultValue = "") @Size(max = 100) String q,
            @RequestParam(defaultValue = "0") @Min(0) @Max(100000) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        catalog.publicShop(id);
        return db.page(Product.class,
                "from Product p where p.storeId=?1 and p.active=true and lower(p.name) like ?2 order by p.name,p.id",
                page * size, size, id, "%" + q.toLowerCase(Locale.ROOT) + "%");
    }

    @GetMapping("/stores/{id}/services")
    public List<GroomingService> services(@PathVariable String id,
            @RequestParam(defaultValue = "0") @Min(0) @Max(100000) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        catalog.publicShop(id);
        return db.page(GroomingService.class,
                "from GroomingService g where g.storeId=?1 and g.active=true order by g.name,g.id", page * size, size,
                id);
    }

    @GetMapping("/stores/{id}/availability")
    public List<CatalogService.Slot> availability(@PathVariable String id, @RequestParam String serviceId,
            @RequestParam PetSize size, @RequestParam LocalDate date) {
        return catalog.availability(id, serviceId, size, date);
    }

    @GetMapping("/stores/{id}/reviews")
    public List<Review> reviews(@PathVariable String id,
            @RequestParam(defaultValue = "0") @Min(0) @Max(100000) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        catalog.publicShop(id);
        return db.page(Review.class, "from Review r where r.storeId=?1 order by r.createdAt desc,r.id", page * size,
                size, id);
    }

    @PostMapping("/merchant/store")
    @ResponseStatus(HttpStatus.CREATED)
    public Shop createShop(@AuthenticationPrincipal Account a, @Valid @RequestBody Requests.ShopInput r) {
        return catalog.createShop(a, r);
    }

    @GetMapping("/merchant/store")
    public Shop owned(@AuthenticationPrincipal Account a) {
        return catalog.ownedShop(a, false);
    }

    @PutMapping("/merchant/store")
    public Shop update(@AuthenticationPrincipal Account a, @Valid @RequestBody Requests.ShopInput r) {
        return catalog.updateShop(a, r);
    }

    @GetMapping("/admin/stores")
    public List<Shop> pendingStores(@RequestParam(defaultValue = "0") @Min(0) @Max(100000) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return db.page(Shop.class, "from Shop s order by s.status,s.name,s.id", page * size, size);
    }

    @PostMapping("/admin/stores/{id}/approve")
    public Shop approve(@AuthenticationPrincipal Account a, @PathVariable String id) {
        return catalog.approve(a, id);
    }

    @PostMapping("/admin/stores/{id}/suspend")
    public Shop suspend(@AuthenticationPrincipal Account a, @PathVariable String id) {
        return catalog.suspend(a, id);
    }

    @PostMapping("/merchant/products")
    @ResponseStatus(HttpStatus.CREATED)
    public Product createProduct(@AuthenticationPrincipal Account a, @Valid @RequestBody Requests.ProductInput r) {
        return catalog.product(a, null, r);
    }

    @PutMapping("/merchant/products/{id}")
    public Product updateProduct(@AuthenticationPrincipal Account a, @PathVariable String id,
            @Valid @RequestBody Requests.ProductInput r) {
        return catalog.product(a, id, r);
    }

    @PostMapping("/merchant/services")
    @ResponseStatus(HttpStatus.CREATED)
    public GroomingService createService(@AuthenticationPrincipal Account a,
            @Valid @RequestBody Requests.ServiceInput r) {
        return catalog.service(a, null, r);
    }

    @PutMapping("/merchant/services/{id}")
    public GroomingService updateService(@AuthenticationPrincipal Account a, @PathVariable String id,
            @Valid @RequestBody Requests.ServiceInput r) {
        return catalog.service(a, id, r);
    }

    @PostMapping("/merchant/bays")
    @ResponseStatus(HttpStatus.CREATED)
    public Bay createBay(@AuthenticationPrincipal Account a, @Valid @RequestBody Requests.BayInput r) {
        return catalog.bay(a, null, r);
    }

    @PutMapping("/merchant/bays/{id}")
    public Bay updateBay(@AuthenticationPrincipal Account a, @PathVariable String id,
            @Valid @RequestBody Requests.BayInput r) {
        return catalog.bay(a, id, r);
    }

    @PostMapping("/merchant/windows")
    @ResponseStatus(HttpStatus.CREATED)
    public BayWindow createWindow(@AuthenticationPrincipal Account a, @Valid @RequestBody Requests.WindowInput r) {
        return catalog.window(a, r);
    }

    @DeleteMapping("/merchant/windows/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeWindow(@AuthenticationPrincipal Account a, @PathVariable String id) {
        catalog.removeWindow(a, id);
    }

    @GetMapping("/merchant/products")
    public List<Product> merchantProducts(@AuthenticationPrincipal Account a,
            @RequestParam(defaultValue = "0") @Min(0) @Max(100000) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return db.page(Product.class, "from Product p where p.storeId=?1 order by p.name,p.id", page * size, size,
                catalog.ownedShop(a, false).id);
    }

    @GetMapping("/merchant/services")
    public List<GroomingService> merchantServices(@AuthenticationPrincipal Account a,
            @RequestParam(defaultValue = "0") @Min(0) @Max(100000) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return db.page(GroomingService.class, "from GroomingService g where g.storeId=?1 order by g.name,g.id",
                page * size, size, catalog.ownedShop(a, false).id);
    }

    @GetMapping("/merchant/bays")
    public List<Bay> bays(@AuthenticationPrincipal Account a) {
        return db.list(Bay.class, "from Bay b where b.storeId=?1 order by b.name,b.id", catalog.ownedShop(a, false).id);
    }

    @GetMapping("/merchant/windows")
    public List<BayWindow> windows(@AuthenticationPrincipal Account a, @RequestParam Instant from,
            @RequestParam Instant to) {
        if (!from.isBefore(to) || Duration.between(from, to).toDays() > 31)
            throw ApiException.invalid("Consulte até 31 dias de agenda");
        return db.list(BayWindow.class,
                "from BayWindow w where w.storeId=?1 and w.startsAt<?2 and w.endsAt>?3 order by w.startsAt",
                catalog.ownedShop(a, false).id, to, from);
    }

    @PostMapping("/orders")
    @ResponseStatus(HttpStatus.CREATED)
    public Purchase checkout(@AuthenticationPrincipal Account a, @RequestHeader("Idempotency-Key") String key,
            @Valid @RequestBody Requests.Checkout r) {
        return orders.checkout(a, key, r);
    }

    @GetMapping("/orders")
    public List<Purchase> orders(@AuthenticationPrincipal Account a,
            @RequestParam(defaultValue = "0") @Min(0) @Max(100000) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return db.page(Purchase.class, "from Purchase o where o.tutorId=?1 order by o.createdAt desc,o.id", page * size,
                size, a.id);
    }

    @GetMapping("/orders/{id}")
    public OrderService.Detail order(@AuthenticationPrincipal Account a, @PathVariable String id) {
        return orders.detail(a, id);
    }

    @GetMapping("/orders/{id}/payments")
    public List<Payment> payments(@AuthenticationPrincipal Account a, @PathVariable String id) {
        return orders.detail(a, id).payments();
    }

    @PostMapping("/orders/{id}/cancel")
    public Purchase cancel(@AuthenticationPrincipal Account a, @PathVariable String id,
            @Valid @RequestBody Requests.Reason r) {
        return orders.cancelByTutor(a, id, r.reason());
    }

    @GetMapping("/merchant/orders")
    public List<Purchase> merchantOrders(@AuthenticationPrincipal Account a,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "0") @Min(0) @Max(100000) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        String store = catalog.ownedShop(a, false).id;
        return status == null
                ? db.page(Purchase.class, "from Purchase o where o.storeId=?1 order by o.createdAt desc,o.id",
                        page * size, size, store)
                : db.page(Purchase.class,
                        "from Purchase o where o.storeId=?1 and o.status=?2 order by o.createdAt desc,o.id",
                        page * size, size, store, status);
    }

    @GetMapping("/merchant/orders/{id}/work-order")
    public OrderService.Detail workOrder(@AuthenticationPrincipal Account a, @PathVariable String id) {
        return orders.detail(a, id);
    }

    @PostMapping("/merchant/orders/{id}/accept")
    public Purchase accept(@AuthenticationPrincipal Account a, @PathVariable String id) {
        return orders.accept(a, id);
    }

    @PostMapping("/merchant/orders/{id}/reject")
    public Purchase reject(@AuthenticationPrincipal Account a, @PathVariable String id,
            @Valid @RequestBody Requests.Reason r) {
        return orders.reject(a, id, r.reason());
    }

    @PostMapping("/merchant/orders/{id}/check-in")
    public Purchase checkIn(@AuthenticationPrincipal Account a, @PathVariable String id) {
        return orders.checkIn(a, id);
    }

    @PostMapping("/merchant/orders/{id}/triage")
    public Purchase triage(@AuthenticationPrincipal Account a, @PathVariable String id,
            @Valid @RequestBody Requests.Triage r) {
        return orders.triage(a, id, r);
    }

    @PostMapping("/merchant/orders/{id}/stage")
    public Purchase stage(@AuthenticationPrincipal Account a, @PathVariable String id,
            @Valid @RequestBody Requests.StageInput r) {
        return orders.stage(a, id, r.stage());
    }

    @PostMapping("/merchant/orders/{id}/ready")
    public Purchase ready(@AuthenticationPrincipal Account a, @PathVariable String id) {
        return orders.ready(a, id);
    }

    @PostMapping("/merchant/orders/{id}/dispatch")
    public Purchase dispatch(@AuthenticationPrincipal Account a, @PathVariable String id) {
        return orders.dispatch(a, id);
    }

    @PostMapping("/merchant/orders/{id}/complete")
    public Purchase complete(@AuthenticationPrincipal Account a, @PathVariable String id) {
        return orders.complete(a, id);
    }

    @PostMapping("/merchant/orders/{id}/cancel-sanitary")
    public Purchase cancelSanitary(@AuthenticationPrincipal Account a, @PathVariable String id,
            @Valid @RequestBody Requests.Reason r) {
        return orders.cancelSanitary(a, id, r.reason());
    }

    @PostMapping("/merchant/orders/{id}/addons")
    @ResponseStatus(HttpStatus.CREATED)
    public AddOn addOn(@AuthenticationPrincipal Account a, @PathVariable String id,
            @Valid @RequestBody Requests.AddOnInput r) {
        return orders.addOn(a, id, r);
    }

    @PostMapping("/orders/{id}/addons/{addonId}/decision")
    public AddOn decide(@AuthenticationPrincipal Account a, @PathVariable String id, @PathVariable String addonId,
            @Valid @RequestBody Requests.AddOnDecision r) {
        return orders.decide(a, id, addonId, r);
    }

    @PostMapping("/orders/{id}/review")
    @ResponseStatus(HttpStatus.CREATED)
    public Review review(@AuthenticationPrincipal Account a, @PathVariable String id,
            @Valid @RequestBody Requests.ReviewInput r) {
        return orders.review(a, id, r);
    }

    @PostMapping("/merchant/orders/{id}/behavior")
    @ResponseStatus(HttpStatus.CREATED)
    public BehaviorNote behavior(@AuthenticationPrincipal Account a, @PathVariable String id,
            @Valid @RequestBody Requests.NoteInput r) {
        return orders.behavior(a, id, r.note());
    }

    @GetMapping("/merchant/receivables")
    public List<Receivable> receivables(@AuthenticationPrincipal Account a,
            @RequestParam(defaultValue = "0") @Min(0) @Max(100000) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return db.page(Receivable.class, "from Receivable r where r.storeId=?1 order by r.expectedAt desc,r.id",
                page * size, size, catalog.ownedShop(a, false).id);
    }

    @PutMapping("/merchant/payout-preference")
    @Transactional
    public Shop payout(@AuthenticationPrincipal Account a, @Valid @RequestBody Requests.PayoutInput r) {
        Shop s = catalog.ownedShop(a, true);
        s.advancePayout = r.advancePayout();
        return s;
    }

    @PostMapping("/merchant/mercadopago/connect")
    public Map<String, String> connect(@AuthenticationPrincipal Account a) {
        return mp.connect(a);
    }

    @PostMapping("/merchant/mercadopago/callback")
    public Map<String, Object> callback(@AuthenticationPrincipal Account a, @Valid @RequestBody Requests.OAuthInput r) {
        return mp.exchange(a, r);
    }

    @PostMapping("/webhooks/mercadopago")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void webhook(@RequestParam(name = "data.id", required = false) String dataId,
            @RequestHeader(name = "x-signature", required = false) String signature,
            @RequestHeader(name = "x-request-id", required = false) String requestId) {
        webhooks.receive(dataId, signature, requestId);
    }
}
