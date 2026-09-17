package com.codigovermelho.controllers;

import com.codigovermelho.models.Requisicao;
import com.codigovermelho.models.enums.NivelUrgencia;
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
    public ResponseEntity<Requisicao> emitir(@RequestBody NovaRequisicaoRequest request) {
        Requisicao requisicao = requisicaoService.emitir(request.instituicaoId(), request.tipoSanguineo(),
                request.componente(), request.volume(), request.nivelUrgencia(), request.observacoes());
        return ResponseEntity.status(HttpStatus.CREATED).body(requisicao);
    }

    @GetMapping
    public ResponseEntity<List<Requisicao>> listar() {
        return ResponseEntity.ok(requisicaoService.listarTodas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Requisicao> detalhar(@PathVariable Long id) {
        return ResponseEntity.ok(requisicaoService.buscarPorId(id));
    }
}
