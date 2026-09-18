package com.codigovermelho.controllers;

import com.codigovermelho.controllers.advice.GlobalExceptionHandler;
import com.codigovermelho.models.Instituicao;
import com.codigovermelho.models.Requisicao;
import com.codigovermelho.models.enums.NivelUrgencia;
import com.codigovermelho.models.enums.TipoComponente;
import com.codigovermelho.models.enums.TipoInstituicao;
import com.codigovermelho.models.enums.TipoSanguineo;
import com.codigovermelho.services.RequisicaoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class RequisicaoControllerTest {

    private MockMvc mvc;
    private RequisicaoService service;

    @BeforeEach
    void setUp() {
        service = mock(RequisicaoService.class);
        mvc = MockMvcBuilders.standaloneSetup(new RequisicaoController(service))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    private Requisicao requisicaoValida() {
        Instituicao inst = new Instituicao("Hospital Teste", TipoInstituicao.HOSPITAL_PUBLICO,
                "Rua A", -8.05, -34.90);
        return new Requisicao(inst, TipoSanguineo.O_NEGATIVO, TipoComponente.CONCENTRADO_HEMACIAS,
                2, NivelUrgencia.EMERGENCIA, "Paciente em cirurgia");
    }

    @Test
    void postValidoDeveRetornar201() throws Exception {
        when(service.emitir(any(), any(), any(), any(), any(), any())).thenReturn(requisicaoValida());

        mvc.perform(post("/api/v1/requisicoes")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {"instituicaoId":1,"tipoSanguineo":"O-","componente":"CONCENTRADO_HEMACIAS",
                                 "volume":2,"nivelUrgencia":"EMERGENCIA","observacoes":"Paciente em cirurgia"}
                                """))
                .andExpect(status().isCreated());
    }

    @Test
    void postComVolumeInvalidoDeveRetornar400() throws Exception {
        when(service.emitir(any(), any(), any(), any(), any(), any()))
                .thenThrow(new IllegalArgumentException("Volume deve ser maior que zero"));

        mvc.perform(post("/api/v1/requisicoes")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {"instituicaoId":1,"tipoSanguineo":"O-","componente":"CONCENTRADO_HEMACIAS",
                                 "volume":0,"nivelUrgencia":"EMERGENCIA"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getInexistenteDeveRetornar404() throws Exception {
        when(service.buscarPorId(99L)).thenThrow(new java.util.NoSuchElementException("Requisicao nao encontrada: 99"));

        mvc.perform(get("/api/v1/requisicoes/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    void getListaDeveRetornar200() throws Exception {
        when(service.listar(null, null)).thenReturn(java.util.List.of(requisicaoValida()));

        mvc.perform(get("/api/v1/requisicoes"))
                .andExpect(status().isOk());
    }
}
