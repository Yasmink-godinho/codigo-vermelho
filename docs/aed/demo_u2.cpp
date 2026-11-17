// U2 - Demonstracao dos quatro algoritmos e da integracao, com dados sinteticos
// (coordenadas das unidades de Recife usadas no dataset do projeto).
// A saida e a mesma da versao Java (DemonstracaoU2 em integracao_poo_u2.java).
//
// Compilar: g++ demo_u2.cpp -o demo_u2
// Executar: ./demo_u2
#include <iostream>
#include <iomanip>
#include "alocacao_integrada.h"
using namespace std;

void imprimirResultado(Requisicao pedido, ResultadoAlocacao &r) {
    cout << "Pedido " << pedido.idRequisicao << ": " << pedido.quantidadeSolicitada
         << " bolsa(s) " << pedido.tipoSanguineoSolicitado
         << " para " << pedido.idUnidadeSolicitante << endl;
    cout << "  Atendido: " << (r.atendida ? "sim" : "nao") << " (" << r.motivo << ")" << endl;
    cout << "  Vencidas descartadas: " << r.descartadas << endl;
    if (!r.atendida) return;
    NoBolsa* atual = r.bolsas.primeiro();
    while (atual != nullptr) {
        cout << "  Bolsa " << atual->dado.idBolsa << " (" << atual->dado.tipoSanguineo
             << ", vence " << atual->dado.dataValidade << ") de " << atual->dado.idUnidadeAtual << endl;
        atual = atual->proximo;
    }
    cout << "  Rota:";
    for (int i = 0; i < r.rota.qtdPontos; i++) {
        cout << (i == 0 ? " " : " -> ") << r.rota.ordem[i];
    }
    cout << endl;
    cout << "  Distancia total: " << fixed << setprecision(2) << r.rota.distanciaTotalKm << " km" << endl;
}

int main() {
    // ---------------- 1. Matriz ABO/Rh
    cout << "=== 1. Matriz ABO/Rh ===" << endl;
    cout << "O- doa para AB+: " << (compativel("O-", "AB+") ? "sim" : "nao") << endl;
    cout << "A+ doa para O-: " << (compativel("A+", "O-") ? "sim" : "nao") << endl;
    cout << "A- doa para A+: " << (compativel("A-", "A+") ? "sim" : "nao") << endl;
    cout << "A+ doa para A-: " << (compativel("A+", "A-") ? "sim" : "nao") << endl;
    string doadores[QTD_TIPOS];
    int n = doadoresCompativeis("B-", doadores);
    cout << "Doadores compativeis com B-:";
    for (int i = 0; i < n; i++) cout << " " << doadores[i];
    cout << endl;

    // ---------------- 2. FEFO
    cout << "=== 2. FEFO (lista ordenada por validade) ===" << endl;
    ListaFefo fefo;
    fefo.inserirOrdenado({"B501", "O+", "2026-10-01", "2026-12-01", "HEMO01", "Disponivel"});
    fefo.inserirOrdenado({"B502", "O+", "2026-10-02", "2026-11-15", "HEMO01", "Disponivel"});
    fefo.inserirOrdenado({"B503", "O+", "2026-10-03", "2026-11-20", "HEMO01", "Disponivel"});
    fefo.listar();
    Bolsa proxima;
    fefo.consultarMaisProxima(proxima);
    cout << "Proxima a vencer: " << proxima.idBolsa << endl;

    // ---------------- 3. Indice hash
    cout << "=== 3. Indice hash ===" << endl;
    IndiceEstoque indice(5);
    string todos[QTD_TIPOS] = {"O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"};
    for (int i = 0; i < QTD_TIPOS; i++) {
        indice.inserirBolsa({"X" + to_string(i), todos[i], "2026-10-01", "2026-12-01", "HEMO01", "Disponivel"});
    }
    cout << "Tipos guardados: " << indice.tiposGuardados() << endl;
    cout << "Capacidade: " << indice.getCapacidade() << endl;
    cout << "Maior cadeia (colisoes): " << indice.maiorCadeia() << endl;
    cout << "Busca A+: " << (indice.buscar("A+") != nullptr ? "achou" : "nao achou") << endl;

    // ---------------- 4. Rota
    cout << "=== 4. Rota (vizinho mais proximo) ===" << endl;
    Ponto origem = {"HEMO01", -8.0476, -34.8770};
    Ponto paradas[3] = {
        {"HEMO02", -8.0993, -34.9448},
        {"HEMO03", -8.0631, -34.8711},
        {"H06", -8.0219, -34.9622}
    };
    Ponto destino = {"H03", -7.9948, -34.8656};
    RotaResultado rota;
    calcularRota(origem, paradas, 3, destino, rota);
    cout << "Rota:";
    for (int i = 0; i < rota.qtdPontos; i++) cout << (i == 0 ? " " : " -> ") << rota.ordem[i];
    cout << endl;
    cout << "Distancia total: " << fixed << setprecision(2) << rota.distanciaTotalKm << " km" << endl;

    // ---------------- 5. Integracao
    cout << "=== 5. Pedido integrado (matriz + hash + FEFO + rota) ===" << endl;
    CentralAlocacao central;
    central.adicionarUnidade("HEMO01", -8.0476, -34.8770, 5);
    central.adicionarUnidade("HEMO02", -8.0993, -34.9448, 5);
    central.adicionarUnidade("HEMO03", -8.0631, -34.8711, 5);
    central.adicionarUnidade("H06", -8.0219, -34.9622, 5);
    central.adicionarUnidade("H03", -7.9948, -34.8656, 5);

    central.adicionarBolsa({"B101", "O-", "2026-10-01", "2026-11-20", "HEMO01", "Disponivel"});
    central.adicionarBolsa({"B102", "O+", "2026-10-02", "2026-11-18", "HEMO01", "Disponivel"});
    central.adicionarBolsa({"B103", "A+", "2026-10-03", "2026-12-05", "HEMO01", "Disponivel"});
    central.adicionarBolsa({"B104", "O-", "2026-09-20", "2026-11-05", "HEMO01", "Disponivel"});
    central.adicionarBolsa({"B201", "O-", "2026-10-05", "2026-11-25", "HEMO02", "Disponivel"});
    central.adicionarBolsa({"B202", "B-", "2026-10-06", "2026-11-15", "HEMO02", "Disponivel"});
    central.adicionarBolsa({"B203", "O+", "2026-10-07", "2026-11-30", "HEMO02", "Disponivel"});
    central.adicionarBolsa({"B301", "B-", "2026-10-08", "2026-11-22", "HEMO03", "Disponivel"});
    central.adicionarBolsa({"B302", "AB-", "2026-10-09", "2026-12-10", "HEMO03", "Disponivel"});
    central.adicionarBolsa({"B303", "O-", "2026-10-10", "2026-11-13", "HEMO03", "Disponivel"});
    central.adicionarBolsa({"B601", "B-", "2026-10-11", "2026-11-16", "H06", "Disponivel"});
    cout << "Bolsas em estoque: " << central.totalBolsas() << endl;

    string hoje = "2026-11-11";

    Requisicao r1 = {"R010", "H03", "HEMO01", "B-", 3, "2026-11-11", "Pendente"};
    ResultadoAlocacao res1;
    central.atender(r1, hoje, res1);
    imprimirResultado(r1, res1);

    Requisicao r2 = {"R011", "H03", "HEMO01", "A+", 2, "2026-11-11", "Pendente"};
    ResultadoAlocacao res2;
    central.atender(r2, hoje, res2);
    imprimirResultado(r2, res2);

    Requisicao r3 = {"R012", "H03", "HEMO01", "AB+", 20, "2026-11-11", "Pendente"};
    ResultadoAlocacao res3;
    central.atender(r3, hoje, res3);
    imprimirResultado(r3, res3);

    Requisicao r4 = {"R013", "H03", "HEMO01", "XX", 1, "2026-11-11", "Pendente"};
    ResultadoAlocacao res4;
    central.atender(r4, hoje, res4);
    imprimirResultado(r4, res4);

    cout << "Bolsas em estoque ao final: " << central.totalBolsas() << endl;
    return 0;
}
