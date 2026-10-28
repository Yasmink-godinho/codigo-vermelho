# 📊 EST - Painéis de Estoque e Demanda

> Evolução dos indicadores da U1 para painéis operacionais que permitem analisar **estoque**, **demanda** e o cruzamento entre ambos no Código Vermelho.
> Enquanto RSD trata das métricas de comunicação da infraestrutura, a Estatística trabalha
> com a análise dos **dados operacionais** do sistema.

Tela: **Painéis** (menu lateral) · rota `/paineis` · componente
[`frontend/src/pages/PaineisEstoqueDemanda.tsx`](../../frontend/src/pages/PaineisEstoqueDemanda.tsx).

---

## 1. Fontes de dados

Todos os indicadores são calculados **no cliente**, a partir dos dados reais da aplicação.
Não há valores fixos nos painéis: quando o backend está indisponível, usa-se o conjunto de
demonstração (`mockData`) e a interface sinaliza isso com o selo *"Dados de demonstração"*.

| Domínio | Endpoint | Fallback | Campos usados |
| ------- | -------- | -------- | ------------- |
| **Estoque** | `GET /api/v1/lotes/fila-fefo` | `DEMO_LOTES` | `quantity`, `bloodType`, `component`, `expiryDate`, `instName` |
| **Demanda** | `GET /api/v1/requisicoes` | `DEMO_REQUISICOES` | `quantity`, `bloodType`, `urgency`, `status` |
| **Rede** | `GET /api/v1/instituicoes` | `institutionsData` | `minStock` (estoque mínimo por tipo) |

Os extratores aceitam tanto o formato em inglês do frontend (`quantity`, `bloodType`) quanto
o formato em português vindo do backend (`quantidade`, `tipoSanguineo`), convertendo enums
(`O_NEGATIVO → O-`, `CONCENTRADO_HEMACIAS → Concentrado de Hemácias`).

---

## 2. Indicadores de Estoque

| Indicador | Definição | Cálculo |
| --------- | --------- | ------- |
| **Estoque total** | Unidades disponíveis na rede | `Σ quantidade de todos os lotes` |
| **Estoque por tipo sanguíneo** | Disponibilidade por tipo ABO/Rh | `Σ quantidade` agrupado por `bloodType` (8 tipos) |
| **Composição por componente** | Participação de cada hemocomponente | `Σ quantidade` agrupado por `component` |
| **Estoque por instituição** | Distribuição física pela rede | `Σ quantidade` agrupado por `instName` |
| **Unidades por faixa de validade** | Apoio ao FEFO / risco de perda | contagem de unidades por faixa de `dias até o vencimento` |
| **Risco de perda** | Unidades vencidas ou a vencer | `Σ unidades com dias_para_vencer ≤ 3` |

### Faixas de validade

`dias_para_vencer = data_validade − hoje` (função `daysUntil`).

| Faixa | Critério | Cor |
| ----- | -------- | --- |
| Vencido | `d < 0` | cinza |
| Crítico | `0 ≤ d ≤ 3` | vermelho |
| Atenção | `4 ≤ d ≤ 7` | âmbar |
| Próximo | `8 ≤ d ≤ 30` | azul |
| Saudável | `d > 30` | verde |

### Cobertura do estoque mínimo

Mede se cada tipo sanguíneo atende ao estoque mínimo definido para a rede.

```text
mínimo_da_rede(tipo) = Σ minStock[tipo] de cada instituição
déficit(tipo)        = max(0, mínimo_da_rede − estoque_atual)
abaixo_do_mínimo     = estoque_atual < mínimo_da_rede   (quando há parâmetro definido)
```

---

## 3. Indicadores de Demanda

Calculados a partir das requisições hospitalares.

| Indicador | Definição | Cálculo |
| --------- | --------- | ------- |
| **Demanda total** | Unidades solicitadas | `Σ quantidade das requisições` |
| **Demanda por tipo sanguíneo** | Necessidade por tipo | `Σ quantidade` agrupado por `bloodType` |
| **Requisições por urgência** | Perfil de criticidade | contagem por `urgency` (emergência / prioritária / rotina) |
| **Requisições por status** | Situação do fluxo | contagem por `status` (pendente / em análise / aprovada / negada) |
| **Taxa de atendimento** | Eficiência do atendimento | `aprovadas ÷ total de requisições × 100` |
| **Emergências** | Volume crítico | contagem de requisições com `urgency = emergência` |

---

## 4. Estoque × Demanda

Cruza os dois domínios para apoiar a decisão logística.

```text
índice_de_cobertura(tipo) = estoque(tipo) ÷ demanda(tipo)
cobertura_global          = estoque_total ÷ demanda_total
```

Classificação da situação por tipo:

| Situação | Critério |
| -------- | -------- |
| **Déficit** | `estoque < demanda` |
| **Ajustado** | `1 < cobertura ≤ 1,5` |
| **Folga** | `cobertura > 1,5` (ou demanda nula com estoque positivo) |
| **Neutro** | sem estoque e sem demanda |

---

## 5. Validação e consistência

A tela inclui um bloco que reconcilia as agregações em tempo real. Cada verificação deve
resultar em igualdade — se uma falhar, o indicador correspondente está inconsistente:

- `Σ estoque por tipo` = estoque total
- `Σ estoque por componente` = estoque total
- `Σ estoque por instituição` = estoque total
- `Σ unidades por faixa de validade` = estoque total
- `Σ demanda por tipo` = demanda total
- `Σ requisições por status` = nº de requisições

Essas identidades garantem que nenhuma unidade é contada a mais ou a menos entre os diferentes
recortes do mesmo total, evidenciando a corretude dos cálculos.

---

## 6. Evidências esperadas

- Painéis de estoque e demanda acessíveis pela interface (menu **Painéis**).
- Indicadores calculados a partir dos dados reais (lotes e requisições).
- Gráficos: barras (tipo, instituição, validade, estoque × demanda) e donuts (componente, urgência, status).
- Bloco de validação com as reconciliações.
- Esta documentação dos indicadores e das fontes de dados.
