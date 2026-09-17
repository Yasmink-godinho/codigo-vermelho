package com.codigovermelho.controllers.advice;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.NoSuchElementException;

/**
 * Captura global de excecoes dos Controllers, convertendo excecoes de
 * negocio em respostas HTTP com o status code correto, em vez de deixar
 * o Spring devolver 500 Internal Server Error por padrao.
 *
 * IllegalArgumentException -> 400 Bad Request
 *   (lancada pelos setters das entidades quando um dado e invalido:
 *   ex "Coordenadas invalidas", "Data de validade nao pode ser retroativa")
 *
 * NoSuchElementException -> 404 Not Found
 *   (lancada pelos Services quando um id informado nao existe no banco)
 */
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(corpoErro(HttpStatus.BAD_REQUEST, ex.getMessage()));
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(NoSuchElementException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(corpoErro(HttpStatus.NOT_FOUND, ex.getMessage()));
    }

    private Map<String, Object> corpoErro(HttpStatus status, String mensagem) {
        Map<String, Object> corpo = new LinkedHashMap<>();
        corpo.put("timestamp", LocalDateTime.now());
        corpo.put("status", status.value());
        corpo.put("erro", status.getReasonPhrase());
        corpo.put("mensagem", mensagem);
        return corpo;
    }
}
