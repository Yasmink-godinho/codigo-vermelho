package com.codigovermelho.controllers;

import com.codigovermelho.controllers.dto.AtualizarLoteRequest;
import com.codigovermelho.controllers.dto.LoteResponse;
import com.codigovermelho.controllers.dto.NovoLoteRequest;
import com.codigovermelho.models.LoteHemocomponente;
import com.codigovermelho.models.enums.TipoComponente;
import com.codigovermelho.models.enums.TipoSanguineo;
import com.codigovermelho.services.LoteHemocomponenteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
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
                instituicaoId, request.tipoSanguineo(), request.componente(), request.dataColeta(),
                request.validade(), request.quantidade());
        return ResponseEntity.status(HttpStatus.CREATED).body(LoteResponse.fromEntity(lote));
    }

    @GetMapping("/lotes")
    public ResponseEntity<List<LoteResponse>> listar(
            @RequestParam(required = false) TipoSanguineo tipoSanguineo,
            @RequestParam(required = false) TipoComponente componente,
            @RequestParam(required = false) LocalDate validadeAte) {
        return ResponseEntity.ok(loteService.listar(tipoSanguineo, componente, validadeAte).stream()
                .map(LoteResponse::fromEntity).toList());
    }

    @GetMapping("/lotes/{id}")
    public ResponseEntity<LoteResponse> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(LoteResponse.fromEntity(loteService.buscarPorId(id)));
    }

    @PatchMapping("/lotes/{id}")
    public ResponseEntity<LoteResponse> atualizar(
            @PathVariable Long id, @Valid @RequestBody AtualizarLoteRequest request) {
        return ResponseEntity.ok(LoteResponse.fromEntity(loteService.atualizar(id, request)));
    }

    @DeleteMapping("/lotes/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        loteService.excluir(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/instituicoes/{instituicaoId}/lotes")
    public ResponseEntity<List<LoteResponse>> listarPorInstituicao(@PathVariable Long instituicaoId) {
        return ResponseEntity.ok(loteService.listarPorInstituicao(instituicaoId).stream()
                .map(LoteResponse::fromEntity).toList());
    }

    @GetMapping("/lotes/fila-fefo")
    public ResponseEntity<List<LoteResponse>> filaFefo(
            @RequestParam(required = false) TipoSanguineo tipoSanguineo,
            @RequestParam(required = false) Long instituicaoId) {
        return ResponseEntity.ok(loteService.filaFefo(tipoSanguineo, instituicaoId).stream()
                .map(LoteResponse::fromEntity).toList());
    }
}
