#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <string>
#include <iomanip>
using namespace std;

struct Unidade {
    string idUnidade;
    string tipoSanguineo;
    int qtdBolsasAtual;
    int estoqueMinimoSeguranca;
    double consumoDiarioMedio;
};

vector<string> separarLinha(const string &linha) {
    vector<string> campos;
    stringstream ss(linha);
    string campo;
    while (getline(ss, campo, ',')) campos.push_back(campo);
    return campos;
}

vector<Unidade> lerDatasetPreparado(const string &caminhoArquivo) {
    vector<Unidade> unidades;
    ifstream arquivo(caminhoArquivo);
    string linha;
    getline(arquivo, linha);

    while (getline(arquivo, linha)) {
        if (linha.empty()) continue;
        vector<string> campos = separarLinha(linha);
        if (campos.size() < 10) continue;

        Unidade u;
        u.idUnidade = campos[0];
        u.tipoSanguineo = campos[5];
        u.qtdBolsasAtual = stoi(campos[6]);
        u.estoqueMinimoSeguranca = stoi(campos[7]);
        u.consumoDiarioMedio = stod(campos[8]);

        unidades.push_back(u);
    }
    return unidades;
}

vector<string> tiposUnicos(const vector<Unidade> &unidades) {
    vector<string> tipos;
    for (const Unidade &u : unidades) {
        bool jaExiste = false;
        for (const string &t : tipos) {
            if (t == u.tipoSanguineo) { jaExiste = true; break; }
        }
        if (!jaExiste) tipos.push_back(u.tipoSanguineo);
    }
    return tipos;
}

// Desenha uma barra proporcional ao valor (1 asterisco a cada 0.5 de consumo)
void desenharBarra(double valor) {
    int qtdAsteriscos = (int)(valor / 0.5);
    for (int i = 0; i < qtdAsteriscos; i++) cout << "*";
}

int main() {
    vector<Unidade> unidades = lerDatasetPreparado("Dataset_Preparado.csv");
    vector<string> tipos = tiposUnicos(unidades);

    cout << "=== GRAFICO: CONSUMO DIARIO MEDIO POR TIPO SANGUINEO ===" << endl;
    for (const string &tipo : tipos) {
        double soma = 0.0;
        int n = 0;
        for (const Unidade &u : unidades) {
            if (u.tipoSanguineo == tipo) { soma += u.consumoDiarioMedio; n++; }
        }
        double media = (n > 0) ? soma / n : 0.0;

        cout << setw(4) << tipo << " | ";
        desenharBarra(media);
        cout << " (" << media << ")" << endl;
    }

    cout << "\n=== GRAFICO: UNIDADES POR STATUS DE ESTOQUE ===" << endl;
    int critico = 0, atencao = 0, normal = 0;
    for (const Unidade &u : unidades) {
        if (u.qtdBolsasAtual < u.estoqueMinimoSeguranca) critico++;
        else if (u.qtdBolsasAtual < u.estoqueMinimoSeguranca * 1.2) atencao++;
        else normal++;
    }

    cout << "Critico | "; for (int i = 0; i < critico; i++) cout << "*"; cout << " (" << critico << ")" << endl;
    cout << "Atencao | "; for (int i = 0; i < atencao; i++) cout << "*"; cout << " (" << atencao << ")" << endl;
    cout << "Normal  | "; for (int i = 0; i < normal; i++) cout << "*"; cout << " (" << normal << ")" << endl;

    return 0;
}
