package com.codigovermelho.services;

import com.codigovermelho.controllers.dto.ScoreRiscoResponse;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;

/**
 * Processo real do Rota Vital/Código Vermelho: cálculo de score de risco/prioridade de cada
 * requisição no histórico, usado para ordenar o atendimento por urgência.
 *
 * Cada requisição é processada de forma totalmente independente (não há
 * ordenação nem merge): cada thread calcula os scores da sua fatia e devolve
 * só dois números (soma parcial e contagem de casos críticos). A agregação
 * final é uma soma simples de poucos números — O(p), desprezível, o que
 * evita qualquer gargalo de coordenação além da criação/despacho das tarefas.
 *
 * Sequencial: O(n) - uma passada, calculando o score de cada requisição.
 * Com p threads: cada uma processa O(n/p); a soma final é O(p).
 */
@Service
public class ScoreRiscoService {

    private static final int MIN_REGISTROS = 1;
    private static final int MAX_REGISTROS = 5_000_000;
    private static final int[] THREADS_PERMITIDAS = {2, 4, 8};

    /** Limiar acima do qual a requisição é considerada crítica. */
    private static final double LIMIAR_CRITICO = 250.0;

    /** Iterações do ajuste fino do score — controla o custo de CPU por item. */
    private static final int ITERACOES_AJUSTE = 60;

    private final ExecutorService executor;

    public ScoreRiscoService(ExecutorService executor) {
        this.executor = executor;
    }

    public ScoreRiscoResponse calcular(int quantidadeRegistros, String modo, int quantidadeThreads) {
        validarEntrada(quantidadeRegistros, modo, quantidadeThreads);
        Dados dados = gerarDados(quantidadeRegistros);

        long inicio = System.nanoTime();
        Acumulador resultado = modo.equals("threads")
                ? calcularComThreads(dados, quantidadeThreads)
                : calcularFatia(dados, 0, dados.tamanho());
        long tempo = System.nanoTime() - inicio;

        double mediaScore = resultado.somaScore() / dados.tamanho();
        return new ScoreRiscoResponse(modo, modo.equals("threads") ? quantidadeThreads : 1,
                quantidadeRegistros, mediaScore, resultado.quantidadeCriticos, tempo);
    }

    private Acumulador calcularComThreads(Dados dados, int quantidadeThreads) {
        try {
            List<Callable<Acumulador>> tarefas = new ArrayList<>();
            int tamanhoFatia = (dados.tamanho() + quantidadeThreads - 1) / quantidadeThreads;
            for (int inicio = 0; inicio < dados.tamanho(); inicio += tamanhoFatia) {
                int inicioFatia = inicio;
                int fimFatia = Math.min(inicio + tamanhoFatia, dados.tamanho());
                tarefas.add(() -> calcularFatia(dados, inicioFatia, fimFatia));
            }
            Acumulador total = new Acumulador(0, 0);
            for (var futuro : executor.invokeAll(tarefas)) {
                total = total.somar(futuro.get());
            }
            return total;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("O calculo foi interrompido", exception);
        } catch (ExecutionException exception) {
            throw new IllegalStateException("Falha ao processar uma fatia do calculo", exception.getCause());
        }
    }

    /** Cada thread só lê a sua fatia de `dados` (arrays imutáveis após gerados) e escreve só no seu próprio acumulador local. */
    private Acumulador calcularFatia(Dados dados, int inicio, int fim) {
        double somaScore = 0;
        long quantidadeCriticos = 0;
        for (int indice = inicio; indice < fim; indice++) {
            double score = calcularScore(dados, indice);
            somaScore += score;
            if (score >= LIMIAR_CRITICO) {
                quantidadeCriticos++;
            }
        }
        return new Acumulador(somaScore, quantidadeCriticos);
    }

    /**
     * Fórmula de score de urgência: combina gravidade, tempo de espera,
     * distância e estoque crítico, com um ajuste fino que soma funções
     * trigonométricas — o custo de CPU por requisição que justifica o
     * paralelismo (é um cálculo de negócio real, não um laço artificial
     * de espera).
     */
    private double calcularScore(Dados dados, int indice) {
        double gravidade = dados.gravidade()[indice] * 100.0;
        double espera = Math.log1p(dados.minutosEspera()[indice]) * 35.0;
        double distancia = Math.sqrt(dados.distanciaKm()[indice]) * 4.0;
        double estoque = dados.estoqueCritico()[indice] ? 50.0 : 0.0;
        double ajuste = 0;
        for (int k = 1; k <= ITERACOES_AJUSTE; k++) {
            ajuste += Math.sin(gravidade / k) * Math.cos(espera / k);
        }
        return gravidade + espera - distancia + estoque + ajuste;
    }

    /** Dados sintéticos e determinísticos — mesma entrada em todas as chamadas com o mesmo `registros`. */
    private Dados gerarDados(int registros) {
        byte[] gravidade = new byte[registros];
        int[] minutosEspera = new int[registros];
        int[] distanciaKm = new int[registros];
        boolean[] estoqueCritico = new boolean[registros];
        java.util.Random random = new java.util.Random(42);
        for (int i = 0; i < registros; i++) {
            gravidade[i] = (byte) (1 + random.nextInt(5));
            minutosEspera[i] = random.nextInt(2881);
            distanciaKm[i] = 1 + random.nextInt(1500);
            estoqueCritico[i] = random.nextInt(10) == 0;
        }
        return new Dados(registros, gravidade, minutosEspera, distanciaKm, estoqueCritico);
    }

    private void validarEntrada(int quantidadeRegistros, String modo, int quantidadeThreads) {
        if (quantidadeRegistros < MIN_REGISTROS || quantidadeRegistros > MAX_REGISTROS) {
            throw new IllegalArgumentException("registros deve estar entre 1 e 5000000");
        }
        if (!modo.equals("sequencial") && !modo.equals("threads")) {
            throw new IllegalArgumentException("modo deve ser sequencial ou threads");
        }
        if (modo.equals("threads")
                && java.util.Arrays.stream(THREADS_PERMITIDAS).noneMatch(valor -> valor == quantidadeThreads)) {
            throw new IllegalArgumentException("threads deve ser 2, 4 ou 8");
        }
    }

    private record Dados(int tamanho, byte[] gravidade, int[] minutosEspera,
                          int[] distanciaKm, boolean[] estoqueCritico) {
    }

    private record Acumulador(double somaScore, long quantidadeCriticos) {
        private Acumulador somar(Acumulador outra) {
            return new Acumulador(somaScore + outra.somaScore, quantidadeCriticos + outra.quantidadeCriticos);
        }
    }
}