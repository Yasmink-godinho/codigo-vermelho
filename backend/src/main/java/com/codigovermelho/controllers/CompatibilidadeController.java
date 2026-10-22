package com.codigovermelho.controllers;

import com.codigovermelho.controllers.dto.CompatibilidadeResponse;
import com.codigovermelho.models.enums.TipoSanguineo;
import com.codigovermelho.services.CompatibilidadeSanguinea;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * US08 — Matching Imunologico (ABO/Rh).
 *
 * GET /api/v1/compatibilidade?doador=O-&receptor=AB+
 *   -> { "doador":"O-", "receptor":"AB+", "compativel":true, "motivo":"..." }
 *
 * GET /api/v1/compatibilidade/doadores?receptor=AB+
 *   -> { "receptor":"AB+", "doadoresCompativeis":["A+","A-", ...] }
 *
 * Os tipos chegam como texto ("O-", "AB+") e sao convertidos por
 * TipoSanguineo.fromString, que lanca IllegalArgumentException em valor
 * invalido (tratada como 400 no GlobalExceptionHandler).
 */
@RestController
@RequestMapping("/api/v1/compatibilidade")
public class CompatibilidadeController {

    @GetMapping
    public ResponseEntity<CompatibilidadeResponse> verificar(
            @RequestParam String doador, @RequestParam String receptor) {
        TipoSanguineo tipoDoador = TipoSanguineo.fromString(doador);
        TipoSanguineo tipoReceptor = TipoSanguineo.fromString(receptor);

        boolean compativel = CompatibilidadeSanguinea.compativel(tipoDoador, tipoReceptor);
        String motivo = CompatibilidadeSanguinea.motivo(tipoDoador, tipoReceptor);
        return ResponseEntity.ok(CompatibilidadeResponse.de(tipoDoador, tipoReceptor, compativel, motivo));
    }

    @GetMapping("/doadores")
    public ResponseEntity<CompatibilidadeResponse> doadoresCompativeis(@RequestParam String receptor) {
        TipoSanguineo tipoReceptor = TipoSanguineo.fromString(receptor);
        return ResponseEntity.ok(CompatibilidadeResponse.paraReceptor(
                tipoReceptor, CompatibilidadeSanguinea.doadoresCompativeis(tipoReceptor)));
    }
}
