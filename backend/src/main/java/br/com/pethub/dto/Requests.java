package br.com.pethub.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import static br.com.pethub.domain.Domain.*;

public final class Requests {
    private Requests() {
    }

    public record Register(@NotBlank @Size(max = 120) String name, @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(min = 10, max = 72) String password, @NotNull Role role, @Size(max = 250) String address) {
        @Override
        public String toString() {
            return "Register[redacted]";
        }
    }

    public record Login(@NotBlank @Email @Size(max = 254) String email, @NotBlank @Size(max = 72) String password) {
        @Override
        public String toString() {
            return "Login[redacted]";
        }
    }

    public record PetInput(@NotBlank @Size(max = 120) String name, @NotNull Species species,
            @Size(max = 100) String breed,
            @Size(max = 60) String ageLabel, @NotNull @DecimalMin("0.01") @DecimalMax("150") BigDecimal weightKg,
            @NotNull PetSize size, @Size(max = 250) String avatarUrl, @Size(max = 250) String vaccineStatus,
            boolean severeDermatitisHistory) {
    }

    public record ShopInput(@NotBlank @Size(max = 120) String name, @Size(max = 250) String description,
            @NotBlank @Size(max = 250) String address, @Size(max = 100) String neighborhood,
            @DecimalMin("-90") @DecimalMax("90") double latitude,
            @DecimalMin("-180") @DecimalMax("180") double longitude,
            @DecimalMin("0.1") @DecimalMax("100") double serviceRadiusKm,
            @Min(0) @Max(240) int deliveryPreparationMinutes,
            @NotNull @DecimalMin("0") @DecimalMax("1000") @Digits(integer = 4, fraction = 2) BigDecimal deliveryFee,
            @NotNull @DecimalMin("0") @DecimalMax("1000") @Digits(integer = 4, fraction = 2) BigDecimal taxiDogFee,
            @NotBlank String timeZone, @Size(max = 250) String logoUrl, @Size(max = 250) String bannerUrl) {
    }

    public record ProductInput(@NotBlank @Size(max = 120) String name, @Size(max = 250) String description,
            @NotBlank @Size(max = 60) String category,
            @NotNull @DecimalMin("0.01") @DecimalMax("100000") @Digits(integer = 6, fraction = 2) BigDecimal price,
            @Min(0) @Max(1000000) int stock, @Size(max = 60) String unitLabel, @Size(max = 250) String imageUrl,
            boolean active) {
    }

    public record ServiceInput(@NotBlank @Size(max = 120) String name, @Size(max = 250) String description,
            @NotBlank @Size(max = 60) String category,
            @Min(15) @Max(480) int durationMinutes,
            @NotNull @DecimalMin("0.01") @DecimalMax("10000") @Digits(integer = 5, fraction = 2) BigDecimal smallPrice,
            @NotNull @DecimalMin("0.01") @DecimalMax("10000") @Digits(integer = 5, fraction = 2) BigDecimal mediumPrice,
            @NotNull @DecimalMin("0.01") @DecimalMax("10000") @Digits(integer = 5, fraction = 2) BigDecimal largePrice,
            boolean therapeutic, @Size(max = 250) String imageUrl, boolean active) {
    }

    public record BayInput(@NotBlank @Size(max = 80) String name, @NotNull PetSize size, boolean active) {
    }

    public record WindowInput(@NotBlank String bayId, @NotNull Instant startsAt, @NotNull Instant endsAt) {
    }

    public record Line(@NotBlank String productId, @Min(1) @Max(1000) int quantity) {
    }

    public record Booking(@NotBlank String serviceId, @NotBlank String petId, @NotNull Instant startsAt,
            boolean taxiDog) {
    }

    public record PaymentInput(@NotNull PaymentMethod method, @Size(max = 500) String cardToken,
            @Size(max = 60) String paymentMethodId, @Size(max = 60) String issuerId,
            @Min(1) @Max(12) int installments, @Pattern(regexp = "[0-9]{11}") String cpf) {
        @Override
        public String toString() {
            return "PaymentInput[redacted]";
        }
    }

    public record Checkout(@NotBlank String storeId, @NotNull @Size(max = 100) List<@Valid Line> products,
            @Valid Booking booking, @NotNull Fulfillment fulfillmentMode,
            @Size(max = 250) String deliveryAddress, @DecimalMin("-90") @DecimalMax("90") Double latitude,
            @DecimalMin("-180") @DecimalMax("180") Double longitude,
            @NotNull @Valid PaymentInput payment) {
    }

    public record Reason(@NotBlank @Size(max = 250) String reason) {
    }

    public record Triage(boolean suspectedEctoparasites, boolean severeDermatitis) {
    }

    public record StageInput(@NotNull Stage stage) {
    }

    public record AddOnInput(String productId, String serviceId, @Min(1) @Max(100) int quantity,
            @NotBlank @Size(max = 250) String reason, boolean mandatorySanitary) {
    }

    public record AddOnDecision(@NotNull Decision decision, @Valid PaymentInput payment) {
    }

    public record ReviewInput(@Min(1) @Max(5) int rating, @Size(max = 250) String comment) {
    }

    public record NoteInput(@NotBlank @Size(max = 250) String note) {
    }

    public record PayoutInput(boolean advancePayout) {
    }

    public record ReconcileInput(@NotBlank @Pattern(regexp = "[A-Za-z0-9-]{1,100}") String providerId) {
    }

    public record OAuthInput(@NotBlank @Size(max = 1000) String code, @NotBlank @Size(max = 200) String state) {
        @Override
        public String toString() {
            return "OAuthInput[redacted]";
        }
    }
}
