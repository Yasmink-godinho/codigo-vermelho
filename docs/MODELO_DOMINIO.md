# 🧠 Modelo de Domínio — Código Vermelho

> Este é o **modelo conceitual do domínio**: representa os conceitos e regras do negócio, **antes** de decidir o que será persistido no banco de dados. Para o modelo de dados (entidades, atributos, chaves, cardinalidades), ver [`DIAGRAMA_ER.md`](DIAGRAMA_ER.md).

---

## O que existe no problema?

```
Instituição ── Lote ── Rota
```

- **Instituição**: hemocentros e hospitais que compõem a malha logística.
- **Lote**: a unidade de hemocomponente armazenada e rastreada pelo sistema (tipo sanguíneo, componente, validade, quantidade).
- **Rota**: o caminho entre uma instituição de origem e uma de destino (origem → destino → distância). **Não é persistida no banco** — é calculada em tempo real pelo algoritmo de Dijkstra, representada por estruturas de grafo (`Node`, `Edge`, `Graph`), não por uma tabela.

## Regras e comportamentos

- **FEFO** (First Expire, First Out): prioriza o uso de lotes com validade mais próxima.
- **Dijkstra**: calcula o caminho mínimo entre instituições sobre o grafo da malha logística.
- **Matching ABO/Rh**: valida compatibilidade imunológica entre requisições e lotes.

## Do domínio ao modelo de dados

```
MODELO DE DOMÍNIO
        ↓
"O que existe no problema?"
        ↓
Instituição ── Lote ── Rota
        ↓
REGRAS/COMPORTAMENTOS
FEFO / Dijkstra / Matching ABO-Rh
        ↓
MODELO DE DADOS
        ↓
O que precisamos persistir no sistema?
        ↓
Instituição
Lote
Usuário
Requisição
Redistribuição
Transferência
LeituraTelemetria
Alerta
```

`Rota` fica de fora do modelo de dados propositalmente: ela é uma **estrutura de execução do algoritmo**, não uma entidade de negócio que precisa de histórico próprio — o que é persistido é o *resultado* de uma rota já aplicada, guardado nos campos `rota` (texto) e `distanciaKm` da entidade `Transferência` (ver [`USO_RESULTADO_ROTA.md`](USO_RESULTADO_ROTA.md)).

---

## 📎 Vocabulário oficial do projeto

Esta tabela define os nomes que devem ser usados de forma consistente em **código, documentação, diagramas e histórias de usuário**:

| Conceito (Modelo de Domínio) | Nome oficial | Representação no Modelo de Dados (ERD) |
|---|---|---|
| Instituição | `Instituição` | Entidade `INSTITUICAO` |
| Unidade de hemocomponente armazenada | `Lote` | Entidade `LOTE` |
| Caminho entre instituições | `Rota` | **Não persistida** — calculada via `Node`/`Edge`/`Graph` (AED) |
| Classificação sanguínea | `TipoSanguineo` | Enum `tipoSanguineo` |
| Tipo de hemocomponente | `ComponenteSanguineo` | Enum `componente` |

> ⚠️ Anteriormente havia inconsistência entre documentos: o modelo de domínio usava o termo **"Bolsa"** enquanto o ERD usava **"Lote"**. Ficou definido que o termo oficial do projeto é **Lote** — não existe, no escopo atual do sistema, uma relação de "um lote contém várias bolsas individuais"; cada lote já representa uma quantidade de um mesmo tipo sanguíneo, componente e validade. Todos os documentos foram atualizados para refletir isso.