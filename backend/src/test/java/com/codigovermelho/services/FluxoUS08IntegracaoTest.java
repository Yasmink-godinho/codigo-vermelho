package com.codigovermelho.services;

import com.codigovermelho.controllers.dto.NovaLigacaoRequest;
import com.codigovermelho.controllers.dto.NovaTransferenciaRequest;
import com.codigovermelho.controllers.dto.AtualizarRequisicaoRequest;
import com.codigovermelho.models.*;
import com.codigovermelho.models.enums.*;
import com.codigovermelho.repositories.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:us08fluxointegracao;DB_CLOSE_DELAY=-1")
class FluxoUS08IntegracaoTest {
    @Autowired TransferenciaService transferenciaService;
    @Autowired RequisicaoService requisicaoService;
    @Autowired RedistribuicaoService redistribuicaoService;
    @Autowired InstituicaoRepository instituicoes;
    @Autowired RequisicaoRepository requisicoes;
    @Autowired LoteHemocomponenteRepository lotes;
    @Autowired TransferenciaRepository transferencias;
    @Autowired RecomendacaoRedistribuicaoRepository recomendacoes;
    @Autowired LigacaoService ligacoes;

    private record Cenario(Instituicao origem, Instituicao destino, Requisicao requisicao, LoteHemocomponente lote) {}

    private Cenario preparar(String sufixo, TipoSanguineo doador, TipoSanguineo receptor, boolean comRota) {
        Instituicao origem = instituicoes.save(new Instituicao("US08 Origem " + sufixo,
                TipoInstituicao.HEMOCENTRO, "Endereco origem", -8.0539, -34.8999));
        Instituicao destino = instituicoes.save(new Instituicao("US08 Destino " + sufixo,
                TipoInstituicao.HOSPITAL_PUBLICO, "Endereco destino", -8.0573, -34.8984));
        if (comRota) ligacoes.criar(new NovaLigacaoRequest(origem.getId(), destino.getId()));
        Requisicao req = requisicoes.save(new Requisicao(destino, receptor,
                TipoComponente.CONCENTRADO_HEMACIAS, 3, NivelUrgencia.PRIORITARIA, null));
        LoteHemocomponente lote = lotes.save(new LoteHemocomponente(doador,
                TipoComponente.CONCENTRADO_HEMACIAS, LocalDate.now().minusDays(1), 5, origem));
        return new Cenario(origem, destino, req, lote);
    }

    @Test
    void transferenciaCompativelVinculaRequisicaoAtualizaEstoqueEAtendePedido() {
        Cenario c = preparar("valida-" + System.nanoTime(), TipoSanguineo.O_NEGATIVO, TipoSanguineo.O_POSITIVO, true);
        var criada = transferenciaService.criar(new NovaTransferenciaRequest(c.origem().getId(), c.destino().getId(),
                TipoSanguineo.O_NEGATIVO, TipoComponente.CONCENTRADO_HEMACIAS, 3, c.requisicao().getId()));

        assertNotNull(criada.getId());
        assertEquals(c.requisicao().getId(), criada.getRequisicao().getId());
        assertEquals(2, lotes.findById(c.lote().getId()).orElseThrow().getQuantidade());
        assertEquals(StatusRequisicao.ATENDIDA, requisicoes.findById(c.requisicao().getId()).orElseThrow().getStatus());
    }

    @Test
    void requisicaoNaoPodeSerMarcadaAtendidaForaDoFluxoDeTransferencia() {
        Cenario c = preparar("status-" + System.nanoTime(), TipoSanguineo.O_NEGATIVO, TipoSanguineo.O_POSITIVO, true);
        assertThrows(IllegalArgumentException.class, () -> requisicaoService.atualizarStatus(
                c.requisicao().getId(), new AtualizarRequisicaoRequest(StatusRequisicao.ATENDIDA)));
        assertEquals(StatusRequisicao.PENDENTE, requisicoes.findById(c.requisicao().getId()).orElseThrow().getStatus());
    }

    @Test
    void destinoDiferenteDaInstituicaoSolicitanteBloqueiaSemConsumirEstoque() {
        Cenario c = preparar("destino-" + System.nanoTime(), TipoSanguineo.O_NEGATIVO, TipoSanguineo.O_POSITIVO, true);
        Instituicao destinoErrado = instituicoes.save(new Instituicao("US08 Destino errado " + System.nanoTime(),
                TipoInstituicao.HOSPITAL_PUBLICO, "Endereco", -8.06, -34.90));
        assertThrows(IllegalArgumentException.class, () -> transferenciaService.criar(new NovaTransferenciaRequest(
                c.origem().getId(), destinoErrado.getId(), TipoSanguineo.O_NEGATIVO,
                TipoComponente.CONCENTRADO_HEMACIAS, 3, c.requisicao().getId())));
        assertEquals(5, lotes.findById(c.lote().getId()).orElseThrow().getQuantidade());
        assertEquals(StatusRequisicao.PENDENTE, requisicoes.findById(c.requisicao().getId()).orElseThrow().getStatus());
    }

    @Test
    void falhaDeRotaReverteReservaDeEstoqueEStatusDaRequisicao() {
        Cenario c = preparar("rollback-" + System.nanoTime(), TipoSanguineo.O_NEGATIVO, TipoSanguineo.O_POSITIVO, false);
        assertThrows(RuntimeException.class, () -> transferenciaService.criar(new NovaTransferenciaRequest(
                c.origem().getId(), c.destino().getId(), TipoSanguineo.O_NEGATIVO,
                TipoComponente.CONCENTRADO_HEMACIAS, 3, c.requisicao().getId())));
        assertEquals(5, lotes.findById(c.lote().getId()).orElseThrow().getQuantidade());
        assertEquals(StatusRequisicao.PENDENTE, requisicoes.findById(c.requisicao().getId()).orElseThrow().getStatus());
        assertTrue(transferencias.findAll().stream().noneMatch(t -> t.getRequisicao().getId().equals(c.requisicao().getId())));
    }

    @Test
    void redistribuicaoIncompativelNaoAprovaNemMoveEstoque() {
        Cenario c = preparar("redistrib-incomp-" + System.nanoTime(), TipoSanguineo.A_POSITIVO, TipoSanguineo.O_POSITIVO, true);
        RecomendacaoRedistribuicao rec = recomendacoes.save(new RecomendacaoRedistribuicao(
                c.requisicao(), c.origem().getId(), c.origem().getNome(), c.destino().getId(), c.destino().getNome(),
                "A+", "Concentrado de Hemácias", 3, "Alta", "PENDENTE", List.of("teste")));
        assertThrows(IllegalArgumentException.class, () -> redistribuicaoService.aprovarComTransferencia(rec.getId()));
        assertEquals("PENDENTE", recomendacoes.findById(rec.getId()).orElseThrow().getStatus());
        assertEquals(5, lotes.findById(c.lote().getId()).orElseThrow().getQuantidade());
    }

    @Test
    void falhaNaRotaDaRedistribuicaoFazRollbackDeEstoqueRequisicaoERecomendacao() {
        Cenario c = preparar("redistrib-rollback-" + System.nanoTime(), TipoSanguineo.O_NEGATIVO, TipoSanguineo.O_POSITIVO, false);
        RecomendacaoRedistribuicao rec = recomendacoes.save(new RecomendacaoRedistribuicao(
                c.requisicao(), c.origem().getId(), c.origem().getNome(), c.destino().getId(), c.destino().getNome(),
                "O-", "Concentrado de Hemácias", 3, "Alta", "PENDENTE", List.of("teste")));
        assertThrows(RuntimeException.class, () -> redistribuicaoService.aprovarComTransferencia(rec.getId()));
        assertEquals("PENDENTE", recomendacoes.findById(rec.getId()).orElseThrow().getStatus());
        assertEquals(StatusRequisicao.PENDENTE, requisicoes.findById(c.requisicao().getId()).orElseThrow().getStatus());
        assertEquals(5, lotes.findById(c.lote().getId()).orElseThrow().getQuantidade());
        assertTrue(transferencias.findAll().stream().noneMatch(t -> t.getRequisicao() != null
                && t.getRequisicao().getId().equals(c.requisicao().getId())));
    }

    @Test
    void redistribuicaoValidaCriaTransferenciaRealEAtualizaRecomendacao() {
        Cenario c = preparar("redistrib-valida-" + System.nanoTime(), TipoSanguineo.O_NEGATIVO, TipoSanguineo.O_POSITIVO, true);
        RecomendacaoRedistribuicao rec = recomendacoes.save(new RecomendacaoRedistribuicao(
                c.requisicao(), c.origem().getId(), c.origem().getNome(), c.destino().getId(), c.destino().getNome(),
                "O-", "Concentrado de Hemácias", 3, "Alta", "PENDENTE", List.of("teste")));
        var resultado = redistribuicaoService.aprovarComTransferencia(rec.getId()).orElseThrow();
        assertNotNull(resultado.transferencia().getId());
        assertEquals(c.requisicao().getId(), resultado.transferencia().getRequisicao().getId());
        assertEquals("APROVADA", recomendacoes.findById(rec.getId()).orElseThrow().getStatus());
        assertEquals(2, lotes.findById(c.lote().getId()).orElseThrow().getQuantidade());
    }
}
