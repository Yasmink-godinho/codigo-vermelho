# Status do Backend/POO — Unidade 1

## Implementado

- CRUD de `Instituicao`: POST, GET, GET/{id}, PUT/{id}, DELETE/{id}.
- CRUD de `LoteHemocomponente`: cadastro, listagem, consulta, atualização de validade e remoção.
- Consulta de lotes por instituição.
- Filtros de lotes por tipo sanguíneo, componente e validade limite.
- Fila FEFO existente preservada e exposta por endpoint; Dijkstra/rotas não foram implementados.
- DTOs de entrada e saída para instituições e lotes.
- Validação de entrada com Jakarta Bean Validation nos DTOs.
- Regras de domínio existentes preservadas nas entidades.
- Tratamento global de erros 400 e 404.
- Testes de entidade e testes HTTP com MockMvc para os principais fluxos.
- CRUD de `Requisicao` (US04) revisado: emissão, listagem (com filtro por
  `status` e `urgencia`, conforme `docs/CONTRATOS_API.md`) e detalhe por id.
- `RequisicaoResponse` criado para não expor a entidade `Requisicao`
  diretamente (o projeto usa `spring.jpa.open-in-view=false`; devolver a
  entidade quebraria a serialização do relacionamento lazy com `Instituicao`).
- `Requisicao.instituicaoSolicitante` alterado de `LAZY` para `EAGER`,
  seguindo a mesma decisão já usada em `LoteHemocomponente.instituicao`.
- Testes de entidade e de Controller adicionados para `Requisicao`.
- `pom.xml` corrigido: os starters de teste modulares do Spring Boot 4
  (`*-test`) não trazem JUnit Jupiter nem Mockito por padrão — apenas o
  starter clássico `spring-boot-starter-test` os inclui. Como os testes de
  Controller usam `org.mockito.Mockito`, `junit-jupiter` e `mockito-core`
  foram adicionados explicitamente como dependência de teste; sem isso, a
  compilação dos testes falharia.

## Decisões

- As URLs públicas seguem `docs/CONTRATOS_API.md`: `/api/v1/instituicoes` e `/api/v1/lotes`.
- O relacionamento instituição → lotes permanece em `/api/v1/instituicoes/{id}/lotes`.
- O modelo atual não possui `status` de lote. Portanto, o PATCH altera somente `validade`; nenhum atributo novo de domínio foi inventado.
- Dijkstra/roteirização e demais funcionalidades de U2 ficaram fora desta implementação.

## Validação de execução

O Maven Wrapper e o Maven instalado via `apt` foram testados neste ambiente de auditoria. Em ambos os casos, o download das dependências do `spring-boot-starter-parent` a partir do Maven Central (`repo.maven.apache.org`) foi bloqueado pela rede do ambiente (erro 403). Por isso, **não foi possível compilar nem rodar os testes fisicamente nesta sessão** — nem os que já existiam, nem os novos.

Isso significa que a revisão de código feita aqui (Requisicao, DTOs, pom.xml) foi validada por leitura estática e cruzamento manual de tipos/assinaturas, não por build real. É importante rodar `mvn test` (ou `./mvnw test`) em uma máquina com acesso ao Maven Central antes de considerar esta etapa fechada.

Com Maven/JDK disponíveis e acesso às dependências, executar:

```bash
./mvnw test
```

No Windows PowerShell:

```powershell
.\mvnw.cmd test
```

## Fora do escopo de João nesta etapa

- Lista/Fila/Pilha em C/C++ e Java de AED.
- Estatística, dataset, gráficos e painel.
- CI/CD e deploy.
- Threads e medições de concorrência.
- Topologia de RSD.
- Dijkstra/roteirização, FEFO completo, Hash e compatibilidade ABO/Rh.
- Funcionalidades específicas da Unidade 2.
