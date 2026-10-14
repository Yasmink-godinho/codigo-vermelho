package com.codigovermelho.grafos;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

// Usa o mesmo grafo sintetico do docs/aed/MODELAGEM_GRAFO.md
// ids: 1=H01, 2=H02, 3=H07, 4=HEMO01, 5=H06, 6=H04, 7=sem nenhuma ligacao
class DijkstraTest {

    private Grafo montarGrafoSintetico() {
        Grafo grafo = new Grafo(List.of(1L, 2L, 3L, 4L, 5L, 6L, 7L));
        grafo.adicionarAresta(1L, 2L, 5.0); // H01 - H02
        grafo.adicionarAresta(1L, 4L, 4.0); // H01 - HEMO01
        grafo.adicionarAresta(2L, 3L, 6.0); // H02 - H07
        grafo.adicionarAresta(4L, 3L, 3.0); // HEMO01 - H07
        grafo.adicionarAresta(4L, 5L, 2.0); // HEMO01 - H06
        grafo.adicionarAresta(4L, 6L, 7.0); // HEMO01 - H04
        return grafo;
    }

    @Test
    void acha_o_menor_caminho_de_H01_ate_H06() {
        // mesmo resultado da simulacao manual do documento: H01 -> HEMO01 -> H06 = 6.0 km
        CaminhoMinimo caminho = Dijkstra.calcular(montarGrafoSintetico(), 1L, 5L);

        assertTrue(caminho.encontrado());
        assertEquals(List.of(1L, 4L, 5L), caminho.ids());
        assertEquals(6.0, caminho.distanciaKm(), 0.0001);
    }

    @Test
    void prefere_o_caminho_mais_curto_mesmo_com_mais_paradas() {
        // H01 ate H07: por H02 da 11.0, por HEMO01 da 7.0
        CaminhoMinimo caminho = Dijkstra.calcular(montarGrafoSintetico(), 1L, 3L);

        assertEquals(List.of(1L, 4L, 3L), caminho.ids());
        assertEquals(7.0, caminho.distanciaKm(), 0.0001);
    }

    @Test
    void funciona_nos_dois_sentidos_porque_o_grafo_nao_tem_direcao() {
        CaminhoMinimo ida = Dijkstra.calcular(montarGrafoSintetico(), 1L, 5L);
        CaminhoMinimo volta = Dijkstra.calcular(montarGrafoSintetico(), 5L, 1L);

        assertEquals(List.of(5L, 4L, 1L), volta.ids());
        assertEquals(ida.distanciaKm(), volta.distanciaKm(), 0.0001);
    }

    @Test
    void liga_direto_quando_ja_existe_aresta_entre_os_dois() {
        CaminhoMinimo caminho = Dijkstra.calcular(montarGrafoSintetico(), 4L, 5L);

        assertEquals(List.of(4L, 5L), caminho.ids());
        assertEquals(2.0, caminho.distanciaKm(), 0.0001);
    }

    @Test
    void informa_que_nao_existe_caminho_quando_o_destino_esta_isolado() {
        CaminhoMinimo caminho = Dijkstra.calcular(montarGrafoSintetico(), 1L, 7L);

        assertFalse(caminho.encontrado());
        assertTrue(caminho.ids().isEmpty());
        assertEquals(0.0, caminho.distanciaKm(), 0.0001);
    }

    @Test
    void origem_isolada_tambem_nao_tem_caminho() {
        assertFalse(Dijkstra.calcular(montarGrafoSintetico(), 7L, 1L).encontrado());
    }

    @Test
    void origem_igual_ao_destino_da_caminho_de_um_no_so() {
        CaminhoMinimo caminho = Dijkstra.calcular(montarGrafoSintetico(), 4L, 4L);

        assertTrue(caminho.encontrado());
        assertEquals(List.of(4L), caminho.ids());
        assertEquals(0.0, caminho.distanciaKm(), 0.0001);
    }

    @Test
    void da_erro_se_o_no_nao_existe_no_grafo() {
        assertThrows(IllegalArgumentException.class,
                () -> Dijkstra.calcular(montarGrafoSintetico(), 1L, 99L));
    }

    @Test
    void grafo_nao_aceita_peso_negativo_nem_aresta_pra_si_mesmo() {
        Grafo grafo = montarGrafoSintetico();
        assertThrows(IllegalArgumentException.class, () -> grafo.adicionarAresta(1L, 2L, -3.0));
        assertThrows(IllegalArgumentException.class, () -> grafo.adicionarAresta(1L, 1L, 3.0));
    }

    @Test
    void aceitaArestaComPesoZero() {
        // duas instituicoes na mesma coordenada ficam com distancia 0 e ainda sao ligadas
        Grafo grafo = new Grafo(List.of(1L, 2L, 3L));
        grafo.adicionarAresta(1L, 2L, 0.0);
        grafo.adicionarAresta(2L, 3L, 2.5);

        CaminhoMinimo caminho = Dijkstra.calcular(grafo, 1L, 3L);

        assertTrue(caminho.encontrado());
        assertEquals(List.of(1L, 2L, 3L), caminho.ids());
        assertEquals(2.5, caminho.distanciaKm(), 0.0001);
    }

    @Test
    void escolheOLadoMaisCurtoDeUmLosango() {
        // 1 -> 2 -> 4 = 3.0 e 1 -> 3 -> 4 = 5.0
        Grafo grafo = new Grafo(List.of(1L, 2L, 3L, 4L));
        grafo.adicionarAresta(1L, 2L, 1.0);
        grafo.adicionarAresta(2L, 4L, 2.0);
        grafo.adicionarAresta(1L, 3L, 2.0);
        grafo.adicionarAresta(3L, 4L, 3.0);

        CaminhoMinimo caminho = Dijkstra.calcular(grafo, 1L, 4L);

        assertEquals(List.of(1L, 2L, 4L), caminho.ids());
        assertEquals(3.0, caminho.distanciaKm(), 0.0001);
    }

    @Test
    void grafoSemNenhumaArestaSoTemCaminhoDeUmNoParaEleMesmo() {
        Grafo grafo = new Grafo(List.of(1L, 2L));

        assertFalse(Dijkstra.calcular(grafo, 1L, 2L).encontrado());
        assertTrue(Dijkstra.calcular(grafo, 1L, 1L).encontrado());
    }
}
