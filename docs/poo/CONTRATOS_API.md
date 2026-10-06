# 🔍 Conferência: Contratos de API × Histórias de Usuário

Este documento define o contrato REST de cada funcionalidade e verifica, história por história, se ele atende integralmente aos cenários (positivo e negativo) já especificados em [`HISTORIAS_USUARIO.md`](HISTORIAS_USUARIO.md).

> Convenções seguidas (conforme padrão definido na disciplina de Infraestrutura de Comunicação): substantivo no plural sem verbo na URL, versionamento em `/api/v1/`, hierarquia para sub-recursos, filtros por query string, códigos de status coerentes.

---

## US01 — Cadastro de Unidades

| Ação | Endpoint | Status esperado |
|---|---|---|
| Cadastrar instituição | `POST /api/v1/instituicoes` | `201` sucesso · `400` coordenadas/campos inválidos |
| Listar instituições | `GET /api/v1/instituicoes` | `200` |
| Detalhar instituição | `GET /api/v1/instituicoes/{id}` | `200` · `404` não encontrada |

| Cenário da história | Contrato atende? | Como |
|---|---|---|
| Cenário 1 (cadastro válido) | ✅ | `POST` retorna `201` com o recurso criado |
| Cenário 2 (coordenadas inválidas) | ✅ | `POST` retorna `400` com mensagem "Coordenadas inválidas" (ver `VALIDACAO_DADOS.md`) |

**Status: ✅ Contrato completo**

---

## US02 — Gestão de Inventário e Validade

| Ação | Endpoint | Status esperado |
|---|---|---|
| Registrar lote | `POST /api/v1/instituicoes/{id}/lotes` | `201` · `400` validade retroativa |
| Listar lotes de uma instituição | `GET /api/v1/instituicoes/{id}/lotes` | `200` |

| Cenário da história | Contrato atende? | Como |
|---|---|---|
| Cenário 1 (registro válido) | ✅ | `POST` retorna `201` com código de lote gerado |
| Cenário 2 (validade retroativa) | ✅ | `POST` retorna `400` |

**Status: ✅ Contrato completo**

---

## US03 — Fila de Prioridade FEFO

| Ação | Endpoint | Status esperado |
|---|---|---|
| Consultar fila ordenada por validade | `GET /api/v1/lotes/fila-fefo?tipoSanguineo={tipo}&instituicaoId={id}` | `200` (sempre, mesmo vazio) |

| Cenário da história | Contrato atende? | Como |
|---|---|---|
| Cenário 1 (ordenação FEFO) | ✅ | Retorna lista ordenada por `dataValidade` crescente |
| Cenário 2 (nenhum lote disponível) | ⚠️ **Ajuste necessário** | O endpoint deve retornar `200` com **lista vazia** (não `404`), e o frontend exibe "Nenhum lote disponível" — importante deixar explícito, pois `404` aqui seria semanticamente errado (o filtro é válido, só não há dados) |

**Status: ⚠️ Ajustado — ver observação de status code**

---

## US04 — Emissão de Requisições Hospitalares

| Ação | Endpoint | Status esperado |
|---|---|---|
| Emitir requisição | `POST /api/v1/requisicoes` | `201` · `400` campos obrigatórios ausentes |
| Listar requisições | `GET /api/v1/requisicoes?status={status}&urgencia={urgencia}` | `200` |
| Detalhar requisição | `GET /api/v1/requisicoes/{id}` | `200` · `404` |

| Cenário da história | Contrato atende? | Como |
|---|---|---|
| Cenário 1 (requisição válida) | ✅ | `POST` retorna `201`, status inicial `PENDENTE` |
| Cenário 2 (campos obrigatórios ausentes) | ✅ | `POST` retorna `400` indicando os campos faltantes |

**Status: ✅ Contrato completo**

---

## US05 — Roteirização Logística Otimizada

| Ação | Endpoint | Status esperado |
|---|---|---|
| Calcular rota entre duas instituições | `GET /api/v1/rotas?origem={id}&destino={id}` | `200` (sempre — ver observação) |

| Cenário da história | Contrato atende? | Como |
|---|---|---|
| Cenário 1 (rota calculada) | ✅ | Retorna `RotaResultado` com `rotaEncontrada = true`, distância e tempo |
| Cenário 2 (unidades sem conexão) | ⚠️ **Ajuste necessário** | Deve retornar **`200`** com `rotaEncontrada = false` (não `404`) — a consulta é válida, só não existe caminho no grafo. Ver `USO_RESULTADO_ROTA.md` |

**Status: ⚠️ Ajustado — ver observação de status code**

---

## US06 — Painel de Análise Descritiva

| Ação | Endpoint | Status esperado |
|---|---|---|
| Consultar indicadores por tipo sanguíneo | `GET /api/v1/analises/consumo?tipoSanguineo={tipo}` | `200` (sempre) |

| Cenário da história | Contrato atende? | Como |
|---|---|---|
| Cenário 1 (dados suficientes) | ✅ | Retorna consumo médio, desvio padrão, CV e classificação |
| Cenário 2 (sem histórico) | ✅ | Retorna `200` com flag `dadosSuficientes = false` e mensagem "Dados insuficientes para gerar estatísticas" |

**Status: ✅ Contrato completo**

---

## US07 — Ingestão de Telemetria e Alertas Térmicos

| Ação | Endpoint | Status esperado |
|---|---|---|
| Registrar leitura de temperatura | `POST /api/v1/transferencias/{id}/telemetria` | `201` |
| Listar leituras de uma transferência | `GET /api/v1/transferencias/{id}/telemetria` | `200` |

| Cenário da história | Contrato atende? | Como |
|---|---|---|
| Cenário 1 (temperatura normal) | ✅ | `POST` retorna `201`, leitura registrada sem alerta |
| Cenário 2 (temperatura fora da faixa) | ✅ | `POST` ainda retorna `201` (a leitura é aceita) **+** dispara criação de um `Alerta` internamente — não é erro de validação, é regra de negócio |

**Status: ✅ Contrato completo**

---

## US08 — Matching Imunológico ABO/Rh

| Ação | Endpoint | Status esperado |
|---|---|---|
| Verificar compatibilidade | `GET /api/v1/compatibilidade?tipoRequisicao={tipo}&tipoLote={tipo}` | `200` (sempre) |

| Cenário da história | Contrato atende? | Como |
|---|---|---|
| Cenário 1 (compatível) | ✅ | Retorna `compativel = true` |
| Cenário 2 (incompatível) | ✅ | Retorna `compativel = false` **+** lista de lotes alternativos compatíveis no mesmo corpo da resposta |

**Status: ✅ Contrato completo**

---

## US09 — Recomendação Explicável de Redistribuição

| Ação | Endpoint | Status esperado |
|---|---|---|
| Listar recomendações pendentes | `GET /api/v1/redistribuicoes?status=SUGERIDA` | `200` |
| Aprovar recomendação | `PATCH /api/v1/redistribuicoes/{id}/aprovacao` | `200` |
| Recusar recomendação | `PATCH /api/v1/redistribuicoes/{id}/recusa` | `200` |

| Cenário da história | Contrato atende? | Como |
|---|---|---|
| Cenário 1 (aprovada) | ✅ | `PATCH .../aprovacao` retorna `200` e cria uma `Transferência` automaticamente |
| Cenário 2 (recusada) | ✅ | `PATCH .../recusa` retorna `200`, nenhuma `Transferência` é criada, status vira `RECUSADA` |

**Status: ✅ Contrato completo**

---

## US10 — Monitoramento de Desempenho e Rede

| Ação | Endpoint | Status esperado |
|---|---|---|
| Consultar status da rede | `GET /api/v1/rede/status` | `200` |

| Cenário da história | Contrato atende? | Como |
|---|---|---|
| Cenário 1 (rede normal) | ✅ | Retorna todos os endpoints com status `OPERACIONAL` |
| Cenário 2 (degradação) | ✅ | Endpoint com taxa de erro alta aparece com status `INDISPONIVEL` ou flag de alerta, no mesmo corpo de resposta |

**Status: ✅ Contrato completo**

---

## 📋 Resumo da conferência

| História | Status do contrato |
|---|---|
| US01 | ✅ Completo |
| US02 | ✅ Completo |
| US03 | ⚠️ Ajustado (status code de lista vazia) |
| US04 | ✅ Completo |
| US05 | ⚠️ Ajustado (status code de rota não encontrada) |
| US06 | ✅ Completo |
| US07 | ✅ Completo |
| US08 | ✅ Completo |
| US09 | ✅ Completo |
| US10 | ✅ Completo |
