package br.com.pethub.integration;

import br.com.pethub.dto.Requests;
import br.com.pethub.exception.ApiException;
import br.com.pethub.integration.mercadopago.MercadoPagoAccounts;
import br.com.pethub.integration.mercadopago.WebhookService;
import br.com.pethub.payment.PaymentWorker;
import br.com.pethub.repository.Db;
import br.com.pethub.security.Crypto;
import br.com.pethub.service.OrderService;

import static br.com.pethub.domain.Domain.*;
import static org.assertj.core.api.Assertions.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;

@EnabledIfEnvironmentVariable(named="MP_SIMULATION_URL",matches="http://127\\.0\\.0\\.1:[0-9]+/mercadopago")
@SpringBootTest(properties={"pethub.payment-mode=mercadopago","pethub.mp.base-url=${MP_SIMULATION_URL}",
    "pethub.encryption-key=MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=","pethub.mp.client-id=simulation-client",
    "pethub.mp.client-secret=simulation-secret","spring.datasource.url=jdbc:h2:mem:mp-simulation;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1"})
@ActiveProfiles("test") @Import(BusinessRulesTest.TimeConfig.class)
class MercadoPagoSimulationTest {
    @Autowired Db db; @Autowired OrderService orders; @Autowired PaymentWorker worker; @Autowired Crypto crypto;
    @Autowired BusinessRulesTest.MutableClock clock; @Autowired PlatformTransactionManager tm;
    @Autowired MercadoPagoAccounts accounts; @Autowired WebhookService webhooks;
    TransactionTemplate tx; RestClient control; Account tutor,merchant; Shop shop; Product product;
    @BeforeEach void setup() {
        clock.now=Instant.parse("2026-10-31T12:00:00Z"); tx=new TransactionTemplate(tm);
        control=RestClient.builder().baseUrl(System.getenv("MP_SIMULATION_URL")).build(); control.post().uri("/__reset").retrieve().toBodilessEntity();
        tx.executeWithoutResult(s->{
            tutor=user(Role.TUTOR); merchant=user(Role.LOJISTA);
            shop=new Shop(); shop.ownerId=merchant.id; shop.name="Simulation"; shop.status=StoreStatus.ATIVA; shop.deliveryFee=BigDecimal.ZERO; shop.taxiDogFee=BigDecimal.ZERO; shop.timeZone="America/Bahia"; db.save(shop);
            product=new Product(); product.storeId=shop.id; product.name="Ração"; product.price=new BigDecimal("100.00"); product.stock=10; db.save(product);
            PaymentAccount a=new PaymentAccount(); a.storeId=shop.id; a.accessToken=crypto.encrypt("simulation-seller-token"); a.refreshToken=crypto.encrypt("simulation-refresh-token"); a.expiresAt=clock.instant().plusSeconds(3600); a.providerUserId="12345"; db.save(a);
        });
    }
    Account user(Role role) { Account a=new Account(); a.name="Test"; a.email=UUID.randomUUID()+"@test.invalid"; a.passwordHash="unused"; a.role=role; return db.save(a); }
    Purchase place(PaymentMethod method) {
        var payment=new Requests.PaymentInput(method,"simulation-card-token","visa",null,1,null);
        return orders.checkout(tutor,UUID.randomUUID().toString(),new Requests.Checkout(shop.id,List.of(new Requests.Line(product.id,1)),null,Fulfillment.RETIRADA_HIBRIDA,null,null,null,payment));
    }
    Payment payment(Purchase o) { return orders.detail(tutor,o.id).payments().getFirst(); }
    void process(Purchase o) { worker.process(payment(o).id); }
    void control(Map<String,Object> body) { control.post().uri("/__control").body(body).retrieve().toBodilessEntity(); }
    JsonNode state() { return control.get().uri("/__state").retrieve().body(JsonNode.class); }
    @Test void cardUsesSellerTokenAndTenPercentFeeThenCapturesAfterAcceptance() {
        Purchase o=place(PaymentMethod.CARTAO); process(o); assertThat(payment(o).status).isEqualTo(PaymentStatus.AUTORIZADO);
        orders.accept(merchant,o.id); process(o); assertThat(payment(o).status).isEqualTo(PaymentStatus.PAGO);
        JsonNode request=state().path("requests").get(0); assertThat(request.path("fee").decimalValue()).isEqualByComparingTo("10.00"); assertThat(request.path("capture").asBoolean()).isFalse();
        assertThat(payment(o).providerReleaseDate).isNotNull(); assertThat(payment(o).encryptedRequest).isNull();
    }
    @Test void pixRequiresProviderConfirmationAndSignedWebhookOnlyWakesReconciliation() throws Exception {
        control(Map.of("pixPending",true)); Purchase o=place(PaymentMethod.PIX); process(o);
        assertThat(payment(o).status).isEqualTo(PaymentStatus.PENDENTE); assertThat(payment(o).qrCode).isEqualTo("SIMULATED-NOT-A-REAL-PIX");
        assertThatThrownBy(()->orders.accept(merchant,o.id)).isInstanceOf(ApiException.class);
        Payment p=payment(o); control.post().uri("/__approve/"+p.providerId).retrieve().toBodilessEntity();
        String rid="request-123",ts=Long.toString(clock.instant().getEpochSecond());
        Mac mac=Mac.getInstance("HmacSHA256"); mac.init(new SecretKeySpec("test-webhook-secret-not-for-production".getBytes(StandardCharsets.UTF_8),"HmacSHA256"));
        String signature="ts="+ts+",v1="+HexFormat.of().formatHex(mac.doFinal(("id:"+p.providerId+";request-id:"+rid+";ts:"+ts+";").getBytes(StandardCharsets.UTF_8)));
        webhooks.receive(p.providerId,signature,rid); webhooks.receive(p.providerId,signature,rid); process(o);
        assertThat(payment(o).status).isEqualTo(PaymentStatus.PAGO); orders.accept(merchant,o.id); orders.ready(merchant,o.id); orders.complete(merchant,o.id);
        assertThat(state().path("payments").size()).isEqualTo(1);
    }
    @Test void ambiguousCreateFailureReusesTheSameKeyAndNeverDoubleCharges() {
        control(Map.of("failCreateAfterWrite",true)); Purchase o=place(PaymentMethod.PIX); process(o);
        assertThat(payment(o).status).isEqualTo(PaymentStatus.CRIADO); assertThat(payment(o).errorCode).isEqualTo("PROVIDER_HTTP_503");
        assertThat(state().path("payments").size()).isEqualTo(1);
        clock.now=clock.instant().plusSeconds(60); process(o); assertThat(payment(o).status).isEqualTo(PaymentStatus.PAGO);
        JsonNode requests=state().path("requests"); assertThat(requests.get(0).path("key").asString()).isEqualTo(requests.get(1).path("key").asString());
        assertThat(state().path("payments").size()).isEqualTo(1);
    }
    @Test void refundOutageDoesNotReportMoneyReturnedAndRetriesDurably() {
        Purchase o=place(PaymentMethod.PIX); process(o); orders.reject(merchant,o.id,"Indisponível"); control(Map.of("failRefund",true)); process(o);
        assertThat(payment(o).refundedAmount).isEqualByComparingTo("0"); assertThat(payment(o).errorCode).isEqualTo("PROVIDER_HTTP_503");
        int availableStock=tx.execute(s->db.get(Product.class,product.id).stock); assertThat(availableStock).isEqualTo(10);
        clock.now=clock.instant().plusSeconds(300); process(o); assertThat(payment(o).status).isEqualTo(PaymentStatus.ESTORNADO);
        assertThat(payment(o).refundedAmount).isEqualByComparingTo("100");
    }
    @Test void cancellingAfterAmbiguousCreateStillFindsAndRefundsOriginalCharge() {
        control(Map.of("failCreateAfterWrite",true)); Purchase o=place(PaymentMethod.PIX); process(o);
        orders.cancelByTutor(tutor,o.id,"Desisti"); process(o);
        assertThat(payment(o).status).isEqualTo(PaymentStatus.ESTORNADO); assertThat(state().path("payments").size()).isEqualTo(1);
    }
    @Test void oauthStateIsBoundToStoreAndSingleUseAndTokensAreEncrypted() {
        String url=accounts.connect(merchant).get("authorizationUrl");
        String state=Arrays.stream(URI.create(url).getQuery().split("&")).filter(p->p.startsWith("state=")).map(p->URLDecoder.decode(p.substring(6),StandardCharsets.UTF_8)).findFirst().orElseThrow();
        var request=new Requests.OAuthInput("simulation-code",state); assertThat(accounts.exchange(merchant,request)).containsEntry("connected",true);
        assertThatThrownBy(()->accounts.exchange(merchant,request)).isInstanceOf(ApiException.class);
        PaymentAccount a=tx.execute(s->db.list(PaymentAccount.class,"from PaymentAccount a where a.storeId=?1",shop.id).getFirst());
        assertThat(a.accessToken).doesNotContain("simulation-seller-token"); assertThat(crypto.decrypt(a.accessToken)).isEqualTo("simulation-seller-token");
    }
}
