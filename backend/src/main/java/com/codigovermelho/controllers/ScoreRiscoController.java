package com.codigovermelho.controllers;

import com.codigovermelho.controllers.dto.ScoreRiscoResponse;
import com.codigovermelho.services.ScoreRiscoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * GET /api/v1/processamento/score-risco?registros=1000000&modo=threads&threads=8
 */
@RestController
@RequestMapping("/api/v1/processamento")
public class ScoreRiscoController {

    private final ScoreRiscoService scoreRiscoService;

    public ScoreRiscoController(ScoreRiscoService scoreRiscoService) {
        this.scoreRiscoService = scoreRiscoService;
    }

    @GetMapping("/score-risco")
    public ResponseEntity<ScoreRiscoResponse> calcular(
            @RequestParam(defaultValue = "100000") int registros,
            @RequestParam(defaultValue = "sequencial") String modo,
            @RequestParam(defaultValue = "2") int threads) {
        return ResponseEntity.ok(scoreRiscoService.calcular(registros, modo, threads));
    }
}