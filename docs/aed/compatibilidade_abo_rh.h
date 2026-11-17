// U2 - Compatibilidade ABO/Rh por matriz 8x8.
// Linha = tipo do DOADOR, coluna = tipo do RECEPTOR. 1 = compativel.
// A matriz e consultada em tempo constante depois de achar o indice do tipo
// (busca linear em 8 nomes, tamanho fixo).
#ifndef COMPATIBILIDADE_ABO_RH_H
#define COMPATIBILIDADE_ABO_RH_H

#include <string>
using namespace std;

const int QTD_TIPOS = 8;

// A ordem deste vetor define as linhas e colunas da matriz.
const string TIPOS[QTD_TIPOS] = {"O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"};

//                              receptor: O-  O+  A-  A+  B-  B+ AB- AB+
const int MATRIZ[QTD_TIPOS][QTD_TIPOS] = {
    /* doador O-  */ {1, 1, 1, 1, 1, 1, 1, 1},
    /* doador O+  */ {0, 1, 0, 1, 0, 1, 0, 1},
    /* doador A-  */ {0, 0, 1, 1, 0, 0, 1, 1},
    /* doador A+  */ {0, 0, 0, 1, 0, 0, 0, 1},
    /* doador B-  */ {0, 0, 0, 0, 1, 1, 1, 1},
    /* doador B+  */ {0, 0, 0, 0, 0, 1, 0, 1},
    /* doador AB- */ {0, 0, 0, 0, 0, 0, 1, 1},
    /* doador AB+ */ {0, 0, 0, 0, 0, 0, 0, 1}
};

// Devolve a posicao do tipo em TIPOS, ou -1 se o tipo nao existe.
int indiceDoTipo(string tipo) {
    for (int i = 0; i < QTD_TIPOS; i++) {
        if (TIPOS[i] == tipo) return i;
    }
    return -1;
}

// true se o doador pode doar para o receptor. Tipo invalido devolve false.
bool compativel(string doador, string receptor) {
    int d = indiceDoTipo(doador);
    int r = indiceDoTipo(receptor);
    if (d == -1 || r == -1) return false;
    return MATRIZ[d][r] == 1;
}

// Preenche "saida" com os tipos que podem doar para o receptor e devolve
// quantos sao. Receptor invalido devolve 0. "saida" precisa ter 8 posicoes.
int doadoresCompativeis(string receptor, string saida[]) {
    int r = indiceDoTipo(receptor);
    if (r == -1) return 0;
    int n = 0;
    for (int d = 0; d < QTD_TIPOS; d++) {
        if (MATRIZ[d][r] == 1) {
            saida[n] = TIPOS[d];
            n++;
        }
    }
    return n;
}

#endif
