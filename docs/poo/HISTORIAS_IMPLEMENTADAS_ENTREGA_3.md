## Entrega 03

### Histórias Implementadas

---

#### 📌 US03 — Compatibilidade ABO/Rh e Avaliação de Risco de Escassez

> **ID:** US03  
> **Sprint:** 03 / Entrega 03  
> **Título:** Matriz de Compatibilidade Imuno-hematológica e Score de Risco  

- **Como:** Central de Regulação Transfusional / Gestor(a) de Distribuição
- **Quero:** Avaliar a compatibilidade imuno-hematológica entre doadores e recetores e calcular o risco de escassez de hemocomponentes na rede
- **Para:** Garantir a segurança transfusional do paciente e priorizar atendimentos com base no nível de criticidade e risco de desabastecimento.

**Critérios de Aceitação:**
- [x] Validação das regras biológicas de compatibilidade ABO/Rh por tipo de componente (Concentrado de Hemácias, Plasma e Plaquetas).
- [x] Cálculo automático do Score de Risco (escala de 0.0 a 100.0) com base na criticidade da solicitação e no inventário disponível.
- [x] Classificação dos alertas térmicos e de stock por níveis padronizados (`NORMAL`, `ALERTA`, `CRITICO`).
- [x] Endpoints REST disponíveis para simulação e consulta de compatibilidade e cálculo de score.

**Evidências de Implementação (POO / Backend):**
- **Modelo:** `ScoreRisco` e regras de domínio imuno-hematológicas.
- **Enums:** `TipoSanguineo`, `TipoComponente`, `NivelAlerta`.
- **Camadas:** `ScoreRiscoService`, `ScoreRiscoController` (`/api/v1/score-risco`).
- **DTOs:** `ScoreRiscoResponse`, `CompatibilidadeResponse`.

---

#### 📌 US05 — Roteirização Logística Otimizada com Dijkstra

> **ID:** US05  
> **Sprint:** 03 / Entrega 03  
> **Título:** Cálculo de Menor Caminho entre Instituições com Algoritmo de Dijkstra  

- **Como:** Gestor(a) da Hemorrede
- **Quero:** Selecionar uma instituição de origem e uma de destino e calcular a melhor rota entre elas
- **Para:** Obter o trajeto detalhado, a distância total em km e o tempo estimado de deslocação, garantindo agilidade e segurança na entrega dos lotes.

**Critérios de Aceitação:**
- [x] Cálculo do caminho mínimo com algoritmo de Dijkstra sobre o grafo da malha (instituições como nós e ligações como arestas).
- [x] Retorno estruturado do percurso (identificadores e nomes), distância total em quilómetros e tempo estimado de viagem.
- [x] Tratamento de malhas desconexas: resposta com status `200`, `rotaEncontrada = false` e mensagem informativa caso não exista caminho viável.
- [x] Validação de parâmetros: bloqueio de origem e destino idênticos ou inexistentes (`400` e `404`).
- [x] Criação de transferência condicionada à existência de rota válida (`409` caso não haja caminho).
- [x] Gestão de ligações não-direcionadas sem duplicidade (aresta A-B equivale a B-A) com exclusão em cascata ao remover a instituição.
- [x] Inicialização de dados e malha de demonstração via perfil `dev` através do `DataInitializer`.

**Evidências de Implementação (POO / Backend):**
- **Grafo e Algoritmo:** Pacote `grafos` — `Grafo` (matriz de adjacência), `Dijkstra`, `CaminhoMinimo`, `CalculoDistancia` (fórmula de Haversine para cálculo dinâmico de pesos).
- **Modelo:** `Ligacao` (aresta com restrição `unique` no par) e `Transferencia`.
- **Camadas:** `LigacaoRepository`, `LigacaoService`, `LigacaoController` (`/api/v1/ligacoes`), `RotaService`, `RotaController` (`/api/v1/rotas`), `TransferenciaService`, `TransferenciaController` (`/api/v1/transferencias`).
- **DTOs:** `RotaResultado`, `NovaLigacaoRequest`, `LigacaoResponse`, `NovaTransferenciaRequest`, `TransferenciaResponse`.

---

#### 📌 US06 — Análise Descritiva Concorrente de Consumo

> **ID:** US06  
> **Sprint:** 03 / Entrega 03  
> **Título:** Processamento Concorrente de Métricas Estatísticas de Hemocomponentes  

- **Como:** Analista de Dados da Hemorrede
- **Quero:** Executar análises estatísticas descritivas sobre o histórico massivo de consumo utilizando processamento multithread
- **Para:** Obter indicadores de demanda (média, variância, desvio padrão, mediana e percentis) em alta velocidade através de computação paralela.

**Critérios de Aceitação:**
- [x] Implementação de pool de threads dedicado (`AnaliseThreadPoolConfig`) para divisão paralela de blocos de dados.
- [x] Cálculo exato de métricas estatísticas: média aritmética, variância, desvio padrão, mediana e percentil 95.
- [x] Suporte à execução comparativa entre os modos Sequencial e Concorrente.
- [x] Retorno do tempo de execução em milissegundos e cálculo do fator de aceleração (*speedup*).

**Evidências de Implementação (POO / Backend):**
- **Configuração:** `AnaliseThreadPoolConfig` com parametrização de núcleos de CPU e fila de tarefas.
- **Camadas:** `AnaliseConsumoService`, `AnaliseConsumoController` (`/api/v1/analises/consumo`).
- **DTOs:** `AnaliseConsumoResponse`.

---

#### 📌 US07 — Ingestão de Telemetria e Monitorização Térmica

> **ID:** US07  
> **Sprint:** 03 / Entrega 03  
> **Título:** Registo de Temperatura da Carga em Trânsito e Emissão de Alertas Críticos  

- **Como:** Operador(a) Logístico(a) / Central de Monitorização
- **Quero:** Transmitir e consultar a temperatura da carga em tempo real durante o transporte
- **Para:** Preservar a integridade biológica dos hemocomponentes e ser notificado(a) imediatamente caso ocorra desvio da faixa térmica segura (2 a 6 °C).

**Critérios de Aceitação:**
- [x] Receção e persistência do histórico de leituras de temperatura vinculado à transferência (`POST /api/v1/transferencias/{id}/telemetria`).
- [x] Identificação de conformidade térmica: leituras entre 2 °C e 6 °C (limites inclusivos) registadas sem alertas.
- [x] Deteção automática de anomalias: leituras inferiores a 2 °C ou superiores a 6 °C geram alertas térmicos de nível `CRITICO` salvos no banco.
- [x] Validação de estado logístico: leituras rejeitadas se a transferência já estiver entregue (`409`) ou inexistente (`404`).
- [x] Validação de integridade: rejeição de leituras com valores omissos ou fora do intervalo físico admitido (-100 °C a 100 °C).
- [x] Consulta de histórico e alertas consolidados (`GET .../telemetria`, `GET .../alertas`, `GET /api/v1/alertas-termicos`).
- [x] Endpoint simulador de sensores logísticos (`POST .../telemetria/simulacao`) para geração controlada de leituras com ou sem desvio.

**Evidências de Implementação (POO / Backend):**
- **Modelo:** `LeituraTelemetria` (com validação de conformidade via `isForaDaFaixa()`), `AlertaTermico` (nível `CRITICO`), `Transferencia`.
- **Enums:** `StatusTransferencia`, `NivelAlerta`.
- **Camadas:** `LeituraTelemetriaRepository`, `AlertaTermicoRepository`, `TelemetriaService`, `SimuladorTelemetriaService`, `TelemetriaController`.
- **DTOs:** `NovaLeituraRequest`, `LeituraResponse`, `AlertaTermicoResponse`.
