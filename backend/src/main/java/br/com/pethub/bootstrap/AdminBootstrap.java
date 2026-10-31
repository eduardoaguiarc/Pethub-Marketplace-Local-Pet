package br.com.pethub.bootstrap;

import br.com.pethub.repository.Db;

import static br.com.pethub.domain.Domain.*;
import java.util.Locale;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class AdminBootstrap implements ApplicationRunner {
    final Db db;
    final PasswordEncoder encoder;
    final String email, password;

    public AdminBootstrap(Db db, PasswordEncoder encoder, @Value("${PETHUB_ADMIN_EMAIL:}") String email,
            @Value("${PETHUB_ADMIN_PASSWORD:}") String password) {
        this.db = db;
        this.encoder = encoder;
        this.email = email;
        this.password = password;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (email.isBlank() && password.isBlank())
            return;
        if (!email.contains("@") || password.length() < 12
                || password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72)
            throw new IllegalStateException("Bootstrap admin exige e-mail válido e senha de 12 a 72 bytes");
        String normalized = email.trim().toLowerCase(Locale.ROOT);
        var existing = db.list(Account.class, "from Account a where a.email=?1", normalized);
        if (!existing.isEmpty()) {
            if (existing.getFirst().role != Role.ADMIN)
                throw new IllegalStateException("E-mail de bootstrap já pertence a conta sem perfil ADMIN");
            return;
        }
        Account a = new Account();
        a.email = normalized;
        a.name = "Administrador PetHub";
        a.passwordHash = encoder.encode(password);
        a.role = Role.ADMIN;
        db.save(a);
    }
}
