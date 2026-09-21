package com.codigovermelho.controllers.dto;

public record AnaliseConsumoResponse(
        String modo,
        int threads,
        int registros,
        long somaConsumo,
        double media,
        double variancia,
        double desvioPadrao,
        double coeficienteVariacao,
        long tempoProcessamentoNanos) {
}