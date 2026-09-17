package com.codigovermelho.controllers.dto;

import com.codigovermelho.models.enums.TipoComponente;
import com.codigovermelho.models.enums.TipoSanguineo;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import java.time.LocalDate;

public record NovoLoteRequest(
        @NotNull(message = "Tipo sanguíneo é obrigatório")
        TipoSanguineo tipoSanguineo,

        @NotNull(message = "Componente é obrigatório")
        TipoComponente componente,

        @NotNull(message = "Data de coleta é obrigatória")
        @PastOrPresent(message = "Data de coleta não pode ser no futuro")
        LocalDate dataColeta,

        @NotNull(message = "Quantidade é obrigatória")
        @Min(value = 1, message = "Quantidade deve ser maior que zero")
        Integer quantidade
) {}