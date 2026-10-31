package br.com.pethub;

import static br.com.pethub.Domain.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

@RestController @RequestMapping("/api/v1/admin/payments") @Validated @SecurityRequirement(name="bearerAuth")
public class FinanceAdminController {
    final Db db; final PaymentWorker worker;
    public FinanceAdminController(Db db,PaymentWorker worker) { this.db=db; this.worker=worker; }
    @GetMapping public List<Payment> attention(@RequestParam(defaultValue="0") @Min(0) @Max(100000) int page,@RequestParam(defaultValue="20") @Min(1) @Max(100) int size) {
        return db.page(Payment.class,"from Payment p where p.errorCode is not null order by p.createdAt,p.id",page*size,size);
    }
    @PostMapping("/{id}/reconcile") public Payment reconcile(@AuthenticationPrincipal Account a,@PathVariable String id,@Valid @RequestBody Requests.ReconcileInput r) { return worker.reconcile(a,id,r.providerId()); }
}
