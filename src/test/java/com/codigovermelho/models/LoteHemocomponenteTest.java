package com.codigovermelho.models;

import com.codigovermelho.models.enums.TipoComponente;
import com.codigovermelho.models.enums.TipoInstituicao;
import com.codigovermelho.models.enums.TipoSanguineo;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class LoteHemocomponenteTest {

    private Instituicao instituicao() {
        return new Instituicao("Hospital Teste", TipoInstituicao.HOSPITAL_PUBLICO,
                "Rua A", -8.05, -34.90);
    }

    @Test
    void deveCalcularValidadePadraoDoComponente() {
        LocalDate coleta = LocalDate.of(2026, 9, 1);
        LoteHemocomponente lote = new LoteHemocomponente(
                TipoSanguineo.O_POSITIVO, TipoComponente.PLAQUETAS, coleta, 2, instituicao());

        assertEquals(coleta.plusDays(5), lote.getDataValidade());
    }

    @Test
    void deveRejeitarQuantidadeNaoPositiva() {
        assertThrows(IllegalArgumentException.class, () ->
                new LoteHemocomponente(TipoSanguineo.O_POSITIVO, TipoComponente.PLASMA,
                        LocalDate.now(), 0, instituicao()));
    }

    @Test
    void deveRejeitarValidadeAnteriorOuIgualADataDeColeta() {
        LocalDate coleta = LocalDate.of(2026, 9, 10);
        assertThrows(IllegalArgumentException.class, () ->
                new LoteHemocomponente(TipoSanguineo.O_POSITIVO, TipoComponente.PLASMA,
                        coleta, coleta, 1, instituicao()));
    }
}
