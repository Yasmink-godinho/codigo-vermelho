package com.codigovermelho.controllers;

import com.codigovermelho.controllers.dto.InstituicaoResponse;
import com.codigovermelho.controllers.dto.NovaInstituicaoRequest;
import com.codigovermelho.models.Instituicao;
import com.codigovermelho.services.InstituicaoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/instituicoes")
public class InstituicaoController {

    private final InstituicaoService instituicaoService;

    public InstituicaoController(InstituicaoService instituicaoService) {
        this.instituicaoService = instituicaoService;
    }

    @PostMapping
    public ResponseEntity<InstituicaoResponse> cadastrar(@Valid @RequestBody NovaInstituicaoRequest request) {
        Instituicao instituicao = instituicaoService.salvar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(InstituicaoResponse.fromEntity(instituicao));
    }

    @GetMapping
    public ResponseEntity<List<InstituicaoResponse>> listar() {
        List<InstituicaoResponse> response = instituicaoService.listarTodas().stream()
                .map(InstituicaoResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<InstituicaoResponse> buscarPorId(@PathVariable Long id) {
        Instituicao instituicao = instituicaoService.buscarPorId(id);
        return ResponseEntity.ok(InstituicaoResponse.fromEntity(instituicao));
    }
}