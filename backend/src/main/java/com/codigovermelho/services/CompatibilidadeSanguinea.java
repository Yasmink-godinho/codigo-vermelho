package com.codigovermelho.services;

import com.codigovermelho.models.enums.TipoSanguineo;

import java.util.Arrays;
import java.util.List;

/**
 * US08 — Matching Imunologico (ABO/Rh).
 *
 * Regra de negocio pura: dado um doador e um receptor, dizer se uma bolsa
 * de concentrado de hemacias pode ser transfundida com seguranca. E a regra
 * de maior risco do sistema (um erro aqui poe um paciente em risco), por isso
 * foi a primeira a nascer de testes (ver CompatibilidadeSanguineaTest).
 *
 * Classe sem estado e sem dependencia de Spring/JPA de proposito: a regra
 * clinica fica isolada, facil de testar unitariamente e impossivel de
 * "contaminar" com detalhe de banco ou de HTTP.
 *
 * Criterio (concentrado de hemacias):
 *   - ABO: O doa para todos; A doa para A e AB; B doa para B e AB; AB so doa para AB.
 *   - Rh:  doador Rh+ NAO pode doar para receptor Rh-; Rh- doa para ambos.
 */
public final class CompatibilidadeSanguinea {

    private CompatibilidadeSanguinea() {
        // classe utilitaria: nao deve ser instanciada
    }

    /**
     * Regra central: o sangue do {@code doador} pode ser transfundido no
     * {@code receptor}? Verdadeiro apenas quando ABO e Rh sao compativeis.
     */
    public static boolean compativel(TipoSanguineo doador, TipoSanguineo receptor) {
        exigirPreenchido(doador, receptor);
        return aboCompativel(doador, receptor) && rhCompativel(doador, receptor);
    }

    /**
     * Lista todos os tipos de doador que podem atender este receptor.
     * Usado pelo matching para filtrar o estoque (lotes) elegivel.
     */
    public static List<TipoSanguineo> doadoresCompativeis(TipoSanguineo receptor) {
        if (receptor == null) {
            throw new IllegalArgumentException("Receptor e obrigatorio");
        }
        return Arrays.stream(TipoSanguineo.values())
                .filter(doador -> compativel(doador, receptor))
                .toList();
    }

    /**
     * Explicacao legivel do resultado — vai direto para a resposta da API,
     * para o operador entender *por que* uma bolsa foi recusada.
     */
    public static String motivo(TipoSanguineo doador, TipoSanguineo receptor) {
        exigirPreenchido(doador, receptor);
        if (!aboCompativel(doador, receptor)) {
            return "Incompativel no sistema ABO: " + doador.getLabel()
                    + " nao pode doar para " + receptor.getLabel();
        }
        if (!rhCompativel(doador, receptor)) {
            return "Incompativel no fator Rh: doador Rh+ nao pode doar para receptor Rh-";
        }
        return "Compativel: " + doador.getLabel() + " pode doar para " + receptor.getLabel();
    }

    private static boolean aboCompativel(TipoSanguineo doador, TipoSanguineo receptor) {
        String grupoDoador = grupoAbo(doador);
        String grupoReceptor = grupoAbo(receptor);
        return switch (grupoDoador) {
            case "O" -> true;                                    // doador universal (ABO)
            case "A" -> grupoReceptor.equals("A") || grupoReceptor.equals("AB");
            case "B" -> grupoReceptor.equals("B") || grupoReceptor.equals("AB");
            case "AB" -> grupoReceptor.equals("AB");             // AB so doa para AB
            default -> false;
        };
    }

    private static boolean rhCompativel(TipoSanguineo doador, TipoSanguineo receptor) {
        // So ha incompatibilidade quando o doador e Rh+ e o receptor e Rh-.
        return !(isPositivo(doador) && !isPositivo(receptor));
    }

    private static String grupoAbo(TipoSanguineo tipo) {
        String nome = tipo.name();              // ex: AB_POSITIVO, O_NEGATIVO
        return nome.substring(0, nome.indexOf('_'));
    }

    private static boolean isPositivo(TipoSanguineo tipo) {
        return tipo.name().endsWith("_POSITIVO");
    }

    private static void exigirPreenchido(TipoSanguineo doador, TipoSanguineo receptor) {
        if (doador == null || receptor == null) {
            throw new IllegalArgumentException("Doador e receptor sao obrigatorios");
        }
    }
}
