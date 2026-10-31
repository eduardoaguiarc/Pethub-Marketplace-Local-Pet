package br.com.pethub.config;

import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springdoc.core.customizers.OpenApiCustomizer;
import io.swagger.v3.oas.models.PathItem;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;

@Configuration
public class OpenApiConfig {
    @Bean
    OpenApiCustomizer accessRules() {
        return api -> {
            api.setServers(List.of(new Server().url("/")));
            api.getComponents().addSecuritySchemes("mercadoPagoSignature", new SecurityScheme()
                    .type(SecurityScheme.Type.APIKEY).in(SecurityScheme.In.HEADER).name("x-signature")
                    .description("HMAC Mercado Pago. Também exige x-request-id e data.id; não usa sessão Bearer."));
            api.getPaths().forEach((path, item) -> item.readOperationsMap().forEach((method, operation) -> {
                boolean publicRead = method == PathItem.HttpMethod.GET && path.startsWith("/api/v1/stores");
                boolean publicAuth = path.equals("/api/v1/auth/register") || path.equals("/api/v1/auth/login");
                if (publicRead || publicAuth)
                    operation.setSecurity(List.of());
                if (path.equals("/api/v1/webhooks/mercadopago"))
                    operation.setSecurity(List.of(new SecurityRequirement().addList("mercadoPagoSignature")));
            }));
        };
    }
}
