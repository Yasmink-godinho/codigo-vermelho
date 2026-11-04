# Matriz de Compatibilidade ABO/Rh

Backlog: **PI3E2-46** (subtarefa de PI3E2-29), Implementar matriz de compatibilidade ABO/Rh.
Responsável: Diogo.

Este documento registra as regras didáticas de compatibilidade adotadas no Código Vermelho,
a matriz completa (8 doadores por 8 receptores) e onde cada parte está no código. A matriz abaixo
foi gerada executando a classe `CompatibilidadeSanguinea` do backend, e não escrita à mão.

---

## 1. Escopo

A regra responde a uma pergunta: **a bolsa de um doador pode ser transfundida em um receptor?**
Ela é usada pelo matching imunológico (US08) para barrar alocações incompatíveis entre uma
requisição e um lote do estoque, e para sugerir lotes alternativos quando a alocação é recusada.

A regra é didática. Ela serve ao projeto acadêmico e não substitui os protocolos de um banco de
sangue real (ver a seção 7).

---

## 2. Regras adotadas

### R1. Sistema ABO

| Grupo do doador | Pode doar para os grupos |
| --------------- | ------------------------ |
| O  | O, A, B, AB (doa para todos) |
| A  | A, AB |
| B  | B, AB |
| AB | AB (só doa para AB) |

### R2. Fator Rh

Só existe incompatibilidade quando o **doador é Rh+ e o receptor é Rh-**.
Um doador Rh- pode doar para receptor Rh+ ou Rh-.

### R3. Compatibilidade final

```text
compatível(doador, receptor) = R1(ABO) E R2(Rh)
```

As duas regras precisam ser satisfeitas. Se uma falha, o par é incompatível e o sistema devolve
o motivo (ABO ou Rh).

### R4. Hemocomponente

Na alocação de um lote a uma requisição (`AlocacaoCompatibilidade.verificar`), o hemocomponente do
lote precisa ser **igual** ao solicitado (Concentrado de Hemácias, Plasma, Plaquetas ou
Crioprecipitado). Depois dessa checagem, a mesma matriz ABO/Rh é aplicada a qualquer componente.

### R5. Dados inválidos

Tipo sanguíneo ausente, ou fora dos 8 tipos, é recusado. Na API, um tipo inválido retorna `400`.

---

## 3. A matriz

`S` = compatível, `N` = incompatível. Linhas são o **doador**, colunas são o **receptor**.

| Doador \ Receptor | O- | O+ | A- | A+ | B- | B+ | AB- | AB+ | Receptores atendidos |
| ----------------- | -- | -- | -- | -- | -- | -- | --- | --- | -------------------- |
| **O-**  | S | S | S | S | S | S | S | S | 8 |
| **O+**  | N | S | N | S | N | S | N | S | 4 |
| **A-**  | N | N | S | S | N | N | S | S | 4 |
| **A+**  | N | N | N | S | N | N | N | S | 2 |
| **B-**  | N | N | N | N | S | S | S | S | 4 |
| **B+**  | N | N | N | N | N | S | N | S | 2 |
| **AB-** | N | N | N | N | N | N | S | S | 2 |
| **AB+** | N | N | N | N | N | N | N | S | 1 |

Total: **27 pares compatíveis em 64**.

### Leitura pela coluna (quem pode doar para cada receptor)

| Receptor | Doadores compatíveis | Quantidade |
| -------- | -------------------- | ---------- |
| O-  | O- | 1 |
| O+  | O-, O+ | 2 |
| A-  | O-, A- | 2 |
| A+  | O-, O+, A-, A+ | 4 |
| B-  | O-, B- | 2 |
| B+  | O-, O+, B-, B+ | 4 |
| AB- | O-, A-, B-, AB- | 4 |
| AB+ | os 8 tipos | 8 |

### Pontos que a matriz confirma

- **O-** é o doador universal: a linha inteira é `S`.
- **AB+** é o receptor universal: a coluna inteira é `S`.
- Todo tipo é compatível com ele mesmo: a diagonal inteira é `S`.
- Um doador Rh+ nunca atende um receptor Rh-.

---

## 4. Exemplos de resposta da API

A recusa devolve o motivo, para o operador entender por que a bolsa não serve.

| Doador | Receptor | Resultado | Motivo devolvido |
| ------ | -------- | --------- | ---------------- |
| O-  | AB+ | compatível | `Compativel: O- pode doar para AB+` |
| A+  | O+  | incompatível | `Incompativel no sistema ABO: A+ nao pode doar para O+` |
| O+  | O-  | incompatível | `Incompativel no fator Rh: doador Rh+ nao pode doar para receptor Rh-` |

Quando ABO e Rh falham ao mesmo tempo, o motivo informado é o do ABO, porque ele é verificado primeiro.

---

## 5. Onde está no código

| Parte | Arquivo |
| ----- | ------- |
| Regra pura (sem Spring, sem banco) | `backend/src/main/java/com/codigovermelho/services/CompatibilidadeSanguinea.java` |
| Regra aplicada a requisição e lote (hemocomponente + ABO/Rh + alternativas) | `backend/src/main/java/com/codigovermelho/services/AlocacaoCompatibilidade.java` |
| Endpoints | `backend/src/main/java/com/codigovermelho/controllers/CompatibilidadeController.java` |
| Tipos sanguíneos | `backend/src/main/java/com/codigovermelho/models/enums/TipoSanguineo.java` |
| Tela de verificação | `frontend/src/pages/VerificacaoCompatibilidade.tsx` |

Endpoints:

| Endpoint | Para que serve |
| -------- | -------------- |
| `GET /api/v1/compatibilidade?doador=O-&receptor=AB+` | Resultado e motivo para um par |
| `GET /api/v1/compatibilidade/doadores?receptor=AB+` | Lista de doadores compatíveis com um receptor (uma coluna da matriz) |
| `GET /api/v1/compatibilidade/alocacao?requisicaoId=1&loteId=2` | Avalia um lote contra uma requisição |
| `GET /api/v1/compatibilidade/alocacao/tipos?tipoRequisicao=A%2B&tipoLote=O-&componente=CONCENTRADO_HEMACIAS` | Avalia por tipos e componente, sem precisar de ids |

---

## 6. Testes

| Teste | O que cobre |
| ----- | ----------- |
| `CompatibilidadeSanguineaTest` | Regras isoladas: doador e receptor universais, ABO, Rh, motivos, valores nulos |
| `CompatibilidadeHttpTest` | Endpoints: status 200, status 400 para tipo inválido, lista de doadores |
| `compatibilidade.feature` | Cenários de aceitação em Gherkin |
| `CompatibilidadeMatrizTest` (novo) | As **64 células** comparadas com uma tabela de referência independente, o total de 27 pares, a diagonal e a lista de doadores de cada receptor |

O `CompatibilidadeMatrizTest` usa uma tabela de referência escrita separadamente das regras R1 e R2.
Se alguém alterar a regra e uma célula mudar, o teste aponta qual par ficou errado
(por exemplo: `Celula errada: doador A+ -> receptor A-`).

Para rodar:

```bash
cd backend
./mvnw test -Dtest=CompatibilidadeMatrizTest
```

---

## 7. Limites do modelo didático

- A matriz é a de **concentrado de hemácias**. Ela é reutilizada para os outros hemocomponentes.
  Na prática clínica, o plasma segue o sentido inverso do ABO (o plasma AB é o universal, e o plasma O
  só serve para receptor O), e as plaquetas preferem tipo ABO idêntico. O projeto adota uma única matriz
  por simplicidade, e essa decisão fica registrada aqui.
- Não há outros sistemas de grupo sanguíneo (Kell, Duffy e outros), nem variantes do Rh.
- Não há prova cruzada nem protocolo de emergência com sangue não tipado.
- O resultado orienta o sistema. A decisão de transfundir continua sendo clínica.

### Divergência encontrada na documentação existente

- `docs/poo/HISTORIAS_IMPLEMENTADAS_ENTREGA_3.md` diz que a validação ocorre "por tipo de componente
  (Concentrado de Hemácias, Plasma e Plaquetas)". O código atual exige apenas que o componente do lote
  seja igual ao solicitado e aplica a mesma matriz a todos. A descrição desse arquivo poderia ser
  ajustada para refletir isso.
- `docs/poo/CONTRATOS_API.md` (seção US08) cita `GET /api/v1/compatibilidade?tipoRequisicao=...&tipoLote=...`.
  No código, esse formato existe em `/api/v1/compatibilidade/alocacao`, e a consulta simples usa
  `doador` e `receptor`.
