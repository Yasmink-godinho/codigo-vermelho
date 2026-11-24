#!/bin/sh
# Cria no Grafana o usuario de LEITURA (papel Viewer) para o professor.
# Usa as variaveis do .env: GRAFANA_ADMIN_USER, GRAFANA_ADMIN_PASSWORD, VIEWER_LOGIN, VIEWER_PASSWORD.
# Rode depois do "docker compose up -d", na raiz do repositorio:
#   sh scripts/criar-usuario-viewer.sh
# As credenciais do Viewer vao SOMENTE no PDF / Google Classroom, nunca no repositorio.

set -e

if [ -f .env ]; then
  set -a; . ./.env; set +a
fi

GRAFANA_URL="${GRAFANA_URL:-http://localhost:${GRAFANA_PORT:-3000}}"
ADMIN="${GRAFANA_ADMIN_USER:-admin}"

if [ -z "$GRAFANA_ADMIN_PASSWORD" ] || [ -z "$VIEWER_LOGIN" ] || [ -z "$VIEWER_PASSWORD" ]; then
  echo "Defina GRAFANA_ADMIN_PASSWORD, VIEWER_LOGIN e VIEWER_PASSWORD no .env" >&2
  exit 1
fi

echo "Criando usuario '$VIEWER_LOGIN' em $GRAFANA_URL ..."
curl -sS -u "$ADMIN:$GRAFANA_ADMIN_PASSWORD" -H "Content-Type: application/json" \
  -X POST "$GRAFANA_URL/api/admin/users" \
  -d "{\"name\":\"Professor (leitura)\",\"login\":\"$VIEWER_LOGIN\",\"password\":\"$VIEWER_PASSWORD\",\"OrgId\":1}"
echo

# Novos usuarios ja entram como Viewer (GF_USERS_AUTO_ASSIGN_ORG_ROLE=Viewer no compose).
echo "Usuarios da organizacao:"
curl -sS -u "$ADMIN:$GRAFANA_ADMIN_PASSWORD" "$GRAFANA_URL/api/org/users" | tr '{' '\n' | grep -o '"login":"[^"]*","[^}]*"role":"[^"]*"' || true
echo
