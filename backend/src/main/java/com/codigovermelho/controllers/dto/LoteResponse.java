package com.codigovermelho.controllers.dto;

import com.codigovermelho.models.LoteHemocomponente;
import java.time.LocalDate;

public record LoteResponse(
        Long id,
        Long instId,
        String instName,
        String bloodType,
        String component,
        LocalDate collectionDate,
        LocalDate expiryDate,
        Integer quantity,
        String lotCode
) {
    public static LoteResponse fromEntity(LoteHemocomponente lote) {
        return new LoteResponse(
                lote.getId(),
                lote.getInstituicao() != null ? lote.getInstituicao().getId() : null,
                lote.getInstituicao() != null ? lote.getInstituicao().getNome() : null,
                lote.getTipoSanguineo() != null ? lote.getTipoSanguineo().getLabel() : null,
                lote.getComponente() != null ? lote.getComponente().getLabel() : null, // antes: .name() cru
                lote.getDataColeta(),
                lote.getDataValidade(),
                lote.getQuantidade(),
                lote.getCodigoLote()
        );
    }
}
