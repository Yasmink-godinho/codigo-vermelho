package com.codigovermelho.controllers.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record LoteLeituraRequest(
        @NotEmpty(message = "O lote precisa ter ao menos uma leitura")
        @Size(max = 50, message = "O lote pode ter no maximo 50 leituras")
        List<@Valid NovaLeituraRequest> leituras
) {
}
