package br.com.pethub.controller;

import br.com.pethub.exception.ApiException;
import br.com.pethub.security.AuthService;
import br.com.pethub.service.NotificationService;

import static br.com.pethub.domain.Domain.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

@RestController
@RequestMapping("/api/v1/notifications")
@SecurityRequirement(name = "bearerAuth")
public class EventController {
    final NotificationService notifications;
    final AuthService auth;
    final Map<SseEmitter, Connection> clients = new ConcurrentHashMap<>();

    static class Connection {
        String user, token;
        long cursor;

        Connection(String user, String token, long cursor) {
            this.user = user;
            this.token = token;
            this.cursor = cursor;
        }
    }

    public EventController(NotificationService notifications, AuthService auth) {
        this.notifications = notifications;
        this.auth = auth;
    }

    @GetMapping
    public List<Notification> events(@AuthenticationPrincipal Account a, @RequestParam(defaultValue = "0") long after) {
        if (after < 0)
            throw ApiException.invalid("Cursor inválido");
        return notifications.since(a.id, after);
    }

    @GetMapping(value = "/stream", produces = "text/event-stream")
    public SseEmitter stream(@AuthenticationPrincipal Account a, @RequestHeader("Authorization") String token,
            @RequestHeader(name = "Last-Event-ID", required = false) Long lastId,
            @RequestParam(defaultValue = "0") long after) {
        if (after < 0 || (lastId != null && lastId < 0))
            throw ApiException.invalid("Cursor inválido");
        if (clients.values().stream().filter(c -> c.user.equals(a.id)).count() >= 5)
            throw ApiException.conflict("Limite de conexões atingido");
        SseEmitter emitter = new SseEmitter(300000L);
        clients.put(emitter, new Connection(a.id, token.substring(7), lastId == null ? after : lastId));
        emitter.onCompletion(() -> clients.remove(emitter));
        emitter.onTimeout(() -> clients.remove(emitter));
        emitter.onError(e -> clients.remove(emitter));
        return emitter;
    }

    @Scheduled(fixedDelay = 2000)
    public void broadcast() {
        clients.forEach((emitter, c) -> {
            try {
                if (auth.resolve(c.token) == null) {
                    emitter.complete();
                    clients.remove(emitter);
                    return;
                }
                for (Notification n : notifications.since(c.user, c.cursor)) {
                    emitter.send(SseEmitter.event().id(n.id.toString()).name(n.type).data(n));
                    c.cursor = n.id;
                }
                emitter.send(SseEmitter.event().comment("heartbeat"));
            } catch (Exception e) {
                clients.remove(emitter);
                emitter.complete();
            }
        });
    }
}
