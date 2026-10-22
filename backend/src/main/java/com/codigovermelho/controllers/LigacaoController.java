package com.codigovermelho.controllers;

import com.codigovermelho.controllers.dto.LigacaoResponse;
import com.codigovermelho.controllers.dto.NovaLigacaoRequest;
import com.codigovermelho.services.LigacaoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// Ligacoes (arestas) da malha logistica que o Dijkstra usa pra calcular rota
@RestController
@RequestMapping("/api/v1/ligacoes")
public class LigacaoController {

    private final LigacaoService ligacaoService;

    public LigacaoController(LigacaoService ligacaoService) {
        this.ligacaoService = ligacaoService;
    }

    @PostMapping
    public ResponseEntity<LigacaoResponse> criar(@Valid @RequestBody NovaLigacaoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(LigacaoResponse.fromEntity(ligacaoService.criar(request)));
    }

    @GetMapping
    public ResponseEntity<List<LigacaoResponse>> listar() {
        return ResponseEntity.ok(ligacaoService.listar().stream()
                .map(LigacaoResponse::fromEntity).toList());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        ligacaoService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
