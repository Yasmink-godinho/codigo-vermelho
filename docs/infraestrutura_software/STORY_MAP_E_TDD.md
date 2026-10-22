# E2 — TDD: Story Map e estratégia de testes

## 1. Story map

**Backbone (atividades do usuário, da esquerda para a direita):**

```
Cadastrar unidades → Gerir estoque → Priorizar bolsas → Rotear transferências → Analisar consumo → Garantir compatibilidade
    (US01)              (US02)          (US03 FEFO)         (US05)                 (US06)              (US08 ABO/Rh)
```

**Release 1** (o que entra na primeira versão no ar): US01, US02, US03, US05, US08.
US06 (painel estatístico) fica como incremento posterior do mesmo backbone.

### Release 1 — histórias quebradas em tarefas

| História | Tarefas | Teste que nasceu primeiro |
|---|---|---|
| **US03 — Fila FEFO** | (a) ordenar lotes por validade crescente; (b) excluir lotes vencidos da fila; (c) filtrar por tipo sanguíneo e instituição | Ordenação + exclusão de vencidos → `FilaFefoIntegracaoTest` |
| **US08 — Matching ABO/Rh** | (a) regra ABO (quem doa para quem); (b) regra Rh (Rh+ não doa para Rh-); (c) listar doadores compatíveis de um receptor; (d) expor via API | Regra ABO/Rh → `CompatibilidadeSanguineaTest` (unitário) + `CompatibilidadeHttpTest` (aceitação) |
| **US05 — Roteirização** | (a) caminho mínimo entre unidades; (b) tratar ausência de rota; (c) validar parâmetros | Já coberto por `RotaServiceTest`, `DijkstraTest`, `RotasETelemetriaHttpTest` |

## 2. Testes por nível

| Nível | Exemplo neste repositório | O que valida |
|---|---|---|
| **Unitário** | `CompatibilidadeSanguineaTest`, `ScoreRiscoServiceTest`, `DijkstraTest`, `TransferenciaTest` | Regra de negócio isolada, sem banco nem HTTP |
| **Integração (com o banco)** | `FilaFefoIntegracaoTest` (sobe o contexto Spring + JPA sobre H2 e grava lotes reais) | A regra FEFO atravessando o repositório e o banco |
| **Aceitação (ponta a ponta, HTTP)** | `CompatibilidadeHttpTest`, `RotasETelemetriaHttpTest` (servidor em porta aleatória, requisição HTTP real) | O fluxo como o operador usaria, via API |

O critério de aceitação da US08 também está escrito em **Gherkin/BDD** em
`backend/src/test/resources/features/compatibilidade.feature` — a forma
executável desses cenários é o `CompatibilidadeHttpTest`.

## 3. Qual regra ganhou teste primeiro, e por quê (risco)

A **compatibilidade ABO/Rh (US08)** foi a primeira a nascer de testes porque é
a de **maior risco clínico**: uma transfusão incompatível põe um paciente em
risco direto. Por isso ela virou uma classe de regra pura
(`CompatibilidadeSanguinea`), sem Spring nem JPA, blindada por testes unitários
dos 8 tipos sanguíneos antes de qualquer linha de implementação.

Em segundo lugar, a **fila FEFO (US03)**: um erro aqui faz bolsas vencerem (perda
de estoque) ou entrega uma bolsa vencida — por isso o teste de integração
confere tanto a ordenação por validade quanto a exclusão dos vencidos.

## 4. Histórico red → green

Os commits seguem o par **test → feat**:

```
test: US08 testes de compatibilidade ABO/Rh (vermelho)   # classe ainda não existe
feat: US08 implementa CompatibilidadeSanguinea (verde)   # testes passam
feat: US08 expõe endpoint /api/v1/compatibilidade + teste de aceitação
```

O primeiro commit compila os testes e **falha** (a classe
`CompatibilidadeSanguinea` ainda não existe → vermelho). O segundo adiciona a
implementação mínima que faz todos passarem (verde).

## 5. O que ficou sem teste

- O endpoint de score de risco é coberto no nível de serviço (`ScoreRiscoServiceTest`), não em aceitação HTTP — é cálculo interno, risco baixo.
- O `DataInitializer` (dados de exemplo) é conveniência de dev; tem teste de fumaça (`DataInitializerTest`), não de regra.

## 6. Uso de IA

A IA foi usada para **rascunhar** os casos de teste da US08 (lista dos 8 tipos
e os pares compatível/incompatível) e a implementação da regra. Os pares ABO/Rh
foram **conferidos manualmente** contra a tabela clínica padrão (O- doador
universal, AB+ receptor universal, Rh+ não doa para Rh-) antes do merge. Prompts
principais estão registrados no README.
