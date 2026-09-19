package com.codigovermelho.controllers;

import com.codigovermelho.controllers.advice.GlobalExceptionHandler;
import com.codigovermelho.models.LoteHemocomponente;
import com.codigovermelho.models.Instituicao;
import com.codigovermelho.models.enums.TipoComponente;
import com.codigovermelho.models.enums.TipoInstituicao;
import com.codigovermelho.models.enums.TipoSanguineo;
import com.codigovermelho.services.LoteHemocomponenteService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class LoteHemocomponenteControllerTest {

    private MockMvc mvc;
    private LoteHemocomponenteService service;

    @BeforeEach
    void setUp() {
        service = mock(LoteHemocomponenteService.class);
        mvc = MockMvcBuilders.standaloneSetup(new LoteHemocomponenteController(service))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void postValidoDeveRetornar201() throws Exception {
        Instituicao inst = new Instituicao("Hospital Teste", TipoInstituicao.HOSPITAL_PUBLICO,
                "Rua A", -8.05, -34.90);
        LoteHemocomponente lote = new LoteHemocomponente(TipoSanguineo.O_POSITIVO, TipoComponente.PLASMA,
                LocalDate.now(), LocalDate.now().plusDays(10), 2, inst);
        when(service.registrar(any(Long.class), any(), any(), any(), any(), any())).thenReturn(lote);

        mvc.perform(post("/api/v1/instituicoes/1/lotes")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {"tipoSanguineo":"O+","componente":"PLASMA","dataColeta":"2026-09-17","validade":"2026-10-01","quantidade":2}
                                """))
                .andExpect(status().isCreated());
    }

    @Test
    void postComQuantidadeInvalidaDeveRetornar400() throws Exception {
        mvc.perform(post("/api/v1/instituicoes/1/lotes")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {"tipoSanguineo":"O+","componente":"PLASMA","dataColeta":"2026-09-17","quantidade":0}
                                """))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }

    @Test
    void deleteDeveRetornar204() throws Exception {
        mvc.perform(delete("/api/v1/lotes/10"))
                .andExpect(status().isNoContent());
        verify(service).excluir(10L);
    }
}
