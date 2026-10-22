package com.codigovermelho.models.enums;

// Situacao da transferencia. Por enquanto so tem os estados que a US05 e a US07 usam.
// Quando a US09 (redistribuicao) for feita da pra colocar SOLICITADA, APROVADA etc aqui.
public enum StatusTransferencia {
    EM_TRANSPORTE,
    ENTREGUE,
    CANCELADA
}
