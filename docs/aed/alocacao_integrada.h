// U2 - Integracao dos quatro algoritmos.
// Dado um pedido (Requisicao), a CentralAlocacao:
//   1. consulta a MATRIZ ABO/Rh para saber quais tipos podem doar;
//   2. usa o INDICE HASH de cada unidade para achar as listas desses tipos;
//   3. escolhe as bolsas pela ordem FEFO (as que vencem primeiro);
//   4. calcula a ROTA (vizinho mais proximo) pelas unidades que tem as bolsas.
// O pedido e atendido por inteiro ou nao e atendido (nada e retirado do estoque
// se nao houver bolsas suficientes).
//
// Complexidade (U = unidades, C <= 8 tipos compativeis, K <= U*C listas
// encontradas, q = quantidade pedida, k <= q unidades visitadas, v = vencidas):
//   matriz ................ O(1)
//   buscas no hash ........ O(U*C*(1+alfa))
//   descarte de vencidas .. O(v)
//   escolha FEFO .......... O(q*K)   (q rodadas, cada uma olha K cabecas de lista)
//   montar o resultado .... O(q^2)   (inserir ordenado em lista de ate q bolsas)
//   rota .................. O(k^2)
//   total ................. O(U*C + v + q*K + q^2 + k^2)
#ifndef ALOCACAO_INTEGRADA_H
#define ALOCACAO_INTEGRADA_H

#include <string>
#include "compatibilidade_abo_rh.h"
#include "fefo_lista_ordenada.h"
#include "indice_estoque_hash.h"
#include "roteirizacao_vizinho_mais_proximo.h"
using namespace std;

const int MAX_UNIDADES = 20;
const int MAX_LISTAS = MAX_UNIDADES * QTD_TIPOS;

struct UnidadeEstoque {
    Ponto local;
    IndiceEstoque* indice;
};

// Saida de atender(). Contem ListaFefo, que nao pode ser copiada, por isso o
// resultado e passado por referencia (nao devolvido por valor).
struct ResultadoAlocacao {
    bool atendida;
    string motivo;
    int descartadas;          // bolsas vencidas descartadas durante a busca
    ListaFefo bolsas;         // bolsas reservadas, ordenadas por validade
    RotaResultado rota;
};

class CentralAlocacao {
private:
    UnidadeEstoque unidades[MAX_UNIDADES];
    int qtdUnidades;

    int posicaoDaUnidade(string idUnidade) {
        for (int i = 0; i < qtdUnidades; i++) {
            if (unidades[i].local.id == idUnidade) return i;
        }
        return -1;
    }
public:
    CentralAlocacao() { qtdUnidades = 0; }

    ~CentralAlocacao() {
        for (int i = 0; i < qtdUnidades; i++) delete unidades[i].indice;
    }
    CentralAlocacao(const CentralAlocacao&) = delete;
    CentralAlocacao& operator=(const CentralAlocacao&) = delete;

    // Cadastra uma unidade com seu indice hash. false se id repetido ou cheio.
    bool adicionarUnidade(string id, double latitude, double longitude, int capacidadeHash) {
        if (qtdUnidades >= MAX_UNIDADES) return false;
        if (posicaoDaUnidade(id) != -1) return false;
        unidades[qtdUnidades].local = {id, latitude, longitude};
        unidades[qtdUnidades].indice = new IndiceEstoque(capacidadeHash);
        qtdUnidades++;
        return true;
    }

    // Coloca a bolsa no indice da unidade onde ela esta (idUnidadeAtual).
    // Recusa: unidade desconhecida, tipo invalido ou status diferente de
    // "Disponivel".
    bool adicionarBolsa(Bolsa b) {
        int pos = posicaoDaUnidade(b.idUnidadeAtual);
        if (pos == -1) return false;
        if (indiceDoTipo(b.tipoSanguineo) == -1) return false;
        if (b.status != "Disponivel") return false;
        unidades[pos].indice->inserirBolsa(b);
        return true;
    }

    // Quantas bolsas de um tipo a unidade tem (0 se unidade ou tipo nao existem).
    int estoqueDe(string idUnidade, string tipo) {
        int pos = posicaoDaUnidade(idUnidade);
        if (pos == -1) return 0;
        ListaFefo* lista = unidades[pos].indice->buscar(tipo);
        if (lista == nullptr) return 0;
        return lista->tamanho();
    }

    int totalBolsas() {
        int total = 0;
        for (int i = 0; i < qtdUnidades; i++) total += unidades[i].indice->totalBolsas();
        return total;
    }

    // Atende um pedido. "hoje" no formato AAAA-MM-DD.
    // A rota sai de idUnidadeFornecedora, passa pelas unidades que tem as
    // bolsas e termina em idUnidadeSolicitante.
    bool atender(Requisicao pedido, string hoje, ResultadoAlocacao &resultado) {
        resultado.atendida = false;
        resultado.motivo = "";
        resultado.descartadas = 0;
        resultado.rota.qtdPontos = 0;
        resultado.rota.distanciaTotalKm = 0;

        // Validacoes
        if (pedido.quantidadeSolicitada <= 0) {
            resultado.motivo = "quantidade invalida";
            return false;
        }
        if (indiceDoTipo(pedido.tipoSanguineoSolicitado) == -1) {
            resultado.motivo = "tipo sanguineo invalido";
            return false;
        }
        int posSolicitante = posicaoDaUnidade(pedido.idUnidadeSolicitante);
        int posOrigem = posicaoDaUnidade(pedido.idUnidadeFornecedora);
        if (posSolicitante == -1 || posOrigem == -1) {
            resultado.motivo = "unidade desconhecida";
            return false;
        }

        // 1. Matriz: tipos que podem doar para o tipo pedido
        string doadores[QTD_TIPOS];
        int qtdDoadores = doadoresCompativeis(pedido.tipoSanguineoSolicitado, doadores);

        // 2. Hash: lista FEFO de cada (unidade, tipo compativel). A unidade
        // que esta pedindo nao entra como fonte.
        ListaFefo* listas[MAX_LISTAS];
        int qtdListas = 0;
        int disponiveis = 0;
        for (int u = 0; u < qtdUnidades; u++) {
            if (u == posSolicitante) continue;
            for (int t = 0; t < qtdDoadores; t++) {
                ListaFefo* lista = unidades[u].indice->buscar(doadores[t]);
                if (lista == nullptr) continue;
                resultado.descartadas += lista->descartarVencidos(hoje);
                if (lista->vazia()) continue;
                listas[qtdListas] = lista;
                qtdListas++;
                disponiveis += lista->tamanho();
            }
        }

        // Tudo ou nada: se nao ha bolsas suficientes, nao retira nada.
        if (disponiveis < pedido.quantidadeSolicitada) {
            resultado.motivo = "estoque compativel insuficiente: ha " + to_string(disponiveis)
                             + ", pedido " + to_string(pedido.quantidadeSolicitada);
            return false;
        }

        // 3. FEFO entre as listas: a cada rodada, pega a que tem a bolsa
        // de menor validade na frente. Em empate, a primeira lista encontrada.
        NoBolsa* cabeca[MAX_LISTAS];
        int retiradas[MAX_LISTAS];
        for (int i = 0; i < qtdListas; i++) {
            cabeca[i] = listas[i]->primeiro();
            retiradas[i] = 0;
        }
        for (int n = 0; n < pedido.quantidadeSolicitada; n++) {
            int melhor = -1;
            for (int i = 0; i < qtdListas; i++) {
                if (cabeca[i] == nullptr) continue;
                if (melhor == -1 || cabeca[i]->dado.dataValidade < cabeca[melhor]->dado.dataValidade) {
                    melhor = i;
                }
            }
            Bolsa escolhida = cabeca[melhor]->dado;
            escolhida.status = "Reservada";
            resultado.bolsas.inserirOrdenado(escolhida);
            cabeca[melhor] = cabeca[melhor]->proximo;
            retiradas[melhor]++;
        }

        // Retira do estoque as bolsas escolhidas (sao sempre as primeiras de
        // cada lista, porque a escolha andou a partir do inicio).
        for (int i = 0; i < qtdListas; i++) {
            Bolsa descarte;
            for (int r = 0; r < retiradas[i]; r++) listas[i]->removerMaisProxima(descarte);
        }

        // 4. Rota: unidades distintas que fornecem bolsas. A que e a propria
        // origem nao vira parada (as bolsas dela ja saem na partida).
        Ponto paradas[MAX_PARADAS];
        int k = 0;
        NoBolsa* atual = resultado.bolsas.primeiro();
        while (atual != nullptr) {
            int pos = posicaoDaUnidade(atual->dado.idUnidadeAtual);
            bool jaTem = (pos == posOrigem);
            if (!jaTem) {
                for (int i = 0; i < k; i++) {
                    if (paradas[i].id == unidades[pos].local.id) jaTem = true;
                }
            }
            if (!jaTem) {
                paradas[k] = unidades[pos].local;
                k++;
            }
            atual = atual->proximo;
        }
        calcularRota(unidades[posOrigem].local, paradas, k,
                     unidades[posSolicitante].local, resultado.rota);

        resultado.atendida = true;
        resultado.motivo = "ok";
        return true;
    }
};

#endif
