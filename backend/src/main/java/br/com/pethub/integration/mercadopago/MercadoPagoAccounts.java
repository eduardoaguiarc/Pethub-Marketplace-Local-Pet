package br.com.pethub.integration.mercadopago;

import br.com.pethub.config.MpConfig;
import br.com.pethub.dto.Requests;
import br.com.pethub.exception.ApiException;
import br.com.pethub.repository.Db;
import br.com.pethub.security.AuthService;
import br.com.pethub.security.Crypto;
import br.com.pethub.service.CatalogService;

import static br.com.pethub.domain.Domain.*;
import java.time.*;
import java.util.*;
import java.nio.charset.StandardCharsets;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;

@Service
@Transactional
public class MercadoPagoAccounts {
    final Db db;
    final CatalogService catalog;
    final Crypto crypto;
    final Clock clock;
    final MpConfig config;
    final RestClient client;

    public MercadoPagoAccounts(Db db, CatalogService catalog, Crypto crypto, Clock clock, MpConfig config) {
        this.db = db;
        this.catalog = catalog;
        this.crypto = crypto;
        this.clock = clock;
        this.config = config;
        this.client = client(config.baseUrl());
    }

    static RestClient client(String base) {
        var factory = new JdkClientHttpRequestFactory(
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build());
        factory.setReadTimeout(Duration.ofSeconds(10));
        return RestClient.builder().baseUrl(base).requestFactory(factory).build();
    }

    public Map<String, String> connect(Account actor) {
        if (config.clientId().isBlank() || config.clientSecret().isBlank())
            throw ApiException.conflict("Configure MP_CLIENT_ID e MP_CLIENT_SECRET no servidor");
        Shop s = catalog.ownedShop(actor, true);
        String state = AuthService.randomToken(), verifier = AuthService.randomToken();
        OAuthState st = new OAuthState();
        st.storeId = s.id;
        st.stateHash = AuthService.hash(state);
        st.codeVerifier = crypto.encrypt(verifier);
        st.expiresAt = clock.instant().plusSeconds(600);
        db.save(st);
        String challenge = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(HexFormat.of().parseHex(AuthService.hash(verifier)));
        return Map.of("authorizationUrl",
                "https://auth.mercadopago.com/authorization?client_id=" + enc(config.clientId())
                        + "&response_type=code&platform_id=mp&redirect_uri=" + enc(config.redirectUri()) + "&state="
                        + enc(state) + "&code_challenge=" + challenge + "&code_challenge_method=S256");
    }

    public Map<String, Object> exchange(Account actor, Requests.OAuthInput r) {
        Shop s = catalog.ownedShop(actor, true);
        var states = db.list(OAuthState.class,
                "from OAuthState s where s.storeId=?1 and s.stateHash=?2 and s.expiresAt>?3", s.id,
                AuthService.hash(r.state()), clock.instant());
        if (states.isEmpty())
            throw ApiException.invalid("Estado OAuth inválido, expirado ou já utilizado");
        OAuthState state = states.getFirst();
        JsonNode response = client.post().uri("/oauth/token")
                .body(Map.of("grant_type", "authorization_code", "client_id", config.clientId(), "client_secret",
                        config.clientSecret(), "code", r.code(), "redirect_uri", config.redirectUri(), "code_verifier",
                        crypto.decrypt(state.codeVerifier)))
                .retrieve().body(JsonNode.class);
        PaymentAccount a = db.list(PaymentAccount.class, "from PaymentAccount a where a.storeId=?1", s.id).stream()
                .findFirst().orElse(null);
        if (a == null) {
            a = new PaymentAccount();
            a.storeId = s.id;
            db.save(a);
        }
        saveTokens(a, response);
        db.remove(state);
        return Map.of("connected", true, "expiresAt", a.expiresAt);
    }

    public String token(String store) {
        var accounts = db.list(PaymentAccount.class, "from PaymentAccount a where a.storeId=?1", store);
        if (accounts.isEmpty())
            throw ApiException.conflict("Conta Mercado Pago não conectada");
        PaymentAccount a = accounts.getFirst();
        if (a.expiresAt.isBefore(clock.instant().plusSeconds(300))) {
            JsonNode response = client.post().uri("/oauth/token")
                    .body(Map.of("grant_type", "refresh_token", "client_id", config.clientId(), "client_secret",
                            config.clientSecret(), "refresh_token", crypto.decrypt(a.refreshToken)))
                    .retrieve().body(JsonNode.class);
            saveTokens(a, response);
        }
        return crypto.decrypt(a.accessToken);
    }

    void saveTokens(PaymentAccount a, JsonNode response) {
        if (response == null || !response.hasNonNull("access_token") || !response.hasNonNull("refresh_token"))
            throw new IllegalStateException("Resposta OAuth inválida");
        a.accessToken = crypto.encrypt(response.path("access_token").asString());
        a.refreshToken = crypto.encrypt(response.path("refresh_token").asString());
        a.expiresAt = clock.instant().plusSeconds(response.path("expires_in").asLong());
        a.providerUserId = response.path("user_id").asString();
        if (response.hasNonNull("public_key"))
            a.publicKey = response.path("public_key").asString();
    }

    static String enc(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }
}
