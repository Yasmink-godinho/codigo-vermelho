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
