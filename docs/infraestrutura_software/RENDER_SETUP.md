# Deploy no Render — dois serviços + banco

Arquitetura (mesmo repositório, três componentes):

```
GitHub (push na main) → Actions (testes → imagem → deploy)
        │
        ├─ Web Service  (backend Spring Boot, Docker, Root Directory = backend)  ──┐
        ├─ Static Site  (frontend React/Vite, Root Directory = frontend)          │
        └─ PostgreSQL   (banco gerenciado do Render) ◄──────────────────────────────┘
```

## Profiles do Spring (dev / test / prod)

| Profile | Onde roda | Banco |
|---|---|---|
| `dev` | máquina do dev (`./mvnw spring-boot:run`) | H2 em memória |
| `test` | suíte de testes (`./mvnw verify`) | H2 em memória |
| **`prod`** | **Render (produção)** | **PostgreSQL** (via `DB_URL`/`DB_USER`/`DB_PASSWORD`) |

Em produção é obrigatório ativar o profile prod: **`SPRING_PROFILES_ACTIVE=prod`**.
Sem isso, o serviço sobe em `dev` (H2) e os dados somem a cada reinício.

## 1. PostgreSQL

Render → **New > PostgreSQL** (plano free). Depois de criado, copie a
*Internal Database URL* e os dados de conexão — vão virar as variáveis do backend.

## 2. Web Service (backend)

Render → **New > Web Service** → conecte o repositório.

| Campo | Valor |
|---|---|
| Root Directory | `backend` |
| Runtime | `Docker` (usa `backend/Dockerfile`) |
| Environment | ver abaixo |

**Environment (Secrets):**
```
SPRING_PROFILES_ACTIVE = prod
DB_URL                 = jdbc:postgresql://<host>:5432/<database>   # do passo 1
DB_USER                = <user>
DB_PASSWORD            = <password>
APP_CORS_ALLOWED_ORIGINS = https://<seu-frontend>.onrender.com      # do passo 3
```

> `DB_URL` é o JDBC (`jdbc:postgresql://...`). Se o Render der uma URL no formato
> `postgres://user:pass@host/db`, converta para o formato JDBC acima e ponha
> usuário/senha em `DB_USER`/`DB_PASSWORD`.

Copie o **Deploy Hook** do serviço → GitHub Secret `RENDER_DEPLOY_HOOK_URL`.

> Memória do plano free (512 MB): o `Dockerfile` roda os testes no build. Se o
> build do Render ficar sem memória, duas saídas: (a) apontar o serviço para a
> imagem já testada no GHCR (*Deploy an existing image*, `ghcr.io/<owner>/<repo>:latest`),
> ou (b) deixar o gate de testes só na esteira do GitHub. A opção (a) é a mais
> fiel ao "deploy por imagem".

## 3. Static Site (frontend)

Render → **New > Static Site** → mesmo repositório.

| Campo | Valor |
|---|---|
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

**Environment:**
```
VITE_API_BASE_URL = https://<seu-backend>.onrender.com/api/v1
```

Copie o **Deploy Hook** → GitHub Secret `RENDER_DEPLOY_HOOK_FRONTEND_URL`.

> O `VITE_API_BASE_URL` é lido em *build time*; ao trocar a URL, é preciso um
> novo deploy do frontend.

## 4. Segredos no GitHub (cofre)

`Settings > Secrets and variables > Actions`:

| Segredo | Para quê |
|---|---|
| `RENDER_DEPLOY_HOOK_URL` | dispara o deploy do backend |
| `RENDER_DEPLOY_HOOK_FRONTEND_URL` | dispara o deploy do frontend |
| `GITHUB_TOKEN` | embutido; publica a imagem no GHCR (não criar) |

## 5. Ordem de primeira configuração

1. Cria o PostgreSQL.
2. Cria o Web Service com `DB_*` e `SPRING_PROFILES_ACTIVE=prod` (anota a URL do backend).
3. Cria o Static Site com `VITE_API_BASE_URL` = URL do backend + `/api/v1` (anota a URL do frontend).
4. Volta no Web Service e preenche `APP_CORS_ALLOWED_ORIGINS` com a URL do frontend.
5. Põe os dois Deploy Hooks nos GitHub Secrets. Pronto: cada push na main com esteira verde publica os dois.
