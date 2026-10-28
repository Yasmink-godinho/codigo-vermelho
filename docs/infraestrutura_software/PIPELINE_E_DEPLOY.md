# E3 — Pipeline, fluxo de branch e deploy

## 1. Pipeline (build → testes → imagem → deploy)

Definido em `.github/workflows/build.yml`. Três jobs encadeados:

```
Pull Request  →  [testes]                                  (gate: PR vermelho não mergeia)
push na main  →  [testes] → [imagem] → [deploy]            (só publica com a esteira verde)
```

| Job | Quando roda | O que faz |
|---|---|---|
| **testes** | PR e push na main | `./mvnw clean verify` — compila e roda toda a suíte. É o **gate**: se falhar, nada abaixo roda. |
| **imagem** | só push na main | Build da imagem Docker (`backend/Dockerfile`) e push para o **GHCR** com as tags `:latest` e `:<sha>`. `needs: testes`. |
| **deploy** | só push na main | Dispara o Deploy Hook do Render via `curl`. `needs: imagem`. |

O `if: github.ref == 'refs/heads/main'` garante que imagem e deploy **só
acontecem depois do merge**, nunca a partir de um PR aberto.

## 2. Fluxo de branch — GitHub Flow

**Escolha: GitHub Flow.** `main` sempre no ar; todo trabalho em branch curta
(`feat/...`, `fix/...`), integrada por Pull Request, deploy a cada merge.

**Por que esse e não outro:** o grupo é pequeno, há **uma única versão em
produção** e queremos deploy contínuo a cada merge. O Git Flow (com `develop`,
`release/*`, `hotfix/*`) é feito para versões paralelas e releases agendados —
peso desnecessário aqui. O GitLab Flow (branch por ambiente) só compensaria com
staging/produção separados, que não temos.

### main protegida (configurar no GitHub)

`Settings > Branches > Add branch ruleset` para `main`:
- **Require a pull request before merging** (bloqueia push direto).
- **Require status checks to pass** → selecionar o check **`testes`**.
- (Opcional) Require 1 approval.

Assim, um PR com o job `testes` vermelho **não consegue ser mergeado** — é a
tradução, na plataforma, do "teste vermelho barra o merge".

## 3. Deploy e segredos

- **Provedor:** Render (plano free). **Dois serviços no mesmo repositório:**
  - **Web Service** — backend Spring Boot, Docker, Root Directory `backend`, profile `prod` + PostgreSQL gerenciado.
  - **Static Site** — frontend React/Vite, Root Directory `frontend`, Publish `dist`.
- **Segredos (cofre do GitHub, `Settings > Secrets and variables > Actions`):**
  - `RENDER_DEPLOY_HOOK_URL` — dispara o deploy do backend.
  - `RENDER_DEPLOY_HOOK_FRONTEND_URL` — dispara o deploy do frontend.
  - `GITHUB_TOKEN` — embutido no Actions, usado para publicar a imagem no GHCR (não precisa criar).
- Nenhum segredo fica no repositório; o `.env` local está no `.gitignore` e só o `.env.example` (sem senha real) é versionado.

> **Profiles:** `dev` e `test` usam H2; **produção usa `prod` + PostgreSQL**,
> ativado com `SPRING_PROFILES_ACTIVE=prod`. Passo a passo completo dos dois
> serviços, do banco, das variáveis (`DB_*`, `APP_CORS_ALLOWED_ORIGINS`,
> `VITE_API_BASE_URL`) e dos hooks em **`RENDER_SETUP.md`**.

## 4. Rollback

**Opção A — pela imagem (recomendada):** cada push na main gera uma imagem
`ghcr.io/<owner>/<repo>:<sha>`. Para voltar, basta apontar o serviço do Render
para a tag `<sha>` da versão anterior (ou re-taggar aquela imagem como `:latest`
e redeployar).

**Opção B — pelo Render:** `Dashboard do serviço > Deploys > <deploy anterior> >
Rollback`. O Render redeploya o build anterior em um clique.

**Opção C — pelo Git:** `git revert <commit-ruim>` e push na main — a esteira
roda de novo e publica a versão corrigida.

## 5. Evidências a anexar (em `docs/infraestrutura_software/evidencias/`)

Ver `docs/infraestrutura_software/evidencias/README.md` para a lista do que capturar: execução
**vermelha** que barrou o merge/deploy, execução **verde** que publicou, a
**URL no ar** respondendo, e a tela de **rollback**.
