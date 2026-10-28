# Estruturas base — AED (Diogo + Thay)

Escopo: **lista encadeada** para bolsas em estoque, **fila FIFO** para requisições e **pilha LIFO** para histórico de movimentações. Não implementa roteirização, FEFO, Hash ou compatibilidade ABO/Rh.

## Equivalência C++ → Java

| Operação | C++ | Java | Regra |
|---|---|---|---|
| Inserir bolsa | `ListaBolsas::inserir` | `GerenciadorEstoque.adicionarBolsa` | Adiciona nó no início da lista |
| Remover bolsa | `ListaBolsas::remover` | `GerenciadorEstoque.removerBolsa` | Busca ID e religa nós |
| Consultar bolsa | `ListaBolsas::consultar` | `GerenciadorEstoque.consultarBolsa` | Busca ID sem remover |
| Inserir requisição | `FilaRequisicoes::enfileirar` | `FilaRequisicoes.enfileirar` | Insere no fim |
| Remover requisição | `FilaRequisicoes::desenfileirar` | `FilaRequisicoes.atenderProxima` | Retira do início (FIFO); Java também marca Atendida, preservando comportamento original |
| Consultar requisição | `FilaRequisicoes::consultarProxima` | `FilaRequisicoes.consultarProxima` | Lê o início sem retirar |
| Inserir evento | `PilhaMovimentacoes::empilhar` | `HistoricoMovimentacoes.registrarEvento` | Insere no topo |
| Remover evento | `PilhaMovimentacoes::desempilhar` | `HistoricoMovimentacoes.removerUltimoEvento` | Retira do topo (LIFO) |
| Consultar evento | `PilhaMovimentacoes::consultarTopo` | `HistoricoMovimentacoes.consultarUltimoEvento` | Lê o topo sem retirar |

Em C++, os nós são alocados com `new` e os removidos são liberados com `delete`; os destrutores liberam nós restantes. As classes não podem ser copiadas por valor para evitar duplicação de ponteiros proprietários. Em Java, cada nó referencia o seguinte; a coleta de lixo recupera os nós que se tornam inacessíveis. Não se usam coleções prontas para implementar essas três estruturas.

A inserção e a remoção na fila e pilha são O(1). Inserir no início da lista é O(1); consultar/remover por ID na lista são O(n). A consulta da fila e pilha é O(1).

## Como executar (a partir de `docs/aed`)

```sh
g++ -std=c++17 estrutura_base_PI3E2-93.cpp -o exemplo_aed
./exemplo_aed
g++ -std=c++17 testes_estruturas_base.cpp -o testes_aed
./testes_aed
javac conexao_poo_PI3E2-94.java TestesEstruturasAED.java
java TesteModeloDominio
java TestesEstruturasAED
```

No PowerShell, execute os binários C++ com `./` ou `.\\` conforme o ambiente. Os arquivos `.class` e executáveis são artefatos locais e não precisam ser enviados ao GitHub.

## Limite de integração

A versão Java é uma implementação independente em `docs/aed`, pronta para servir como referência para integração posterior. **Não está ligada automaticamente aos serviços/controllers do Spring Boot.** Integrá-la exigiria decisão sobre pacotes, ciclo de vida dos dados e pontos de consumo; isso não foi alterado para preservar o backend do grupo.
