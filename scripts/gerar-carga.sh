#!/bin/sh
# Gerador de carga do Codigo Vermelho (projeto de observabilidade - RSD).
#
# Fica em loop chamando a API para que metricas, logs e traces tenham dados o tempo todo,
# inclusive durante a correcao remota. Cobre:
#   - leituras comuns (instituicoes, lotes, fila FEFO)              -> trafego HTTP 200
#   - calculo de rota (US05)                                        -> timer + span calculo-rota
#   - requisicao (US04), transferencia e telemetria com desvio (US07)-> metricas de negocio
#   - transferencia completa                                        -> trace com varios spans
#   - recurso inexistente e parametro invalido                      -> 404 e 400
#   - endpoint de erro simulado                                     -> 500 + log ERROR
#
# No compose ele roda sozinho (servico gerador-carga). Para rodar na sua maquina:
#   API_URL=http://localhost:8080 sh scripts/gerar-carga.sh
# Parar: Ctrl+C (ou docker compose stop gerador-carga)

API_URL="${API_URL:-http://localhost:8080}"
INTERVALO="${INTERVALO_SEGUNDOS:-2}"

# ---------------------------------------------------------------- funcoes auxiliares
# chamar METODO CAMINHO [CORPO_JSON] -> imprime so o status HTTP
chamar() {
  if [ -n "$3" ]; then
    curl -s -o /dev/null -w "%{http_code}" --max-time 10 -X "$1" \
      -H "Content-Type: application/json" -d "$3" "$API_URL$2"
  else
    curl -s -o /dev/null -w "%{http_code}" --max-time 10 -X "$1" "$API_URL$2"
  fi
}

# corpo METODO CAMINHO [CORPO_JSON] -> imprime o corpo da resposta
corpo() {
  if [ -n "$3" ]; then
    curl -s --max-time 10 -X "$1" -H "Content-Type: application/json" -d "$3" "$API_URL$2"
  else
    curl -s --max-time 10 -X "$1" "$API_URL$2"
  fi
}

# primeiro "id" numerico de um JSON (sem jq, para funcionar na imagem do curl)
primeiro_id() {
  grep -o '"id":[0-9]*' | head -n 1 | cut -d: -f2
}

# id da instituicao cujo nome contem o texto informado (dados de demonstracao do DataInitializer)
id_instituicao() {
  corpo GET /api/v1/instituicoes | tr '}' '\n' | grep "$1" | primeiro_id
}

# ---------------------------------------------------------------- espera a API
echo "[carga] aguardando a API em $API_URL ..."
until [ "$(chamar GET /api/v1/instituicoes)" = "200" ]; do
  sleep 3
done

ORIGEM="${ORIGEM_ID:-$(id_instituicao HEMOPE)}"
DESTINO="${DESTINO_ID:-$(id_instituicao Oswaldo)}"
SEM_ROTA="${SEM_ROTA_ID:-$(id_instituicao Agreste)}"
ORIGEM="${ORIGEM:-1}"; DESTINO="${DESTINO:-3}"; SEM_ROTA="${SEM_ROTA:-4}"
echo "[carga] origem=$ORIGEM destino=$DESTINO sem_rota=$SEM_ROTA intervalo=${INTERVALO}s"

URGENCIAS="ROTINA PRIORITARIA EMERGENCIA"

# ---------------------------------------------------------------- loop principal
i=0
while true; do
  i=$((i + 1))

  # trafego comum
  chamar GET /api/v1/instituicoes > /dev/null
  chamar GET /api/v1/lotes > /dev/null
  chamar GET "/api/v1/lotes/fila-fefo" > /dev/null
  chamar GET "/api/v1/rotas?origem=$ORIGEM&destino=$DESTINO" > /dev/null

  # erros de cliente e rota inexistente
  if [ $((i % 3)) -eq 0 ]; then
    chamar GET "/api/v1/rotas?origem=$ORIGEM&destino=$SEM_ROTA" > /dev/null
    chamar GET /api/v1/instituicoes/999999 > /dev/null
    chamar GET "/api/v1/rotas?origem=abc&destino=$DESTINO" > /dev/null
  fi

  # requisicao avulsa (metrica de negocio: requisicoes emitidas / pendentes)
  if [ $((i % 15)) -eq 0 ]; then
    urgencia=$(echo $URGENCIAS | cut -d' ' -f$(( (i / 15) % 3 + 1 )))
    chamar POST /api/v1/requisicoes "{\"instituicaoId\":$DESTINO,\"tipoSanguineo\":\"A+\",\"componente\":\"PLASMA\",\"volume\":1,\"nivelUrgencia\":\"$urgencia\",\"observacoes\":\"gerador de carga\"}" > /dev/null
  fi

  # erro de servidor (500) com log ERROR e trace com erro
  if [ $((i % 7)) -eq 0 ]; then
    chamar GET /api/v1/observabilidade/erro-simulado > /dev/null
  fi

  # fluxo completo: repoe estoque -> requisicao -> transferencia (varios spans) -> telemetria com alerta
  if [ $((i % 10)) -eq 0 ]; then
    req_id=""; transf_id=""
    hoje=$(date +%F)
    chamar POST "/api/v1/instituicoes/$ORIGEM/lotes" \
      "{\"tipoSanguineo\":\"O-\",\"componente\":\"CONCENTRADO_HEMACIAS\",\"dataColeta\":\"$hoje\",\"quantidade\":2}" > /dev/null

    req_id=$(corpo POST /api/v1/requisicoes \
      "{\"instituicaoId\":$DESTINO,\"tipoSanguineo\":\"O-\",\"componente\":\"CONCENTRADO_HEMACIAS\",\"volume\":1,\"nivelUrgencia\":\"EMERGENCIA\",\"observacoes\":\"gerador de carga\"}" | primeiro_id)

    if [ -n "$req_id" ]; then
      transf_id=$(corpo POST /api/v1/transferencias \
        "{\"origemId\":$ORIGEM,\"destinoId\":$DESTINO,\"tipoSanguineo\":\"O-\",\"componente\":\"CONCENTRADO_HEMACIAS\",\"quantidade\":1,\"requisicaoId\":$req_id}" | primeiro_id)
      if [ -n "$transf_id" ]; then
        chamar POST "/api/v1/transferencias/$transf_id/telemetria/simulacao?quantidade=5&comDesvio=true" > /dev/null
      fi
    fi
    echo "[carga] ciclo $i: requisicao=${req_id:--} transferencia=${transf_id:--}"
  fi

  sleep "$INTERVALO"
done
