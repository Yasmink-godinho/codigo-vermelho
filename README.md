<div align="center">

# 🩸 Código Vermelho

### Inteligência Logística na Gestão e Distribuição de Hemocomponentes

Projeto Integrador desenvolvido para o **3º semestre de Análise e Desenvolvimento de Sistemas (ADS) — 2026.2**, com aplicação de conceitos de **DDD, algoritmos de roteirização, estruturas de dados, programação concorrente, redes e análise estatística**.

<br>

![Java](https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1.1-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![H2 Database](https://img.shields.io/badge/H2-Database-003B57?style=for-the-badge&logo=h2&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)

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
* 📂 Documentação: [`docs/poo/`](docs/poo/)

### 🧮 AED — Algoritmos e Estruturas de Dados

Aplicação de algoritmos e estruturas de dados para problemas logísticos, incluindo:

- **Modelagem em Grafos e Dijkstra** para conexões da malha logística com cálculo de caminhos mínimos;
- **Heap / Priority Queue** para priorização de lotes com validade próxima;
* Regras de compatibilidade sanguínea ABO/Rh.
* 📂 Documentação e códigos: [`docs/aed/`](docs/aed/)

### 📊 EST — Estatística

Aplicação de estatística descritiva para análise do consumo de hemocomponentes, incluindo:

* Média;
* Variância;
* Desvio padrão;
* Coeficiente de variação;
* Classificação da variabilidade da demanda;
* Indicadores para apoio à gestão de estoque.

### ⚙️ SO — Infraestrutura de Software

Aplicação de conceitos de concorrência e multithreading, além de processos relacionados à integração e automação do sistema.
* 📂 Documentação: [`docs/infraestrutura_software/`](docs/infraestrutura_software/)

### 🌐 RSD — Infraestrutura de Comunicação

Estudo e aplicação de conceitos relacionados à comunicação entre sistemas, telemetria e monitoramento da infraestrutura logística.
* 📂 Documentação: [`docs/redes/`](docs/redes/)

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

A aplicação é dividida em dois ecossistemas desacoplados que comunicam via JSON sobre HTTP:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                      Frontend SPA (React 19 + Vite)                    │
│          Componentes Tailwind CSS | Recharts | React Router v7         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    │ Chamadas REST HTTP (JSON)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Backend API (Spring Boot / Java 17)                  │
│                                                                        │
│   Controllers (REST) ──► Services (Regras de Negócio) ──► Repositories │
│                                                                        │
│   ├── Gestão de Instituições                                           │
│   ├── Lotes de Hemocomponentes & FEFO                                  │
│   ├── Regulação de Requisições Hospitalares                            │
│   └── Processamento Concorrente de Consumo                             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                       ┌────────────┴────────────┐
                       ▼                         ▼
            ┌─────────────────────┐   ┌─────────────────────┐
            │   H2 In-Memory DB   │   │ PostgreSQL Database │
            │    (Perfil dev)     │   │    (Perfil prod)    │
            └─────────────────────┘   └─────────────────────┘
```

---

## 🛠️ Tecnologias Utilizadas

| Categoria | Tecnologia | Utilização |
| :--- | :--- | :--- |
| **Linguagem Principal (Back)** | **Java 17 (LTS)** | Desenvolvimento da API REST e regras de negócio |
| **Framework Backend** | **Spring Boot 4.1.1** | Estrutura principal da API RESTful |
| **Persistência / ORM** | **Spring Data JPA / Hibernate** | Mapeamento objeto-relacional e operações de banco |
| **Banco de Dados (Dev)** | **H2 Database** | Banco de dados relacional em memória com console web ativada |
| **Banco de Dados (Prod)** | **PostgreSQL** | Persistência definitiva dos dados da malha logística |
| **Concorrência** | **Java Concurrency / Threads** | Processamento paralelo e pool de threads para simulação de consumo |
| **Módulos Complementares** | **C++ 17** | Rotinas de análise estatística e processamento de malha em AED |
| **Biblioteca Web (Front)** | **React 19** | Interface de usuário Single-Page Application (SPA) |
| **Linguagem (Front)** | **TypeScript 5.7** | Tipagem estática e segurança de código na interface |
| **Build Tool (Front)** | **Vite 6** | Servidor de desenvolvimento rápido e empacotamento do frontend |
| **Estilização** | **Tailwind CSS v4** | Design responsivo e componentes visuais do dashboard |
| **Build Tool (Back)** | **Maven (Wrapper ./mvnw)** | Gestão de dependências e compilação do ecossistema Java |
| **Versionamento** | **Git / GitHub** | Controle de versão distribuído e colaboração |
| **CI/CD** | **GitHub Actions** | Esteira automatizada de build e execução de testes contínuos |

---

## 🚀 Como Executar

### Pré-requisitos

Para executar o projeto localmente, serão necessários:

* **Java JDK 17** ou superior instalado e configurado nas variáveis de ambiente;
* **Node.js 20+** e gerenciador de pacotes (**npm**, **pnpm** ou **yarn**) para o frontend;
* **Git** para clonagem e sincronização do repositório;

---

### Execução do Projeto

#### 1. Backend (Spring Boot 4.1.1)

No terminal, a partir da raiz do repositório:

```bash
cd backend
./mvnw spring-boot:run

```

* **API REST:** `http://localhost:8080/api/v1`

* **Console Web H2:** `http://localhost:8080/h2-console`

#### 2. Frontend (React / Vite)

Em outra janela de terminal, a partir da raiz do repositório:

```bash
cd frontend
npm install
npm run dev

```

* **Aplicação Web:** `http://localhost:5173`


**➡️ [COMO_EXECUTAR.md](docs/COMO_EXECUTAR.md) - Guia completo e solução de problemas**

---
 
## 📂 Estrutura do Projeto
 
```text
codigo-vermelho/
├── .github/
│   └── workflows/
│       └── build.yml
├── backend/
│   ├── src/main/java/com/codigovermelho/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── repositories/
│   │   └── services/
│   ├── src/main/resources/
│   │   └── application.properties
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── data/
│   │   ├── pages/
│   │   └── types/
│   ├── package.json
│   └── vite.config.ts
├── docs/
│   ├── aed/
│   ├── infraestrutura_software/
│   ├── poo/
│   ├── redes/
│   ├── img/
│   ├── COMO_EXECUTAR.md
│   ├── PROTOTIPO.md
│   └── RESULTADO_ROTA.md
├── pom.xml
├── README.md
└── LICENSE
```

---

## 📦 Entregas do Projeto

**➡️ [ENTREGAS_POO.md](docs/poo/ENTREGAS_POO.md) - Índice completo de artefatos por entrega (POO)**

---

 
## 👥 Equipe Código Vermelho
 
| Integrante                                 | Papel no Projeto                              | Disciplina Principal       | E-mail                | GitHub                                                 |
| ------------------------------------------ | --------------------------------------------- | --------------------------- | --------------------- | ------------------------------------------------------ |
| **Larissa Morais do Nascimento Lira**      | Scrum Master / Product Owner                  | Gestão de Projeto (Projetos 3)          | lmnl@cesar.school     | [@LarissamnLira](https://github.com/LarissamnLira)     |
| **Diogo Felipe da Silva Alcelino**         | Data Analyst / Data Scientist                 | EST — Estatística          | dfsa@cesar.school     | [@dioguis](https://github.com/dioguis)                 |
| **Thayná Verçosa de Andrade**              | UI/UX Designer & Algorithmic Specialist                                | AED — Algoritmos / UX      | tva@cesar.school      | [@thaynavercosa](https://github.com/thaynavercosa)     |
| **Yasmin Karolina Silva de Moura Godinho** | Backend Developer & Domain Engineer                       | POO | yksmg@cesar.school    | [@Yasmink-godinho](https://github.com/Yasmink-godinho) |
| **Kézia de Aguiar Albuquerque**            | Network & Telemetry Specialist                | RSD — Redes                | kaa@cesar.school      | [@keziaguiar12](https://github.com/keziaguiar12)       |
| **João Rafael Morato Uchoa Cavalcanti**    | Lead Backend Developer & Algorithmic Engineer | POO/AED       | jrmuc@cesar.school    | [@jaozinnm](https://github.com/jaozinnm)               |
| **Isabela Karla de Araujo Silva**          | Software Infrastructure Engineer                                  | Infraestrutura de Software | ikas@cesar.school     | [@isabelakarla](https://github.com/isabelakarla)       |
 
 
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
