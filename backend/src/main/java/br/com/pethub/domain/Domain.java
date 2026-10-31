package br.com.pethub.domain;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Persisted aggregates. IDs are explicit rather than lazy relations; API never
 * exposes credentials.
 */
public final class Domain {
    private Domain() {
    }

    public enum Role {
        TUTOR, LOJISTA, ADMIN
    }

    public enum PetSize {
        PEQUENO, MEDIO, GRANDE
    }

    public enum Species {
        CAO, GATO
    }

    public enum StoreStatus {
        PENDENTE, ATIVA, SUSPENSA
    }

    public enum OrderStatus {
        PENDENTE_CONFIRMACAO, ACEITO_EM_PREPARO, EM_ATENDIMENTO_ESTETICA, PRONTO_RETIRADA, SAIU_PARA_ENTREGA, CONCLUIDO,
        RECUSADO_OU_TIMEOUT, CANCELADO, NO_SHOW
    }

    public enum Fulfillment {
        ENTREGA_LOCAL, RETIRADA_HIBRIDA
    }

    public enum PaymentMethod {
        PIX, CARTAO
    }

    public enum Decision {
        PENDENTE_TUTOR, AGUARDANDO_PAGAMENTO, APROVADO, RECUSADO
    }

    public enum Stage {
        NAO_INICIADO, TRIAGEM, BANHO, TOSA, FINALIZADO
    }

    public enum PaymentStatus {
        CRIADO, PENDENTE, AUTORIZADO, PAGO, RECUSADO, CANCELADO, ESTORNADO, PARCIALMENTE_ESTORNADO, CONTESTADO
    }

    @MappedSuperclass
    public abstract static class Base {
        @Id
        @Column(length = 36)
        public String id = UUID.randomUUID().toString();
        @Version
        @JsonIgnore
        public long version;
    }

    @Entity(name = "Account")
    @Table(name = "accounts")
    public static class Account extends Base {
        public String name;
        @Column(unique = true)
        public String email;
        @JsonIgnore
        public String passwordHash;
        @Enumerated(EnumType.STRING)
        public Role role;
        public String address;
        public boolean active = true;
    }

    @Entity(name = "Session")
    @Table(name = "sessions")
    public static class Session extends Base {
        public String accountId;
        @JsonIgnore
        @Column(unique = true)
        public String tokenHash;
        public Instant expiresAt;
    }

    @Entity(name = "Pet")
    @Table(name = "pets")
    public static class Pet extends Base {
        public String ownerId;
        public String name;
        @Enumerated(EnumType.STRING)
        public Species species;
        public String breed;
        public String ageLabel;
        public BigDecimal weightKg;
        @Enumerated(EnumType.STRING)
        public PetSize size;
        public String avatarUrl;
        public String vaccineStatus;
        public boolean severeDermatitisHistory;
        public boolean active = true;
    }

    @Entity(name = "Shop")
    @Table(name = "shops")
    public static class Shop extends Base {
        @Column(unique = true)
        public String ownerId;
        public String name;
        public String description;
        public String address;
        public String neighborhood;
        public double latitude;
        public double longitude;
        public double serviceRadiusKm;
        public int deliveryPreparationMinutes;
        public BigDecimal deliveryFee;
        public BigDecimal taxiDogFee;
        public String timeZone;
        public String logoUrl;
        public String bannerUrl;
        @Enumerated(EnumType.STRING)
        public StoreStatus status = StoreStatus.PENDENTE;
        public boolean advancePayout;
        public boolean sponsored;
    }

    @Entity(name = "Product")
    @Table(name = "products")
    public static class Product extends Base {
        public String storeId;
        public String name;
        public String description;
        public String category;
        public BigDecimal price;
        public int stock;
        public String unitLabel;
        public String imageUrl;
        public boolean active = true;
    }

    @Entity(name = "GroomingService")
    @Table(name = "grooming_services")
    public static class GroomingService extends Base {
        public String storeId;
        public String name;
        public String description;
        public String category;
        public int durationMinutes;
        public BigDecimal smallPrice;
        public BigDecimal mediumPrice;
        public BigDecimal largePrice;
        public boolean therapeutic;
        public String imageUrl;
        public boolean active = true;

        public BigDecimal price(PetSize size) {
            return switch (size) {
                case PEQUENO -> smallPrice;
                case MEDIO -> mediumPrice;
                case GRANDE -> largePrice;
            };
        }
    }

    @Entity(name = "Bay")
    @Table(name = "bays")
    public static class Bay extends Base {
        public String storeId;
        public String name;
        @Enumerated(EnumType.STRING)
        public PetSize size;
        public boolean active = true;
    }

    @Entity(name = "BayWindow")
    @Table(name = "bay_windows")
    public static class BayWindow extends Base {
        public String storeId;
        public String bayId;
        public Instant startsAt;
        public Instant endsAt;
    }

    @Entity(name = "Purchase")
    @Table(name = "purchases", uniqueConstraints = @UniqueConstraint(columnNames = { "tutor_id", "idempotency_key" }))
    public static class Purchase extends Base {
        public String tutorId;
        public String storeId;
        public Instant createdAt;
        public Instant slaDeadline;
        public Instant acceptedAt;
        public Instant completedAt;
        @JsonIgnore
        public String idempotencyKey;
        @JsonIgnore
        public String requestHash;
        @Enumerated(EnumType.STRING)
        public OrderStatus status = OrderStatus.PENDENTE_CONFIRMACAO;
        @Enumerated(EnumType.STRING)
        public Fulfillment fulfillmentMode;
        @Enumerated(EnumType.STRING)
        public PaymentMethod paymentMethod;
        public String deliveryAddress;
        public BigDecimal subtotal = BigDecimal.ZERO;
        public BigDecimal deliveryFee = BigDecimal.ZERO;
        public BigDecimal total = BigDecimal.ZERO;
        public BigDecimal platformTakeRateAmount = BigDecimal.ZERO;
        public BigDecimal merchantNetAmount = BigDecimal.ZERO;
        public BigDecimal noShowFee = BigDecimal.ZERO;
        public String rejectionReason;
        public boolean resourcesReleased;
        public String petId;
        public String serviceId;
        public String serviceName;
        public boolean therapeuticService;
        public String petName;
        @Enumerated(EnumType.STRING)
        public PetSize petSize;
        public String bayId;
        public Instant scheduledAt;
        public Instant scheduledEnd;
        public BigDecimal servicePrice = BigDecimal.ZERO;
        public BigDecimal taxiDogFee = BigDecimal.ZERO;
        public boolean taxiDog;
        public boolean bayReleased;
        public Instant checkedInAt;
        public boolean triageDone;
        public boolean sanitaryRequired;
        @Enumerated(EnumType.STRING)
        public Stage groomingStage = Stage.NAO_INICIADO;
    }

    @Entity(name = "OrderItem")
    @Table(name = "order_items")
    public static class OrderItem extends Base {
        public String orderId;
        public String productId;
        public String productName;
        public int quantity;
        public BigDecimal unitPrice;
    }

    @Entity(name = "AddOn")
    @Table(name = "addons")
    public static class AddOn extends Base {
        public String orderId;
        public String productId;
        public String serviceId;
        public String title;
        public String reason;
        public BigDecimal price;
        public int quantity;
        public int durationMinutes;
        public boolean mandatorySanitary;
        public boolean stockReserved;
        @Enumerated(EnumType.STRING)
        public Decision status = Decision.PENDENTE_TUTOR;
    }

    @Entity(name = "Review")
    @Table(name = "reviews")
    public static class Review extends Base {
        @Column(unique = true)
        public String orderId;
        public String storeId;
        public int rating;
        public String comment;
        public Instant createdAt;
    }

    @Entity(name = "BehaviorNote")
    @Table(name = "behavior_notes")
    public static class BehaviorNote extends Base {
        public String orderId;
        public String petId;
        public String storeId;
        public String note;
        public Instant createdAt;
    }

    @Entity(name = "Notification")
    @Table(name = "notifications")
    public static class Notification {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        public Long id;
        public String recipientId;
        public String orderId;
        public String type;
        public String message;
        public Instant createdAt;
        public Instant deadline;
    }

    @Entity(name = "Payment")
    @Table(name = "payments")
    public static class Payment extends Base {
        public String orderId;
        public String addonId;
        public String storeId;
        @Enumerated(EnumType.STRING)
        public PaymentMethod method;
        @Enumerated(EnumType.STRING)
        public PaymentStatus status = PaymentStatus.CRIADO;
        public BigDecimal amount;
        public BigDecimal platformFee;
        public BigDecimal refundedAmount = BigDecimal.ZERO;
        public BigDecimal desiredRefund = BigDecimal.ZERO;
        public String providerId;
        public String qrCode;
        @Column(length = 12000)
        public String qrCodeBase64;
        public Instant providerReleaseDate;
        @JsonIgnore
        @Column(length = 6000)
        public String encryptedRequest;
        public String task = "CREATE";
        public int attempts;
        public Instant retryAt;
        public Instant createdAt;
        public String errorCode;
        public boolean captureRequested;
        public boolean cancelRequested;
        public boolean localSimulation;
    }

    @Entity(name = "PaymentAccount")
    @Table(name = "payment_accounts")
    public static class PaymentAccount extends Base {
        @Column(unique = true)
        public String storeId;
        @JsonIgnore
        @Column(length = 4000)
        public String accessToken;
        @JsonIgnore
        @Column(length = 4000)
        public String refreshToken;
        public Instant expiresAt;
        public String providerUserId;
        public String publicKey;
    }

    @Entity(name = "OAuthState")
    @Table(name = "oauth_states")
    public static class OAuthState extends Base {
        public String storeId;
        @JsonIgnore
        public String stateHash;
        @JsonIgnore
        public String codeVerifier;
        public Instant expiresAt;
    }

    @Entity(name = "Receivable")
    @Table(name = "receivables")
    public static class Receivable extends Base {
        @Column(unique = true)
        public String orderId;
        public String storeId;
        public BigDecimal gross;
        public BigDecimal platformFee;
        public BigDecimal merchantAmount;
        public BigDecimal advanceFee;
        public BigDecimal expectedNet;
        public Instant expectedAt;
        public String status = "PREVISTO";
    }
}
