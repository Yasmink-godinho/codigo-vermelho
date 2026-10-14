package com.codigovermelho.controllers;

import com.codigovermelho.controllers.dto.RotaResultado;
import com.codigovermelho.services.RotaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// GET /api/v1/rotas?origem=1&destino=3
// Sempre responde 200 quando o pedido e valido. Se nao existe caminho, rotaEncontrada vem false
// (isso ficou definido no docs/poo/CONTRATOS_API.md, nao e 404).
@RestController
@RequestMapping("/api/v1/rotas")
public class RotaController {

    private final RotaService rotaService;

    public RotaController(RotaService rotaService) {
        this.rotaService = rotaService;
    }

    @GetMapping
    public ResponseEntity<RotaResultado> calcular(@RequestParam Long origem, @RequestParam Long destino) {
        return ResponseEntity.ok(rotaService.calcularRota(origem, destino));
    }
}
