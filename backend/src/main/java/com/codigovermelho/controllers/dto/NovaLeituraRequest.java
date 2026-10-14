package com.codigovermelho.controllers.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

// Corpo do POST de telemetria: so a temperatura em graus Celsius.
// A hora da leitura quem coloca e o servidor.
public record NovaLeituraRequest(

        @NotNull(message = "Temperatura e obrigatoria")
        @DecimalMin(value = "-100.0", message = "Temperatura invalida (minimo -100)")
        @DecimalMax(value = "100.0", message = "Temperatura invalida (maximo 100)")
        Double temperatura
) {
}
