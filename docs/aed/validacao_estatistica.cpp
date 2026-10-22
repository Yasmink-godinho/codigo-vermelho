#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <string>
#include <cmath>
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

// Monta a lista de tipos sanguineos diferentes que aparecem no dataset
// (feito na mao, sem usar map/hash - so comparando com o que ja foi visto)
vector<string> tiposUnicos(const vector<Unidade> &unidades) {
    vector<string> tipos;
    for (const Unidade &u : unidades) {
        bool jaExiste = false;
        for (const string &t : tipos) {
            if (t == u.tipoSanguineo) {
                jaExiste = true;
                break;
            }
        }
        if (!jaExiste) tipos.push_back(u.tipoSanguineo);
    }
    return tipos;
}

// Calcula media, desvio padrao, variancia e CV do consumo diario
// para um tipo sanguineo especifico
void calcularEstatisticas(const vector<Unidade> &unidades, const string &tipo) {
    vector<double> consumos;
    for (const Unidade &u : unidades) {
        if (u.tipoSanguineo == tipo) {
            consumos.push_back(u.consumoDiarioMedio);
        }
    }

    int n = consumos.size();
    if (n == 0) return;

    // media
    double soma = 0.0;
    for (double c : consumos) soma += c;
    double media = soma / n;

    // variancia amostral (usa n-1, so calcula se tiver mais de 1 valor)
    double variancia = 0.0;
    if (n > 1) {
        double somaDesvios = 0.0;
        for (double c : consumos) {
            somaDesvios += (c - media) * (c - media);
        }
        variancia = somaDesvios / (n - 1);
    }

    double desvioPadrao = sqrt(variancia);
    double cv = (media != 0.0) ? (desvioPadrao / media) * 100.0 : 0.0;

    cout << tipo << "\t"
         << "Media: " << media << "\t"
         << "Desvio Padrao: " << desvioPadrao << "\t"
         << "Variancia: " << variancia << "\t"
         << "CV: " << cv << "%" << endl;
}

// Classifica o status de estoque de uma unidade
string classificarStatus(const Unidade &u) {
    if (u.qtdBolsasAtual < u.estoqueMinimoSeguranca) {
        return "CRITICO";
    } else if (u.qtdBolsasAtual < u.estoqueMinimoSeguranca * 1.2) {
        return "ATENCAO";
    } else {
        return "NORMAL";
    }
}

int main() {
    vector<Unidade> unidades = lerDataset("Dataset_Sintetico_Malha.csv");

    cout << "=== ESTATISTICAS DESCRITIVAS POR TIPO SANGUINEO ===" << endl;
    vector<string> tipos = tiposUnicos(unidades);
    for (const string &tipo : tipos) {
        calcularEstatisticas(unidades, tipo);
    }

    cout << "\n=== STATUS DE ESTOQUE POR UNIDADE ===" << endl;
    for (const Unidade &u : unidades) {
        string status = classificarStatus(u);
        cout << u.idUnidade << " - " << u.nomeInstituicao
             << " - " << u.tipoSanguineo
             << " - Atual: " << u.qtdBolsasAtual
             << " - Minimo: " << u.estoqueMinimoSeguranca
             << " - Status: " << status << endl;
    }

    cout << "\n=== UNIDADES EM ESTADO CRITICO ===" << endl;
    int totalCriticos = 0;
    for (const Unidade &u : unidades) {
        if (classificarStatus(u) == "CRITICO") {
            cout << u.idUnidade << " - " << u.nomeInstituicao
                 << " - " << u.tipoSanguineo
                 << " (Atual: " << u.qtdBolsasAtual
                 << " / Minimo: " << u.estoqueMinimoSeguranca << ")" << endl;
            totalCriticos++;
        }
    }
    if (totalCriticos == 0) {
        cout << "Nenhuma unidade critica no momento." << endl;
    }

    return 0;
}
