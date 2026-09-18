package com.codigovermelho.models;

import com.codigovermelho.models.enums.NivelUrgencia;
import com.codigovermelho.models.enums.StatusRequisicao;
import com.codigovermelho.models.enums.TipoComponente;
import com.codigovermelho.models.enums.TipoInstituicao;
import com.codigovermelho.models.enums.TipoSanguineo;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class RequisicaoTest {

    private Instituicao instituicao() {
        return new Instituicao("Hospital Teste", TipoInstituicao.HOSPITAL_PUBLICO,
                "Rua A", -8.05, -34.90);
    }

    @Test
    void deveCriarRequisicaoValidaComStatusPendente() {
        Requisicao requisicao = new Requisicao(instituicao(), TipoSanguineo.O_NEGATIVO,
                TipoComponente.CONCENTRADO_HEMACIAS, 2, NivelUrgencia.EMERGENCIA, "Paciente em cirurgia");

        assertEquals(StatusRequisicao.PENDENTE, requisicao.getStatus());
        assertEquals(2, requisicao.getVolume());
        assertEquals(NivelUrgencia.EMERGENCIA, requisicao.getNivelUrgencia());
    }

    @Test
    void deveRejeitarVolumeNaoPositivo() {
        assertThrows(IllegalArgumentException.class, () ->
                new Requisicao(instituicao(), TipoSanguineo.O_NEGATIVO,
                        TipoComponente.PLASMA, 0, NivelUrgencia.ROTINA, null));
    }

    @Test
    void deveRejeitarSemInstituicaoSolicitante() {
        assertThrows(IllegalArgumentException.class, () ->
                new Requisicao(null, TipoSanguineo.O_NEGATIVO,
                        TipoComponente.PLASMA, 1, NivelUrgencia.ROTINA, null));
    }

    @Test
    void deveRejeitarSemNivelDeUrgencia() {
        assertThrows(IllegalArgumentException.class, () ->
                new Requisicao(instituicao(), TipoSanguineo.O_NEGATIVO,
                        TipoComponente.PLASMA, 1, null, null));
    }
}
