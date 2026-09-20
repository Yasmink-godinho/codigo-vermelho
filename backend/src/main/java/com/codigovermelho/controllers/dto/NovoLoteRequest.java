package com.codigovermelho.controllers.dto;

import com.codigovermelho.models.enums.TipoComponente;
import com.codigovermelho.models.enums.TipoSanguineo;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import java.time.LocalDate;

public record NovoLoteRequest(
        @NotNull(message = "Tipo sanguineo e obrigatorio")
        TipoSanguineo tipoSanguineo,

        @NotNull(message = "Componente e obrigatorio")
        TipoComponente componente,

        @NotNull(message = "Data de coleta e obrigatoria")
        @PastOrPresent(message = "Data de coleta nao pode ser no futuro")
        LocalDate dataColeta,

        @FutureOrPresent(message = "Data de validade nao pode ser retroativa")
        LocalDate validade,

        @NotNull(message = "Quantidade e obrigatoria")
        @Min(value = 1, message = "Quantidade deve ser maior que zero")
        Integer quantidade
) {}
