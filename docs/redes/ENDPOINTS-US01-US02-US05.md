# Definição de Endpoints REST — US01, US02, US05

Levantamento dos endpoints, métodos HTTP, padrão de URLs e parâmetros necessários para as histórias de usuário US01 (Cadastro de Unidades), US02 (Gestão de Inventário) e US05 (Roteirização Logística). Base para a implementação dos controllers em Spring Boot (POO).

## US01 — Cadastro de Unidades

| Método | Caminho | Parâmetros | Descrição |
|---|---|---|---|
| `POST` | `/api/v1/instituicoes` | body: `nome`, `tipo`, `endereco`, `latitude`, `longitude`, `estoqueMinimoPorTipo` | Cadastra uma nova instituição |
| `GET` | `/api/v1/instituicoes` | query opcional: `tipo` | Lista as instituições cadastradas |
| `GET` | `/api/v1/instituicoes/{id}` | path: `id` | Consulta os detalhes de uma instituição |
| `PUT` | `/api/v1/instituicoes/{id}` | path: `id`; body com os mesmos campos do cadastro | Atualiza uma instituição |
| `DELETE` | `/api/v1/instituicoes/{id}` | path: `id` | Remove uma instituição |

## US02 — Gestão de Inventário

| Método | Caminho | Parâmetros | Descrição |
|---|---|---|---|
| `POST` | `/api/v1/instituicoes/{id}/lotes` | body: `tipoSanguineo`, `componente`, `dataColeta`, `validade` opcional, `quantidade` | Registra um novo lote no estoque |
| `GET` | `/api/v1/instituicoes/{id}/lotes` | path: `id` | Lista os lotes de uma instituição |
| `GET` | `/api/v1/lotes` | query opcional: `tipoSanguineo`, `componente`, `validadeAte` | Lista lotes com filtros |
| `GET` | `/api/v1/lotes/{id}` | path: `id` | Consulta um lote |
| `PATCH` | `/api/v1/lotes/{id}` | path: `id`; body: `validade` | Atualiza a validade de um lote |
| `DELETE` | `/api/v1/lotes/{id}` | path: `id` | Remove um lote |

> **Decisão:** o modelo atual não possui `status` de lote. A implementação não inventa esse atributo; o `PATCH` da U1 altera somente `validade`, conforme a história US02 define como editável.

## US05 — Roteirização Logística

Cálculo de rotas entre unidades utilizando algoritmos de caminho mínimo (algoritmo entregue pela disciplina de AED; RSD/POO apenas expõem o resultado).

| Método | Caminho | Parâmetros | Descrição |
|---|---|---|---|
| `GET` | `/api/v1/rotas` | query: `origemId`, `destinoId` | Calcula a rota de menor custo entre duas unidades |

> **Ressalva:** este levantamento cobre o que está descrito na US tal como redigida (rota entre duas unidades quaisquer). Caso o time decida que a rota precisa estar associada a uma requisição hospitalar específica, um segundo endpoint pode ser necessário. Pendente de confirmação com as disciplinas de AED e POO.

## Notas de decisão

- **Unidade → `PUT`**: os campos costumam ser atualizados juntos (localização e capacidade em uma única edição).
- **Bolsa → `PATCH`**: é comum atualizar apenas um campo por vez (ex.: só o status, quando a bolsa é usada ou descartada).
