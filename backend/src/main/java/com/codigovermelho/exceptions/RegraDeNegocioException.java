package com.codigovermelho.exceptions;

// Lancada quando o pedido ate esta certo, mas a regra de negocio nao deixa fazer
// (ex: nao tem rota entre as instituicoes, carga nao esta em transito).
// O GlobalExceptionHandler transforma isso em HTTP 409.
public class RegraDeNegocioException extends RuntimeException {

    public RegraDeNegocioException(String mensagem) {
        super(mensagem);
    }
}
