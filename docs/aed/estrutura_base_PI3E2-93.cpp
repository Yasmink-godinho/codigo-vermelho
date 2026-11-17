// PI3E2-93 - Demonstracao das estruturas em C++ com dados sinteticos.
// A saida deste programa e a mesma da demonstracao em Java
// (conexao_poo_PI3E2-94.java), o que permite comparar as duas linguagens.
//
// Compilar: g++ estrutura_base_PI3E2-93.cpp -o demo
// Executar: ./demo
#include <iostream>
#include "estrutura_base_PI3E2-93.h"
using namespace std;

int main() {
    // LISTA
    ListaBolsas bolsasH01;
    bolsasH01.inserir({"B001", "O+", "2026-09-01", "2026-10-13", "H01", "Disponivel"});
    bolsasH01.inserir({"B002", "A-", "2026-09-05", "2026-10-17", "H01", "Disponivel"});
    bolsasH01.listar();
    cout << "Tamanho da lista: " << bolsasH01.tamanho() << endl;

    Bolsa encontrada;
    if (bolsasH01.consultar("B001", encontrada)) {
        cout << "Consulta B001: " << encontrada.tipoSanguineo << " - " << encontrada.status << endl;
    }

    // FILA
    FilaRequisicoes filaHemo01;
    filaHemo01.enfileirar({"R001", "H03", "HEMO01", "O-", 5, "2026-09-14", "Pendente"});
    filaHemo01.enfileirar({"R002", "H06", "HEMO01", "B-", 3, "2026-09-14", "Pendente"});

    Requisicao proxima;
    if (filaHemo01.consultarProxima(proxima)) {
        cout << "Proxima da fila (sem remover): " << proxima.idRequisicao << endl;
    }

    Requisicao atendida;
    filaHemo01.desenfileirar(atendida);
    cout << "Atendendo requisicao: " << atendida.idRequisicao << endl;
    cout << "Restam na fila: " << filaHemo01.tamanho() << endl;

    // PILHA
    PilhaMovimentacoes historicoB001;
    historicoB001.empilhar({"B001", "Coletada", "2026-09-01"});
    historicoB001.empilhar({"B001", "Reservada", "2026-09-10"});

    Movimentacao topoAtual;
    if (historicoB001.consultarTopo(topoAtual)) {
        cout << "Topo do historico (sem remover): " << topoAtual.tipoEvento << endl;
    }

    Movimentacao ultimoEvento;
    historicoB001.desempilhar(ultimoEvento);
    cout << "Ultimo evento removido da pilha: " << ultimoEvento.tipoEvento << endl;

    // Pilha vazia: desempilhar devolve false (nao quebra o programa)
    historicoB001.desempilhar(ultimoEvento);
    bool deuCerto = historicoB001.desempilhar(ultimoEvento);
    cout << "Desempilhar com pilha vazia: " << (deuCerto ? "true" : "false") << endl;

    // Ao sair do main, os destrutores fazem delete dos nos que sobraram
    // (2 bolsas na lista e 1 requisicao na fila).
    return 0;
}
