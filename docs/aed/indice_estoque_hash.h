// U2 - Indice de estoque por tabela hash (encadeamento separado).
// Chave: tipo sanguineo. Valor: ListaFefo com as bolsas daquele tipo.
// Cada posicao da tabela e uma lista encadeada de entradas, que resolve
// colisoes (tipos diferentes que caem na mesma posicao).
//
// Funcao hash: h = (h * 31 + caractere) % capacidade, para cada caractere.
//
// Complexidade (n = tipos guardados, M = capacidade, alfa = n / M):
//   buscar / inserir: O(1 + alfa) em media; O(n) no pior caso (tudo colide)
//   Aqui n <= 8 (so existem 8 tipos), entao a cadeia e curta em qualquer caso.
#ifndef INDICE_ESTOQUE_HASH_H
#define INDICE_ESTOQUE_HASH_H

#include <string>
#include "fefo_lista_ordenada.h"
using namespace std;

struct NoIndice {
    string tipo;
    ListaFefo* lista;   // alocada com new, liberada no destrutor
    NoIndice* proximo;
};

class IndiceEstoque {
private:
    NoIndice** tabela;  // vetor de ponteiros para o inicio de cada cadeia
    int capacidade;
    int qtdTipos;       // quantas entradas (tipos) existem
public:
    IndiceEstoque(int cap) {
        if (cap <= 0) cap = 1;
        capacidade = cap;
        qtdTipos = 0;
        tabela = new NoIndice*[capacidade];
        for (int i = 0; i < capacidade; i++) tabela[i] = nullptr;
    }

    ~IndiceEstoque() {
        for (int i = 0; i < capacidade; i++) {
            NoIndice* atual = tabela[i];
            while (atual != nullptr) {
                NoIndice* temp = atual;
                atual = atual->proximo;
                delete temp->lista;
                delete temp;
            }
        }
        delete[] tabela;
    }
    IndiceEstoque(const IndiceEstoque&) = delete;
    IndiceEstoque& operator=(const IndiceEstoque&) = delete;

    int funcaoHash(string tipo) {
        int h = 0;
        for (int i = 0; i < (int)tipo.size(); i++) {
            h = (h * 31 + (unsigned char)tipo[i]) % capacidade;
        }
        return h;
    }

    // Devolve a lista FEFO do tipo, ou nullptr se o tipo nao esta no indice.
    ListaFefo* buscar(string tipo) {
        NoIndice* atual = tabela[funcaoHash(tipo)];
        while (atual != nullptr) {
            if (atual->tipo == tipo) return atual->lista;
            atual = atual->proximo;
        }
        return nullptr;
    }

    // Insere a bolsa na lista FEFO do tipo dela (cria a entrada se precisar).
    void inserirBolsa(Bolsa b) {
        ListaFefo* lista = buscar(b.tipoSanguineo);
        if (lista == nullptr) {
            int pos = funcaoHash(b.tipoSanguineo);
            NoIndice* novo = new NoIndice();
            novo->tipo = b.tipoSanguineo;
            novo->lista = new ListaFefo();
            novo->proximo = tabela[pos];
            tabela[pos] = novo;
            qtdTipos++;
            lista = novo->lista;
        }
        lista->inserirOrdenado(b);
    }

    // Total de bolsas de todos os tipos.
    int totalBolsas() {
        int total = 0;
        for (int i = 0; i < capacidade; i++) {
            NoIndice* atual = tabela[i];
            while (atual != nullptr) {
                total += atual->lista->tamanho();
                atual = atual->proximo;
            }
        }
        return total;
    }

    int tiposGuardados() { return qtdTipos; }
    int getCapacidade() { return capacidade; }

    // Tamanho da maior cadeia (mostra quantas colisoes existem).
    int maiorCadeia() {
        int maior = 0;
        for (int i = 0; i < capacidade; i++) {
            int tam = 0;
            NoIndice* atual = tabela[i];
            while (atual != nullptr) {
                tam++;
                atual = atual->proximo;
            }
            if (tam > maior) maior = tam;
        }
        return maior;
    }
};

#endif
