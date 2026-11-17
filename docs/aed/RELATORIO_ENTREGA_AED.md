# 1 CONTEXTO

O Rota Vital é o sistema de gestão e distribuição de bolsas de sangue entre hospitais e hemocentros, desenvolvido como projeto integrador. Este relatório cobre a disciplina de Algoritmos e Estruturas de Dados (AED) nas duas unidades: a Unidade 1 (lista, fila e pilha) e a Unidade 2 (busca, ordenação e hash, aplicadas a rota, FEFO, índice de estoque e compatibilidade ABO/Rh).

A regra geral da entrega é a mesma nas duas unidades: o raciocínio é escrito primeiro em C++, com memória e ponteiros manipulados à mão, e depois reimplementado em Java, com a mesma lógica, para ser consumido pela aplicação POO. O relatório documenta a equivalência entre as duas versões, estrutura por estrutura e algoritmo por algoritmo, apontando o código real de cada uma.

Todos os dados usados nos exemplos e nos testes são sintéticos. As coordenadas das unidades são as mesmas do dataset do projeto, em Recife.

As estruturas e algoritmos desta pasta são códigos independentes, compilados e executados com g++ e javac. Eles ainda não fazem parte do build Maven do backend em Spring Boot, que compila apenas `src/main/java`. A seção 12 explica o ponto de ligação previsto.

# 2 O QUE FOI PEDIDO

## 2.1 Unidade 1

- Lista (estoque), fila (requisições) e pilha (histórico) com alocação manual de memória e ponteiros explícitos.
- Reimplementação em Java pronta para ser consumida pela aplicação POO, com um parágrafo por estrutura explicando por que a versão Java corresponde à lógica C++.
- Fora do escopo da Unidade 1: roteirização, FEFO, hash e compatibilidade ABO/Rh.

## 2.2 Unidade 2

- Rota (vizinho mais próximo), priorização FEFO (inserção ordenada), índice de estoque por hash e compatibilidade ABO/Rh por matriz.
- Os quatro algoritmos reimplementados em Java e integrados entre si: dado um pedido, o sistema aloca a bolsa compatível, priorizada pela validade, e calcula a rota.
- Complexidade de cada algoritmo declarada e justificada a partir da implementação real.
- Casos de teste de compatibilidade e de incompatibilidade.

# 3 ARQUIVOS ENTREGUES

Todos os arquivos ficam na pasta `docs/aed`.

| Arquivo | Linguagem | Conteúdo |
|---|---|---|
| estrutura_dados_PI3E2-92.h | C++ | Structs de domínio: Bolsa, Requisicao, Movimentacao, EstoqueUnidade |
| estrutura_base_PI3E2-93.h | C++ | Lista, fila e pilha (nó e ponteiro à mão) |
| estrutura_base_PI3E2-93.cpp | C++ | Demonstração da Unidade 1 |
| testes_estruturas.cpp | C++ | 36 testes da Unidade 1 |
| conexao_poo_PI3E2-94.java | Java | Domínio, nó genérico, lista, fila e pilha em Java |
| TestesEstruturas.java | Java | 36 testes da Unidade 1 |
| compatibilidade_abo_rh.h | C++ | Matriz 8x8 de compatibilidade ABO/Rh |
| fefo_lista_ordenada.h | C++ | Lista encadeada ordenada pela validade |
| indice_estoque_hash.h | C++ | Índice de estoque por tabela hash |
| roteirizacao_vizinho_mais_proximo.h | C++ | Rota por vizinho mais próximo |
| alocacao_integrada.h | C++ | Pedido completo: matriz, hash, FEFO e rota |
| demo_u2.cpp | C++ | Demonstração da Unidade 2 |
| testes_u2.cpp | C++ | 97 testes da Unidade 2 |
| integracao_poo_u2.java | Java | Os quatro algoritmos e a alocação integrada em Java |
| TestesU2.java | Java | 97 testes da Unidade 2 |
| verificar_tudo.sh | Shell | Compila e executa tudo nas duas linguagens |

As structs e as classes ficam definidas uma única vez, em arquivos `.h`. A demonstração e os testes usam `#include`, então não existe cópia de código entre arquivos.

# 4 UNIDADE 1: LISTA, FILA E PILHA

## 4.1 Modelagem do domínio

| Conceito do domínio | Estrutura | Justificativa |
|---|---|---|
| Bolsas em estoque de uma unidade | Lista encadeada (ListaBolsas) | O estoque cresce e diminui em qualquer posição: uma bolsa pode ser retirada do meio. A lista permite inserir e remover sem deslocar os outros elementos. |
| Requisições pendentes | Fila (FilaRequisicoes) | Os pedidos são atendidos na ordem de chegada (FIFO). Entram pelo fim e saem pelo início. |
| Histórico de movimentações de uma bolsa | Pilha (PilhaMovimentacoes) | O evento mais recente é o mais consultado (LIFO). Empilhar e desempilhar acontecem sempre pelo topo. |

As structs de domínio são Bolsa (id, tipo sanguíneo, datas de coleta e validade, unidade atual, status), Requisicao (id, unidade solicitante, unidade fornecedora, tipo, quantidade, data, status) e Movimentacao (id da bolsa, tipo de evento, data).

## 4.2 Estruturas em C++

Cada estrutura é uma classe com um nó (`struct NoBolsa`, `NoRequisicao`, `NoMovimentacao`) que guarda o dado e um ponteiro `proximo`. Os nós são criados com `new` e liberados com `delete`.

| Estrutura | Inserir | Remover | Consultar |
|---|---|---|---|
| ListaBolsas | `inserir` (no início) | `remover(id)` | `consultar(id)`, `obterNaPosicao(pos)` |
| FilaRequisicoes | `enfileirar` (no fim) | `desenfileirar` (do início) | `consultarProxima` |
| PilhaMovimentacoes | `empilhar` (no topo) | `desempilhar` (do topo) | `consultarTopo` |

Casos de borda tratados: remoção na cabeça, no meio e no fim da lista; remoção de id inexistente; fila que esvazia (o ponteiro `fim` volta a `nullptr`); pilha vazia (devolve `false`, não quebra o programa).

## 4.3 Reimplementação em Java

A versão Java não usa nenhuma classe de `java.util`. O nó é a classe genérica `No<T>`, com o campo `proximo`, e cada estrutura guarda as referências `inicio`, `fim` ou `topo` por conta própria. Os atributos das classes de domínio são privados, com getters.

## 4.4 Por que o Java corresponde ao C++, estrutura por estrutura

**Lista (ListaBolsas).** No C++, `inserir` cria um `NoBolsa` com `new`, aponta o `proximo` do novo nó para o `inicio` atual e passa o `inicio` para o novo nó. O Java faz os mesmos três passos: `new No<>(nova)`, `novo.proximo = inicio`, `inicio = novo`. Por isso a mesma sequência de inserções (B001 e depois B002) deixa a lista na mesma ordem, B002 e B001, nas duas linguagens. O `remover` usa os dois ponteiros `atual` e `anterior` nas duas versões: se `anterior` é nulo, o início da lista avança (remoção na cabeça); senão, `anterior.proximo` pula o nó removido (meio e fim). A única diferença é a linha `delete atual` do C++, que no Java não existe porque o coletor de lixo recolhe o nó quando a última referência some.

C++:

```cpp
NoBolsa* novo = new NoBolsa();
novo->dado = nova;
novo->proximo = inicio;
inicio = novo;
```

Java:

```java
No<Bolsa> novo = new No<>(nova);
novo.proximo = inicio;
inicio = novo;
```

**Fila (FilaRequisicoes).** As duas versões mantêm `inicio` e `fim`. `enfileirar` liga o novo nó depois de `fim` e atualiza `fim`; se a fila estava vazia, `inicio` e `fim` passam a apontar para o mesmo nó. `desenfileirar` avança `inicio` e, se a fila esvaziou, devolve `fim` a nulo. Esse último ponto é o caso de borda que costuma falhar: sem ele, o `fim` ficaria apontando para um nó liberado. Nas duas linguagens a fila vazia não lança exceção. O C++ devolve `false` e o Java devolve `null`.

C++:

```cpp
if (inicio == nullptr) fim = nullptr;
delete temp;
```

Java:

```java
if (inicio == null) fim = null;
```

**Pilha (PilhaMovimentacoes).** Empilhar e desempilhar mexem apenas no `topo`. `empilhar` aponta o `proximo` do novo nó para o topo antigo; `desempilhar` avança o topo. O comportamento com a pilha vazia é o mesmo nas duas versões (nenhuma exceção): `false` em C++ e `null` em Java.

## 4.5 O que muda por causa da linguagem

| Ponto | C++ | Java |
|---|---|---|
| Nó | `struct` com ponteiro `proximo` | classe `No<T>` com referência `proximo` |
| Criar nó | `new NoBolsa()` | `new No<>(dado)` |
| Liberar nó | `delete` em cada remoção e no destrutor | coletor de lixo |
| Destrutor e `liberar()` | `~ListaBolsas() { liberar(); }` | `liberar()` solta as referências |
| Copiar a estrutura | proibido (`= delete`) | não se aplica: copiar a variável copia a referência |
| Retorno de falha | `false` e parâmetro de saída | `null` ou `false` |

## 4.6 O que é igual nas duas versões

- Posição da inserção na lista: início, nas duas linguagens.
- Fila: `fim` volta a nulo quando a fila esvazia.
- Pilha vazia: nenhuma exceção.
- Nenhuma coleção pronta (`LinkedList`, `Queue`, `ArrayDeque`) no Java.
- Os programas de demonstração imprimem as mesmas linhas, o que foi conferido com o comando `diff`.

# 5 UNIDADE 2: OS QUATRO ALGORITMOS

## 5.1 Compatibilidade ABO/Rh por matriz

**Código C++:** `compatibilidade_abo_rh.h`. **Código Java:** classe `CompatibilidadeAboRh` em `integracao_poo_u2.java`.

A compatibilidade é uma matriz 8x8. A linha é o tipo do doador, a coluna é o tipo do receptor, e 1 indica que a doação é compatível. A ordem dos tipos é O-, O+, A-, A+, B-, B+, AB-, AB+.

| Doador | Receptores que podem receber |
|---|---|
| O- | todos os 8 tipos |
| O+ | O+, A+, B+, AB+ |
| A- | A-, A+, AB-, AB+ |
| A+ | A+, AB+ |
| B- | B-, B+, AB-, AB+ |
| B+ | B+, AB+ |
| AB- | AB-, AB+ |
| AB+ | AB+ |

São 27 pares compatíveis em 64. A mesma tabela está documentada em `docs/poo/MATRIZ_COMPATIBILIDADE_ABO_RH.md` e é a regra usada pela classe `CompatibilidadeSanguinea` do backend.

C++:

```cpp
const int MATRIZ[QTD_TIPOS][QTD_TIPOS] = {
    /* doador O-  */ {1, 1, 1, 1, 1, 1, 1, 1},
    /* doador O+  */ {0, 1, 0, 1, 0, 1, 0, 1},
    ...
};
bool compativel(string doador, string receptor) {
    int d = indiceDoTipo(doador);
    int r = indiceDoTipo(receptor);
    if (d == -1 || r == -1) return false;
    return MATRIZ[d][r] == 1;
}
```

Java:

```java
static final int[][] MATRIZ = {
    {1, 1, 1, 1, 1, 1, 1, 1},
    {0, 1, 0, 1, 0, 1, 0, 1},
    ...
};
static boolean compativel(String doador, String receptor) {
    int d = indiceDoTipo(doador);
    int r = indiceDoTipo(receptor);
    if (d == -1 || r == -1) return false;
    return MATRIZ[d][r] == 1;
}
```

**Por que o Java corresponde ao C++.** A tabela de 64 valores é a mesma, na mesma ordem, e `compativel` faz as mesmas três coisas: acha o índice do doador, acha o índice do receptor e lê a célula. Tipo inválido devolve `false` nas duas versões. A única mudança de forma é `doadoresCompativeis`: o C++ preenche um vetor recebido por parâmetro e devolve a quantidade, e o Java devolve um vetor do tamanho certo.

**Complexidade.** `indiceDoTipo` percorre no máximo 8 nomes, então é O(1) (o tamanho da tabela é fixo). A consulta à célula é um acesso direto, O(1). `doadoresCompativeis` percorre uma coluna de 8 linhas, O(1). A regra de compatibilidade não é calculada na hora: ela está pronta na tabela.

**Casos de teste.** Compatibilidade: O- doa para os 8 tipos; AB+ recebe de todos; todo tipo é compatível com ele mesmo; A- doa para A+. Incompatibilidade: A+ não doa para A- (Rh); O+ não doa para O-; A+ e B+ são incompatíveis nos dois sentidos (ABO); AB+ doa somente para AB+; tipo inválido (`C+`, vazio, `o-`) devolve `false`. Um teste extra compara a matriz com a regra de antígenos nos 64 pares (doa quem não tem antígeno que o receptor não tem), o que confere a tabela por um caminho independente.

## 5.2 FEFO (lista encadeada ordenada pela validade)

**Código C++:** `fefo_lista_ordenada.h` (classe `ListaFefo`). **Código Java:** classe `ListaFefo` em `integracao_poo_u2.java`.

FEFO (First Expired, First Out) prioriza a bolsa que vence primeiro. A lista é mantida ordenada pela data de validade em toda inserção, então a próxima bolsa a vencer está sempre no primeiro nó. O nó é o mesmo da Unidade 1 (`NoBolsa` em C++, `No<Bolsa>` em Java).

C++:

```cpp
while (atual != nullptr && atual->dado.dataValidade <= nova.dataValidade) {
    anterior = atual;
    atual = atual->proximo;
}
novo->proximo = atual;
if (anterior == nullptr) inicio = novo;
else anterior->proximo = novo;
```

Java:

```java
while (atual != null && atual.dado.getDataValidade().compareTo(nova.getDataValidade()) <= 0) {
    anterior = atual;
    atual = atual.proximo;
}
novo.proximo = atual;
if (anterior == null) inicio = novo;
else anterior.proximo = novo;
```

**Por que o Java corresponde ao C++.** O laço anda com os ponteiros `anterior` e `atual` até o primeiro nó com validade maior que a da bolsa nova e liga o nó novo entre os dois. É a mesma lógica de remoção da lista da Unidade 1, usada ao contrário. As datas estão no formato AAAA-MM-DD, então comparar as strings equivale a comparar as datas: o operador `<=` do C++ e o `compareTo(...) <= 0` do Java dão o mesmo resultado. O sinal `<=` faz a bolsa nova ficar depois das que têm a mesma validade, o que preserva a ordem de chegada em caso de empate.

**Operações.** `inserirOrdenado`, `consultarMaisProxima`, `removerMaisProxima`, `remover(id)` e `descartarVencidos(hoje)`. Esta última remove do início as bolsas com validade anterior a hoje e para na primeira que ainda está válida. Uma bolsa que vence hoje não é descartada.

**Complexidade.** Seja n o número de bolsas na lista e v o número de vencidas.

- `inserirOrdenado`: O(n) no pior caso, porque o laço pode passar por todos os nós (bolsa com a validade mais distante). No melhor caso (validade mais próxima) é O(1).
- `consultarMaisProxima` e `removerMaisProxima`: O(1), porque só mexem no primeiro nó.
- `descartarVencidos`: O(v), porque a lista é ordenada e as vencidas estão todas no início; o laço para na primeira bolsa válida.
- `remover(id)`: O(n), igual à lista da Unidade 1.

## 5.3 Índice de estoque por hash

**Código C++:** `indice_estoque_hash.h` (classe `IndiceEstoque`). **Código Java:** classe `IndiceEstoque` e `NoIndice` em `integracao_poo_u2.java`.

Cada unidade tem um índice que associa o tipo sanguíneo à lista FEFO das bolsas daquele tipo. É uma tabela hash com encadeamento separado: a tabela é um vetor de ponteiros, e cada posição guarda uma lista encadeada de entradas (`NoIndice`), que resolve as colisões. A capacidade é um parâmetro do construtor.

A função hash é `h = (h * 31 + caractere) % capacidade`, repetida para cada caractere do tipo. Para `"O+"` com capacidade 5: `'O'` vale 79, então h = 79 % 5 = 4; depois `'+'` vale 43, então h = (4 * 31 + 43) % 5 = 167 % 5 = 2. O teste `funcaoHash("O+") com capacidade 5 vale 2` confere esse valor nas duas linguagens.

C++:

```cpp
ListaFefo* buscar(string tipo) {
    NoIndice* atual = tabela[funcaoHash(tipo)];
    while (atual != nullptr) {
        if (atual->tipo == tipo) return atual->lista;
        atual = atual->proximo;
    }
    return nullptr;
}
```

Java:

```java
public ListaFefo buscar(String tipo) {
    NoIndice atual = tabela[funcaoHash(tipo)];
    while (atual != null) {
        if (atual.tipo.equals(tipo)) return atual.lista;
        atual = atual.proximo;
    }
    return null;
}
```

**Por que o Java corresponde ao C++.** O vetor de ponteiros `NoIndice**` do C++ vira o vetor de referências `NoIndice[]` do Java. A função hash é a mesma conta com inteiros, e a busca percorre a mesma cadeia. A inserção, quando o tipo ainda não existe, cria a entrada no início da cadeia, nas duas versões. No C++ o destrutor faz `delete` das listas e dos nós de cada cadeia e `delete[]` da tabela; no Java o coletor faz esse trabalho.

**Complexidade.** Seja n o número de tipos guardados, M a capacidade e alfa = n / M o fator de carga.

- `buscar` e `inserirBolsa` (a parte da tabela): O(1 + alfa) em média. O cálculo do hash percorre os 2 ou 3 caracteres do tipo (tamanho constante) e a cadeia tem alfa entradas em média.
- Pior caso: O(n), quando todos os tipos caem na mesma posição. O teste com capacidade 1 força esse caso: os 8 tipos formam uma cadeia de 8 e continuam sendo encontrados.
- Como só existem 8 tipos sanguíneos, n é no máximo 8, então a cadeia é curta mesmo no pior caso.
- A inserção da bolsa na lista do tipo custa mais O(n) da `ListaFefo` (seção 5.2).

## 5.4 Roteirização por vizinho mais próximo

**Código C++:** `roteirizacao_vizinho_mais_proximo.h`. **Código Java:** classes `Roteirizacao`, `Ponto` e `RotaResultado` em `integracao_poo_u2.java`.

A rota começa na unidade de origem, vai sempre para a parada ainda não visitada que está mais perto da posição atual e, no fim, segue para o destino. A distância entre dois pontos é calculada em linha reta sobre a esfera (fórmula de Haversine, raio da Terra de 6371 km). Esta é uma heurística gulosa: ela produz um caminho razoável, mas não garante o menor caminho possível, e a distância não segue as ruas.

C++:

```cpp
for (int rodada = 0; rodada < k; rodada++) {
    int melhor = -1;
    double menorDistancia = 0;
    for (int i = 0; i < k; i++) {
        if (visitada[i]) continue;
        double d = distanciaKm(atual, paradas[i]);
        if (melhor == -1 || d < menorDistancia) {
            melhor = i;
            menorDistancia = d;
        }
    }
    visitada[melhor] = true;
    ...
}
```

Java:

```java
for (int rodada = 0; rodada < k; rodada++) {
    int melhor = -1;
    double menorDistancia = 0;
    for (int i = 0; i < k; i++) {
        if (visitada[i]) continue;
        double d = distanciaKm(atual, paradas[i]);
        if (melhor == -1 || d < menorDistancia) {
            melhor = i;
            menorDistancia = d;
        }
    }
    visitada[melhor] = true;
    ...
}
```

**Por que o Java corresponde ao C++.** Os dois laços são idênticos: a cada rodada, procuram entre as paradas não visitadas a de menor distância, marcam como visitada, somam o trecho e passam a posição atual para ela. Em empate de distância, vence a primeira parada do vetor (o teste usa `<` estrito nas duas versões). A diferença é de forma: o C++ preenche um `RotaResultado` recebido por parâmetro e devolve `bool`, e o Java devolve o objeto, ou `null` quando o número de paradas é inválido (negativo ou acima de 20).

**Complexidade.** Seja k o número de paradas.

- O laço externo roda k vezes e o interno percorre até k paradas, cada uma com um cálculo de Haversine de custo constante. Total: O(k^2).
- O vetor `visitada` e o resultado ocupam O(k) de memória.
- Para os tamanhos desta entrega (no máximo 20 paradas) isso é desprezível.

## 5.5 Integração dos quatro algoritmos

**Código C++:** `alocacao_integrada.h` (classe `CentralAlocacao`). **Código Java:** classe `CentralAlocacao` em `integracao_poo_u2.java`.

A `CentralAlocacao` guarda as unidades (cada uma com suas coordenadas e seu índice hash) e atende um pedido (`Requisicao`) em quatro passos:

1. **Matriz.** Consulta `doadoresCompativeis` para o tipo pedido e obtém os tipos que podem doar.
2. **Hash.** Para cada unidade (menos a que está pedindo) e cada tipo compatível, busca a lista FEFO no índice da unidade. As bolsas vencidas dessas listas são descartadas.
3. **FEFO.** Se o total de bolsas compatíveis é menor que o pedido, o pedido não é atendido e nada sai do estoque (tudo ou nada). Senão, a cada rodada escolhe a lista cuja primeira bolsa vence mais cedo, até completar a quantidade. A escolha atravessa tipos e unidades. As bolsas escolhidas saem do estoque e ficam com o status `Reservada`.
4. **Rota.** Junta as unidades distintas que fornecem bolsas (a própria origem não vira parada) e calcula a rota por vizinho mais próximo. A rota sai de `idUnidadeFornecedora` e termina em `idUnidadeSolicitante`.

Exemplo da demonstração (hoje é 2026-11-11, pedido R010 de 3 bolsas B- feito por H03, com saída em HEMO01):

```
Pedido R010: 3 bolsa(s) B- para H03
  Atendido: sim (ok)
  Vencidas descartadas: 1
  Bolsa B303 (O-, vence 2026-11-13) de HEMO03
  Bolsa B202 (B-, vence 2026-11-15) de HEMO02
  Bolsa B601 (B-, vence 2026-11-16) de H06
  Rota: HEMO01 -> HEMO03 -> HEMO02 -> H06 -> H03
  Distancia total: 30.77 km
```

O receptor B- aceita O- e B-. A bolsa B104 (O-, vencida em 2026-11-05) foi descartada. A bolsa B303 (O-) vence antes das bolsas B- e por isso é escolhida primeiro: o FEFO ordena por validade, não por tipo. As bolsas B101 (O-, vence 2026-11-20) e B301 (B-, vence 2026-11-22) ficam no estoque.

**Por que o Java corresponde ao C++.** O Java segue os mesmos quatro passos na mesma ordem e com as mesmas estruturas: os mesmos laços sobre unidades e tipos, o mesmo vetor de listas, o mesmo vetor de "cabeças" que avança a cada escolha e o mesmo contador `retiradas` por lista. As diferenças são de forma. O C++ devolve o resultado por parâmetro (`ResultadoAlocacao &resultado`) porque `ListaFefo` não pode ser copiada; o Java devolve o objeto. O C++ copia a bolsa e troca o status para `Reservada`; o Java cria uma nova `Bolsa` com o status `Reservada`, porque a classe não tem como alterar a data de validade. A demonstração dos dois imprime exatamente as mesmas linhas.

**Complexidade.** U é o número de unidades, C (no máximo 8) o número de tipos compatíveis, K (no máximo U x C) o número de listas encontradas, q a quantidade pedida, k (no máximo 20) o número de unidades visitadas e v o número de bolsas vencidas.

| Passo | Complexidade | Justificativa no código |
|---|---|---|
| Matriz | O(1) | `doadoresCompativeis` percorre uma coluna de 8 linhas |
| Buscas no hash | O(U x C x (1 + alfa)) | um `buscar` por par unidade e tipo |
| Descarte de vencidas | O(v) | `descartarVencidos` só mexe no início de cada lista |
| Escolha FEFO | O(q x K) | q rodadas, cada uma compara as K primeiras bolsas |
| Retirada do estoque | O(q) | `removerMaisProxima` é O(1) e roda q vezes |
| Montar o resultado | O(q^2) | q inserções ordenadas em uma lista de até q bolsas |
| Rota | O(k^2) | seção 5.4 |
| **Total** | **O(U x C + v + q x K + q^2 + k^2)** | soma dos passos |

## 5.6 Casos de teste da integração

- Pedido atendido: todas as bolsas são compatíveis com o tipo pedido, estão em ordem de validade e ficam `Reservada`.
- FEFO entre tipos e unidades: o exemplo acima escolhe B303, B202 e B601.
- Incompatibilidade: receptor B- com estoque só de A+, AB+ e O+ não é atendido. Receptor O- com estoque sem O- não é atendido. Receptor AB+ aceita A+, AB+ e O+.
- Tudo ou nada: pedido maior que o estoque não retira nenhuma bolsa.
- Vencidas: estoque só com bolsas vencidas não atende e as bolsas saem do estoque.
- Unidade solicitante não é fonte das próprias bolsas.
- Empate de validade: vence a lista da primeira unidade cadastrada.
- A mesma bolsa não atende dois pedidos.
- Rota: sai da fornecedora, passa pelas unidades das bolsas e termina no solicitante; bolsas da própria origem não criam parada.
- Entradas inválidas: tipo inexistente, quantidade zero ou negativa, unidade desconhecida, unidade repetida, bolsa com tipo inválido ou que não está `Disponivel`.

# 6 RESUMO DA COMPLEXIDADE

| Algoritmo | Operação | Complexidade | De onde vem |
|---|---|---|---|
| Matriz ABO/Rh | `compativel` | O(1) | busca em 8 nomes fixos e acesso a uma célula |
| FEFO | `inserirOrdenado` | O(n) | laço até a posição certa |
| FEFO | consultar e remover a mais próxima | O(1) | primeiro nó da lista |
| FEFO | `descartarVencidos` | O(v) | laço só enquanto a primeira está vencida |
| Hash | `buscar` e `inserirBolsa` | O(1 + alfa) médio, O(n) pior | cadeia com alfa entradas em média |
| Rota | `calcularRota` | O(k^2) | k rodadas, cada uma olha até k paradas |
| Alocação | `atender` | O(U x C + v + q x K + q^2 + k^2) | soma dos passos da seção 5.5 |
| Lista, fila e pilha (U1) | inserir | O(1) | mexe só no início, no fim ou no topo |
| Lista (U1) | remover e consultar por id | O(n) | percorre os nós |

# 7 GERENCIAMENTO DE MEMÓRIA EM C++

Cada `new` tem um `delete` correspondente. Remover, desenfileirar, desempilhar e descartar fazem `delete` do nó retirado. Para os nós que ainda estão nas estruturas quando o objeto sai de escopo, cada classe tem um destrutor que chama `liberar()`. O índice hash também libera as listas FEFO e o vetor da tabela (`delete` e `delete[]`), e a central de alocação libera o índice de cada unidade.

As classes não podem ser copiadas (construtor de cópia e atribuição apagados com `= delete`). Uma cópia duplicaria apenas os ponteiros, e o `delete` rodaria duas vezes sobre os mesmos nós.

O enunciado cita `malloc` e `free`. Foi usado `new` e `delete` porque os nós guardam objetos `string`, e o `malloc` não chama o construtor da string, enquanto o `new` chama. Usar `malloc` com esses nós seria comportamento indefinido.

Verificação com o valgrind (`--leak-check=full`):

| Programa | Alocações | Liberações | Erros |
|---|---|---|---|
| estrutura_base_PI3E2-93 (demo U1) | 8 | 8 | 0 |
| testes_estruturas (testes U1) | 50 | 50 | 0 |
| demo_u2 (demo U2) | 79 | 79 | 0 |
| testes_u2 (testes U2) | 307 | 307 | 0 |

Nos quatro programas o valgrind informou que todos os blocos de memória foram liberados e que não há erros.

# 8 TESTES

Os testes ficam em arquivos separados das demonstrações. Cada teste imprime PASSOU ou FALHOU, e no final é exibido o total. Não foi usada biblioteca de teste: a função `verificar` é escrita à mão nas duas linguagens. Os arquivos de teste em C++ não têm cópia das classes, porque incluem os headers.

| Conjunto | C++ | Java |
|---|---|---|
| Unidade 1 (lista, fila, pilha) | 36 de 36 | 36 de 36 |
| Unidade 2 (matriz, FEFO, hash, rota, integração) | 97 de 97 | 97 de 97 |

Os testes de cada unidade têm a mesma ordem e os mesmos nomes nas duas linguagens (na Unidade 1 muda apenas a palavra do retorno de falha, `false` em C++ e `null` em Java), e a saída dos executáveis é igual (conferida com `diff`). Os 97 testes da Unidade 2 se dividem em 18 de matriz, 18 de FEFO, 13 de hash, 11 de rota e 37 de integração.

Para conferir que os testes detectam erros, foram feitas alterações propositais no código das duas linguagens e os testes foram executados de novo:

- uma célula errada na matriz (O+ doando para A-): 3 testes falham nas duas linguagens;
- `<` no lugar de `<=` no FEFO (empate de validade): 1 teste falha nas duas;
- descartar bolsa que vence hoje: 3 testes falham nas duas;
- usar a unidade solicitante como fonte: 1 teste falha nas duas;
- inverter o critério FEFO na alocação: 7 testes falham nas duas;
- remover a verificação de tudo ou nada: o teste de pedido maior que o estoque aborta a execução.

# 9 COMO EXECUTAR

Pelo script, que compila e executa tudo, compara as demonstrações e roda o valgrind quando ele existe:

```
cd docs/aed
bash verificar_tudo.sh
```

Manualmente, dentro de `docs/aed`:

```
g++ -std=c++17 testes_estruturas.cpp -o testes_estruturas && ./testes_estruturas
g++ -std=c++17 testes_u2.cpp -o testes_u2 && ./testes_u2
g++ -std=c++17 estrutura_base_PI3E2-93.cpp -o demo_u1 && ./demo_u1
g++ -std=c++17 demo_u2.cpp -o demo_u2 && ./demo_u2

javac conexao_poo_PI3E2-94.java integracao_poo_u2.java TestesEstruturas.java TestesU2.java
java TestesEstruturas
java TestesU2
java TesteModeloDominio
java DemonstracaoU2
```

O compilador Java mostra avisos sobre "auxiliary class" porque as classes de domínio ficam em `conexao_poo_PI3E2-94.java` e são usadas pelo outro arquivo. Os avisos não impedem a compilação, desde que os arquivos sejam compilados juntos, como acima.

# 10 AJUSTES EM RELAÇÃO À VERSÃO ANTERIOR

Esta versão incorpora a correção recebida na Unidade 1:

| Ponto da correção | O que foi feito |
|---|---|
| Vazamento de memória (nenhuma classe tinha destrutor) | Destrutor e `liberar()` nas três classes; valgrind sem vazamentos |
| Classes copiadas em vários arquivos | Structs e classes em arquivos `.h`; demonstração e testes usam `#include` |
| Java usava `LinkedList`, `Queue` e `ArrayDeque` | Reescrito com `No<T>` e referências, sem classe de `java.util` |
| Lista inseria no início em C++ e no fim em Java | Os dois inserem no início; a ordem é a mesma |
| Pilha vazia lançava exceção em Java | Os dois devolvem valor de falha (`false` e `null`), sem exceção |
| Relatório afirmava que o mecanismo interno era o mesmo | Equivalência agora é de algoritmo, comparada passo a passo (seção 4.4) |
| Relatório citava pasta do backend que não existe mais e consumo pelo Spring | Relatório e README descrevem a pasta `docs/aed` e não afirmam integração com o backend |
| Versão entregue diferente da versão no GitHub | A pasta `docs/aed` do repositório contém os mesmos arquivos deste relatório |

Arquivos antigos que foram substituídos: `estrutura_dados_PI3E2-92.cpp` (agora `.h`), `testes_estruturas_base.cpp` e `TestesEstruturasAED.java` (agora `testes_estruturas.cpp` e `TestesEstruturas.java`) e `TRADUCAO_COMPATIBILIDADE_JAVA.md` (substituído por este relatório).

# 11 LIMITAÇÕES CONHECIDAS

- A rota usa distância em linha reta (Haversine), não a distância pelas ruas. O vizinho mais próximo é uma heurística e pode não achar o menor caminho.
- O FEFO escolhe pela validade, sem preferir o tipo idêntico ao do paciente. Um pedido de A+ pode receber uma bolsa O- que vence antes de uma bolsa A+. Em uso clínico, seria preciso uma regra para poupar o O-.
- A unidade que faz o pedido nunca é fonte, e o campo `idUnidadeFornecedora` do pedido é usado como ponto de partida da rota, não como restrição da origem das bolsas.
- Há limites fixos de 20 unidades e 20 paradas, para manter o código simples.
- As bolsas vencidas encontradas durante a busca são descartadas mesmo quando o pedido acaba não sendo atendido.
- O índice hash tem no máximo 8 chaves (os tipos sanguíneos). A estrutura funciona para qualquer string, mas o ganho do hash sobre uma busca linear em 8 itens é pequeno neste domínio.
- O código Java desta pasta não é compilado pelo Maven e não está ligado a nenhum serviço Spring. As classes de domínio (Bolsa, Requisicao) são próprias desta entrega e não são as entidades do backend.

# 12 INTEGRAÇÃO COM A APLICAÇÃO POO

A classe `CentralAlocacao` não tem dependência fixa: não usa atributos estáticos, arquivos, banco de dados nem classes do Spring. Ela recebe os dados pelos métodos `adicionarUnidade` e `adicionarBolsa` e devolve um `ResultadoAlocacao` em `atender`. Por isso uma classe de serviço pode criá-la, alimentá-la com as unidades e bolsas do banco e chamá-la para cada pedido.

Exemplo do ponto de ligação previsto (não incluído no backend):

```java
@Service
public class AlocacaoService {
    private final CentralAlocacao central = new CentralAlocacao();

    public ResultadoAlocacao atender(Requisicao pedido, String hoje) {
        return central.atender(pedido, hoje);
    }
}
```

Para fazer essa ligação seria necessário mover as classes para `src/main/java`, declarar um `package`, trocar as classes de domínio pelas entidades do backend e carregar as bolsas do banco. Isso não faz parte desta entrega.

# 13 STATUS FINAL

( x ) Unidade 1: lista, fila e pilha em C++ com `new`, `delete`, destrutores e ponteiros
( x ) Unidade 1: reimplementação em Java com nó próprio, sem coleção pronta
( x ) Unidade 1: inserir, remover e consultar nas três estruturas, nas duas linguagens
( x ) Unidade 2: matriz ABO/Rh, FEFO, índice hash e rota por vizinho mais próximo em C++
( x ) Unidade 2: os quatro algoritmos em Java, integrados em `CentralAlocacao`
( x ) Pedido integrado: compatibilidade, busca no hash, FEFO e rota funcionando juntos
( x ) Complexidade declarada e justificada pelo código (seções 5 e 6)
( x ) Testes: 36 e 97, iguais em C++ e em Java
( x ) Memória: valgrind sem vazamentos nos quatro programas
( x ) Documento de equivalência C/C++ para Java com um parágrafo por estrutura e por algoritmo (seções 4.4 e 5)
