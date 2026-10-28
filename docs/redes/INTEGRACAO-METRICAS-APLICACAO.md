# Integração das Métricas de Rede com a Aplicação

**Projeto:** Código Vermelho (Rota Vital) · **Disciplina:** Infraestrutura de Comunicação (RSD) · **História:** US10 (monitoramento de desempenho e rede)
**Base da conferência:** repositório `codigo-vermelho`, branch `main`, commit `91ac764`, conferido em 26/10/2026
**Documentos relacionados:** `METRICAS-E-METODOLOGIA-TESTES-REDE.md` (o que medir), `VALIDACAO-FLUXO-DADOS-TELEMETRIA.md` (percurso dos dados) e `docs/poo/CONTRATOS_API.md` (contratos de API)

---

## 1. Objetivo e conclusão

Este documento verifica **de onde virão os dados do painel de métricas de rede** e **como a aplicação e a infraestrutura vão disponibilizá-los**. Ele termina com um contrato de dados proposto e com as perguntas que precisam ser combinadas com o backend (POO) e com a infraestrutura (SO).

**Conclusão em cinco linhas**

1. Hoje a aplicação **não coleta nenhuma métrica de rede**: não há Actuator, Micrometer, filtro, interceptor nem agendador no backend, e o endpoint `GET /api/v1/rede/status` do contrato não existe.
2. A tela de monitoramento já existe no frontend, com quatro indicadores, gráfico de latência e tabela de serviços, mas **todos os valores são fixos** (por exemplo, 128 req/s e uptime 99,7).
3. A forma mais simples de coletar é o **Spring Boot Actuator com Micrometer**, que já mede cada requisição HTTP por rota, método e status, lido por um endpoint próprio do projeto (`/api/v1/rede/status`).
4. O **uptime não pode ser medido pela própria aplicação**: quando ela cai, ela não registra a queda. É preciso definir o indicador com cuidado (seção 5).
5. A parte de **telemetria do painel já pode ser construída**, porque os endpoints de leituras e alertas existem e estão testados.

---

## 2. O que o painel precisa mostrar

Fontes: US10 (latência média, vazão, taxa de erro, uptime e status de cada endpoint crítico), o PI de RSD (benchmarking de latência, vazão e erros 4xx e 5xx, e painel de monitoramento da telemetria) e a tela `MonitoramentoRede.tsx`.

| Indicador | Como a tela mostra hoje | Dado necessário | Disponível na aplicação hoje? |
|---|---|---|---|
| Latência média | Média de uma lista fixa de 24 valores | Tempo de resposta por requisição, agrupado por endpoint | Não |
| Vazão | `reqPerSec = 128`, "Pico: 214 req/s às 11h" (fixos) | Contagem de requisições por intervalo | Não |
| Taxa de erro | `errRate = 0.8` (fixo) | Respostas 5xx e 4xx sobre o total | Não |
| Uptime | `uptime = 99.7` (fixo) | Tempo no ar e disponibilidade medida (seção 5) | Parcial |
| Gráfico de latência (24 h) | `LATENCY_24H` com valores de exemplo | Série temporal de latência | Não |
| Tabela de serviços e endpoints | `SERVICES` com 3 itens fixos (Estoque, Requisições, Instituições) | Status, latência, taxa de erro e hora da última verificação por grupo de endpoint | Não |
| Telemetria (temperatura e alertas) | Não existe na tela | Leituras e alertas por transferência | **Sim** (`GET /transferencias/{id}/telemetria`, `GET /alertas-termicos`) |
| Resultados dos testes de rede | Não existe na tela | Medições dos testes de comunicação | Depende da tarefa de execução dos testes (arquivo gerado pelo `k6`) |
| Custo estimado em nuvem | Valores fixos (R$ 340 de R$ 500) | Fatura da nuvem | Não é métrica de rede; pertence à Infraestrutura de Software |

Os valores fixos da tela são exemplos de layout. Como o projeto roda em um plano gratuito (um backend pequeno), números como 128 req/s não representam a aplicação real e não devem ser apresentados como medição.

---

## 3. O que a aplicação fornece hoje

| Item verificado | Resultado |
|---|---|
| Dependência `spring-boot-starter-actuator` no `pom.xml` | Ausente |
| Filtro ou interceptor de requisições, `MeterRegistry` ou Micrometer no código | Ausentes |
| Tarefas agendadas (`@Scheduled`) | Ausentes |
| Endpoint `GET /api/v1/rede/status` | Ausente (consta em `CONTRATOS_API.md`, sem implementação) |
| Verificação de saúde | O `compose.yaml` usa `GET /api/v1/instituicoes` como healthcheck; a esteira do GitHub só dispara os *deploy hooks* e não testa a aplicação depois |
| Dados de telemetria | Tabelas `leitura_telemetria` e `alerta_termico`, com 5 endpoints testados |
| Padrão de chamada no frontend | `fetch` para `VITE_API_BASE_URL`; na falha, várias funções de `api.ts` **devolvem dados de exemplo em silêncio** |

O último ponto é crítico para um painel de monitoramento: se o backend cair e a tela cair para dados de exemplo, ela mostraria "Operacional" justamente quando o sistema está fora do ar. O painel precisa tratar falha de conexão como **Indisponível**.

---

## 4. Como obter as métricas

### 4.1 Opções

| Opção | Como funciona | Vantagens | Limitações |
|---|---|---|---|
| A. Actuator com Micrometer | Com `spring-boot-starter-actuator`, o Spring mede cada requisição na métrica `http.server.requests` (contagem, tempo total, máximo, com as etiquetas `uri`, `method`, `status` e `outcome`) | Sem código de medição; padrão do ecossistema Spring; uma dependência e algumas linhas de configuração | Valores acumulados desde a inicialização; percentis precisam ser habilitados; a rota `/actuator` não deve ficar pública sem proteção |
| B. Filtro próprio | Um filtro registra tempo e status de cada requisição em contadores na memória | Controle total do formato e da janela de tempo | Mais código para manter e testar; reinventa o que o Micrometer já faz |
| C. Prometheus e Grafana | Coleta externa, com painéis prontos | Padrão de mercado | Exige serviços extras de infraestrutura e o painel do grupo é em React; foge do escopo e do plano gratuito |

### 4.2 Recomendação: A, lida por um endpoint próprio

1. Adicionar `spring-boot-starter-actuator` e habilitar percentis da métrica:
   `management.metrics.distribution.percentiles.http.server.requests=0.5,0.95,0.99`.
2. **Não expor** o Actuator ao navegador. Deixar exposto apenas `health` (`management.endpoints.web.exposure.include=health`).
3. Criar um serviço do projeto (`RedeStatusService`) que lê o `MeterRegistry`, agrupa as rotas por serviço crítico (tabela 6.2) e monta o JSON do contrato (seção 6). O frontend continua chamando só `GET /api/v1/rede/status`, como já documentado.
4. Para vazão e taxa de erro **recentes** (e não desde a inicialização), um agendador tira uma "foto" dos contadores a cada 10 segundos e guarda as últimas fotos em um buffer circular na memória; a vazão e a taxa de erro da janela de 5 minutos saem da diferença entre fotos. O mesmo buffer, com um ponto a cada 10 minutos, alimenta o gráfico de 24 h.

**Limitação assumida.** O buffer fica na memória, então zera quando o serviço reinicia. No plano gratuito do Render o serviço hiberna após um período sem requisições (`DEPLOY.md`), o que também zera os contadores. Para o MVP isso é aceitável, desde que o painel mostre desde quando os dados são válidos (campo `coletandoDesde` do contrato).

---

## 5. Uptime: o que dá para medir

A aplicação não enxerga a própria queda, então "uptime" medido por ela só valeria enquanto ela está no ar. Proposta de dois indicadores com nomes distintos:

| Indicador | Como é obtido | O que significa |
|---|---|---|
| Tempo no ar | Métrica `process.uptime` do Micrometer | Há quanto tempo o backend está rodando desde a última inicialização |
| Disponibilidade das verificações | O painel já declara "Verificação automática a cada 30s": cada resposta 2xx de `/api/v1/rede/status` conta como sucesso e cada falha como indisponibilidade; o percentual é calculado no navegador | Disponibilidade vista por quem usa, válida desde que a tela foi aberta |

Para a disponibilidade oficial nos relatórios de teste, vale a sonda externa do teste T6 (`METRICAS-E-METODOLOGIA-TESTES-REDE.md`), que roda de fora e por isso registra as quedas. Um monitor externo gratuito (ou um fluxo agendado no GitHub Actions que chama a URL do backend) permitiria um uptime contínuo e é uma decisão a tomar com a infraestrutura (pergunta 4 da seção 8).

---

## 6. Contrato proposto: `GET /api/v1/rede/status`

### 6.1 Resposta

```json
{
  "geradoEm": "2026-10-26T19:40:00",
  "coletandoDesde": "2026-10-26T18:02:11",
  "janelaSegundos": 300,
  "tempoNoArSegundos": 5869,
  "geral": {
    "latenciaMediaMs": 112.4,
    "latenciaP95Ms": 310.0,
    "vazaoReqPorSegundo": 4.2,
    "taxaErro5xx": 0.004,
    "taxaErro4xx": 0.021
  },
  "servicos": [
    {
      "nome": "Estoque",
      "padrao": "/api/v1/instituicoes/{id}/lotes, /api/v1/lotes/**",
      "status": "OPERACIONAL",
      "requisicoes": 412,
      "latenciaMediaMs": 96.1,
      "latenciaP95Ms": 240.0,
      "taxaErro5xx": 0.0,
      "ultimaVerificacao": "2026-10-26T19:39:58"
    }
  ]
}
```

As taxas são frações (0,004 = 0,4%); o frontend multiplica por 100 para exibir, como a tela já faz com `errorRate`.

### 6.2 Grupos de endpoints críticos

| Serviço no painel | Rotas agrupadas (padrão da URI) | Existe no backend hoje? |
|---|---|---|
| Estoque | `/api/v1/instituicoes/{id}/lotes`, `/api/v1/lotes/**` | Sim |
| Requisições | `/api/v1/requisicoes/**` | Sim |
| Instituições | `/api/v1/instituicoes/**` (exceto lotes) | Sim |
| Telemetria | `/api/v1/transferencias/{id}/telemetria`, `/api/v1/transferencias/{id}/alertas`, `/api/v1/alertas-termicos` | Sim |
| Rotas e transferências | `/api/v1/rotas`, `/api/v1/transferencias/**` (exceto telemetria) | Sim |
| Análise de consumo | `/api/v1/analises/**` | Sim |
| Redistribuição | `/api/v1/redistribuicoes/**` | Não |
| Autenticação | Sem endpoint definido | Não |

A US10 cita cinco serviços críticos (estoque, requisições, telemetria, redistribuição e autenticação). Hoje três existem; os outros dois entram no painel quando forem implementados. As rotas são agrupadas pela **etiqueta `uri`** do Micrometer, que traz o padrão (`/api/v1/transferencias/{id}/telemetria`) e não o valor real do id, o que evita uma linha por transferência. As chamadas a `/api/v1/rede/status` ficam fora das estatísticas.

### 6.3 Regra de status (proposta)

| Status | Condição | Origem da regra |
|---|---|---|
| `INDISPONIVEL` | Nenhuma resposta 2xx na janela, havendo requisições | US10, "está indisponível" |
| `DEGRADADO` | Taxa de 5xx acima de 5% na janela, ou latência p95 acima de duas vezes a meta da classe do endpoint | US10 ("taxa de erro acima de 5%") e metas do documento de métricas |
| `OPERACIONAL` | Demais casos | US10, cenário 1 |
| Sem tráfego | Nenhuma requisição na janela: `requisicoes: 0`, latência nula, status `OPERACIONAL` | A tela já mostra um traço no lugar da latência quando o valor é 0 |

A tela tem três estados (`operacional`, `degradado`, `indisponivel`), então o contrato usa os mesmos três, em maiúsculas no backend. O `CONTRATOS_API.md` fala em `INDISPONIVEL` "ou flag de alerta"; o estado `DEGRADADO` cumpre o papel da flag e precisa ser registrado no contrato.

### 6.4 Correspondência com a tela

| Campo do contrato | Campo da tela (`Service` e indicadores) |
|---|---|
| `servicos[].nome` | `name` |
| `servicos[].padrao` | `endpoint` |
| `servicos[].status` (minúsculas) | `status` |
| `servicos[].latenciaMediaMs` | `latencyMs` |
| `servicos[].taxaErro5xx` (vezes 100) | `errorRate` |
| `servicos[].ultimaVerificacao` | `lastCheck` |
| `geral.latenciaMediaMs` | Card "Latência Média" |
| `geral.vazaoReqPorSegundo` | Card "Vazão" |
| `geral.taxaErro5xx` (vezes 100) | Card "Taxa de Erro" |
| `tempoNoArSegundos` | Card "Uptime" (rótulo "tempo no ar", seção 5) |

---

## 7. Segurança e rede

- **CORS:** o painel chama a API como as demais telas; a origem do frontend precisa estar em `APP_CORS_ALLOWED_ORIGINS` no Render.
- **Exposição:** o contrato só traz agregados (contagens, médias e percentis por serviço), sem dados de instituições, lotes ou pacientes. Mesmo assim, o endpoint não tem autenticação hoje, como os demais.
- **Actuator:** a métrica bruta (`/actuator/metrics`) não deve ficar acessível pela internet. Expor só `health`.
- **Custo da própria coleta:** o painel consulta a cada 30 segundos; a medição do Micrometer tem custo desprezível. As chamadas ao `/rede/status` são excluídas das estatísticas para não distorcer a vazão.

---

## 8. Perguntas para combinar com backend e infraestrutura

| # | Pergunta | Com quem | Por que importa | Sugestão |
|---|---|---|---|---|
| 1 | Podemos adicionar o Actuator ao `pom.xml` e habilitar os percentis? | Backend (POO) | Sem a dependência não há coleta | Sim, só com `health` exposto |
| 2 | Quem implementa o `RedeStatusService` e o `RedeController`? | Backend e RSD | O contrato da seção 6 precisa de código | Backend escreve; RSD revisa o formato e as regras de status |
| 3 | O buffer em memória (zera ao reiniciar) é aceitável? | Todos | Define se haverá tabela de métricas no banco | Memória no MVP; banco só se sobrar tempo |
| 4 | Há como medir o uptime de fora (monitor externo ou fluxo agendado)? | Infraestrutura (SO) | A aplicação não vê a própria queda | Monitor externo gratuito ou fluxo no GitHub Actions |
| 5 | O Render hiberna o backend também nos testes? Qual é a URL pública do backend e do frontend? | Infraestrutura (SO) | A hibernação zera métricas e cria latências altas na primeira chamada; os testes precisam das URLs | Ter um endereço fixo e uma chamada de "despertar" antes de cada rodada |
| 6 | Autenticação e Redistribuição entram no painel quando existirem? | Equipe | Mudam a lista de serviços críticos | Sim; o contrato aceita novos grupos sem mudar a tela |
| 7 | De onde virá o custo em nuvem do card da tela? | Infraestrutura (SO) | Hoje é fixo e não é métrica de rede | Manter como exemplo ou remover até haver fonte |
| 8 | A hora das leituras e das métricas deve usar fuso horário? | Backend e RSD | `LocalDateTime` não tem fuso; gráficos de 24 h dependem disso | Padronizar em um único fuso e documentar |

---

## 9. Plano de integração por etapas

| Etapa | O que fazer | Depende de | Critério de aceite |
|---|---|---|---|
| E1 | Aprovar o contrato da seção 6 e registrá-lo em `CONTRATOS_API.md` | Perguntas 1 a 3 | Contrato aceito por RSD, backend e frontend |
| E2 | Backend: Actuator, `RedeStatusService` e `GET /api/v1/rede/status` com testes automatizados | E1 | Resposta no formato do contrato; status `DEGRADADO` com mais de 5% de 5xx em teste |
| E3 | Frontend: ligar os indicadores e a tabela ao endpoint; falha de conexão exibe **Indisponível**; dados de exemplo, se mantidos, ficam rotulados | E2 | Com o backend parado, o painel mostra Indisponível em até 30 s |
| E4 | Frontend: seção de telemetria (temperatura por transferência com a faixa de 2 a 6 °C e lista de alertas) usando os endpoints que já existem | Nenhuma (pode começar agora) | Leitura fora da faixa registrada pelo `POST` aparece no painel |
| E5 | Frontend: seção de resultados dos testes, lendo um arquivo JSON gerado pelas execuções do `k6` e versionado no repositório | Execução dos testes | Os números exibidos coincidem com os arquivos de resultado |
| E6 | Conferência final: valores do painel comparados com as medições externas do `k6` | E3 | Diferença de até 10% (meta "Precisão do painel US10") |

---

## 10. Como esta verificação foi feita

- Leitura do backend (`pom.xml`, controllers, services, configurações) e busca por Actuator, Micrometer, filtros, interceptors e agendadores, sem ocorrências.
- Leitura de `MonitoramentoRede.tsx`, do tipo `Service`, dos dados de exemplo (`mockData.tsx`) e do cliente `api.ts`.
- Leitura de `compose.yaml`, do `Dockerfile`, de `.github/workflows/build.yml`, de `RENDER_SETUP.md` e de `DEPLOY.md`.
- O backend não foi executado. As propriedades do Spring e os nomes de métricas citados são os da documentação do Spring Boot e do Micrometer e devem ser confirmados no primeiro teste com o código real.
