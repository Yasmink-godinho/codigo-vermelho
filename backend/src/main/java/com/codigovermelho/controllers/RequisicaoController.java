package com.codigovermelho.controllers;

import com.codigovermelho.controllers.dto.AtualizarRequisicaoRequest;
import com.codigovermelho.controllers.dto.NovaRequisicaoRequest;
import com.codigovermelho.controllers.dto.RequisicaoResponse;
import com.codigovermelho.models.Requisicao;
import com.codigovermelho.models.enums.NivelUrgencia;
import com.codigovermelho.models.enums.StatusRequisicao;
import com.codigovermelho.services.RequisicaoService;
import jakarta.validation.Valid;
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

    @PostMapping
    public ResponseEntity<RequisicaoResponse> emitir(@Valid @RequestBody NovaRequisicaoRequest request) {
        Requisicao requisicao = requisicaoService.emitir(request);
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

    /**
     * PATCH em vez de PUT: so atualiza o status, nao o registro inteiro
     * (mesmo raciocinio ja usado em AtualizarLoteRequest, que so atualiza
     * a validade em vez de reenviar o lote inteiro).
     */
    @PatchMapping("/{id}")
    public ResponseEntity<RequisicaoResponse> atualizarStatus(
            @PathVariable Long id, @Valid @RequestBody AtualizarRequisicaoRequest request) {
        return ResponseEntity.ok(RequisicaoResponse.fromEntity(requisicaoService.atualizarStatus(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        requisicaoService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
