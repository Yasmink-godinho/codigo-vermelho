# AED: Unidade 1 e Unidade 2

Pasta de entrega da disciplina de Algoritmos e Estruturas de Dados. O relatório completo, com a equivalência C++ para Java comentada, está em `Relatorio_Entrega_AED.docx` (mesmo conteúdo em `RELATORIO_ENTREGA_AED.md`).

## Escopo

| Unidade | O que tem | C++ | Java |
|---|---|---|---|
| 1 | Lista (bolsas), fila (requisições), pilha (movimentações), com `new`/`delete` e ponteiros | `estrutura_dados_PI3E2-92.h`, `estrutura_base_PI3E2-93.h`, `estrutura_base_PI3E2-93.cpp` | `conexao_poo_PI3E2-94.java` |
| 2 | Matriz ABO/Rh, FEFO, índice hash, rota por vizinho mais próximo e a alocação integrada | `compatibilidade_abo_rh.h`, `fefo_lista_ordenada.h`, `indice_estoque_hash.h`, `roteirizacao_vizinho_mais_proximo.h`, `alocacao_integrada.h`, `demo_u2.cpp` | `integracao_poo_u2.java` |

Testes: `testes_estruturas.cpp` e `TestesEstruturas.java` (36 cada), `testes_u2.cpp` e `TestesU2.java` (97 cada).

## Como executar

```
bash verificar_tudo.sh
```

O script compila C++ e Java, roda os testes, compara a saída das duas linguagens e roda o valgrind quando ele está instalado. Os comandos manuais estão na seção 9 do relatório.

## Pedido integrado (Unidade 2)

`CentralAlocacao.atender(pedido, hoje)` faz, nesta ordem: consulta a matriz ABO/Rh, busca as listas FEFO no índice hash de cada unidade, escolhe as bolsas que vencem primeiro (tudo ou nada) e calcula a rota por vizinho mais próximo.

## Observações

- Dados 100% sintéticos (LGPD).
- O código desta pasta é independente do Maven. Não há ligação com serviços Spring; o ponto de integração previsto está na seção 12 do relatório.
- Os arquivos de estatística (EST) desta pasta (`Dataset_*.csv`, `Indicadores_EST_U1.md`, `*.cpp` de indicadores e gráficos) não fazem parte desta entrega de AED e não foram alterados.
