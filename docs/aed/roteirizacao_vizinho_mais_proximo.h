// U2 - Roteirizacao por vizinho mais proximo (heuristica gulosa).
// A partir da origem, vai sempre para a parada ainda nao visitada MAIS PERTO
// da posicao atual. No fim, segue para o destino.
// A distancia e em linha reta sobre a esfera (formula de Haversine), nao pelas
// ruas. O resultado nao garante o menor caminho possivel, so um caminho bom.
//
// Complexidade (k = paradas): k rodadas, cada uma olha ate k paradas: O(k^2).
// Cada distancia e O(1).
#ifndef ROTEIRIZACAO_VIZINHO_MAIS_PROXIMO_H
#define ROTEIRIZACAO_VIZINHO_MAIS_PROXIMO_H

#include <cmath>
#include <string>
using namespace std;

struct Ponto {
    string id;
    double latitude;
    double longitude;
};

const int MAX_PARADAS = 20;

struct RotaResultado {
    string ordem[MAX_PARADAS + 2];  // origem, paradas, destino
    int qtdPontos;
    double distanciaTotalKm;
};

double distanciaKm(Ponto a, Ponto b) {
    const double RAIO_TERRA_KM = 6371.0;
    const double GRAU = 3.14159265358979323846 / 180.0;
    double dLat = (b.latitude - a.latitude) * GRAU;
    double dLon = (b.longitude - a.longitude) * GRAU;
    double x = sin(dLat / 2) * sin(dLat / 2)
             + cos(a.latitude * GRAU) * cos(b.latitude * GRAU)
             * sin(dLon / 2) * sin(dLon / 2);
    double c = 2 * atan2(sqrt(x), sqrt(1 - x));
    return RAIO_TERRA_KM * c;
}

// Calcula a rota origem -> paradas (vizinho mais proximo) -> destino.
// Devolve false se houver mais paradas que MAX_PARADAS ou k negativo.
bool calcularRota(Ponto origem, Ponto paradas[], int k, Ponto destino, RotaResultado &rota) {
    if (k < 0 || k > MAX_PARADAS) return false;

    bool visitada[MAX_PARADAS];
    for (int i = 0; i < k; i++) visitada[i] = false;

    rota.qtdPontos = 0;
    rota.distanciaTotalKm = 0;
    rota.ordem[rota.qtdPontos] = origem.id;
    rota.qtdPontos++;

    Ponto atual = origem;
    for (int rodada = 0; rodada < k; rodada++) {
        int melhor = -1;
        double menorDistancia = 0;
        for (int i = 0; i < k; i++) {
            if (visitada[i]) continue;
            double d = distanciaKm(atual, paradas[i]);
            if (melhor == -1 || d < menorDistancia) {
                melhor = i;
                menorDistancia = d;
            }
        }
        visitada[melhor] = true;
        rota.distanciaTotalKm += menorDistancia;
        rota.ordem[rota.qtdPontos] = paradas[melhor].id;
        rota.qtdPontos++;
        atual = paradas[melhor];
    }

    rota.distanciaTotalKm += distanciaKm(atual, destino);
    rota.ordem[rota.qtdPontos] = destino.id;
    rota.qtdPontos++;
    return true;
}

#endif
