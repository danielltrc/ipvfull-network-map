#!/usr/bin/env bash
# =============================================================
#  IPvFull Network Map — Instalador (roda NO SERVIDOR)
#
#  Execute no servidor com uma linha:
#
#    bash <(curl -fsSL https://raw.githubusercontent.com/danielltrc/ipvfull-network-map/main/install.sh)
#
#  Ou passando o diretório de plugins manualmente:
#
#    bash <(curl -fsSL https://raw.githubusercontent.com/danielltrc/ipvfull-network-map/main/install.sh) /var/lib/grafana/plugins
#
#  Pré-requisitos no servidor: curl, git, node >= 18, npm
# =============================================================

set -euo pipefail

REPO_URL="https://github.com/danielltrc/ipvfull-network-map.git"
PLUGIN_ID="ipvfull-ipvfullnetworkmap-panel"
WORK_DIR="/tmp/ipvfull-network-map-build"

# ── Cores ─────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}[info]${RESET}   $*"; }
success() { echo -e "${GREEN}[ok]${RESET}     $*"; }
warn()    { echo -e "${YELLOW}[aviso]${RESET}  $*"; }
error()   { echo -e "${RED}[erro]${RESET}   $*" >&2; exit 1; }
step()    { echo -e "\n${BOLD}── $* ──────────────────────────────${RESET}"; }

# ── Banner ────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║     IPvFull Network Map — Instalação no Servidor     ║${RESET}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════╝${RESET}"

# ── 1. Verificar dependências ─────────────────────────────────
step "1/6  Verificando dependências"

for cmd in curl git node npm; do
  command -v "$cmd" &>/dev/null || error "'$cmd' não encontrado. Instale e tente novamente."
done

NODE_MAJOR=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
[[ "$NODE_MAJOR" -ge 18 ]] || error "Node.js >= 18 necessário (atual: $(node -v)). Instale via nvm ou https://nodejs.org"

success "git $(git --version | awk '{print $3}')  |  node $(node -v)  |  npm $(npm -v)"

# ── 2. Detectar diretório de plugins ─────────────────────────
step "2/6  Detectando diretório de plugins"

if [[ -n "${1:-}" ]]; then
  PLUGINS_DIR="$1"
  info "Diretório fornecido manualmente: $PLUGINS_DIR"
else
  # Detecta Docker: procura container grafana rodando
  DOCKER_CONTAINER=""
  if command -v docker &>/dev/null; then
    DOCKER_CONTAINER=$(docker ps --format '{{.Names}}' 2>/dev/null | grep -i grafana | head -1 || true)
  fi

  if [[ -n "$DOCKER_CONTAINER" ]]; then
    info "Container Docker Grafana detectado: $DOCKER_CONTAINER"
    GRAFANA_MODE="docker"
    PLUGINS_DIR=""  # será tratado separadamente
  else
    GRAFANA_MODE="host"
    CANDIDATES=(
      "/var/lib/grafana/plugins"               # Linux deb/rpm
      "/opt/homebrew/var/lib/grafana/plugins"  # macOS Homebrew Apple Silicon
      "/usr/local/var/lib/grafana/plugins"     # macOS Homebrew Intel
      "$HOME/.local/share/grafana/plugins"     # Linux usuário local
      "/opt/grafana/data/plugins"              # Binário manual
      "/opt/grafana/plugins"
    )
    PLUGINS_DIR=""
    for dir in "${CANDIDATES[@]}"; do
      if [[ -d "$dir" ]]; then
        PLUGINS_DIR="$dir"
        break
      fi
    done

    if [[ -z "$PLUGINS_DIR" ]]; then
      echo ""
      echo -e "${YELLOW}Não foi possível detectar o diretório de plugins automaticamente.${RESET}"
      echo ""
      echo -e "  Passe o caminho como argumento, por exemplo:"
      echo -e "  ${BOLD}bash <(curl -fsSL https://raw.githubusercontent.com/danielltrc/ipvfull-network-map/main/install.sh) /var/lib/grafana/plugins${RESET}"
      echo ""
      echo -e "  Caminhos comuns:"
      echo -e "    Linux apt/rpm      →  /var/lib/grafana/plugins"
      echo -e "    macOS Homebrew     →  /opt/homebrew/var/lib/grafana/plugins"
      echo -e "    Docker (volume)    →  /var/lib/grafana/plugins (dentro do container)"
      exit 1
    fi
  fi
fi

# ── 3. Clonar e compilar ──────────────────────────────────────
step "3/6  Clonando repositório"

rm -rf "$WORK_DIR"
git clone --depth 1 --quiet "$REPO_URL" "$WORK_DIR" \
  || error "Falha ao clonar $REPO_URL — verifique a conexão."
success "Repositório clonado"

step "4/6  Instalando dependências npm"
cd "$WORK_DIR"
npm install --silent 2>&1 | tail -2 || error "Falha no npm install"
success "Dependências instaladas"

step "5/6  Compilando plugin"
npm run build 2>&1 | tail -4 || error "Falha no build — veja os logs acima"
success "Build concluído"

# ── 4. Instalar ───────────────────────────────────────────────
step "6/6  Instalando plugin"

if [[ "${GRAFANA_MODE:-host}" == "docker" && -n "${DOCKER_CONTAINER:-}" ]]; then
  # Modo Docker: copia para dentro do container
  CONTAINER_PLUGINS="/var/lib/grafana/plugins"
  info "Copiando para o container '$DOCKER_CONTAINER'..."

  # Garante que o diretório existe dentro do container
  docker exec "$DOCKER_CONTAINER" mkdir -p "$CONTAINER_PLUGINS" 2>/dev/null || \
    sudo docker exec "$DOCKER_CONTAINER" mkdir -p "$CONTAINER_PLUGINS"

  # Remove versão anterior se existir
  docker exec "$DOCKER_CONTAINER" rm -rf "$CONTAINER_PLUGINS/$PLUGIN_ID" 2>/dev/null || true

  # Copia dist/ para dentro do container
  docker cp "$WORK_DIR/dist" "$DOCKER_CONTAINER:$CONTAINER_PLUGINS/$PLUGIN_ID" 2>/dev/null || \
    sudo docker cp "$WORK_DIR/dist" "$DOCKER_CONTAINER:$CONTAINER_PLUGINS/$PLUGIN_ID" || \
    error "Falha ao copiar para o container Docker"

  success "Plugin instalado dentro do container '$DOCKER_CONTAINER'"

  # Verifica se a variável de ambiente já está setada
  ENV_OK=$(docker exec "$DOCKER_CONTAINER" env 2>/dev/null | grep -c "GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS" || true)
  if [[ "$ENV_OK" -eq 0 ]]; then
    warn "Variável GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS não detectada no container."
    warn "Adicione ao seu docker-compose.yml ou docker run:"
    echo ""
    echo -e "    ${BOLD}GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS=${PLUGIN_ID}${RESET}"
    echo ""
  fi

  RESTART_CMD="docker restart $DOCKER_CONTAINER"

else
  # Modo host: copia para o diretório de plugins
  PLUGIN_TARGET="$PLUGINS_DIR/$PLUGIN_ID"
  info "Destino: $PLUGIN_TARGET"

  if [[ -d "$PLUGIN_TARGET" ]]; then
    warn "Versão anterior encontrada — substituindo..."
    rm -rf "$PLUGIN_TARGET" 2>/dev/null || sudo rm -rf "$PLUGIN_TARGET"
  fi

  if ! cp -r "$WORK_DIR/dist" "$PLUGIN_TARGET" 2>/dev/null; then
    warn "Sem permissão — tentando com sudo..."
    sudo cp -r "$WORK_DIR/dist" "$PLUGIN_TARGET" \
      || error "Falha ao copiar para $PLUGIN_TARGET"
  fi

  success "Plugin instalado em $PLUGIN_TARGET"

  # Tenta configurar grafana.ini automaticamente
  GRAFANA_INI_CANDIDATES=(
    "/etc/grafana/grafana.ini"
    "/opt/homebrew/etc/grafana/grafana.ini"
    "/usr/local/etc/grafana/grafana.ini"
    "/opt/grafana/conf/grafana.ini"
  )
  for f in "${GRAFANA_INI_CANDIDATES[@]}"; do
    if [[ -f "$f" ]]; then
      GRAFANA_INI="$f"; break
    fi
  done

  if [[ -n "${GRAFANA_INI:-}" ]]; then
    if grep -q "$PLUGIN_ID" "$GRAFANA_INI" 2>/dev/null; then
      success "grafana.ini já está configurado"
    elif grep -q "^\[plugins\]" "$GRAFANA_INI" 2>/dev/null; then
      WRITE_CMD="sed -i \"/^\[plugins\]/a allow_loading_unsigned_plugins = $PLUGIN_ID\" $GRAFANA_INI"
      eval "$WRITE_CMD" 2>/dev/null || eval "sudo $WRITE_CMD" || \
        warn "Não foi possível editar $GRAFANA_INI — configure manualmente (veja abaixo)"
      grep -q "$PLUGIN_ID" "$GRAFANA_INI" 2>/dev/null && success "grafana.ini atualizado automaticamente"
    fi
  fi

  RESTART_CMD="sudo systemctl restart grafana-server"
  command -v brew &>/dev/null && RESTART_CMD="brew services restart grafana"
fi

# ── 5. Limpeza ────────────────────────────────────────────────
rm -rf "$WORK_DIR"

# ── 6. Resumo final ───────────────────────────────────────────
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║  INSTALAÇÃO CONCLUÍDA                                ║${RESET}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════╝${RESET}"
echo ""

if [[ "${GRAFANA_MODE:-host}" != "docker" && -z "${GRAFANA_INI:-}" ]]; then
  echo -e "${YELLOW}Adicione ao grafana.ini:${RESET}"
  echo ""
  echo -e "  [plugins]"
  echo -e "  allow_loading_unsigned_plugins = ${BOLD}$PLUGIN_ID${RESET}"
  echo ""
  echo -e "${YELLOW}Ou via variável de ambiente:${RESET}"
  echo ""
  echo -e "  ${BOLD}GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS=${PLUGIN_ID}${RESET}"
  echo ""
fi

echo -e "${GREEN}Reinicie o Grafana:${RESET}"
echo ""
echo -e "  ${BOLD}${RESTART_CMD}${RESET}"
echo ""
success "Acesse http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'localhost'):3000"
echo ""
