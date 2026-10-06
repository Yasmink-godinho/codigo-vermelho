#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <string>
using namespace std;

// Representa uma linha do dataset sintetico
struct Unidade {
    string idUnidade;
    string nomeInstituicao;
    string tipoInstituicao;
    double latitude;
    double longitude;
    string tipoSanguineo;
    int qtdBolsasAtual;
    int estoqueMinimoSeguranca;
    double consumoDiarioMedio;
};

// Quebra uma linha do CSV em campos, separando por virgula
vector<string> separarLinha(const string &linha) {
    vector<string> campos;
    stringstream ss(linha);
    string campo;
    while (getline(ss, campo, ',')) {
        campos.push_back(campo);
    }
    return campos;
}

// Le o arquivo CSV e retorna um vetor de Unidade
vector<Unidade> lerDataset(const string &caminhoArquivo) {
    vector<Unidade> unidades;
    ifstream arquivo(caminhoArquivo);
    string linha;

    getline(arquivo, linha); // pula o cabecalho

    while (getline(arquivo, linha)) {
        if (linha.empty()) continue;

        vector<string> campos = separarLinha(linha);
        if (campos.size() < 9) continue; // linha invalida, ignora

        Unidade u;
        u.idUnidade = campos[0];
        u.nomeInstituicao = campos[1];
        u.tipoInstituicao = campos[2];
        u.latitude = stod(campos[3]);
        u.longitude = stod(campos[4]);
        u.tipoSanguineo = campos[5];
        u.qtdBolsasAtual = stoi(campos[6]);
        u.estoqueMinimoSeguranca = stoi(campos[7]);
        u.consumoDiarioMedio = stod(campos[8]);

        unidades.push_back(u);
    }
    return unidades;
}

// Checa se existe alguma unidade com id repetido (linha duplicada)
// feito na mao, comparando cada par - sem usar estrutura de hash
void checarDuplicados(const vector<Unidade> &unidades) {
    int totalDuplicados = 0;
    for (size_t i = 0; i < unidades.size(); i++) {
        for (size_t j = i + 1; j < unidades.size(); j++) {
            if (unidades[i].idUnidade == unidades[j].idUnidade &&
                unidades[i].tipoSanguineo == unidades[j].tipoSanguineo) {
                cout << "Duplicado encontrado: " << unidades[i].idUnidade
                     << " - " << unidades[i].tipoSanguineo << endl;
                totalDuplicados++;
            }
        }
    }
    cout << "Total de linhas duplicadas: " << totalDuplicados << endl;
}

// Checa valores invalidos (negativos ou consumo zerado, que quebraria
// o calculo de dias ate esgotar)
void checarValoresInvalidos(const vector<Unidade> &unidades) {
    int totalInvalidos = 0;
    for (const Unidade &u : unidades) {
        bool invalido = false;

        if (u.qtdBolsasAtual < 0 || u.estoqueMinimoSeguranca < 0) {
            invalido = true;
        }
        if (u.consumoDiarioMedio <= 0) {
            invalido = true;
        }

        if (invalido) {
            cout << "Valor invalido na unidade " << u.idUnidade
                 << " (" << u.tipoSanguineo << ")" << endl;
            totalInvalidos++;
        }
    }
    cout << "Total de linhas com valores invalidos: " << totalInvalidos << endl;
}

int main() {
    vector<Unidade> unidades = lerDataset("Dataset_Sintetico_Malha.csv");

    cout << "=== CHECAGEM DE QUALIDADE DOS DADOS ===" << endl;
    cout << "Total de linhas lidas: " << unidades.size() << endl;
    checarDuplicados(unidades);
    checarValoresInvalidos(unidades);

    cout << "\n=== CRIANDO COLUNA DERIVADA: DIAS ATE ESGOTAR ===" << endl;

    // grava o dataset preparado, com a coluna nova no final
    ofstream saida("Dataset_Preparado.csv");
    saida << "ID_Unidade,Nome_Instituicao,Tipo_Instituicao,Latitude,Longitude,"
          << "Tipo_Sanguineo,Qtd_Bolsas_Atual,Estoque_Minimo_Seguranca,"
          << "Consumo_Diario_Medio,Dias_Ate_Esgotar\n";

    for (const Unidade &u : unidades) {
        double diasAteEsgotar = u.qtdBolsasAtual / u.consumoDiarioMedio;

        saida << u.idUnidade << ","
              << u.nomeInstituicao << ","
              << u.tipoInstituicao << ","
              << u.latitude << ","
              << u.longitude << ","
              << u.tipoSanguineo << ","
              << u.qtdBolsasAtual << ","
              << u.estoqueMinimoSeguranca << ","
              << u.consumoDiarioMedio << ","
              << diasAteEsgotar << "\n";
    }
    saida.close();

    cout << "Dataset preparado salvo como 'Dataset_Preparado.csv'" << endl;

    return 0;
}
