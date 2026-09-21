# 🗺️ Uso do Resultado da Rota pela Aplicação

Este documento define o **contrato de saída** do algoritmo de roteirização (Dijkstra, implementado na disciplina de AED) e como esse resultado é consumido pela aplicação (POO), até chegar ao frontend.

---

## 1. Contrato de saída do algoritmo (AED → POO)

O algoritmo de caminho mínimo devolve um objeto padronizado, que serve de ponte entre a lógica de grafos (AED) e as regras de negócio da aplicação (POO):

```java
record RotaResultado(
    List<Long> instituicoesIds,      // caminho ordenado (origem → ... → destino)
    double distanciaTotalKm,
    double tempoEstimadoMinutos,
    boolean rotaEncontrada           // false se não existe caminho na malha
) {}
```

---

## 2. Onde, na aplicação, esse resultado é usado

| Situação | O que acontece |
|---|---|
| Uma Redistribuição é aprovada (US09) | `TransferenciaService` chama `RotaService.calcularRota(origemId, destinoId)` |
| Uma Requisição é atendida (US04) | Mesmo fluxo, disparado a partir da requisição em vez da redistribuição |
| `rotaEncontrada = true` | O service usa `distanciaTotalKm` e `tempoEstimadoMinutos` para preencher os campos `distanciaKm` e `previsaoChegada` da entidade `Transferência` |
| `rotaEncontrada = false` | A `Transferência` **não é criada** — o sistema recusa a operação e retorna "não há rota disponível" (cenário negativo da US05) |
| Depois de salva | O `Controller` (`@RestController`) devolve a `Transferência` como JSON para o frontend |

---

## 3. Fluxo completo

```
Grafo da malha logística
        │
        ▼
Algoritmo de Dijkstra (AED)
        │
        ▼
RotaResultado (DTO)
        │
        ▼
TransferenciaService (POO) — consome o resultado da rota
        │
        ▼
Transferência persistida — rota e distância salvas
        │
        ▼
API REST → Frontend — exibe rota na tela
```

---

## 4. Formato devolvido pela API (JSON de exemplo)

```json
{
  "id": 1029,
  "instituicaoOrigem": "Hospital da Restauração",
  "instituicaoDestino": "Hospital Univ. Oswaldo Cruz",
  "tipoSanguineo": "O-",
  "quantidade": 3,
  "rota": "Via Av. Agamenon Magalhães",
  "distanciaKm": 8.4,
  "previsaoChegada": "2026-09-05T09:52:00",
  "statusTransferencia": "EM_TRANSPORTE"
}
```

---

## 5. Como o frontend consome esse JSON

```jsx
const [transferencia, setTransferencia] = useState(null);

useEffect(() => {
  fetch(`http://localhost:8080/api/v1/transferencias/${id}`)
    .then(res => res.json())
    .then(data => setTransferencia(data));
}, [id]);

// no JSX:
<p>Via {transferencia.rota} — {transferencia.distanciaKm} km</p>
```

---

## 6. Onde isso aparece na interface (referência: protótipo)

| Campo na tela | Vem de qual campo do JSON |
|---|---|
| "Rota" → "Via Av. Agamenon Magalhães — 8,4 km" | `rota` + `distanciaKm` |
| "Previsão de chegada" → "09:52" | `previsaoChegada` (formatado, só a hora) |
| Linha do tempo (Solicitação → Análise → Aprovada → Em transporte → Entregue) | `statusTransferencia`, atualizado conforme o fluxo avança |

O back-end envia apenas **dados brutos** (distância, texto da rota, horário), a formatação visual e o layout ficam a cargo do frontend.

---

## 7.  como o resultado da rota será utilizado pela aplicação

O resultado da rota é utilizado de **3 formas** dentro da aplicação:

1. **Persistência** — vira dado salvo nos campos `rota`, `distanciaKm` e `previsaoChegada` de uma `Transferência`.
2. **Decisão de negócio** — determina se a transferência pode ou não ser criada (`rotaEncontrada`).
3. **Exibição** — é devolvido pela API REST e mostrado na tela para o usuário final.