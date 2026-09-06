package com.codigovermelho.models.enums;

/**
 * Componentes sanguineos manipulados pelo sistema (US02).
 *
 * O campo "diasValidadePadrao" alimenta o calculo automatico da data de
 * validade de um lote a partir da data de coleta (US02: "calculada
 * automaticamente a partir do prazo padrao do componente, mas editavel").
 *
 * Os valores abaixo sao parametros do projeto academico (ordem de grandeza
 * real de bancos de sangue), e podem ser ajustados pelo time/PO conforme
 * a fonte de dados adotada — nao devem ser tratados como orientacao clinica.
 */
public enum TipoComponente {

    CONCENTRADO_HEMACIAS(42),
    PLASMA(365),
    PLAQUETAS(5),
    CRIOPRECIPITADO(365);

    private final int diasValidadePadrao;

    TipoComponente(int diasValidadePadrao) {
        this.diasValidadePadrao = diasValidadePadrao;
    }

    public int getDiasValidadePadrao() {
        return diasValidadePadrao;
    }
}
