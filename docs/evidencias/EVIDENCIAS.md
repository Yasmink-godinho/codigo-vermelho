# Evidências do E1 — Desafio de SO

Esta pasta reúne evidências da execução local do container com PostgreSQL.

## E1 — Subida dos serviços e persistência

O arquivo [e1-persistencia.txt](./e1-persistencia.txt) é a transcrição do PowerShell, ele registra:

- A resposta `{"status":"UP"}` do endpoint de prontidão da API.
- A instituição de teste `Instituicao Teste E1` retornada pela API depois do reinício dos serviços.

Esse registro demonstra que o dado continuou disponível após reiniciar os containers sem remover o volume do PostgreSQL. Não executar `docker compose down --volumes` antes de repetir a verificação, pois isso apaga os dados persistidos.

O arquivo [e1-status.txt](./e1-status.txt) registra uma verificação adicional com os dois containers saudáveis, readiness `UP` e a instituição de teste retornada pela API.



## Arquivos relacionados

- [compose.yaml](../../compose.yaml): API, PostgreSQL, volume e healthchecks.
- [Dockerfile](../../backend/Dockerfile): build multi-stage e healthcheck da API.
- [Como executar](../COMO_EXECUTAR.md): passos para subir e verificar o ambiente.
