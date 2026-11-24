package com.codigovermelho.observabilidade;

import com.codigovermelho.models.Requisicao;
import com.codigovermelho.models.enums.NivelUrgencia;
import com.codigovermelho.models.enums.StatusRequisicao;
import com.codigovermelho.models.enums.TipoComponente;
import com.codigovermelho.models.enums.TipoSanguineo;
import com.codigovermelho.repositories.RequisicaoRepository;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.observation.DefaultMeterObservationHandler;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import io.micrometer.observation.ObservationRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.support.DefaultListableBeanFactory;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

// Testa as metricas de negocio sem subir o Spring: registry em memoria + repositorio mockado.
class MetricasNegocioTest {

    private SimpleMeterRegistry registry;
    private RequisicaoRepository requisicoes;
    private MetricasNegocio metricas;

    @BeforeEach
    void setUp() {
        registry = new SimpleMeterRegistry();
        ObservationRegistry observationRegistry = ObservationRegistry.create();
        // liga Observation -> Timer, igual o Spring Boot faz na aplicacao
        observationRegistry.observationConfig().observationHandler(new DefaultMeterObservationHandler(registry));

        DefaultListableBeanFactory beans = new DefaultListableBeanFactory();
        beans.registerSingleton("meterRegistry", registry);
        beans.registerSingleton("observationRegistry", observationRegistry);

        requisicoes = Mockito.mock(RequisicaoRepository.class);
        metricas = new MetricasNegocio(beans.getBeanProvider(MeterRegistry.class),
                beans.getBeanProvider(ObservationRegistry.class), requisicoes);
    }

    @Test
    void contaRequisicoesEmitidasComTags() {
        Requisicao requisicao = Mockito.mock(Requisicao.class);
        Mockito.when(requisicao.getTipoSanguineo()).thenReturn(TipoSanguineo.O_NEGATIVO);
        Mockito.when(requisicao.getComponente()).thenReturn(TipoComponente.CONCENTRADO_HEMACIAS);
        Mockito.when(requisicao.getNivelUrgencia()).thenReturn(NivelUrgencia.EMERGENCIA);

        metricas.requisicaoEmitida(requisicao);
        metricas.requisicaoEmitida(requisicao);

        double total = registry.get("codigovermelho.requisicoes.emitidas")
                .tag("tipo_sanguineo", "O-")
                .tag("urgencia", "EMERGENCIA")
                .counter().count();
        assertEquals(2.0, total);
    }

    @Test
    void gaugeDePendentesLeDoBanco() {
        Mockito.when(requisicoes.countByStatus(StatusRequisicao.PENDENTE)).thenReturn(7L);

        assertEquals(7.0, registry.get("codigovermelho.requisicoes.pendentes").gauge().value());
    }

    @Test
    void contaAlertasTermicosPorLado() {
        metricas.alertaTermicoGerado(1L, 7.4, "acima");

        assertEquals(1.0, registry.get("codigovermelho.alertas.termicos").tag("lado", "acima").counter().count());
    }

    @Test
    void calculoDeRotaViraTimerInclusiveQuandoFalha() {
        String resultado = metricas.observarCalculoRota(1L, 3L, () -> "rota");
        assertEquals("rota", resultado);

        assertThrows(IllegalArgumentException.class, () -> metricas.observarCalculoRota(1L, 1L, () -> {
            throw new IllegalArgumentException("Origem e destino devem ser instituicoes diferentes");
        }));

        long execucoes = registry.get("codigovermelho.rota.calculo").timers().stream()
                .mapToLong(t -> t.count()).sum();
        assertEquals(2, execucoes);
    }
}
