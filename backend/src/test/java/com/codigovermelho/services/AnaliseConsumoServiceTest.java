package com.codigovermelho.services;

import com.codigovermelho.controllers.dto.AnaliseConsumoResponse;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AnaliseConsumoServiceTest {

    private final AnaliseConsumoService service = new AnaliseConsumoService();

    @Test
    void modosSequencialEParaleloProduzemAMesmaAnalise() {
        AnaliseConsumoResponse sequencial = service.analisar(100_000, "sequencial", 2);
        AnaliseConsumoResponse paralelo = service.analisar(100_000, "threads", 4);

        assertEquals(sequencial.registros(), paralelo.registros());
        assertEquals(sequencial.somaConsumo(), paralelo.somaConsumo());
        assertEquals(sequencial.media(), paralelo.media());
        assertEquals(sequencial.variancia(), paralelo.variancia());
        assertEquals(sequencial.desvioPadrao(), paralelo.desvioPadrao());
        assertEquals(sequencial.coeficienteVariacao(), paralelo.coeficienteVariacao());
    }
}