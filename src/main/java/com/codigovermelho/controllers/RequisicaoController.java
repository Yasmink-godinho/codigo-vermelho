package com.codigovermelho.controllers;

import com.codigovermelho.controllers.dto.RequisicaoResponse;
import com.codigovermelho.models.Requisicao;
import com.codigovermelho.models.enums.NivelUrgencia;
import com.codigovermelho.models.enums.StatusRequisicao;
import com.codigovermelho.models.enums.TipoComponente;
import com.codigovermelho.models.enums.TipoSanguineo;
import com.codigovermelho.services.RequisicaoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/requisicoes")
public class RequisicaoController {

    private final RequisicaoService requisicaoService;

    public RequisicaoController(RequisicaoService requisicaoService) {
        this.requisicaoService = requisicaoService;
    }

    public record NovaRequisicaoRequest(Long instituicaoId, TipoSanguineo tipoSanguineo, TipoComponente componente,
                                        Integer volume, NivelUrgencia nivelUrgencia, String observacoes) {}

    @PostMapping
    public ResponseEntity<RequisicaoResponse> emitir(@RequestBody NovaRequisicaoRequest request) {
        Requisicao requisicao = requisicaoService.emitir(request.instituicaoId(), request.tipoSanguineo(),
                request.componente(), request.volume(), request.nivelUrgencia(), request.observacoes());
        return ResponseEntity.status(HttpStatus.CREATED).body(RequisicaoResponse.fromEntity(requisicao));
    }

    @GetMapping
    public ResponseEntity<List<RequisicaoResponse>> listar(
            @RequestParam(required = false) StatusRequisicao status,
            @RequestParam(required = false) NivelUrgencia urgencia) {
        return ResponseEntity.ok(requisicaoService.listar(status, urgencia).stream()
                .map(RequisicaoResponse::fromEntity).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RequisicaoResponse> detalhar(@PathVariable Long id) {
        return ResponseEntity.ok(RequisicaoResponse.fromEntity(requisicaoService.buscarPorId(id)));
    }
}
