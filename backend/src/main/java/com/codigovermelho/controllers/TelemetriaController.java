package com.codigovermelho.controllers;

import com.codigovermelho.controllers.dto.AlertaTermicoResponse;
import com.codigovermelho.controllers.dto.LeituraResponse;
import com.codigovermelho.controllers.dto.NovaLeituraRequest;
import com.codigovermelho.services.SimuladorTelemetriaService;
import com.codigovermelho.services.TelemetriaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// US07 - telemetria e alertas termicos
@RestController
@RequestMapping("/api/v1")
public class TelemetriaController {

    private final TelemetriaService telemetriaService;
    private final SimuladorTelemetriaService simuladorService;

    public TelemetriaController(TelemetriaService telemetriaService, SimuladorTelemetriaService simuladorService) {
        this.telemetriaService = telemetriaService;
        this.simuladorService = simuladorService;
    }

    // Sempre 201 quando a leitura e aceita, mesmo fora da faixa (nao e erro, e regra de negocio).
    // Se estiver fora da faixa o alerta criado vem dentro da resposta.
    @PostMapping("/transferencias/{id}/telemetria")
    public ResponseEntity<LeituraResponse> registrar(@PathVariable Long id,
                                                     @Valid @RequestBody NovaLeituraRequest request) {
        TelemetriaService.ResultadoLeitura resultado = telemetriaService.registrarLeitura(id, request.temperatura());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(LeituraResponse.fromEntity(resultado.leitura(), resultado.alerta()));
    }

    // historico de leituras da transferencia, da mais antiga pra mais nova
    @GetMapping("/transferencias/{id}/telemetria")
    public ResponseEntity<List<LeituraResponse>> historico(@PathVariable Long id) {
        return ResponseEntity.ok(telemetriaService.listarLeituras(id).stream()
                .map(LeituraResponse::fromEntity).toList());
    }

    @GetMapping("/transferencias/{id}/alertas")
    public ResponseEntity<List<AlertaTermicoResponse>> alertasDaTransferencia(@PathVariable Long id) {
        return ResponseEntity.ok(telemetriaService.listarAlertas(id).stream()
                .map(AlertaTermicoResponse::fromEntity).toList());
    }

    // todos os alertas termicos (pra Central de Alertas)
    @GetMapping("/alertas-termicos")
    public ResponseEntity<List<AlertaTermicoResponse>> todosOsAlertas() {
        return ResponseEntity.ok(telemetriaService.listarTodosAlertas().stream()
                .map(AlertaTermicoResponse::fromEntity).toList());
    }

    // Fonte simulada pra demonstrar: gera leituras como se fosse o sensor da carga.
    // comDesvio=true faz a ultima leitura sair da faixa e disparar o alerta.
    @PostMapping("/transferencias/{id}/telemetria/simulacao")
    public ResponseEntity<List<LeituraResponse>> simular(
            @PathVariable Long id,
            @RequestParam(defaultValue = "5") int quantidade,
            @RequestParam(defaultValue = "false") boolean comDesvio) {
        List<LeituraResponse> resposta = simuladorService.simular(id, quantidade, comDesvio).stream()
                .map(r -> LeituraResponse.fromEntity(r.leitura(), r.alerta()))
                .toList();
        return ResponseEntity.status(HttpStatus.CREATED).body(resposta);
    }
}
