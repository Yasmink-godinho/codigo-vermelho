package com.codigovermelho.services;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ThreadPoolExecutor;

@Service
public class TelemetriaIngestaoService {

    public static final int QUANTIDADE_MAXIMA = 50;

    private final TelemetriaService telemetriaService;
    private final ThreadPoolExecutor executor;

    public TelemetriaIngestaoService(TelemetriaService telemetriaService,
                                     @Qualifier("analiseExecutorService") ThreadPoolExecutor executor) {
        this.telemetriaService = telemetriaService;
        this.executor = executor;
    }

    public List<TelemetriaService.ResultadoLeitura> registrarEmLote(Long transferenciaId,
                                                                     List<Double> temperaturas) {
        if (temperaturas == null || temperaturas.isEmpty()) {
            throw new IllegalArgumentException("O lote precisa ter ao menos uma leitura");
        }
        if (temperaturas.size() > QUANTIDADE_MAXIMA) {
            throw new IllegalArgumentException("O lote pode ter no maximo " + QUANTIDADE_MAXIMA + " leituras");
        }

        List<Callable<TelemetriaService.ResultadoLeitura>> tarefas = new ArrayList<>();
        for (Double temperatura : temperaturas) {
            tarefas.add(() -> telemetriaService.registrarLeitura(transferenciaId, temperatura));
        }

        try {
            List<TelemetriaService.ResultadoLeitura> resultados = new ArrayList<>(temperaturas.size());
            for (var futuro : executor.invokeAll(tarefas)) {
                resultados.add(futuro.get());
            }
            return resultados;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("A ingestao concorrente foi interrompida", exception);
        } catch (ExecutionException exception) {
            Throwable causa = exception.getCause();
            if (causa instanceof RuntimeException runtimeException) {
                throw runtimeException;
            }
            throw new IllegalStateException("Falha ao processar uma leitura de telemetria", causa);
        }
    }
}
