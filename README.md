
<div align="center">

```text
  ____ ___  ____ ___ ____  ___    _   _ _____ ____  __  __ _____ _     _  _  ___  
 / ___/ _ \|  _ |_ _| ___|/ _ \  | | | | ____|  _ \|  \/  | ____| |   | || |/ _ \ 
| |  | | | | | | | || |  | | | | | | | |  _| | |_) | |\/| |  _| | |   | || | | | |
| |__| |_| | |_| | || |__| |_| | | \_/ | |___|  _ <| |  | | |___| |___|__   _| |_|
 \____\___/|____/___|\____\___/   \___/|_____|_| \_|_|  |_|_____|_____|  |_|  \___/

```

### **Sistema Inteligente de Logística, Compatibilidade e Roteirização de Hemocomponentes**

*Uma plataforma robusta desenvolvida em **Java / Spring Boot** para otimização da cadeia de frio, alocação inteligente de bolsas e cálculo de rotas hospitalares em tempo crítico.*

---


## 📌 Visão Geral

O **Código Vermelho** é um sistema de alta complexidade projetado para sanar gargalos críticos na logística de distribuição de hemocomponentes entre hemocentros e redes hospitalares. A aplicação combina **modelagem relacional de estoque**, **algoritmos em grafos para transporte otimizado**, **validação automatizada de compatibilidade transfusional (ABO/Rh)** e **telemetria em tempo real para controle da cadeia fria**.

---

## 🚨 Problema vs. Solução

| Desafio da Rede de Sangue | Solução Implementada no Código Vermelho |
| --- | --- |
| **Descarte por Vencimento** | Algoritmo **FEFO** (*First Expired, First Out*) com priorização dinâmica via `PriorityQueue`. |
| **Incompatibilidade Transfusional** | Módulo de *Matching* automatizado para validação estrita de doador x receptor (ABO/Rh/Componentes). |
| **Atraso na Entrega Crítica** | Algoritmo de menor caminho em **Grafos** (Dijkstra) considerando janelas de tempo e raio geográfico. |
| **Degradação Térmica** | Telemetria simulada via sockets/REST para alertas de oscilação de temperatura na cadeia fria. |

---

## 🛠️ Arquitetura & Módulos Principais

```text
                            ┌──────────────────────────┐
                            │  Requisição Hospitalar   │
                            └────────────┬─────────────┘
                                         │
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                           CÓDIGO VERMELHO CORE API                             │
├───────────────────────┬───────────────────────────────┬────────────────────────┤
│ 🧬 Matching Service   │ 🗺️ Routing Engine (Grafo)     │ 🌡️ Telemetry Engine    │
│  - Compatibilidade    │  - Grafo com pesos de tempo   │  - Validação de faixa  │
│  - Priorização FEFO   │  - Menor caminho (Dijkstra)   │  - Alertas de ruptura  │
└───────────────────────┴───────────────┬───────────────┴────────────────────────┘
                                        │
                                        ▼
                            ┌──────────────────────────┐
                            │ Database (PostgreSQL/H2) │
                            └──────────────────────────┘

```

### 1. Engine de Compatibilidade (Matching)

Garante a segurança biológica antes do envio. Filtra bolsas disponíveis respeitando as matrizes de imuno-hematologia e seleciona as mais próximas da data de expiração para maximizar o aproveitamento do estoque.

### 2. Roteirização por Grafos (Routing Engine)

A malha de distribuição é representada como um **Grafo Ponderado e Dirigido**, onde os vértices são pontos de distribuição (hemocentros e hospitais) e as arestas são as vias com pesos calculados por tempo de deslocamento e urgência da demanda.

### 3. Telemetria da Cadeia Fria

Simulação contínua de sensores térmicos nas maletas/veículos de transporte. Caso a temperatura saia da faixa ideal (ex: $2^\circ\text{C}$ a $6^\circ\text{C}$ para concentrado de hemácias), o sistema aciona alertas operacionais imediatos.

---

## 💻 Tecnologias & Conceitos de Engenharia

### Stack Tecnológica

* **Linguagem Principal:** Java 17 
* **Framework:** Spring Boot 
* **Gerenciador de Dependências:** Apache Maven
* **Banco de Dados:** PostgreSQL (Produção) / H2 Database (Desenvolvimento)

### Ciência da Computação Aplicada

* **Grafos & Algoritmos:** Grafos ponderados, Busca pelo Caminho Mínimo (Dijkstra / A*).
* **Estruturas de Dados:** Filas de Prioridade (`PriorityQueue`), Tabela Hash (`HashMap`), Listas Adjacentes.
* **Estatística Descritiva:** Previsão de esgotamento de estoque, taxa de rotatividade e consumo por tipo sanguíneo.
* **Engenharia de Software:** Arquitetura em Camadas (Controller -> Service -> Repository), DTO Pattern, Clean Code e Princípios SOLID.

---

## 📂 Estrutura do Projeto

```text
src/main/java/com/rotavital/codigovermelho/
├── config/             # Beans de configuração (Swagger, CORS, etc.)
├── controller/         # Endpoints REST da aplicação
├── domain/             # Entidades de domínio (Bolsa, Hospital, Rota, Sensor)
├── dto/                # DTOs de entrada e saída de dados
├── exception/          # Handlers globais de exceções customizadas
├── repository/         # Interfaces de acesso ao banco (JPA)
├── service/            # Regras de negócio e motores analíticos
│   ├── matching/       # Lógica de compatibilidade e FEFO
│   ├── routing/        # Implementação do Grafo e Dijkstra
│   └── telemetry/      # Processamento de dados térmicos
└── util/               # Estruturas de dados auxiliares

```

---

## 🚀 Como Executar o Projeto

### Pré-requisitos

* **Java 17** ou superior instalado.
* **Git** instalado.
* **Maven** (ou utilize o Maven Wrapper embutido `./mvnw`).

### Executando Localmente

1. **Clone o repositório:**
```bash
git clone [https://github.com/SEU-USUARIO/codigo-vermelho.git](https://github.com/SEU-USUARIO/codigo-vermelho.git)
cd codigo-vermelho

```


2. **Compile e execute a aplicação via Maven Wrapper:**
* **Linux / Mac:**
```bash
./mvnw spring-boot:run

```


* **Windows (PowerShell / CMD):**
```cmd
.\mvnw.cmd spring-boot:run

```

## 👥 Equipe do Projeto

Projetado e desenvolvido durante o **3º Semestre · Rota Vital** no curso de **Análise e Desenvolvimento de Sistemas**:

| Integrante | Função / Foco Técnico | GitHub | LinkedIn |
| --- | --- | --- | --- |
| **Diogo Felipe da Silva Alcelino** |  | [@github](https://www.google.com/search?q=https://github.com) | [LinkedIn](https://www.google.com/search?q=https://linkedin.com) |
| **João Rafael Morato Uchoa Cavalcanti** |  | [@github](https://www.google.com/search?q=https://github.com) | [LinkedIn](https://www.google.com/search?q=https://linkedin.com) |
| **Kézia de Aguiar Albuquerque** |  | [@github](https://www.google.com/search?q=https://github.com) | [LinkedIn](https://www.google.com/search?q=https://linkedin.com) |
| **Larissa Morais do Nascimento Lira** |  | [@github](https://www.google.com/search?q=https://github.com) | [LinkedIn](https://www.google.com/search?q=https://linkedin.com) |
| **Thayná Verçosa de Andrade** | | [@github](https://www.google.com/search?q=https://github.com) | [LinkedIn](https://www.google.com/search?q=https://linkedin.com) |
| **Yasmin Karolina Silva de Moura Godinho** | | [@github](https://www.google.com/search?q=https://github.com) | [LinkedIn](https://www.google.com/search?q=https://linkedin.com) |

---

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - consulte o arquivo [LICENSE](https://www.google.com/search?q=LICENSE) para obter mais detalhes.
