# Pipeline de CI/CD e deploy — Rota Vital / Código Vermelho

## Fluxo

```
Código → GitHub (push na main) → GitHub Actions
  → Build (Maven, JDK 17)
  → Testes (mvn test)
  → se tudo passou: dispara o Deploy Hook do Render
  → Render builda a imagem Docker e sobe o container
  → Aplicação disponível publicamente
```

Definido em `.github/workflows/build.yml`. O job `build` compila e testa o backend; o job `deploy` só roda se o `build` passar, e somente em push direto na branch `main` (não em Pull Request), para nunca publicar código que ainda não foi revisado.

## Hospedagem

- **Serviço:** Render (render.com), plano free (Web Service).
- **Runtime:** Docker, a partir de `backend/Dockerfile`.
- **Root Directory** configurado no Render: `backend`.
- **Banco de dados:** H2 em memória (`jdbc:h2:mem:codigo_vermelho`), embutido na própria aplicação. Não há serviço de banco externo; os dados são recriados a cada reinício do container.

## Como o deploy é disparado

O Render expõe um **Deploy Hook**: uma URL única que, ao receber um `POST`, inicia um novo deploy do serviço. Essa URL é guardada como segredo no GitHub (`Settings > Secrets and variables > Actions`, nome `RENDER_DEPLOY_HOOK_URL`) e chamada pelo workflow:

```yaml
- name: Disparar deploy no Render
  run: |
    curl -f -X POST "${{ secrets.RENDER_DEPLOY_HOOK_URL }}"
```

Assim, o deploy não acontece a cada push por conta própria do Render, ele só acontece depois que o pipeline confirma que o build e os testes passaram.

## Aplicação disponível

URL pública: `https://<codigo-vermelho>.onrender.com` (preencher com a URL real depois de criar o serviço no Render).

Endpoint de exemplo:
```
GET https://<codigo-vermelho>.onrender.com/api/v1/analises/consumo?registros=100000&modo=sequencial
```

**Observação sobre o plano free do Render:** o serviço "dorme" depois de um período sem receber requisições, e a primeira chamada depois disso demora alguns segundos a mais para responder (o Render precisa religar o container). É um comportamento esperado do plano gratuito, não um erro da aplicação.

## Como reproduzir localmente

```
cd backend
./mvnw spring-boot:run
```

## Como reproduzir o pipeline do zero

1. Criar um Web Service no Render, conectado a este repositório, com Root Directory `backend` e Runtime Docker.
2. Copiar o Deploy Hook do serviço (em Settings, no painel do Render).
3. Adicionar esse valor como o segredo `RENDER_DEPLOY_HOOK_URL` no GitHub (Settings > Secrets and variables > Actions).
4. Qualquer push na branch `main` a partir daí builda, testa e publica automaticamente.