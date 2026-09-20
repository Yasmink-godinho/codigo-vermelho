package com.codigovermelho.controllers.dto;

import jakarta.validation.constraints.FutureOrPresent;
import java.time.LocalDate;

public record AtualizarLoteRequest(
        @FutureOrPresent(message = "Data de validade nao pode ser retroativa")
        LocalDate validade
) {}
