package com.codigovermelho.controllers;

import com.codigovermelho.controllers.dto.RedeStatusResponse;
import com.codigovermelho.services.MonitoramentoRede;
import com.codigovermelho.services.SondaSaude;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// US10 — GET /api/v1/rede/status: latencia media, throughput, taxa de erro, uptime e saude por endpoint.
// Endpoints INDISPONIVEL ou com taxa de erro > 5% (DEGRADADO) vem com alerta=true e no topo da lista.
@RestController
@RequestMapping("/api/v1/rede")
public class RedeController {

    private final MonitoramentoRede monitoramento;
    private final SondaSaude sonda;

    public RedeController(MonitoramentoRede monitoramento, SondaSaude sonda) {
        this.monitoramento = monitoramento;
        this.sonda = sonda;
    }

    @GetMapping("/status")
    public ResponseEntity<RedeStatusResponse> status() {
        return ResponseEntity.ok(RedeStatusResponse.de(monitoramento.resumir(), List.of(sonda.verificarBanco())));
    }
}
