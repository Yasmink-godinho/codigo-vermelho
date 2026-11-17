// U2 - FEFO (First Expired, First Out): lista encadeada ORDENADA pela data de
// validade. A bolsa que vence primeiro fica sempre no inicio.
// Reaproveita o NoBolsa da U1 (estrutura_base_PI3E2-93.h).
//
// Datas no formato AAAA-MM-DD: comparar as strings equivale a comparar as
// datas, entao nao precisa converter nada.
//
// Complexidade (n = bolsas na lista, v = bolsas vencidas):
//   inserirOrdenado   O(n) no pior caso: percorre ate achar a posicao
//   consultar/remover mais proxima  O(1): sao o primeiro no
//   descartarVencidos O(v): so mexe no inicio, para na primeira nao vencida
#ifndef FEFO_LISTA_ORDENADA_H
#define FEFO_LISTA_ORDENADA_H

#include <iostream>
#include <string>
#include "estrutura_base_PI3E2-93.h"
using namespace std;

class ListaFefo {
private:
    NoBolsa* inicio;
    int qtd;
public:
    ListaFefo() { inicio = nullptr; qtd = 0; }
    ~ListaFefo() { liberar(); }
    ListaFefo(const ListaFefo&) = delete;
    ListaFefo& operator=(const ListaFefo&) = delete;

    // Insere mantendo a ordem por dataValidade. Em empate, a nova fica
    // DEPOIS das que ja estavam (ordem de chegada preservada).
    void inserirOrdenado(Bolsa nova) {
        NoBolsa* novo = new NoBolsa();
        novo->dado = nova;
        NoBolsa* atual = inicio;
        NoBolsa* anterior = nullptr;
        while (atual != nullptr && atual->dado.dataValidade <= nova.dataValidade) {
            anterior = atual;
            atual = atual->proximo;
        }
        novo->proximo = atual;
        if (anterior == nullptr) inicio = novo;
        else anterior->proximo = novo;
        qtd++;
    }

    // Consulta a bolsa que vence primeiro, sem remover.
    bool consultarMaisProxima(Bolsa &saida) {
        if (inicio == nullptr) return false;
        saida = inicio->dado;
        return true;
    }

    // Remove a bolsa que vence primeiro.
    bool removerMaisProxima(Bolsa &removida) {
        if (inicio == nullptr) return false;
        removida = inicio->dado;
        NoBolsa* temp = inicio;
        inicio = inicio->proximo;
        delete temp;
        qtd--;
        return true;
    }

    // Remove pelo id (igual ao ListaBolsas da U1).
    bool remover(string idBolsa) {
        NoBolsa* atual = inicio;
        NoBolsa* anterior = nullptr;
        while (atual != nullptr) {
            if (atual->dado.idBolsa == idBolsa) {
                if (anterior == nullptr) inicio = atual->proximo;
                else anterior->proximo = atual->proximo;
                delete atual;
                qtd--;
                return true;
            }
            anterior = atual;
            atual = atual->proximo;
        }
        return false;
    }

    // Descarta as bolsas com validade ANTERIOR a "hoje". Como a lista e
    // ordenada, as vencidas estao todas no inicio. Devolve quantas descartou.
    int descartarVencidos(string hoje) {
        int descartadas = 0;
        while (inicio != nullptr && inicio->dado.dataValidade < hoje) {
            NoBolsa* temp = inicio;
            inicio = inicio->proximo;
            delete temp;
            qtd--;
            descartadas++;
        }
        return descartadas;
    }

    // Primeiro no da lista, so para leitura (usado pela alocacao para
    // percorrer sem remover).
    NoBolsa* primeiro() { return inicio; }

    int tamanho() { return qtd; }
    bool vazia() { return inicio == nullptr; }

    void listar() {
        NoBolsa* atual = inicio;
        while (atual != nullptr) {
            cout << atual->dado.idBolsa << " - " << atual->dado.tipoSanguineo
                 << " - validade " << atual->dado.dataValidade << endl;
            atual = atual->proximo;
        }
    }

    void liberar() {
        while (inicio != nullptr) {
            NoBolsa* temp = inicio;
            inicio = inicio->proximo;
            delete temp;
        }
        qtd = 0;
    }
};

#endif
