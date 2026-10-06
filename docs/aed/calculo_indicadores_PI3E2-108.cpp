#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <string>
#include <cmath>
using namespace std;

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
    double diasAteEsgotar;
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
    getline(arquivo, linha); // pula cabecalho

    while (getline(arquivo, linha)) {
        if (linha.empty()) continue;
        vector<string> campos = separarLinha(linha);
        if (campos.size() < 10) continue;

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
        u.diasAteEsgotar = stod(campos[9]);

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

// Calcula media, desvio padrao, variancia e CV de um vetor de valores
void calcularIndicadores(const vector<double> &valores, double &media,
                          double &variancia, double &desvioPadrao, double &cv) {
    int n = valores.size();
    media = 0.0; variancia = 0.0; desvioPadrao = 0.0; cv = 0.0;
    if (n == 0) return;

    double soma = 0.0;
    for (double v : valores) soma += v;
    media = soma / n;

    if (n > 1) {
        double somaDesvios = 0.0;
        for (double v : valores) somaDesvios += (v - media) * (v - media);
        variancia = somaDesvios / (n - 1);
    }

    desvioPadrao = sqrt(variancia);
    if (media != 0.0) cv = (desvioPadrao / media) * 100.0;
}

int main() {
    vector<Unidade> unidades = lerDatasetPreparado("Dataset_Preparado.csv");
    vector<string> tipos = tiposUnicos(unidades);

    cout << "=== INDICADORES DE CONSUMO DIARIO POR TIPO SANGUINEO ===" << endl;
    cout << "Tipo\tMedia\tDesvioPadrao\tVariancia\tCV(%)" << endl;
    for (const string &tipo : tipos) {
        vector<double> consumos;
        for (const Unidade &u : unidades) {
            if (u.tipoSanguineo == tipo) consumos.push_back(u.consumoDiarioMedio);
        }
        double media, variancia, desvioPadrao, cv;
        calcularIndicadores(consumos, media, variancia, desvioPadrao, cv);
        cout << tipo << "\t" << media << "\t" << desvioPadrao << "\t"
             << variancia << "\t" << cv << endl;
    }

    cout << "\n=== INDICADORES DE DIAS ATE ESGOTAR POR TIPO SANGUINEO ===" << endl;
    cout << "Tipo\tMedia\tDesvioPadrao\tVariancia\tCV(%)" << endl;
    for (const string &tipo : tipos) {
        vector<double> dias;
        for (const Unidade &u : unidades) {
            if (u.tipoSanguineo == tipo) dias.push_back(u.diasAteEsgotar);
        }
        double media, variancia, desvioPadrao, cv;
        calcularIndicadores(dias, media, variancia, desvioPadrao, cv);
        cout << tipo << "\t" << media << "\t" << desvioPadrao << "\t"
             << variancia << "\t" << cv << endl;
    }

    cout << "\n=== CONTAGEM DE UNIDADES POR STATUS DE ESTOQUE ===" << endl;
    int critico = 0, atencao = 0, normal = 0;
    for (const Unidade &u : unidades) {
        if (u.qtdBolsasAtual < u.estoqueMinimoSeguranca) critico++;
        else if (u.qtdBolsasAtual < u.estoqueMinimoSeguranca * 1.2) atencao++;
        else normal++;
    }
    cout << "Critico: " << critico << endl;
    cout << "Atencao: " << atencao << endl;
    cout << "Normal: " << normal << endl;

    return 0;
}
