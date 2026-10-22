package com.codigovermelho.controllers;

import com.codigovermelho.controllers.dto.NovaTransferenciaRequest;
import com.codigovermelho.controllers.dto.TransferenciaResponse;
import com.codigovermelho.services.TransferenciaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/transferencias")
public class TransferenciaController {

    private final TransferenciaService transferenciaService;

    public TransferenciaController(TransferenciaService transferenciaService) {
        this.transferenciaService = transferenciaService;
    }

    // cria a transferencia ja com a rota calculada pelo Dijkstra (409 se nao tem rota)
    @PostMapping
    public ResponseEntity<TransferenciaResponse> criar(@Valid @RequestBody NovaTransferenciaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(TransferenciaResponse.fromEntity(transferenciaService.criar(request)));
    }

    @GetMapping
    public ResponseEntity<List<TransferenciaResponse>> listar() {
        return ResponseEntity.ok(transferenciaService.listar().stream()
                .map(TransferenciaResponse::fromEntity).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransferenciaResponse> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(TransferenciaResponse.fromEntity(transferenciaService.buscarPorId(id)));
    }

    // carga chegou: depois disso nao aceita mais leitura de temperatura
    @PatchMapping("/{id}/entrega")
    public ResponseEntity<TransferenciaResponse> entregar(@PathVariable Long id) {
        return ResponseEntity.ok(TransferenciaResponse.fromEntity(transferenciaService.marcarComoEntregue(id)));
    }
}
