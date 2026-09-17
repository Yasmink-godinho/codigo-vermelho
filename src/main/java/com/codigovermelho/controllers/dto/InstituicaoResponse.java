package com.codigovermelho.controllers.dto;

import com.codigovermelho.models.Instituicao;
import com.codigovermelho.models.enums.TipoSanguineo;
import java.util.Map;

public record InstituicaoResponse(
        Long id,
        String name,
        String type,
        String location,
        Double latitude,
        Double longitude,
        Map<TipoSanguineo, Integer> minStock
) {
    public static InstituicaoResponse fromEntity(Instituicao inst) {
        return new InstituicaoResponse(
                inst.getId(),
                inst.getNome(),
                inst.getTipo() != null ? inst.getTipo().name() : null,
                inst.getEndereco(),
                inst.getLatitude(),
                inst.getLongitude(),
                inst.getEstoqueMinimoPorTipo()
        );
    }
}