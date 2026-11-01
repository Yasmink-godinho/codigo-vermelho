package com.codigovermelho.controllers.dto;

import java.time.LocalDate;
import java.util.List;

public record AlocacaoCompatibilidadeResponse(boolean compativel, boolean alocacaoBloqueada, String motivo,
        Long requisicaoId, Long loteId, String tipoRequisicao, String componenteRequisicao,
        String tipoLote, String componenteLote, List<Alternativa> alternativas) {
    public AlocacaoCompatibilidadeResponse {
        alternativas = alternativas == null ? List.of() : List.copyOf(alternativas);
    }
    public record Alternativa(Long loteId, String codigoLote, String tipoSanguineo, String componente,
            Integer quantidade, LocalDate validade, Long instituicaoId, String instituicaoNome,
            Boolean quantidadeSuficiente) {}
}
