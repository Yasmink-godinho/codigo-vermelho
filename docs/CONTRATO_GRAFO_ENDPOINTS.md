# 🔗 Contrato Backend ↔ Grafo, Contrato de Endpoints e Entrada/Saída das Funcionalidades

Este documento consolida três coisas exigidas para a US05 (Roteirização) e para a
consistência geral da API:

1. Como o Backend (Spring Boot) deve fornecer dados ao algoritmo de grafo/Dijkstra e
   receber o resultado de volta;
2. O contrato de cada endpoint da API (o que existe hoje vs. o que ainda precisa ser
   criado);
3. Entrada, processamento e saída de cada funcionalidade do sistema.

> **Como este documento foi produzido:** por leitura direta do código-fonte atual em
> `src/main/java/com/codigovermelho/` (models, enums, repositories) e dos documentos já
> existentes em `docs/` (`MODELAGEM_GRAFO.md`, `RESULTADO_ROTA.md`, `DIAGRAMA.md`,
> `HISTORIAS_USUARIO.md`, `VALIDACAO_DADOS.md`). Nada abaixo foi inventado sem checar o
> que já existe; onde falta informação, está marcado como **"a definir"**.

---

## 0. Estado atual do backend (o que existe de fato hoje)

Antes de qualquer decisão sobre grafo ou endpoints, é preciso registrar o que
**realmente** está implementado em código, porque há uma diferença grande entre o que
os documentos descrevem (`DIAGRAMA.md`, `RESULTADO_ROTA.md`) e o que existe em
`src/main/java`:

| Camada | O que existe | O que os docs descrevem mas **não existe em código** |
|---|---|---|
| `models/` | `Instituicao`, `LoteHemocomponente` | `Usuario`, `Requisicao`, `Redistribuicao`, `Transferencia`, `LeituraTelemetria`, `Alerta` (todos presentes no `DIAGRAMA.md`, nenhum implementado) |
| `models/enums/` | `TipoInstituicao`, `TipoSanguineo`, `TipoComponente`, `NivelUrgencia`, `NivelAlerta` | — (enums estão à frente das entidades que os usam) |
| `repositories/` | `InstituicaoRepository`, `LoteHemocomponenteRepository` | Repositories para as entidades acima |
| `services/` | **Nenhum** | `EstoqueService`, `RotaService`, `TransferenciaService`, `PriorizacaoService` (citados em comentários Javadoc e no `RESULTADO_ROTA.md`, mas nenhum arquivo existe) |
| `controllers/` | **Nenhum** | Nenhum endpoint REST existe no projeto — a pasta `controllers/` nem existe |
| DTOs | **Nenhum** | `RotaResultado` (citado como `record` no `RESULTADO_ROTA.md`) não existe no código |
| Grafo/Dijkstra | **Nenhuma implementação em Java** | `MODELAGEM_GRAFO.md` define nó/aresta/matriz de adjacência em **C++**, uma linguagem que não aparece em nenhum outro lugar do stack do projeto (README lista Java, Spring Boot, PostgreSQL, Python — nunca C++) |

**Conclusão prática:** como não existe nenhum `@RestController` no projeto, não há
"endpoints existentes" para validar quanto à compatibilidade — o passo 2 da tarefa
(validar endpoints) não encontrou inconsistências de código porque **não há código de
endpoint para ser inconsistente**. Por isso, a Seção 2 abaixo documenta o **contrato
esperado** para cada endpoint (o que deve ser implementado), em vez de corrigir
endpoints que não existem. Nenhuma alteração de código foi feita neste momento — ver
Seção 5 (Pendências) e o relatório final da conversa.

---

## 1. Arquitetura de integração Backend ↔ Grafo

### 1.1 Contrato em camadas

```text
PostgreSQL (tabelas instituicao, futura tabela de conexão logística)
        │
        ▼
Spring Boot — Repository
  InstituicaoRepository.findAll() / ConexaoLogisticaRepository.findAll()  (a criar)
        │
        ▼
Spring Boot — Service (montagem do grafo em memória)
  GrafoMalhaService (a criar): converte List<Instituicao> + List<ConexaoLogistica>
  em uma estrutura de grafo (nós + matriz de adjacência ou lista de adjacência)
        │
        ▼
Algoritmo de Dijkstra (AED)
  DijkstraService.calcularRota(origemId, destinoId) (a criar)
  Recebe o grafo montado pelo GrafoMalhaService e devolve um RotaResultado
        │
        ▼
Spring Boot — Service de negócio
  RotaResultado é consumido por TransferenciaService / RequisicaoService (a criar),
  conforme já descrito em docs/RESULTADO_ROTA.md
        │
        ▼
Spring Boot — Controller (@RestController)
  Expõe o resultado via endpoint REST (ver Seção 2)
        │
        ▼
Frontend
  Consome o JSON e exibe rota, distância e tempo estimado
```

Esse fluxo **reafirma** (não substitui) o que já está descrito em
`docs/RESULTADO_ROTA.md`: o contrato de saída do algoritmo (`RotaResultado`) já estava
bem definido ali. O que faltava — e este documento cobre — é a etapa **anterior**: como
o grafo é **montado** a partir do banco antes de chegar ao Dijkstra.

### 1.2 O que representa um nó do grafo

Conforme já definido em `docs/MODELAGEM_GRAFO.md`, um nó representa **uma instituição**
(hospital ou hemocentro), não uma combinação instituição×tipo sanguíneo. Essa decisão já
estava correta e é **reaproveitada** aqui, apenas traduzida para o modelo Java existente:

* **Entidade reutilizável:** `Instituicao` (já existe em `models/Instituicao.java`) tem
  todos os atributos que o nó precisa: `id`, `nome`, `latitude`, `longitude`. Não é
  necessário criar uma entidade "Nó" separada — o nó do grafo **é** a `Instituicao`.
* O `MODELAGEM_GRAFO.md` também lista `tipoInstituicao` como atributo do nó, o que já
  existe como `Instituicao.tipo`.

### 1.3 O que representa uma aresta do grafo

Aqui está a lacuna real do projeto: **não existe, em código, nenhuma entidade que
represente uma aresta/conexão entre duas instituições.** O `MODELAGEM_GRAFO.md` define o
conceito (origem, destino, peso) apenas em pseudocódigo C++, que não integra com o
Spring Boot.

* **Entidade a ser criada:** algo como `ConexaoLogistica` (nome definitivo **a
  definir** com o time — ver Pendências), com:

  | Campo | Tipo | Obrigatório | Descrição |
  |---|---|---|---|
  | `id` | Long | gerado | chave primária |
  | `instituicaoOrigem` | `Instituicao` (FK) | sim | ponta A da conexão |
  | `instituicaoDestino` | `Instituicao` (FK) | sim | ponta B da conexão |
  | `distanciaKm` | Double | sim | peso da aresta (custo), conforme já decidido no `MODELAGEM_GRAFO.md` §2.4 |

* **De onde vêm esses dados:** o `MODELAGEM_GRAFO.md` já decidiu que o peso é a
  distância geográfica aproximada entre as coordenadas de origem/destino. Isso pode ser:
  (a) pré-calculado e persistido na tabela de conexões quando a conexão é cadastrada, ou
  (b) calculado em tempo real via fórmula de Haversine a partir de `latitude`/`longitude`
  de cada `Instituicao`, sem precisar persistir `distanciaKm`. **A definir com o time**
  qual das duas abordagens será adotada — impacta se a entidade `ConexaoLogistica`
  precisa ou não do campo `distanciaKm`.
* **Direção:** já decidido no `MODELAGEM_GRAFO.md` §2.2 — arestas não direcionadas. Em
  termos de persistência relacional, isso pode ser modelado como um único registro por
  ligação (a matriz/lista de adjacência em memória é que replica nos dois sentidos ao
  montar o grafo), evitando duplicar linhas na tabela.

### 1.4 Como o Spring Boot deve fornecer os dados ao algoritmo

1. `InstituicaoRepository.findAll()` → lista de nós.
2. `ConexaoLogisticaRepository.findAll()` (repository a criar) → lista de arestas.
3. Um serviço de montagem (`GrafoMalhaService`, a criar) transforma essas duas listas em
   uma estrutura de grafo em memória. O `MODELAGEM_GRAFO.md` já escolheu matriz de
   adjacência como estrutura (justificativa: malha pequena, no máximo ~10 unidades) — essa
   decisão é reaproveitada, mas agora **em Java**, não em C++.
4. O algoritmo de Dijkstra (`DijkstraService`, a criar) recebe essa estrutura + o par
   `(origemId, destinoId)` e devolve o `RotaResultado` já especificado em
   `docs/RESULTADO_ROTA.md`:

   ```java
   record RotaResultado(
       List<Long> instituicoesIds,
       double distanciaTotalKm,
       double tempoEstimadoMinutos,
       boolean rotaEncontrada
   ) {}
   ```

### 1.5 Como o resultado retorna ao Backend e ao Frontend

Sem alterações em relação ao que já está descrito em `docs/RESULTADO_ROTA.md` — esse
contrato está correto e não precisa ser reescrito: `RotaResultado` → consumido por um
service de negócio (`TransferenciaService`/`RequisicaoService`) → persistido nos campos
de `Transferência` → devolvido como JSON por um `@RestController` → consumido pelo
frontend.

### 1.6 Entidades reutilizáveis vs. a criar — resumo

| Elemento do grafo | Reaproveita algo existente? | Ação necessária |
|---|---|---|
| Nó | ✅ `Instituicao` (já implementada) | Nenhuma — já tem `id`, `latitude`, `longitude` |
| Aresta | ❌ Não existe | Criar entidade `ConexaoLogistica` (ou nome equivalente) + repository |
| Estrutura em memória do grafo (matriz/lista de adjacência) | ❌ Não existe em Java (só em C++ no doc) | Criar `GrafoMalhaService` |
| Algoritmo Dijkstra | ❌ Não existe em Java | Criar `DijkstraService` |
| DTO de resultado (`RotaResultado`) | ❌ Não existe como código, só como especificação em doc | Criar o `record` |

**Importante — respeitando a instrução da tarefa:** nenhuma dessas classes foi criada
neste momento, porque a implementação completa do grafo ainda não existe e criá-la
agora seria "inventar uma implementação apenas para cumprir a tarefa". O que este
documento entrega é o contrato e a lista de estruturas necessárias, para que a
implementação seja feita deliberadamente pelo time responsável (Lead Backend / AED).

---

## 2. Contrato dos endpoints

Como nenhum `@RestController` existe no projeto hoje, não há endpoint em produção para
"corrigir". A tabela abaixo documenta o **contrato esperado** para os endpoints
necessários, com base nas entidades e repositories que já existem (ou que precisam
existir, conforme Seção 0) e nas histórias de usuário.

| Funcionalidade | Endpoint (proposto) | Método | Status atual |
|---|---|---|---|
| Cadastro de instituições (US01) | `/api/v1/instituicoes` | POST | Entidade e repository existem; controller/service **não existem** |
| Listagem/consulta de instituições (US01) | `/api/v1/instituicoes`, `/api/v1/instituicoes/{id}` | GET | Entidade e repository existem; controller/service **não existem** |
| Registro de lote (US02) | `/api/v1/lotes` | POST | Entidade e repository existem; controller/service **não existem** |
| Consulta de estoque/lotes (US02) | `/api/v1/instituicoes/{id}/lotes` | GET | Repository já tem `findByInstituicaoId`; controller/service **não existem** |
| Fila de prioridade FEFO (US03) | `/api/v1/lotes/fila-fefo?tipoSanguineo=...&instituicaoId=...` | GET | Repository já tem os métodos ordenados por validade (`findByTipoSanguineoOrderByDataValidadeAsc`, etc.); controller/service **não existem** |
| Emissão de requisição (US04) | `/api/v1/requisicoes` | POST | **Entidade `Requisicao` não existe** — pendência estrutural, não só de endpoint |
| Cálculo de rota (US05) | `/api/v1/rotas?origemId=...&destinoId=...` | GET | Depende de todo o módulo de grafo (Seção 1) — **nada implementado** |
| Painel de risco de desabastecimento (US06) | `/api/v1/instituicoes/{id}/risco-estoque` | GET | Depende de histórico de consumo, que **não existe como entidade** — ver Pendências |
| Ingestão de telemetria (US07) | `/api/v1/transferencias/{id}/telemetria` | POST | **Entidades `Transferencia` e `LeituraTelemetria` não existem** |
| Matching ABO/Rh (US08) | `/api/v1/compatibilidade?tipoSanguineoRequisicao=...` | GET | Depende de `Requisicao` (não existe); regra de compatibilidade em si também não existe em código |
| Recomendação de redistribuição (US09) | `/api/v1/redistribuicoes` | GET/POST | **Entidade `Redistribuicao` não existe** |
| Monitoramento de rede (US10) | `/api/v1/monitoramento/status` | GET | Não há infraestrutura de métricas implementada |

**Nenhuma rota duplicada foi criada, e nenhum nome de rota existente foi alterado —
porque nenhuma rota existe atualmente no projeto.** A tabela acima é uma proposta de
contrato para orientar a implementação futura, alinhada aos nomes de recursos já usados
implicitamente nos documentos (`instituicoes`, `lotes`, `requisicoes`, `transferencias`,
`redistribuicoes`), e não deve ser lida como "correção" de algo que já existia.

---

## 3. Entrada, processamento e saída por funcionalidade

Segue o formato solicitado. Funcionalidades marcadas **[NÃO IMPLEMENTADO]** têm campos
listados com base apenas no que já foi decidido nos documentos existentes
(`HISTORIAS_USUARIO.md`, `DIAGRAMA.md`, `VALIDACAO_DADOS.md`) — nenhum campo novo foi
inventado.

### 3.1 Instituições (US01) — parcialmente implementado (entidade sim, endpoint não)

```text
Funcionalidade: Cadastro de instituição
Endpoint: /api/v1/instituicoes
Método: POST

Entrada:
- nome        | String  | obrigatório | nome da instituição
- tipo        | enum TipoInstituicao (HEMOCENTRO, HOSPITAL_PUBLICO, HOSPITAL_PRIVADO, MATERNIDADE, UPA) | obrigatório
- endereco    | String  | obrigatório
- latitude    | Double  | obrigatório | validado entre -90 e 90 (já implementado no setter de Instituicao)
- longitude   | Double  | obrigatório | validado entre -180 e 180 (já implementado no setter de Instituicao)
- estoqueMinimoPorTipo | Map<TipoSanguineo, Integer> | opcional na criação | pode ser definido depois via definirEstoqueMinimo()

Processamento:
- Validação de campos obrigatórios e coordenadas (regra já implementada nos setters de Instituicao.java)
- Persistência via InstituicaoRepository (já existe)
- Componente responsável: InstituicaoService (a criar) + InstituicaoController (a criar)

Saída:
- id, nome, tipo, endereco, latitude, longitude, estoqueMinimoPorTipo

Status HTTP:
- 201 Created (sucesso)
- 400 Bad Request (coordenadas inválidas, campos obrigatórios ausentes — US01 Cenário 2)
```

### 3.2 Lotes / Estoque (US02, US03) — parcialmente implementado (entidade sim, endpoint não)

```text
Funcionalidade: Registro de lote de hemocomponente
Endpoint: /api/v1/lotes
Método: POST

Entrada:
- tipoSanguineo | enum TipoSanguineo | obrigatório
- componente    | enum TipoComponente (CONCENTRADO_HEMACIAS, PLASMA, PLAQUETAS, CRIOPRECIPITADO) | obrigatório
- dataColeta    | LocalDate | obrigatório | não pode ser futura (já validado no setter)
- dataValidade  | LocalDate | opcional | se omitida, é calculada automaticamente a partir de componente.diasValidadePadrao (já implementado no construtor de LoteHemocomponente)
- quantidade    | Integer | obrigatório | > 0 (já validado no setter)
- instituicaoId | Long | obrigatório | FK para Instituicao existente

Processamento:
- codigoLote é gerado automaticamente via @PrePersist (já implementado)
- Validação de datas e quantidade (já implementada nos setters da entidade)
- Componente responsável: LoteService (a criar) + LoteController (a criar)

Saída:
- id, codigoLote, tipoSanguineo, componente, dataColeta, dataValidade, quantidade, instituicaoId

Status HTTP:
- 201 Created
- 400 Bad Request (validade retroativa — US02 Cenário 2; instituição inexistente)
- 404 Not Found (instituicaoId não encontrado)
```

```text
Funcionalidade: Fila de prioridade FEFO
Endpoint: /api/v1/lotes/fila-fefo
Método: GET

Entrada:
- tipoSanguineo | enum TipoSanguineo | opcional | filtro
- instituicaoId | Long | opcional | filtro

Processamento:
- Usa os métodos já existentes em LoteHemocomponenteRepository
  (findByTipoSanguineoOrderByDataValidadeAsc, findByInstituicaoIdAndTipoSanguineoOrderByDataValidadeAsc)
- Componente responsável: LoteService (a criar) + LoteController (a criar)

Saída:
- lista de lotes ordenados por dataValidade crescente, com destaque (campo calculado,
  não persistido) para lotes com getDiasParaVencer() <= 3 (já implementado na entidade)

Status HTTP:
- 200 OK (mesmo se a lista vier vazia — US03 Cenário 2 trata isso como mensagem, não erro)
```

### 3.3 Requisições (US04) — **[NÃO IMPLEMENTADO]**

```text
Funcionalidade: Emissão de requisição hospitalar
Endpoint: /api/v1/requisicoes
Método: POST

Entrada (conforme HISTORIAS_USUARIO.md US04 e DIAGRAMA.md):
- instituicaoId  | Long    | obrigatório
- usuarioId      | Long    | a definir — Usuario ainda não existe como entidade nem há
                              história de autenticação implementada
- tipoSanguineo  | enum TipoSanguineo | obrigatório
- componente     | enum TipoComponente | obrigatório
- volume         | Integer | obrigatório | > 0
- nivelUrgencia  | enum NivelUrgencia (já existe: ROTINA, PRIORITARIA, EMERGENCIA) | obrigatório
- observacoes    | String  | opcional

Processamento:
- Entidade Requisicao precisa ser criada (não existe)
- RequisicaoRepository precisa ser criado
- RequisicaoService precisa ser criado
- Status inicial "Pendente" + timestamp de criação (regra de negócio a implementar)

Saída:
- id, instituicaoId, tipoSanguineo, componente, volume, nivelUrgencia, status, criadoEm

Status HTTP:
- 201 Created
- 400 Bad Request (campos obrigatórios ausentes — US04 Cenário 2)

PENDÊNCIA: entidade Requisicao, enum de status da requisição e vínculo com Usuario
ainda precisam ser definidos e criados. Nada disso existe em código hoje.
```

### 3.4 Compatibilidade ABO/Rh (US08) — **[NÃO IMPLEMENTADO]**

```text
Funcionalidade: Matching imunológico
Endpoint: /api/v1/compatibilidade
Método: GET

Entrada:
- tipoSanguineoRequisicao | enum TipoSanguineo | obrigatório
- instituicaoId           | Long | opcional | restringe a busca de bolsas alternativas

Processamento:
- Regra de compatibilidade ABO/Rh: a definir onde será implementada
  (sugestão: método utilitário/enum, ex. TipoSanguineo.isCompativelCom(), ou um
  CompatibilidadeService dedicado — decisão de design ainda não tomada)
- Em caso de incompatibilidade, buscar bolsas alternativas via LoteHemocomponenteRepository
  (já existe findByTipoSanguineo... mas precisa de query por lista de tipos compatíveis)

Saída:
- compativel: boolean
- lotesCompativeis: lista de lotes (se compativel = true ou como sugestão em caso de bloqueio)

Status HTTP:
- 200 OK

PENDÊNCIA: a matriz de compatibilidade ABO/Rh (quem doa para quem) ainda não está
implementada em nenhum lugar do código — nem como tabela de dados, nem como regra.
Precisa ser definida antes de codificar o endpoint.
```

### 3.5 Risco de desabastecimento (US06) — **[NÃO IMPLEMENTADO]**

```text
Funcionalidade: Painel de risco de desabastecimento
Endpoint: /api/v1/instituicoes/{id}/risco-estoque
Método: GET

Entrada:
- instituicaoId (path) | Long | obrigatório
- tipoSanguineo        | enum TipoSanguineo | opcional | filtro

Processamento:
- Depende de histórico de consumo, que não existe como entidade nem como fonte de dados
  no backend Java hoje (README cita um módulo Python/Pandas/NumPy separado para US06,
  mas não há integração desse módulo com o Spring Boot definida em nenhum documento)
- Cálculo de média, desvio padrão e CV (já especificados no README, mas sem
  implementação em Java)

Saída (campos esperados, conforme README):
- consumoMedioSemanal, desvioPadrao, coeficienteVariacao, classificacaoVariabilidade,
  nivelRisco (NORMAL/ATENCAO/CRITICO — reaproveitando NivelAlerta, que já existe)

Status HTTP:
- 200 OK
- (US06 Cenário 2) resposta informando dados insuficientes — formato exato a definir

PENDÊNCIA CRÍTICA: não há decisão registrada sobre como o Spring Boot vai obter os
dados de consumo histórico que o módulo de Estatística (Python) produz — se é leitura
direta de uma tabela populada pelo script Python, se é um endpoint Python consumido
pelo Java, ou outra integração. Isso precisa ser decidido antes de implementar o
endpoint acima.
```

### 3.6 Redistribuição (US09) — **[NÃO IMPLEMENTADO]**

```text
Funcionalidade: Recomendação de redistribuição
Endpoint: /api/v1/redistribuicoes
Método: GET (listar recomendações) / POST em /api/v1/redistribuicoes/{id}/aprovar e
        /api/v1/redistribuicoes/{id}/recusar (ações)

Entrada:
- Para aprovar/recusar: redistribuicaoId (path)

Processamento:
- Entidade Redistribuicao precisa ser criada (campos conforme DIAGRAMA.md:
  instituicaoOrigemId, instituicaoDestinoId, loteId, tipoSanguineo, quantidade, status)
- Lógica de geração automática da recomendação (a partir de risco de desabastecimento +
  estoque excedente em outra unidade) ainda não está definida em nenhum documento além
  da descrição qualitativa em HISTORIAS_USUARIO.md US09
- Ao aprovar, deve criar uma Transferencia (que também não existe) — fluxo já descrito
  em RESULTADO_ROTA.md, mas as entidades de origem ainda não existem

Saída:
- id, instituicaoOrigemId, instituicaoDestinoId, loteId, tipoSanguineo, quantidade,
  status (ex.: PENDENTE, APROVADA, RECUSADA)

Status HTTP:
- 200 OK / 201 Created conforme a ação

PENDÊNCIA: entidade Redistribuicao, seu enum de status, e o algoritmo que gera a
recomendação (quais fatores exatos entram no cálculo e com que peso) ainda precisam
ser definidos.
```

### 3.7 Grafo / Roteirização (US05) — **[NÃO IMPLEMENTADO]**

```text
Funcionalidade: Cálculo de rota entre unidades
Endpoint: /api/v1/rotas
Método: GET

Entrada:
- origemId  | Long | obrigatório | id de uma Instituicao existente
- destinoId | Long | obrigatório | id de uma Instituicao existente

Processamento:
- Ver Seção 1 deste documento (arquitetura completa Backend ↔ Grafo)
- Nenhum componente de código existe ainda: nem ConexaoLogistica, nem
  GrafoMalhaService, nem DijkstraService

Saída:
- instituicoesIds (caminho), distanciaTotalKm, tempoEstimadoMinutos, rotaEncontrada
  (contrato RotaResultado já especificado em RESULTADO_ROTA.md)

Status HTTP:
- 200 OK com rotaEncontrada=false quando não há caminho (US05 Cenário 2) — não deve ser
  404, pois a consulta foi bem-sucedida, apenas não há rota
- 404 Not Found se origemId ou destinoId não existirem como Instituicao

PENDÊNCIA: entidade de aresta (ConexaoLogistica), forma de cadastro dessas conexões
(endpoint próprio? seed de dados?), e decisão sobre calcular distância em tempo real
(Haversine) vs. persistir peso fixo — ver Seção 1.3.
```

### 3.8 Transferência (US05/US07/US09) — **[NÃO IMPLEMENTADO]**

```text
Funcionalidade: Transferência de hemocomponentes entre unidades
Endpoint: /api/v1/transferencias
Método: GET / POST (criação é interna, disparada por aprovação de Redistribuicao ou
        atendimento de Requisicao — conforme RESULTADO_ROTA.md)

Entrada (indireta — Transferencia é criada pelo sistema, não diretamente pelo usuário):
- redistribuicaoId ou requisicaoId (origem da transferência)
- instituicaoOrigemId, instituicaoDestinoId

Processamento:
- Entidade Transferencia precisa ser criada (campos conforme DIAGRAMA.md:
  redistribuicaoId, requisicaoId, instituicaoOrigemId, instituicaoDestinoId,
  transportador, distanciaKm, statusTransferencia)
- Chama o módulo de rota (Seção 3.7) para preencher distanciaKm e previsaoChegada
- Componente responsável: TransferenciaService (a criar)

Saída (formato já definido em RESULTADO_ROTA.md):
- id, instituicaoOrigem, instituicaoDestino, tipoSanguineo, quantidade, rota,
  distanciaKm, previsaoChegada, statusTransferencia

Status HTTP:
- 201 Created (transferência criada com rota encontrada)
- 422 Unprocessable Entity ou 400 Bad Request quando rotaEncontrada=false — RESULTADO_ROTA.md
  diz que a Transferência "não é criada" nesse caso; o status HTTP exato para esse
  cenário ainda é a definir

PENDÊNCIA: entidade Transferencia, enum de statusTransferencia, e o campo
"transportador" (é texto livre? é outra entidade/cadastro? não há definição em
nenhum documento).
```

### 3.9 Telemetria / Alertas (US07) — **[NÃO IMPLEMENTADO]**

```text
Funcionalidade: Ingestão de leitura de temperatura
Endpoint: /api/v1/transferencias/{id}/telemetria
Método: POST

Entrada (conforme VALIDACAO_DADOS.md):
- temperatura | Double | obrigatório
- timestamp   | LocalDateTime | obrigatório | não futuro

Processamento:
- Entidade LeituraTelemetria precisa ser criada
- Regra de negócio (não é validação de entrada, conforme já documentado em
  VALIDACAO_DADOS.md): se temperatura fora de 2–6°C, disparar Alerta
- Entidade Alerta também precisa ser criada

Saída:
- leitura registrada (id, temperatura, timestamp, statusLeitura)
- se aplicável: alerta gerado (id, tipoAlerta, categoria, mensagem)

Status HTTP:
- 201 Created (leitura sempre é aceita, mesmo fora da faixa — US07 Cenário 2 gera alerta,
  não rejeição)
- 404 Not Found (transferência inexistente)

PENDÊNCIA: entidades LeituraTelemetria e Alerta, e o mecanismo de disparo do alerta
(síncrono no mesmo request? assíncrono/evento?) ainda não estão definidos em código.
```

---

## 4. Pendências identificadas (resumo consolidado)

| # | Pendência | Onde impacta | Está "a definir" porque... |
|---|---|---|---|
| 1 | Entidade de aresta do grafo (`ConexaoLogistica` ou equivalente) não existe | US05 | Precisa de nome definitivo e decisão de persistir `distanciaKm` ou calcular via Haversine em tempo real |
| 2 | `MODELAGEM_GRAFO.md` define estruturas em C++, mas o projeto é 100% Java/Spring Boot | US05 | Precisa decisão do time: portar o modelo para Java (records/classes), ou manter C++ como protótipo isolado — e neste caso, como ele se conectaria ao backend (nenhuma integração está descrita) |
| 3 | Nenhum `@RestController`, `Service` ou DTO existe no projeto | Todas as US | Endpoints propostos na Seção 2 ainda precisam ser implementados |
| 4 | Entidades `Usuario`, `Requisicao`, `Redistribuicao`, `Transferencia`, `LeituraTelemetria`, `Alerta` existem apenas no `DIAGRAMA.md`, não em código | US04, US07, US09 | Precisam ser criadas antes de qualquer endpoint dessas funcionalidades |
| 5 | Regra de compatibilidade ABO/Rh não está implementada em nenhum lugar | US08 | Falta decidir onde mora a regra (enum, service dedicado, tabela de dados) |
| 6 | Integração entre o módulo Python/Pandas/NumPy (US06) e o Spring Boot não está definida | US06 | Não há documento nem código explicando como o backend Java acessa os indicadores calculados em Python |
| 7 | Referência quebrada: `VALIDACAO_DADOS.md` cita um arquivo `USO_RESULTADO_ROTA.md` que não existe — o arquivo real se chama `RESULTADO_ROTA.md` | Documentação | Inconsistência textual simples, não afeta código, mas deveria ser corrigida no próprio `VALIDACAO_DADOS.md` |
| 8 | Status HTTP para "rota não encontrada" ao criar uma Transferência (US05 Cenário 2) não está definido | US05/US07 | `RESULTADO_ROTA.md` diz que a Transferência "não é criada", mas não especifica o código HTTP (400? 422?) |
| 9 | Campo `transportador` em `Transferencia` não tem definição — texto livre ou entidade própria? | US05/US07 | Nenhum documento aprofunda esse ponto |

---

## 5. Relação com os documentos já existentes

Este documento **não substitui** nenhum dos arquivos já existentes em `docs/` — ele os
complementa:

* `MODELAGEM_GRAFO.md` continua sendo a referência para a *decisão conceitual* de
  modelagem do grafo (o que é nó, o que é aresta, por que matriz de adjacência). Este
  documento traduz essas decisões para o contexto Java/Spring Boot e identifica o que
  falta para chegar lá.
* `RESULTADO_ROTA.md` continua sendo a referência para o contrato de **saída** do
  algoritmo e como ele é consumido depois de calculado. Este documento cobre a etapa
  anterior (como os dados chegam **até** o algoritmo).
* `VALIDACAO_DADOS.md` continua sendo a referência para regras de validação de campo a
  campo — este documento não repete essas regras, apenas referencia onde elas já estão
  implementadas em código (ex.: validações no construtor/setters de `Instituicao` e
  `LoteHemocomponente`).
* `DIAGRAMA.md` continua sendo a referência estrutural do modelo de dados completo —
  este documento usa ele como base para identificar quais entidades do ERD ainda não
  foram implementadas.
