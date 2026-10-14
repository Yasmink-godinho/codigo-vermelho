package com.codigovermelho.grafos;

import java.util.List;

// O que o Dijkstra devolve: os ids das instituicoes do caminho (da origem ate o destino)
// e a distancia total em km. Se encontrado = false nao existe caminho.
public record CaminhoMinimo(List<Long> ids, double distanciaKm, boolean encontrado) {

    public static CaminhoMinimo naoEncontrado() {
        return new CaminhoMinimo(List.of(), 0.0, false);
    }
}
