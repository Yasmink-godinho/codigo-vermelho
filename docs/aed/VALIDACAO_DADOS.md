# ✅ Validação de Dados das Funcionalidades

Este documento define as regras de validação necessárias para cada entidade do domínio, usando **Jakarta Bean Validation** (dependência `Validation`, já incluída no `pom.xml`). As regras derivam diretamente dos cenários negativos já especificados em [`HISTORIAS_USUARIO.md`](HISTORIAS_USUARIO.md).

---

## Instituição

| Campo | Regra | Anotação | Mensagem de erro |
|---|---|---|---|
| nome | Obrigatório | `@NotBlank` | "Nome da instituição é obrigatório" |
| tipoInstituicao | Obrigatório | `@NotNull` | "Tipo de instituição é obrigatório" |
| endereco | Obrigatório | `@NotBlank` | "Endereço é obrigatório" |
| latitude | Entre -90 e 90 | `@NotNull @DecimalMin("-90.0") @DecimalMax("90.0")` | "Coordenadas inválidas" |
| longitude | Entre -180 e 180 | `@NotNull @DecimalMin("-180.0") @DecimalMax("180.0")` | "Coordenadas inválidas" |
| status | Obrigatório | `@NotNull` | "Status é obrigatório" |

*(Referência: US01, Cenário 2 — coordenadas inválidas)*

---

## Lote

| Campo | Regra | Anotação | Mensagem de erro |
|---|---|---|---|
| codigoLote | Obrigatório | `@NotBlank` | "Código do lote é obrigatório" |
| tipoSanguineo | Obrigatório | `@NotNull` | "Tipo sanguíneo é obrigatório" |
| componente | Obrigatório | `@NotNull` | "Componente é obrigatório" |
| dataColeta | Obrigatória, não futura | `@NotNull @PastOrPresent` | "Data de coleta inválida" |
| dataValidade | Obrigatória, não retroativa | `@NotNull @FutureOrPresent` | "Data de validade não pode ser retroativa" |
| quantidade | Mínimo 1 | `@NotNull @Min(1)` | "Quantidade deve ser maior que zero" |

*(Referência: US02, Cenário 2 — validade retroativa)*

> ⚠️ Validação adicional: `dataValidade` deve ser posterior a `dataColeta`. Implementar com validador customizado (`@AssertTrue` em método `isValidadeAposColeta()` na entidade, ou um `@Constraint` customizado).

---

## Usuário

| Campo | Regra | Anotação | Mensagem de erro |
|---|---|---|---|
| nomeCompleto | Obrigatório | `@NotBlank` | "Nome completo é obrigatório" |
| email | Obrigatório, formato válido | `@NotBlank @Email` | "E-mail inválido" |
| senha | Mínimo 8 caracteres | `@NotBlank @Size(min = 8)` | "Senha deve ter no mínimo 8 caracteres" |
| tipoUsuario | Obrigatório | `@NotNull` | "Tipo de usuário é obrigatório" |

---

## Requisição

| Campo | Regra | Anotação | Mensagem de erro |
|---|---|---|---|
| instituicao_id | Obrigatório | `@NotNull` | "Instituição solicitante é obrigatória" |
| tipoSanguineo | Obrigatório | `@NotNull` | "Tipo sanguíneo é obrigatório" |
| componente | Obrigatório | `@NotNull` | "Componente é obrigatório" |
| volume | Mínimo 1 | `@NotNull @Min(1)` | "Volume deve ser maior que zero" |
| nivelUrgencia | Obrigatório | `@NotNull` | "Nível de urgência é obrigatório" |

*(Referência: US04, Cenário 2 — campos obrigatórios ausentes)*

---

## Redistribuição

| Campo | Regra | Anotação | Mensagem de erro |
|---|---|---|---|
| instituicaoOrigem_id | Obrigatório | `@NotNull` | "Instituição de origem é obrigatória" |
| instituicaoDestino_id | Obrigatório, diferente da origem | `@NotNull` + validação customizada | "Origem e destino não podem ser a mesma instituição" |
| tipoSanguineo | Obrigatório | `@NotNull` | "Tipo sanguíneo é obrigatório" |
| quantidade | Mínimo 1 | `@NotNull @Min(1)` | "Quantidade deve ser maior que zero" |

---

## Transferência

| Campo | Regra | Anotação | Mensagem de erro |
|---|---|---|---|
| instituicaoOrigem_id / instituicaoDestino_id | Obrigatórios | `@NotNull` | "Origem e destino são obrigatórios" |
| quantidade | Mínimo 1 | `@NotNull @Min(1)` | "Quantidade deve ser maior que zero" |
| distanciaKm | Não negativa | `@PositiveOrZero` | "Distância inválida" |

*(Referência: US05, Cenário 2 — unidades sem conexão → `rotaEncontrada = false`, ver `USO_RESULTADO_ROTA.md`)*

---

## Leitura de Telemetria

| Campo | Regra | Anotação | Mensagem de erro |
|---|---|---|---|
| temperatura | Obrigatória | `@NotNull` | "Temperatura é obrigatória" |
| timestamp | Obrigatório, não futuro | `@NotNull @PastOrPresent` | "Data/hora inválida" |

> ℹ️ Temperatura fora da faixa seguro (2–6°C) **não é rejeitada** pela validação — ela é aceita e **dispara um Alerta** (US07, Cenário 2). Isso é regra de negócio no `Service`, não validação de entrada.

---

## Alerta

| Campo | Regra | Anotação | Mensagem de erro |
|---|---|---|---|
| tipoAlerta | Obrigatório | `@NotNull` | "Tipo de alerta é obrigatório" |
| categoria | Obrigatório | `@NotNull` | "Categoria do alerta é obrigatória" |
| mensagem | Obrigatória | `@NotBlank` | "Mensagem do alerta é obrigatória" |

---

## Exemplo de implementação (entidade + validação)

```java
@Entity
public class Lote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Código do lote é obrigatório")
    private String codigoLote;

    @NotNull(message = "Tipo sanguíneo é obrigatório")
    @Enumerated(EnumType.STRING)
    private TipoSanguineo tipoSanguineo;

    @NotNull(message = "Componente é obrigatório")
    @Enumerated(EnumType.STRING)
    private Componente componente;

    @NotNull(message = "Data de coleta inválida")
    @PastOrPresent
    private LocalDate dataColeta;

    @NotNull(message = "Data de validade não pode ser retroativa")
    @FutureOrPresent
    private LocalDate dataValidade;

    @NotNull(message = "Quantidade deve ser maior que zero")
    @Min(value = 1, message = "Quantidade deve ser maior que zero")
    private Integer quantidade;

    @AssertTrue(message = "Data de validade deve ser posterior à data de coleta")
    private boolean isValidadeAposColeta() {
        return dataValidade == null || dataColeta == null || dataValidade.isAfter(dataColeta);
    }

    // getters e setters
}
```

E no `Controller`, o `@Valid` ativa essas checagens automaticamente:

```java
@PostMapping("/api/v1/lotes")
public ResponseEntity<Lote> registrarLote(@Valid @RequestBody Lote lote) {
    // se alguma validação falhar, o Spring já devolve 400 Bad Request
    // com as mensagens de erro, antes mesmo de chegar aqui
    return ResponseEntity.status(201).body(loteService.salvar(lote));
}
```

---

## Resumo

| Tipo de validação | Onde é tratada |
|---|---|
| Campos obrigatórios, formatos, limites numéricos | Anotações Bean Validation na entidade (`@NotNull`, `@NotBlank`, `@Min`, etc.) |
| Regras que envolvem mais de um campo (ex: validade após coleta) | `@AssertTrue` na entidade ou validador customizado |
| Regras que dependem de estado do sistema (ex: rota não encontrada, temperatura fora da faixa) | Lógica de negócio no `Service`, não validação de entrada |