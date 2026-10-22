package com.codigovermelho.services;

import com.codigovermelho.models.enums.TipoSanguineo;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * US08 — Matching Imunologico (ABO/Rh). Teste UNITARIO.
 *
 * Esta regra foi escolhida para nascer dos testes primeiro por ser a de
 * maior risco clinico do sistema: uma transfusao incompativel poe um
 * paciente em risco. O historico de commits mostra este arquivo entrando
 * em VERMELHO (classe CompatibilidadeSanguinea ainda inexistente) antes de
 * a implementacao entrar em VERDE.
 */
class CompatibilidadeSanguineaTest {

    // -------------------------------------------------------- Regra ABO

    @Test
    void oNegativoEDoadorUniversalDeHemacias() {
        for (TipoSanguineo receptor : TipoSanguineo.values()) {
            assertTrue(CompatibilidadeSanguinea.compativel(TipoSanguineo.O_NEGATIVO, receptor),
                    "O- deveria doar para " + receptor.getLabel());
        }
    }

    @Test
    void abPositivoEReceptorUniversalDeHemacias() {
        for (TipoSanguineo doador : TipoSanguineo.values()) {
            assertTrue(CompatibilidadeSanguinea.compativel(doador, TipoSanguineo.AB_POSITIVO),
                    "AB+ deveria receber de " + doador.getLabel());
        }
    }

    @Test
    void aNaoDoaParaBPorIncompatibilidadeAbo() {
        assertFalse(CompatibilidadeSanguinea.compativel(TipoSanguineo.A_POSITIVO, TipoSanguineo.B_POSITIVO));
    }

    @Test
    void abSoDoaParaAb() {
        assertTrue(CompatibilidadeSanguinea.compativel(TipoSanguineo.AB_NEGATIVO, TipoSanguineo.AB_POSITIVO));
        assertFalse(CompatibilidadeSanguinea.compativel(TipoSanguineo.AB_POSITIVO, TipoSanguineo.A_POSITIVO));
    }

    // --------------------------------------------------------- Regra Rh

    @Test
    void doadorRhPositivoNaoPodeDoarParaReceptorRhNegativo() {
        assertFalse(CompatibilidadeSanguinea.compativel(TipoSanguineo.O_POSITIVO, TipoSanguineo.O_NEGATIVO));
    }

    @Test
    void doadorRhNegativoDoaParaReceptorRhPositivoDoMesmoAbo() {
        assertTrue(CompatibilidadeSanguinea.compativel(TipoSanguineo.A_NEGATIVO, TipoSanguineo.A_POSITIVO));
    }

    // ----------------------------------------------- Lista de doadores

    @Test
    void receptorONegativoSoRecebeDeONegativo() {
        List<TipoSanguineo> doadores = CompatibilidadeSanguinea.doadoresCompativeis(TipoSanguineo.O_NEGATIVO);
        assertEquals(List.of(TipoSanguineo.O_NEGATIVO), doadores);
    }

    @Test
    void receptorAbPositivoRecebeDeTodosOsOitoTipos() {
        List<TipoSanguineo> doadores = CompatibilidadeSanguinea.doadoresCompativeis(TipoSanguineo.AB_POSITIVO);
        assertEquals(8, doadores.size());
    }

    @Test
    void receptorAPositivoRecebeDeQuatroTipos() {
        // A+ recebe de: A+, A-, O+, O-
        List<TipoSanguineo> doadores = CompatibilidadeSanguinea.doadoresCompativeis(TipoSanguineo.A_POSITIVO);
        assertEquals(4, doadores.size());
        assertTrue(doadores.contains(TipoSanguineo.A_POSITIVO));
        assertTrue(doadores.contains(TipoSanguineo.A_NEGATIVO));
        assertTrue(doadores.contains(TipoSanguineo.O_POSITIVO));
        assertTrue(doadores.contains(TipoSanguineo.O_NEGATIVO));
    }

    // --------------------------------------------------------- Guardas

    @Test
    void motivoExplicaIncompatibilidadeAbo() {
        String motivo = CompatibilidadeSanguinea.motivo(TipoSanguineo.A_POSITIVO, TipoSanguineo.B_POSITIVO);
        assertTrue(motivo.toLowerCase().contains("abo"));
    }

    @Test
    void tiposNulosSaoRejeitados() {
        assertThrows(IllegalArgumentException.class,
                () -> CompatibilidadeSanguinea.compativel(null, TipoSanguineo.O_POSITIVO));
        assertThrows(IllegalArgumentException.class,
                () -> CompatibilidadeSanguinea.doadoresCompativeis(null));
    }
}