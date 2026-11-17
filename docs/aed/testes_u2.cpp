// Testes automatizados da U2 em C++ (sem biblioteca de teste).
// Sao os mesmos casos de TestesU2.java, na mesma ordem e com os mesmos nomes.
//
// Compilar: g++ testes_u2.cpp -o testes_u2
// Executar: ./testes_u2
#include <iostream>
#include <cmath>
#include "alocacao_integrada.h"
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

Bolsa criarBolsa(string id, string tipo, string validade, string unidade) {
    return {id, tipo, "2026-10-01", validade, unidade, "Disponivel"};
}

Requisicao criarPedido(string id, string solicitante, string origem, string tipo, int qtd) {
    return {id, solicitante, origem, tipo, qtd, "2026-11-11", "Pendente"};
}

// Central com 4 unidades (mesmas coordenadas da demonstracao)
void montarCentral(CentralAlocacao &c) {
    c.adicionarUnidade("HEMO01", -8.0476, -34.8770, 5);
    c.adicionarUnidade("HEMO02", -8.0993, -34.9448, 5);
    c.adicionarUnidade("HEMO03", -8.0631, -34.8711, 5);
    c.adicionarUnidade("H03", -7.9948, -34.8656, 5);
}

// ------------------------------------------------------------ MATRIZ
void testarMatriz() {
    cout << "--- Matriz ABO/Rh ---" << endl;

    int pares = 0;
    for (int d = 0; d < QTD_TIPOS; d++)
        for (int r = 0; r < QTD_TIPOS; r++)
            if (compativel(TIPOS[d], TIPOS[r])) pares++;
    verificar(pares == 27, "Matriz tem 27 pares compativeis de 64");

    bool todosTiposRecebemDeOnegativo = true;
    for (int r = 0; r < QTD_TIPOS; r++)
        if (!compativel("O-", TIPOS[r])) todosTiposRecebemDeOnegativo = false;
    verificar(todosTiposRecebemDeOnegativo, "O- doa para os 8 tipos");

    bool abPositivoRecebeDeTodos = true;
    for (int d = 0; d < QTD_TIPOS; d++)
        if (!compativel(TIPOS[d], "AB+")) abPositivoRecebeDeTodos = false;
    verificar(abPositivoRecebeDeTodos, "AB+ recebe de todos os 8 tipos");

    verificar(compativel("AB+", "AB+") && !compativel("AB+", "O-") && !compativel("AB+", "A+")
              && !compativel("AB+", "B+") && !compativel("AB+", "AB-"), "AB+ doa somente para AB+");

    bool mesmoTipo = true;
    for (int i = 0; i < QTD_TIPOS; i++)
        if (!compativel(TIPOS[i], TIPOS[i])) mesmoTipo = false;
    verificar(mesmoTipo, "Todo tipo e compativel com ele mesmo");

    verificar(compativel("A-", "A+") && !compativel("A+", "A-"), "Rh: A- doa para A+, A+ nao doa para A-");
    verificar(compativel("O-", "O+") && !compativel("O+", "O-"), "Rh: O- doa para O+, O+ nao doa para O-");
    verificar(!compativel("A+", "B+") && !compativel("B+", "A+"), "ABO: A+ e B+ sao incompativeis nos dois sentidos");
    verificar(!compativel("A-", "B-") && !compativel("B-", "A-"), "ABO: A- e B- sao incompativeis nos dois sentidos");
    verificar(!compativel("O+", "A-") && !compativel("O+", "B-"), "O+ nao doa para receptor Rh negativo");
    verificar(!compativel("AB-", "O-") && !compativel("AB-", "A-"), "AB- nao doa para O- nem A-");

    verificar(!compativel("C+", "O-") && !compativel("O-", "C+") && !compativel("", "O-")
              && !compativel("o-", "O-"), "Tipo invalido devolve false");
    verificar(indiceDoTipo("AB+") == 7 && indiceDoTipo("O-") == 0 && indiceDoTipo("X") == -1,
              "indiceDoTipo devolve a posicao ou -1");

    // Regra independente: doa se nao tem antigeno que o receptor nao tem
    bool igualRegra = true;
    for (int d = 0; d < QTD_TIPOS; d++) {
        for (int r = 0; r < QTD_TIPOS; r++) {
            string dd = TIPOS[d];
            string rr = TIPOS[r];
            bool dA = dd.find('A') != string::npos;
            bool dB = dd.find('B') != string::npos;
            bool dRh = dd.find('+') != string::npos;
            bool rA = rr.find('A') != string::npos;
            bool rB = rr.find('B') != string::npos;
            bool rRh = rr.find('+') != string::npos;
            bool esperado = (!dA || rA) && (!dB || rB) && (!dRh || rRh);
            if (compativel(dd, rr) != esperado) igualRegra = false;
        }
    }
    verificar(igualRegra, "Matriz confere com a regra de antigenos nos 64 pares");

    string saida[QTD_TIPOS];
    verificar(doadoresCompativeis("AB+", saida) == 8, "Doadores de AB+: 8 tipos");
    verificar(doadoresCompativeis("O-", saida) == 1 && saida[0] == "O-", "Doadores de O-: so O-");
    verificar(doadoresCompativeis("A+", saida) == 4, "Doadores de A+: 4 tipos");
    verificar(doadoresCompativeis("Z+", saida) == 0, "Doadores de tipo invalido: 0");
}

// -------------------------------------------------------------- FEFO
void testarFefo() {
    cout << "--- FEFO ---" << endl;

    ListaFefo vazia;
    Bolsa b;
    verificar(vazia.vazia() && vazia.tamanho() == 0, "Lista FEFO nova esta vazia");
    verificar(!vazia.consultarMaisProxima(b), "Consultar em FEFO vazia devolve false");
    verificar(!vazia.removerMaisProxima(b), "Remover em FEFO vazia devolve false");
    verificar(vazia.descartarVencidos("2026-11-11") == 0, "Descartar vencidas em FEFO vazia devolve 0");

    ListaFefo f;
    f.inserirOrdenado(criarBolsa("B1", "O+", "2026-12-01", "HEMO01"));
    f.inserirOrdenado(criarBolsa("B2", "O+", "2026-11-15", "HEMO01"));
    f.inserirOrdenado(criarBolsa("B3", "O+", "2026-11-20", "HEMO01"));
    f.inserirOrdenado(criarBolsa("B4", "O+", "2026-11-10", "HEMO01"));
    verificar(f.tamanho() == 4, "FEFO: tamanho 4 apos quatro insercoes");

    NoBolsa* no = f.primeiro();
    string ordem = "";
    while (no != nullptr) {
        ordem += no->dado.idBolsa + " ";
        no = no->proximo;
    }
    verificar(ordem == "B4 B2 B3 B1 ", "FEFO: lista fica ordenada por validade (B4 B2 B3 B1)");

    f.consultarMaisProxima(b);
    verificar(b.idBolsa == "B4" && f.tamanho() == 4, "FEFO: consultar devolve a que vence primeiro sem remover");

    ListaFefo empate;
    empate.inserirOrdenado(criarBolsa("E1", "O+", "2026-11-20", "HEMO01"));
    empate.inserirOrdenado(criarBolsa("E2", "O+", "2026-11-20", "HEMO01"));
    empate.inserirOrdenado(criarBolsa("E3", "O+", "2026-11-20", "HEMO01"));
    empate.removerMaisProxima(b);
    bool e1 = b.idBolsa == "E1";
    empate.removerMaisProxima(b);
    verificar(e1 && b.idBolsa == "E2", "FEFO: empate de validade preserva a ordem de chegada");

    verificar(f.removerMaisProxima(b) && b.idBolsa == "B4" && f.tamanho() == 3, "FEFO: remover tira a que vence primeiro");
    verificar(f.consultarMaisProxima(b) && b.idBolsa == "B2", "FEFO: a proxima a vencer passa a ser B2");

    verificar(f.remover("B3") && f.tamanho() == 2, "FEFO: remover por id no meio");
    verificar(!f.remover("B3"), "FEFO: remover id inexistente devolve false");
    verificar(f.remover("B1") && f.tamanho() == 1, "FEFO: remover por id no fim");
    verificar(f.remover("B2") && f.vazia(), "FEFO: remover por id na cabeca esvazia a lista");

    ListaFefo g;
    g.inserirOrdenado(criarBolsa("V1", "A+", "2026-11-05", "HEMO01"));
    g.inserirOrdenado(criarBolsa("V2", "A+", "2026-11-10", "HEMO01"));
    g.inserirOrdenado(criarBolsa("V3", "A+", "2026-11-11", "HEMO01"));
    g.inserirOrdenado(criarBolsa("V4", "A+", "2026-11-20", "HEMO01"));
    verificar(g.descartarVencidos("2026-11-11") == 2 && g.tamanho() == 2,
              "FEFO: descartar vencidas remove so as anteriores a hoje");
    g.consultarMaisProxima(b);
    verificar(b.idBolsa == "V3", "FEFO: bolsa que vence hoje NAO e descartada");
    verificar(g.descartarVencidos("2026-11-11") == 0, "FEFO: descartar de novo nao remove nada");
    verificar(g.descartarVencidos("2027-01-01") == 2 && g.vazia(), "FEFO: descartar tudo esvazia a lista");
}

// -------------------------------------------------------------- HASH
void testarHash() {
    cout << "--- Hash ---" << endl;

    IndiceEstoque minimo(0);
    verificar(minimo.getCapacidade() == 1, "Capacidade 0 vira 1");

    IndiceEstoque vazio(5);
    verificar(vazio.buscar("O+") == nullptr && vazio.totalBolsas() == 0, "Indice novo: busca devolve nullptr");
    verificar(vazio.funcaoHash("O+") == 2, "funcaoHash(\"O+\") com capacidade 5 vale 2");

    bool dentroDoIntervalo = true;
    for (int i = 0; i < QTD_TIPOS; i++) {
        int h = vazio.funcaoHash(TIPOS[i]);
        if (h < 0 || h >= 5) dentroDoIntervalo = false;
    }
    verificar(dentroDoIntervalo, "funcaoHash fica sempre entre 0 e capacidade-1");

    IndiceEstoque idx(5);
    idx.inserirBolsa(criarBolsa("B1", "O+", "2026-12-01", "HEMO01"));
    idx.inserirBolsa(criarBolsa("B2", "O+", "2026-11-15", "HEMO01"));
    idx.inserirBolsa(criarBolsa("B3", "A-", "2026-11-20", "HEMO01"));
    verificar(idx.buscar("O+") != nullptr && idx.buscar("O+")->tamanho() == 2, "Busca O+ acha a lista com 2 bolsas");
    verificar(idx.buscar("A-") != nullptr && idx.buscar("A-")->tamanho() == 1, "Busca A- acha a lista com 1 bolsa");
    verificar(idx.buscar("B+") == nullptr, "Busca de tipo sem bolsas devolve nullptr");
    verificar(idx.tiposGuardados() == 2 && idx.totalBolsas() == 3, "2 tipos guardados e 3 bolsas no total");

    Bolsa b;
    idx.buscar("O+")->consultarMaisProxima(b);
    verificar(b.idBolsa == "B2", "Lista do tipo no indice esta em ordem FEFO");

    IndiceEstoque colisao(1);
    for (int i = 0; i < QTD_TIPOS; i++) {
        colisao.inserirBolsa(criarBolsa("C" + to_string(i), TIPOS[i], "2026-12-01", "HEMO01"));
    }
    verificar(colisao.maiorCadeia() == 8, "Capacidade 1: os 8 tipos colidem na mesma cadeia");
    bool todosAchados = true;
    for (int i = 0; i < QTD_TIPOS; i++) {
        ListaFefo* l = colisao.buscar(TIPOS[i]);
        if (l == nullptr || l->tamanho() != 1) todosAchados = false;
    }
    verificar(todosAchados, "Com colisao total, todos os tipos continuam sendo encontrados");
    verificar(colisao.totalBolsas() == 8, "Com colisao total, o total de bolsas e 8");

    IndiceEstoque grande(101);
    for (int i = 0; i < QTD_TIPOS; i++) {
        grande.inserirBolsa(criarBolsa("G" + to_string(i), TIPOS[i], "2026-12-01", "HEMO01"));
    }
    verificar(grande.maiorCadeia() <= 2, "Capacidade 101: cadeias curtas (no maximo 2)");
}

// -------------------------------------------------------------- ROTA
void testarRota() {
    cout << "--- Rota ---" << endl;

    Ponto a = {"A", 0.0, 0.0};
    Ponto b = {"B", 1.0, 0.0};
    verificar(fabs(distanciaKm(a, a)) < 0.0001, "Distancia de um ponto a ele mesmo e 0");
    verificar(fabs(distanciaKm(a, b) - 111.19) < 0.1, "1 grau de latitude vale cerca de 111,19 km");
    verificar(fabs(distanciaKm(a, b) - distanciaKm(b, a)) < 0.0001, "Distancia e simetrica");

    Ponto origem = {"O", 0.0, 0.0};
    Ponto destino = {"D", 0.0, 0.4};
    RotaResultado rota;

    verificar(calcularRota(origem, nullptr, 0, destino, rota) && rota.qtdPontos == 2
              && rota.ordem[0] == "O" && rota.ordem[1] == "D", "Rota sem paradas vai direto da origem ao destino");
    verificar(fabs(rota.distanciaTotalKm - distanciaKm(origem, destino)) < 0.0001,
              "Rota sem paradas: distancia igual a origem-destino");

    Ponto paradas[3] = {{"P3", 0.0, 0.3}, {"P1", 0.0, 0.1}, {"P2", 0.0, 0.2}};
    calcularRota(origem, paradas, 3, destino, rota);
    string ordem = "";
    for (int i = 0; i < rota.qtdPontos; i++) ordem += rota.ordem[i] + " ";
    verificar(ordem == "O P1 P2 P3 D ", "Vizinho mais proximo visita P1, P2, P3 em ordem de proximidade");
    verificar(rota.qtdPontos == 5, "Rota com 3 paradas tem 5 pontos");
    verificar(fabs(rota.distanciaTotalKm - distanciaKm(origem, destino)) < 0.01,
              "Paradas alinhadas: distancia total igual a linha reta");

    Ponto uma[1] = {{"U", 0.0, 0.1}};
    calcularRota(origem, uma, 1, destino, rota);
    double esperado = distanciaKm(origem, uma[0]) + distanciaKm(uma[0], destino);
    verificar(fabs(rota.distanciaTotalKm - esperado) < 0.0001, "Distancia total e a soma dos trechos");

    Ponto muitas[MAX_PARADAS + 1];
    for (int i = 0; i < MAX_PARADAS + 1; i++) muitas[i] = {"M", 0.0, 0.01 * i};
    verificar(!calcularRota(origem, muitas, MAX_PARADAS + 1, destino, rota), "Mais paradas que o maximo devolve false");
    verificar(!calcularRota(origem, paradas, -1, destino, rota), "Numero de paradas negativo devolve false");
}

// -------------------------------------------------------- INTEGRACAO
void testarIntegracao() {
    cout << "--- Integracao ---" << endl;

    CentralAlocacao central;
    verificar(central.adicionarUnidade("HEMO01", -8.0476, -34.8770, 5), "Cadastrar unidade nova devolve true");
    verificar(!central.adicionarUnidade("HEMO01", -8.0, -34.0, 5), "Cadastrar unidade com id repetido devolve false");
    verificar(!central.adicionarBolsa(criarBolsa("X1", "O+", "2026-12-01", "NAOEXISTE")),
              "Bolsa de unidade desconhecida e recusada");
    verificar(!central.adicionarBolsa(criarBolsa("X2", "Z+", "2026-12-01", "HEMO01")),
              "Bolsa com tipo invalido e recusada");
    Bolsa reservada = criarBolsa("X3", "O+", "2026-12-01", "HEMO01");
    reservada.status = "Reservada";
    verificar(!central.adicionarBolsa(reservada), "Bolsa que nao esta Disponivel e recusada");
    verificar(central.totalBolsas() == 0, "Nenhuma bolsa recusada entrou no estoque");

    // Cenario completo (igual ao da demonstracao)
    CentralAlocacao c;
    montarCentral(c);
    c.adicionarUnidade("H06", -8.0219, -34.9622, 5);
    c.adicionarBolsa(criarBolsa("B101", "O-", "2026-11-20", "HEMO01"));
    c.adicionarBolsa(criarBolsa("B102", "O+", "2026-11-18", "HEMO01"));
    c.adicionarBolsa(criarBolsa("B103", "A+", "2026-12-05", "HEMO01"));
    c.adicionarBolsa(criarBolsa("B104", "O-", "2026-11-05", "HEMO01"));
    c.adicionarBolsa(criarBolsa("B201", "O-", "2026-11-25", "HEMO02"));
    c.adicionarBolsa(criarBolsa("B202", "B-", "2026-11-15", "HEMO02"));
    c.adicionarBolsa(criarBolsa("B203", "O+", "2026-11-30", "HEMO02"));
    c.adicionarBolsa(criarBolsa("B301", "B-", "2026-11-22", "HEMO03"));
    c.adicionarBolsa(criarBolsa("B302", "AB-", "2026-12-10", "HEMO03"));
    c.adicionarBolsa(criarBolsa("B303", "O-", "2026-11-13", "HEMO03"));
    c.adicionarBolsa(criarBolsa("B601", "B-", "2026-11-16", "H06"));
    verificar(c.totalBolsas() == 11, "Cenario: 11 bolsas no estoque");
    verificar(c.estoqueDe("HEMO01", "O-") == 2 && c.estoqueDe("HEMO01", "B+") == 0
              && c.estoqueDe("NAOEXISTE", "O-") == 0, "estoqueDe consulta pelo indice hash");

    ResultadoAlocacao r1;
    bool ok1 = c.atender(criarPedido("R010", "H03", "HEMO01", "B-", 3), "2026-11-11", r1);
    verificar(ok1 && r1.atendida && r1.motivo == "ok", "Pedido de 3 B- e atendido");
    verificar(r1.bolsas.tamanho() == 3, "Pedido de 3 devolve 3 bolsas");

    Bolsa b;
    bool ordemFefo = true;
    NoBolsa* no = r1.bolsas.primeiro();
    string anterior = "";
    string ids = "";
    bool todasCompativeis = true;
    bool todasReservadas = true;
    while (no != nullptr) {
        if (no->dado.dataValidade < anterior) ordemFefo = false;
        anterior = no->dado.dataValidade;
        ids += no->dado.idBolsa + " ";
        if (!compativel(no->dado.tipoSanguineo, "B-")) todasCompativeis = false;
        if (no->dado.status != "Reservada") todasReservadas = false;
        no = no->proximo;
    }
    verificar(todasCompativeis, "Todas as bolsas escolhidas sao compativeis com B-");
    verificar(ordemFefo, "Bolsas escolhidas estao em ordem de validade");
    verificar(ids == "B303 B202 B601 ", "FEFO entre tipos e unidades: B303 (O-), B202 (B-), B601 (B-)");
    verificar(todasReservadas, "Bolsas escolhidas ficam com status Reservada");
    verificar(r1.descartadas == 1, "A bolsa vencida B104 foi descartada na busca");
    verificar(c.totalBolsas() == 7, "Estoque: 11 - 1 vencida - 3 reservadas = 7");
    verificar(c.estoqueDe("HEMO03", "O-") == 0 && c.estoqueDe("HEMO02", "B-") == 0,
              "Bolsas reservadas sairam do estoque das unidades");
    verificar(c.estoqueDe("HEMO01", "O-") == 1, "A vencida B104 saiu do estoque, B101 continua");

    string rotaTexto = "";
    for (int i = 0; i < r1.rota.qtdPontos; i++) rotaTexto += r1.rota.ordem[i] + " ";
    verificar(rotaTexto == "HEMO01 HEMO03 HEMO02 H06 H03 ", "Rota sai da fornecedora, passa pelas 3 unidades e chega no solicitante");
    verificar(r1.rota.distanciaTotalKm > 30.7 && r1.rota.distanciaTotalKm < 30.8, "Distancia da rota vale cerca de 30,77 km");

    ResultadoAlocacao r2;
    c.atender(criarPedido("R011", "H03", "HEMO01", "A+", 2), "2026-11-11", r2);
    string ids2 = "";
    no = r2.bolsas.primeiro();
    while (no != nullptr) {
        ids2 += no->dado.idBolsa + " ";
        no = no->proximo;
    }
    verificar(r2.atendida && ids2 == "B102 B101 ", "Pedido de A+ aceita O+ e O-, escolhidas por validade");
    verificar(r2.rota.qtdPontos == 2 && r2.rota.ordem[0] == "HEMO01" && r2.rota.ordem[1] == "H03",
              "Bolsas da propria origem: rota vai direto ao solicitante");

    int antes = c.totalBolsas();
    ResultadoAlocacao r3;
    bool ok3 = c.atender(criarPedido("R012", "H03", "HEMO01", "AB+", 20), "2026-11-11", r3);
    verificar(!ok3 && !r3.atendida, "Pedido maior que o estoque nao e atendido");
    verificar(c.totalBolsas() == antes && r3.bolsas.vazia(), "Pedido nao atendido nao retira nenhuma bolsa (tudo ou nada)");

    ResultadoAlocacao r4;
    verificar(!c.atender(criarPedido("R013", "H03", "HEMO01", "XX", 1), "2026-11-11", r4)
              && r4.motivo == "tipo sanguineo invalido", "Pedido com tipo invalido e recusado");
    ResultadoAlocacao r5;
    verificar(!c.atender(criarPedido("R014", "H03", "HEMO01", "O-", 0), "2026-11-11", r5)
              && r5.motivo == "quantidade invalida", "Pedido com quantidade 0 e recusado");
    ResultadoAlocacao r6;
    verificar(!c.atender(criarPedido("R015", "H03", "HEMO01", "O-", -2), "2026-11-11", r6),
              "Pedido com quantidade negativa e recusado");
    ResultadoAlocacao r7;
    verificar(!c.atender(criarPedido("R016", "NAOEXISTE", "HEMO01", "O-", 1), "2026-11-11", r7)
              && r7.motivo == "unidade desconhecida", "Pedido de unidade desconhecida e recusado");

    // Incompatibilidade: so existe A+ no estoque, o pedido e de B-
    CentralAlocacao inc;
    montarCentral(inc);
    inc.adicionarBolsa(criarBolsa("I1", "A+", "2026-12-01", "HEMO01"));
    inc.adicionarBolsa(criarBolsa("I2", "AB+", "2026-12-01", "HEMO02"));
    inc.adicionarBolsa(criarBolsa("I3", "O+", "2026-12-01", "HEMO03"));
    ResultadoAlocacao ri;
    verificar(!inc.atender(criarPedido("R020", "H03", "HEMO01", "B-", 1), "2026-11-11", ri) && inc.totalBolsas() == 3,
              "Receptor B-: estoque so com A+, AB+ e O+ (incompativeis) nao atende");
    ResultadoAlocacao ri2;
    verificar(!inc.atender(criarPedido("R021", "H03", "HEMO01", "O-", 1), "2026-11-11", ri2),
              "Receptor O-: so recebe O-, estoque sem O- nao atende");
    ResultadoAlocacao ri3;
    verificar(inc.atender(criarPedido("R022", "H03", "HEMO01", "AB+", 3), "2026-11-11", ri3) && ri3.bolsas.tamanho() == 3,
              "Receptor AB+: recebe A+, AB+ e O+ do estoque");

    // Vencidas nunca sao alocadas
    CentralAlocacao venc;
    montarCentral(venc);
    venc.adicionarBolsa(criarBolsa("V1", "O-", "2026-11-01", "HEMO01"));
    venc.adicionarBolsa(criarBolsa("V2", "O-", "2026-11-10", "HEMO02"));
    ResultadoAlocacao rv;
    verificar(!venc.atender(criarPedido("R030", "H03", "HEMO01", "O-", 1), "2026-11-11", rv) && rv.descartadas == 2,
              "Estoque so com bolsas vencidas: pedido nao e atendido e 2 sao descartadas");
    verificar(venc.totalBolsas() == 0, "As bolsas vencidas sairam do estoque");

    // A unidade solicitante nao e fonte
    CentralAlocacao proprio;
    montarCentral(proprio);
    proprio.adicionarBolsa(criarBolsa("P1", "O-", "2026-12-01", "H03"));
    ResultadoAlocacao rp;
    verificar(!proprio.atender(criarPedido("R040", "H03", "HEMO01", "O-", 1), "2026-11-11", rp),
              "Bolsas da propria unidade solicitante nao sao usadas");

    // Empate de validade: vence a primeira unidade cadastrada
    CentralAlocacao emp;
    montarCentral(emp);
    emp.adicionarBolsa(criarBolsa("T2", "O-", "2026-12-01", "HEMO02"));
    emp.adicionarBolsa(criarBolsa("T1", "O-", "2026-12-01", "HEMO01"));
    ResultadoAlocacao re;
    emp.atender(criarPedido("R050", "H03", "HEMO03", "O-", 1), "2026-11-11", re);
    verificar(re.bolsas.primeiro()->dado.idBolsa == "T1", "Empate de validade: escolhe a lista da primeira unidade cadastrada");
    verificar(re.rota.qtdPontos == 3 && re.rota.ordem[0] == "HEMO03" && re.rota.ordem[1] == "HEMO01"
              && re.rota.ordem[2] == "H03", "Rota: origem HEMO03, parada HEMO01, destino H03");

    // Um pedido nao reaproveita bolsa ja reservada
    CentralAlocacao uma;
    montarCentral(uma);
    uma.adicionarBolsa(criarBolsa("U1", "O-", "2026-12-01", "HEMO01"));
    ResultadoAlocacao ru1;
    ResultadoAlocacao ru2;
    bool primeiro = uma.atender(criarPedido("R060", "H03", "HEMO01", "O-", 1), "2026-11-11", ru1);
    bool segundo = uma.atender(criarPedido("R061", "H03", "HEMO01", "O-", 1), "2026-11-11", ru2);
    verificar(primeiro && !segundo, "A mesma bolsa nao atende dois pedidos");
}

int main() {
    testarMatriz();
    testarFefo();
    testarHash();
    testarRota();
    testarIntegracao();

    cout << endl << passaram << " de " << total << " testes passaram." << endl;
    return passaram == total ? 0 : 1;
}
