package com.codigovermelho.models.enums;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Os 8 tipos sanguineos ABO/Rh utilizados no sistema.
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

    @JsonValue
    public String getLabel() {
        return label;
    }

    @JsonCreator
    public static TipoSanguineo fromLabel(String value) {
        for (TipoSanguineo tipo : values()) {
            if (tipo.label.equalsIgnoreCase(value)) {
                return tipo;
            }
        }

        throw new IllegalArgumentException("Tipo sanguineo invalido: " + value);
    }
}
