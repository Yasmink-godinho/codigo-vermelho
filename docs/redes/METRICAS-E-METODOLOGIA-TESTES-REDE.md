# Métricas e Metodologia dos Testes de Rede

**Projeto:** Código Vermelho (Rota Vital) · **Disciplina:** Infraestrutura de Comunicação (RSD)
**Documentos relacionados:** `arquitetura-codigo-vermelho.pdf` (topologia, protocolos e redes) e `ENDPOINTS-REST-MVP.md` (endpoints REST)

---

## 1. Objetivo e escopo

Este documento define **o que será avaliado na comunicação** do Código Vermelho e **como os testes serão executados**. Ele serve de base para o benchmarking da Unidade 2 (latência, vazão e erros 4xx e 5xx) e para validar os indicadores do painel de rede (US10) e da telemetria (US07).

**Resumo em cinco linhas**

1. Avaliamos oito aspectos: latência, vazão, erros 4xx e 5xx, disponibilidade, tempo de conexão (TCP e TLS), conectividade e isolamento entre sub-redes, qualidade do enlace (perda e jitter) e confiabilidade da telemetria.
2. Cada aspecto tem definição, forma de cálculo e meta inicial (seção 3).
3. Os testes rodam em dois ambientes: local (para validar os scripts) e nuvem com as três sub-redes (medições oficiais).
4. São oito tipos de teste, de conectividade até falha controlada, com três cenários de carga (baixo, moderado e alto).
5. Cada rodada é repetida três vezes, usa apenas dados sintéticos e tem o resultado registrado em arquivo, com o commit testado.

**Fora do escopo:** teste de intrusão e segurança ofensiva, redes móveis ou GPS reais (a telemetria é simulada, conforme a ficha do projeto), integração com sistemas oficiais da Hemorrede e desempenho de disco.

---

## 2. O que será avaliado

A arquitetura tem três enlaces (navegador → Frontend, Frontend → Backend, Backend → PostgreSQL). Cada aspecto abaixo é medido no enlace onde faz sentido. Na aplicação publicada, o navegador também chama a API diretamente; esse percurso está detalhado em `VALIDACAO-FLUXO-DADOS-TELEMETRIA.md`.

| # | Aspecto | Por que importa no Código Vermelho | Onde é medido |
|---|---|---|---|
| A1 | Latência (tempo de resposta) | Requisições de hemocomponentes e rotas têm janela de tempo; resposta lenta atrasa a decisão logística | Navegador → Frontend → Backend (ponta a ponta) |
| A2 | Vazão (throughput) | Mostra quantas requisições o sistema sustenta antes de degradar | Backend (endpoints REST) |
| A3 | Erros 4xx e 5xx | 4xx indica problema de contrato com o cliente; 5xx indica falha do servidor | Todos os endpoints |
| A4 | Disponibilidade (uptime) | Estoque, requisições e telemetria precisam estar acessíveis continuamente | Sonda em `GET /api/v1/instituicoes` (o mesmo endpoint do healthcheck do Compose) e, no painel, `GET /api/v1/rede/status` |
| A5 | Tempo de conexão (TCP e handshake TLS) | Parte da latência que vem da rede e não da aplicação; HTTPS é obrigatório na borda | Navegador → Frontend (443) |
| A6 | Conectividade e isolamento | Garante que o banco nunca fique acessível pela internet e que só os fluxos previstos existam | Entre as três sub-redes |
| A7 | Qualidade do enlace (RTT, perda de pacotes, jitter) | Separa o custo da rede do custo da aplicação | Entre Frontend, Backend e PostgreSQL |
| A8 | Confiabilidade da telemetria | Leituras de temperatura (2 a 6 °C) não podem se perder nem chegar fora de ordem | `POST` e `GET /api/v1/transferencias/{id}/telemetria` |

---

## 3. Métricas, cálculo e metas

As metas são **iniciais**: depois da primeira rodada de linha de base (seção 4.7) elas são revisadas, e o valor final adotado é registrado neste documento.

### 3.1 Metas por métrica

| Métrica | Definição e cálculo | Meta inicial |
|---|---|---|
| Latência | Tempo entre enviar a requisição e receber o último byte da resposta. Reportar média, mediana, p95 e p99 | p95 por classe de endpoint (tabela 3.2) nos cenários baixo e moderado |
| Vazão | Requisições com sucesso (2xx esperado) por segundo, medidas no patamar estável da carga | Baixo e moderado: pelo menos 95% da taxa oferecida atendida com sucesso. Alto: registrar o valor obtido e o ponto de saturação |
| Taxa de erro 5xx | (respostas 5xx + timeouts) / total de requisições | Baixo e moderado: ≤ 1%. Alto: ≤ 5%. Acima de 5% o sistema é classificado como **degradado**, a mesma regra do painel US10 |
| Taxa de 4xx | Respostas 4xx / total | Nos cenários de carga todas as requisições são válidas, então a meta é 0%. Nos testes funcionais, 4xx só nos casos negativos previstos (400, 404, 409) |
| Disponibilidade | Sondas com resposta 2xx / total de sondas (uma sonda a cada 10 s) | ≥ 99% na janela do teste |
| Tempo de conexão | `time_connect` (TCP) e `time_appconnect` (TLS), em ms | Externo: TCP ≤ 100 ms e TLS ≤ 300 ms. Interno (dentro da VPC): TCP ≤ 10 ms |
| RTT | Média do `ping` (100 pacotes) entre componentes da VPC | ≤ 10 ms |
| Perda de pacotes | Pacotes perdidos / enviados no `ping` | 0% (aceitável até 1%) |
| Jitter | Desvio padrão do RTT (`mdev` do `ping`) | ≤ 5 ms |
| Vazão bruta da rede | Taxa medida com `iperf3` entre sub-redes | Informativa. Serve para concluir se um gargalo está na rede ou na aplicação |
| Entrega da telemetria | Leituras aceitas (201) / leituras enviadas | ≥ 99% |
| Leituras fora da faixa | Leituras fora de 2 a 6 °C aceitas e com alerta gerado / leituras fora da faixa enviadas | 100% (leitura fora da faixa gera alerta, nunca é rejeitada) |
| Atraso da telemetria | Tempo entre o envio da leitura e ela aparecer na consulta `GET` | p95 ≤ 2 s |
| Isolamento | Linhas da matriz de conectividade (seção 4.4, teste T1) com o resultado esperado | 100% |
| Tempo de recuperação | Tempo entre o fim da falha injetada e o retorno de respostas 2xx | ≤ 60 s |
| Precisão do painel US10 | Diferença entre latência, vazão e taxa de erro exibidas no painel e as medidas externamente | ≤ 10% |

### 3.2 Metas de latência (p95) por classe de endpoint

| Classe | Endpoints | p95 |
|---|---|---|
| Leitura simples | `GET` de instituições, lotes, requisições, transferências, telemetria, redistribuições, compatibilidade e `GET /api/v1/lotes/fila-fefo` | ≤ 300 ms |
| Escrita | `POST` de instituições, lotes, requisições e telemetria; `PATCH` de aprovação e recusa de redistribuições | ≤ 500 ms |
| Computacional | `GET /api/v1/rotas` (caminho mínimo), `GET /api/v1/analises/consumo` (estatística) | ≤ 1000 ms |
| Monitoramento | `GET /api/v1/rede/status` | ≤ 300 ms |

### 3.3 Classificação do resultado

| Resultado | Condição |
|---|---|
| **Aprovado** (OPERACIONAL) | Todas as metas atendidas nas três repetições |
| **Atenção** | Alguma meta de latência ou vazão excedida em até 50%, ou taxa de 5xx entre 1% e 5% |
| **Reprovado** (degradado ou INDISPONIVEL) | Taxa de 5xx acima de 5%, disponibilidade abaixo de 99%, falha na matriz de isolamento ou perda de leituras de telemetria |


---

## 3.4 US10 — Métricas e metodologia operacional do painel de rede

Esta seção detalha como o backend deve coletar, calcular e apresentar as métricas utilizadas pelo painel US10. O objetivo é garantir que os indicadores representem o comportamento observado no processo atual, sem apresentar valores fictícios ou confundir sondas internas com tráfego real de usuários.

### 3.4.1 Escopo da coleta

A coleta é realizada no backend por um filtro HTTP aplicado às rotas que começam com `/api/v1/`. Cada resposta observada gera uma amostra ao final do processamento da requisição.

A amostra deve registrar, no mínimo:

- instante de conclusão da resposta;
- método HTTP (`GET`, `POST`, `PUT`, `PATCH`, `DELETE` etc.);
- padrão da rota, preferencialmente sem os valores concretos dos parâmetros de caminho;
- código de status HTTP;
- duração da requisição em milissegundos.

O padrão de rota deve permitir agrupar chamadas equivalentes. Por exemplo, chamadas para `/api/v1/transferencias/10/telemetria` e `/api/v1/transferencias/25/telemetria` devem ser associadas ao mesmo padrão de endpoint, `/api/v1/transferencias/{id}/telemetria`, quando o mecanismo de identificação de rotas do framework permitir essa resolução.

A coleta deve ocorrer ao final da resposta para que a duração represente o tempo observado pelo filtro HTTP. Requisições internas de sondagem devem ser identificadas e excluídas da coleta de tráfego, evitando que o próprio monitoramento altere os indicadores exibidos.

### 3.4.2 Definição e cálculo dos indicadores

| Indicador | Definição operacional | Cálculo / interpretação |
|---|---|---|
| Latência média | Média aritmética das durações das respostas observadas pelo filtro HTTP para rotas `/api/v1/**` dentro da janela deslizante configurada. | Soma das durações das amostras dividida pela quantidade de amostras válidas. A coleta é registrada ao final da resposta e agrupada por método e padrão de rota. |
| Throughput | Quantidade de requisições reais registradas por unidade de tempo. | Total de requisições observadas dividido pela duração efetiva da janela. A duração efetiva não pode ultrapassar o uptime do processo atual. |
| Taxa de erros | Proporção de respostas HTTP 5xx em relação ao total de respostas observadas. | `(quantidade de respostas 5xx / total de respostas observadas) × 100`. Respostas 4xx contam como tráfego, mas não como falha interna do servidor. |
| Uptime | Tempo transcorrido desde o início do processo atual. | Segundos desde a inicialização do processo. Não representa disponibilidade histórica, SLA ou tempo acumulado entre reinicializações. |
| Disponibilidade / saúde | Classificação operacional do endpoint ou serviço com base no tráfego observado e nas sondas aplicáveis. | Pode resultar em `OPERACIONAL`, `DEGRADADO`, `INDISPONIVEL` ou `SEM_DADOS`, conforme os critérios da seção 3.4.3. |
| Saúde do banco | Verificação pontual da possibilidade de obter uma conexão JDBC válida. | Verificação por `Connection.isValid(2)`, com timeout de 2 segundos. É uma sondagem pontual, não uma série histórica nem uma validação funcional de todas as consultas. |

**Cuidados de interpretação:**

- A latência média do painel é uma média das amostras coletadas pelo backend. Ela não substitui os percentis p50, p95 e p99 medidos externamente nos testes de benchmarking.
- O throughput do painel representa o tráfego observado pelo processo. Não deve ser confundido com a taxa oferecida pelo gerador de carga nem com a quantidade de respostas bem-sucedidas.
- Respostas 4xx são contabilizadas no total de requisições e, portanto, influenciam o denominador do throughput e da taxa de erros, mas não são classificadas como erros internos 5xx.
- A taxa de erros apresentada pelo painel segue a definição operacional desta seção. Nos testes externos, permanecem válidas as fórmulas e metas específicas da seção 3.1, inclusive o tratamento de timeouts.
- Se não houver amostras na janela, a latência, o throughput e a taxa de erros devem ser apresentados como indisponíveis ou sem dados, e não como zero com significado de bom desempenho.

### 3.4.3 Classificação de saúde dos endpoints

A classificação operacional considera o tráfego real e, quando aplicável, o resultado das sondas:

| Estado | Critério |
|---|---|
| `OPERACIONAL` | Há evidência recente de funcionamento e não foram atingidos os critérios de degradação ou indisponibilidade. |
| `DEGRADADO` | A taxa de respostas 5xx observada ultrapassa 5%, ou há outra condição de degradação definida pela implementação e devidamente identificada no detalhe do endpoint. |
| `INDISPONIVEL` | O endpoint acumula três falhas consecutivas nas sondas aplicáveis. Para operações sem sonda automática, a classificação deve depender da observação de tráfego real, sem simular chamadas com efeito colateral. |
| `SEM_DADOS` | Ainda não existem observações suficientes na janela para afirmar que o endpoint está operacional ou degradado. Ausência de tráfego não significa disponibilidade de 100%. |

As três falhas consecutivas devem ser contabilizadas por endpoint sondado. Uma resposta considerada bem-sucedida pela regra da sonda interrompe a sequência de falhas. A taxa de erro acima de 5% classifica o endpoint como degradado, sem apagar a informação de falhas consecutivas.

Quando não houver dados suficientes, a interface deve exibir `SEM_DADOS` explicitamente. Não se deve transformar ausência de amostras em estado `OPERACIONAL`, taxa de erro igual a 0% ou disponibilidade igual a 100%.

### 3.4.4 Sondas de disponibilidade

As sondas são verificações periódicas realizadas exclusivamente por `GET` em loopback, dentro do próprio ambiente do backend. Seu propósito é verificar se rotas críticas respondem, sem depender da navegação de um usuário externo.

Regras para as sondas:

1. Somente endpoints `GET` críticos e seguros para consulta podem ser chamados automaticamente.
2. As chamadas devem usar loopback e não devem atravessar a internet pública.
3. As requisições de sondagem devem ser identificadas pelo mecanismo de monitoramento e excluídas das métricas de tráfego, latência e throughput.
4. Uma rota que exija parâmetro obrigatório pode responder 4xx à sonda e ainda assim demonstrar que a rota está ativa e foi alcançada. Essa resposta não deve ser interpretada automaticamente como indisponibilidade.
5. A regra de sucesso da sonda deve distinguir falha de conexão, timeout e erro interno 5xx de respostas 4xx esperadas por ausência de parâmetro ou contexto.
6. As sondas não devem executar operações que criem, alterem ou removam dados.

**Operações que nunca devem ser sondadas artificialmente:**

- `POST`;
- `PUT`;
- `PATCH`;
- `DELETE`.

A disponibilidade dessas operações deve ser inferida exclusivamente pelo tráfego real recebido. Não se deve criar transferências, alterar estoque, aprovar redistribuições ou enviar telemetria apenas para testar se uma rota está respondendo.

### 3.4.5 Rotas críticas padrão

A configuração inicial de endpoints críticos deve contemplar os seguintes recursos:

| Recurso | Rota / operação | Forma de observação |
|---|---|---|
| Estoque | `GET /api/v1/lotes` | Sonda GET e tráfego real |
| Requisições | Rotas GET de requisições | Sonda GET, quando segura, e tráfego real |
| Transferências | Rotas GET de transferências | Sonda GET e tráfego real |
| Telemetria | `GET /api/v1/alertas-termicos` | Sonda GET e tráfego real |
| Telemetria por transferência | `POST /api/v1/transferencias/{id}/telemetria` | Somente tráfego real; nunca executar POST artificial |
| Redistribuições | Rotas GET de redistribuições | Sonda GET, quando segura, e tráfego real |
| Compatibilidade | Rotas GET de compatibilidade | Sonda GET e tráfego real |
| Monitoramento | `GET /api/v1/rede/status` | Tráfego real; excluir sondas internas caso a rota também seja sondada |

Rotas com variáveis obrigatórias no caminho, como `/api/v1/transferencias/{id}/telemetria`, dependem de tráfego real quando não houver um GET seguro e representativo para sondagem. O monitoramento não deve inventar identificadores ou executar operações de escrita para validar essas rotas.

A lista deve ser configurável, permitindo incluir novos endpoints sem alterar a lógica central do coletor. A autenticação não integra a lista inicial: o backend ainda não possui endpoint de autenticação, pois a tela de login existente é apenas do frontend. Quando um endpoint de autenticação for implementado no backend, ele poderá ser incluído em `app.monitoramento.endpoints-criticos`, respeitando as regras de segurança e de sondagem.

### 3.4.6 Banco de dados

A condição do banco é verificada por meio de uma conexão JDBC e da chamada `isValid(2)`. O parâmetro `2` representa o timeout de validação em segundos.

Essa verificação informa apenas se a conexão testada é considerada válida naquele instante. Ela não comprova:

- integridade de todas as tabelas;
- correção de consultas específicas;
- consistência dos dados;
- disponibilidade histórica do banco;
- capacidade de executar todas as transações da aplicação.

Falhas nessa verificação devem ser registradas como problema do componente de banco e refletidas no estado geral do monitoramento, sem atribuir ao banco métricas históricas que não foram coletadas.

### 3.4.7 Janela de coleta, retenção e reinicialização

As métricas são mantidas em memória pelo processo atual. A janela é deslizante e a retenção é limitada a 5.000 amostras por endpoint.

Consequências dessa escolha:

- as amostras mais antigas são descartadas quando o limite de retenção é atingido;
- a janela efetiva de cálculo depende do período configurado e da quantidade de amostras disponíveis;
- o throughput deve usar a duração efetiva da janela, limitada pelo uptime do processo;
- ao reiniciar o backend, as amostras e os contadores em memória são reiniciados;
- o uptime começa novamente no início do novo processo;
- os indicadores não constituem histórico persistente nem evidência de SLA.

O painel deve deixar claro que os números representam o processo atual. Para histórico entre reinicializações, seria necessário persistir ou exportar as métricas para um sistema externo de monitoramento, o que não faz parte desta especificação.

### 3.4.8 Indicadores gerais e por endpoint

O endpoint `GET /api/v1/rede/status` deve disponibilizar uma visão consolidada do processo e detalhes por endpoint. A resposta deve permitir à interface apresentar, no mínimo:

- instante da consulta;
- uptime em segundos;
- tamanho e duração efetiva da janela;
- quantidade de requisições observadas;
- latência média;
- throughput;
- quantidade de respostas 5xx e taxa de erros;
- estado geral do serviço;
- estado do banco;
- estado individual dos endpoints críticos;
- quantidade de falhas consecutivas das sondas, quando aplicável;
- última observação ou última sondagem;
- indicação `SEM_DADOS` quando não houver amostras.

A estrutura JSON concreta deve permanecer compatível com o contrato `RedeStatusAPI` utilizado pelo frontend. A inclusão de novos campos deve ser feita de forma compatível, evitando renomear ou remover propriedades já consumidas pela tela sem atualizar o frontend correspondente.

O próprio endpoint `/api/v1/rede/status` também participa da coleta de tráfego real. Entretanto, as sondas internas que eventualmente o consultem devem ser excluídas das métricas, para que o monitoramento não aumente artificialmente o próprio throughput ou altere sua latência média.

### 3.4.9 Configuração sugerida

Os parâmetros operacionais devem ser configuráveis, em vez de espalhados pelo código. A configuração deve contemplar:

- duração da janela deslizante;
- intervalo entre sondas;
- limite de amostras por endpoint (5.000 como limite definido nesta especificação);
- quantidade de falhas consecutivas para indisponibilidade (3);
- limite da taxa de erros para degradação (acima de 5%);
- lista de endpoints críticos;
- timeout da verificação JDBC (2 segundos).

A lista inicial de endpoints críticos pode ser declarada em `app.monitoramento.endpoints-criticos`. Os nomes exatos das propriedades de janela e intervalo devem seguir a convenção já adotada pelo `application.yml` ou `application.properties` do projeto.

### 3.4.10 Critérios de validação da US10

A implementação será considerada aderente a esta metodologia quando os testes demonstrarem que:

1. Uma requisição real a uma rota `/api/v1/**` gera uma amostra ao final da resposta.
2. A amostra identifica método, padrão de rota, status HTTP e duração.
3. Requisições 4xx entram no total de tráfego, mas não são somadas às falhas 5xx.
4. Respostas 5xx aumentam a quantidade e a taxa de erros.
5. O throughput utiliza a duração efetiva da janela e nunca considera período anterior ao início do processo.
6. A latência média corresponde à média aritmética das amostras disponíveis.
7. Três falhas consecutivas de uma sonda aplicável levam o endpoint a `INDISPONIVEL`.
8. Taxa de erros superior a 5% leva o endpoint a `DEGRADADO`.
9. A ausência de amostras produz `SEM_DADOS`, e não 100% de disponibilidade.
10. As sondas GET não aparecem nas métricas de tráfego.
11. Nenhuma sonda executa POST, PUT, PATCH ou DELETE.
12. A verificação do banco utiliza `isValid(2)` e é apresentada como checagem pontual.
13. O endpoint `/api/v1/rede/status` é contabilizado quando chamado por clientes reais, mas suas sondas internas são excluídas.
14. Após reinicialização, as métricas em memória são reiniciadas e o uptime passa a contar a partir do novo processo.

### 3.4.11 Limitações específicas da US10

- As métricas são mantidas em memória e reiniciadas a cada processo.
- A janela deslizante é limitada a 5.000 amostras por endpoint.
- O uptime representa somente o processo atual, não a disponibilidade histórica do serviço hospedado.
- A checagem JDBC valida uma conexão pontual, não a integridade do banco nem todas as consultas funcionais.
- A ausência de tráfego não comprova disponibilidade; nesses casos, deve ser exibido `SEM_DADOS`, salvo quando uma sonda válida fornecer evidência operacional.
- A classificação de saúde é operacional e não deve ser apresentada como garantia de SLA.

---

## 4. Metodologia

### 4.1 Princípios

- **Repetível:** mesmo script, mesmos dados e mesmos parâmetros em todas as rodadas. O script fica versionado no repositório.
- **Dados sintéticos:** nenhum dado real de doador ou paciente (LGPD, conforme a ficha do projeto).
- **Conjunto de dados fixo:** 10 instituições, 200 lotes, 50 requisições e 10 transferências em andamento. O volume de dados influencia a latência, por isso ele é registrado em cada resultado.
- **Aquecimento:** os primeiros 60 segundos de cada cenário são descartados (JVM e conexões com o banco ainda estão aquecendo). No Render, o plano gratuito hiberna o serviço após um período sem requisições e a primeira chamada seguinte demora mais (`DEPLOY.md`), então cada rodada começa com uma chamada de "despertar" que não entra nas medições.
- **Três repetições** por cenário. Reportar a mediana das medianas e o pior p95 entre as rodadas.
- **Um fator por vez:** nunca misturar teste de carga com injeção de falha na mesma rodada.

### 4.2 Ambientes

| Ambiente | Para que serve | Observação |
|---|---|---|
| Local (`localhost` ou Docker Compose) | Validar scripts, dados e metas antes da nuvem | Resultados de rede (RTT, TLS, isolamento) não valem aqui, só os funcionais e de aplicação |
| Nuvem atual (Render: site estático, Web Service e PostgreSQL gerenciado) | Medições **oficiais** de latência, vazão, erros e disponibilidade, feitas de fora, pelo navegador ou cliente de teste | O Render não expõe sub-redes, então o teste T1 se limita a: porta do banco não acessível pela internet, backend só por HTTPS e HTTP puro na borda recusado ou redirecionado |
| Arquitetura-alvo (VPC `10.0.0.0/16`, três sub-redes) | Medições de rede interna (RTT, perda, jitter, `iperf3`) e a matriz completa do teste T1 | Segue a tabela de redes da entrega: `sub-publica-a` (Frontend), `sub-app-a` (Backend), `sub-dados-a` (PostgreSQL). Aplica-se quando o ambiente for montado em uma VPC |

### 4.3 Pontos de medição

Medir de dois lugares permite separar o custo da rede do custo da aplicação:

- **Cliente externo** (computador de quem testa, fora da VPC): simula o usuário. A latência inclui internet, DNS, TCP e TLS.
- **Cliente interno** (instância dentro da `sub-publica-a`, na arquitetura-alvo): mede só a aplicação e a rede interna. No Render não existe esse ponto; a parte interna é estimada pelas métricas do próprio backend.

A diferença entre as duas medições é a contribuição da rede externa. Na aplicação real, o navegador chama a API diretamente (com CORS), então um `POST` com corpo JSON feito pelo navegador inclui uma requisição `OPTIONS` de verificação (preflight) antes da chamada principal; clientes de teste como `curl` e `k6` não fazem esse passo. Para cada requisição, o tempo total é decomposto em DNS, TCP, TLS, tempo até o primeiro byte (TTFB) e download.

### 4.4 Tipos de teste

| ID | Teste | O que verifica | Aspectos |
|---|---|---|---|
| T1 | Conectividade e isolamento | Se cada fluxo permitido funciona e cada fluxo proibido é bloqueado | A6 |
| T2 | Funcional por endpoint | Status codes corretos (200, 201, 400, 404, 409) em todos os endpoints do MVP | A3 |
| T3 | Linha de base | Latência com um único usuário, sem concorrência | A1, A5 |
| T4 | Carga (baixo, moderado, alto) | Latência, vazão e erros sob carga esperada | A1, A2, A3 |
| T5 | Estresse | Em que carga o sistema satura (ponto de saturação) | A2, A3 |
| T6 | Resistência (soak) | Estabilidade e disponibilidade em carga moderada por 30 minutos | A4 |
| T7 | Telemetria | Entrega, ordem, atraso e alertas das leituras de temperatura | A8 |
| T8 | Falha controlada | Comportamento e recuperação quando um componente cai ou a rede degrada | A4, A7 |

**T1. Matriz de conectividade** (esperado conforme as regras de entrada e saída das sub-redes)

| Origem | Destino e porta | Esperado | Como testar |
|---|---|---|---|
| Internet | Frontend, 443 | Permitido | `curl -I https://HOST` |
| Internet | Frontend, 80 | Bloqueado ou redirecionado para HTTPS | `curl -I --max-time 5 http://HOST` |
| Internet | Backend, 8080 | Bloqueado | `nc -zv -w 3 IP_BACKEND 8080` |
| Internet | PostgreSQL, 5432 | Bloqueado | `nc -zv -w 3 IP_BANCO 5432` |
| Frontend | Backend, 8080 | Permitido | `nc -zv -w 3 IP_BACKEND 8080` |
| Frontend | PostgreSQL, 5432 | Bloqueado | `nc -zv -w 3 IP_BANCO 5432` |
| Backend | PostgreSQL, 5432 | Permitido | `pg_isready -h IP_BANCO -p 5432` |
| Backend | Internet | Bloqueado | `curl --max-time 5 https://example.com` |
| PostgreSQL | Internet | Bloqueado | `curl --max-time 5 https://example.com` |

"Bloqueado" significa que a conexão expira (timeout) ou é recusada. Qualquer linha com resultado diferente do esperado reprova o teste.

**T4 e T5. Perfis de carga** (taxa de chegada constante, em requisições por segundo)

| Cenário | Taxa | Duração do patamar | Observação |
|---|---|---|---|
| Baixo | 5 req/s | 5 min | Uso rotineiro de uma unidade |
| Moderado | 25 req/s | 5 min | Várias unidades consultando ao mesmo tempo |
| Alto | 100 req/s | 5 min | Pico, por exemplo uma emergência com muitas requisições simultâneas |
| Estresse | Cresce de 10 em 10 req/s a cada minuto | Até a taxa de 5xx passar de 5% ou o p95 dobrar | O último patamar saudável é o ponto de saturação |

Os três cenários (baixo, moderado e alto) acompanham os cenários de uso adotados em Infraestrutura de Software, o que permite comparar os resultados entre as disciplinas.

A mistura de requisições segue o uso real do sistema: 70% leituras simples, 20% escritas, 8% computacionais (rotas e análise de consumo) e 2% consultas ao `GET /api/v1/rede/status`.

**T7. Carga de telemetria:** 10 veículos simulados, uma leitura a cada 5 segundos, durante 10 minutos (cerca de 1200 leituras). Cerca de 10% das leituras ficam fora da faixa de 2 a 6 °C para exercitar o alerta. Antes do teste, criar 10 transferências com `POST /api/v1/transferencias` (a telemetria só é aceita para transferências em transporte; depois da entrega o `POST` devolve 409). Cada leitura é um `POST /api/v1/transferencias/{id}/telemetria` com o corpo `{"temperatura": valor}`, feito por um cliente de teste fora do backend. O endpoint `.../telemetria/simulacao` não é usado nas medições de rede, porque ele gera as leituras dentro do próprio backend e não atravessa a rede. Depois de cada `POST`, uma consulta `GET` confirma que a leitura aparece e que a ordem por `dataHora` (hora definida pelo servidor) está correta.

**T8. Falhas controladas** (em carga baixa, uma por vez)

| Falha | Como injetar | Esperado |
|---|---|---|
| F1. Banco indisponível | Parar o PostgreSQL por 60 s | Endpoints que dependem do banco respondem erro de forma rápida (sem travar até estourar o tempo limite do cliente) e o sistema volta sozinho em até 60 s após o banco subir |
| F2. Backend reiniciado | Reiniciar o serviço Spring Boot | Frontend recebe erro durante a reinicialização e volta ao normal em até 60 s |
| F3. Rede degradada | No ambiente de teste, adicionar atraso e perda com `tc netem` (por exemplo 100 ms e 1% de perda) | Metas de latência recalculadas com o atraso adicionado, sem aumento de 5xx acima de 5% |
| F4. Painel sob falha | Repetir F1 e F2 observando o painel de rede | `GET /api/v1/rede/status` passa a indicar degradação ou INDISPONIVEL em até 1 minuto e volta a OPERACIONAL após a recuperação |

### 4.5 Ferramentas

| Ferramenta | Para que usamos |
|---|---|
| `ping` e `mtr` ou `traceroute` | RTT, perda de pacotes, jitter e caminho entre componentes (o ICMP precisa estar liberado só durante a janela de teste) |
| `nc` (netcat), `curl` e `pg_isready` | Matriz de conectividade (T1) e testes de porta quando o ICMP estiver bloqueado |
| `curl -w` | Decomposição do tempo (DNS, TCP, TLS, TTFB, total) de uma requisição |
| `openssl s_client` | Confirmar versão do TLS e certificado na porta 443 |
| `iperf3` | Vazão bruta da rede entre sub-redes (liberar a porta do `iperf3` só durante o teste) |
| `k6` (ou JMeter, como alternativa) | Geração de carga, percentis de latência, taxa de erro e vazão (T3 a T7) |
| `tc netem` | Emular atraso e perda de pacotes no ambiente de teste (F3) |
| Painel US10 (`GET /api/v1/rede/status`) e, se habilitado, Spring Boot Actuator com Micrometer | Métricas do lado do servidor, para comparar com o que o cliente mediu |
| Wireshark ou `tcpdump` | Diagnóstico quando uma métrica sair da meta e a causa não for óbvia |

### 4.6 Procedimento de cada rodada

1. Subir o ambiente e registrar o commit testado (`git rev-parse --short HEAD`).
2. Carregar o conjunto de dados sintéticos (seção 4.1) e conferir as contagens.
3. Executar T1 (conectividade). Se falhar, corrigir antes de seguir.
4. Executar T2 (funcional) e T3 (linha de base).
5. Executar T4 nos três cenários, do menor para o maior, com pausa de 2 minutos entre eles.
6. Executar T5 (estresse) e anotar o ponto de saturação.
7. Executar T6 (30 minutos em carga moderada) com sondas de disponibilidade a cada 10 s.
8. Executar T7 (telemetria) e, por último, T8 (falhas), restaurando o ambiente entre cada falha.
9. Repetir os passos 4 a 7 duas vezes (três rodadas no total).
10. Comparar as medições com o painel US10 e registrar a diferença.
11. Preencher o registro de resultados (seção 4.8) e classificar conforme a seção 3.3.

### 4.7 Linha de base e revisão das metas

A primeira rodada completa no ambiente de nuvem é a **linha de base**. Se uma meta se mostrar claramente irreal (por exemplo, folgada demais ou impossível de cumprir na infraestrutura contratada), ela é ajustada uma única vez, com a justificativa anotada neste documento. As rodadas seguintes são comparadas com a linha de base para mostrar evolução.

### 4.8 Registro dos resultados

Cada rodada gera um arquivo em `docs/redes/resultados/`, com o nome `AAAA-MM-DD-ambiente.md`, contendo:

| Campo | Exemplo de preenchimento |
|---|---|
| Data e responsável | |
| Ambiente | local ou nuvem |
| Commit testado | |
| Conjunto de dados | 10 instituições, 200 lotes, 50 requisições, 10 transferências |
| Cenário | baixo, moderado, alto, estresse, resistência, telemetria, falha |
| Latência (média, mediana, p95, p99) | |
| Vazão (req/s) | |
| Taxa de 4xx e de 5xx | |
| Disponibilidade | |
| Resultado | Aprovado, Atenção ou Reprovado |
| Observações | |

Os scripts do k6 ficam em `docs/redes/testes/`.

---

## 5. Relação com os requisitos do projeto

| Requisito | Onde está coberto |
|---|---|
| Benchmarking de latência, vazão e erros 4xx e 5xx (RSD, Unidade 2) | Métricas A1, A2 e A3; testes T3, T4 e T5 |
| Painel de monitoramento da telemetria (RSD, Unidade 2) | Métrica A8; teste T7 |
| US07, telemetria de temperatura (faixa de 2 a 6 °C, alerta em vez de rejeição) | Teste T7 e métrica "Leituras fora da faixa" |
| US10, monitoramento de rede (latência, vazão, taxa de erro, uptime, degradação acima de 5%) | Teste F4, métrica "Precisão do painel US10" e classificação da seção 3.3 |
| US10, coleta operacional no backend (amostras HTTP, janela deslizante, sondas GET, saúde dos endpoints e JDBC) | Especificação operacional da seção 3.4 e critérios de validação da seção 3.4.10 |
| Banco nunca em sub-rede pública; HTTPS na borda | Teste T1 e métrica A5 |
| Três cenários de uso (baixo, moderado e alto) de Infraestrutura de Software | Perfis de carga do teste T4 |

---

## 6. Limitações

- A telemetria e o GPS são simulados, então a qualidade de enlace de veículos em movimento (redes móveis) não é avaliada.
- Os resultados valem para a configuração testada (tamanho das instâncias, região e volume de dados) e não podem ser generalizados para outra configuração.
- A medição externa depende da conexão de quem testa, por isso cada resultado registra o ponto de medição e a rodada é repetida três vezes.

---

## Apêndice. Comandos de exemplo

**Decomposição do tempo de uma requisição**

```bash
curl -s -o /dev/null \
  -w "dns=%{time_namelookup} tcp=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer} total=%{time_total} codigo=%{http_code}\n" \
  https://HOST/api/v1/instituicoes
```

**RTT, perda e jitter entre componentes**

```bash
ping -c 100 IP_BACKEND
# a última linha mostra min/avg/max/mdev: avg = RTT médio, mdev = jitter
```

**Vazão bruta entre duas sub-redes**

```bash
# no destino (por exemplo, Backend)
iperf3 -s
# na origem (por exemplo, Frontend)
iperf3 -c IP_BACKEND -t 30
```

**Versão do TLS e certificado**

```bash
openssl s_client -connect HOST:443 -brief </dev/null
```

**Cenário moderado no k6** (`docs/redes/testes/moderado.js`)

```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
    scenarios: {
        moderado: {
            executor: 'constant-arrival-rate',
            rate: 25,
            timeUnit: '1s',
            duration: '5m',
            preAllocatedVUs: 50,
            maxVUs: 200,
        },
    },
    thresholds: {
        http_req_duration: ['p(95)<300'],
        http_req_failed: ['rate<0.01'],
    },
};

export default function () {
    const res = http.get(`${__ENV.BASE_URL}/api/v1/instituicoes`);
    check(res, { 'status 200': (r) => r.status === 200 });
}
```

Execução:

```bash
k6 run -e BASE_URL=https://HOST docs/redes/testes/moderado.js
```

**Emular rede degradada (somente no ambiente de teste)**

```bash
sudo tc qdisc add dev eth0 root netem delay 100ms loss 1%
# desfazer ao terminar
sudo tc qdisc del dev eth0 root
```
