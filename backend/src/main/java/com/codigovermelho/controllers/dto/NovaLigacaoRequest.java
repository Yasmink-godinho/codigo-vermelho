package com.codigovermelho.controllers.dto;

import jakarta.validation.constraints.NotNull;

public record NovaLigacaoRequest(

        @NotNull(message = "Instituicao de origem e obrigatoria")
        Long origemId,

        @NotNull(message = "Instituicao de destino e obrigatoria")
        Long destinoId
) {
}
