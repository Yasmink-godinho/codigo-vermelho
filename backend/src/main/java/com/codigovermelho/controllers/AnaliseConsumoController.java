package com.codigovermelho.controllers;

import com.codigovermelho.controllers.dto.AnaliseConsumoResponse;
import com.codigovermelho.services.AnaliseConsumoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analises")
public class AnaliseConsumoController {

    private final AnaliseConsumoService analiseConsumoService;

    public AnaliseConsumoController(AnaliseConsumoService analiseConsumoService) {
        this.analiseConsumoService = analiseConsumoService;
    }

    @GetMapping("/consumo")
    public ResponseEntity<AnaliseConsumoResponse> analisar(
            @RequestParam(defaultValue = "100000") int registros,
            @RequestParam(defaultValue = "sequencial") String modo,
            @RequestParam(defaultValue = "2") int threads) {
        return ResponseEntity.ok(analiseConsumoService.analisar(registros, modo, threads));
    }
}