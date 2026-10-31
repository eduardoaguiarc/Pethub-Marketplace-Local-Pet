package br.com.pethub.config;

import br.com.pethub.security.AuthService;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.*;
import org.springframework.web.filter.OncePerRequestFilter;

@Configuration
public class SecurityConfig {
    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    org.springframework.security.core.userdetails.UserDetailsService disableDefaultUser() {
        return username -> {
            throw new org.springframework.security.core.userdetails.UsernameNotFoundException(
                    "Use a autenticação Bearer da API");
        };
    }

    @Bean
    SecurityFilterChain security(HttpSecurity http, AuthService auth, @Value("${pethub.cors-origins}") String origins)
            throws Exception {
        var cors = new CorsConfiguration();
        cors.setAllowedOrigins(Arrays.asList(origins.split(",")));
        cors.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cors.setAllowedHeaders(List.of("Authorization", "Content-Type", "Idempotency-Key", "Last-Event-ID"));
        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cors);
        return http.csrf(c -> c.disable()).cors(c -> c.configurationSource(source))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(a -> a
                        .dispatcherTypeMatchers(DispatcherType.ASYNC, DispatcherType.ERROR).permitAll()
                        .requestMatchers("/api/v1/auth/login", "/api/v1/auth/register", "/api/v1/webhooks/mercadopago",
                                "/actuator/health", "/error")
                        .permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/stores/**",
                                "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html")
                        .permitAll()
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/v1/merchant/**").hasRole("LOJISTA")
                        .anyRequest().authenticated())
                .exceptionHandling(e -> e.authenticationEntryPoint((req, res, ex) -> problem(res, 401, "UNAUTHORIZED"))
                        .accessDeniedHandler((req, res, ex) -> problem(res, 403, "FORBIDDEN")))
                .addFilterBefore(new TokenFilter(auth), UsernamePasswordAuthenticationFilter.class).build();
    }

    static void problem(HttpServletResponse response, int status, String code) throws IOException {
        response.setStatus(status);
        response.setContentType("application/problem+json");
        response.getWriter().write("{\"status\":" + status + ",\"title\":\"" + code + "\",\"code\":\"" + code + "\"}");
    }

    static class TokenFilter extends OncePerRequestFilter {
        final AuthService auth;
        final Map<String, Attempt> attempts = new ConcurrentHashMap<>();

        record Attempt(long minute, int count) {
        }

        TokenFilter(AuthService auth) {
            this.auth = auth;
        }

        @Override
        protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
                throws ServletException, IOException {
            if (req.getMethod().equals("POST") && (req.getRequestURI().endsWith("/auth/login")
                    || req.getRequestURI().endsWith("/auth/register"))) {
                long minute = System.currentTimeMillis() / 60000;
                if (attempts.size() > 10000)
                    attempts.entrySet().removeIf(e -> e.getValue().minute() < minute);
                Attempt a = attempts.compute(req.getRemoteAddr(),
                        (k, v) -> v == null || v.minute() != minute ? new Attempt(minute, 1)
                                : new Attempt(minute, v.count() + 1));
                if (a.count() > 30) {
                    res.setHeader("Retry-After", "60");
                    problem(res, 429, "RATE_LIMITED");
                    return;
                }
            }
            String h = req.getHeader("Authorization");
            if (h != null && h.startsWith("Bearer ") && h.length() < 600) {
                var a = auth.resolve(h.substring(7));
                if (a != null)
                    SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(a,
                            null, List.of(new SimpleGrantedAuthority("ROLE_" + a.role))));
            }
            chain.doFilter(req, res);
        }
    }
}
