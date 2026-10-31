package br.com.pethub.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("pethub.mp")
public record MpConfig(String baseUrl, String clientId, String clientSecret, String redirectUri, String webhookUrl,
        String webhookSecret) {
}
