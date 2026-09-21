# U1 - Indicadores e Primeira Análise Descritiva (EST)
## Projeto Rota Vital - Código Vermelho

Este documento define os indicadores da primeira entrega de Estatística (U1), cobrindo três frentes: estoque, demanda e tempos de atendimento.

---

## 1. Indicadores de Estoque

Responde à pergunta: "Como está distribuído o estoque atualmente?"

| Indicador | Definição |
|---|---|
| Total de bolsas em estoque | Soma de `Qtd_Bolsas_Atual` em todas as unidades |
| Distribuição por tipo sanguíneo | Soma de `Qtd_Bolsas_Atual` agrupada por `Tipo_Sanguineo` |
| Distribuição por hemocomponente | Soma de `Qtd_Bolsas_Atual` agrupada por `Hemocomponente` |
| Distribuição por instituição | Soma de `Qtd_Bolsas_Atual` agrupada por `Tipo_Instituicao` (Hospital x Hemocentro) |
| Unidades em estado crítico | Unidades onde `Qtd_Bolsas_Atual < Estoque_Minimo_Seguranca` |

---

## 2. Indicadores de Demanda

Responde à pergunta: "Onde existe maior demanda?"

| Indicador | Definição |
|---|---|
| Requisições por hospital | Contagem de requisições agrupadas por `ID_Unidade_Solicitante` |
| Hospital com maior demanda | Unidade solicitante com maior contagem de requisições |
| Componente mais solicitado | `Hemocomponente_Solicitado` com maior contagem de requisições |
| Distribuição por tipo sanguíneo solicitado | Contagem de requisições agrupada por `Tipo_Sanguineo_Solicitado` |
| Taxa de atendimento | (Requisições com `Status = Atendida` / Total de requisições) x 100 |

---

## 3. Indicadores de Tempos de Atendimento

Responde à pergunta: "Quanto tempo leva entre pedir e receber?"

Calculado apenas sobre requisições com `Status = Atendida`, como a diferença em horas entre `Data_Atendimento` e `Data_Criacao`.

| Indicador | Fórmula |
|---|---|
| Tempo médio de atendimento | Média Amostral: x̄ = (1/n) x Σ tempoᵢ |
| Variância do tempo de atendimento | s² = (1/(n-1)) x Σ (tempoᵢ - x̄)² |
| Desvio padrão do tempo de atendimento | s = √s² |
| Coeficiente de variação | CV = (s / x̄) x 100% |
| Tempo mínimo | Menor valor entre os tempos calculados |
| Tempo máximo | Maior valor entre os tempos calculados |

A mesma classificação de CV já usada na US06 se aplica aqui:

| CV | Classificação |
|---|---|
| CV < 15% | Estável / previsível |
| 15% <= CV < 30% | Moderadamente instável |
| CV >= 30% | Alta instabilidade |

---

## 4. Contrato de Dados (EST <-> POO/Domínio)

A U1 usa datasets sintéticos (CSV) porque o backend Java/POO ainda não está gerando esses dados em produção. Quando o backend estiver pronto, ele precisa expor os dados no formato abaixo para que os painéis de EST continuem funcionando sem precisar ser reescritos.

**Estoque** (equivalente à entidade `EstoqueUnidade`):

```
id_unidade
nome_instituicao
tipo_instituicao
tipo_sanguineo
hemocomponente
qtd_bolsas_atual
estoque_minimo_seguranca
consumo_diario_medio
```

**Requisição** (equivalente à entidade `Requisicao`, já definida em POO no PI3E2-94):

```
id_requisicao
id_unidade_solicitante
id_unidade_fornecedora
tipo_sanguineo_solicitado
hemocomponente_solicitado
quantidade_solicitada
data_criacao
data_atendimento   (pode ser nulo, se ainda pendente)
status             (Pendente | Atendida | Cancelada)
```

Enquanto o backend não gera isso via API/PostgreSQL, o EST consome os mesmos campos a partir dos CSVs sintéticos (`Dataset_Sintetico_Malha.csv` e `Dataset_Requisicoes.csv`), o que já valida se os campos definidos são suficientes para calcular todos os indicadores da U1.
