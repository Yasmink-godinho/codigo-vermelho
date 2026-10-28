#include <cassert>
#include <iostream>
#define main exemplo_original_main
#include "estrutura_base_PI3E2-93.cpp"
#undef main

int main() {
    ListaBolsas lista;
    assert(lista.consultar("B001") == nullptr);
    lista.inserir({"B001", "O+", "2026-09-01", "2026-10-13", "H01", "Disponivel"});
    lista.inserir({"B002", "A-", "2026-09-05", "2026-10-17", "H01", "Disponivel"});
    assert(lista.consultar("B001") != nullptr);
    assert(lista.consultar("B001")->tipoSanguineo == "O+");
    assert(lista.remover("B001"));
    assert(lista.consultar("B001") == nullptr);
    assert(!lista.remover("inexistente"));

    FilaRequisicoes fila;
    assert(fila.vazia());
    assert(fila.consultarProxima() == nullptr);
    fila.enfileirar({"R001", "H03", "HEMO01", "O-", 5, "2026-09-14", "Pendente"});
    fila.enfileirar({"R002", "H06", "HEMO01", "B-", 3, "2026-09-14", "Pendente"});
    assert(fila.consultarProxima()->idRequisicao == "R001");
    Requisicao r;
    assert(fila.desenfileirar(r) && r.idRequisicao == "R001");
    assert(fila.desenfileirar(r) && r.idRequisicao == "R002");
    assert(fila.vazia() && fila.consultarProxima() == nullptr);
    assert(!fila.desenfileirar(r));

    PilhaMovimentacoes pilha;
    assert(pilha.vazia());
    assert(pilha.consultarTopo() == nullptr);
    pilha.empilhar({"B001", "Coletada", "2026-09-01"});
    pilha.empilhar({"B001", "Reservada", "2026-09-10"});
    assert(pilha.consultarTopo()->tipoEvento == "Reservada");
    Movimentacao m;
    assert(pilha.desempilhar(m) && m.tipoEvento == "Reservada");
    assert(pilha.desempilhar(m) && m.tipoEvento == "Coletada");
    assert(pilha.vazia() && pilha.consultarTopo() == nullptr);
    assert(!pilha.desempilhar(m));
    std::cout << "Todos os testes de AED em C++ passaram.\n";
}
