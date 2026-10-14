package com.codigovermelho.grafos;

import java.util.Arrays;
import java.util.LinkedList;

// Algoritmo de Dijkstra em cima da matriz de adjacencia do Grafo (US05).
// Como o grafo e pequeno (poucas instituicoes) nao precisei de fila de prioridade,
// so procuro o menor nao visitado com um for. Complexidade O(V^2).
public class Dijkstra {

    private Dijkstra() {
    }

    public static CaminhoMinimo calcular(Grafo grafo, Long idOrigem, Long idDestino) {
        int n = grafo.getTamanho();
        int origem = grafo.indiceDe(idOrigem);
        int destino = grafo.indiceDe(idDestino);
        if (origem < 0 || destino < 0) {
            throw new IllegalArgumentException("Origem ou destino nao existe no grafo");
        }

        double[] distancia = new double[n];
        int[] anterior = new int[n];
        boolean[] visitado = new boolean[n];
        Arrays.fill(distancia, Double.POSITIVE_INFINITY);
        Arrays.fill(anterior, -1);
        distancia[origem] = 0;

        for (int passo = 0; passo < n; passo++) {
            // pega o no ainda nao visitado com a menor distancia
            int atual = -1;
            for (int i = 0; i < n; i++) {
                boolean alcancavel = distancia[i] != Double.POSITIVE_INFINITY;
                if (!visitado[i] && alcancavel && (atual == -1 || distancia[i] < distancia[atual])) {
                    atual = i;
                }
            }
            if (atual == -1) {
                break; // o que sobrou nao tem como chegar
            }
            if (atual == destino) {
                break; // ja achou o menor caminho ate o destino
            }
            visitado[atual] = true;

            // tenta melhorar a distancia dos vizinhos passando pelo atual
            for (int vizinho = 0; vizinho < n; vizinho++) {
                double peso = grafo.getPeso(atual, vizinho);
                if (peso == Grafo.SEM_ARESTA || visitado[vizinho]) {
                    continue;
                }
                double nova = distancia[atual] + peso;
                if (nova < distancia[vizinho]) {
                    distancia[vizinho] = nova;
                    anterior[vizinho] = atual;
                }
            }
        }

        if (distancia[destino] == Double.POSITIVE_INFINITY) {
            return CaminhoMinimo.naoEncontrado();
        }

        // monta o caminho de tras pra frente, seguindo o vetor anterior
        LinkedList<Long> caminho = new LinkedList<>();
        for (int no = destino; no != -1; no = anterior[no]) {
            caminho.addFirst(grafo.idDoIndice(no));
        }
        return new CaminhoMinimo(caminho, distancia[destino], true);
    }
}
