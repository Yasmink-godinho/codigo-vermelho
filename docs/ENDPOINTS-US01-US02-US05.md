# Definição de Endpoints REST — US01, US02, US05

Levantamento dos endpoints, métodos HTTP, padrão de URLs e parâmetros necessários para as histórias de usuário US01 (Cadastro de Unidades), US02 (Gestão de Inventário) e US05 (Roteirização Logística). Base para a implementação dos controllers em Spring Boot (POO).

## US01 — Cadastro de Unidades

Cadastro de hemocentros e hospitais, incluindo localização e parâmetros de estoque.

| Método | Caminho | Parâmetros | Descrição |
|---|---|---|---|
| `POST` | `/api/v1/unidades` | body: `nome`, `tipo` (`HEMOCENTRO`\|`HOSPITAL`\|`PONTO_COLETA`), `localizacao`, `capacidadeEstoque` | Cadastra uma nova unidade |
| `GET` | `/api/v1/unidades` | query: `tipo`, `page`, `size` | Lista as unidades cadastradas |
| `GET` | `/api/v1/unidades/{id}` | path: `id` | Consulta os detalhes de uma unidade |
| `PUT` | `/api/v1/unidades/{id}` | path: `id`; body: `nome`, `tipo`, `localizacao`, `capacidadeEstoque` | Atualiza os dados de uma unidade |
| `DELETE` | `/api/v1/unidades/{id}` | path: `id` | Remove uma unidade |

## US02 — Gestão de Inventário

Registro e gerenciamento dos lotes de bolsas de sangue, incluindo validade e classificação ABO/Rh.

| Método | Caminho | Parâmetros | Descrição |
|---|---|---|---|
| `POST` | `/api/v1/bolsas` | body: `unidadeId`, `tipoSanguineo`, `componente`, `dataColeta`, `validade` | Registra uma nova bolsa no estoque |
| `GET` | `/api/v1/bolsas` | query: `tipoSanguineo`, `componente`, `validadeAte`, `status`, `page`, `size` | Lista bolsas do estoque com filtros |
| `GET` | `/api/v1/bolsas/{id}` | path: `id` | Consulta os detalhes de uma bolsa |
| `PATCH` | `/api/v1/bolsas/{id}` | path: `id`; body: `status`, `validade` (campos parciais) | Atualiza status/validade de uma bolsa |
| `DELETE` | `/api/v1/bolsas/{id}` | path: `id` | Descarta/remove uma bolsa |
| `GET` | `/api/v1/unidades/{id}/bolsas` | path: `id` (da unidade); query: `tipoSanguineo`, `status`, `page`, `size` | Consulta o estoque de uma unidade específica |

## US05 — Roteirização Logística

Cálculo de rotas entre unidades utilizando algoritmos de caminho mínimo (algoritmo entregue pela disciplina de AED; RSD/POO apenas expõem o resultado).

| Método | Caminho | Parâmetros | Descrição |
|---|---|---|---|
| `GET` | `/api/v1/rotas` | query: `origemId`, `destinoId` | Calcula a rota de menor custo entre duas unidades |

> **Ressalva:** este levantamento cobre o que está descrito na US tal como redigida (rota entre duas unidades quaisquer). Caso o time decida que a rota precisa estar associada a uma requisição hospitalar específica, um segundo endpoint pode ser necessário. Pendente de confirmação com as disciplinas de AED e POO.

## Notas de decisão

- **Unidade → `PUT`**: os campos costumam ser atualizados juntos (localização e capacidade em uma única edição).
- **Bolsa → `PATCH`**: é comum atualizar apenas um campo por vez (ex.: só o status, quando a bolsa é usada ou descartada).
