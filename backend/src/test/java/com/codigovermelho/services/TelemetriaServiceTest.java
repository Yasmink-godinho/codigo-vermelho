package com.codigovermelho.services;

import com.codigovermelho.controllers.dto.NovaLigacaoRequest;
import com.codigovermelho.controllers.dto.NovaTransferenciaRequest;
import com.codigovermelho.exceptions.RegraDeNegocioException;
import com.codigovermelho.models.AlertaTermico;
import com.codigovermelho.models.Instituicao;
import com.codigovermelho.models.LeituraTelemetria;
import com.codigovermelho.models.Transferencia;
import com.codigovermelho.models.enums.NivelAlerta;
import com.codigovermelho.models.enums.StatusTransferencia;
import com.codigovermelho.models.enums.TipoComponente;
import com.codigovermelho.models.enums.TipoInstituicao;
import com.codigovermelho.models.enums.TipoSanguineo;
import com.codigovermelho.repositories.InstituicaoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

// Teste de integracao da US07 (e da criacao de transferencia com a rota da US05) com o banco H2.
@SpringBootTest
@Transactional
class TelemetriaServiceTest {

    @Autowired
    private TelemetriaService telemetriaService;

    @Autowired
    private SimuladorTelemetriaService simuladorService;

    @Autowired
    private TransferenciaService transferenciaService;

    @Autowired
    private LigacaoService ligacaoService;

    @Autowired
    private InstituicaoRepository instituicaoRepository;

    private Instituicao origem;
    private Instituicao destino;
    private Instituicao isolada;
    private Transferencia transferencia;

    @BeforeEach
    void criarTransferenciaEmTransporte() {
        origem = instituicaoRepository.save(new Instituicao(
                "Tel Hemocentro", TipoInstituicao.HEMOCENTRO, "Endereco de teste", -8.0539, -34.8999));
        destino = instituicaoRepository.save(new Instituicao(
                "Tel Hospital", TipoInstituicao.HOSPITAL_PUBLICO, "Endereco de teste", -8.0573, -34.8984));
        isolada = instituicaoRepository.save(new Instituicao(
                "Tel Isolada", TipoInstituicao.HOSPITAL_PUBLICO, "Endereco de teste", -8.2760, -35.9760));
        ligacaoService.criar(new NovaLigacaoRequest(origem.getId(), destino.getId()));

        transferencia = transferenciaService.criar(new NovaTransferenciaRequest(
                origem.getId(), destino.getId(), TipoSanguineo.O_NEGATIVO,
                TipoComponente.CONCENTRADO_HEMACIAS, 3));
    }

    // ---------- criacao da transferencia com a rota (US05) ----------

    @Test
    void transferenciaGuardaARotaADistanciaEAPrevisaoDeChegada() {
        assertNotNull(transferencia.getId());
        assertTrue(transferencia.getCodigo().startsWith("TR-"));
        assertEquals("Tel Hemocentro -> Tel Hospital", transferencia.getRota());
        assertEquals(0.41, transferencia.getDistanciaKm(), 0.01);
        assertNotNull(transferencia.getPrevisaoChegada());
        assertEquals(StatusTransferencia.EM_TRANSPORTE, transferencia.getStatus());
    }

    @Test
    void naoCriaTransferenciaQuandoNaoExisteRota() {
        RegraDeNegocioException erro = assertThrows(RegraDeNegocioException.class,
                () -> transferenciaService.criar(new NovaTransferenciaRequest(
                        origem.getId(), isolada.getId(), TipoSanguineo.A_POSITIVO, TipoComponente.PLASMA, 2)));
        assertTrue(erro.getMessage().contains("Nao ha rota disponivel"));
    }

    // ---------- US07 cenario 1: dentro da faixa ----------

    @Test
    void leituraDentroDaFaixaFicaNoHistoricoSemGerarAlerta() {
        TelemetriaService.ResultadoLeitura resultado = telemetriaService.registrarLeitura(transferencia.getId(), 4.0);

        assertNotNull(resultado.leitura().getId());
        assertNotNull(resultado.leitura().getDataHora());
        assertFalse(resultado.leitura().isForaDaFaixa());
        assertNull(resultado.alerta());
        assertEquals(1, telemetriaService.listarLeituras(transferencia.getId()).size());
        assertTrue(telemetriaService.listarAlertas(transferencia.getId()).isEmpty());
    }

    @Test
    void limitesDe2e6NaoGeramAlerta() {
        assertNull(telemetriaService.registrarLeitura(transferencia.getId(), 2.0).alerta());
        assertNull(telemetriaService.registrarLeitura(transferencia.getId(), 6.0).alerta());
    }

    // ---------- US07 cenario 2: fora da faixa ----------

    @Test
    void leituraAcimaDaFaixaGeraAlertaCriticoERegistraNoHistorico() {
        TelemetriaService.ResultadoLeitura resultado = telemetriaService.registrarLeitura(transferencia.getId(), 7.4);

        AlertaTermico alerta = resultado.alerta();
        assertNotNull(alerta);
        assertNotNull(alerta.getId());
        assertEquals(NivelAlerta.CRITICO, alerta.getNivel());
        assertEquals(7.4, alerta.getTemperatura(), 0.0001);
        assertTrue(alerta.getMensagem().contains("7.4"));
        assertTrue(alerta.getMensagem().contains("acima"));
        assertEquals(resultado.leitura().getId(), alerta.getLeitura().getId());

        // a leitura fora da faixa tambem entra no historico
        assertEquals(1, telemetriaService.listarLeituras(transferencia.getId()).size());
        assertEquals(1, telemetriaService.listarAlertas(transferencia.getId()).size());
    }

    @Test
    void leituraAbaixoDaFaixaTambemGeraAlerta() {
        AlertaTermico alerta = telemetriaService.registrarLeitura(transferencia.getId(), 1.9).alerta();

        assertNotNull(alerta);
        assertTrue(alerta.getMensagem().contains("abaixo"));
    }

    @Test
    void historicoFicaEmOrdemEOsAlertasSoVemDasLeiturasForaDaFaixa() {
        telemetriaService.registrarLeitura(transferencia.getId(), 3.0);
        telemetriaService.registrarLeitura(transferencia.getId(), 8.0);
        telemetriaService.registrarLeitura(transferencia.getId(), 4.5);
        telemetriaService.registrarLeitura(transferencia.getId(), 0.5);

        List<LeituraTelemetria> historico = telemetriaService.listarLeituras(transferencia.getId());
        assertEquals(4, historico.size());
        assertEquals(3.0, historico.get(0).getTemperatura(), 0.0001);
        assertEquals(0.5, historico.get(3).getTemperatura(), 0.0001);

        List<AlertaTermico> alertas = telemetriaService.listarAlertas(transferencia.getId());
        assertEquals(2, alertas.size());
        // mais recente primeiro
        assertEquals(0.5, alertas.get(0).getTemperatura(), 0.0001);
        assertEquals(8.0, alertas.get(1).getTemperatura(), 0.0001);
        assertTrue(telemetriaService.listarTodosAlertas().size() >= 2);
    }

    // ---------- regras de "carga em transito" e 404 ----------

    @Test
    void naoAceitaLeituraDeCargaJaEntregue() {
        transferenciaService.marcarComoEntregue(transferencia.getId());

        assertThrows(RegraDeNegocioException.class,
                () -> telemetriaService.registrarLeitura(transferencia.getId(), 4.0));
    }

    @Test
    void transferenciaInexistenteDa404() {
        assertThrows(NoSuchElementException.class, () -> telemetriaService.registrarLeitura(999999L, 4.0));
        assertThrows(NoSuchElementException.class, () -> telemetriaService.listarLeituras(999999L));
        assertThrows(NoSuchElementException.class, () -> telemetriaService.listarAlertas(999999L));
    }

    @Test
    void temperaturaInvalidaNaoEhRegistrada() {
        assertThrows(IllegalArgumentException.class,
                () -> telemetriaService.registrarLeitura(transferencia.getId(), Double.NaN));
    }

    // ---------- simulador ----------

    @Test
    void simuladorSemDesvioNaoGeraAlerta() {
        List<TelemetriaService.ResultadoLeitura> resultados = simuladorService.simular(transferencia.getId(), 10, false);

        assertEquals(10, resultados.size());
        assertEquals(10, telemetriaService.listarLeituras(transferencia.getId()).size());
        assertTrue(telemetriaService.listarAlertas(transferencia.getId()).isEmpty());
    }

    @Test
    void simuladorComDesvioGeraUmAlertaNaUltimaLeitura() {
        List<TelemetriaService.ResultadoLeitura> resultados = simuladorService.simular(transferencia.getId(), 5, true);

        assertEquals(5, resultados.size());
        assertNull(resultados.get(0).alerta());
        assertNotNull(resultados.get(4).alerta());
        assertEquals(7.4, resultados.get(4).leitura().getTemperatura(), 0.0001);
        assertEquals(1, telemetriaService.listarAlertas(transferencia.getId()).size());
    }

    @Test
    void simuladorRecusaQuantidadeInvalida() {
        assertThrows(IllegalArgumentException.class, () -> simuladorService.simular(transferencia.getId(), 0, false));
        assertThrows(IllegalArgumentException.class, () -> simuladorService.simular(transferencia.getId(), 51, false));
    }
}
