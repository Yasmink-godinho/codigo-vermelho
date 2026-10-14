package com.codigovermelho.controllers.dto;

import com.codigovermelho.models.Transferencia;

import java.time.LocalDateTime;

// Nomes dos campos iguais ao JSON de exemplo do docs/RESULTADO_ROTA.md
public record TransferenciaResponse(
        Long id,
        String codigo,
        String instituicaoOrigem,
        String instituicaoDestino,
        String tipoSanguineo,
        String componente,
        Integer quantidade,
        String rota,
        Double distanciaKm,
        LocalDateTime previsaoChegada,
        String statusTransferencia
) {

    public static TransferenciaResponse fromEntity(Transferencia t) {
        return new TransferenciaResponse(
                t.getId(),
                t.getCodigo(),
                t.getOrigem().getNome(),
                t.getDestino().getNome(),
                t.getTipoSanguineo().getLabel(),
                t.getComponente().getLabel(),
                t.getQuantidade(),
                t.getRota(),
                t.getDistanciaKm(),
                t.getPrevisaoChegada(),
                t.getStatus().name()
        );
    }
}
