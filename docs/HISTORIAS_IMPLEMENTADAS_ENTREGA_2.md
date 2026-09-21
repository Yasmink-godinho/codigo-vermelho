## Entrega 02

### Histórias Implementadas

---

#### 📌 US01 — Cadastro e Gestão de Instituições da Malha Logística

> **ID:** US01  
> **Sprint:** 01 / Entrega 02  
> **Título:** Gestão de Instituições e Estoque Mínimo de Segurança  

* **Como:** Administrador(a) da Rede / Hemocentro Central
* **Quero:** Cadastrar, atualizar e listar as instituições da rede (hemocentros, hospitais públicos/privados, UPAs e maternidades) com as suas coordenadas geográficas e níveis de stock mínimo
* **Para:** Mapear a malha logística e viabilizar a monitorização e o cálculo automático de rotas e alertas de desabastecimento crítico.

**Critérios de Aceitação:**
* [x] Validação de campos obrigatórios: nome, tipo, endereço e coordenadas geográficas.
* [x] Coordenadas restritas aos intervalos válidos: Latitude (-90.0 a 90.0) e Longitude (-180.0 a 180.0).
* [x] Definição de stock mínimo de segurança individualizado por tipo sanguíneo (A+, A-, B+, B-, AB+, AB-, O+, O-).
* [x] Endpoints REST disponíveis para operações CRUD completas (`GET`, `POST`, `PUT`, `DELETE`).

**Evidências de Implementação (POO / Backend):**
* **Modelo:** `Instituicao` (utilização de `@ElementCollection` e `@CollectionTable` para o mapeamento do mapa de stock mínimo).
* **Enums:** `TipoInstituicao`, `TipoSanguineo`.
* **Camadas:** `InstituicaoRepository`, `InstituicaoService`, `InstituicaoController` (`/api/v1/instituicoes`).
* **DTOs:** `NovaInstituicaoRequest`, `AtualizarInstituicaoRequest`, `InstituicaoResponse`.

---

#### 📌 US02 — Registo e Rastreabilidade de Lotes de Hemocomponentes

> **ID:** US02  
> **Sprint:** 01 / Entrega 02  
> **Título:** Registo de Lotes com Validade Automática e Fila FEFO  

* **Como:** Gestor(a) de Hemocentro ou Operador(a) de Agência Transfusional
* **Quero:** Registar novos lotes de hemocomponentes recolhidos indicando tipo sanguíneo, quantidade e data de recolha
* **Para:** Garantir a rastreabilidade do stock, cálculo automático da data de expiração por componente e priorização de saída via FEFO (*First Expire, First Out*).

**Critérios de Aceitação:**
* [x] Geração automática do código identificador único do lote (ex.: `LT-XXXXXXXX`).
* [x] Cálculo automático da data de validade com base no prazo padrão do componente:
  * Plaquetas: 5 dias
  * Concentrado de Hemácias: 42 dias
  * Plasma / Crioprecipitado: 365 dias
* [x] Permissão para ajuste manual da data de validade (não retroativa).
* [x] Bloqueio de datas de recolha futuras.
* [x] Ordenação cronológica por expiração para consumo (Fila FEFO).

**Evidências de Implementação (POO / Backend):**
* **Modelo:** `LoteHemocomponente` (relacionamento `@ManyToOne` com `Instituicao`).
* **Enums:** `TipoComponente` (com atributo `diasValidadePadrao`), `TipoSanguineo`.
* **Camadas:** `LoteHemocomponenteRepository`, `LoteHemocomponenteService`, `LoteHemocomponenteController` (`/api/v1/lotes`).
* **DTOs:** `NovoLoteRequest`, `AtualizarLoteRequest`, `LoteResponse`.

---

#### 📌 US04 — Emissão e Controlo de Requisições Hospitalares

> **ID:** US04  
> **Sprint:** 02 / Entrega 02  
> **Título:** Emissão de Solicitações Hospitalares com Classificação de Urgência  

* **Como:** Médico(a) ou Responsável de Unidade Solicitante (Hospital/UPA)
* **Quero:** Emitir uma requisição especificando o hemocomponente e o nível de urgência (Rotina, Prioritária ou Emergência)
* **Para:** Notificar a central de regulação para atendimento ágil da procura e priorização dos casos críticos de transfusão.

**Critérios de Aceitação:**
* [x] Vinculação obrigatória a uma instituição solicitante cadastrada.
* [x] Atribuição automática de código de requisição único (ex.: `REQ-XXXXXXXX`).
* [x] Definição do estado inicial obrigatório como `PENDENTE`.
* [x] Endpoint específico para atualização de estado (`PATCH` para aprovação/recusa).

**Evidências de Implementação (POO / Backend):**
* **Modelo:** `Requisicao` (relacionamento com `Instituicao`).
* **Enums:** `NivelUrgencia`, `StatusRequisicao`.
* **Camadas:** `RequisicaoRepository`, `RequisicaoService`, `RequisicaoController` (`/api/v1/requisicoes`).
* **DTOs:** `NovaRequisicaoRequest`, `AtualizarRequisicaoRequest`, `RequisicaoResponse`.