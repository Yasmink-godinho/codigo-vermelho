package com.codigovermelho.exceptions;

import com.codigovermelho.controllers.dto.AlocacaoCompatibilidadeResponse;
import java.util.List;

public class AlocacaoIncompativelException extends RuntimeException {
    private final List<AlocacaoCompatibilidadeResponse.Alternativa> alternativas;
    public AlocacaoIncompativelException(String message, List<AlocacaoCompatibilidadeResponse.Alternativa> alternativas) {
        super(message); this.alternativas = alternativas == null ? List.of() : List.copyOf(alternativas);
    }
    public List<AlocacaoCompatibilidadeResponse.Alternativa> getAlternativas() { return alternativas; }
}
