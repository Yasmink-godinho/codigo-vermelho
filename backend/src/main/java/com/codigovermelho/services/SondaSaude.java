package com.codigovermelho.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import javax.sql.DataSource;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * US10 — verificacoes de saude viaveis:
 *  - banco: conexao JDBC valida (timeout 2s), sob demanda;
 *  - endpoints criticos GET sem variavel de caminho: sonda ativa em loopback a cada
 *    app.monitoramento.sonda.intervalo-segundos (60). Falha = sem resposta ou 5xx; 4xx = servidor vivo.
 *    A sonda leva o cabecalho X-Sonda-Saude e NAO entra nas metricas reais (ver MonitoramentoRedeFiltro).
 *  - endpoints criticos POST/PUT/DELETE ou com {variavel} nao sao chamados (efeito colateral): so trafego real.
 *  - na partida, avisa no log critico que nao corresponde a nenhuma rota registrada.
 * Desligar: app.monitoramento.sonda.habilitada=false.
 */
@Component
public class SondaSaude {

    public static final String CABECALHO = "X-Sonda-Saude";
    private static final Logger log = LoggerFactory.getLogger(SondaSaude.class);

    public record Componente(String nome, MonitoramentoRede.Status status, double latenciaMs, String detalhe) {
    }

    private final MonitoramentoRede monitoramento;
    private final DataSource dataSource;
    private final Environment env;
    private final RequestMappingHandlerMapping mappings;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build();

    public SondaSaude(MonitoramentoRede monitoramento, DataSource dataSource, Environment env,
                      RequestMappingHandlerMapping requestMappingHandlerMapping) {
        this.monitoramento = monitoramento;
        this.dataSource = dataSource;
        this.env = env;
        this.mappings = requestMappingHandlerMapping;
    }

    public Componente verificarBanco() {
        long ini = System.nanoTime();
        try (var conn = dataSource.getConnection()) {
            boolean ok = conn.isValid(2);
            return new Componente("banco-de-dados", ok ? MonitoramentoRede.Status.OPERACIONAL
                    : MonitoramentoRede.Status.INDISPONIVEL, (System.nanoTime() - ini) / 1e6,
                    ok ? "conexao valida" : "conexao invalida");
        } catch (Exception e) {
            return new Componente("banco-de-dados", MonitoramentoRede.Status.INDISPONIVEL,
                    (System.nanoTime() - ini) / 1e6, "falha ao conectar: " + e.getClass().getSimpleName());
        }
    }

    @Scheduled(initialDelayString = "${app.monitoramento.sonda.atraso-inicial-segundos:30}",
            fixedDelayString = "${app.monitoramento.sonda.intervalo-segundos:60}", timeUnit = java.util.concurrent.TimeUnit.SECONDS)
    public void sondarEndpoints() {
        if (!env.getProperty("app.monitoramento.sonda.habilitada", Boolean.class, true)) {
            return;
        }
        String porta = env.getProperty("local.server.port", env.getProperty("server.port", "8080"));
        for (String critico : monitoramento.endpointsCriticos()) {
            String[] p = critico.split(" ", 2);
            if (!p[0].equals("GET") || p[1].contains("{")) {
                continue;
            }
            long ini = System.nanoTime();
            int status = 0;
            try {
                HttpResponse<Void> r = http.send(HttpRequest.newBuilder(URI.create("http://localhost:" + porta + p[1]))
                        .timeout(Duration.ofSeconds(5)).header(CABECALHO, "1").GET().build(),
                        HttpResponse.BodyHandlers.discarding());
                status = r.statusCode();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return;
            } catch (Exception e) {
                log.warn("Sonda falhou em {}: {}", critico, e.toString());
            }
            monitoramento.registrarSonda(p[0], p[1], System.nanoTime() - ini, status);
        }
    }

    @EventListener(ApplicationReadyEvent.class)
    public void validarCriticosContraRotas() {
        try {
            Set<String> rotas = mappings.getHandlerMethods().keySet().stream().flatMap(this::chaves)
                    .collect(Collectors.toSet());
            for (String c : monitoramento.endpointsCriticos()) {
                if (!rotas.contains(c)) {
                    log.warn("Endpoint critico '{}' nao corresponde a nenhuma rota registrada; ficara SEM_DADOS. "
                            + "Revise app.monitoramento.endpoints-criticos.", c);
                }
            }
        } catch (RuntimeException e) {
            log.warn("Nao foi possivel validar endpoints criticos contra as rotas: {}", e.toString());
        }
    }

    private java.util.stream.Stream<String> chaves(RequestMappingInfo info) {
        var pp = info.getPathPatternsCondition();
        if (pp == null) {
            return java.util.stream.Stream.empty();
        }
        return info.getMethodsCondition().getMethods().stream()
                .flatMap(m -> pp.getPatternValues().stream().map(v -> m.name() + " " + v));
    }
}
