# Trabalho U2 · Parte 2 - Planejamento da remodelagem

**Squad:** Código Vermelho (Rota Vital) · **Integrantes:** Larissa Morais, João Rafael Morato, Yasmin Godinho, Diogo Alcelino, Thayná Verçosa, Isabela Karla, Kezia Aguiar
**Repositório:** https://github.com/Yasmink-godinho/codigo-vermelho

> A Parte 1 entregou o Codigo vermelho em container, com TDD e esteira de CI/CD. A Parte 2 é o **planejamento** da remodelagem: redesenhar o domínio com DDD, organizar o código em três camadas (Clean Architecture), projetar uma versão em microsserviços e dimensionar três cenários de carga com orçamento. A Parte 3 materializa este plano em código.

---

## A. Remodelagem do domínio com DDD

### A.1 Subdomínios (core / suporte / genérico)

| Subdomínio | Tipo | Justificativa |
|---|---|---|
| Roteirização logística (Expedição) | **core** | É o diferencial do produto ("Inteligência Logística"): escolher o melhor caminho/tempo para entregar a bolsa impacta diretamente a sobrevivência do paciente. |
| Compatibilidade e Atendimento | **core** | A decisão clínica de qual bolsa atende qual requisição (ABO/Rh) é crítica à vida e específica do negócio de hemoterapia. |
| Gestão de estoque com FEFO | **core** | A inteligência de priorizar bolsas por validade reduz desperdício e desabastecimento — regra específica e de valor direto. |
| Monitoramento de cadeia fria (telemetria) | **suporte** | Necessário para garantir que o hemocomponente chega viável, mas não é o diferencial; poderia apoiar-se em plataformas de IoT de mercado. |
| Análise e redistribuição | **suporte** | Agrega valor às decisões (consumo, risco, recomendação), porém é construído sobre os dados dos contextos core. |
| Cadastro da malha de instituições | **genérico** | Cadastro mestre + geolocalização é algo que praticamente qualquer sistema tem. |
| Autenticação/Autorização e Notificação | **genérico** | *(ainda não implementados)* -> devem ser resolvidos com soluções de prateleira, não construídos do zero. |

### A.2 Bounded contexts

| # | Contexto | Tipo | Responsabilidade (uma frase) |
|---|---|---|---|
| 1 | **Estoque** | core | Controlar lotes/bolsas por instituição, validade, FEFO e estoque mínimo. |
| 2 | **Atendimento** | core | Receber requisições hospitalares, priorizar por urgência e casá-las com bolsa ABO/Rh compatível e dentro da validade. |
| 3 | **Expedição/Roteirização** | core | Planejar e executar transferências, calculando rota, distância e previsão de chegada. |
| 4 | **Monitoramento/Cadeia Fria** | suporte | Acompanhar a telemetria de temperatura no transporte e emitir alertas térmicos. |
| 5 | **Análise & Redistribuição** | suporte | Analisar consumo, calcular risco e recomendar redistribuição de estoque entre unidades. |
| 6 | **Malha de Instituições** | genérico | Cadastrar instituições, localização e as ligações da rede logística. |

### A.3 Glossário da linguagem ubíqua

| Termo | Contexto | Significado |
|---|---|---|
| Instituição | Malha | Nó da rede (hemocentro/hospital) com localização e estoque mínimo. |
| Bolsa | Estoque | Unidade de estoque com tipo sanguíneo, componente, validade e quantidade. |
| Bolsa | Expedição | Item físico em trânsito, rastreado sob cadeia fria (sem noção de validade ou nível de estoque). |
| Lote | Estoque | Conjunto identificável de bolsas do mesmo tipo/componente/validade. |
| Validade | Estoque | Objeto de valor: data-limite de uso; define se a bolsa está "vencida". |
| FEFO | Estoque | Política "First Expired, First Out": consome primeiro o que vence antes. |
| Estoque mínimo | Estoque | Limiar de segurança por tipo sanguíneo que dispara alerta de desabastecimento. |
| Requisição | Atendimento | Pedido hospitalar de hemocomponente, com urgência e status. |
| Urgência | Atendimento | Nível que prioriza o atendimento de uma requisição. |
| Compatibilidade (ABO/Rh) | Atendimento | Regra que determina se uma bolsa pode ser transfundida em um receptor. |
| Atendimento/Alocação | Atendimento | Ato de casar uma requisição a uma bolsa compatível e válida. |
| Transferência | Expedição | Movimento de bolsas de uma instituição de origem para um destino. |
| Rota | Expedição | Caminho mínimo entre instituições (distância e previsão de chegada). |
| Leitura de Telemetria | Monitoramento | Medição de temperatura associada a uma transferência em um instante. |
| Alerta Térmico | Monitoramento | Evento disparado quando a temperatura sai da faixa segura. |
| Score de Risco | Análise | Índice que prioriza unidades/requisições por risco de desabastecimento. |
| Recomendação de Redistribuição | Análise | Sugestão de mover estoque entre unidades para equilibrar a rede. |

**Termo com dois sentidos:** *Bolsa* significa unidade de estoque com validade no contexto Estoque, e item rastreado sob cadeia fria no contexto Expedição. O mesmo objeto físico, dois modelos diferentes conforme a fronteira.

### A.4 Mapa de contextos

```
                         [ Malha de Instituições ]  (genérico, upstream)
                                    |  publica: Instituição, Localização
                 ______________________________________________________
                |                   |                    |              |
            (ACL)               (ACL)                (ACL)          (ACL)
         [ Estoque ] <--C/F--- [ Atendimento ] --evento--> [ Expedição ] --evento--> [ Monitoramento ]
             core     fornece    core           Requisição     core        Transf.      suporte
              |       bolsa       |             Atendida         |          Criada          |
              |                   |                              |                          |
              \__________________ v ____________________________ v _________________________/
                                   |  eventos / consultas
                            [ Análise & Redistribuição ]  (suporte, downstream)
                                   |  publica: Recomendação de Redistribuição
                                   +--> consumida por Estoque / Expedição
```

**Relações:**

- **Estoque → Atendimento (Cliente-Fornecedor):** Atendimento consulta e reserva bolsas do Estoque; Estoque é o fornecedor (upstream).
- **Atendimento → Expedição (evento RequisiçãoAtendida):** quando um atendimento exige mover bolsa, dispara a criação de uma transferência.
- **Expedição → Monitoramento (evento TransferênciaCriada):** a transferência passa a ser acompanhada por telemetria.
- **Malha → todos (upstream, via Camada Anticorrupção):** os demais contextos consomem "Instituição" da Malha, mas traduzem para o seu próprio modelo via ACL, para não acoplar ao modelo de cadastro.
- **Integrações externas via ACL:** Monitoramento integra o simulador/IoT de telemetria; Análise integra a IA (Gemini). Ambas ficam atrás de uma Camada Anticorrupção, para o modelo externo não vazar para o domínio.
- **Análise & Redistribuição (downstream/Conformist):** consome dados de Estoque, Atendimento e Monitoramento e devolve recomendações.

### A.5 Eventos de domínio (opcional)

| Evento (passado) | Publica | Consome |
|---|---|---|
| BolsaRegistrada | Estoque | Análise |
| RequisiçãoAtendida | Atendimento | Expedição, Análise |
| TransferênciaCriada | Expedição | Monitoramento |
| AlertaTérmicoDisparado | Monitoramento | Atendimento, Expedição |
| BolsaVencida | Estoque | Análise |

---

## B. Modelo tático do contexto core Atendimento

Escolhemos Atendimento porque sua invariante protege diretamente a vida do paciente e porque conecta com a Parte 1 (a regra ABO/Rh já nasceu de testes e tem cenário Gherkin que será executado na Parte 3).

### B.1 Agregado Requisição

- **Raiz do agregado:** Requisição (identidade: códigoRequisição).
- **Entidades internas:** Alocação (o casamento de uma requisição com a referência de uma bolsa, com identidade local no agregado).
- **Objetos de valor:** TipoSanguíneo, Urgência, Volume, StatusRequisição, ResultadoCompatibilidade.
- **Referência a outro agregado por id:** a Bolsa pertence ao agregado do Estoque; Atendimento só guarda o id da bolsa (não a entidade), respeitando a fronteira entre agregados.

```
Requisição (raiz)
 ├─ códigoRequisição : identidade
 ├─ instituiçãoSolicitanteId : referência (Malha)
 ├─ TipoSanguíneo (VO)
 ├─ Urgência (VO)
 ├─ Volume (VO)
 ├─ StatusRequisição (VO: PENDENTE → EM_ATENDIMENTO → ATENDIDA | CANCELADA)
 └─ Alocação (entidade)
       ├─ bolsaId : referência (Estoque)
       └─ ResultadoCompatibilidade (VO)
```

### B.2 Invariantes que a raiz protege

1. **Transição de estado válida:** nasce PENDENTE; só segue PENDENTE → EM_ATENDIMENTO → ATENDIDA ou → CANCELADA. Não volta de ATENDIDA nem "pula" estados.
2. **Atendimento seguro (crítica à vida):** uma requisição só pode ser ATENDIDA com uma Alocação cuja bolsa seja ABO/Rh compatível e não vencida. É a regra que o método Requisição.atender(alocação) valida antes de mudar o status: a regra mora na raiz, não num service.
3. **Volume coerente:** Volume > 0 e o volume alocado não excede o solicitado.

### B.3 História de usuário âncora

**Persona:** Rosa, operadora do hemocentro HEMOPE (perfil "Gestor da Rede"), responsável por liberar bolsas para hospitais.

**História:** Como operadora do hemocentro, quero que o sistema só me deixe atender uma requisição com uma bolsa compatível e dentro da validade, para que eu nunca libere sangue que coloque o paciente em risco.

**Critérios de aceite (testáveis, ligados à invariante 2):**

- **CA1:** Dada uma requisição O- e uma bolsa O- válida, quando a operadora atende, então a requisição fica ATENDIDA.
- **CA2:** Dada uma requisição O- e uma bolsa A+ (incompatível no ABO), quando a operadora tenta atender, então o sistema recusa e a requisição permanece PENDENTE.
- **CA3:** Dada uma requisição e uma bolsa compatível porém vencida, quando a operadora tenta atender, então o sistema recusa com o motivo "bolsa vencida".

### B.4 Cenário Gherkin (será executado na Parte 3)

```gherkin
# language: pt
Funcionalidade: Atendimento seguro de requisição (ABO/Rh + validade)

  Cenário: Recusar atendimento com bolsa incompatível
    Dada uma requisição do tipo "O-" com status PENDENTE
    E uma bolsa do tipo "A+" dentro da validade
    Quando a operadora tentar atender a requisição com essa bolsa
    Então o atendimento é recusado por incompatibilidade ABO/Rh
    E a requisição permanece com status PENDENTE

  Cenário: Recusar atendimento com bolsa vencida
    Dada uma requisição do tipo "O-" com status PENDENTE
    E uma bolsa do tipo "O-" com a validade expirada
    Quando a operadora tentar atender a requisição com essa bolsa
    Então o atendimento é recusado com o motivo "bolsa vencida"
    E a requisição permanece com status PENDENTE

  Cenário: Atender com bolsa compatível e válida
    Dada uma requisição do tipo "O-" com status PENDENTE
    E uma bolsa do tipo "O-" dentro da validade
    Quando a operadora atender a requisição com essa bolsa
    Então a requisição fica com status ATENDIDA
```

---

## C. Arquitetura em três camadas (Clean Architecture)

### C.1 As três camadas lógicas

| Camada | O que fica aqui | Exemplos no Rota Vital |
|---|---|---|
| Apresentação | Controllers REST e telas; converte HTTP ↔ casos de uso via DTOs. Sem regra de negócio. | RequisicaoController, DTOs, frontend React. |
| Negócio | Aplicação (casos de uso que orquestram e controlam transação) + Domínio (entidades ricas, VOs, serviços de domínio, interfaces de repositório). | AtenderRequisicao (aplicação); Requisicao, CompatibilidadeSanguinea (domínio). |
| Dados | Implementações de repositório (JPA), banco e integrações externas (adapters). | RequisicaoRepositoryJpa, GeminiAIAdapter, SimuladorTelemetria. |

### C.2 Regra de dependência

```
Apresentação  ──▶  Aplicação  ──▶  Domínio  ◀──  Dados (adapters)
   (web)            (casos de uso)   (núcleo puro)      (JPA / integrações)
```

- Cada camada só depende da camada de baixo.
- O Domínio não depende de controller, de banco nem de framework web. A camada de Dados implementa interfaces (ports) declaradas no Domínio — a dependência aponta "para dentro" (Clean Architecture).
- **Situação atual (a corrigir):** a dependência está invertida, as entidades carregam anotações @Entity (dependem de JPA) e as regras vivem nos services. O domínio é "arrastado" pela persistência.

### C.3 Estrutura de pacotes proposta (por contexto × camada)

```
com.codigovermelho
├── atendimento
│   ├── apresentacao        (RequisicaoController, dto)
│   ├── negocio
│   │   ├── aplicacao       (AtenderRequisicao, RegistrarRequisicao)
│   │   └── dominio         (Requisicao [raiz], Alocacao, Urgencia, Volume,
│   │                         StatusRequisicao, CompatibilidadeSanguinea,
│   │                         RequisicaoRepository [port])
│   └── dados               (RequisicaoRepositoryJpa)
├── estoque
│   ├── apresentacao        (LoteController)
│   ├── negocio
│   │   ├── aplicacao       (RegistrarLote, ConsultarFilaFefo)
│   │   └── dominio         (Bolsa [raiz], Validade, Quantidade, PoliticaFefo,
│   │                         EstoqueRepository [port])
│   └── dados               (LoteRepositoryJpa)
├── expedicao
│   ├── apresentacao        (TransferenciaController, RotaController)
│   ├── negocio
│   │   ├── aplicacao       (PlanejarTransferencia)
│   │   └── dominio         (Transferencia [raiz], Rota, Distancia, Eta, Dijkstra)
│   └── dados               (TransferenciaRepositoryJpa, LigacaoRepositoryJpa)
├── monitoramento
│   ├── apresentacao        (TelemetriaController)
│   ├── negocio
│   │   ├── aplicacao       (RegistrarLeitura, AvaliarAlerta)
│   │   └── dominio         (LeituraTelemetria, FaixaTermica [VO], AlertaTermico)
│   └── dados               (TelemetriaRepositoryJpa, SimuladorTelemetriaAdapter)
├── analise
│   ├── apresentacao        (AnaliseConsumoController, RedistribuicaoController)
│   ├── negocio
│   │   ├── aplicacao       (AnalisarConsumo, RecomendarRedistribuicao)
│   │   └── dominio         (ScoreRisco [VO], RecomendacaoRedistribuicao)
│   └── dados               (…RepositoryJpa, GeminiAIAdapter [ACL])
├── malha
│   ├── apresentacao        (InstituicaoController, LigacaoController)
│   ├── negocio
│   │   ├── aplicacao       (CadastrarInstituicao)
│   │   └── dominio         (Instituicao, Localizacao [VO], EstoqueMinimo [VO])
│   └── dados               (InstituicaoRepositoryJpa)
└── compartilhado           (shared kernel mínimo: TipoSanguineo, TipoComponente)
```

### C.4 Plano de refatoração — o que muda efetivamente

1. **Reorganizar por contexto:** sair de controllers/ services/ models/ repositories/ (por função técnica) para pacotes por bounded context × camada (árvore acima).
2. **Enriquecer as entidades (acabar com a anemia):** mover as regras dos services para dentro das raízes. Ex.: Requisicao.atender(alocacao) passa a validar compatibilidade + validade + volume; Bolsa.reservar(qtd) e Bolsa.isVencido() no agregado de Estoque. Os services viram casos de uso finos (camada de aplicação) que apenas orquestram.
3. **Inverter a dependência da persistência:** declarar interfaces de repositório (ports) no domínio e deixar a implementação JPA na camada de dados. Passo pragmático para a Parte 3: introduzir os ports e mover o comportamento primeiro; a separação total "domínio sem anotações JPA" fica como etapa seguinte.
4. **Cobertura de testes:** medir a cobertura atual com JaCoCo (hoje concentrada no domínio já testado na Parte 1 — regra ABO/Rh, FEFO, Dijkstra, score) e definir meta de ≥ 70% no domínio dos contextos core para a Parte 3.

**Fatia entregue em 01/12 (Parte 3):** refatorar um contexto ponta a ponta (Atendimento) para o modelo rico + três camadas, e executar o cenário Gherkin da Seção B como teste de aceitação na esteira.

### C.5 Camada lógica × tier físico

- **Lógico:** 6 contextos × 3 camadas, todos dentro de um único artefato implantável (monolito modular), rodam no mesmo processo JVM.
- **Físico (hoje, no Render):** 3 tiers — (1) Web Service (backend, todas as camadas lógicas no mesmo container), (2) Static Site (frontend, que é parte da camada de apresentação), (3) PostgreSQL (camada de dados). Ou seja, muitas camadas lógicas rodam em poucos tiers físicos.

---

## D. Projeção com microsserviços

### D.1 Quais contextos virariam serviços e por quê

| Serviço candidato | Por quê isolar |
|---|---|
| Estoque | Transacional, coração dos dados; escala de escrita/leitura própria. |
| Atendimento | Caminho crítico à vida; isolá-lo dá resiliência e deploy independente. |
| Expedição/Roteirização | Compute-intensivo (Dijkstra); escala por CPU, diferente dos demais. |
| Monitoramento | Ingestão de telemetria em alta frequência (write-heavy); escala independente. |
| Análise & Redistribuição | Processamento assíncrono/batch + IA externa; não deve pesar no caminho crítico. |
| Malha | Dados mestres; muda pouco, lido por todos, bom candidato a serviço de referência/cache. |

### D.2 Comunicação

- **REST síncrono** para consultas/comandos que exigem resposta imediata (ex.: Atendimento pergunta a Estoque "há bolsa compatível disponível?").
- **Eventos/fila (assíncrono)** para fluxos que se espalham: RequisiçãoAtendida → Expedição cria transferência; TransferênciaCriada → Monitoramento começa a ouvir; ingestão de telemetria por fila (alto volume).

### D.3 Dados

Um banco por serviço, cada serviço é dono dos seus dados, sem tabelas compartilhadas. A consistência entre serviços passa a ser eventual (coordenada por eventos/saga).

### D.4 Saga com compensação

Fluxo: atender requisição urgente que exige transferência (coreografia por eventos).

```
1. Atendimento: marca Requisição EM_ATENDIMENTO            → publica RequisicaoEmAtendimento
2. Estoque:     reserva a bolsa (decrementa disponível)    → publica BolsaReservada
3. Expedicao:   cria transferência + calcula rota          → publica TransferenciaCriada
4. Monitoramento: inicia acompanhamento térmico
5. Atendimento: marca Requisição ATENDIDA

Compensação (se o passo 3 falhar — ex.: sem rota viável):
  3'. Expedicao publica TransferenciaFalhou
  2'. Estoque libera a reserva da bolsa (compensa o passo 2)
  1'. Atendimento volta a Requisição para PENDENTE
```

### D.5 Monólito modular × microsserviços × serverless

| Dimensão | Monólito modular (hoje) | Microsserviços | Serverless (opcional) |
|---|---|---|---|
| Unidade de deploy | 1 artefato | N serviços independentes | 1 função por gatilho |
| Escala | o todo junto | por serviço | automática (até zero) |
| Consistência de dados | forte (1 banco, ACID) | eventual (saga) | eventual |
| Custo | baixo | maior (infra + rede + observabilidade) | por uso (bom p/ picos esporádicos) |
| Complexidade de operação | baixa | alta (orquestração, tracing, resiliência) | média (cold start, limites) |

### D.6 Serverless (projeção opcional)

- **Viram função (por evento):** emitir a guia quando RequisiçãoAtendida; processar leituras de telemetria (stateless, em rajada). Bons para serverless: sem estado, acionados por evento, curtos.
- **Não viram função:** o caminho crítico de Atendimento (conexões de banco, latência e cold start inaceitáveis numa decisão à vida) e a roteirização pesada (CPU/tempo). Mantidos como serviço sempre ligado.

### D.7 ADRs

Registrados em docs/arquitetura/adr/:

- ADR 0001: Decomposição do Rota Vital (0001-decomposicao.md)
- ADR 0002: Adiar microsserviços e manter monólito modular (0002-adiar-microsservicos.md)

---

## E. Três cenários com orçamento

### E.1 Premissas de carga

| Premissa | Baixo (piloto) | Moderado (estadual) | Alto (multi-estado) |
|---|---|---|---|
| Instituições na malha | ~10 | ~60 | ~300 |
| Usuários (operadores) | ~30 | ~300 | ~2.000 |
| Pedidos (requisições)/dia | ~200 | ~3.000 | ~30.000 |
| Pico de requisições HTTP (λ) | ~5 req/s | ~50 req/s | ~400 req/s |
| Disponibilidade desejada | 99,0% | 99,9% | 99,95% |

### E.2 Lei de Little

L = λ × W, onde λ = chegadas/s no pico, W = tempo médio de resposta, L = requisições simultâneas no sistema. Adotamos W = 0,2 s (200 ms por requisição) e a premissa de que cada instância sustenta ~25 requisições simultâneas com latência-alvo e folga de CPU. Conexões de banco ≈ L (cada requisição toca o banco).

| Cenário | λ (req/s) | W (s) | L = λ×W | Instâncias (L/25, +HA) | Conexões de banco |
|---|---|---|---|---|---|
| Baixo | 5 | 0,2 | 1,0 | 1 (→ 2 por redundância) | pool ~5 |
| Moderado | 50 | 0,2 | 10 | 1 (→ 2–3 por HA/folga) | pool ~15–20 |
| Alto | 400 | 0,2 | 80 | ⌈80/25⌉ = 4 (→ 5–6) | ~80 → exige pooler (PgBouncer) + réplica de leitura |

**Leitura do resultado:** no cenário alto, 80 conexões simultâneas estouram um Postgres pequeno; é o gatilho para introduzir um connection pooler, réplica de leitura e fila para a telemetria. Esse é exatamente o ponto em que vale reavaliar a migração de contextos para microsserviços.

### E.3 Diagramas por cenário

```
BAIXO (piloto)
  [Static Site] → [Web Service x2] → [PostgreSQL]
                   (HA mínima)         (pool ~5)

MODERADO (estadual)
  [Static Site] → [Web Service x2-3] → [PostgreSQL]
                        │              (pool ~20)
                        └──▶ [Cache opcional]

ALTO (multi-estado)
  [Static Site] → [Web Service x5-6] → [PgBouncer] → [PostgreSQL principal]
                        │                                   └──▶ [Réplica de leitura]
                        ├──▶ [Cache]
                        └──▶ [Fila] → [Worker de telemetria]
```

### E.4 Orçamento por cenário

Preços on-demand coletados em render.com/pricing (região Oregon), consultados em 18/11/2026. O plano Pro do Render (workspace) está incluído em todos os cenários. Fórmula: custo_por_pedido = custo_mensal_total / (pedidos_dia × 30).

**Baixo** - 6.000 pedidos/mês

| Item | Qtd | Preço unit. (US$/mês) | Custo mensal (US$) |
|---|---|---|---|
| Web Service (Starter 0,5CPU/512MB) | 2 | 7 | 14 |
| PostgreSQL (Basic 0,1CPU/256MB, 100 conex) | 1 | 6 | 6 |
| Static Site | 1 | 0 | 0 |
| Plano Pro Render (workspace) | 1 | 25 | 25 |
| **Total** | | | **45** |
| **Custo por pedido** | | | **US$ 0,0075** |

**Moderado** - 90.000 pedidos/mês

| Item | Qtd | Preço unit. (US$/mês) | Custo mensal (US$) |
|---|---|---|---|
| Web Service (Standard 1CPU/2GB) | 3 | 25 | 75 |
| PostgreSQL (1CPU/2GB, 100 conex) | 1 | 40 | 40 |
| Key Value (256MB, 200 conex) | 1 | 10 | 10 |
| Static Site | 1 | 0 | 0 |
| Plano Pro Render (workspace) | 1 | 25 | 25 |
| **Total** | | | **150** |
| **Custo por pedido** | | | **US$ 0,0017** |

**Alto** - 900.000 pedidos/mês

| Item | Qtd | Preço unit. (US$/mês) | Custo mensal (US$) |
|---|---|---|---|
| Web Service (Pro 2CPU/4GB) | 6 | 85 | 510 |
| PostgreSQL principal (2CPU/8GB, 200 conex) | 1 | 100 | 100 |
| PostgreSQL réplica de leitura | 1 | 100 | 100 |
| Key Value (1GB, 250 conex) | 1 | 20 | 20 |
| Worker de telemetria (Standard 1CPU/2GB) | 1 | 25 | 25 |
| Static Site | 1 | 0 | 0 |
| Plano Pro Render (workspace) | 1 | 25 | 25 |
| **Total** | | | **780** |
| **Custo por pedido** | | | **US$ 0,00087** |

**Economia de escala:** o custo por pedido cai de US$ 0,0075 (baixo) para US$ 0,0017 (moderado) e US$ 0,00087 (alto) — ~9× menor do menor ao maior cenário. Diluir o custo fixo (plano, banco) sobre muito mais pedidos é o que torna o sistema mais barato por unidade conforme a rede cresce.

## Uso de IA

- **Ferramenta:** Claude (assistente de IA).
- **Finalidade:** rascunhar a estrutura do planejamento, a decomposição em contextos, o modelo tático, a árvore de pacotes, os ADRs e as contas da Lei de Little.
- **Validação:** o squad revisou todas as seções; a decomposição em contextos e as invariantes foram conferidas contra o código atual do repositório. Os preços do orçamento NÃO vieram da IA, foram coletados em render.com/pricing (fonte e data registradas na planilha). Foram usados apenas os dados sintéticos do Rota Vital.