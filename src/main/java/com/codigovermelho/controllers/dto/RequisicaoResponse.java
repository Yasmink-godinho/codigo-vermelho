package com.codigovermelho.controllers.dto;

import com.codigovermelho.models.Requisicao;

import java.time.LocalDateTime;

/**
 * DTO de saida da Requisicao (US04).
 *
 * Motivo de existir: Requisicao.instituicaoSolicitante e um relacionamento
 * LAZY, e o projeto usa spring.jpa.open-in-view=false. Se o Controller
 * devolvesse a entidade Requisicao direto (como estava antes), o Jackson
 * tentaria serializar o proxy da instituicao fora de uma transacao aberta,
 * o que gera LazyInitializationException em tempo de execucao. Por isso a
 * conversao para DTO aqui nao e "boa pratica" opcional, e sim a correcao de
 * um bug de serializacao.
 */
public record RequisicaoResponse(
        Long id,
        String codigoRequisicao,
        Long instituicaoSolicitanteId,
        String instituicaoSolicitanteNome,
        String tipoSanguineo,
        String componente,
        Integer volume,
        String nivelUrgencia,
        String status,
        String observacoes,
        LocalDateTime dataCriacao
) {
    public static RequisicaoResponse fromEntity(Requisicao requisicao) {
        return new RequisicaoResponse(
                requisicao.getId(),
                requisicao.getCodigoRequisicao(),
                requisicao.getInstituicaoSolicitante() != null ? requisicao.getInstituicaoSolicitante().getId() : null,
                requisicao.getInstituicaoSolicitante() != null ? requisicao.getInstituicaoSolicitante().getNome() : null,
                requisicao.getTipoSanguineo() != null ? requisicao.getTipoSanguineo().getLabel() : null,
                requisicao.getComponente() != null ? requisicao.getComponente().name() : null,
                requisicao.getVolume(),
                requisicao.getNivelUrgencia() != null ? requisicao.getNivelUrgencia().name() : null,
                requisicao.getStatus() != null ? requisicao.getStatus().name() : null,
                requisicao.getObservacoes(),
                requisicao.getDataCriacao()
        );
    }
}
