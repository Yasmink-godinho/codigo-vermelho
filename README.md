<div align="center">

# 🩸 Código Vermelho

### Sistema Inteligente para Gestão e Logística de Hemocomponentes

**Projeto acadêmico desenvolvido para a Rota Vital, com foco na aplicação de tecnologia aos desafios relacionados à gestão, logística e distribuição de hemocomponentes.**

<br>

![Java](https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge\&logo=openjdk\&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-6DB33F?style=for-the-badge\&logo=springboot\&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge\&logo=postgresql\&logoColor=white)
![Maven](https://img.shields.io/badge/Maven-C71A36?style=for-the-badge\&logo=apachemaven\&logoColor=white)

</div>

---

## 📌 Sobre o Projeto

O **Código Vermelho** é um projeto desenvolvido no contexto da **Rota Vital**, com o objetivo de explorar como soluções de tecnologia podem contribuir para desafios relacionados à **gestão e logística de hemocomponentes**.

A proposta ainda está em fase de definição e, por isso, as funcionalidades, regras de negócio e soluções que serão implementadas estão sendo construídas ao longo do desenvolvimento do projeto.

O sistema deverá utilizar tecnologia para apoiar algum dos processos relacionados à cadeia de distribuição de hemocomponentes, buscando futuramente definir uma solução que seja **útil, viável e alinhada às necessidades identificadas pelo projeto**.

> 🚧 **Status do projeto:** Em desenvolvimento e definição de requisitos.

---

## 🎯 Contexto

A logística de hemocomponentes envolve diferentes fatores que precisam ser considerados para garantir que os recursos disponíveis sejam administrados de maneira adequada.

Entre os possíveis desafios relacionados ao contexto estão:

* 🩸 Gestão de hemocomponentes;
* 📦 Controle e organização de estoque;
* 🚚 Logística e distribuição;
* ⏱️ Atendimento dentro de períodos críticos;
* 🌡️ Conservação adequada durante o transporte;
* 🏥 Comunicação entre os diferentes pontos da rede.

**As funcionalidades e prioridades específicas do sistema ainda serão definidas durante as próximas etapas do projeto.**

---

## 💡 Proposta

O **Código Vermelho** busca desenvolver uma solução tecnológica que possa auxiliar algum dos processos relacionados à logística de hemocomponentes.

Neste momento, a equipe está trabalhando na definição de:

* Problema específico a ser solucionado;
* Público e usuários do sistema;
* Requisitos funcionais;
* Requisitos não funcionais;
* Fluxos da aplicação;
* Regras de negócio;
* Funcionalidades;
* Arquitetura definitiva da solução.

Por isso, determinadas partes deste README serão atualizadas conforme o projeto evoluir.

---

# 🏗️ Arquitetura

A arquitetura definitiva da aplicação **ainda está em definição**.

A estrutura será documentada nesta seção conforme as decisões técnicas e os requisitos do projeto forem estabelecidos.

```text
                    ┌─────────────────────────┐
                    │       Aplicação         │
                    │                         │
                    │   Código Vermelho       │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │      PostgreSQL         │
                    │                         │
                    │     Banco de Dados      │
                    └─────────────────────────┘
```

> 🔧 **Arquitetura em construção.**
> A organização dos módulos e responsabilidades será definida durante o desenvolvimento.

---

# 💻 Tecnologias

As tecnologias atualmente definidas para o projeto são:

| Tecnologia          | Utilização                    |
| ------------------- | ----------------------------- |
| ☕ **Java 17**       | Linguagem de programação      |
| 🍃 **Spring Boot**  | Framework da aplicação        |
| 🐘 **PostgreSQL**   | Banco de dados                |
| 📦 **Apache Maven** | Gerenciamento de dependências |

Outras tecnologias poderão ser adicionadas conforme os requisitos e decisões técnicas do projeto forem definidos.

---

# 🗄️ Banco de Dados

O projeto utilizará o **PostgreSQL** como banco de dados.

A modelagem definitiva ainda está em desenvolvimento e será documentada conforme as entidades e regras de negócio forem estabelecidas.

```text
┌─────────────────────────────┐
│         PostgreSQL          │
│                             │
│   Modelagem em definição    │
│                             │
└─────────────────────────────┘
```

---

# 📂 Estrutura do Projeto

A estrutura definitiva do projeto ainda será definida conforme a implementação avançar.

Por enquanto, a organização inicial seguirá a estrutura padrão do projeto Java/Spring Boot:

```text
src/
└── main/
    ├── java/
    │   └── com/
    │       └── rotavital/
    │           └── codigovermelho/
    │
    └── resources/
        ├── application.properties
        └── ...
```

> 📌 A organização dos pacotes será atualizada conforme os módulos e responsabilidades forem definidos.

---

# 🚀 Como Executar

## 📋 Pré-requisitos

Para executar o projeto localmente, será necessário ter instalado:

* **Java 17 ou superior**
* **Git**
* **Maven** ou Maven Wrapper
* **PostgreSQL**

---

## 1. Clone o repositório

```bash
git clone https://github.com/SEU-USUARIO/codigo-vermelho.git

cd codigo-vermelho
```

> 🔧 O endereço definitivo do repositório será atualizado quando o repositório oficial estiver definido.

---

## 2. Configure o PostgreSQL

Crie um banco de dados PostgreSQL para a aplicação.

As configurações de conexão deverão ser adicionadas ao arquivo:

```text
src/main/resources/application.properties
```

Exemplo:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/codigo_vermelho
spring.datasource.username=seu_usuario
spring.datasource.password=sua_senha
```

> ⚠️ As credenciais utilizadas localmente não devem ser versionadas no repositório.

---

## 3. Execute a aplicação

### Linux / macOS

```bash
./mvnw spring-boot:run
```

### Windows

```cmd
.\mvnw.cmd spring-boot:run
```

---

# 🚧 Roadmap

Como o projeto ainda está em fase de definição, o roadmap será construído gradualmente.

### 🔎 Etapa 1 — Descoberta

* [ ] Definição do problema
* [ ] Levantamento de requisitos
* [ ] Identificação dos usuários
* [ ] Definição das necessidades do sistema

### 🧠 Etapa 2 — Planejamento

* [ ] Definição das funcionalidades
* [ ] Modelagem do banco de dados
* [ ] Definição da arquitetura
* [ ] Prototipação das interfaces

### 💻 Etapa 3 — Desenvolvimento

* [ ] Implementação da aplicação
* [ ] Integração com PostgreSQL
* [ ] Implementação das funcionalidades definidas
* [ ] Testes

### 🚀 Etapa 4 — Entrega

* [ ] Documentação
* [ ] Validação da solução
* [ ] Apresentação
* [ ] Deploy

---

# 👥 Equipe

Projeto desenvolvido durante o **3º semestre do curso de Análise e Desenvolvimento de Sistemas**, no contexto da **Rota Vital**.

| Integrante                                 | GitHub                                                 |
| ------------------------------------------ | ------------------------------------------------------ |
| **Diogo Felipe da Silva Alcelino**         | [@dioguis](https://github.com/dioguis)                 |
| **João Rafael Morato Uchoa Cavalcanti**    | [@jaozinnm](https://github.com/jaozinnm)               |
| **Kézia de Aguiar Albuquerque**            | [@keziaguiar12](https://github.com/keziaguiar12)       |
| **Larissa Morais do Nascimento Lira**      | [@LarissamnLira](https://github.com/LarissamnLira)     |
| **Thayná Verçosa de Andrade**              | [@thaynavercosa](https://github.com/thaynavercosa)     |
| **Yasmin Karolina Silva de Moura Godinho** | [@Yasmink-godinho](https://github.com/Yasmink-godinho) |

---

# 📚 Contexto Acadêmico

O **Código Vermelho** está sendo desenvolvido como parte das atividades acadêmicas do curso de **Análise e Desenvolvimento de Sistemas**, buscando aplicar conhecimentos de desenvolvimento de software em um problema relacionado à área da saúde e logística.

O projeto encontra-se em evolução e sua definição será construída de forma colaborativa pela equipe ao longo das etapas de pesquisa, planejamento, desenvolvimento e validação.

---

# 📄 Licença

Este projeto está licenciado sob a **MIT License**.

Consulte o arquivo [`LICENSE`](LICENSE) para mais informações.

---

<div align="center">

### 🩸 Código Vermelho

**Um projeto em construção para transformar necessidades reais em soluções tecnológicas.**

<br>

*Desenvolvido pela equipe Rota Vital.*

</div>
