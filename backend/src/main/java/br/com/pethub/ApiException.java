package br.com.pethub;

import org.springframework.http.HttpStatus;

public class ApiException extends RuntimeException {
    final HttpStatus status;
    final String code;
    public ApiException(HttpStatus status, String code, String message) { super(message); this.status=status; this.code=code; }
    public static ApiException conflict(String message) { return new ApiException(HttpStatus.CONFLICT,"BUSINESS_CONFLICT",message); }
    public static ApiException invalid(String message) { return new ApiException(HttpStatus.BAD_REQUEST,"INVALID_REQUEST",message); }
    public static ApiException forbidden() { return new ApiException(HttpStatus.FORBIDDEN,"FORBIDDEN","Acesso não permitido"); }
    public static ApiException notFound(String message) { return new ApiException(HttpStatus.NOT_FOUND,"NOT_FOUND",message); }
}
