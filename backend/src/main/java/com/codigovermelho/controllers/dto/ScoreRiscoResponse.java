package com.codigovermelho.controllers.dto;

public record ScoreRiscoResponse(
        String modo,
        int threads,
        int registros,
        double mediaScore,
        long quantidadeCriticos,
        long tempoProcessamentoNanos) {
}