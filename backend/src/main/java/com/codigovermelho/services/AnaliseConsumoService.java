package com.codigovermelho.services;

import com.codigovermelho.controllers.dto.AnaliseConsumoResponse;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.PriorityQueue;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class AnaliseConsumoService {

    private static final int MIN_REGISTROS = 1;
    private static final int MAX_REGISTROS = 5_000_000;
    private static final int[] THREADS_PERMITIDAS = {2, 4, 8};

    public AnaliseConsumoResponse analisar(int quantidadeRegistros, String modo, int quantidadeThreads) {
        validarEntrada(quantidadeRegistros, modo, quantidadeThreads);
        int[] consumos = gerarConsumos(quantidadeRegistros);
        long inicio = System.nanoTime();
        Estatisticas estatisticas = modo.equals("threads")
                ? calcularComThreads(consumos, quantidadeThreads)
                : calcularSequencial(consumos);
        long tempo = System.nanoTime() - inicio;

        double media = (double) estatisticas.soma() / estatisticas.registros();
        double variancia = (double) estatisticas.somaQuadrados() / estatisticas.registros() - media * media;
        double desvioPadrao = Math.sqrt(Math.max(0, variancia));
        double coeficienteVariacao = media == 0 ? 0 : desvioPadrao / media * 100;
        return new AnaliseConsumoResponse(modo, modo.equals("threads") ? quantidadeThreads : 1,
                quantidadeRegistros, estatisticas.soma(), media, variancia, desvioPadrao,
            coeficienteVariacao, calcularPercentil(estatisticas.ordenados(), 0.5),
            calcularPercentil(estatisticas.ordenados(), 0.95), tempo);
    }

    private int[] gerarConsumos(int quantidadeRegistros) {
        int[] consumos = new int[quantidadeRegistros];
        for (int indice = 0; indice < quantidadeRegistros; indice++) {
            consumos[indice] = 1 + (indice * 31 + indice / 7) % 200;
        }
        return consumos;
    }

    private Estatisticas calcularSequencial(int[] consumos) {
        Arrays.sort(consumos);
        return calcularEstatisticas(consumos);
    }

    private Estatisticas calcularComThreads(int[] consumos, int quantidadeThreads) {
        ExecutorService executor = Executors.newFixedThreadPool(quantidadeThreads);
        try {
            List<Callable<ResultadoFatia>> tarefas = new ArrayList<>();
            int tamanhoFatia = (consumos.length + quantidadeThreads - 1) / quantidadeThreads;
            for (int inicio = 0; inicio < consumos.length; inicio += tamanhoFatia) {
                int inicioFatia = inicio;
                int fimFatia = Math.min(inicio + tamanhoFatia, consumos.length);
                tarefas.add(() -> {
                    int[] copia = Arrays.copyOfRange(consumos, inicioFatia, fimFatia);
                    Arrays.sort(copia);
                    return new ResultadoFatia(calcularEstatisticas(copia), copia);
                });
            }
            Estatisticas total = new Estatisticas(0, 0, 0, new int[0]);
            List<int[]> fatiasOrdenadas = new ArrayList<>();
            for (var futuro : executor.invokeAll(tarefas)) {
                ResultadoFatia resultado = futuro.get();
                total = total.somar(resultado.estatisticas());
                fatiasOrdenadas.add(resultado.ordenados());
            }
            return total.comOrdenados(mergerOrdenado(fatiasOrdenadas, consumos.length));
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("A analise foi interrompida", exception);
        } catch (ExecutionException exception) {
            throw new IllegalStateException("Falha ao processar uma fatia da analise", exception.getCause());
        } finally {
            executor.shutdown();
        }
    }

    private Estatisticas calcularEstatisticas(int[] consumos) {
        long soma = 0;
        long somaQuadrados = 0;
        for (int indice = 0; indice < consumos.length; indice++) {
            soma += consumos[indice];
            somaQuadrados += (long) consumos[indice] * consumos[indice];
        }
        return new Estatisticas(consumos.length, soma, somaQuadrados, consumos);
    }

    private int[] mergerOrdenado(List<int[]> fatias, int tamanho) {
        PriorityQueue<EntradaMerge> fila = new PriorityQueue<>((primeira, segunda) ->
                Integer.compare(primeira.valor(), segunda.valor()));
        for (int indiceFatia = 0; indiceFatia < fatias.size(); indiceFatia++) {
            int[] fatia = fatias.get(indiceFatia);
            if (fatia.length > 0) {
                fila.add(new EntradaMerge(fatia[0], indiceFatia, 0));
            }
        }

        int[] ordenados = new int[tamanho];
        int indiceOrdenado = 0;
        while (!fila.isEmpty()) {
            EntradaMerge entrada = fila.remove();
            ordenados[indiceOrdenado++] = entrada.valor();
            int proximaPosicao = entrada.posicao() + 1;
            int[] fatia = fatias.get(entrada.indiceFatia());
            if (proximaPosicao < fatia.length) {
                fila.add(new EntradaMerge(fatia[proximaPosicao], entrada.indiceFatia(), proximaPosicao));
            }
        }
        return ordenados;
    }

    private double calcularPercentil(int[] ordenados, double percentil) {
        double posicao = percentil * (ordenados.length - 1);
        int indiceInferior = (int) Math.floor(posicao);
        int indiceSuperior = (int) Math.ceil(posicao);
        double fracao = posicao - indiceInferior;
        return ordenados[indiceInferior]
                + fracao * (ordenados[indiceSuperior] - ordenados[indiceInferior]);
    }

    private void validarEntrada(int quantidadeRegistros, String modo, int quantidadeThreads) {
        if (quantidadeRegistros < MIN_REGISTROS || quantidadeRegistros > MAX_REGISTROS) {
            throw new IllegalArgumentException("registros deve estar entre 1 e 5000000");
        }
        if (!modo.equals("sequencial") && !modo.equals("threads")) {
            throw new IllegalArgumentException("modo deve ser sequencial ou threads");
        }
        if (modo.equals("threads") && java.util.Arrays.stream(THREADS_PERMITIDAS).noneMatch(valor -> valor == quantidadeThreads)) {
            throw new IllegalArgumentException("threads deve ser 2, 4 ou 8");
        }
    }

    private record Estatisticas(long registros, long soma, long somaQuadrados, int[] ordenados) {
        private Estatisticas somar(Estatisticas outra) {
            return new Estatisticas(registros + outra.registros, soma + outra.soma,
                    somaQuadrados + outra.somaQuadrados, new int[0]);
        }

        private Estatisticas comOrdenados(int[] valoresOrdenados) {
            return new Estatisticas(registros, soma, somaQuadrados, valoresOrdenados);
        }
    }

    private record ResultadoFatia(Estatisticas estatisticas, int[] ordenados) {
    }

    private record EntradaMerge(int valor, int indiceFatia, int posicao) {
    }
}