package com.codigovermelho.controllers.dto;

import com.codigovermelho.models.AlertaTermico;

import java.time.LocalDateTime;

public record AlertaTermicoResponse(
        Long id,
        Long transferenciaId,
        String codigoTransferencia,
        Long leituraId,
        Double temperatura,
        String nivel,
        String mensagem,
        LocalDateTime dataHora
) {

    public static AlertaTermicoResponse fromEntity(AlertaTermico alerta) {
        return new AlertaTermicoResponse(
                alerta.getId(),
                alerta.getTransferencia().getId(),
                alerta.getTransferencia().getCodigo(),
                alerta.getLeitura().getId(),
                alerta.getTemperatura(),
                alerta.getNivel().name(),
                alerta.getMensagem(),
                alerta.getDataHora()
        );
    }
}
