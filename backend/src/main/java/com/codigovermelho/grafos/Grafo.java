package com.codigovermelho.grafos;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

// Grafo da malha logistica (US05), igual ao que foi modelado em docs/aed/MODELAGEM_GRAFO.md:
// cada no e uma instituicao e a aresta e uma rota entre duas instituicoes.
// Usei matriz de adjacencia (como a gente fez em AED): matriz[i][j] = peso em km,
// e -1 quer dizer que nao tem rota direta. O grafo nao e direcionado, entao a matriz e simetrica.
public class Grafo {

    public static final double SEM_ARESTA = -1;

    private final List<Long> ids;                  // ids das instituicoes, na ordem das linhas/colunas
    private final Map<Long, Integer> indicePorId;  // pra achar a posicao de um id na matriz
    private final double[][] matriz;

    public Grafo(List<Long> ids) {
        this.ids = List.copyOf(ids);
        this.indicePorId = new HashMap<>();
        for (int i = 0; i < this.ids.size(); i++) {
            indicePorId.put(this.ids.get(i), i);
        }
        int n = this.ids.size();
        this.matriz = new double[n][n];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                matriz[i][j] = SEM_ARESTA;
            }
        }
    }

    // preenche os dois lados da matriz porque a aresta nao tem direcao
    public void adicionarAresta(Long idA, Long idB, double peso) {
        int a = indiceDe(idA);
        int b = indiceDe(idB);
        if (a < 0 || b < 0) {
            throw new IllegalArgumentException("Instituicao nao existe no grafo");
        }
        if (a == b) {
            throw new IllegalArgumentException("Uma instituicao nao pode ter rota pra ela mesma");
        }
        if (peso < 0) {
            throw new IllegalArgumentException("Peso da aresta nao pode ser negativo");
        }
        matriz[a][b] = peso;
        matriz[b][a] = peso;
    }

    // devolve -1 se o id nao esta no grafo
    public int indiceDe(Long id) {
        Integer indice = indicePorId.get(id);
        return indice == null ? -1 : indice;
    }

    public Long idDoIndice(int indice) {
        return ids.get(indice);
    }

    public double getPeso(int i, int j) {
        return matriz[i][j];
    }

    public int getTamanho() {
        return ids.size();
    }
}
