# 🗂️ Diagrama de Entidades e Relacionamentos — Código Vermelho

Este diagrama representa as entidades do domínio, seus atributos e os relacionamentos entre elas, com as respectivas cardinalidades.

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