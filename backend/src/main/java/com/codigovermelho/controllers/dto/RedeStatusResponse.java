package com.codigovermelho.controllers.dto;

import com.codigovermelho.services.MonitoramentoRede;

import java.time.Instant;
import java.util.List;

/** US10 — GET /api/v1/rede/status. Valores calculados sobre o trafego real da janela informada. */
public record RedeStatusResponse(
        Instant geradoEm,
        Instant iniciadoEm,
        long uptimeSegundos,
        long janelaSegundos,
        long requisicoes,
        long erros,
        double latenciaMediaMs,
        double throughputReqPorSegundo,
        double taxaErroPercentual,
        double limiteTaxaErroPercentual,
        String statusGeral,
        long endpointsEmAlerta,
        List<Endpoint> endpoints,
        List<ComponenteSaude> componentes) {

    /** Verificacao ativa de um componente (ex: banco de dados). */
    public record ComponenteSaude(String nome, String status, double latenciaMs, String detalhe) {
    }

    public record Endpoint(
            String metodo,
            String caminho,
            boolean critico,
            String status,
            boolean alerta,
            long requisicoes,
            long erros,
            double latenciaMediaMs,
            double taxaErroPercentual,
            Instant ultimaAmostra,
            // origem do status: NENHUMA (sem dados), TRAFEGO, SONDA ou TRAFEGO_E_SONDA. As metricas acima sao so de trafego real.
            String origemStatus,
            long sondas,
            long errosSonda,
            Instant ultimaSonda) {
    }

    public static RedeStatusResponse de(MonitoramentoRede.Resumo r,
                                        List<com.codigovermelho.services.SondaSaude.Componente> comps) {
        MonitoramentoRede.Status geral = r.statusGeral();
        for (var c : comps) {
            geral = MonitoramentoRede.pior(geral, c.status());
        }
        List<ComponenteSaude> cs = comps.stream()
                .map(c -> new ComponenteSaude(c.nome(), c.status().name(), arredondar(c.latenciaMs()), c.detalhe()))
                .toList();
        List<Endpoint> eps = r.endpoints().stream()
                .map(e -> new Endpoint(e.metodo(), e.caminho(), e.critico(), e.status().name(), e.alerta(),
                        e.requisicoes(), e.erros(), arredondar(e.latenciaMediaMs()),
                        arredondar(e.taxaErroPercentual()), e.ultimaAmostra(),
                        e.origem().name(), e.sondas(), e.errosSonda(), e.ultimaSonda()))
                .toList();
        return new RedeStatusResponse(r.geradoEm(), r.iniciadoEm(), r.uptimeSegundos(), r.janelaSegundos(),
                r.requisicoes(), r.erros(), arredondar(r.latenciaMediaMs()), arredondar(r.throughputPorSegundo()),
                arredondar(r.taxaErroPercentual()), MonitoramentoRede.LIMITE_TAXA_ERRO, geral.name(),
                r.endpoints().stream().filter(MonitoramentoRede.EndpointStatus::alerta).count(), eps, cs);
    }

    private static double arredondar(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
