package com.codigovermelho.controllers.dto;

import com.codigovermelho.models.AlertaTermico;
import com.codigovermelho.models.LeituraTelemetria;

import java.time.LocalDateTime;

// O campo alerta so vem preenchido na resposta do POST (quando a leitura gerou alerta).
// Na listagem do historico ele vem null, pra consultar os alertas use o endpoint de alertas.
public record LeituraResponse(
        Long id,
        Long transferenciaId,
        Double temperatura,
        LocalDateTime dataHora,
        boolean foraDaFaixa,
        AlertaTermicoResponse alerta
) {

    public static LeituraResponse fromEntity(LeituraTelemetria leitura) {
        return fromEntity(leitura, null);
    }

    public static LeituraResponse fromEntity(LeituraTelemetria leitura, AlertaTermico alerta) {
        return new LeituraResponse(
                leitura.getId(),
                leitura.getTransferencia().getId(),
                leitura.getTemperatura(),
                leitura.getDataHora(),
                leitura.isForaDaFaixa(),
                alerta == null ? null : AlertaTermicoResponse.fromEntity(alerta)
        );
    }
}
