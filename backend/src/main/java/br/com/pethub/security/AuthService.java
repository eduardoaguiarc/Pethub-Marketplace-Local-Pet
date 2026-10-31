package br.com.pethub.security;

import br.com.pethub.dto.Requests;
import br.com.pethub.exception.ApiException;
import br.com.pethub.repository.Db;

import static br.com.pethub.domain.Domain.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService {
    private final Db db;
    private final PasswordEncoder encoder;
    private final Clock clock;
    private final int sessionHours;
    private final String dummyHash;

    public AuthService(Db db, PasswordEncoder encoder, Clock clock,
            @Value("${pethub.session-hours}") int sessionHours) {
        this.db = db;
        this.encoder = encoder;
        this.clock = clock;
        this.sessionHours = sessionHours;
        dummyHash = encoder.encode(UUID.randomUUID().toString());
    }

    public record AuthResult(String accessToken, String tokenType, Instant expiresAt, Account user) {
        @Override
        public String toString() {
            return "AuthResult[redacted]";
        }
    }

    public AuthResult register(Requests.Register r) {
        if (r.role() == Role.ADMIN)
            throw ApiException.forbidden();
        if (r.password().getBytes(StandardCharsets.UTF_8).length > 72)
            throw ApiException.invalid("Senha deve ter até 72 bytes UTF-8");
        String email = r.email().trim().toLowerCase(Locale.ROOT);
        if (db.count("select count(a) from Account a where a.email=?1", email) > 0)
            throw ApiException.conflict("E-mail já cadastrado");
        Account a = new Account();
        a.name = r.name();
        a.email = email;
        a.passwordHash = encoder.encode(r.password());
        a.role = r.role();
        a.address = r.address();
        db.save(a);
        return session(a);
    }

    public AuthResult login(Requests.Login r) {
        var users = db.list(Account.class, "from Account a where a.email=?1",
                r.email().trim().toLowerCase(Locale.ROOT));
        Account a = users.isEmpty() ? null : users.getFirst();
        boolean matches = r.password().getBytes(StandardCharsets.UTF_8).length <= 72
                && encoder.matches(r.password(), a == null ? dummyHash : a.passwordHash);
        if (a == null || !matches || !a.active)
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "E-mail ou senha inválidos");
        return session(a);
    }

    private AuthResult session(Account a) {
        String token = randomToken();
        Session s = new Session();
        s.accountId = a.id;
        s.tokenHash = hash(token);
        s.expiresAt = clock.instant().plus(Duration.ofHours(sessionHours));
        db.save(s);
        return new AuthResult(token, "Bearer", s.expiresAt, a);
    }

    @Transactional(readOnly = true)
    public Account resolve(String token) {
        var sessions = db.list(Session.class, "from Session s where s.tokenHash=?1 and s.expiresAt>?2", hash(token),
                clock.instant());
        if (sessions.isEmpty())
            return null;
        var a = db.get(Account.class, sessions.getFirst().accountId);
        return a.active ? a : null;
    }

    public void logout(String token) {
        db.list(Session.class, "from Session s where s.tokenHash=?1", hash(token)).forEach(db::remove);
    }

    public static String randomToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public static String hash(String input) {
        try {
            return HexFormat.of()
                    .formatHex(MessageDigest.getInstance("SHA-256").digest(input.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    public static void role(Account a, Role role) {
        if (a.role != role)
            throw ApiException.forbidden();
    }
}
