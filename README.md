<div align="center">

# 🩸 Código Vermelho

### Inteligência Logística na Gestão e Distribuição de Hemocomponentes

Projeto Integrador desenvolvido para o **3º semestre de Análise e Desenvolvimento de Sistemas (ADS) — 2026.2**, com aplicação de conceitos de **DDD, algoritmos de roteirização, estruturas de dados, programação concorrente, redes e análise estatística**.

<br>

![Java](https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge\&logo=openjdk\&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-6DB33F?style=for-the-badge\&logo=springboot\&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge\&logo=postgresql\&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.x-3776AB?style=for-the-badge\&logo=python\&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-2088FF?style=for-the-badge\&logo=githubactions\&logoColor=white)

</div>

---

## 📌 Sobre o Projeto

### 🩸 Código Vermelho
**Sistema Inteligente para Gestão e Logística de Hemocomponentes**

O **Código Vermelho** é uma aplicação web de inteligência logística para a **gestão e distribuição de hemocomponentes** entre hemocentros e unidades hospitalares.

A plataforma centraliza informações de estoque, validade, consumo, localização e solicitações hospitalares, auxiliando na identificação de bolsas compatíveis e na definição da melhor alternativa para sua distribuição, considerando urgência, validade, rota, tempo e condições de transporte.

**🚨 Diferencial**

O principal diferencial do Código Vermelho é a **Rede Inteligente de Redistribuição de Hemocomponentes**.

Em vez de apenas reagir às solicitações, o sistema analisa os estoques e o histórico de consumo das instituições participantes para identificar e antecipar riscos de desabastecimento e encontrar oportunidades de redistribuição dentro da rede.

Quando uma oportunidade é identificada, o sistema gera uma recomendação explicável, apresentando a origem, destino, quantidade e os fatores que justificam a decisão, como nível de estoque, demanda, validade e viabilidade logística.

O projeto integra conhecimentos de Programação Orientada a Objetos, Spring Boot, algoritmos e estruturas de dados, grafos, estatística, concorrência, redes de computadores, CI/CD e computação em nuvem, aplicados a um problema de logística na área da saúde.

> **Em resumo:** o Código Vermelho busca transformar a gestão de hemocomponentes de uma operação reativa em uma operação preventiva e inteligente, auxiliando na distribuição adequada dos recursos disponíveis.

> 🚀 **Status:** Em desenvolvimento.

---

## 🎯 Objetivos

O sistema tem como principais objetivos:

* Monitorar o estoque de hemocomponentes nas unidades da rede;
* Identificar e antecipar situações de estoque crítico e risco de desabastecimento;
* Priorizar bolsas com menor prazo de validade;
* Verificar quais bolsas são compatíveis com cada solicitação hospitalar;
* Apoiar a redistribuição de hemocomponentes entre unidades da rede;
* Otimizar rotas de transporte considerando tempo e condições da cadeia fria;
* Analisar o histórico de consumo para identificar padrões e necessidades;
* Gerar recomendações explicáveis para apoiar a tomada de decisão logística;
* Apresentar indicadores de estoque, demanda e transporte.

---

## 🧩 Módulos e Disciplinas

O projeto integra diferentes disciplinas e áreas técnicas:

### ☕ POO — Programação Orientada a Objetos

Desenvolvimento do backend em **Java/Spring Boot**, utilizando organização em camadas, entidades de domínio, serviços e endpoints REST.

### 🧮 AED — Algoritmos e Estruturas de Dados

Aplicação de algoritmos e estruturas de dados para problemas logísticos, incluindo:

* **Dijkstra** para cálculo de caminhos mínimos;
* **Heap / Priority Queue** para priorização de bolsas;
* Regras de compatibilidade sanguínea ABO/Rh.

### 📊 EST — Estatística

Aplicação de estatística descritiva para análise do consumo de hemocomponentes, incluindo:

* Média;
* Variância;
* Desvio padrão;
* Coeficiente de variação;
* Classificação da variabilidade da demanda;
* Indicadores para apoio à gestão de estoque.

### ⚙️ SO — Sistemas Operacionais

Aplicação de conceitos de concorrência e multithreading, além de processos relacionados à integração e automação do sistema.

### 🌐 RSD — Redes

Estudo e aplicação de conceitos relacionados à comunicação entre sistemas, telemetria e monitoramento da infraestrutura logística.

---

## 💡 Principais Histórias de Usuário

| ID       | História de Usuário     | Descrição                                                                                          |
| -------- | ----------------------- | -------------------------------------------------------------------------------------------------- |
| **US01** | Cadastro de Unidades    | Cadastro de hemocentros e hospitais, incluindo localização e parâmetros de estoque.                |
| **US02** | Gestão de Inventário    | Registro e gerenciamento dos lotes de bolsas de sangue, incluindo validade e classificação ABO/Rh. |
| **US03** | Fila de Prioridade FEFO | Priorização das bolsas com menor prazo de validade para reduzir perdas por vencimento.             |
| **US05** | Roteirização Logística  | Cálculo de rotas entre unidades utilizando algoritmos de caminho mínimo.                           |
| **US06** | Painel Descritivo       | Análise estatística do consumo e da variabilidade da demanda por tipo sanguíneo.                   |
| **US08** | Matching Imunológico    | Verificação da compatibilidade sanguínea entre doadores, bolsas e receptores.                      |

**➡️ [HISTORIAS_USUARIO.md](docs/HISTORIAS_USUARIO.md) - Detalhamento completo (formato BDD / 3Cs)**

---

## 🎨  Interface e Experiência

>  Confira o protótipo mapeamento telas × histórias e screencast

**➡️ [PROTOTIPO.md](docs/PROTOTIPO.md) - Protótipo de Interface do Código Vermelho**
 
---

## 📊 US06 — Painel Descritivo

O módulo estatístico do projeto tem como objetivo analisar o comportamento histórico do consumo de hemocomponentes e fornecer indicadores para apoiar a gestão do estoque.

As principais métricas utilizadas são:

### Média

Representa o consumo médio observado para determinado tipo sanguíneo.

```text
Média = Σ Consumo / n
```

### Variância

Mede a dispersão dos valores de consumo em relação à média.

### Desvio Padrão

Representa a variabilidade do consumo na mesma unidade de medida da variável analisada.

### Coeficiente de Variação

Permite comparar a variabilidade relativa entre diferentes tipos sanguíneos.

```text
CV = (Desvio Padrão / Média) × 100
```

A classificação utilizada pelo painel é:

| Coeficiente de Variação | Classificação          |
| ----------------------: | ---------------------- |
|            **CV < 15%** | Estável / Previsível   |
|      **15% ≤ CV < 30%** | Moderadamente Instável |
|            **CV ≥ 30%** | Alta Instabilidade     |

> Os limites de classificação são parâmetros definidos para o projeto e poderão ser ajustados conforme a análise dos dados.

---

## 🚨 Regras de Alerta de Estoque

O sistema utiliza regras de negócio para classificar a situação do estoque.

| Alerta                  | Condição                                             | Tag           | Ação                                                        |
| ----------------------- | ---------------------------------------------------- | ------------- | ----------------------------------------------------------- |
| **Normal**              | `Qtd_Atual ≥ Estoque_Minimo × 1,25`                  | 🟢 `VERDE`    | Operação regular.                                           |
| **Atenção**             | `Estoque_Minimo ≤ Qtd_Atual < Estoque_Minimo × 1,25` | 🟡 `AMARELO`  | Exibir alerta no dashboard.                                 |
| **Crítico**             | `Qtd_Atual < Estoque_Minimo`                         | 🔴 `VERMELHO` | Recomendar redistribuição entre unidades, quando aplicável. |
| **Risco de Vencimento** | `Dias_Para_Vencer ≤ 3`                               | 🟠 `LARANJA`  | Priorizar utilização do lote pela regra FEFO.               |

### FEFO

**FEFO — First Expire, First Out** é utilizado para priorizar os lotes com menor prazo de validade, reduzindo o risco de perdas por vencimento.

---

## 🏗️ Arquitetura do Sistema

A aplicação utiliza uma arquitetura em camadas, com conceitos de **Domain-Driven Design (DDD)**.

```text
┌──────────────────────────────────────────────────────────┐
│                    Interface / Frontend                  │
└─────────────────────────────┬────────────────────────────┘
                              │
                              │ HTTP / REST
                              ▼
┌──────────────────────────────────────────────────────────┐
│                Backend — Spring Boot / Java              │
│                                                          │
│     Controller → Service → Repository                    │
│                                                          │
│     ├── Gestão de Inventário                             │
│     ├── Regras de Estoque                                │
│     ├── FEFO                                             │
│     ├── Roteirização                                     │
│     └── Compatibilidade ABO/Rh                           │
└─────────────────────────────┬────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                    │
└──────────────────────────────────────────────────────────┘

                    ┌─────────────────┐
                    │ Python / Dados  │
                    │                 │
                    │ Pandas + NumPy  │
                    │                 │
                    │ Análise US06    │
                    └─────────────────┘
```

---

## 🛠️ Tecnologias Utilizadas

| Categoria            | Tecnologia          | Utilização                                   |
| -------------------- | ------------------- | -------------------------------------------- |
| Linguagem            | **Java 17**         | Desenvolvimento do backend                   |
| Framework            | **Spring Boot 3.x** | API REST e estrutura da aplicação            |
| Banco de Dados       | **PostgreSQL**      | Persistência dos dados                       |
| Linguagem de Análise | **Python 3.x**      | Análise estatística e processamento de dados |
| Biblioteca           | **Pandas**          | Manipulação e análise dos datasets           |
| Biblioteca           | **NumPy**           | Cálculos estatísticos e operações numéricas  |
| Build                | **Maven**           | Gerenciamento de dependências e build        |
| Versionamento        | **Git / GitHub**    | Controle de versão e colaboração             |
| CI/CD                | **GitHub Actions**  | Automação de processos de integração         |

---

## 🚀 Como Executar

### Pré-requisitos

Para executar o projeto localmente, serão necessários:

* Java 17 ou superior;
* Maven 3.8 ou superior;
* PostgreSQL 14 ou superior;
* Python 3.x;
* Git.

**➡️ [COMO_EXECUTAR.md](docs/COMO_EXECUTAR.md) - Guia completo e solução de problemas**

---
 
## 📂 Estrutura do Projeto
 
```text
codigo-vermelho/
│
├── src/
│   └── main/
│       ├── java/
│       │   └── com/
│       │        └── codigovermelho/
│       │               ├── controllers/
│       │               ├── services/
│       │               ├── models/
│       │               └── repositories/
│       │
│       └── resources/
│           └── application.properties
│
├── estatistica/
│   ├── main.py
│   ├── Dataset_Sintetico_Malha.csv
│   └── requirements.txt
│
├── docs/
│   ├── HISTORIAS_USUARIO.md
│   ├── COMO_EXECUTAR.md
│   ├── PROTOTIPO.md
│   └── ENTREGAS_POO.md
│
├── pom.xml
├── README.md
└── LICENSE
```

---

## 📦 Entregas do Projeto

**➡️ [ENTREGAS_POO.md](docs/ENTREGAS_POO.md) - Índice completo de artefatos por entrega (POO)**

### Sprint 01 - Definição da equipe e da solução.
### Sprint 02-03 - Modelagem e definição de dados/algoritmos. [Acessar](/docs/Sprint_02-03/)
### Sprint 04-05 - Setup de infraestrutura e início dos algoritmos. [Acessar](/docs/Sprint_04-05/)
### Sprint 06-07 - Acompanhamento integração. [Acessar](/docs/Sprint_06-07/)
### Sprint 08-09 - Checkpoint

---

 
## 👥 Equipe Código Vermelho
 
| Integrante                                 | Papel no Projeto                              | Disciplina Principal       | E-mail                | GitHub                                                 |
| ------------------------------------------ | --------------------------------------------- | --------------------------- | --------------------- | ------------------------------------------------------ |
| **Larissa Morais do Nascimento Lira**      | Scrum Master / Product Owner                  | Gestão de Projeto (Projetos 3)          | lmnl@cesar.school     | [@LarissamnLira](https://github.com/LarissamnLira)     |
| **Diogo Felipe da Silva Alcelino**         | Data Analyst / Data Scientist                 | EST — Estatística          | dfsa@cesar.school     | [@dioguis](https://github.com/dioguis)                 |
| **Thayná Verçosa de Andrade**              | UI/UX Designer                                | Protótipo e Interface      | tva@cesar.school      | [@thaynavercosa](https://github.com/thaynavercosa)     |
| **Yasmin Karolina Silva de Moura Godinho** | DevOps & Cloud Engineer                       | SO — Sistemas Operacionais | yksmg@cesar.school    | [@Yasmink-godinho](https://github.com/Yasmink-godinho) |
| **Kézia de Aguiar Albuquerque**            | Network & Telemetry Specialist                | RSD — Redes                | kaa@cesar.school      | [@keziaguiar12](https://github.com/keziaguiar12)       |
| **João Rafael Morato Uchoa Cavalcanti**    | Lead Backend Developer & Algorithmic Engineer | POO / AED                  | jrmuc@cesar.school    | [@jaozinnm](https://github.com/jaozinnm)               |
| **Isabela Karla de Araujo Silva**          | *A definir*                                   | Infraestrutura de Software               | ikas@cesar.school     | *A definir*                                             |
 
 
### Membros anteriores / novos
 
| Nome | E-mail | Data de entrada | Data de saída | Situação |
|---|---|---|---|---|
| Isabela Karla de Araujo Silva | ikas@cesar.school | 25 de Agosto de 2026 | — | Novo membro |
 
---

## 📄 Licença

Este projeto está licenciado sob a **MIT License**. Consulte o arquivo [`LICENSE`](LICENSE) para mais informações.

---

<div align="center">

### 🩸 Código Vermelho

**Transformando restrições técnicas em inteligência logística para a gestão de hemocomponentes.**

</div>
