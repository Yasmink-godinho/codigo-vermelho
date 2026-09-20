package com.codigovermelho.controllers.dto;

import com.codigovermelho.models.Requisicao;

import java.time.ZoneId;

/**
 * DTO de resposta para Requisicao, no formato que o frontend
 * (src/types/index.ts, interface Requisicao) espera.
 *
 * ATENCAO - 2 divergencias de vocabulario entre back e front, decididas
 * aqui da forma mais segura possivel; ajustar se o time decidir diferente:
 *
 * 1) O backend tem StatusRequisicao.RECUSADA, o frontend tem ReqStatus
 *    "negada" (nomes diferentes para o mesmo conceito) -> mapeado abaixo.
 * 2) O backend tem StatusRequisicao.ATENDIDA (requisicao ja suprida por
 *    uma transferencia), que NAO EXISTE no ReqStatus do frontend ainda
 *    (so tem pendente/em_analise/aprovada/negada). Por enquanto mapeado
 *    para "aprovada" para nao quebrar a tela; quando US09/Transferencia
 *    forem implementadas, vale adicionar "atendida" ao tipo ReqStatus
 *    no frontend.
 */
public record RequisicaoResponse(
        Long id,
        String reqCode,
        Long instId,
        String instName,
        String bloodType,
        String component,
        Integer quantity,
        String urgency,
        String observations,
        String status,
        long createdAt
) {

    public static RequisicaoResponse fromEntity(Requisicao requisicao) {
        return new RequisicaoResponse(
                requisicao.getId(),
                requisicao.getCodigoRequisicao(),
                requisicao.getInstituicaoSolicitante().getId(),
                requisicao.getInstituicaoSolicitante().getNome(),
                requisicao.getTipoSanguineo().getLabel(),
                nomeLegivelComponente(requisicao.getComponente().name()),
                requisicao.getVolume(),
                mapUrgencia(requisicao.getNivelUrgencia().name()),
                requisicao.getObservacoes(),
                mapStatus(requisicao.getStatus().name()),
                requisicao.getDataCriacao().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()
        );
    }

    private static String mapUrgencia(String nomeEnum) {
        return switch (nomeEnum) {
            case "ROTINA" -> "rotina";
            case "PRIORITARIA" -> "prioritaria";
            case "EMERGENCIA" -> "emergencia";
            default -> nomeEnum.toLowerCase();
        };
    }

    private static String mapStatus(String nomeEnum) {
        return switch (nomeEnum) {
            case "PENDENTE" -> "pendente";
            case "EM_ANALISE" -> "em_analise";
            case "APROVADA" -> "aprovada";
            case "RECUSADA" -> "negada";           // divergencia 1
            case "ATENDIDA" -> "aprovada";          // divergencia 2 (provisorio)
            default -> nomeEnum.toLowerCase();
        };
    }

    private static String nomeLegivelComponente(String nomeEnum) {
        return switch (nomeEnum) {
            case "CONCENTRADO_HEMACIAS" -> "Concentrado de Hemácias";
            case "PLASMA" -> "Plasma";
            case "PLAQUETAS" -> "Plaquetas";
            case "CRIOPRECIPITADO" -> "Crioprecipitado";
            default -> nomeEnum;
        };
    }
}
