package com.codigovermelho.services;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

// Fonte simulada de telemetria pra demonstracao, ja que nao temos sensor de verdade.
// Gera leituras e manda pelo mesmo caminho que um sensor mandaria (TelemetriaService),
// entao a regra de alerta e a mesma. Quando tiver sensor real, e so parar de usar essa classe.
@Service
public class SimuladorTelemetriaService {

    private static final int MAXIMO_LEITURAS = 50;

    private final TelemetriaService telemetriaService;
    private final Random random = new Random();

    public SimuladorTelemetriaService(TelemetriaService telemetriaService) {
        this.telemetriaService = telemetriaService;
    }

    // As leituras normais ficam entre 2.5 e 5.5 (dentro da faixa).
    // Se comDesvio for true a ultima leitura vem com 7.4 graus pra disparar o alerta.
    public List<TelemetriaService.ResultadoLeitura> simular(Long transferenciaId, int quantidade, boolean comDesvio) {
        if (quantidade < 1 || quantidade > MAXIMO_LEITURAS) {
            throw new IllegalArgumentException("quantidade deve ficar entre 1 e " + MAXIMO_LEITURAS);
        }
        List<TelemetriaService.ResultadoLeitura> resultados = new ArrayList<>();
        for (int i = 1; i <= quantidade; i++) {
            double temperatura = 2.5 + random.nextDouble() * 3.0;
            if (comDesvio && i == quantidade) {
                temperatura = 7.4;
            }
            temperatura = Math.round(temperatura * 10) / 10.0; // uma casa decimal
            resultados.add(telemetriaService.registrarLeitura(transferenciaId, temperatura));
        }
        return resultados;
    }
}
