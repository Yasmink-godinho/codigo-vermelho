package com.codigovermelho.controllers.dto;

import com.codigovermelho.models.Ligacao;

public record LigacaoResponse(
        Long id,
        Long origemId,
        String origemNome,
        Long destinoId,
        String destinoNome,
        double distanciaKm
) {

    public static LigacaoResponse fromEntity(Ligacao ligacao) {
        return new LigacaoResponse(
                ligacao.getId(),
                ligacao.getOrigem().getId(),
                ligacao.getOrigem().getNome(),
                ligacao.getDestino().getId(),
                ligacao.getDestino().getNome(),
                Math.round(ligacao.getDistanciaKm() * 100.0) / 100.0
        );
    }
}
