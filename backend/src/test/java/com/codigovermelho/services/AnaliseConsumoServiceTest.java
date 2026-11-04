package com.codigovermelho.services;

import com.codigovermelho.controllers.dto.AnaliseConsumoResponse;
import com.sun.management.OperatingSystemMXBean;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;

import java.lang.management.ManagementFactory;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class AnaliseConsumoServiceTest {

    private static final int ITENS_CARGA_IO = 80;
    private static final long ESPERA_POR_ITEM_MS = 15;
    private static final int REPETICOES_MEDIDAS = 3;

    @Autowired
    private AnaliseConsumoService service;

    @Value("${analise.thread-pool.size:8}")
    private int poolSize;

    @Test
    void modosSequencialEParaleloProduzemAMesmaAnalise() {
        AnaliseConsumoResponse sequencial = analisarEMedir("sequencial", 1);
        AnaliseConsumoResponse paraleloQuatroThreads = analisarEMedir("threads", 4);
        AnaliseConsumoResponse paraleloOitoThreads = analisarEMedir("threads", 8);

        assertAnalisesIguais(sequencial, paraleloQuatroThreads);
        assertAnalisesIguais(sequencial, paraleloOitoThreads);
        assertEquals(1, sequencial.threads());
        assertEquals(Math.min(4, poolSize), paraleloQuatroThreads.threads());
        assertEquals(Math.min(8, poolSize), paraleloOitoThreads.threads());
    }

    @Test
    void cargaIoSimuladaEscalaComMaisWorkers() throws Exception {
        List<Double> temposSequencial = medirCargaIo(1);
        List<Double> temposQuatroThreads = medirCargaIo(4);
        List<Double> temposOitoThreads = medirCargaIo(8);

        double medianaSequencial = mediana(temposSequencial);
        double medianaQuatroThreads = mediana(temposQuatroThreads);
        double medianaOitoThreads = mediana(temposOitoThreads);

        assertTrue(medianaSequencial > medianaQuatroThreads,
                "A carga I/O simulada deve levar mais tempo com 1 worker do que com 4");
        assertTrue(medianaQuatroThreads > medianaOitoThreads,
                "A carga I/O simulada deve levar mais tempo com 4 workers do que com 8");
        assertTrue(medianaSequencial / medianaQuatroThreads > 1.5,
                "A carga I/O simulada deve demonstrar speedup significativo com 4 workers");
        assertTrue(medianaQuatroThreads / medianaOitoThreads > 1.25,
                "A carga I/O simulada deve demonstrar ganho adicional com 8 workers");
    }

    private List<Double> medirCargaIo(int workers) throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(workers);
        try {
            executarTarefas(executor);
            List<Double> temposMs = new ArrayList<>();
            List<Double> cpuPercentuais = new ArrayList<>();
            List<Double> memoriaMb = new ArrayList<>();
            OperatingSystemMXBean sistema = ManagementFactory.getPlatformMXBean(OperatingSystemMXBean.class);

            for (int repeticao = 0; repeticao < REPETICOES_MEDIDAS; repeticao++) {
                Runtime runtime = Runtime.getRuntime();
                long memoriaAntes = runtime.totalMemory() - runtime.freeMemory();
                long cpuAntes = sistema.getProcessCpuTime();
                long inicioMs = System.currentTimeMillis();
                long inicioNanos = System.nanoTime();

                executarTarefas(executor);

                long fimNanos = System.nanoTime();
                long fimMs = System.currentTimeMillis();
                long cpuDepois = sistema.getProcessCpuTime();
                long memoriaDepois = runtime.totalMemory() - runtime.freeMemory();
                if (cpuAntes < 0 || cpuDepois < cpuAntes) {
                    throw new IllegalStateException("O tempo de CPU do processo não está disponível nesta JVM");
                }
                double duracaoMs = (fimNanos - inicioNanos) / 1_000_000.0;
                double duracaoNs = fimNanos - inicioNanos;
                double cpuPercentual = (cpuDepois - cpuAntes) / duracaoNs
                        / Runtime.getRuntime().availableProcessors() * 100.0;

                temposMs.add(duracaoMs);
                cpuPercentuais.add(cpuPercentual);
                memoriaMb.add(memoriaDepois / 1024.0 / 1024.0);
                System.out.printf(Locale.ROOT,
                        "MEDICAO carga_io workers=%d repeticao=%d inicio_epoch_ms=%d fim_epoch_ms=%d "
                                + "duracao_ms=%.3f cpu_processo_percentual_normalizado=%.3f "
                                + "heap_usado_antes_mb=%.3f heap_usado_depois_mb=%.3f%n",
                        workers, repeticao + 1, inicioMs, fimMs, duracaoMs, cpuPercentual,
                        memoriaAntes / 1024.0 / 1024.0, memoriaDepois / 1024.0 / 1024.0);
            }

            System.out.printf(Locale.ROOT,
                    "MEDIANA carga_io workers=%d duracao_ms=%.3f cpu_processo_percentual_normalizado=%.3f "
                            + "heap_usado_mb=%.3f processadores_logicos=%d%n",
                    workers, mediana(temposMs), media(cpuPercentuais), mediana(memoriaMb),
                    Runtime.getRuntime().availableProcessors());
            return temposMs;
        } finally {
            executor.shutdownNow();
        }
    }

    private void executarTarefas(ExecutorService executor) throws Exception {
        List<Callable<Integer>> tarefas = new ArrayList<>();
        for (int item = 0; item < ITENS_CARGA_IO; item++) {
            int resultado = item;
            tarefas.add(() -> {
                try {
                    Thread.sleep(ESPERA_POR_ITEM_MS);
                } catch (InterruptedException exception) {
                    Thread.currentThread().interrupt();
                    throw exception;
                }
                return resultado;
            });
        }

        List<Future<Integer>> resultados = executor.invokeAll(tarefas);
        int soma = 0;
        for (Future<Integer> resultado : resultados) {
            soma += resultado.get();
        }
        assertEquals(ITENS_CARGA_IO * (ITENS_CARGA_IO - 1) / 2, soma);
    }

    private double mediana(List<Double> valores) {
        List<Double> ordenados = new ArrayList<>(valores);
        ordenados.sort(Double::compareTo);
        return ordenados.get(ordenados.size() / 2);
    }

    private double media(List<Double> valores) {
        return valores.stream().mapToDouble(Double::doubleValue).average().orElseThrow();
    }

    private AnaliseConsumoResponse analisarEMedir(String modo, int threads) {
        long inicioMs = System.currentTimeMillis();
        long inicioNanos = System.nanoTime();
        AnaliseConsumoResponse resposta = service.analisar(100_000, modo, threads);
        long fimNanos = System.nanoTime();
        long fimMs = System.currentTimeMillis();
        System.out.printf(Locale.ROOT, "MEDICAO analise modo=%s threads_solicitadas=%d threads_efetivas=%d "
                        + "inicio_epoch_ms=%d fim_epoch_ms=%d duracao_ms=%.3f processamento_interno_ms=%.3f%n",
                modo, threads, resposta.threads(), inicioMs, fimMs,
                (fimNanos - inicioNanos) / 1_000_000.0,
                resposta.tempoProcessamentoNanos() / 1_000_000.0);
        return resposta;
    }

    private void assertAnalisesIguais(AnaliseConsumoResponse esperada, AnaliseConsumoResponse atual) {
        assertEquals(esperada.registros(), atual.registros());
        assertEquals(esperada.somaConsumo(), atual.somaConsumo());
        assertEquals(esperada.media(), atual.media());
        assertEquals(esperada.variancia(), atual.variancia());
        assertEquals(esperada.desvioPadrao(), atual.desvioPadrao());
        assertEquals(esperada.coeficienteVariacao(), atual.coeficienteVariacao());
        assertEquals(esperada.mediana(), atual.mediana());
        assertEquals(esperada.percentil95(), atual.percentil95());
    }
}