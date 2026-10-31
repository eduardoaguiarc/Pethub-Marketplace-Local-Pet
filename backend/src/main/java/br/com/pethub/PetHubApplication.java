package br.com.pethub;

import br.com.pethub.config.MpConfig;

import java.time.Clock;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;
import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;

@SpringBootApplication
@EnableScheduling
@org.springframework.boot.context.properties.EnableConfigurationProperties(MpConfig.class)
@OpenAPIDefinition(info = @Info(title = "PetHub API", version = "v1", description = "Marketplace local pet — PRC-01, PRC-02 e PRC-03. Valores em BRL; datas ISO-8601 com fuso."))
@SecurityScheme(name = "bearerAuth", type = SecuritySchemeType.HTTP, scheme = "bearer")
public class PetHubApplication {
    public static void main(String[] args) {
        SpringApplication.run(PetHubApplication.class, args);
    }

    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }
}
