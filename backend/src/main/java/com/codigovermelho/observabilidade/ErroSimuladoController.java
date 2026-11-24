package com.codigovermelho.observabilidade;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Endpoint de teste da observabilidade: sempre responde 500.
 *
 * Serve para o caso de erro exigido no projeto de RSD: alimenta o painel de taxa de erros 5xx,
 * gera uma linha de log ERROR com trace_id no Loki e um trace com erro no Tempo.
 * So existe quando app.observabilidade.endpoint-erro.habilitado=true (o docker compose liga;
 * em producao/Render fica desligado).
 */
@RestController
@RequestMapping("/api/v1/observabilidade")
@ConditionalOnProperty(name = "app.observabilidade.endpoint-erro.habilitado", havingValue = "true")
public class ErroSimuladoController {

    private static final Logger log = LoggerFactory.getLogger(ErroSimuladoController.class);

    @GetMapping("/erro-simulado")
    public void erroSimulado() {
        log.error("Erro simulado para teste de observabilidade (falha ao consultar estoque da unidade)");
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "erro simulado");
    }
}
