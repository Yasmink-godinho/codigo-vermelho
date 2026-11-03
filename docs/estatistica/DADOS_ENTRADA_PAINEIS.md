# Dados de Entrada dos Painéis (EST)

Backlog: **PI3E2-53**, Definir dados de entrada para os painéis.
Objetivo do backlog: alinhar com EST quais informações operacionais podem ser aproveitadas nas análises da U2.
Responsável: Diogo.

Este documento lista, com os nomes de campos que o backend realmente devolve, quais dados entram nos
painéis hoje, quais outros dados operacionais já existem e podem alimentar a U2, e o que ainda falta.
Complementa o `INDICADORES_PAINEIS.md` (que explica os indicadores) e o `METODOLOGIA_INDICADORES.md`
(que explica os cálculos).

---

## 1. Dados que alimentam os painéis hoje

A tela **Painéis** (`/paineis`) lê três endpoints. Todos os indicadores são calculados no navegador
a partir deles.

### 1.1 Estoque: `GET /api/v1/lotes/fila-fefo`

| Campo | Tipo | Exemplo | Usado em |
| ----- | ---- | ------- | -------- |
| `quantity` | inteiro | `12` | Todos os indicadores de estoque (soma) |
| `bloodType` | texto | `"O+"` | Estoque por tipo sanguíneo, cruzamento com demanda |
| `component` | texto | `"Concentrado de Hemácias"` | Composição por componente e filtro do gráfico |
| `instName` | texto | `"Hemocentro Regional"` | Estoque por instituição |
| `expiryDate` | data (`AAAA-MM-DD`) | `"2026-11-20"` | Faixas de validade e risco de perda |
| `id`, `instId`, `collectionDate`, `lotCode` | vários | | Não usados nos painéis hoje |

Cada registro é um **lote**. A unidade da métrica é "unidades de hemocomponente", e o estoque de um tipo
é a soma de `quantity` dos lotes daquele tipo.

### 1.2 Demanda: `GET /api/v1/requisicoes`

| Campo | Tipo | Exemplo | Usado em |
| ----- | ---- | ------- | -------- |
| `quantity` | inteiro | `4` | Demanda total e por tipo (soma) |
| `bloodType` | texto | `"A-"` | Demanda por tipo, cruzamento com estoque |
| `urgency` | texto | `"emergencia"` | Requisições por urgência |
| `status` | texto | `"aprovada"` | Requisições por status e taxa de atendimento |
| `id`, `reqCode`, `instId`, `instName`, `component`, `observations`, `createdAt` | vários | | Não usados nos painéis hoje |

Cada registro é uma **requisição**. A demanda é a soma de `quantity` (unidades solicitadas), e as
contagens por urgência e status contam requisições.

Valores devolvidos pelo backend nesses dois campos (`RequisicaoResponse`):

| Campo | Valores |
| ----- | ------- |
| `urgency` | `rotina`, `prioritaria`, `emergencia` |
| `status` | `pendente`, `em_analise`, `aprovada`, `negada` |

O backend tem cinco status internos (`PENDENTE`, `EM_ANALISE`, `APROVADA`, `RECUSADA`, `ATENDIDA`).
Na resposta, `RECUSADA` vira `negada` e **`ATENDIDA` vira `aprovada`**. Por isso o painel não
distingue requisição aprovada de requisição já atendida (ver seção 4).

### 1.3 Rede: `GET /api/v1/instituicoes`

| Campo | Tipo | Exemplo | Usado em |
| ----- | ---- | ------- | -------- |
| `minStock` | mapa tipo sanguíneo → inteiro | um mínimo por tipo, por instituição | Estoque mínimo da rede e cobertura |
| `id`, `name`, `type`, `location`, `latitude`, `longitude` | vários | | Não usados nos painéis hoje |

O estoque mínimo da rede, por tipo, é a soma do `minStock` de todas as instituições.

### 1.4 Quando o backend não responde

Cada painel tem um conjunto de demonstração (`DEMO_LOTES`, `DEMO_REQUISICOES`, `institutionsData`,
em `frontend/src/data/mockData.tsx`). A tela mostra o selo **"Dados de demonstração"** quando
usa esse conjunto. Print de painel com esse selo não deve ser apresentado como dado real.

---

## 2. Dados operacionais já disponíveis e aproveitáveis na U2

Estes dados existem no backend, mas ainda não entram nos painéis.

| Dado | Endpoint | Campos | Análise possível na U2 |
| ---- | -------- | ------ | ---------------------- |
| Data de criação da requisição | `GET /api/v1/requisicoes` | `createdAt` (milissegundos desde 1970) | Série temporal da demanda (por dia ou semana), pico de demanda, média e desvio da demanda diária |
| Demanda por instituição | `GET /api/v1/requisicoes` | `instName`, `quantity` | Hospitais que mais demandam, concentração da demanda |
| Demanda por componente | `GET /api/v1/requisicoes` | `component`, `quantity` | Cruzar estoque × demanda por hemocomponente (hoje só por tipo sanguíneo) |
| Idade do lote | `GET /api/v1/lotes` | `collectionDate`, `expiryDate` | Percentual da validade já consumido, distribuição da idade do estoque |
| Transferências | `GET /api/v1/transferencias` | `distanciaKm`, `quantidade`, `statusTransferencia`, `previsaoChegada`, origem e destino | Média, desvio e CV da distância das rotas, volume movimentado por par origem-destino, proporção entregue × em transporte |
| Telemetria térmica | `GET /api/v1/transferencias/{id}/telemetria` | `temperatura`, `dataHora`, `foraDaFaixa` | Média e desvio da temperatura por transferência, percentual de leituras fora da faixa (2,0 a 6,0 °C) |
| Alertas térmicos | `GET /api/v1/alertas-termicos` | `nivel`, `temperatura`, `dataHora` | Contagem de alertas por nível e por transferência |
| Redistribuições sugeridas | `GET /api/v1/redistribuicoes/sugeridas` | `status`, `nivelUrgencia`, `quantidade`, `justificativaRecusa` | Taxa de aprovação das sugestões, motivos de recusa |

A faixa de temperatura (2,0 a 6,0 °C) vem das constantes `TEMPERATURA_MINIMA` e `TEMPERATURA_MAXIMA`
de `LeituraTelemetria`.

---

## 3. Proposta de entrada para as análises da U2

| Análise da U2 | Dados de entrada | Já atendido pelo backend? |
| ------------- | ---------------- | ------------------------- |
| Estoque × demanda por **componente** | `component` em lotes e requisições | Sim |
| Demanda ao longo do tempo (média, desvio, CV diários) | `createdAt` das requisições | Sim |
| Variabilidade do consumo por tipo sanguíneo | Histórico de saída do estoque por dia | **Não** (ver lacuna 3) |
| Tempo de atendimento das requisições | Data de atendimento | **Não** (ver lacuna 1) |
| Perdas por vencimento | Lotes vencidos | **Parcial** (ver lacuna 2) |
| Qualidade da cadeia de frio | Leituras de temperatura | Sim |
| Desempenho logístico (distância e volume) | Transferências | Sim |

---

## 4. Lacunas encontradas

1. **Não existe data de atendimento da requisição.** A entidade `Requisicao` guarda só `dataCriacao`.
   Sem ela, o tempo de atendimento estudado na U1 (com o dataset sintético) não pode ser calculado com
   dados do backend. A `Transferencia` também não guarda a data de entrega, só `dataCriacao`
   (que não é devolvida em `TransferenciaResponse`), `previsaoChegada` e o status `ENTREGUE`.
   Sugestão: registrar a data da mudança de status da requisição, ou devolver `dataCriacao` e
   a data de entrega na transferência.
2. **A fila FEFO remove lotes vencidos.** `GET /lotes/fila-fefo` filtra `!lote.isVencido()`. Com dados reais,
   a faixa "Vencido" do painel de validade fica sempre em zero, e o risco de perda só enxerga os lotes
   com 0 a 3 dias. Para medir perda por vencimento, a entrada precisaria vir de `GET /lotes`
   (lista completa).
3. **Não há histórico de consumo.** O lote guarda a quantidade atual, e não as saídas por dia.
   O endpoint `GET /api/v1/analises/consumo` calcula média, variância, desvio, CV, mediana e P95,
   mas sobre números **gerados por uma fórmula** dentro do serviço, e não sobre consumo real.
   Ele serve para demonstrar processamento concorrente, não como análise do estoque.
4. **`ATENDIDA` aparece como `aprovada`.** O painel mostra "taxa de atendimento", mas conta aprovadas
   e atendidas juntas. O nome mais exato do indicador hoje é taxa de aprovação (inclui atendidas).
5. **Convenção da variância.** A U1 (scripts em `docs/aed`) usa variância amostral (divisor n-1).
   O `AnaliseConsumoService` usa variância populacional (divisor n). Para 100 mil registros a diferença
   é desprezível, mas a convenção precisa estar escrita quando os números forem comparados
   (ver `METODOLOGIA_INDICADORES.md`).

O backlog PI3E2-72 (Disponibilizar dados e consultas para os painéis) está concluído e cobre os três
endpoints da seção 1. As lacunas acima são pontos para decidir com o time antes da U2.

---

## 5. Regras para os dados usados nos painéis

- Dados **sintéticos ou fictícios**. Nenhum dado de paciente ou doador real entra no projeto (LGPD).
- Quantidades em **unidades** de hemocomponente.
- Tipo sanguíneo sempre em um dos 8 valores (`O-`, `O+`, `A-`, `A+`, `B-`, `B+`, `AB-`, `AB+`).
- As reconciliações do bloco "Validação e consistência" devem fechar (soma por recorte igual ao total)
  antes de qualquer print ser usado como evidência.
