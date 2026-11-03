# Metodologia dos Indicadores e Cálculos (EST)

Backlog: **PI3E2-35**, W14 Documentação e fechamento (EST). Parte: documentar indicadores, cálculos e metodologia.
Responsável: Diogo.

Este documento explica **como** cada indicador do projeto é calculado, de onde vêm os dados, quais
convenções estatísticas foram adotadas e quais limites o leitor precisa conhecer.
Os documentos que se complementam são:

| Documento | Papel |
| --------- | ----- |
| `INDICADORES_PAINEIS.md` | O que cada indicador dos painéis significa |
| `DADOS_ENTRADA_PAINEIS.md` | Quais campos do backend alimentam os painéis, e as lacunas para a U2 |
| **Este documento** | Fórmulas, convenções, validação e limitações |
| `evidencias/README.md` | Capturas dos painéis e as condições em que foram tiradas |
| `docs/aed/Indicadores_EST_U1.md` | Indicadores da U1 (dataset sintético em CSV) |

---

## 1. Abordagem

- A análise é **descritiva**: somas, contagens, proporções e medidas de posição e dispersão.
  Não há teste de hipótese, previsão nem inferência.
- Os painéis trabalham com os **dados operacionais** do sistema (lotes e requisições). As métricas de
  comunicação da infraestrutura pertencem à disciplina de Redes (RSD).
- Os cálculos são feitos de forma que qualquer número possa ser **reconstruído a partir dos dados
  brutos** com a fórmula do documento.

### Fluxo dos dados nos painéis

```text
Backend (endpoints)  ->  Extratores/normalização  ->  Agregações  ->  KPIs e gráficos  ->  Reconciliação
  lotes, requisições      nomes de campo, enums,       somas e          tela /paineis        6 igualdades que
  e instituições          tipo sanguíneo, status       contagens                             precisam fechar
```

1. **Coleta**: `GET /lotes/fila-fefo`, `GET /requisicoes` e `GET /instituicoes` (ver `DADOS_ENTRADA_PAINEIS.md`).
2. **Normalização**: os extratores aceitam o formato em inglês (`quantity`, `bloodType`) e em português
   (`quantidade`, `tipoSanguineo`), e convertem enums para rótulos (`O_NEGATIVO` para `O-`).
3. **Agregação**: soma ou contagem por tipo sanguíneo, componente, instituição, faixa de validade,
   urgência e status.
4. **Apresentação**: quatro KPIs, gráficos de barra e de pizza, tabela de cobertura.
5. **Validação**: bloco que confere se os recortes somam o mesmo total.

---

## 2. Indicadores dos painéis e como são calculados

Tela: `/paineis`, arquivo `frontend/src/pages/PaineisEstoqueDemanda.tsx`.

### 2.1 KPIs do topo

| KPI | Fórmula | Observação |
| --- | ------- | ---------- |
| Estoque total | Σ `quantity` de todos os lotes | Mostra também nº de lotes e tipos com estoque (de 8) |
| Demanda total | Σ `quantity` de todas as requisições | Mostra o nº de requisições |
| Cobertura global | estoque total ÷ demanda total | Exibe "-" quando a demanda total é zero |
| Risco de perda | Σ unidades nas faixas **Vencido** e **Crítico** | Faixas definidas em 2.2 |

### 2.2 Estoque

| Indicador | Fórmula |
| --------- | ------- |
| Estoque por tipo sanguíneo | Σ `quantity` agrupado por `bloodType` (8 tipos) |
| Composição por componente | Σ `quantity` agrupado por `component` |
| Estoque por instituição | Σ `quantity` agrupado por `instName` |
| Dias para vencer | `dias = arredondar((data_validade - hoje) / 86 400 000 ms)`, com as duas datas à meia-noite UTC |
| Estoque por faixa de validade | Σ `quantity` dos lotes em cada faixa (tabela abaixo) |
| Estoque mínimo da rede (tipo) | Σ `minStock[tipo]` de todas as instituições |
| Déficit (tipo) | `max(0, mínimo da rede - estoque atual)` |
| Abaixo do mínimo (tipo) | `mínimo da rede > 0` **e** `estoque atual < mínimo da rede` |

Faixas de validade (`d` = dias para vencer):

| Faixa | Condição |
| ----- | -------- |
| Vencido | `d < 0` |
| Crítico | `0 <= d <= 3` |
| Atenção | `4 <= d <= 7` |
| Próximo | `8 <= d <= 30` |
| Saudável | `d > 30` |

Lote sem data de validade não entra em nenhuma faixa. Por isso a soma das faixas pode ficar abaixo do
estoque total, e a reconciliação 4 (seção 4) acusa isso.

### 2.3 Demanda

| Indicador | Fórmula |
| --------- | ------- |
| Demanda por tipo sanguíneo | Σ `quantity` das requisições, agrupado por `bloodType` |
| Requisições por urgência | Contagem por `urgency`: emergência, prioritária, rotina, outros |
| Requisições por status | Contagem por `status`: pendente, em análise, aprovada, negada, outros |
| Taxa de atendimento | `requisições aprovadas ÷ total de requisições × 100` (0 quando não há requisições) |
| Emergências | Contagem de requisições com urgência emergência |

A contagem de "aprovada" inclui as requisições **atendidas**, porque o backend devolve `ATENDIDA` como
`aprovada` (ver `DADOS_ENTRADA_PAINEIS.md`, lacuna 4).

### 2.4 Estoque × Demanda

Para cada tipo sanguíneo, com `est` = estoque e `dem` = demanda:

```text
cobertura(tipo) = est / dem                     quando dem > 0
cobertura(tipo) = infinito                      quando dem = 0 e est > 0
cobertura(tipo) = 0                             quando dem = 0 e est = 0
cobertura global = estoque total / demanda total
```

| Situação | Regra (avaliada nesta ordem) |
| -------- | ---------------------------- |
| Neutro | `dem = 0` e `est = 0` |
| Folga | `dem = 0` e `est > 0` |
| Déficit | `est < dem` |
| Ajustado | `1 <= cobertura <= 1,5` (inclui `est = dem`) |
| Folga | `cobertura > 1,5` |

---

## 3. Estatística descritiva (U1 e backend)

Os painéis acima usam somas, contagens e razões. As medidas de **posição e dispersão** aparecem em
dois lugares: nos scripts da U1 e no endpoint de análise de consumo do backend.

### 3.1 Fórmulas

Para uma amostra `x1, ..., xn`:

| Medida | Fórmula |
| ------ | ------- |
| Média | `x̄ = (Σ xi) / n` |
| Variância amostral | `s² = Σ (xi - x̄)² / (n - 1)` |
| Variância populacional | `σ² = Σ (xi - x̄)² / n`, que equivale a `(Σ xi²) / n - x̄²` |
| Desvio padrão | raiz quadrada da variância |
| Coeficiente de variação | `CV = desvio padrão / média × 100` |
| Mediana e percentil 95 | Interpolação linear sobre os valores ordenados: posição `p × (n - 1)` com `p = 0,5` e `p = 0,95` |

Relação entre as duas variâncias: `s² = σ² × n / (n - 1)`. Para `n = 100 000`, o fator é
`1,00001`, então a diferença é desprezível. Para amostras pequenas (como os 15 registros do dataset
sintético da U1) ela importa, e por isso a U1 usa a amostral.

### 3.2 Classificação pelo CV

| CV | Classificação |
| -- | ------------- |
| `CV < 15%` | Estável / previsível |
| `15% <= CV < 30%` | Moderadamente instável |
| `CV >= 30%` | Alta instabilidade |

### 3.3 Onde cada medida é calculada

| Local | Convenção | Dados |
| ----- | --------- | ----- |
| `docs/aed/analise_estatistica_u1.cpp`, `calculo_indicadores_PI3E2-108.cpp`, `validacao_estatistica.cpp` | Variância **amostral** (n-1). Só calcula quando há mais de 1 valor | Datasets sintéticos em CSV (`docs/aed`) |
| `AnaliseConsumoService` (`GET /api/v1/analises/consumo`) | Variância **populacional** (n). Mediana e P95 por interpolação linear | Valores **gerados por fórmula** dentro do serviço, e não consumo real |
| Painéis (`/paineis`) | Não calcula média nem variância | Lotes e requisições |

Ao comparar números de fontes diferentes, é preciso dizer qual convenção cada um usa.

---

## 4. Validação dos resultados

### 4.1 Reconciliação na própria tela

O bloco "Validação e Consistência dos Indicadores" confere seis igualdades. Todas precisam fechar:

| # | Igualdade |
| - | --------- |
| 1 | Σ estoque por tipo sanguíneo = estoque total |
| 2 | Σ estoque por componente = estoque total |
| 3 | Σ estoque por instituição = estoque total |
| 4 | Σ unidades por faixa de validade = estoque total |
| 5 | Σ demanda por tipo sanguíneo = demanda total |
| 6 | Σ requisições por status = nº de requisições |

Uma igualdade que falha indica unidade contada a mais ou a menos entre recortes, por exemplo um tipo
sanguíneo fora dos 8 valores, um lote sem validade ou um status desconhecido.

### 4.2 Conferência manual (exemplo)

Com a captura de 03/11/2026 (`evidencias/`), o cálculo pode ser refeito à mão:

| Indicador | Cálculo | Valor na tela |
| --------- | ------- | ------------- |
| Cobertura global | 98 ÷ 3 = 32,67 | 32,7× |
| Cobertura de O- | 30 ÷ 3 = 10,0 | 10,0× |
| Risco de perda | 68 (Vencido) + 0 (Crítico) | 68 |
| Reconciliação 1 a 4 | 98 = 98 | fecham |

### 4.3 Outros testes e scripts relacionados

| Item | O que faz |
| ---- | --------- |
| `AnaliseConsumoServiceTest` | Garante que o modo sequencial e o modo com threads produzem a mesma análise de consumo |
| `docs/aed/validacao_estatistica.cpp` | Calcula média, variância (n-1), desvio padrão e CV do consumo diário por tipo sanguíneo no dataset sintético e lista as unidades em estado crítico |
| `CompatibilidadeMatrizTest` | Confere a matriz ABO/Rh, que define quais lotes entram como alternativa (ver `docs/poo/MATRIZ_COMPATIBILIDADE_ABO_RH.md`) |

O teste do backend não confere os valores das estatísticas contra um resultado conhecido, só a
consistência entre os dois modos de execução.

---

## 5. Limitações e premissas

1. **Retrato do momento.** Os painéis mostram o estado atual. Não há série temporal, então não é
   possível falar em tendência.
2. **Selo de origem dos dados não é confiável.** A tela mostra "Dados do backend" quando as funções
   `getFilaFEFO` e `buscarRequisicoesApi` devolvem uma lista não vazia. Essas funções, quando o backend
   está fora do ar, devolvem dados do `localStorage` ou dados de exemplo **sem lançar erro**. Com o
   backend desligado, a tela exibiu "Dados do backend" mesmo assim. Antes de usar um print como
   evidência de dado real, confirme que o backend estava rodando.
3. **Lotes vencidos não chegam com dados reais.** `GET /lotes/fila-fefo` retira lotes vencidos, então a
   faixa "Vencido" só tem valor com dados locais ou de exemplo.
4. **Aprovada e atendida se misturam** na taxa de atendimento.
5. **Definições diferentes para "taxa de atendimento".** Na U1, é `Status = Atendida` sobre o total.
   Nos painéis, é `aprovada` (que inclui atendida) sobre o total.
6. **Sem tempo de atendimento com dados do backend.** A requisição não guarda data de atendimento.
7. **Dados sintéticos.** Todo o conjunto é fictício (LGPD). Os resultados descrevem o comportamento
   do sistema com esses dados, e não a realidade de uma rede de sangue.
8. **Amostras pequenas.** Com poucos registros, média e CV são instáveis. Os números servem para
   demonstrar o método.
9. **Cálculo no navegador.** Os indicadores não são persistidos nem expostos por endpoint.

---

## 6. Como reproduzir

```bash
# backend (porta 8080)
cd backend
./mvnw spring-boot:run

# frontend (porta 5173)
cd frontend
npm install
npm run dev
```

1. Entrar com um dos usuários de demonstração da tela de login.
2. Abrir **Painéis** no menu lateral.
3. Conferir que as seis reconciliações do último bloco estão verdes.
4. Para os scripts da U1: `g++ analise_estatistica_u1.cpp -o analise && ./analise`, dentro de `docs/aed`.

Testes do backend: `./mvnw test`.
