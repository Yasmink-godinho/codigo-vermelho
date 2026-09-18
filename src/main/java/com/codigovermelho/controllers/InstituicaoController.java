package com.codigovermelho.controllers;

import com.codigovermelho.controllers.dto.AtualizarInstituicaoRequest;
import com.codigovermelho.controllers.dto.InstituicaoResponse;
import com.codigovermelho.controllers.dto.NovaInstituicaoRequest;
import com.codigovermelho.models.Instituicao;
import com.codigovermelho.models.enums.TipoInstituicao;
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
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(InstituicaoResponse.fromEntity(instituicaoService.salvar(request)));
    }

    @GetMapping
    public ResponseEntity<List<InstituicaoResponse>> listar(
            @RequestParam(required = false) TipoInstituicao tipo) {
        return ResponseEntity.ok(instituicaoService.listar(tipo).stream()
                .map(InstituicaoResponse::fromEntity).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<InstituicaoResponse> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(InstituicaoResponse.fromEntity(instituicaoService.buscarPorId(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<InstituicaoResponse> atualizar(
            @PathVariable Long id, @Valid @RequestBody AtualizarInstituicaoRequest request) {
        return ResponseEntity.ok(InstituicaoResponse.fromEntity(instituicaoService.atualizar(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        instituicaoService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
