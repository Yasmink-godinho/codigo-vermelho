// Testes automatizados das estruturas em C++ (sem biblioteca de teste).
// As classes NAO estao copiadas aqui: vem do header via #include.
//
// Compilar: g++ testes_estruturas.cpp -o testes
// Executar: ./testes
#include <iostream>
#include "estrutura_base_PI3E2-93.h"
using namespace std;

int passaram = 0;
int total = 0;

void verificar(bool condicao, string nomeDoTeste) {
    total++;
    if (condicao) {
        passaram++;
        cout << "[PASSOU] " << nomeDoTeste << endl;
    } else {
        cout << "[FALHOU] " << nomeDoTeste << endl;
    }
}

Bolsa criarBolsa(string id, string tipo) {
    return {id, tipo, "2026-09-01", "2026-10-13", "H01", "Disponivel"};
}

Requisicao criarRequisicao(string id) {
    return {id, "H03", "HEMO01", "O-", 5, "2026-09-14", "Pendente"};
}

Movimentacao criarMovimentacao(string tipoEvento) {
    return {"B001", tipoEvento, "2026-09-01"};
}

// ---------------------------------------------------------------- LISTA
void testarLista() {
    cout << "--- Lista ---" << endl;

    ListaBolsas vazia;
    Bolsa b;
    verificar(vazia.vazia(), "Lista nova esta vazia");
    verificar(vazia.tamanho() == 0, "Lista nova tem tamanho 0");
    verificar(!vazia.remover("B001"), "Remover em lista vazia devolve false");
    verificar(!vazia.consultar("B001", b), "Consultar em lista vazia devolve false");

    ListaBolsas lista;
    lista.inserir(criarBolsa("B001", "O+"));
    lista.inserir(criarBolsa("B002", "A-"));
    lista.inserir(criarBolsa("B003", "B+"));
    verificar(lista.tamanho() == 3, "Tamanho 3 apos tres insercoes");

    // inserir coloca no INICIO: a ordem fica B003, B002, B001
    bool ok0 = lista.obterNaPosicao(0, b) && b.idBolsa == "B003";
    bool ok1 = lista.obterNaPosicao(1, b) && b.idBolsa == "B002";
    bool ok2 = lista.obterNaPosicao(2, b) && b.idBolsa == "B001";
    verificar(ok0 && ok1 && ok2, "Insercao no inicio: ordem B003, B002, B001");
    verificar(!lista.obterNaPosicao(3, b), "Posicao inexistente devolve false");

    verificar(lista.consultar("B002", b) && b.tipoSanguineo == "A-", "Consultar B002 devolve a bolsa certa");
    verificar(lista.tamanho() == 3, "Consultar nao remove da lista");
    verificar(!lista.consultar("B999", b), "Consultar id inexistente devolve false");

    verificar(lista.remover("B003"), "Remover a cabeca (B003)");
    verificar(lista.obterNaPosicao(0, b) && b.idBolsa == "B002", "Depois de remover a cabeca, B002 e a primeira");

    lista.inserir(criarBolsa("B004", "AB+")); // ordem: B004, B002, B001
    verificar(lista.remover("B002"), "Remover do meio (B002)");
    verificar(lista.obterNaPosicao(0, b) && b.idBolsa == "B004" &&
              lista.obterNaPosicao(1, b) && b.idBolsa == "B001", "Depois de remover o meio, ficam B004 e B001");

    verificar(lista.remover("B001"), "Remover o ultimo (B001)");
    verificar(lista.tamanho() == 1, "Tamanho 1 apos tres remocoes");

    verificar(!lista.remover("B001"), "Remover duas vezes o mesmo id devolve false na segunda");
    verificar(lista.remover("B004") && lista.vazia(), "Remover o unico elemento deixa a lista vazia");
}

// ----------------------------------------------------------------- FILA
void testarFila() {
    cout << "--- Fila ---" << endl;

    FilaRequisicoes fila;
    Requisicao r;
    verificar(fila.vazia(), "Fila nova esta vazia");
    verificar(!fila.desenfileirar(r), "Desenfileirar em fila vazia devolve false");
    verificar(!fila.consultarProxima(r), "Consultar proxima em fila vazia devolve false");

    fila.enfileirar(criarRequisicao("R001"));
    fila.enfileirar(criarRequisicao("R002"));
    fila.enfileirar(criarRequisicao("R003"));
    verificar(fila.tamanho() == 3, "Tamanho 3 apos tres enfileiramentos");

    verificar(fila.consultarProxima(r) && r.idRequisicao == "R001", "Proxima da fila e R001");
    verificar(fila.tamanho() == 3, "Consultar proxima nao remove");

    bool a = fila.desenfileirar(r) && r.idRequisicao == "R001";
    bool b = fila.desenfileirar(r) && r.idRequisicao == "R002";
    bool c = fila.desenfileirar(r) && r.idRequisicao == "R003";
    verificar(a && b && c, "Ordem FIFO: R001, R002, R003");
    verificar(fila.vazia() && fila.tamanho() == 0, "Fila vazia depois de atender todas");

    // Caso de borda: depois de esvaziar, "fim" tem que voltar para nullptr
    fila.enfileirar(criarRequisicao("R004"));
    verificar(fila.consultarProxima(r) && r.idRequisicao == "R004", "Reutilizar a fila depois de esvaziar");
    fila.enfileirar(criarRequisicao("R005"));
    verificar(fila.desenfileirar(r) && r.idRequisicao == "R004" &&
              fila.desenfileirar(r) && r.idRequisicao == "R005", "Fila reutilizada mantem a ordem FIFO");
}

// ---------------------------------------------------------------- PILHA
void testarPilha() {
    cout << "--- Pilha ---" << endl;

    PilhaMovimentacoes pilha;
    Movimentacao m;
    verificar(pilha.vazia(), "Pilha nova esta vazia");
    verificar(!pilha.desempilhar(m), "Desempilhar em pilha vazia devolve false");
    verificar(!pilha.consultarTopo(m), "Consultar topo em pilha vazia devolve false");

    pilha.empilhar(criarMovimentacao("Coletada"));
    pilha.empilhar(criarMovimentacao("Reservada"));
    pilha.empilhar(criarMovimentacao("Utilizada"));
    verificar(pilha.tamanho() == 3, "Tamanho 3 apos tres empilhamentos");

    verificar(pilha.consultarTopo(m) && m.tipoEvento == "Utilizada", "Topo e o evento mais recente (Utilizada)");
    verificar(pilha.tamanho() == 3, "Consultar topo nao remove");

    bool a = pilha.desempilhar(m) && m.tipoEvento == "Utilizada";
    bool b = pilha.desempilhar(m) && m.tipoEvento == "Reservada";
    bool c = pilha.desempilhar(m) && m.tipoEvento == "Coletada";
    verificar(a && b && c, "Ordem LIFO: Utilizada, Reservada, Coletada");
    verificar(pilha.vazia() && !pilha.desempilhar(m), "Pilha vazia depois de desempilhar tudo");
}

int main() {
    testarLista();
    testarFila();
    testarPilha();

    cout << endl << passaram << " de " << total << " testes passaram." << endl;
    return (passaram == total) ? 0 : 1;
}
