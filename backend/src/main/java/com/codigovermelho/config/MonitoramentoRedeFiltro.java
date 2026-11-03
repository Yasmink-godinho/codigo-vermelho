package com.codigovermelho.config;

import com.codigovermelho.services.MonitoramentoRede;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerMapping;

import java.io.IOException;

// US10: mede latencia e status de cada chamada a /api/v1/** (exceto /api/v1/rede/**, para a propria
// consulta de monitoramento nao distorcer as metricas, e preflight OPTIONS). Agrupa pelo padrao da rota
// (ex: /api/v1/requisicoes/{id}), nao pela URL concreta. Excecao nao tratada conta como 500.
@Component
public class MonitoramentoRedeFiltro extends OncePerRequestFilter {

    private final MonitoramentoRede monitoramento;

    public MonitoramentoRedeFiltro(MonitoramentoRede monitoramento) {
        this.monitoramento = monitoramento;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return !uri.startsWith("/api/v1/")
                || "OPTIONS".equalsIgnoreCase(request.getMethod())
                || request.getHeader(com.codigovermelho.services.SondaSaude.CABECALHO) != null; // sonda ativa nao e trafego real
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        long inicio = System.nanoTime();
        int status = 500;
        try {
            chain.doFilter(request, response);
            status = response.getStatus();
        } finally {
            Object padrao = request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
            if (padrao instanceof String caminho) {
                monitoramento.registrar(request.getMethod(), caminho, System.nanoTime() - inicio, status);
            }
        }
    }
}
