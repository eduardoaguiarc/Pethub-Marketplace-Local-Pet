package br.com.pethub.integration.mercadopago;

import br.com.pethub.config.MpConfig;
import br.com.pethub.exception.ApiException;
import br.com.pethub.repository.Db;

import static br.com.pethub.domain.Domain.*;
import java.time.Clock;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;

@Service
public class WebhookService {
    final Db db;
    final MpConfig config;
    final Clock clock;

    public WebhookService(Db db, MpConfig config, Clock clock) {
        this.db = db;
        this.config = config;
        this.clock = clock;
    }

    @Transactional
    public void receive(String dataId, String signature, String requestId) {
        verify(dataId, signature, requestId);
        // Only the signed identifier is trusted. Financial state always comes from a
        // subsequent authenticated GET.
        var matches = db.list(Payment.class, "from Payment p where p.providerId=?1", dataId);
        for (Payment p : matches) {
            db.lock(Shop.class, p.storeId);
            db.refresh(p);
            p.retryAt = clock.instant();
        }
        // Early callbacks may race CREATE; the durable worker reconciles every pending
        // payment independently.
    }

    void verify(String dataId, String signature, String requestId) {
        try {
            if (config.webhookSecret().isBlank() || dataId == null || signature == null || requestId == null
                    || !dataId.matches("[A-Za-z0-9-]{1,100}") || !requestId.matches("[A-Za-z0-9-]{1,150}"))
                throw new IllegalArgumentException();
            var fields = new HashMap<String, String>();
            for (String part : signature.split(",")) {
                String[] kv = part.trim().split("=", 2);
                if (kv.length == 2)
                    fields.put(kv[0], kv[1]);
            }
            long ts = Long.parseLong(fields.get("ts"));
            long seconds = ts > 10_000_000_000L ? ts / 1000 : ts;
            if (Math.abs(clock.instant().getEpochSecond() - seconds) > 300)
                throw new IllegalArgumentException();
            String manifest = "id:" + dataId.toLowerCase(Locale.ROOT) + ";request-id:" + requestId + ";ts:" + ts + ";";
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(config.webhookSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            if (!MessageDigest.isEqual(mac.doFinal(manifest.getBytes(StandardCharsets.UTF_8)),
                    HexFormat.of().parseHex(fields.get("v1"))))
                throw new IllegalArgumentException();
        } catch (Exception e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_SIGNATURE", "Assinatura de webhook inválida");
        }
    }
}
