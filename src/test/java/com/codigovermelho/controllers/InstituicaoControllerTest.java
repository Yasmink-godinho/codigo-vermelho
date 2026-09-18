package com.codigovermelho.controllers;

import com.codigovermelho.controllers.advice.GlobalExceptionHandler;
import com.codigovermelho.controllers.dto.AtualizarInstituicaoRequest;
import com.codigovermelho.controllers.dto.InstituicaoResponse;
import com.codigovermelho.controllers.dto.NovaInstituicaoRequest;
import com.codigovermelho.models.Instituicao;
import com.codigovermelho.models.enums.TipoInstituicao;
import com.codigovermelho.services.InstituicaoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class InstituicaoControllerTest {

    private MockMvc mvc;
    private InstituicaoService service;

    @BeforeEach
    void setUp() {
        service = mock(InstituicaoService.class);
        mvc = MockMvcBuilders.standaloneSetup(new InstituicaoController(service))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void postValidoDeveRetornar201() throws Exception {
        Instituicao instituicao = new Instituicao("Hospital Teste", TipoInstituicao.HOSPITAL_PUBLICO,
                "Rua A", -8.05, -34.90);
        when(service.salvar(any())).thenReturn(instituicao);

        mvc.perform(post("/api/v1/instituicoes")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {"nome":"Hospital Teste","tipo":"HOSPITAL_PUBLICO","endereco":"Rua A","latitude":-8.05,"longitude":-34.90}
                                """))
                .andExpect(status().isCreated());
    }

    @Test
    void postComCoordenadaInvalidaDeveRetornar400() throws Exception {
        mvc.perform(post("/api/v1/instituicoes")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {"nome":"Hospital Teste","tipo":"HOSPITAL_PUBLICO","endereco":"Rua A","latitude":-91,"longitude":-34.90}
                                """))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }

    @Test
    void getInexistenteDeveRetornar404() throws Exception {
        when(service.buscarPorId(99L)).thenThrow(new java.util.NoSuchElementException("Instituicao nao encontrada: 99"));

        mvc.perform(get("/api/v1/instituicoes/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    void putDeveRetornar200() throws Exception {
        Instituicao instituicao = new Instituicao("Hospital Atualizado", TipoInstituicao.UPA,
                "Rua B", -8.0, -35.0);
        when(service.atualizar(eq(1L), any(AtualizarInstituicaoRequest.class))).thenReturn(instituicao);

        mvc.perform(put("/api/v1/instituicoes/1")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {"nome":"Hospital Atualizado","tipo":"UPA","endereco":"Rua B","latitude":-8.0,"longitude":-35.0}
                                """))
                .andExpect(status().isOk());
    }

    @Test
    void deleteDeveRetornar204() throws Exception {
        doNothing().when(service).excluir(1L);
        mvc.perform(delete("/api/v1/instituicoes/1"))
                .andExpect(status().isNoContent());
    }
}
