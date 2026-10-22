package com.codigovermelho.controllers.dto;

import com.codigovermelho.models.enums.TipoSanguineo;

import java.util.List;

/**
 * Resposta da US08 (Matching ABO/Rh). Devolve o resultado booleano, uma
 * explicacao legivel e, para o caso de receptor, a lista de tipos de doador
 * compativeis — tudo em labels usuais (ex: "O-"), nao no nome cru do enum.
 */
public record CompatibilidadeResponse(
        String doador,
        String receptor,
        boolean compativel,
        String motivo,
        List<String> doadoresCompativeis) {

    public static CompatibilidadeResponse de(TipoSanguineo doador, TipoSanguineo receptor,
                                             boolean compativel, String motivo) {
        return new CompatibilidadeResponse(
                doador.getLabel(), receptor.getLabel(), compativel, motivo, null);
    }

    public static CompatibilidadeResponse paraReceptor(TipoSanguineo receptor,
                                                       List<TipoSanguineo> doadores) {
        return new CompatibilidadeResponse(
                null, receptor.getLabel(), true,
                "Doadores compativeis para " + receptor.getLabel(),
                doadores.stream().map(TipoSanguineo::getLabel).toList());
    }
}
