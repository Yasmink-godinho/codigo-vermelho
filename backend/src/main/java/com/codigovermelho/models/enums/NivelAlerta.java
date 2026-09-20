package com.codigovermelho.models.enums;

/**
 * Classificacao do nivel de alerta de estoque, conforme as regras
 * documentadas no README (Normal / Atencao / Critico / Risco de Vencimento).
 * Sera usado pelo EstoqueService (proxima etapa do backend).
 */
public enum NivelAlerta {
    NORMAL,
    ATENCAO,
    CRITICO,
    RISCO_VENCIMENTO
}
