package com.codigovermelho.models;

import com.codigovermelho.exceptions.RegraDeNegocioException;
import com.codigovermelho.models.enums.StatusTransferencia;
import com.codigovermelho.models.enums.TipoComponente;
import com.codigovermelho.models.enums.TipoInstituicao;
import com.codigovermelho.models.enums.TipoSanguineo;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TransferenciaTest {

    private final Instituicao a = new Instituicao("Hemocentro A", TipoInstituicao.HEMOCENTRO, "Rua A", -8.05, -34.90);
    private final Instituicao b = new Instituicao("Hospital B", TipoInstituicao.HOSPITAL_PUBLICO, "Rua B", -8.04, -34.89);

    private Transferencia criar() {
        return new Transferencia(a, b, TipoSanguineo.O_NEGATIVO, TipoComponente.CONCENTRADO_HEMACIAS,
                3, "Hemocentro A -> Hospital B", 2.0, LocalDateTime.now().plusMinutes(10));
    }

    @Test
    void nasceEmTransporte() {
        Transferencia t = criar();
        assertTrue(t.isEmTransporte());
        assertEquals(StatusTransferencia.EM_TRANSPORTE, t.getStatus());
    }

    @Test
    void naoEntregaDuasVezes() {
        Transferencia t = criar();
        t.marcarComoEntregue();
        assertFalse(t.isEmTransporte());
        assertEquals(StatusTransferencia.ENTREGUE, t.getStatus());
        assertThrows(RegraDeNegocioException.class, t::marcarComoEntregue);
    }

    @Test
    void validaOsCamposObrigatorios() {
        LocalDateTime chegada = LocalDateTime.now().plusMinutes(10);
        assertThrows(IllegalArgumentException.class, () -> new Transferencia(null, b, TipoSanguineo.O_NEGATIVO,
                TipoComponente.PLASMA, 1, "rota", 1.0, chegada));
        assertThrows(IllegalArgumentException.class, () -> new Transferencia(a, null, TipoSanguineo.O_NEGATIVO,
                TipoComponente.PLASMA, 1, "rota", 1.0, chegada));
        assertThrows(IllegalArgumentException.class, () -> new Transferencia(a, b, null,
                TipoComponente.PLASMA, 1, "rota", 1.0, chegada));
        assertThrows(IllegalArgumentException.class, () -> new Transferencia(a, b, TipoSanguineo.O_NEGATIVO,
                null, 1, "rota", 1.0, chegada));
        assertThrows(IllegalArgumentException.class, () -> new Transferencia(a, b, TipoSanguineo.O_NEGATIVO,
                TipoComponente.PLASMA, 0, "rota", 1.0, chegada));
        assertThrows(IllegalArgumentException.class, () -> new Transferencia(a, b, TipoSanguineo.O_NEGATIVO,
                TipoComponente.PLASMA, 1, " ", 1.0, chegada));
        assertThrows(IllegalArgumentException.class, () -> new Transferencia(a, b, TipoSanguineo.O_NEGATIVO,
                TipoComponente.PLASMA, 1, "rota", -1.0, chegada));
        assertThrows(IllegalArgumentException.class, () -> new Transferencia(a, b, TipoSanguineo.O_NEGATIVO,
                TipoComponente.PLASMA, 1, "rota", 1.0, null));
    }
}
