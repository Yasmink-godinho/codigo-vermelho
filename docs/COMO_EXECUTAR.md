# 🚀 Como Executar — Código Vermelho

Este documento detalha o passo a passo para configurar e rodar o projeto localmente.

---

## Pré-requisitos

| Ferramenta | Versão mínima | Verificar instalação |
|---|---|---|
| Java (JDK) | 17 | `java -version` |
| Maven | 3.8 | `mvn -version` |
| PostgreSQL | 14 | `psql --version` |
| Git | qualquer recente | `git --version` |

---

## 1. Clonar o repositório

```bash
git clone https://github.com/Yasmink-godinho/codigo-vermelho.git
cd codigo-vermelho
```

## 2. Configurar o banco de dados

Crie um banco PostgreSQL local:

```sql
CREATE DATABASE codigo_vermelho;
```

Configure as credenciais no arquivo:

```
src/main/resources/application.properties
```

Exemplo:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/codigo_vermelho
spring.datasource.username=seu_usuario
spring.datasource.password=sua_senha
spring.jpa.hibernate.ddl-auto=update
```

> ⚠️ **Nunca versione credenciais reais no GitHub.** Use variáveis de ambiente ou um `application-local.properties` ignorado pelo `.gitignore` em ambientes reais.

## 3. Executar o backend (Spring Boot)

**Windows:**
```bash
.\mvnw.cmd spring-boot:run
```

**Linux / macOS:**
```bash
./mvnw spring-boot:run
```

A aplicação sobe por padrão em `http://localhost:8080`.

---

## Problemas comuns

| Sintoma | Possível causa | Solução |
|---|---|---|
| `Connection refused` ao subir o Spring Boot | PostgreSQL não está rodando | Verifique se o serviço do PostgreSQL está ativo |
| `FATAL: password authentication failed` | Credenciais erradas no `application.properties` | Confira usuário/senha configurados |
| `mvnw: Permission denied` (Linux/macOS) | Script sem permissão de execução | Rode `chmod +x mvnw` antes de executar |


---

## Rodando os testes 

```bash
./mvnw test
```

*(Seção será expandida conforme os testes automatizados forem implementados nas próximas entregas.)*

---

## Variáveis de ambiente *(quando aplicável, a partir da integração com nuvem — SO/RSD)*

| Variável | Descrição |
|---|---|
| `SPRING_DATASOURCE_URL` | URL de conexão com o banco de produção/nuvem |
| `SPRING_DATASOURCE_USERNAME` | Usuário do banco |
| `SPRING_DATASOURCE_PASSWORD` | Senha do banco |

*(Preencher conforme a infraestrutura de nuvem for definida com a disciplina de SO.)*