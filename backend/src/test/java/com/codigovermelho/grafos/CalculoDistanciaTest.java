package com.codigovermelho.grafos;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CalculoDistanciaTest {

    @Test
    void mesmoPontoDaZeroKm() {
        assertEquals(0.0, CalculoDistancia.haversineKm(-8.0578, -34.8829, -8.0578, -34.8829), 0.0001);
    }

    @Test
    void distanciaEntreH01eHEMO01DoDataset() {
        // valor conferido por fora, com a mesma formula, em outra ferramenta (~1.307 km)
        double km = CalculoDistancia.haversineKm(-8.0578, -34.8829, -8.0476, -34.8770);
        assertEquals(1.307, km, 0.001);
    }

    @Test
    void distanciaEIgualNosDoisSentidos() {
        double ida = CalculoDistancia.haversineKm(-8.0539, -34.8999, -8.0409, -34.8896);
        double volta = CalculoDistancia.haversineKm(-8.0409, -34.8896, -8.0539, -34.8999);
        assertEquals(ida, volta, 0.0000001);
    }
}
