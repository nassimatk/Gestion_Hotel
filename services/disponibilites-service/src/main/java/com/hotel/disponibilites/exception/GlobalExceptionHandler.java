package com.hotel.disponibilites.exception;

import com.hotel.disponibilites.dto.ErreurResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErreurResponse> handleStatus(ResponseStatusException e) {
        int code = e.getStatusCode().value();
        return ResponseEntity.status(code).body(new ErreurResponse(e.getReason(), code));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErreurResponse> handleMissing(MissingServletRequestParameterException e) {
        return erreur(HttpStatus.BAD_REQUEST, "Parametre manquant : " + e.getParameterName());
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErreurResponse> handleTypeMismatch(MethodArgumentTypeMismatchException e) {
        return erreur(HttpStatus.BAD_REQUEST, "Valeur invalide pour : " + e.getName());
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErreurResponse> handleNotFound(NoResourceFoundException e) {
        return erreur(HttpStatus.NOT_FOUND, "Ressource introuvable");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErreurResponse> handleAutre(Exception e) {
        return erreur(HttpStatus.INTERNAL_SERVER_ERROR, "Erreur interne du serveur");
    }

    private ResponseEntity<ErreurResponse> erreur(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(new ErreurResponse(message, status.value()));
    }
}