# language: pt
# US08 — Matching Imunologico (ABO/Rh)
# Criterios de aceitacao em Gherkin (BDD). A forma executavel destes
# cenarios esta em CompatibilidadeHttpTest (teste de aceitacao via HTTP).

Funcionalidade: Verificar compatibilidade sanguinea (ABO/Rh)
  Para evitar transfusoes incompativeis que poem o paciente em risco
  Como operador do banco de sangue
  Quero saber se uma bolsa de um doador pode ser transfundida em um receptor

  Cenario: Doador universal atende receptor universal
    Dado um doador do tipo "O-"
    E um receptor do tipo "AB+"
    Quando eu consultar a compatibilidade
    Entao o resultado deve ser compativel
    E a resposta HTTP deve ter status 200

  Cenario: Incompatibilidade no sistema ABO
    Dado um doador do tipo "A+"
    E um receptor do tipo "O+"
    Quando eu consultar a compatibilidade
    Entao o resultado NAO deve ser compativel
    E o motivo deve mencionar o sistema "ABO"

  Cenario: Incompatibilidade no fator Rh
    Dado um doador do tipo "O+"
    E um receptor do tipo "O-"
    Quando eu consultar a compatibilidade
    Entao o resultado NAO deve ser compativel
    E o motivo deve mencionar o fator "Rh"

  Cenario: Tipo sanguineo invalido e recusado
    Dado um doador do tipo "X9"
    E um receptor do tipo "O+"
    Quando eu consultar a compatibilidade
    Entao a resposta HTTP deve ter status 400

  Cenario: Listar doadores compativeis para um receptor
    Dado um receptor do tipo "AB+"
    Quando eu pedir a lista de doadores compativeis
    Entao a lista deve conter os 8 tipos sanguineos
