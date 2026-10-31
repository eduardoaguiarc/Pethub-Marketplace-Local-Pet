package br.com.pethub;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component @Profile("prod")
public class ProductionGuard {
    public ProductionGuard(MpConfig config) {
        if(config.clientId().isBlank()||config.clientSecret().isBlank()||config.webhookSecret().isBlank()||!config.webhookUrl().startsWith("https://")||!config.redirectUri().startsWith("https://")||!config.baseUrl().equals("https://api.mercadopago.com"))
            throw new IllegalStateException("Produção exige credenciais Mercado Pago, webhook e redirect HTTPS e URL oficial do gateway");
    }
}
