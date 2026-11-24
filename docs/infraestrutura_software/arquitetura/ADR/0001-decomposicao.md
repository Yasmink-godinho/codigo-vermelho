# ADR 0001: Decomposição do Rota Vital

Status: proposto

## Contexto
O domínio atual está anêmico (entidades só com get/set) e o código é organizado por função técnica (`controllers/`, `services/`, `models/`), com as regras de negócio espalhadas nos *services*. Precisamos de um desenho orientado ao domínio (DDD), mas o time é pequeno (um squad), há uma única versão no ar e a carga atual é baixa a moderada.

## Decisão
Decompor o sistema em **6 bounded contexts** (Estoque, Atendimento, Expedição/Roteirização, Monitoramento, Análise & Redistribuição, Malha) implementados como **módulos dentro de um monólito modular** (um único artefato de deploy) com **domínio rico** (invariantes nas raízes de agregado) e **três camadas** (apresentação, negócio, dados) respeitando a regra de dependência da Clean Architecture. As fronteiras entre contextos são explícitas na estrutura de pacotes.

## Consequências
- **Melhora:** clareza do domínio, testabilidade (domínio puro), caminho evolutivo claro para microsserviços sem reescrever o domínio.
- **Piora:** exige disciplina para os módulos não vazarem uns nos outros (sem o isolamento forçado que microsserviços dariam).
- **Alternativa descartada:** ir direto para microsserviços agora, a complexidade de operação (orquestração, consistência eventual, observabilidade) e o custo não se justificam na carga atual.

Referências: EVANS, 2003; VERNON, 2013; NYGARD, 2011.