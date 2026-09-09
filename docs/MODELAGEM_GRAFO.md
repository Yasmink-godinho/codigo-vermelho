# Escopo Definido: Modelagem do Grafo para Roteirização Logística
## Projeto Rota Vital - Código Vermelho | US05 - Roteirização Logística

---

## 1. O que é um Nó

### 1.1 Definição

Dentro do grafo da malha logística, um **nó** representa **uma unidade física de saúde cadastrada no sistema**, ou seja, um hospital ou um hemocentro.

Essa definição foi escolhida em vez de alternativas como "um nó por combinação de unidade e tipo sanguíneo", porque o objetivo do Dijkstra, no contexto da US05, é calcular caminho mínimo entre lugares físicos por onde um veículo de transporte de sangue vai passar. O tipo sanguíneo e a quantidade de bolsas em estoque não mudam o "local" que está sendo visitado, eles são características do que existe dentro da unidade, não do próprio ponto no mapa. Se fôssemos criar um nó por combinação, o mesmo hospital apareceria repetido várias vezes no grafo (um nó para cada tipo sanguíneo que ele armazena), o que tornaria o cálculo de rota desnecessariamente confuso e redundante.

### 1.2 Atributos do nó

| Atributo | Tipo | Descrição | Exemplo |
|---|---|---|---|
| `idUnidade` | texto (string) | Identificador único da unidade dentro do sistema | `"H01"`, `"HEMO01"` |
| `nomeInstituicao` | texto (string) | Nome completo da unidade | `"Hospital Municipal Central"` |
| `tipoInstituicao` | texto (string) | Classificação da unidade | `"Hospital"` ou `"Hemocentro"` |
| `latitude` | número decimal | Coordenada geográfica (latitude) | `-8.0578` |
| `longitude` | número decimal | Coordenada geográfica (longitude) | `-34.8829` |

Esses atributos vêm diretamente do cadastro de unidades já definido na etapa de Estatística do projeto (US01/US06), o que garante que o grafo não é uma estrutura isolada, e sim uma extensão dos mesmos dados que alimentam o painel descritivo de estoque.

É importante reforçar que atributos relacionados a estoque (`qtdBolsasAtual`, `estoqueMinimoSeguranca`, `tipoSanguineo`, `consumoDiarioMedio`) não fazem parte da identidade do nó. Eles continuam existindo como dados da unidade, mas são consultados por outras partes do sistema (como o módulo de alertas de estoque crítico), e não pela lógica de roteirização em si. Isso mantém o grafo enxuto e focado apenas no que ele precisa para calcular caminhos.

---

## 2. O que é uma Aresta

### 2.1 Definição

Uma **aresta** representa uma rota de transporte possível entre duas unidades da malha, isto é, a ligação direta que permite que um veículo se desloque de uma unidade até outra.

### 2.2 Direção da aresta

Uma decisão importante nessa etapa foi definir se as arestas seriam direcionadas (a rota de A até B pode ter um custo diferente da rota de B até A, ou até não existir em um dos sentidos) ou não direcionadas (a rota vale igualmente nos dois sentidos).

Optou-se por arestas não direcionadas, pelo seguinte raciocínio: o objetivo do projeto, nesta fase, é simular uma malha rodoviária comum entre unidades de saúde de uma mesma região metropolitana, sem informações específicas sobre mão única, pedágios ou restrições de tráfego em um sentido só. Nesse cenário, faz sentido assumir que, se existe uma rota de transporte entre o Hospital A e o Hemocentro B, essa mesma rota pode ser percorrida no sentido inverso, com o mesmo custo. Caso o projeto evolua futuramente e precise considerar rotas assimétricas (por exemplo, um trecho com transporte fluvial que só funciona em um sentido, ou uma rota aérea de socorro), essa decisão pode ser revista sem exigir uma reestruturação completa do grafo, bastaria passar a registrar duas arestas por ligação, com pesos distintos.

### 2.3 Atributos da aresta

| Atributo | Tipo | Descrição |
|---|---|---|
| `origem` | texto (string) | `idUnidade` do nó de partida |
| `destino` | texto (string) | `idUnidade` do nó de chegada |
| `peso` | número decimal | Custo da rota entre origem e destino |

### 2.4 Definição do peso

O peso de uma aresta representa o custo de deslocamento entre as duas unidades conectadas por ela. No contexto deste projeto, o peso escolhido foi a distância geográfica aproximada, em quilômetros, entre as coordenadas das duas unidades, calculada a partir dos atributos `latitude` e `longitude` já cadastrados para cada nó.

Essa escolha faz sentido porque o objetivo prático da US05 é minimizar o tempo/custo de transporte de bolsas de sangue entre unidades, e, na ausência de dados reais de tráfego, tempo de percurso ou condições de estrada (que fogem do escopo estatístico deste projeto), a distância geográfica é a métrica mais direta e coerente disponível para representar esse custo.

Vale destacar que o cálculo exato da distância (por exemplo, usando a fórmula de Haversine, que considera a curvatura da Terra) é uma etapa de implementação, e não de modelagem. Para os testes com o grafo sintético apresentado a seguir, os pesos foram estimados de forma aproximada, olhando a posição relativa das unidades no mapa, o cálculo automático via fórmula fica reservado para quando o grafo completo (com as dez unidades da malha) for implementado em código.

---

## 3. Grafo Sintético de Teste

### 3.1 Por que usar um grafo sintético

Antes de aplicar o algoritmo de Dijkstra sobre a malha completa (as dez unidades já cadastradas na etapa de Estatística), optou-se por construir um recorte pequeno e controlado da malha, um "grafo sintético", com o objetivo de validar se a lógica do algoritmo está correta. Essa é uma prática comum no desenvolvimento de algoritmos: testar primeiro com um conjunto pequeno de dados, onde é possível calcular o resultado esperado manualmente e comparar com a saída do programa, antes de aplicar a mesma lógica em um conjunto de dados maior.

### 3.2 Nós utilizados

Foram selecionadas seis unidades do dataset já existente do projeto:

| idUnidade | nomeInstituicao | tipoInstituicao |
|---|---|---|
| H01 | Hospital Municipal Central | Hospital |
| H02 | Hospital Santa Clara | Hospital |
| H07 | Hospital Vital Cruz | Hospital |
| HEMO01 | Hemocentro Metropolitano | Hemocentro |
| H06 | Hospital da Zona Oeste | Hospital |
| H04 | Hospital São Lucas | Hospital |

### 3.3 Representação visual do grafo

```
             H02
            /    \
          5.0     6.0
          /          \
       H01            H07
          \            /
          4.0        3.0
            \        /
             HEMO01
             /    \
           2.0    7.0
           /        \
         H06         H04
```

### 3.4 Tabela de arestas e pesos

| Origem | Destino | Peso (km, aproximado) |
|---|---|---|
| H01 | H02 | 5.0 |
| H01 | HEMO01 | 4.0 |
| H02 | H07 | 6.0 |
| HEMO01 | H07 | 3.0 |
| HEMO01 | H06 | 2.0 |
| HEMO01 | H04 | 7.0 |

Esse conjunto foi montado de forma que o Hemocentro Metropolitano (HEMO01) funcione como uma espécie de "ponto central" da malha de teste, o que é coerente com a realidade de um hemocentro, que costuma atuar como referência regional de distribuição.

### 3.5 Simulação manual do Dijkstra sobre o grafo sintético

Para validar se os dados definidos realmente permitem calcular uma rota, foi feita uma simulação manual do algoritmo, calculando o caminho de menor custo entre H01 (origem) e H06 (destino), um caso interessante porque não existe uma aresta direta entre essas duas unidades.

**Passo a passo:**

1. Distância inicial: `H01 = 0`, todos os outros nós = infinito.
2. A partir de H01, os vizinhos são H02 (peso 5.0) e HEMO01 (peso 4.0). Atualiza-se: `H02 = 5.0`, `HEMO01 = 4.0`.
3. O menor valor não visitado é HEMO01 (4.0). Visita-se HEMO01. Seus vizinhos são H07 (4.0 + 3.0 = 7.0), H06 (4.0 + 2.0 = 6.0) e H04 (4.0 + 7.0 = 11.0). Como esses valores são menores que o "infinito" atual, atualiza-se: `H07 = 7.0`, `H06 = 6.0`, `H04 = 11.0`.
4. O menor valor não visitado agora é H02 (5.0). Visita-se H02. Seu vizinho é H07, com distância 5.0 + 6.0 = 11.0, como isso é maior que o valor já registrado para H07 (7.0), não se atualiza.
5. O menor valor não visitado é H06 (6.0), que é justamente o destino procurado.

**Resultado:** a menor distância de H01 até H06 é **6.0 km**, passando pelo caminho **H01, HEMO01, H06**.

Esse resultado bate exatamente com o que se espera olhando o desenho do grafo, o que confirma que os dados modelados (nós, arestas e pesos) são suficientes para o algoritmo funcionar corretamente.

---

## 4. Representação do Grafo em Memória

### 4.1 Estrutura escolhida: Matriz de Adjacência

Entre as formas possíveis de representar um grafo (matriz de adjacência, lista de arestas ou lista de adjacência), foi escolhida a matriz de adjacência, pelos seguintes motivos:

- O grafo do projeto é pequeno (no máximo dez unidades na malha completa), então o uso de memória extra de uma matriz não é um problema relevante.
- A matriz permite, de forma direta, verificar se existe conexão entre dois nós e qual o peso dessa conexão, o que facilita bastante a implementação do Dijkstra.
- É uma estrutura já estudada em Algoritmos e Estrutura de Dados (conceito de matrizes), o que evita introduzir estruturas mais avançadas (como listas encadeadas de adjacência) sem necessidade real para o tamanho do problema.

### 4.2 Convenção adotada

- As linhas e colunas da matriz correspondem aos nós, seguindo a mesma ordem em que estão armazenados no vetor de nós.
- `matriz[i][j] = peso` da aresta entre o nó `i` e o nó `j`, se ela existir.
- `matriz[i][j] = -1` indica que não existe rota direta entre os dois nós (valor "impossível", já que distância nunca é negativa).
- Como a aresta é não direcionada, a matriz é simétrica: `matriz[i][j] = matriz[j][i]`.

### 4.3 Matriz de adjacência do grafo sintético

Ordem dos nós: H01, H02, H07, HEMO01, H06, H04

|        | H01 | H02 | H07 | HEMO01 | H06 | H04 |
|--------|-----|-----|-----|--------|-----|-----|
| H01    | -1  | 5.0 | -1  | 4.0    | -1  | -1  |
| H02    | 5.0 | -1  | 6.0 | -1     | -1  | -1  |
| H07    | -1  | 6.0 | -1  | 3.0    | -1  | -1  |
| HEMO01 | 4.0 | -1  | 3.0 | -1     | 2.0 | 7.0 |
| H06    | -1  | -1  | -1  | 2.0    | -1  | -1  |
| H04    | -1  | -1  | -1  | 7.0    | -1  | -1  |

---

## 5. Estrutura de Dados em C++

A seguir está a definição das estruturas que representam nó, aresta e a matriz de adjacência, em C++.

```cpp
#include <string>
using namespace std;

// Representa uma unidade da malha logistica (hospital ou hemocentro)
struct No {
    string idUnidade;
    string nomeInstituicao;
    string tipoInstituicao; // "Hospital" ou "Hemocentro"
    double latitude;
    double longitude;
};

// Representa uma rota de transporte entre duas unidades
struct Aresta {
    string origem;   // idUnidade do no de partida
    string destino;  // idUnidade do no de chegada
    double peso;     // distancia em km
};

const int TOTAL_NOS = 6;

int main() {
    // vetor de nos do grafo sintetico
    No nos[TOTAL_NOS] = {
        {"H01", "Hospital Municipal Central", "Hospital", -8.0578, -34.8829},
        {"H02", "Hospital Santa Clara", "Hospital", -8.0389, -34.9019},
        {"H07", "Hospital Vital Cruz", "Hospital", -7.9410, -34.8730},
        {"HEMO01", "Hemocentro Metropolitano", "Hemocentro", -8.0476, -34.8770},
        {"H06", "Hospital da Zona Oeste", "Hospital", -8.0219, -34.9622},
        {"H04", "Hospital Sao Lucas", "Hospital", -8.1131, -35.0117}
    };

    // matriz de adjacencia: comeca tudo como "sem conexao" (-1)
    double matrizAdjacencia[TOTAL_NOS][TOTAL_NOS];
    for (int i = 0; i < TOTAL_NOS; i++) {
        for (int j = 0; j < TOTAL_NOS; j++) {
            matrizAdjacencia[i][j] = -1;
        }
    }

    // indices: 0=H01, 1=H02, 2=H07, 3=HEMO01, 4=H06, 5=H04

    // preenche as arestas (nao direcionada, preenche os dois lados)
    matrizAdjacencia[0][1] = 5.0; matrizAdjacencia[1][0] = 5.0; // H01-H02
    matrizAdjacencia[0][3] = 4.0; matrizAdjacencia[3][0] = 4.0; // H01-HEMO01
    matrizAdjacencia[1][2] = 6.0; matrizAdjacencia[2][1] = 6.0; // H02-H07
    matrizAdjacencia[2][3] = 3.0; matrizAdjacencia[3][2] = 3.0; // H07-HEMO01
    matrizAdjacencia[3][4] = 2.0; matrizAdjacencia[4][3] = 2.0; // HEMO01-H06
    matrizAdjacencia[3][5] = 7.0; matrizAdjacencia[5][3] = 7.0; // HEMO01-H04

    // a partir daqui, matrizAdjacencia e nos ja tem tudo que o
    // Dijkstra precisa para calcular a rota entre duas unidades

    return 0;
}
```

Essa estrutura reflete diretamente o que foi definido nas seções anteriores: cada `struct` guarda os atributos de um nó ou de uma aresta, e a matriz organiza as ligações entre eles de forma que o algoritmo de Dijkstra consiga percorrer o grafo com eficiência.

---

## 6. Verificação: os dados definidos são suficientes para o Dijkstra?

| O que o Dijkstra precisa | Está coberto pela modelagem? |
|---|---|
| Lista de todos os nós | Sim, vetor de `No` |
| Vizinhos de cada nó | Sim, linha correspondente na matriz de adjacência |
| Peso de cada conexão | Sim, valor armazenado em `matriz[i][j]` |
| Nó de origem e nó de destino | Não é um atributo do grafo, é informado como parâmetro na hora de calcular a rota |

A simulação manual feita na Seção 3.5 confirma, na prática, que os dados definidos são suficientes: foi possível calcular corretamente o caminho de menor custo entre H01 e H06 usando apenas as informações presentes no vetor de nós e na matriz de adjacência.

---

## 7. Relação com a US05 - Roteirização Logística

A User Story US05 define que o sistema deve calcular rotas entre unidades da malha, utilizando um algoritmo de caminho mínimo. A modelagem apresentada neste documento atende diretamente a esse requisito:

- Os nós representam exatamente os pontos entre os quais a US05 precisa calcular rota (as unidades cadastradas na US01).
- As arestas, com peso baseado em distância geográfica, fornecem ao Dijkstra a métrica de custo necessária para decidir qual caminho é o mais curto.
- A matriz de adjacência organiza essas informações de forma eficiente para a execução do algoritmo.
- O grafo sintético de teste, validado manualmente na Seção 3.5, garante que a lógica funciona corretamente antes de ser aplicada sobre a malha completa de dez unidades.
