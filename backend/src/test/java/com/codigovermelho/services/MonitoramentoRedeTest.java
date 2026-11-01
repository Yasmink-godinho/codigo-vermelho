package com.codigovermelho.services;

import com.codigovermelho.services.MonitoramentoRede.EndpointStatus;
import com.codigovermelho.services.MonitoramentoRede.Resumo;
import com.codigovermelho.services.MonitoramentoRede.Status;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** US10 — metricas e classificacao de saude dos endpoints (Clock controlado, sem Spring). */
class MonitoramentoRedeTest {

    private static final long MS = 1_000_000L;
    private static final String REQ = "/api/v1/requisicoes";
    private static final String EST = "/api/v1/lotes/fila-fefo";

    private static class RelogioFalso extends Clock {
        Instant agora = Instant.parse("2026-10-28T12:00:00Z");
        @Override public java.time.ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(java.time.ZoneId zone) { return this; }
        @Override public Instant instant() { return agora; }
        void avancar(long segundos) { agora = agora.plusSeconds(segundos); }
    }

    private RelogioFalso relogio;
    private MonitoramentoRede monitor;

    @BeforeEach
    void preparar() {
        relogio = new RelogioFalso();
        // processo iniciado ha 1 hora; janela de 5 minutos
        monitor = new MonitoramentoRede(relogio, relogio.agora.minusSeconds(3600), Duration.ofMinutes(5),
                List.of("GET " + REQ, "GET " + EST));
    }

    private EndpointStatus endpoint(Resumo r, String metodo, String caminho) {
        return r.endpoints().stream().filter(e -> e.metodo().equals(metodo) && e.caminho().equals(caminho))
                .findFirst().orElseThrow();
    }

    @Test
    void semTrafegoEndpointsCriticosFicamSemDadosENaoSaudaveis() {
        Resumo r = monitor.resumir();
        assertEquals(Status.SEM_DADOS, r.statusGeral());
        assertEquals(Status.SEM_DADOS, endpoint(r, "GET", REQ).status());
        assertEquals(0, r.requisicoes());
        assertEquals(3600, r.uptimeSegundos());
    }

    @Test
    void calculaLatenciaMediaThroughputETaxaDeErro() {
        for (int i = 0; i < 99; i++) monitor.registrar("GET", REQ, 40 * MS, 200);
        monitor.registrar("GET", REQ, 140 * MS, 404); // 4xx nao e erro do endpoint

        Resumo r = monitor.resumir();
        assertEquals(100, r.requisicoes());
        assertEquals(0, r.erros());
        assertEquals(41.0, r.latenciaMediaMs(), 0.001);
        assertEquals(100.0 / 300.0, r.throughputPorSegundo(), 0.0001); // janela efetiva = 300s
        assertEquals(Status.OPERACIONAL, endpoint(r, "GET", REQ).status());
        assertEquals(Status.OPERACIONAL, r.statusGeral());
    }

    @Test
    void taxaDeErroAcimaDe5PorCentoMarcaDegradadoComAlerta() {
        for (int i = 0; i < 18; i++) monitor.registrar("GET", REQ, 10 * MS, 200);
        monitor.registrar("GET", REQ, 10 * MS, 500);
        monitor.registrar("GET", REQ, 10 * MS, 200);
        monitor.registrar("GET", REQ, 10 * MS, 500);
        monitor.registrar("GET", REQ, 10 * MS, 200); // 2 erros em 22 = 9,09%

        EndpointStatus e = endpoint(monitor.resumir(), "GET", REQ);
        assertEquals(Status.DEGRADADO, e.status());
        assertTrue(e.alerta());
        assertEquals(9.09, e.taxaErroPercentual(), 0.01);
    }

    @Test
    void exatamente5PorCentoNaoGeraAlerta() {
        for (int i = 0; i < 19; i++) monitor.registrar("GET", REQ, 10 * MS, 200);
        monitor.registrar("GET", REQ, 10 * MS, 503); // 1 em 20 = 5%

        EndpointStatus e = endpoint(monitor.resumir(), "GET", REQ);
        assertEquals(Status.OPERACIONAL, e.status());
        assertFalse(e.alerta());
    }

    @Test
    void tresErrosSeguidosMarcamIndisponivelEStatusGeralFicaIndisponivel() {
        for (int i = 0; i < 50; i++) monitor.registrar("GET", REQ, 10 * MS, 200);
        for (int i = 0; i < 3; i++) monitor.registrar("GET", REQ, 10 * MS, 500);
        monitor.registrar("GET", EST, 10 * MS, 200);

        Resumo r = monitor.resumir();
        assertEquals(Status.INDISPONIVEL, endpoint(r, "GET", REQ).status());
        assertEquals(Status.INDISPONIVEL, r.statusGeral());
        // endpoint com alerta vem primeiro na lista
        assertEquals(REQ, r.endpoints().get(0).caminho());
    }

    @Test
    void recuperacaoVoltaAoNormalQuandoOsErrosSaemDaJanela() {
        for (int i = 0; i < 3; i++) monitor.registrar("GET", REQ, 10 * MS, 500);
        assertEquals(Status.INDISPONIVEL, endpoint(monitor.resumir(), "GET", REQ).status());

        relogio.avancar(301);
        monitor.registrar("GET", REQ, 10 * MS, 200);

        assertEquals(Status.OPERACIONAL, endpoint(monitor.resumir(), "GET", REQ).status());
    }

    @Test
    void amostrasForaDaJanelaSaoDescartadas() {
        monitor.registrar("GET", REQ, 10 * MS, 200);
        relogio.avancar(400);
        assertEquals(0, monitor.resumir().requisicoes());
    }

    @Test
    void endpointNaoListadoComoCriticoApareceQuandoRecebeTrafego() {
        monitor.registrar("POST", "/api/v1/transferencias", 25 * MS, 201);

        EndpointStatus e = endpoint(monitor.resumir(), "POST", "/api/v1/transferencias");
        assertFalse(e.critico());
        assertEquals(1, e.requisicoes());
    }

    @Test
    void throughputUsaOUptimeQuandoOProcessoERecente() {
        MonitoramentoRede recente = new MonitoramentoRede(relogio, relogio.agora.minusSeconds(10),
                Duration.ofMinutes(5), List.of());
        for (int i = 0; i < 20; i++) recente.registrar("GET", REQ, MS, 200);
        assertEquals(2.0, recente.resumir().throughputPorSegundo(), 0.0001);
    }

    @Test
    void janelaInvalidaERejeitada() {
        assertThrows(IllegalArgumentException.class,
                () -> new MonitoramentoRede(relogio, relogio.agora, Duration.ZERO, List.of()));
    }

    // ---- US10: sondas ativas, ausencia de dados x indisponibilidade, configuracao

    @Test
    void sondaOkSemTrafegoMarcaOperacionalSemInventarMetricas() {
        monitor.registrarSonda("GET", REQ, 20 * MS, 200);

        Resumo r = monitor.resumir();
        EndpointStatus e = endpoint(r, "GET", REQ);
        assertEquals(Status.OPERACIONAL, e.status());
        assertEquals(MonitoramentoRede.Origem.SONDA, e.origem());
        assertEquals(0, e.requisicoes());            // metricas reais intactas
        assertEquals(0.0, e.latenciaMediaMs(), 0.0);
        assertEquals(0, r.requisicoes());
        assertEquals(1, e.sondas());
    }

    @Test
    void tresFalhasDeSondaSemTrafegoMarcamIndisponivel() {
        monitor.registrarSonda("GET", REQ, 5000 * MS, 0);   // sem resposta
        monitor.registrarSonda("GET", REQ, 5 * MS, 503);
        monitor.registrarSonda("GET", REQ, 5 * MS, 500);

        EndpointStatus e = endpoint(monitor.resumir(), "GET", REQ);
        assertEquals(Status.INDISPONIVEL, e.status());
        assertTrue(e.alerta());
        assertEquals(3, e.errosSonda());
    }

    @Test
    void sondaNaoAlteraTaxaDeErroNemLatenciaDoTrafegoReal() {
        for (int i = 0; i < 10; i++) monitor.registrar("GET", REQ, 30 * MS, 200);
        monitor.registrarSonda("GET", REQ, 9000 * MS, 500);

        Resumo r = monitor.resumir();
        assertEquals(10, r.requisicoes());
        assertEquals(0, r.erros());
        assertEquals(30.0, r.latenciaMediaMs(), 0.001);
        assertEquals(MonitoramentoRede.Origem.TRAFEGO_E_SONDA, endpoint(r, "GET", REQ).origem());
    }

    @Test
    void sondaFalhandoPrevaleceSobreTrafegoSaudavel() {
        for (int i = 0; i < 5; i++) monitor.registrar("GET", REQ, 10 * MS, 200);
        for (int i = 0; i < 3; i++) monitor.registrarSonda("GET", REQ, 10 * MS, 500);

        assertEquals(Status.INDISPONIVEL, endpoint(monitor.resumir(), "GET", REQ).status());
    }

    @Test
    void semDadosNaoPrevaleceSobreStatusReal() {
        assertEquals(Status.OPERACIONAL, MonitoramentoRede.pior(Status.SEM_DADOS, Status.OPERACIONAL));
        assertEquals(Status.SEM_DADOS, MonitoramentoRede.pior(Status.SEM_DADOS, Status.SEM_DADOS));
        assertEquals(Status.INDISPONIVEL, MonitoramentoRede.pior(Status.SEM_DADOS, Status.INDISPONIVEL));
        assertEquals(Status.INDISPONIVEL, MonitoramentoRede.pior(Status.DEGRADADO, Status.INDISPONIVEL));
    }

    @Test
    void endpointCriticoMalFormadoFalhaNaConfiguracao() {
        assertThrows(IllegalArgumentException.class, () -> new MonitoramentoRede(relogio,
                relogio.agora, Duration.ofMinutes(5), List.of("/api/v1/requisicoes")));
        assertThrows(IllegalArgumentException.class, () -> new MonitoramentoRede(relogio,
                relogio.agora, Duration.ofMinutes(5), List.of("FETCH /api/v1/x")));
    }

    @Test
    void endpointCriticoEhNormalizadoComMetodoMaiusculo() {
        MonitoramentoRede m = new MonitoramentoRede(relogio, relogio.agora, Duration.ofMinutes(5),
                List.of("  get   /api/v1/requisicoes "));
        assertTrue(m.endpointsCriticos().contains("GET /api/v1/requisicoes"));
    }
}
