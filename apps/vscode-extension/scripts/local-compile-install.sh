#!/usr/bin/env bash
set -euo pipefail

# ── local-compile-install.sh ────────────────────────────────────────────────
#  Build the VS Code extension locally and install it into VS Code.
#
#  Usage:
#    ./scripts/local-compile-install.sh              # full: compile → package → install
#    ./scripts/local-compile-install.sh --skip-build  # skip TypeScript compile
#    ./scripts/local-compile-install.sh --skip-install# compile + package only (keep .vsix)
#    ./scripts/local-compile-install.sh --help        # show help
# ─────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PACKAGE_JSON="$EXT_DIR/package.json"

# ── Flags ────────────────────────────────────────────────────────────────────
SKIP_BUILD=false
SKIP_INSTALL=false
SHOW_HELP=false

for arg in "$@"; do
  case "$arg" in
    --skip-build)   SKIP_BUILD=true   ;;
    --skip-install) SKIP_INSTALL=true ;;
    --help|-h)      SHOW_HELP=true    ;;
    *) echo "Unknown option: $arg"; echo "Use --help for usage."; exit 1 ;;
  esac
done

if $SHOW_HELP; then
  cat <<'HELP_EOF'
local-compile-install.sh — Build & install the VS Code extension locally.

Usage:
  ./scripts/local-compile-install.sh              Full run: compile → package → install
  ./scripts/local-compile-install.sh --skip-build  Skip TypeScript compile
  ./scripts/local-compile-install.sh --skip-install  Compile + package only (keep .vsix)
  ./scripts/local-compile-install.sh --help        Show this help

The .vsix file is always kept in the extension directory after the script finishes.
HELP_EOF
  exit 0
fi

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'
BOLD='\033[1m'; NC='\033[0m'
ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }
err()  { echo -e "  ${RED}✗${NC} $1"; }
info() { echo -e "  ${CYAN}●${NC} $1"; }
step() { echo -e "\n${BOLD}${CYAN}▶${NC}${BOLD} $1${NC}"; }

# ── Prerequisites ────────────────────────────────────────────────────────────
step "[1/4] Checking prerequisites"

# Node.js
if ! command -v node &>/dev/null; then
  err "Node.js is not installed."; exit 1
fi
ok "Node.js $(node -v)"

# npm
if ! command -v npm &>/dev/null; then
  err "npm is not installed."; exit 1
fi
ok "npm $(npm -v)"

# vsce (try global, then npx fallback)
VSCE=""
if command -v vsce &>/dev/null; then
  VSCE="vsce"
  ok "vsce $(vsce --version)  (global)"
elif npx --yes @vscode/vsce --version &>/dev/null; then
  VSCE="npx --yes @vscode/vsce"
  ok "vsce $(npx --yes @vscode/vsce --version)  (via npx)"
else
  err "vsce not found. Install with:  npm install -g @vscode/vsce"
  exit 1
fi

# code CLI
if ! command -v code &>/dev/null; then
  warn "code CLI not found — install step will be skipped."
  SKIP_INSTALL=true
else
  ok "code CLI found"
fi

# ── Build ────────────────────────────────────────────────────────────────────
if $SKIP_BUILD; then
  warn "Skipping TypeScript compile (--skip-build)."
else
  step "[2/4] Compiling TypeScript"
  cd "$EXT_DIR"

  # Ensure dependencies are installed
  if [ ! -d "node_modules" ]; then
    info "Installing dependencies (npm install)..."
    npm install
  fi

  npm run compile
  ok "Compile complete"
fi

# ── Read version ─────────────────────────────────────────────────────────────
VERSION=$(node -e "console.log(require('$PACKAGE_JSON').version)")
NAME=$(node -e "console.log(require('$PACKAGE_JSON').name)")
VSIX_FILE="${NAME}-${VERSION}.vsix"

step "[3/4] Packaging → ${VSIX_FILE}"

cd "$EXT_DIR"
$VSCE package
ok "Package created: ${VSIX_FILE}"

# ═══ Install ─────────────────────────────────────────────────────────────────
if $SKIP_INSTALL; then
  step "[4/4] Install — SKIPPED (--skip-install)"
else
  step "[4/4] Installing extension"

  # Uninstall old version (ignore error if not installed)
  if code --list-extensions 2>/dev/null | grep -q "^${NAME}$"; then
    info "Uninstalling existing version..."
    code --uninstall-extension "${NAME}" || warn "Uninstall failed, continuing anyway."
  fi

  code --install-extension "$VSIX_FILE" --force
  ok "Extension installed: ${NAME}@${VERSION}"

  # Quick verify
  if code --list-extensions 2>/dev/null | grep -q "^${NAME}$"; then
    ok "Install verified — extension is active."
  else
    warn "Extension not found in --list-extensions — reload VS Code window if needed."
  fi
fi

# ── Done ─────────────────────────────────────────────────────────────────────
echo ""
ok "All done. VSIX kept at: ${EXT_DIR}/${VSIX_FILE}"
echo "  Reload VS Code window (Cmd+Shift+P → Developer: Reload Window) if the extension isn't active."
echo ""
