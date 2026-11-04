# Reimplementação da Compatibilidade Sanguínea em Java

## 1. Objetivo

Documentar a implementação da compatibilidade sanguínea ABO/Rh em Java no projeto Código Vermelho / Rota Vital, explicando a correspondência entre os conceitos utilizados em C/C++ e Java.

## 2. Implementação em Java

A compatibilidade sanguínea está implementada na classe `CompatibilidadeSanguinea.java`, localizada em:

`backend/src/main/java/com/codigovermelho/services/`

O método principal é:

```java
public static boolean compativel(TipoSanguineo doador, TipoSanguineo receptor) {
    exigirPreenchido(doador, receptor);
    return aboCompativel(doador, receptor) && rhCompativel(doador, receptor);
}
```

Esse método recebe o tipo sanguíneo do doador e do receptor e retorna `true` quando ambos são compatíveis ou `false` quando são incompatíveis.

## 3. Regras de compatibilidade

Para concentrado de hemácias, a implementação considera:

- Tipo O: pode doar para O, A, B e AB.
- Tipo A: pode doar para A e AB.
- Tipo B: pode doar para B e AB.
- Tipo AB: pode doar apenas para AB.
- Rh negativo: pode doar para receptores Rh negativo e positivo, respeitando o sistema ABO.
- Rh positivo: pode doar apenas para receptores Rh positivo, respeitando o sistema ABO.

A compatibilidade é confirmada somente quando as regras ABO e Rh são atendidas simultaneamente.

## 4. Tradução dos conceitos C/C++ para Java

| C/C++ | Java |
|---|---|
| `bool` | `boolean` |
| `enum` | `enum TipoSanguineo` |
| Funções de compatibilidade | Métodos estáticos |
| `if` e `switch` | Condicionais e expressões `switch` |
| Vetores e listas | `List<TipoSanguineo>` |
| Tratamento de entradas inválidas | `IllegalArgumentException` |

A implementação Java organiza as verificações ABO e Rh em métodos separados, facilitando a leitura, os testes e a manutenção.

## 5. Testes e validação

O projeto possui os arquivos:

- `CompatibilidadeSanguineaTest.java`
- `CompatibilidadeMatrizTest.java`

Os testes existentes verificam as regras de compatibilidade, incluindo os 64 pares possíveis entre os oito tipos sanguíneos e os 27 pares considerados compatíveis.

Os arquivos de teste foram identificados, mas sua execução ainda precisa ser confirmada.

## 6. Conclusão

A implementação Java existente representa as regras de compatibilidade sanguínea ABO/Rh e pode ser reutilizada pelo sistema sem duplicação de código.

A documentação apresenta a equivalência conceitual entre C/C++ e Java. Como não foi localizado um código C/C++ original específico da compatibilidade, não foi possível comprovar uma tradução linha a linha.

A solução preserva a organização atual do projeto e facilita futuras verificações e manutenções.