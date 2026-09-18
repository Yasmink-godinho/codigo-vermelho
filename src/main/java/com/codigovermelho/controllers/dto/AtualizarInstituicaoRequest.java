package com.codigovermelho.controllers.dto;

import com.codigovermelho.models.enums.TipoInstituicao;
import com.codigovermelho.models.enums.TipoSanguineo;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Map;

public record AtualizarInstituicaoRequest(
        @NotBlank(message = "Nome da instituicao e obrigatorio")
        String nome,

        @NotNull(message = "Tipo de instituicao e obrigatorio")
        TipoInstituicao tipo,

        @NotBlank(message = "Endereco e obrigatorio")
        String endereco,

        @NotNull(message = "Latitude e obrigatoria")
        @DecimalMin(value = "-90.0", message = "Coordenadas invalidas")
        @DecimalMax(value = "90.0", message = "Coordenadas invalidas")
        Double latitude,

        @NotNull(message = "Longitude e obrigatoria")
        @DecimalMin(value = "-180.0", message = "Coordenadas invalidas")
        @DecimalMax(value = "180.0", message = "Coordenadas invalidas")
        Double longitude,

        Map<TipoSanguineo, Integer> estoqueMinimoPorTipo
) {}
