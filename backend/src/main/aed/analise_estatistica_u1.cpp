#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <string>
#include <cmath>
using namespace std;

// ================== ESTRUTURAS ==================

struct Estoque {
    string idUnidade;
    string nomeInstituicao;
    string tipoInstituicao;
    string tipoSanguineo;
    int qtdBolsasAtual;
    int estoqueMinimoSeguranca;
    double consumoDiarioMedio;
    string hemocomponente;
};

struct Requisicao {
    string idRequisicao;
    string idUnidadeSolicitante;
    string idUnidadeFornecedora;
    string tipoSanguineoSolicitado;
    string hemocomponenteSolicitado;
    int quantidadeSolicitada;
    string dataCriacao;
    string dataAtendimento;
    string status;
};

// ================== LEITURA DOS ARQUIVOS ==================

vector<string> separarLinha(const string &linha) {
    vector<string> campos;
    stringstream ss(linha);
    string campo;
    while (getline(ss, campo, ',')) campos.push_back(campo);
    return campos;
}

vector<Estoque> lerEstoque(const string &caminho) {
    vector<Estoque> unidades;
    ifstream arquivo(caminho);
    string linha;
    getline(arquivo, linha); // pula cabecalho

    while (getline(arquivo, linha)) {
        if (linha.empty()) continue;
        vector<string> c = separarLinha(linha);
        if (c.size() < 10) continue;

        Estoque e;
        e.idUnidade = c[0];
        e.nomeInstituicao = c[1];
        e.tipoInstituicao = c[2];
        e.tipoSanguineo = c[5];
        e.qtdBolsasAtual = stoi(c[6]);
        e.estoqueMinimoSeguranca = stoi(c[7]);
        e.consumoDiarioMedio = stod(c[8]);
        e.hemocomponente = c[9];
        unidades.push_back(e);
    }
    return unidades;
}

vector<Requisicao> lerRequisicoes(const string &caminho) {
    vector<Requisicao> requisicoes;
    ifstream arquivo(caminho);
    string linha;
    getline(arquivo, linha);

    while (getline(arquivo, linha)) {
        if (linha.empty()) continue;
        vector<string> c = separarLinha(linha);
        if (c.size() < 9) continue;

        Requisicao r;
        r.idRequisicao = c[0];
        r.idUnidadeSolicitante = c[1];
        r.idUnidadeFornecedora = c[2];
        r.tipoSanguineoSolicitado = c[3];
        r.hemocomponenteSolicitado = c[4];
        r.quantidadeSolicitada = stoi(c[5]);
        r.dataCriacao = c[6];
        r.dataAtendimento = c[7];
        r.status = c[8];
        requisicoes.push_back(r);
    }
    return requisicoes;
}

// ================== FUNCOES AUXILIARES ==================

// Retorna a lista de valores distintos de uma coluna (sem usar hash)
vector<string> valoresUnicos(const vector<string> &valores) {
    vector<string> unicos;
    for (const string &v : valores) {
        bool jaExiste = false;
        for (const string &u : unicos) {
            if (u == v) { jaExiste = true; break; }
        }
        if (!jaExiste) unicos.push_back(v);
    }
    return unicos;
}

// Converte "AAAA-MM-DD HH:MM" em horas totais (aproximacao simples,
// assume meses de 30 dias - suficiente para o dataset sintetico)
double paraHoras(const string &dataHora) {
    int ano, mes, dia, hora, minuto;
    sscanf(dataHora.c_str(), "%d-%d-%d %d:%d", &ano, &mes, &dia, &hora, &minuto);
    double totalHoras = (double)ano * 365 * 24 + mes * 30 * 24 + dia * 24 + hora + minuto / 60.0;
    return totalHoras;
}

void calcularIndicadores(const vector<double> &valores, double &media,
                          double &variancia, double &desvioPadrao, double &cv,
                          double &minimo, double &maximo) {
    int n = valores.size();
    media = variancia = desvioPadrao = cv = 0.0;
    if (n == 0) return;

    minimo = valores[0];
    maximo = valores[0];
    double soma = 0.0;
    for (double v : valores) {
        soma += v;
        if (v < minimo) minimo = v;
        if (v > maximo) maximo = v;
    }
    media = soma / n;

    if (n > 1) {
        double somaDesvios = 0.0;
        for (double v : valores) somaDesvios += (v - media) * (v - media);
        variancia = somaDesvios / (n - 1);
    }
    desvioPadrao = sqrt(variancia);
    if (media != 0.0) cv = (desvioPadrao / media) * 100.0;
}

// ================== MAIN ==================

int main() {
    vector<Estoque> estoque = lerEstoque("Dataset_Sintetico_Malha.csv");
    vector<Requisicao> requisicoes = lerRequisicoes("Dataset_Requisicoes.csv");

    // ---------- 1. ESTOQUE ----------
    cout << "=== 1. ESTOQUE ===" << endl;

    int totalBolsas = 0;
    for (const Estoque &e : estoque) totalBolsas += e.qtdBolsasAtual;
    cout << "Total de bolsas em estoque: " << totalBolsas << endl;

    vector<string> tiposSanguineos;
    for (const Estoque &e : estoque) tiposSanguineos.push_back(e.tipoSanguineo);
    vector<string> tiposUnicos = valoresUnicos(tiposSanguineos);

    cout << "\nDistribuicao por tipo sanguineo:" << endl;
    for (const string &tipo : tiposUnicos) {
        int soma = 0;
        for (const Estoque &e : estoque) if (e.tipoSanguineo == tipo) soma += e.qtdBolsasAtual;
        cout << "  " << tipo << ": " << soma << " bolsas" << endl;
    }

    vector<string> componentes;
    for (const Estoque &e : estoque) componentes.push_back(e.hemocomponente);
    vector<string> componentesUnicos = valoresUnicos(componentes);

    cout << "\nDistribuicao por hemocomponente:" << endl;
    for (const string &comp : componentesUnicos) {
        int soma = 0;
        for (const Estoque &e : estoque) if (e.hemocomponente == comp) soma += e.qtdBolsasAtual;
        cout << "  " << comp << ": " << soma << " bolsas" << endl;
    }

    int totalHospital = 0, totalHemocentro = 0;
    for (const Estoque &e : estoque) {
        if (e.tipoInstituicao == "Hospital") totalHospital += e.qtdBolsasAtual;
        else totalHemocentro += e.qtdBolsasAtual;
    }
    cout << "\nDistribuicao por instituicao:" << endl;
    cout << "  Hospitais: " << totalHospital << " bolsas" << endl;
    cout << "  Hemocentros: " << totalHemocentro << " bolsas" << endl;

    cout << "\nUnidades em estado critico:" << endl;
    for (const Estoque &e : estoque) {
        if (e.qtdBolsasAtual < e.estoqueMinimoSeguranca) {
            cout << "  " << e.idUnidade << " (" << e.tipoSanguineo << "): "
                 << e.qtdBolsasAtual << " / " << e.estoqueMinimoSeguranca << endl;
        }
    }

    // ---------- 2. DEMANDA ----------
    cout << "\n=== 2. DEMANDA ===" << endl;

    vector<string> solicitantes;
    for (const Requisicao &r : requisicoes) solicitantes.push_back(r.idUnidadeSolicitante);
    vector<string> solicitantesUnicos = valoresUnicos(solicitantes);

    cout << "Requisicoes por hospital:" << endl;
    string hospitalMaiorDemanda = "";
    int maiorContagem = 0;
    for (const string &sol : solicitantesUnicos) {
        int contagem = 0;
        for (const Requisicao &r : requisicoes) if (r.idUnidadeSolicitante == sol) contagem++;
        cout << "  " << sol << ": " << contagem << " requisicoes" << endl;
        if (contagem > maiorContagem) { maiorContagem = contagem; hospitalMaiorDemanda = sol; }
    }
    cout << "Hospital com maior demanda: " << hospitalMaiorDemanda
         << " (" << maiorContagem << " requisicoes)" << endl;

    vector<string> componentesSolicitados;
    for (const Requisicao &r : requisicoes) componentesSolicitados.push_back(r.hemocomponenteSolicitado);
    vector<string> componentesSolicitadosUnicos = valoresUnicos(componentesSolicitados);

    cout << "\nRequisicoes por hemocomponente:" << endl;
    for (const string &comp : componentesSolicitadosUnicos) {
        int contagem = 0;
        for (const Requisicao &r : requisicoes) if (r.hemocomponenteSolicitado == comp) contagem++;
        cout << "  " << comp << ": " << contagem << " requisicoes" << endl;
    }

    int totalRequisicoes = requisicoes.size();
    int atendidas = 0;
    for (const Requisicao &r : requisicoes) if (r.status == "Atendida") atendidas++;
    double taxaAtendimento = (totalRequisicoes > 0) ? (double)atendidas / totalRequisicoes * 100.0 : 0.0;
    cout << "\nTaxa de atendimento: " << taxaAtendimento << "% ("
         << atendidas << " de " << totalRequisicoes << ")" << endl;

    // ---------- 3. TEMPOS DE ATENDIMENTO ----------
    cout << "\n=== 3. TEMPOS DE ATENDIMENTO ===" << endl;

    vector<double> tempos;
    for (const Requisicao &r : requisicoes) {
        if (r.status == "Atendida" && !r.dataAtendimento.empty()) {
            double horasCriacao = paraHoras(r.dataCriacao);
            double horasAtendimento = paraHoras(r.dataAtendimento);
            tempos.push_back(horasAtendimento - horasCriacao);
        }
    }

    double media, variancia, desvioPadrao, cv, minimo, maximo;
    calcularIndicadores(tempos, media, variancia, desvioPadrao, cv, minimo, maximo);

    cout << "Tempo medio de atendimento: " << media << " horas" << endl;
    cout << "Desvio padrao: " << desvioPadrao << " horas" << endl;
    cout << "Variancia: " << variancia << endl;
    cout << "Coeficiente de variacao: " << cv << "%" << endl;
    cout << "Tempo minimo: " << minimo << " horas" << endl;
    cout << "Tempo maximo: " << maximo << " horas" << endl;

    return 0;
}
