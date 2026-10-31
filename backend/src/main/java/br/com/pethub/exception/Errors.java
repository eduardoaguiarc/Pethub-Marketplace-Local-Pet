package br.com.pethub.exception;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.ConcurrencyFailureException;
import jakarta.validation.ConstraintViolationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class Errors {
    @ExceptionHandler(ApiException.class)
    ProblemDetail business(ApiException ex) {
        return problem(ex.status, ex.code, ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail validation(MethodArgumentNotValidException ex) {
        var p = problem(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Confira os campos enviados");
        p.setProperty("errors", ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage()).toList());
        return p;
    }

    @ExceptionHandler({ HttpMessageNotReadableException.class, ConstraintViolationException.class,
            MethodArgumentTypeMismatchException.class })
    ProblemDetail malformed(Exception ex) {
        return problem(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", "JSON, parâmetro ou formato inválido");
    }

    @ExceptionHandler({ DataIntegrityViolationException.class, ConcurrencyFailureException.class })
    ProblemDetail conflict(Exception ex) {
        return problem(HttpStatus.CONFLICT, "CONCURRENT_CHANGE",
                "Recurso já existe ou foi alterado simultaneamente; consulte o estado atual");
    }

    static ProblemDetail problem(HttpStatus status, String code, String detail) {
        var p = ProblemDetail.forStatusAndDetail(status, detail);
        p.setProperty("code", code);
        return p;
    }
}
