package com.codigovermelho.controllers;

import com.codigovermelho.controllers.dto.LoteResponse;
import com.codigovermelho.controllers.dto.NovoLoteRequest;
import com.codigovermelho.models.LoteHemocomponente;
import com.codigovermelho.models.enums.TipoSanguineo;
import com.codigovermelho.services.LoteHemocomponenteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class LoteHemocomponenteController {

    private final LoteHemocomponenteService loteService;

    public LoteHemocomponenteController(LoteHemocomponenteService loteService) {
        this.loteService = loteService;
    }

    @PostMapping("/instituicoes/{instituicaoId}/lotes")
    public ResponseEntity<LoteResponse> registrar(
            @PathVariable Long instituicaoId,
            @Valid @RequestBody NovoLoteRequest request) {
        LoteHemocomponente lote = loteService.registrar(
                instituicaoId,
                request.tipoSanguineo(),
                request.componente(),
                request.dataColeta(),
                request.quantidade()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(LoteResponse.fromEntity(lote));
    }

    @GetMapping("/instituicoes/{instituicaoId}/lotes")
    public ResponseEntity<List<LoteResponse>> listarPorInstituicao(@PathVariable Long instituicaoId) {
        List<LoteResponse> resposta = loteService.listarPorInstituicao(instituicaoId).stream()
                .map(LoteResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(resposta);
    }

    @GetMapping("/lotes/fila-fefo")
    public ResponseEntity<List<LoteResponse>> filaFefo(
            @RequestParam(required = false) TipoSanguineo tipoSanguineo,
            @RequestParam(required = false) Long instituicaoId) {
        List<LoteResponse> resposta = loteService.filaFefo(tipoSanguineo, instituicaoId).stream()
                .filter(l -> !l.isVencido())
                .map(LoteResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(resposta);
    }
}