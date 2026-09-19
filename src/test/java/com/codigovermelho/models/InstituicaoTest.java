package com.codigovermelho.models;

import com.codigovermelho.models.enums.TipoInstituicao;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class InstituicaoTest {

    @Test
    void deveCriarInstituicaoValida() {
        Instituicao instituicao = new Instituicao("Hospital Teste", TipoInstituicao.HOSPITAL_PUBLICO,
                "Rua A", -8.05, -34.90);

        assertEquals("Hospital Teste", instituicao.getNome());
        assertEquals(TipoInstituicao.HOSPITAL_PUBLICO, instituicao.getTipo());
    }

    @Test
    void deveRejeitarCoordenadaInvalida() {
        assertThrows(IllegalArgumentException.class, () ->
                new Instituicao("Hospital Teste", TipoInstituicao.HOSPITAL_PUBLICO,
                        "Rua A", -91.0, -34.90));
    }
}
