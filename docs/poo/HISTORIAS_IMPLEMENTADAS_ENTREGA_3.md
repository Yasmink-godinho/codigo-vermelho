## Entrega 03

### Histórias Implementadas

Como ler as tabelas de critérios:

* **Implementado**: o código que atende o critério existe no repositório.
* **Validado**: o critério foi conferido rodando o sistema ou os testes automáticos (`./mvnw test`) na máquina do time. Essa coluna só deve ser marcada depois de rodar. Enquanto estiver `[ ]`, o critério está implementado mas ainda não foi validado.

---

#### US05 — Roteirização Logística Otimizada

> **ID:** US05
> **Sprint:** 03 / Entrega 03
> **Título:** Cálculo da rota mais curta entre duas instituições com Dijkstra

* **Como:** Gestora da Hemorrede
* **Quero:** Selecionar uma instituição de origem e uma de destino e calcular a melhor rota entre elas
* **Para:** Saber o percurso, a distância em km e o tempo estimado, e garantir uma entrega ágil dos lotes.

**Critérios de Aceitação:**

| Critério | Implementado | Validado | Como validar |
|---|---|---|---|
| Calcula o caminho mínimo com Dijkstra sobre o grafo da malha (instituições são os nós, ligações são as arestas) | [x] | [ ] | `DijkstraTest`, `RotaServiceTest.calculaRotaPassandoPelaInstituicaoDoMeio` |
| Retorna o percurso (ids e nomes), a distância total em km e o tempo estimado | [x] | [ ] | `RotasETelemetriaHttpTest.rotaComVariosTrechosVolta200ComPercursoDistanciaETempo` |
| Quando não existe caminho, responde `200` com `rotaEncontrada = false` e mensagem "Nao ha rota disponivel entre ..." | [x] | [ ] | `RotaServiceTest.informaQueNaoHaRotaQuandoODestinoNaoTemLigacao`, `RotasETelemetriaHttpTest.semCaminhoVolta200ComRotaEncontradaFalse` |
| Origem e destino diferentes e existentes (`400` e `404` nos outros casos, no mesmo formato de erro das outras histórias) | [x] | [ ] | `RotasETelemetriaHttpTest.rotaComParametrosInvalidos...`, `...InstituicaoInexistenteVolta404` |
| A transferência só é criada se existir rota e guarda percurso, distância e previsão de chegada (`409` sem rota) | [x] | [ ] | `RotasETelemetriaHttpTest.transferenciaUsaARota...`, `...SemRotaVolta409...` |
| Ligações cadastráveis, sem duplicar (A-B e B-A são a mesma) e apagadas junto com a instituição | [x] | [ ] | `RotaServiceTest`, `RotasETelemetriaHttpTest.ligacaoRepetida...`, `...excluirUmaInstituicaoApagaAsLigacoes...` |
| Dados de demonstração e ligações criados no perfil `dev` mesmo com instituições já cadastradas, sem duplicar | [x] | [ ] | `DataInitializerTest` |

**Evidências de Implementação (POO / Backend):**
* **Grafo e algoritmo:** pacote `grafos` — `Grafo` (matriz de adjacência, como em `docs/aed/MODELAGEM_GRAFO.md`), `Dijkstra`, `CaminhoMinimo`, `CalculoDistancia` (Haversine, que dá o peso de cada aresta).
* **Modelo:** `Ligacao` (aresta da malha, com restrição `unique` no par origem/destino) e `Transferencia`.
* **Camadas:** `LigacaoRepository`, `LigacaoService`, `LigacaoController` (`/api/v1/ligacoes`), `RotaService`, `RotaController` (`/api/v1/rotas`), `TransferenciaService`, `TransferenciaController` (`/api/v1/transferencias`).
* **DTOs:** `RotaResultado`, `NovaLigacaoRequest`, `LigacaoResponse`, `NovaTransferenciaRequest`, `TransferenciaResponse`.

**Decisões que valem registrar:**
* O peso da aresta é a distância em linha reta (Haversine) entre as coordenadas das duas instituições. Ela não é gravada na ligação, é calculada na hora.
* O tempo estimado assume 40 km/h de velocidade média (constante `VELOCIDADE_MEDIA_KMH` em `RotaService`).
* O grafo não tem direção: ligar A com B vale nos dois sentidos.
* Como o peso é a distância em linha reta, uma ligação direta sempre é o menor caminho entre duas instituições. O Dijkstra só mostra valor quando a malha é esparsa (faltam ligações diretas), que é o caso da malha cadastrada.

---

#### US07 — Ingestão de Telemetria e Alertas Térmicos

> **ID:** US07
> **Sprint:** 03 / Entrega 03
> **Título:** Registro de temperatura da carga em trânsito e alerta crítico fora da faixa

* **Como:** Operador Logístico
* **Quero:** Transmitir a temperatura da carga durante o transporte
* **Para:** Monitorar a integridade biológica dos hemocomponentes e ser avisado na hora se a temperatura sair da faixa segura (2 a 6 °C).

**Critérios de Aceitação:**

| Critério | Implementado | Validado | Como validar |
|---|---|---|---|
| Recebe leituras de temperatura de uma transferência e registra no histórico (`POST /api/v1/transferencias/{id}/telemetria`) | [x] | [ ] | `TelemetriaServiceTest`, `RotasETelemetriaHttpTest.leituraDentroDaFaixaVolta201SemAlerta` |
| Leitura de 2 a 6 °C (limites incluídos) é registrada sem alerta | [x] | [ ] | `LeituraTelemetriaTest`, `RotasETelemetriaHttpTest.limitesDe2e6SaoAceitosSemAlerta` |
| Leitura abaixo de 2 °C ou acima de 6 °C é registrada e gera alerta térmico crítico salvo no banco | [x] | [ ] | `TelemetriaServiceTest.leituraAcimaDaFaixa...`, `RotasETelemetriaHttpTest.leituraForaDaFaixa...` |
| Só aceita leitura de transferência em transporte (`409` se já entregue, `404` se não existe) | [x] | [ ] | `RotasETelemetriaHttpTest.depoisDeEntregue...`, `...transferenciaInexistente...` |
| Valida a leitura (`400` para temperatura ausente, não numérica ou fora de -100 a 100) | [x] | [ ] | `RotasETelemetriaHttpTest.leituraInvalidaVolta400` |
| Histórico e alertas consultáveis (`GET .../telemetria`, `GET .../alertas`, `GET /api/v1/alertas-termicos`) | [x] | [ ] | `RotasETelemetriaHttpTest` (testes de leitura) |
| Fonte simulada de sensores para a demonstração (`POST .../telemetria/simulacao`) | [x] | [ ] | `TelemetriaServiceTest.simulador...`, `RotasETelemetriaHttpTest.simulador...` |

**Evidências de Implementação (POO / Backend):**
* **Modelo:** `LeituraTelemetria` (guarda a faixa segura e a regra `isForaDaFaixa()`), `AlertaTermico` (nível `CRITICO`), `Transferencia`.
* **Enums:** `StatusTransferencia`, `NivelAlerta` (já existia).
* **Camadas:** `LeituraTelemetriaRepository`, `AlertaTermicoRepository`, `TelemetriaService`, `SimuladorTelemetriaService`, `TelemetriaController`.
* **DTOs:** `NovaLeituraRequest`, `LeituraResponse`, `AlertaTermicoResponse`.

**Decisões que valem registrar:**
* A leitura fora da faixa responde `201` (a leitura é aceita) e o alerta vem junto na resposta, como definido em `CONTRATOS_API.md`.
* A faixa de 2 a 6 °C vale para todos os componentes, como na história. Plaquetas, na prática, são armazenadas a uma temperatura mais alta (cerca de 20 a 24 °C), então se o time quiser tratar isso, a faixa teria que passar a depender do componente.
* A hora da leitura é a do servidor.

---

#### Estado da integração com o front-end

* As funções `calcularRotaApi`, `registrarLeituraApi`, `buscarHistoricoTelemetriaApi`, `buscarAlertasTransferenciaApi`, `buscarAlertasTermicosApi` e `simularTelemetriaApi` foram adicionadas em `frontend/src/data/api.ts`, mas **nenhuma tela as usa ainda**.
* A tela de Transferências (`Transferencias.tsx`) continua lendo `TRANSFERS_DATA` (mock) e a Central de Alertas (`CentralAlertas.tsx`) tem os alertas escritos no código. Por isso as histórias 05 e 07 hoje só podem ser demonstradas pela API (comandos abaixo), não pelas telas.

---

#### Compatibilidade de `Transferencia` com o resto do domínio

A `Transferencia` desta entrega é mínima, só com o que a US05 e a US07 precisam. Diferenças em relação a `DIAGRAMA.md` e a outras histórias, para o time decidir antes da US09:

| Ponto | Situação atual | Impacto |
|---|---|---|
| Vínculo com `Redistribuicao` e `Requisicao` (`redistribuicao_id`, `requisicao_id` no ERD) | Não existem | Quando a US09 e a US04 criarem transferências, vão precisar dessas duas colunas. Devem ser **opcionais** (nullable) para não quebrar as transferências já gravadas. |
| Fluxo de status | Só `EM_TRANSPORTE`, `ENTREGUE`, `CANCELADA`. O front mostra Solicitação, Análise, Aprovada, Em transporte, Entregue | A US09 precisa acrescentar os estados anteriores. Hoje `POST /api/v1/transferencias` já cria em transporte, sem passar por aprovação. |
| `transportador` (ERD) | Não existe | Acrescentar quando a US09 definir o transportador. |
| Estoque | Criar uma transferência **não reserva nem baixa** lotes, e não muda a `Requisicao` para `ATENDIDA` | O estoque (US02/US03) e a requisição (US04) não refletem a transferência. Não há vínculo com `LoteHemocomponente`. |
| `LEITURA_TELEMETRIA.statusLeitura` e `timestamp` (ERD) | A entidade usa `dataHora` e calcula `isForaDaFaixa()` em vez de guardar um status | Só nomenclatura. O ERD pode ser atualizado ou a entidade renomeada. |
| `ALERTA` genérico (ERD, com `tipoAlerta`, `categoria` e `statusResolucao`) | Existe `AlertaTermico`, tabela própria, sem status de resolução | Se a Central de Alertas passar a unificar alertas de estoque, validade e temperatura, será preciso migrar para uma entidade única. |
| `LIGACAO` | Não aparece no ERD nem em `MODELO_DOMINIO.md` (que diz que rota não é persistida) | A rota continua sem tabela. O que é persistido são as arestas da malha. O ERD deve incluir `LIGACAO`. |
| Exclusão de instituição | Ligações são apagadas junto (`@OnDelete`). Transferências, assim como lotes e requisições, **não**: excluir uma instituição que tenha transferência dá erro de chave estrangeira (`500`) | O front prevê bloquear exclusão quando há histórico (`hasHistory`). Falta uma regra no `InstituicaoService` que devolva uma resposta clara (por exemplo `409`). |
| Identificador | O back usa `id` numérico e `codigo` (`TR-XXXXXXXX`). O mock do front usa `"#1029"` | O front vai precisar mapear. |
| Nível do alerta | Alerta térmico é `CRITICO`, como na história. O mock do front mostra "atenção" para 7,4 °C | Só diferença de texto/cor na tela. |
| Parâmetros de `GET /rotas` | O código segue `CONTRATOS_API.md` (`origem`, `destino`). `docs/redes/ENDPOINTS-US01-US02-US05.md` diz `origemId`, `destinoId` | Os dois documentos precisam ser alinhados pelo time. |

---

#### Como validar localmente

Pré-requisito: Java 17 ou superior e acesso ao Maven Central. Na pasta `backend`:

```
# compila e roda todos os testes (unitarios e de integracao)
./mvnw test

# so os testes novos
./mvnw test -Dtest="DijkstraTest,CalculoDistanciaTest,LeituraTelemetriaTest,TransferenciaTest,LigacaoETelemetriaModelosTest,RotaServiceTest,TelemetriaServiceTest,DataInitializerTest,RotasETelemetriaHttpTest"

# subir a aplicacao (perfil dev, banco H2 com dados de demonstracao)
./mvnw spring-boot:run
```

Com a aplicação no ar, o `DataInitializer` cria (se ainda não existirem) 4 instituições: HEMOPE, Hospital da Restauração, Hospital Universitário Oswaldo Cruz e Hospital Regional do Agreste, e as ligações HEMOPE - Restauração e Restauração - Oswaldo Cruz. O Agreste fica sem ligação de propósito. Como podem existir outras instituições, **consulte os ids reais** antes de testar:

```
curl http://localhost:8080/api/v1/instituicoes
```

Depois troque `ID_HEMOPE`, `ID_OSWALDO` e `ID_AGRESTE` pelos ids da resposta:

```
# rota com mais de um trecho: HEMOPE -> Restauracao -> Oswaldo Cruz
curl "http://localhost:8080/api/v1/rotas?origem=ID_HEMOPE&destino=ID_OSWALDO"

# sem rota (rotaEncontrada = false)
curl "http://localhost:8080/api/v1/rotas?origem=ID_HEMOPE&destino=ID_AGRESTE"

# cria a transferencia (usa a rota calculada) e guarde o id da resposta
curl -X POST http://localhost:8080/api/v1/transferencias -H "Content-Type: application/json" \
  -d '{"origemId":ID_HEMOPE,"destinoId":ID_OSWALDO,"tipoSanguineo":"O-","componente":"CONCENTRADO_HEMACIAS","quantidade":3}'

# leitura dentro da faixa e leitura fora da faixa (gera alerta)
curl -X POST http://localhost:8080/api/v1/transferencias/ID_TRANSFERENCIA/telemetria -H "Content-Type: application/json" -d '{"temperatura":4.2}'
curl -X POST http://localhost:8080/api/v1/transferencias/ID_TRANSFERENCIA/telemetria -H "Content-Type: application/json" -d '{"temperatura":7.4}'

# historico e alertas
curl http://localhost:8080/api/v1/transferencias/ID_TRANSFERENCIA/telemetria
curl http://localhost:8080/api/v1/transferencias/ID_TRANSFERENCIA/alertas
curl http://localhost:8080/api/v1/alertas-termicos

# sensor simulado (a ultima leitura sai da faixa)
curl -X POST "http://localhost:8080/api/v1/transferencias/ID_TRANSFERENCIA/telemetria/simulacao?quantidade=5&comDesvio=true"

# entrega: depois disso novas leituras dao 409
curl -X PATCH http://localhost:8080/api/v1/transferencias/ID_TRANSFERENCIA/entrega
```

Depois de rodar e conferir, marque a coluna **Validado** das tabelas acima.
