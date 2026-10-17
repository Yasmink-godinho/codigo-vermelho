package com.codigovermelho.models;

import com.codigovermelho.models.enums.TipoComponente;
import com.codigovermelho.models.enums.TipoInstituicao;
import com.codigovermelho.models.enums.TipoSanguineo;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LeituraTelemetriaTest {

    private Transferencia criarTransferencia() {
        Instituicao a = new Instituicao("Hemocentro A", TipoInstituicao.HEMOCENTRO, "Rua A", -8.05, -34.90);
        Instituicao b = new Instituicao("Hospital B", TipoInstituicao.HOSPITAL_PUBLICO, "Rua B", -8.04, -34.89);
        return new Transferencia(a, b, TipoSanguineo.O_NEGATIVO, TipoComponente.CONCENTRADO_HEMACIAS,
                3, "Hemocentro A -> Hospital B", 2.0, LocalDateTime.now().plusMinutes(10));
    }

    @Test
    void temperaturaDentroDaFaixaNaoEhForaDaFaixa() {
        Transferencia t = criarTransferencia();
        assertFalse(new LeituraTelemetria(t, 4.0).isForaDaFaixa());
    }

    @Test
    void limitesDe2e6AindaSaoSeguros() {
        Transferencia t = criarTransferencia();
        assertFalse(new LeituraTelemetria(t, 2.0).isForaDaFaixa());
        assertFalse(new LeituraTelemetria(t, 6.0).isForaDaFaixa());
    }

    @Test
    void acimaDe6EAbaixoDe2SaoForaDaFaixa() {
        Transferencia t = criarTransferencia();
        assertTrue(new LeituraTelemetria(t, 6.1).isForaDaFaixa());
        assertTrue(new LeituraTelemetria(t, 7.4).isForaDaFaixa());
        assertTrue(new LeituraTelemetria(t, 1.9).isForaDaFaixa());
        assertTrue(new LeituraTelemetria(t, -3.0).isForaDaFaixa());
    }

    @Test
    void naoAceitaTemperaturaInvalida() {
        Transferencia t = criarTransferencia();
        assertThrows(IllegalArgumentException.class, () -> new LeituraTelemetria(t, null));
        assertThrows(IllegalArgumentException.class, () -> new LeituraTelemetria(t, Double.NaN));
        assertThrows(IllegalArgumentException.class, () -> new LeituraTelemetria(t, Double.POSITIVE_INFINITY));
        assertThrows(IllegalArgumentException.class, () -> new LeituraTelemetria(t, 500.0));
    }

    @Test
    void leituraPrecisaDeTransferencia() {
        assertThrows(IllegalArgumentException.class, () -> new LeituraTelemetria(null, 4.0));
    }

    @Test
    void faixaSeguraEDe2a6Graus() {
        assertEquals(2.0, LeituraTelemetria.TEMPERATURA_MINIMA, 0.0);
        assertEquals(6.0, LeituraTelemetria.TEMPERATURA_MAXIMA, 0.0);
    }
}
