package br.com.pethub.integration;

import br.com.pethub.dto.Requests;
import br.com.pethub.exception.ApiException;
import br.com.pethub.payment.PaymentWorker;
import br.com.pethub.repository.Db;
import br.com.pethub.service.CatalogService;
import br.com.pethub.service.OrderService;
import br.com.pethub.service.PetService;

import static br.com.pethub.domain.Domain.*;
import static org.assertj.core.api.Assertions.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.PlatformTransactionManager;

@SpringBootTest @ActiveProfiles("test") @Import(BusinessRulesTest.TimeConfig.class)
class BusinessRulesTest {
    static class MutableClock extends Clock {
        volatile Instant now=Instant.parse("2026-10-31T12:00:00Z");
        public ZoneId getZone() { return ZoneOffset.UTC; }
        public Clock withZone(ZoneId zone) { return this; }
        public Instant instant() { return now; }
    }
    @TestConfiguration static class TimeConfig { @Bean @Primary MutableClock testClock() { return new MutableClock(); } }
    @Autowired Db db; @Autowired CatalogService catalog; @Autowired OrderService orders; @Autowired PetService pets;
    @Autowired PaymentWorker worker; @Autowired MutableClock clock; @Autowired PlatformTransactionManager txManager;
    Account tutor,merchant,admin; Shop shop; Product product; GroomingService service,therapy; Pet pet; Bay bay; Instant start;
    TransactionTemplate tx;
    BigDecimal money(String value) { return new BigDecimal(value); }
    @BeforeEach void setup() {
        tx=new TransactionTemplate(txManager); clock.now=Instant.parse("2026-10-31T12:00:00Z"); start=clock.instant().plusSeconds(10800);
        tx.executeWithoutResult(status->{ tutor=user(Role.TUTOR); merchant=user(Role.LOJISTA); admin=user(Role.ADMIN); });
        shop=catalog.createShop(merchant,new Requests.ShopInput("PetShop","Loja","Rua A","Centro",-12.97,-38.50,10,15,money("8.00"),money("15.00"),"America/Bahia",null,null));
        catalog.approve(admin,shop.id);
        product=catalog.product(merchant,null,new Requests.ProductInput("Ração","Ração 1kg","RACOES",money("39.99"),10,"1kg",null,true));
        service=catalog.service(merchant,null,new Requests.ServiceInput("Banho","Banho","BANHO",60,money("60.00"),money("80.00"),money("100.00"),false,null,true));
        therapy=catalog.service(merchant,null,new Requests.ServiceInput("Terapêutico","Terapia","BANHO",30,money("20.00"),money("30.00"),money("40.00"),true,null,true));
        pet=pets.save(tutor,null,new Requests.PetInput("Luna",Species.CAO,"SRD","2 anos",money("10"),PetSize.PEQUENO,null,"Em dia",false));
        bay=catalog.bay(merchant,null,new Requests.BayInput("Baia 1",PetSize.PEQUENO,true));
        catalog.window(merchant,new Requests.WindowInput(bay.id,start.minusSeconds(3600),start.plusSeconds(21600)));
    }
    Account user(Role role) { Account a=new Account(); a.name=role.name(); a.email=UUID.randomUUID()+"@test.invalid"; a.passwordHash="not-used"; a.role=role; return db.save(a); }
    Requests.PaymentInput pix() { return new Requests.PaymentInput(PaymentMethod.PIX,null,null,null,1,null); }
    Requests.Checkout checkout(boolean booking,int qty) {
        return new Requests.Checkout(shop.id,qty==0?List.of():List.of(new Requests.Line(product.id,qty)),booking?new Requests.Booking(service.id,pet.id,start,false):null,Fulfillment.RETIRADA_HIBRIDA,null,null,null,pix());
    }
    Purchase place(boolean booking,int qty) { return orders.checkout(tutor,UUID.randomUUID().toString(),checkout(booking,qty)); }
    void pay(Purchase o) { for(Payment p:orders.detail(tutor,o.id).payments()) worker.process(p.id); }
    Purchase read(Purchase o) { return orders.detail(tutor,o.id).order(); }
    int stock() { return tx.execute(s->db.get(Product.class,product.id).stock); }
    void accept(Purchase o) { pay(o); orders.accept(merchant,o.id); pay(o); }
    void checkIn(Purchase o) { accept(o); clock.now=start; orders.checkIn(merchant,o.id); }

    @Test void serverPricesHybridPickupAndTenPercentSplit() {
        var req=new Requests.Checkout(shop.id,List.of(new Requests.Line(product.id,2)),new Requests.Booking(service.id,pet.id,start,true),Fulfillment.ENTREGA_LOCAL,"Rua B",-12.97,-38.50,pix());
        Purchase o=orders.checkout(tutor,UUID.randomUUID().toString(),req);
        assertThat(o.total).isEqualByComparingTo("154.98"); assertThat(o.platformTakeRateAmount).isEqualByComparingTo("15.50");
        assertThat(o.merchantNetAmount).isEqualByComparingTo("139.48"); assertThat(o.deliveryFee).isEqualByComparingTo("0");
        assertThat(o.fulfillmentMode).isEqualTo(Fulfillment.RETIRADA_HIBRIDA); assertThat(stock()).isEqualTo(8);
    }
    @Test void idempotencyDoesNotReserveOrChargeTwiceAndRejectsChangedBody() {
        String key=UUID.randomUUID().toString(); Purchase a=orders.checkout(tutor,key,checkout(false,2)),b=orders.checkout(tutor,key,checkout(false,2));
        assertThat(a.id).isEqualTo(b.id); assertThat(stock()).isEqualTo(8); assertThat(orders.detail(tutor,a.id).payments()).hasSize(1);
        assertThatThrownBy(()->orders.checkout(tutor,key,checkout(false,3))).isInstanceOf(ApiException.class);
    }
    @Test void exactTwoHoursAllowedButLessRejectedWithoutStockLoss() {
        start=clock.instant().plusSeconds(7199);
        assertThatThrownBy(()->place(true,2)).isInstanceOf(ApiException.class).hasMessageContaining("2 horas"); assertThat(stock()).isEqualTo(10);
        start=clock.instant().plusSeconds(7200); assertThat(place(true,1).id).isNotBlank();
    }
    @Test void overlappingIntervalsFailEvenWithDifferentStartAndAdjacentSlotsWork() {
        place(true,0); start=start.plusSeconds(1800);
        assertThatThrownBy(()->place(true,0)).isInstanceOf(ApiException.class).hasMessageContaining("baia");
        start=start.plusSeconds(1800); assertThat(place(true,0).id).isNotBlank();
    }
    @Test void concurrentCheckoutsCannotOversellStock() throws Exception {
        catalog.product(merchant,product.id,new Requests.ProductInput("Ração","","RACOES",money("39.99"),1,"1kg",null,true));
        var other=tx.execute(s->user(Role.TUTOR)); var barrier=new CyclicBarrier(2);
        try(var pool=Executors.newFixedThreadPool(2)) {
            var tasks=List.of(pool.submit(()->raceCheckout(tutor,checkout(false,1),barrier)),pool.submit(()->raceCheckout(other,checkout(false,1),barrier)));
            assertThat(tasks.get(0).get(15,TimeUnit.SECONDS)+tasks.get(1).get(15,TimeUnit.SECONDS)).isEqualTo(1);
        } assertThat(stock()).isZero();
    }
    int raceCheckout(Account a,Requests.Checkout r,CyclicBarrier barrier) throws Exception { barrier.await(); try { orders.checkout(a,UUID.randomUUID().toString(),r); return 1; } catch(ApiException e) { return 0; } }
    @Test void concurrentCheckoutsCannotDoubleBookBay() throws Exception {
        Account other=tx.execute(s->user(Role.TUTOR)); Pet otherPet=pets.save(other,null,new Requests.PetInput("Bob",Species.CAO,"SRD","1 ano",money("5"),PetSize.PEQUENO,null,"OK",false));
        Requests.Checkout r=new Requests.Checkout(shop.id,List.of(),new Requests.Booking(service.id,otherPet.id,start,false),Fulfillment.RETIRADA_HIBRIDA,null,null,null,pix());
        var barrier=new CyclicBarrier(2);
        try(var pool=Executors.newFixedThreadPool(2)) {
            var a=pool.submit(()->raceCheckout(tutor,checkout(true,0),barrier)); var b=pool.submit(()->raceCheckout(other,r,barrier));
            assertThat(a.get(15,TimeUnit.SECONDS)+b.get(15,TimeUnit.SECONDS)).isEqualTo(1);
        }
    }
    @Test void slaTimeoutRestoresResourcesAndRefundsExactlyOnce() {
        Purchase o=place(true,2); pay(o); clock.now=o.slaDeadline; orders.expire(o.id); orders.expire(o.id); pay(o);
        assertThat(read(o).status).isEqualTo(OrderStatus.RECUSADO_OU_TIMEOUT); assertThat(stock()).isEqualTo(10);
        Payment p=orders.detail(tutor,o.id).payments().getFirst(); assertThat(p.status).isEqualTo(PaymentStatus.ESTORNADO); assertThat(p.refundedAmount).isEqualByComparingTo(o.total);
        start=clock.instant().plusSeconds(7200); assertThat(place(true,0).id).isNotBlank();
    }
    @Test void acceptingAtDeadlineCancelsInsteadOfBypassingSla() {
        Purchase o=place(false,1); pay(o); clock.now=o.slaDeadline;
        assertThat(orders.accept(merchant,o.id).status).isEqualTo(OrderStatus.RECUSADO_OU_TIMEOUT); assertThat(stock()).isEqualTo(10);
    }
    @Test void noShowAtExactly15MinutesDoesNotFireButAfterDoesAndChargesOnlyService() {
        Purchase o=place(true,2); accept(o); clock.now=start.plusSeconds(900); orders.expire(o.id); assertThat(read(o).status).isEqualTo(OrderStatus.ACEITO_EM_PREPARO);
        clock.now=clock.now.plusSeconds(1); orders.expire(o.id); pay(o);
        assertThat(read(o).status).isEqualTo(OrderStatus.NO_SHOW); assertThat(read(o).noShowFee).isEqualByComparingTo("12.00"); assertThat(stock()).isEqualTo(10);
        assertThat(orders.detail(tutor,o.id).payments().getFirst().refundedAmount).isEqualByComparingTo(o.total.subtract(money("12")));
    }
    @Test void checkedInPetIsNotMarkedNoShow() { Purchase o=place(true,0); checkIn(o); clock.now=start.plusSeconds(901); orders.expire(o.id); assertThat(read(o).status).isEqualTo(OrderStatus.EM_ATENDIMENTO_ESTETICA); }
    @Test void sanitaryRequirementBlocksUntilTherapeuticAddonApprovedAndPaid() {
        Purchase o=place(true,1); checkIn(o); orders.triage(merchant,o.id,new Requests.Triage(true,false));
        assertThatThrownBy(()->orders.stage(merchant,o.id,Stage.BANHO)).isInstanceOf(ApiException.class).hasMessageContaining("RN-06");
        AddOn a=orders.addOn(merchant,o.id,new Requests.AddOnInput(null,therapy.id,1,"Ectoparasitas",true));
        var decision=new Requests.AddOnDecision(Decision.APROVADO,pix()); orders.decide(tutor,o.id,a.id,decision); orders.decide(tutor,o.id,a.id,decision);
        assertThatThrownBy(()->orders.stage(merchant,o.id,Stage.BANHO)).isInstanceOf(ApiException.class);
        pay(o); orders.decide(tutor,o.id,a.id,decision);
        assertThat(read(o).total).isEqualByComparingTo("119.99"); assertThat(orders.detail(tutor,o.id).payments()).hasSize(2);
        assertThat(orders.stage(merchant,o.id,Stage.BANHO).groomingStage).isEqualTo(Stage.BANHO);
    }
    @Test void rejectingRequiredBathBlocksAndAllowsFullSanitaryCancellation() {
        Purchase o=place(true,1); checkIn(o); orders.triage(merchant,o.id,new Requests.Triage(false,true));
        AddOn a=orders.addOn(merchant,o.id,new Requests.AddOnInput(null,therapy.id,1,"Dermatite",true)); orders.decide(tutor,o.id,a.id,new Requests.AddOnDecision(Decision.RECUSADO,null));
        assertThatThrownBy(()->orders.stage(merchant,o.id,Stage.BANHO)).isInstanceOf(ApiException.class);
        orders.cancelSanitary(merchant,o.id,"Tutor recusou tratamento"); pay(o); assertThat(stock()).isEqualTo(10);
        assertThat(orders.detail(tutor,o.id).payments().getFirst().refundedAmount).isEqualByComparingTo(o.total);
    }
    @Test void completionRequiresActualProgressAndReleasesRatingAndPetHistory() {
        Purchase o=place(true,1); checkIn(o); assertThatThrownBy(()->orders.complete(merchant,o.id)).isInstanceOf(ApiException.class);
        orders.triage(merchant,o.id,new Requests.Triage(false,false)); orders.stage(merchant,o.id,Stage.BANHO); orders.stage(merchant,o.id,Stage.FINALIZADO);
        orders.behavior(merchant,o.id,"Tranquilo durante o banho"); orders.ready(merchant,o.id); orders.complete(merchant,o.id);
        assertThat(orders.review(tutor,o.id,new Requests.ReviewInput(5,"Ótimo")).rating).isEqualTo(5);
        assertThatThrownBy(()->orders.review(tutor,o.id,new Requests.ReviewInput(4,"Outro"))).isInstanceOf(ApiException.class);
        assertThat((List<?>)pets.history(tutor,pet.id,0,20).get("notes")).hasSize(1);
        assertThat(tx.execute(s->db.list(Receivable.class,"from Receivable r where r.orderId=?1",o.id)).getFirst().expectedAt).isEqualTo(clock.instant().plus(Duration.ofDays(7)));
    }
    @Test void usersCannotReadOthersOrdersOrUseOthersPets() {
        Purchase o=place(false,1); Account other=tx.execute(s->user(Role.TUTOR));
        assertThatThrownBy(()->orders.detail(other,o.id)).isInstanceOf(ApiException.class).hasMessageContaining("permitido");
        assertThatThrownBy(()->orders.checkout(other,UUID.randomUUID().toString(),checkout(true,0))).isInstanceOf(ApiException.class);
    }
    @Test void discoverOnlyActiveNearbyShopsAndDeliveryEnforcesRadius() {
        assertThat(catalog.discover(-12.97,-38.50,5,"distance",0,100)).anyMatch(r->r.store().id.equals(shop.id));
        catalog.suspend(admin,shop.id); assertThat(catalog.discover(-12.97,-38.50,5,"time",0,100)).noneMatch(r->r.store().id.equals(shop.id));
        catalog.approve(admin,shop.id);
        var r=new Requests.Checkout(shop.id,List.of(new Requests.Line(product.id,1)),null,Fulfillment.ENTREGA_LOCAL,"Muito longe",0.0,0.0,pix());
        assertThatThrownBy(()->orders.checkout(tutor,UUID.randomUUID().toString(),r)).isInstanceOf(ApiException.class).hasMessageContaining("raio"); assertThat(stock()).isEqualTo(10);
    }
    @Test void rejectFreesStockAndBayAndUnattemptedPaymentNeverCharges() {
        Purchase o=place(true,1); orders.reject(merchant,o.id,"Baia em manutenção"); pay(o);
        assertThat(stock()).isEqualTo(10); assertThat(orders.detail(tutor,o.id).payments().getFirst().status).isEqualTo(PaymentStatus.CANCELADO);
        assertThat(place(true,0).id).isNotBlank();
    }
    @Test void addonExtensionCannotOverlapFollowingBooking() {
        Purchase o=place(true,0); start=start.plusSeconds(3600); place(true,0); start=start.minusSeconds(3600); checkIn(o);
        orders.triage(merchant,o.id,new Requests.Triage(true,false)); AddOn a=orders.addOn(merchant,o.id,new Requests.AddOnInput(null,therapy.id,1,"Tratamento",true));
        assertThatThrownBy(()->orders.decide(tutor,o.id,a.id,new Requests.AddOnDecision(Decision.APROVADO,pix()))).isInstanceOf(ApiException.class).hasMessageContaining("baia");
    }
    @Test void splitRoundingAcrossAddonChargesMatchesGrossCommission() {
        service=catalog.service(merchant,service.id,new Requests.ServiceInput("Banho","","BANHO",60,money("0.05"),money("1"),money("1"),false,null,true));
        product=catalog.product(merchant,product.id,new Requests.ProductInput("Item","","OUTROS",money("0.05"),10,"un",null,true));
        Purchase o=place(true,0); checkIn(o); orders.triage(merchant,o.id,new Requests.Triage(false,false));
        AddOn a=orders.addOn(merchant,o.id,new Requests.AddOnInput(product.id,null,1,"Extra",false));
        orders.decide(tutor,o.id,a.id,new Requests.AddOnDecision(Decision.APROVADO,pix())); pay(o);
        BigDecimal fees=orders.detail(tutor,o.id).payments().stream().map(p->p.platformFee).reduce(BigDecimal.ZERO,BigDecimal::add);
        assertThat(fees).isEqualByComparingTo("0.01"); assertThat(read(o).platformTakeRateAmount).isEqualByComparingTo(fees);
    }
}
