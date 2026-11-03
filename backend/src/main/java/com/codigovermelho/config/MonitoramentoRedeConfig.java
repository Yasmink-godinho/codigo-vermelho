package com.codigovermelho.config;

import com.codigovermelho.services.MonitoramentoRede;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.lang.management.ManagementFactory;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

// US10: bean do monitoramento. Propriedades (aceitam CSV ou lista YAML):
//   app.monitoramento.janela-segundos        (padrao 300)
//   app.monitoramento.endpoints-criticos     (formato "METODO /caminho", ex: GET /api/v1/requisicoes)
// Entrada invalida derruba a inicializacao com mensagem clara (em vez de monitorar um endpoint inexistente).
@Configuration
@EnableScheduling
public class MonitoramentoRedeConfig {

    static final List<String> CRITICOS_PADRAO = List.of(
            "GET /api/v1/lotes",
            "GET /api/v1/requisicoes",
            "POST /api/v1/requisicoes",
            "GET /api/v1/transferencias",
            "POST /api/v1/transferencias",
            "GET /api/v1/alertas-termicos",
            "POST /api/v1/transferencias/{id}/telemetria",
            "GET /api/v1/redistribuicoes/sugeridas",
            "POST /api/v1/redistribuicoes/{id}/aprovar",
            "GET /api/v1/compatibilidade",
            "GET /api/v1/compatibilidade/doadores",
            "GET /api/v1/compatibilidade/alocacao",
            "GET /api/v1/compatibilidade/alocacao/tipos",
            "GET /api/v1/rede/status"
    );

    @Bean
    public MonitoramentoRede monitoramentoRede(Environment env) {
        Binder binder = Binder.get(env);
        long janela = binder.bind("app.monitoramento.janela-segundos", Bindable.of(Long.class)).orElse(300L);
        List<String> criticos = binder.bind("app.monitoramento.endpoints-criticos", Bindable.listOf(String.class))
                .map(l -> l.stream().flatMap(x -> java.util.Arrays.stream(x.split(","))).toList())
                .orElse(CRITICOS_PADRAO);
        Instant inicio = Instant.ofEpochMilli(ManagementFactory.getRuntimeMXBean().getStartTime());
        return new MonitoramentoRede(Clock.systemUTC(), inicio, Duration.ofSeconds(janela), criticos);
    }
}
