# Como Executar — Código Vermelho

Este guia cobre o ambiente containerizado com PostgreSQL e a execução local do backend.

## Pré-requisitos

| Ferramenta | Versão mínima | Verificar instalação |
|---|---|---|
| Docker Desktop com Docker Compose | Compose v2 | `docker compose version` |
| Java (JDK), para execução sem Docker | 17 | `java -version` |
| Git | versão recente | `git --version` |

## Executar API e PostgreSQL com Docker Compose

Na raiz do repositório, crie o arquivo local `.env` a partir do exemplo:

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**Linux / macOS:**

```bash
cp .env.example .env
```

Os valores do exemplo são destinados apenas ao desenvolvimento local. Revise-os antes de compartilhar o ambiente. O arquivo `.env` é ignorado pelo Git.

Suba os serviços:

```bash
docker compose up --build
```

O Compose inicia o PostgreSQL e aguarda seu healthcheck antes de iniciar a API. A aplicação fica disponível em `http://localhost:8080`. A API também possui healthcheck de readiness em `/actuator/health/readiness`. O volume nomeado `postgres_data` persiste os dados do banco entre reinicializações.

Confira o estado dos serviços:

```bash
docker compose ps
```

Consulte logs:

```bash
docker compose logs -f api db
```

Encerre os containers sem apagar os dados:

```bash
docker compose down
```

Para apagar também o volume e os dados do banco (operação destrutiva):

```bash
docker compose down --volumes
```

## Executar o backend sem Docker

Sem variáveis de ambiente, o backend usa H2 em memória. Os dados desse banco são perdidos ao reiniciar a aplicação. A partir da raiz do repositório:

**Windows PowerShell:**

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

**Linux / macOS:**

```bash
cd backend
./mvnw spring-boot:run
```

A aplicação fica disponível em `http://localhost:8080`.

Para apontar o backend para outro PostgreSQL, configure as variáveis `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME` e `SPRING_DATASOURCE_PASSWORD` no ambiente. Não coloque credenciais reais em `application.properties` nem em arquivos versionados.

## Testes

Os testes automatizados usam H2 e podem ser executados a partir da pasta `backend`:

**Windows PowerShell:**

```powershell
.\mvnw.cmd test
```

**Linux / macOS:**

```bash
./mvnw test
```

## Variáveis de ambiente do Compose

| Variável | Descrição |
|---|---|
| `POSTGRES_DB` | Nome do banco criado no container PostgreSQL |
| `POSTGRES_USER` | Usuário do banco |
| `POSTGRES_PASSWORD` | Senha do banco para desenvolvimento local |

O Compose configura as variáveis `SPRING_DATASOURCE_*` da API a partir desses valores. Em ambientes públicos, use os secrets da plataforma de deploy, não os valores de desenvolvimento do `.env.example`.

## Problemas comuns

| Sintoma | Verificação |
|---|---|
| API não fica saudável | Consulte `docker compose ps` e `docker compose logs api db`; confira se o banco ficou saudável. |
| `FATAL: password authentication failed` | Confira se as variáveis do `.env` estão consistentes. Se reutilizou um volume inicializado com outras credenciais, siga o procedimento de atualização do banco ou remova o volume apenas se puder descartar os dados. |
| `mvnw: Permission denied` no Linux/macOS | Execute `chmod +x mvnw` na pasta `backend`. |
