package com.codigovermelho.controllers.dto;

import com.codigovermelho.models.enums.TipoComponente;
import com.codigovermelho.models.enums.TipoSanguineo;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record NovaTransferenciaRequest(

        @NotNull(message = "Instituicao de origem e obrigatoria")
        Long origemId,

        @NotNull(message = "Instituicao de destino e obrigatoria")
        Long destinoId,

        @NotNull(message = "Tipo sanguineo e obrigatorio")
        TipoSanguineo tipoSanguineo,

        @NotNull(message = "Componente e obrigatorio")
        TipoComponente componente,

        @NotNull(message = "Quantidade e obrigatoria")
        @Min(value = 1, message = "Quantidade deve ser maior que zero")
        Integer quantidade
) {
}
