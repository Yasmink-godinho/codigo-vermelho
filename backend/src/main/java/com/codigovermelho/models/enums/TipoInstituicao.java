package com.codigovermelho.models.enums;

/**
 * Tipos de instituicao que podem integrar a malha logistica (US01).
 *
 * O campo "label" guarda a representacao legivel (ex: "Hospital Público")
 * usada nas respostas da API (InstituicaoResponse), no mesmo padrao ja
 * usado em TipoSanguineo.getLabel() - evita devolver o nome cru do enum
 * Java para o frontend. Os valores batem com o tipo InstType definido em
 * src/types/index.ts do frontend.
 */
public enum TipoInstituicao {
    HEMOCENTRO("Hemocentro"),
    HOSPITAL_PUBLICO("Hospital Público"),
    HOSPITAL_PRIVADO("Hospital Privado"),
    MATERNIDADE("Maternidade"),
    UPA("UPA"),
    CLINICA("Clínica");

    private final String label;

    TipoInstituicao(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
