package com.codigovermelho.models.enums;

/**
 * Componentes sanguineos manipulados pelo sistema (US02).
 *
 * O campo "diasValidadePadrao" alimenta o calculo automatico da data de
 * validade de um lote a partir da data de coleta (US02: "calculada
 * automaticamente a partir do prazo padrao do componente, mas editavel").
 *
 * O campo "label" guarda a representacao legivel (ex: "Concentrado de
 * Hemacias") usada nas respostas da API (LoteResponse), seguindo o mesmo
 * padrao ja usado em TipoSanguineo.getLabel() - evita devolver o nome cru
 * do enum Java para o frontend.
 */
public enum TipoComponente {

    CONCENTRADO_HEMACIAS(42, "Concentrado de Hemácias"),
    PLASMA(365, "Plasma"),
    PLAQUETAS(5, "Plaquetas"),
    CRIOPRECIPITADO(365, "Crioprecipitado");

    private final int diasValidadePadrao;
    private final String label;

    TipoComponente(int diasValidadePadrao, String label) {
        this.diasValidadePadrao = diasValidadePadrao;
        this.label = label;
    }

    public int getDiasValidadePadrao() {
        return diasValidadePadrao;
    }

    public String getLabel() {
        return label;
    }
}
