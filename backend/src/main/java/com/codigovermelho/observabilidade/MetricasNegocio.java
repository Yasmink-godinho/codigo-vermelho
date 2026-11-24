package com.codigovermelho.observabilidade;

import com.codigovermelho.models.Requisicao;
import com.codigovermelho.models.Transferencia;
import com.codigovermelho.models.enums.StatusRequisicao;
import com.codigovermelho.repositories.RequisicaoRepository;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import io.micrometer.observation.Observation;
import io.micrometer.observation.ObservationRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;

import java.util.function.Supplier;

/**
 * Metricas de negocio do Codigo Vermelho (ponto adicional do projeto de RSD).
 *
 * Tudo que e metrica de negocio fica concentrado aqui, para os services so chamarem um metodo
 * com nome claro. No Prometheus os nomes aparecem com "_" no lugar de "." e com sufixos
 * (_total para counters, _seconds para timers):
 *
 *  | Metrica (Micrometer)                    | Tipo    | No Prometheus                                   |
 *  |-----------------------------------------|---------|-------------------------------------------------|
 *  | codigovermelho.requisicoes.emitidas     | Counter | codigovermelho_requisicoes_emitidas_total       |
 *  | codigovermelho.requisicoes.pendentes    | Gauge   | codigovermelho_requisicoes_pendentes            |
 *  | codigovermelho.transferencias.criadas   | Counter | codigovermelho_transferencias_criadas_total     |
 *  | codigovermelho.alertas.termicos         | Counter | codigovermelho_alertas_termicos_total           |
 *  | codigovermelho.rota.calculo             | Timer   | codigovermelho_rota_calculo_seconds_*           |
 *  | codigovermelho.transferencia.criacao    | Timer   | codigovermelho_transferencia_criacao_seconds_*  |
 *
 * Os dois timers sao criados como Observation: alem da metrica, cada um vira um span no trace
 * (HTTP -> transferencia.criacao -> rota.calculo), que e o fluxo com varios spans pedido no Tempo.
 */
@Component
public class MetricasNegocio {

    private static final Logger log = LoggerFactory.getLogger(MetricasNegocio.class);

    private final MeterRegistry registry;
    private final ObservationRegistry observationRegistry;

    // ObjectProvider + valor padrao: se algum contexto de teste nao tiver os registries,
    // a aplicacao continua funcionando (as metricas so nao sao exportadas).
    public MetricasNegocio(ObjectProvider<MeterRegistry> meterRegistry,
                           ObjectProvider<ObservationRegistry> observationRegistry,
                           RequisicaoRepository requisicaoRepository) {
        this.registry = meterRegistry.getIfAvailable(SimpleMeterRegistry::new);
        this.observationRegistry = observationRegistry.getIfAvailable(() -> ObservationRegistry.NOOP);

        // Gauge: lido a cada scrape do Prometheus (15 s), consulta o banco na hora.
        Gauge.builder("codigovermelho.requisicoes.pendentes", requisicaoRepository, MetricasNegocio::contarPendentes)
                .description("Requisicoes de hemocomponente aguardando atendimento (status PENDENTE)")
                .strongReference(true)
                .register(registry);
    }

    private static double contarPendentes(RequisicaoRepository repository) {
        try {
            return repository.countByStatus(StatusRequisicao.PENDENTE);
        } catch (RuntimeException e) {
            // banco fora do ar ou app desligando: devolve NaN em vez de derrubar o scrape
            return Double.NaN;
        }
    }

    /** US04: chamada depois que uma requisicao foi salva. */
    public void requisicaoEmitida(Requisicao requisicao) {
        Counter.builder("codigovermelho.requisicoes.emitidas")
                .description("Total de requisicoes de hemocomponente emitidas pelos hospitais")
                .tag("tipo_sanguineo", rotulo(requisicao.getTipoSanguineo() == null ? null : requisicao.getTipoSanguineo().getLabel()))
                .tag("componente", rotulo(requisicao.getComponente()))
                .tag("urgencia", rotulo(requisicao.getNivelUrgencia()))
                .register(registry)
                .increment();
        log.info("Requisicao emitida: id={} tipo={} componente={} urgencia={}",
                requisicao.getId(), requisicao.getTipoSanguineo(), requisicao.getComponente(), requisicao.getNivelUrgencia());
    }

    /** Transferencia criada com rota confirmada e estoque reservado. */
    public void transferenciaCriada(Transferencia transferencia) {
        Counter.builder("codigovermelho.transferencias.criadas")
                .description("Total de transferencias de hemocomponentes criadas entre instituicoes")
                .tag("componente", rotulo(transferencia.getComponente()))
                .register(registry)
                .increment();
        log.info("Transferencia criada: id={} codigo={} rota='{}' distanciaKm={}",
                transferencia.getId(), transferencia.getCodigo(), transferencia.getRota(),
                transferencia.getDistanciaKm());
    }

    /** US07: leitura de temperatura fora da faixa de 2 a 6 graus. */
    public void alertaTermicoGerado(Long transferenciaId, double temperatura, String lado) {
        Counter.builder("codigovermelho.alertas.termicos")
                .description("Total de alertas termicos (temperatura fora de 2 a 6 graus) durante o transporte")
                .tag("lado", rotulo(lado))
                .register(registry)
                .increment();
        log.warn("Alerta termico: transferenciaId={} temperatura={} ({} da faixa segura)",
                transferenciaId, temperatura, lado);
    }

    /** US05: mede o calculo de rota (Dijkstra) e cria o span "calculo-rota". */
    public <T> T observarCalculoRota(Long origemId, Long destinoId, Supplier<T> calculo) {
        return Observation.createNotStarted("codigovermelho.rota.calculo", observationRegistry)
                .contextualName("calculo-rota")
                .highCardinalityKeyValue("rota.origem", String.valueOf(origemId))
                .highCardinalityKeyValue("rota.destino", String.valueOf(destinoId))
                .observe(calculo);
    }

    /** Mede a criacao completa de uma transferencia (validacao + rota + estoque). */
    public <T> T observarCriacaoTransferencia(Supplier<T> criacao) {
        return Observation.createNotStarted("codigovermelho.transferencia.criacao", observationRegistry)
                .contextualName("criacao-transferencia")
                .observe(criacao);
    }

    private static String rotulo(Object valor) {
        return valor == null ? "desconhecido" : valor.toString();
    }
}
