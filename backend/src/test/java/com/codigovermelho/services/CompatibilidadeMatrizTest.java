package com.codigovermelho.services;

import com.codigovermelho.models.enums.TipoSanguineo;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.codigovermelho.models.enums.TipoSanguineo.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Matriz completa de compatibilidade ABO/Rh (8 doadores x 8 receptores = 64 celulas).
 *
 * Complementa CompatibilidadeSanguineaTest, que testa regras isoladas. Aqui a
 * matriz inteira e comparada com uma tabela de referencia escrita a mao, sem
 * usar as regras da classe, para que um erro na regra apareca como celula errada.
 * A mesma matriz esta documentada em docs/poo/MATRIZ_COMPATIBILIDADE_ABO_RH.md.
 */
class CompatibilidadeMatrizTest {

    /** Para cada doador, os receptores que podem receber hemacias dele. */
    private static final Map<TipoSanguineo, Set<TipoSanguineo>> ESPERADO = new EnumMap<>(TipoSanguineo.class);

    static {
        ESPERADO.put(O_NEGATIVO, EnumSet.allOf(TipoSanguineo.class));
        ESPERADO.put(O_POSITIVO, EnumSet.of(O_POSITIVO, A_POSITIVO, B_POSITIVO, AB_POSITIVO));
        ESPERADO.put(A_NEGATIVO, EnumSet.of(A_NEGATIVO, A_POSITIVO, AB_NEGATIVO, AB_POSITIVO));
        ESPERADO.put(A_POSITIVO, EnumSet.of(A_POSITIVO, AB_POSITIVO));
        ESPERADO.put(B_NEGATIVO, EnumSet.of(B_NEGATIVO, B_POSITIVO, AB_NEGATIVO, AB_POSITIVO));
        ESPERADO.put(B_POSITIVO, EnumSet.of(B_POSITIVO, AB_POSITIVO));
        ESPERADO.put(AB_NEGATIVO, EnumSet.of(AB_NEGATIVO, AB_POSITIVO));
        ESPERADO.put(AB_POSITIVO, EnumSet.of(AB_POSITIVO));
    }

    @Test
    void matrizCompletaConfereComATabelaDeReferencia() {
        for (TipoSanguineo doador : TipoSanguineo.values()) {
            for (TipoSanguineo receptor : TipoSanguineo.values()) {
                boolean esperado = ESPERADO.get(doador).contains(receptor);
                assertEquals(esperado, CompatibilidadeSanguinea.compativel(doador, receptor),
                        "Celula errada: doador " + doador.getLabel() + " -> receptor " + receptor.getLabel());
            }
        }
    }

    @Test
    void matrizTem27ParesCompativeisDe64() {
        int compativeis = 0;
        for (TipoSanguineo doador : TipoSanguineo.values()) {
            for (TipoSanguineo receptor : TipoSanguineo.values()) {
                if (CompatibilidadeSanguinea.compativel(doador, receptor)) compativeis++;
            }
        }
        assertEquals(27, compativeis);
    }

    @Test
    void todoTipoECompativelComEleMesmo() {
        for (TipoSanguineo tipo : TipoSanguineo.values()) {
            assertTrue(CompatibilidadeSanguinea.compativel(tipo, tipo),
                    tipo.getLabel() + " deveria ser compativel com ele mesmo");
        }
    }

    @Test
    void doadoresCompativeisDeCadaReceptorConferemComAMatriz() {
        for (TipoSanguineo receptor : TipoSanguineo.values()) {
            Set<TipoSanguineo> esperados = EnumSet.noneOf(TipoSanguineo.class);
            for (TipoSanguineo doador : TipoSanguineo.values()) {
                if (ESPERADO.get(doador).contains(receptor)) esperados.add(doador);
            }
            List<TipoSanguineo> obtidos = new ArrayList<>(CompatibilidadeSanguinea.doadoresCompativeis(receptor));
            assertEquals(esperados.size(), obtidos.size(), "Quantidade de doadores para " + receptor.getLabel());
            assertTrue(esperados.containsAll(obtidos), "Doadores para " + receptor.getLabel());
        }
    }
}
