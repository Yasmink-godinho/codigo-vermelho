package com.codigovermelho.services;

import com.codigovermelho.exceptions.AlocacaoIncompativelException;
import com.codigovermelho.models.LoteHemocomponente;
import com.codigovermelho.models.Requisicao;
import com.codigovermelho.models.enums.TipoComponente;
import com.codigovermelho.models.enums.StatusRequisicao;
import com.codigovermelho.models.enums.TipoSanguineo;
import com.codigovermelho.repositories.LoteHemocomponenteRepository;
import com.codigovermelho.repositories.RequisicaoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

/** US08 — falha fechada do bloqueio de alocacao (sem Spring; repositorios simulados com Mockito). */
class AlocacaoCompatibilidadeServiceTest {

    private RequisicaoRepository requisicoes;
    private LoteHemocomponenteRepository lotes;
    private AlocacaoCompatibilidadeService service;
    private Requisicao requisicaoOPositivo;

    @BeforeEach
    void preparar() {
        requisicoes = Mockito.mock(RequisicaoRepository.class);
        lotes = Mockito.mock(LoteHemocomponenteRepository.class);
        Mockito.when(lotes.findAll()).thenReturn(List.of());
        service = new AlocacaoCompatibilidadeService(requisicoes, lotes);
        requisicaoOPositivo = Mockito.mock(Requisicao.class);
        Mockito.when(requisicaoOPositivo.getTipoSanguineo()).thenReturn(TipoSanguineo.O_POSITIVO);
        Mockito.when(requisicaoOPositivo.getComponente()).thenReturn(TipoComponente.CONCENTRADO_HEMACIAS);
        Mockito.when(requisicaoOPositivo.getVolume()).thenReturn(1);
        Mockito.when(requisicaoOPositivo.getStatus()).thenReturn(StatusRequisicao.PENDENTE);
        Mockito.when(requisicoes.findById(1L)).thenReturn(Optional.of(requisicaoOPositivo));
    }

    @Test
    void semRequisicaoIdRecusaMesmoQuandoTipoSeriaCompativel() {
        assertThrows(IllegalArgumentException.class, () -> service.exigirCompativel(
                null, TipoSanguineo.O_NEGATIVO, TipoComponente.CONCENTRADO_HEMACIAS));
    }

    @Test
    void semComponenteOuTipoRecusa() {
        assertThrows(IllegalArgumentException.class, () -> service.exigirCompativel(1L, TipoSanguineo.O_NEGATIVO, null));
        assertThrows(IllegalArgumentException.class, () -> service.exigirCompativel(
                1L, null, TipoComponente.CONCENTRADO_HEMACIAS));
    }

    @Test
    void abORhIncompativelLancaAlocacaoIncompativel() {
        assertThrows(AlocacaoIncompativelException.class, () -> service.exigirCompativel(
                1L, TipoSanguineo.A_POSITIVO, TipoComponente.CONCENTRADO_HEMACIAS));
    }

    @Test
    void componenteDiferenteLancaAlocacaoIncompativel() {
        assertThrows(AlocacaoIncompativelException.class, () -> service.exigirCompativel(
                1L, TipoSanguineo.O_NEGATIVO, TipoComponente.PLASMA));
    }

    @Test
    void compativelPassa() {
        assertDoesNotThrow(() -> service.exigirCompativel(
                1L, TipoSanguineo.O_NEGATIVO, TipoComponente.CONCENTRADO_HEMACIAS));
    }

    @Test
    void requisicaoInexistenteLancaNoSuchElement() {
        Mockito.when(requisicoes.findById(2L)).thenReturn(Optional.empty());
        assertThrows(NoSuchElementException.class, () -> service.exigirCompativel(
                2L, TipoSanguineo.O_NEGATIVO, TipoComponente.CONCENTRADO_HEMACIAS));
    }

    @Test
    void aprovacaoPorLoteIncompativelEBloqueadaEPorLoteNuloRecusada() {
        LoteHemocomponente loteA = Mockito.mock(LoteHemocomponente.class);
        Mockito.when(loteA.getTipoSanguineo()).thenReturn(TipoSanguineo.A_POSITIVO);
        Mockito.when(loteA.getComponente()).thenReturn(TipoComponente.CONCENTRADO_HEMACIAS);
        Mockito.when(lotes.findById(10L)).thenReturn(Optional.of(loteA));

        assertThrows(AlocacaoIncompativelException.class, () -> service.exigirCompativelComLote(1L, 10L));
        assertThrows(IllegalArgumentException.class, () -> service.exigirCompativelComLote(1L, null));
        assertThrows(IllegalArgumentException.class, () -> service.exigirCompativelComLote(null, 10L));
    }
}
