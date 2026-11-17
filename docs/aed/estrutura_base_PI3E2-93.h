// PI3E2-93 - Lista, Fila e Pilha em C++ (no e ponteiro feitos a mao)
// As tres classes ficam definidas so neste arquivo. A demonstracao e os
// testes usam #include "estrutura_base_PI3E2-93.h", entao nao existe copia.
//
// Memoria: cada "new" tem um "delete" correspondente.
//  - remover / desenfileirar / desempilhar fazem delete do no retirado;
//  - o destrutor de cada classe chama liberar(), que faz delete dos nos
//    que ainda sobraram quando o objeto sai de escopo.
// Usamos new/delete (e nao malloc/free) porque os nos guardam objetos string;
// o malloc nao chama o construtor da string, o new chama.
#ifndef ESTRUTURA_BASE_PI3E2_93_H
#define ESTRUTURA_BASE_PI3E2_93_H

#include <iostream>
#include <string>
#include "estrutura_dados_PI3E2-92.h"
using namespace std;

// ======================================================================
// LISTA ENCADEADA - bolsas disponiveis em uma unidade
// ======================================================================
struct NoBolsa {
    Bolsa dado;
    NoBolsa* proximo;
};

class ListaBolsas {
private:
    NoBolsa* inicio;
    int qtd;
public:
    ListaBolsas() { inicio = nullptr; qtd = 0; }

    // Destrutor: devolve a memoria dos nos que sobraram
    ~ListaBolsas() { liberar(); }

    // Copiar a lista copiaria so os ponteiros e o delete rodaria duas vezes.
    // Por isso a copia e proibida.
    ListaBolsas(const ListaBolsas&) = delete;
    ListaBolsas& operator=(const ListaBolsas&) = delete;

    // Insere no INICIO da lista
    void inserir(Bolsa nova) {
        NoBolsa* novo = new NoBolsa();
        novo->dado = nova;
        novo->proximo = inicio;
        inicio = novo;
        qtd++;
    }

    // Remove pelo id. Trata cabeca, meio e fim.
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
        return false; // nao encontrou a bolsa
    }

    // Consulta pelo id, sem remover. Devolve true e preenche "encontrada".
    bool consultar(string idBolsa, Bolsa &encontrada) {
        NoBolsa* atual = inicio;
        while (atual != nullptr) {
            if (atual->dado.idBolsa == idBolsa) {
                encontrada = atual->dado;
                return true;
            }
            atual = atual->proximo;
        }
        return false;
    }

    // Consulta pela posicao (0 = primeira da lista), sem remover.
    bool obterNaPosicao(int posicao, Bolsa &saida) {
        if (posicao < 0) return false;
        NoBolsa* atual = inicio;
        int i = 0;
        while (atual != nullptr) {
            if (i == posicao) {
                saida = atual->dado;
                return true;
            }
            atual = atual->proximo;
            i++;
        }
        return false;
    }

    int tamanho() { return qtd; }

    bool vazia() { return inicio == nullptr; }

    void listar() {
        NoBolsa* atual = inicio;
        while (atual != nullptr) {
            cout << atual->dado.idBolsa << " - " << atual->dado.tipoSanguineo
                 << " - " << atual->dado.status << endl;
            atual = atual->proximo;
        }
    }

    // Faz delete de todos os nos que ainda estao na lista
    void liberar() {
        while (inicio != nullptr) {
            NoBolsa* temp = inicio;
            inicio = inicio->proximo;
            delete temp;
        }
        qtd = 0;
    }
};

// ======================================================================
// FILA - requisicoes pendentes (FIFO)
// ======================================================================
struct NoRequisicao {
    Requisicao dado;
    NoRequisicao* proximo;
};

class FilaRequisicoes {
private:
    NoRequisicao* inicio;
    NoRequisicao* fim;
    int qtd;
public:
    FilaRequisicoes() { inicio = nullptr; fim = nullptr; qtd = 0; }

    ~FilaRequisicoes() { liberar(); }

    FilaRequisicoes(const FilaRequisicoes&) = delete;
    FilaRequisicoes& operator=(const FilaRequisicoes&) = delete;

    // Insere no FIM da fila
    void enfileirar(Requisicao nova) {
        NoRequisicao* novo = new NoRequisicao();
        novo->dado = nova;
        novo->proximo = nullptr;
        if (fim == nullptr) {
            inicio = novo;
            fim = novo;
        } else {
            fim->proximo = novo;
            fim = novo;
        }
        qtd++;
    }

    // Remove do INICIO da fila. Se a fila esvaziar, "fim" volta a nullptr.
    bool desenfileirar(Requisicao &removida) {
        if (inicio == nullptr) return false;
        removida = inicio->dado;
        NoRequisicao* temp = inicio;
        inicio = inicio->proximo;
        if (inicio == nullptr) fim = nullptr;
        delete temp;
        qtd--;
        return true;
    }

    // Consulta a proxima requisicao, sem remover.
    bool consultarProxima(Requisicao &proxima) {
        if (inicio == nullptr) return false;
        proxima = inicio->dado;
        return true;
    }

    int tamanho() { return qtd; }

    bool vazia() { return inicio == nullptr; }

    void liberar() {
        while (inicio != nullptr) {
            NoRequisicao* temp = inicio;
            inicio = inicio->proximo;
            delete temp;
        }
        fim = nullptr;
        qtd = 0;
    }
};

// ======================================================================
// PILHA - historico de movimentacoes de uma bolsa (LIFO)
// ======================================================================
struct NoMovimentacao {
    Movimentacao dado;
    NoMovimentacao* proximo;
};

class PilhaMovimentacoes {
private:
    NoMovimentacao* topo;
    int qtd;
public:
    PilhaMovimentacoes() { topo = nullptr; qtd = 0; }

    ~PilhaMovimentacoes() { liberar(); }

    PilhaMovimentacoes(const PilhaMovimentacoes&) = delete;
    PilhaMovimentacoes& operator=(const PilhaMovimentacoes&) = delete;

    // Insere no TOPO
    void empilhar(Movimentacao nova) {
        NoMovimentacao* novo = new NoMovimentacao();
        novo->dado = nova;
        novo->proximo = topo;
        topo = novo;
        qtd++;
    }

    // Remove do TOPO. Pilha vazia devolve false.
    bool desempilhar(Movimentacao &removida) {
        if (topo == nullptr) return false;
        removida = topo->dado;
        NoMovimentacao* temp = topo;
        topo = topo->proximo;
        delete temp;
        qtd--;
        return true;
    }

    // Consulta o evento mais recente, sem remover.
    bool consultarTopo(Movimentacao &atual) {
        if (topo == nullptr) return false;
        atual = topo->dado;
        return true;
    }

    int tamanho() { return qtd; }

    bool vazia() { return topo == nullptr; }

    void liberar() {
        while (topo != nullptr) {
            NoMovimentacao* temp = topo;
            topo = topo->proximo;
            delete temp;
        }
        qtd = 0;
    }
};

#endif
