#!/usr/bin/env bash
# =============================================================
#  IPvFull Network Map — Deploy remoto via SSH
#
#  Roda NO SEU NOTEBOOK. Conecta no servidor e instala tudo lá.
#
#  Uso:
#    bash deploy.sh usuario@ip-do-servidor
#    bash deploy.sh usuario@ip-do-servidor /var/lib/grafana/plugins
#
#  Exemplos:
#    bash deploy.sh root@192.168.1.100
#    bash deploy.sh ubuntu@meuservidor.com.br
#    bash deploy.sh admin@grafana.empresa.com /var/lib/grafana/plugins
#
#  Pré-requisitos NO NOTEBOOK: ssh, curl
#  Pré-requisitos NO SERVIDOR:  curl, git, node >= 18, npm
# =============================================================

set -euo pipefail

# ── Cores ─────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}[info]${RESET}   $*"; }
success() { echo -e "${GREEN}[ok]${RESET}     $*"; }
warn()    { echo -e "${YELLOW}[aviso]${RESET}  $*"; }
error()   { echo -e "${RED}[erro]${RESET}   $*" >&2; exit 1; }

INSTALLER_URL="https://raw.githubusercontent.com/danielltrc/ipvfull-network-map/main/install.sh"

# ── Argumentos ────────────────────────────────────────────────
SSH_TARGET="${1:-}"
PLUGINS_DIR="${2:-}"  # opcional

if [[ -z "$SSH_TARGET" ]]; then
  echo ""
  echo -e "${BOLD}Uso:${RESET}"
  echo -e "  bash deploy.sh ${CYAN}usuario@ip${RESET}"
  echo -e "  bash deploy.sh ${CYAN}usuario@ip${RESET} ${YELLOW}/var/lib/grafana/plugins${RESET}  (opcional)"
  echo ""
  echo -e "${BOLD}Exemplos:${RESET}"
  echo -e "  bash deploy.sh root@192.168.1.100"
  echo -e "  bash deploy.sh ubuntu@meuservidor.com.br"
  echo -e "  bash deploy.sh admin@10.0.0.5 /var/lib/grafana/plugins"
  echo ""
  exit 1
fi

# ── Banner ────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║   IPvFull Network Map — Deploy Remoto via SSH        ║${RESET}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════╝${RESET}"
echo ""
info "Servidor alvo: ${BOLD}$SSH_TARGET${RESET}"
[[ -n "$PLUGINS_DIR" ]] && info "Diretório de plugins: $PLUGINS_DIR"
echo ""

# ── Verifica SSH disponível ───────────────────────────────────
command -v ssh &>/dev/null || error "ssh não encontrado no notebook."

# ── Testa conexão ─────────────────────────────────────────────
info "Testando conexão SSH com $SSH_TARGET..."
ssh -o ConnectTimeout=10 \
    -o BatchMode=yes \
    -o StrictHostKeyChecking=accept-new \
    "$SSH_TARGET" "echo ok" &>/dev/null \
  || error "Não foi possível conectar em $SSH_TARGET via SSH.
           Certifique-se de que:
             1. O servidor está acessível
             2. Sua chave SSH está autorizada (ssh-copy-id $SSH_TARGET)
             3. A porta 22 está aberta"

success "Conexão SSH estabelecida"
echo ""

# ── Executa install.sh no servidor ───────────────────────────
info "Iniciando instalação remota no servidor..."
echo ""
echo -e "  ${YELLOW}┌─ saída do servidor ────────────────────────────────┐${RESET}"

# Monta o comando remoto
if [[ -n "$PLUGINS_DIR" ]]; then
  REMOTE_CMD="bash <(curl -fsSL '$INSTALLER_URL') '$PLUGINS_DIR'"
else
  REMOTE_CMD="bash <(curl -fsSL '$INSTALLER_URL')"
fi

ssh -o StrictHostKeyChecking=accept-new \
    -t "$SSH_TARGET" \
    "export TERM=xterm-256color; $REMOTE_CMD" \
  || error "A instalação remota falhou — veja os logs acima."

echo -e "  ${YELLOW}└────────────────────────────────────────────────────┘${RESET}"
echo ""
success "Deploy concluído em $SSH_TARGET"
echo ""
