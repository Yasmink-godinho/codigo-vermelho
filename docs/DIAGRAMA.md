# 🗂️ Diagrama de Entidades e Relacionamentos (ERD) — Rota Vital / Código Vermelho

> ⚠️ **Este é o Modelo de Dados (ERD)** — representa **o que será persistido no banco de dados**: entidades, atributos, chaves primárias/estrangeiras (`PK`/`FK`) e cardinalidades. É diferente do **Modelo de Domínio conceitual**, que representa os conceitos e regras do negócio antes de decidir o que vira tabela (ver [`MODELO_DOMINIO.md`](MODELO_DOMINIO.md)).
>
> Por exemplo: `Rota` é um conceito central do domínio (origem → destino → distância), mas **não aparece neste ERD** porque a decisão do projeto foi não persistir rotas — elas são calculadas em tempo real pelo algoritmo de Dijkstra a partir de estruturas de grafo (`Node`/`Edge`/`Graph`), e não uma tabela do banco. Isso está detalhado no `MODELO_DOMINIO.md` e em [`USO_RESULTADO_ROTA.md`](USO_RESULTADO_ROTA.md).

Este diagrama representa as entidades do domínio, seus atributos e os relacionamentos entre elas, com as respectivas cardinalidades.

> 💡 O código abaixo está em [Mermaid](https://mermaid.js.org/) (`erDiagram`). O GitHub renderiza este bloco automaticamente como uma imagem ao visualizar este arquivo no navegador — não precisa de nenhuma ferramenta extra para ver o desenho.

```mermaid
erDiagram
  INSTITUICAO ||--o{ ESTOQUE_MINIMO : possui
  INSTITUICAO ||--o{ LOTE : possui
  INSTITUICAO ||--o{ USUARIO : emprega
  INSTITUICAO ||--o{ REQUISICAO : emite
  INSTITUICAO ||--o{ REDISTRIBUICAO : origem_destino
  LOTE ||--o{ REDISTRIBUICAO : gera
  REDISTRIBUICAO |o--o| TRANSFERENCIA : gera
  REQUISICAO |o--o| TRANSFERENCIA : gera
  TRANSFERENCIA ||--o{ LEITURA_TELEMETRIA : recebe
  INSTITUICAO ||--o{ ALERTA : dispara
  LOTE ||--o{ ALERTA : dispara
  TRANSFERENCIA ||--o{ ALERTA : dispara

  INSTITUICAO {
    long id PK
    string nome
    enum tipoInstituicao
    string endereco
    double latitude
    double longitude
    enum status
  }
  ESTOQUE_MINIMO {
    long id PK
    long instituicao_id FK
    enum tipoSanguineo
    int quantidadeMinima
  }
  LOTE {
    long id PK
    string codigoLote
    long instituicao_id FK
    enum tipoSanguineo
    enum componente
    date dataColeta
    date dataValidade
    int quantidade
  }
  USUARIO {
    long id PK
    string nomeCompleto
    string email
    string senha
    enum tipoUsuario
    long instituicao_id FK
  }
  REQUISICAO {
    long id PK
    string codigoRequisicao
    long instituicao_id FK
    long usuario_id FK
    enum tipoSanguineo
    enum componente
    int volume
    enum nivelUrgencia
    enum status
  }
  REDISTRIBUICAO {
    long id PK
    long instituicaoOrigem_id FK
    long instituicaoDestino_id FK
    long lote_id FK
    enum tipoSanguineo
    int quantidade
    enum status
  }
  TRANSFERENCIA {
    long id PK
    long redistribuicao_id FK
    long requisicao_id FK
    long instituicaoOrigem_id FK
    long instituicaoDestino_id FK
    string transportador
    double distanciaKm
    enum statusTransferencia
  }
  LEITURA_TELEMETRIA {
    long id PK
    long transferencia_id FK
    double temperatura
    datetime timestamp
    enum statusLeitura
  }
  ALERTA {
    long id PK
    enum tipoAlerta
    enum categoria
    string mensagem
    enum statusResolucao
  }
```

---

## 📎 Legenda de cardinalidade (notação Mermaid)

| Símbolo | Significado |
|---|---|
| `\|\|` | Exatamente um (obrigatório) |
| `\|o` | Zero ou um (opcional) |
| `o{` | Zero ou muitos |
| `\|{` | Um ou muitos |

Exemplo: `INSTITUICAO \|\|--o{ LOTE : possui` → uma Instituição possui zero ou muitos Lotes.