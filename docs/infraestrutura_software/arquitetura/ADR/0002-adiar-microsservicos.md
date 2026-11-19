# ADR 0002: Adiar microsserviços e manter o monólito modular

Status: proposto

## Contexto
Há pressão por "arquitetura moderna" (microsserviços), mas a carga real do Rota Vital hoje é baixa a moderada, o time é um squad só e há prazo de entrega. Os cenários da Seção E mostram que apenas no cenário **alto** (~400 req/s, ~80 conexões simultâneas) surgem gargalos que justificariam escalar contextos isoladamente.

## Decisão
Manter o **monólito modular** agora. Migrar um contexto específico para microsserviço **somente quando um gatilho de carga/risco for atingido**, por exemplo: telemetria acima da capacidade de ingestão de uma instância, necessidade de escalar a roteirização (CPU) de forma isolada, ou conexões de banco no limite exigindo *pooler* + réplica. Os gatilhos concretos são os do cenário **alto** da Seção E.

## Consequências
- **Melhora:** menor custo e complexidade de operação agora; entrega no prazo; foco em arrumar o domínio (DDD + camadas) antes de distribuir.
- **Piora:** o time não exercita ainda a operação distribuída (saga, consistência eventual, tracing); a decisão terá de ser revisitada quando a carga crescer.
- **Alternativa descartada:** *big-bang* para microsserviços — alto risco de reescrita e de incidentes sem ganho proporcional na carga atual.

Referências: NEWMAN, 2021; JONAS et al., 2019 (serverless); slides das aulas 006 e 007.