package com.codigovermelho.services;

import com.codigovermelho.controllers.dto.ScoreRiscoResponse;
import org.junit.jupiter.api.Test;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ScoreRiscoServiceTest {

    // Mesmo tipo de pool usado em produção (ver ScoreRiscoThreadPoolConfig),
    // criado aqui só para o teste poder instanciar o Service diretamente.
    private final ExecutorService executor = Executors.newFixedThreadPool(8);
    private final ScoreRiscoService service = new ScoreRiscoService(executor);

    /**
     * A soma de doubles não é perfeitamente associativa: somar "por fatias e
     * depois juntar" pode diferir do sequencial na última casa decimal,
     * mesmo sem nenhuma race condition — é reassociação de ponto flutuante,
     * não erro de concorrência. Por isso a comparação usa uma tolerância
     * pequena (DELTA) em vez de igualdade exata.
     */
    private static final double DELTA = 1e-6;

    @Test
    void modosSequencialEComThreadsProduzemOMesmoResultado_2threads() {
        ScoreRiscoResponse sequencial = service.calcular(100_000, "sequencial", 2);
        ScoreRiscoResponse paralelo = service.calcular(100_000, "threads", 2);

        assertEquals(sequencial.registros(), paralelo.registros());
        assertEquals(sequencial.quantidadeCriticos(), paralelo.quantidadeCriticos());
        assertEquals(sequencial.mediaScore(), paralelo.mediaScore(), DELTA);
    }

    @Test
    void modosSequencialEComThreadsProduzemOMesmoResultado_4threads() {
        ScoreRiscoResponse sequencial = service.calcular(100_000, "sequencial", 2);
        ScoreRiscoResponse paralelo = service.calcular(100_000, "threads", 4);

        assertEquals(sequencial.quantidadeCriticos(), paralelo.quantidadeCriticos());
        assertEquals(sequencial.mediaScore(), paralelo.mediaScore(), DELTA);
    }

    @Test
    void modosSequencialEComThreadsProduzemOMesmoResultado_8threads() {
        ScoreRiscoResponse sequencial = service.calcular(100_000, "sequencial", 2);
        ScoreRiscoResponse paralelo = service.calcular(100_000, "threads", 8);

        assertEquals(sequencial.quantidadeCriticos(), paralelo.quantidadeCriticos());
        assertEquals(sequencial.mediaScore(), paralelo.mediaScore(), DELTA);
    }

    @Test
    void naoAceitaQuantidadeDeThreadsInvalida() {
        try {
            service.calcular(1_000, "threads", 3);
            throw new AssertionError("deveria ter lançado IllegalArgumentException");
        } catch (IllegalArgumentException esperado) {
            // ok
        }
    }
}