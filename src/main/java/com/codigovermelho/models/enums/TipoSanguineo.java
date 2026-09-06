package com.codigovermelho.models.enums;

/**
 * Os 8 tipos sanguineos ABO/Rh utilizados no sistema.
 * O campo "label" guarda a representacao usual (ex: "O+") para exibicao,
 * ja que o nome do enum em Java nao pode conter simbolos como + ou -.
 */
public enum TipoSanguineo {

    A_POSITIVO("A+"),
    A_NEGATIVO("A-"),
    B_POSITIVO("B+"),
    B_NEGATIVO("B-"),
    AB_POSITIVO("AB+"),
    AB_NEGATIVO("AB-"),
    O_POSITIVO("O+"),
    O_NEGATIVO("O-");

    private final String label;

    TipoSanguineo(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
