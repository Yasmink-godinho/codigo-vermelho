## Entrega 04

### Histórias Implementadas

---

#### 📌 US08 - Matching Imunológico ABO/Rh

> **ID:** US08  
> **Sprint:** 04 / Entrega 04  
> **Título:** Validação de Compatibilidade ABO/Rh e Alocação de Lotes com Sugestão de Alternativas  

* **Como:** Sistema / Central de Regulação Transfusional
* **Quero:** Validar a compatibilidade imuno-hematológica entre a requisição e os lotes disponíveis em estoque
* **Para:** Evitar alocações incompatíveis e, quando o lote candidato não for compatível, sugerir automaticamente alternativas compatíveis disponíveis na rede.

**Critérios de Aceitação:**
* [x] Aplicação das regras biológicas de compatibilidade ABO/Rh para concentrado de hemácias (O doa para todos; A→A/AB; B→B/AB; AB só para AB; doador Rh+ não doa para receptor Rh−).
* [x] Verificação direta doador × receptor com retorno de resultado e motivo legível (`GET /api/v1/compatibilidade?doador=O-&receptor=AB+`).
* [x] Listagem de todos os tipos de doador compatíveis com um receptor (`GET /api/v1/compatibilidade/doadores?receptor=AB+`).
* [x] Avaliação de alocação entre requisição e lote reais, bloqueando lote sem saldo disponível ou com validade expirada (`GET /api/v1/compatibilidade/alocacao`).
* [x] Em caso de incompatibilidade, retorno automático de lotes alternativos compatíveis existentes no estoque.
* [x] Validação de entrada: tipo sanguíneo inválido resulta em `400` (conversão via `TipoSanguineo.fromString` tratada pelo `GlobalExceptionHandler`).

**Evidências de Implementação (POO / Backend):**
* **Regra de Domínio:** `CompatibilidadeSanguinea` (classe utilitária sem estado: `compativel`, `doadoresCompativeis`, `motivo`).
* **Serviço de Alocação:** `AlocacaoCompatibilidade` e `AlocacaoCompatibilidadeService` (confronto requisição × estoque, verificação de saldo/validade e geração de alternativas).
* **Enums:** `TipoSanguineo` (com `fromString`), `TipoComponente`.
* **Camadas:** `CompatibilidadeController` (`/api/v1/compatibilidade`, `/doadores`, `/alocacao`, `/alocacao/tipos`).
* **DTOs:** `CompatibilidadeResponse`, `AlocacaoCompatibilidadeResponse` (com registro aninhado `Alternativa`).
* **Exceção:** `AlocacaoIncompativelException`.
* **Testes:** `CompatibilidadeSanguineaTest`, `CompatibilidadeMatrizTest`, `AlocacaoCompatibilidadeServiceTest`, `CompatibilidadeHttpTest`, `AlocacaoCompatibilidadeHttpTest` e cenário BDD `compatibilidade.feature`.
* **Interface (Front):** `VerificacaoCompatibilidade.tsx`.

---

#### 📌 US09 - Recomendação Explicável de Redistribuição

> **ID:** US09  
> **Sprint:** 04 / Entrega 04  
> **Título:** Recomendações de Redistribuição de Estoque com Justificativa Explicável (XAI)  

* **Como:** Gestora da Hemorrede
* **Quero:** Receber recomendações de redistribuição de estoque entre unidades acompanhadas da justificativa da recomendação
* **Para:** Poder aprovar ou recusar com confiança, criando a transferência automaticamente apenas quando a recomendação for aprovada.

**Critérios de Aceitação:**
* [x] Geração automática de recomendação a partir das requisições com estado `PENDENTE` e do estoque elegível (lote com saldo, não vencido, componente igual e compatibilidade ABO/Rh, de instituição diferente da solicitante).
* [x] Cada recomendação apresenta motivos explicáveis / justificativa (risco de desabastecimento, estabilidade da origem, prioridade FEFO e rota viária).
* [x] Aprovação cria automaticamente uma `Transferencia` (estado `APROVADA` / despachada) e atualiza o estoque (`POST /api/v1/redistribuicoes/{id}/aprovar`).
* [x] Suporte à aprovação com lote alternativo informado, validando componente, saldo e validade do lote escolhido.
* [x] Recusa não gera nenhuma transferência e registra a justificativa no histórico (`POST /api/v1/redistribuicoes/{id}/recusar`).
* [x] Listagem das recomendações sugeridas (`GET /api/v1/redistribuicoes/sugeridas`) e geração sob demanda (`POST /api/v1/redistribuicoes/gerar`).
* [x] Inicialização idempotente: não cria recomendação fictícia quando não há demanda e estoque compatíveis.

**Evidências de Implementação (POO / Backend):**
* **Modelo:** `RecomendacaoRedistribuicao` e `Transferencia`.
* **Explicabilidade (XAI):** `GeminiAIService` (gera os motivos via IA generativa com *fallback* determinístico quando não há chave/API disponível).
* **Camadas:** `RedistribuicaoService` (geração, aprovação com transferência e recusa), `RedistribuicaoController` (`/api/v1/redistribuicoes`), `RecomendacaoRedistribuicaoRepository`, reutilização de `TransferenciaService`.
* **DTOs:** `RecomendacaoRedistribuicaoResponse`, `NovaTransferenciaRequest`, `TransferenciaResponse`.
* **Exceção:** `RegraDeNegocioException`.
* **Interface (Front):** `Redistribuicoes.tsx`.

---

#### 📌 US10 - Monitoramento de Desempenho e Rede

> **ID:** US10  
> **Sprint:** 04 / Entrega 04  
> **Título:** Monitorização de Saúde e Desempenho dos Endpoints da API  

* **Como:** Administrador(a) Principal
* **Quero:** Monitorar a saúde e o desempenho da infraestrutura de rede do sistema
* **Para:** Garantir a continuidade operacional da plataforma, identificando endpoints degradados ou indisponíveis.

**Critérios de Aceitação:**
* [x] Medição do **tráfego real** da API (nada simulado): cada requisição a `/api/v1/**` é registrada e agregada em uma janela deslizante.
* [x] Cálculo de latência média, *throughput* (req/s), taxa de erro, *uptime* e contagem de requisições/erros.
* [x] Classificação de status por endpoint: `OPERACIONAL`, `DEGRADADO` (taxa de erro acima de 5%), `INDISPONIVEL` (3 respostas `5xx` consecutivas) e `SEM_DADOS` (sem tráfego na janela).
* [x] Endpoints em alerta (`DEGRADADO`/`INDISPONIVEL`) sinalizados e priorizados no topo da listagem.
* [x] Sonda ativa de saúde (conexão JDBC do banco e endpoints `GET` críticos) isolada das métricas reais via cabeçalho `X-Sonda-Saude`.
* [x] Endpoint consolidado de consulta (`GET /api/v1/rede/status`).

**Evidências de Implementação (POO / Backend):**
* **Monitorização:** `MonitoramentoRede` (janela deslizante, métricas e regras de status) e `MonitoramentoRedeFiltro` (captura de cada requisição real).
* **Sonda de Saúde:** `SondaSaude` (verificação do banco e de endpoints críticos, agendada e sob demanda).
* **Camadas:** `RedeController` (`/api/v1/rede/status`).
* **DTOs:** `RedeStatusResponse`.
* **Testes:** `MonitoramentoRedeTest`, `RedeStatusHttpTest`.
* **Interface (Front):** `MonitoramentoRede.tsx`.