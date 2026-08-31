# 📋 Histórias de Usuário — Código Vermelho

Este documento contém as histórias de usuário do projeto, escritas no padrão **3Cs (Cartão, Conversa, Confirmação)**, com os cenários de validação especificados em **BDD (Behaviour Driven Development)** no formato Dado–Quando–Então.

> Cada cenário é classificado como **Positivo** (fluxo esperado) ou **Negativo** (erro, exceção ou restrição).

---

## US01 — Cadastro de Unidades da Malha

**Cartão:** Como Gestora da Hemorrede, eu gostaria de cadastrar hemocentros e hospitais com coordenadas e estoque de segurança, para mapear a malha logística de distribuição.

**Conversa:** O Product Owner define que o cadastro deve incluir nome, tipo de instituição (Hemocentro, Hospital Público, Hospital Privado, Maternidade ou UPA), endereço, coordenadas geográficas e o estoque mínimo de segurança por tipo sanguíneo (8 tipos ABO/Rh). A unidade cadastrada passa a integrar a malha logística e pode receber e enviar hemocomponentes.

**Cenários de validação:**

**Cenário 1 (Positivo): Cadastro válido**
Dado que a Gestora da Hemorrede está autenticada no sistema, quando ela informa nome, tipo de instituição, endereço, coordenadas válidas e estoque mínimo por tipo sanguíneo, então o sistema cadastra a unidade e ela passa a aparecer na listagem da malha logística.

**Cenário 2 (Negativo): Coordenadas inválidas**
Dado que a Gestora da Hemorrede está na tela de cadastro, quando ela informa uma latitude ou longitude fora do intervalo geográfico válido, então o sistema exibe a mensagem "Coordenadas inválidas" e não persiste o cadastro.

---

## US02 — Gestão de Inventário e Validade

**Cartão:** Como Responsável Hospitalar, eu gostaria de registrar lotes de hemocomponentes com data de coleta e validade, para controlar o estoque em tempo real.

**Conversa:** O PO especifica que cada lote deve conter tipo sanguíneo, componente (Concentrado de Hemácias, Plasma, Plaquetas ou Crioprecipitado), data de coleta, data de validade (calculada automaticamente a partir do prazo padrão do componente, mas editável) e quantidade. O sistema deve gerar um código de lote automaticamente.

**Cenários de validação:**

**Cenário 1 (Positivo): Registro de lote válido**
Dado que o Responsável Hospitalar está autenticado, quando ele registra um lote com tipo ABO/Rh, componente, data de coleta e validade futura, então o lote é adicionado ao estoque da instituição com um código gerado automaticamente.

**Cenário 2 (Negativo): Validade retroativa**
Dado que o Responsável Hospitalar está registrando um novo lote, quando ele informa uma data de validade anterior à data atual, então o sistema rejeita o registro e exibe a mensagem "Data de validade não pode ser retroativa".

---

## US03 — Fila de Prioridade FEFO

**Cartão:** Como Operador do Sistema, eu gostaria de visualizar a fila de bolsas disponíveis priorizada pela menor data de validade, para evitar perdas e descartes desnecessários.

**Conversa:** O PO define que a fila deve seguir a regra **FEFO (First Expire, First Out)**: bolsas mais próximas do vencimento aparecem primeiro. A tela permite filtrar por tipo sanguíneo e por instituição, e destaca visualmente bolsas com vencimento crítico (≤ 3 dias).

**Cenários de validação:**

**Cenário 1 (Positivo): Ordenação FEFO**
Dado que existem bolsas cadastradas com validades diferentes para um tipo sanguíneo, quando o Operador acessa a fila de prioridade, então as bolsas são exibidas em ordem crescente de data de validade.

**Cenário 2 (Negativo): Nenhuma bolsa disponível**
Dado que não há bolsas cadastradas para o filtro selecionado (tipo sanguíneo e/ou instituição), quando o Operador acessa a fila de prioridade, então o sistema exibe a mensagem "Nenhuma bolsa disponível para este filtro".

---

## US04 — Emissão de Requisições Hospitalares

**Cartão:** Como Responsável Hospitalar, eu gostaria de emitir requisições de bolsas informando tipo, volume e urgência, para suprir a demanda da minha unidade.

**Conversa:** O PO especifica que toda requisição deve conter instituição solicitante, tipo sanguíneo, componente, volume e nível de urgência (Rotina, Prioritária ou Emergência), além de um campo opcional de observações clínicas. A requisição entra no sistema com status "Pendente" e timestamp de criação.

**Cenários de validação:**

**Cenário 1 (Positivo): Requisição válida**
Dado que o Responsável Hospitalar está autenticado, quando ele informa tipo sanguíneo, componente, volume e nível de urgência, então a requisição é registrada com status "Pendente" e horário de criação.

**Cenário 2 (Negativo): Campos obrigatórios ausentes**
Dado que o Responsável Hospitalar está emitindo uma requisição, quando ele tenta enviá-la sem preencher o tipo sanguíneo ou o volume, então o sistema rejeita o envio e indica os campos obrigatórios pendentes.

---

## US05 — Roteirização Logística Otimizada

**Cartão:** Como Gestora da Hemorrede, eu gostaria de calcular a rota mais rápida entre unidades, para garantir entrega ágil das bolsas.

**Conversa:** O PO define que o cálculo de rota deve utilizar um algoritmo de caminho mínimo (Dijkstra) sobre o grafo da malha logística, retornando distância, tempo estimado e o transportador designado.

**Cenários de validação:**

**Cenário 1 (Positivo): Rota calculada com sucesso**
Dado que existem unidades conectadas na malha logística, quando a Gestora solicita a rota entre uma unidade de origem e uma de destino, então o sistema retorna o caminho mínimo, a distância e o tempo estimado de chegada.

**Cenário 2 (Negativo): Unidades sem conexão**
Dado que a unidade de destino não possui nenhuma conexão com a malha, quando a Gestora solicita a rota entre origem e destino, então o sistema informa que não há rota disponível entre as unidades.

---

## US06 — Análise de Consumo e Risco de Desabastecimento

**Cartão:** Como Gestora da Hemorrede, eu gostaria de visualizar indicadores de consumo e projeções de estoque, para identificar antecipadamente possíveis situações de desabastecimento.

**Conversa:** O PO define que o sistema deve analisar o histórico de consumo por tipo sanguíneo, calculando consumo médio semanal, desvio padrão e coeficiente de variação (CV). A partir do consumo e do estoque atual, o sistema deve estimar a evolução do estoque e identificar situações em que uma unidade possa atingir seu estoque mínimo de segurança, classificando o nível de risco.

**Cenários de validação:**

**Cenário 1 (Positivo): Identificação de risco**
Dado que existe histórico de consumo e estoque registrado para uma unidade, quando a Gestora acessa o painel de análise, então o sistema exibe os indicadores de consumo, a projeção do estoque e o nível de risco de desabastecimento identificado.

**Cenário 2 (Negativo): Dados insuficientes**
Dado que uma unidade não possui histórico de consumo suficiente, quando a Gestora acessa o painel de análise, então o sistema informa que não há dados suficientes para realizar a análise de risco.


---

## US07 — Ingestão de Telemetria e Alertas Térmicos

**Cartão:** Como Operador Logístico, eu gostaria de transmitir periodicamente a temperatura da carga durante o transporte, para monitorar a integridade biológica dos hemocomponentes.

**Conversa:** O PO especifica que a temperatura deve ser monitorada durante todo o transporte, com faixa segura definida (2–6°C para a maioria dos componentes). Leituras fora da faixa devem gerar alerta imediato.

**Cenários de validação:**

**Cenário 1 (Positivo): Temperatura dentro da faixa**
Dado que uma carga está em trânsito, quando o sistema recebe uma leitura de temperatura dentro da faixa segura, então a leitura é registrada no histórico da transferência sem gerar alerta.

**Cenário 2 (Negativo): Temperatura fora da faixa**
Dado que uma carga está em trânsito, quando o sistema recebe uma leitura de temperatura fora da faixa segura, então um alerta térmico crítico é disparado para o Operador responsável.

---

## US08 — Matching Imunológico ABO/Rh

**Cartão:** Como Sistema, eu preciso validar a compatibilidade imunológica entre requisições e bolsas disponíveis, para evitar alocações incompatíveis.

**Conversa:** O PO define que a checagem de compatibilidade deve seguir as regras didáticas de compatibilidade ABO/Rh. Quando uma bolsa candidata não é compatível, o sistema deve sugerir automaticamente alternativas compatíveis disponíveis no estoque.

**Cenários de validação:**

**Cenário 1 (Positivo): Compatibilidade válida**
Dado que existe uma requisição de tipo sanguíneo compatível com uma bolsa disponível, quando o sistema verifica a compatibilidade, então a alocação é confirmada e liberada para roteirização.

**Cenário 2 (Negativo): Incompatibilidade**
Dado que a bolsa candidata é imunologicamente incompatível com a requisição, quando o sistema verifica a compatibilidade, então a alocação é bloqueada e o sistema lista bolsas alternativas compatíveis disponíveis no estoque.

---

## US09 — Recomendação Explicável de Redistribuição

**Cartão:** Como Gestora da Hemorrede, eu gostaria de receber recomendações de redistribuição de estoque entre unidades, acompanhadas da justificativa da recomendação, para poder aprovar ou recusar com confiança.

**Conversa:** O PO exige que cada recomendação apresente motivos claros e verificáveis (ex.: risco de desabastecimento, validade das unidades, rota elegível, relação de fornecimento ativa, transportador disponível), permitindo à Gestora aprovar, recusar ou consultar detalhes antes de decidir.

**Cenários de validação:**

**Cenário 1 (Positivo): Recomendação aprovada**
Dado que o sistema identificou um risco de desabastecimento em uma unidade e uma unidade de origem com estoque excedente, quando a Gestora aprova a recomendação de redistribuição, então uma transferência é criada automaticamente com status "Aprovada".

**Cenário 2 (Negativo): Recomendação recusada**
Dado que uma recomendação de redistribuição foi gerada, quando a Gestora recusa a recomendação, então nenhuma transferência é criada e a recomendação é marcada como "Recusada" no histórico.

---

## US10 — Monitoramento de Desempenho e Rede

**Cartão:** Como Administrador Principal, eu gostaria de monitorar a saúde e o desempenho da infraestrutura de rede do sistema, para garantir a continuidade operacional da plataforma.

**Conversa:** O PO especifica que o painel deve exibir latência média, vazão, taxa de erro e uptime, além do status individual de cada serviço/endpoint crítico do sistema (estoque, requisições, telemetria, redistribuição, autenticação).

**Cenários de validação:**

**Cenário 1 (Positivo): Rede operando normalmente**
Dado que todos os serviços estão respondendo dentro dos limites esperados, quando o Administrador acessa o painel de monitoramento de rede, então o sistema exibe status "Operacional" para todos os endpoints, com latência e taxa de erro dentro da faixa normal.

**Cenário 2 (Negativo): Degradação de serviço**
Dado que um endpoint apresenta taxa de erro acima de 5% ou está indisponível, quando o Administrador acessa o painel de monitoramento, então o sistema destaca esse endpoint com status "Indisponível" ou alerta de degradação.

---

## 📎 Referência cruzada — Histórias × Disciplinas

| História | Persona | Disciplina(s) envolvida(s) |
|---|---|---|
| US01 | Gestora da Hemorrede | POO |
| US02 | Responsável Hospitalar | POO |
| US03 | Operador do Sistema | POO + AED (priorização) |
| US04 | Responsável Hospitalar | POO |
| US05 | Gestora da Hemorrede | POO + AED (Dijkstra) |
| US06 | Gestora da Hemorrede | POO + EST (estatística) |
| US07 | Operador Logístico | POO + RSD (telemetria) |
| US08 | Sistema | POO + AED (matching) |
| US09 | Gestora da Hemorrede | POO + AED (recomendação) |
| US10 | Administrador Principal | RSD + SO (rede, deploy) |
