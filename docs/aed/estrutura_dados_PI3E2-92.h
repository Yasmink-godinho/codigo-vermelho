// PI3E2-92 - Structs de dominio do projeto Rota Vital
// Este arquivo e incluido (#include) pelas estruturas, pela demonstracao e
// pelos testes. As structs ficam definidas so aqui, para nao existir copia.
#ifndef ESTRUTURA_DADOS_PI3E2_92_H
#define ESTRUTURA_DADOS_PI3E2_92_H

#include <string>
using namespace std;

struct Bolsa {
    string idBolsa;
    string tipoSanguineo;
    string dataColeta;
    string dataValidade;
    string idUnidadeAtual;
    string status;
};

struct Requisicao {
    string idRequisicao;
    string idUnidadeSolicitante;
    string idUnidadeFornecedora;
    string tipoSanguineoSolicitado;
    int quantidadeSolicitada;
    string dataRequisicao;
    string status;
};

struct Movimentacao {
    string idBolsa;
    string tipoEvento; // "Coletada", "Reservada", "Utilizada", "Descartada"
    string data;
};

struct EstoqueUnidade {
    string idUnidade;
    string tipoSanguineo;
    int qtdBolsasAtual;
    int estoqueMinimoSeguranca;
    double consumoDiarioMedio;
};

#endif
