# Evidências — Container, TDD e Deploy

Coloque aqui os prints/links. Checklist do que o enunciado pede:

## E1 — Container
- [ ] `docker compose ps` mostrando `api` e `db` **healthy** → `e1-compose-ps.png`
- [ ] API respondendo (ex.: `GET /api/v1/compatibilidade?doador=O-&receptor=AB+`) → `e1-api-ok.png`

## E2 — TDD
- [ ] Commit do teste **antes** do código (ex.: `test: US08...` seguido de `feat: US08...`) → `e2-red-green.png`
- [ ] Suíte verde no job `testes` do Actions → `e2-testes-verdes.png`
- [ ] (print do histórico `git log --oneline` mostrando o par test→feat) → `e2-git-log.png`

## E3 — Deploy
- [ ] Execução **vermelha** que barrou o merge/deploy → `e3-pipeline-vermelho.png`
- [ ] Execução **verde** que publicou (jobs testes → imagem → deploy) → `e3-pipeline-verde.png`
- [ ] Imagem publicada no GHCR (aba *Packages* do repositório) → `e3-ghcr.png`
- [ ] **URL pública do backend no ar** respondendo → `e3-url-backend.png`
- [ ] **URL pública do frontend no ar** carregando → `e3-url-frontend.png`
- [ ] Rollback (tela do Render *Deploys > Rollback* ou re-tag da imagem) → `e3-rollback.png`
