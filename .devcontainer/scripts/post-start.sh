#!/bin/bash
set -e

# ── Post-start hook ───────────────────────────────────────────
# Runs every time the container starts (including restarts).
# Checks .env for a valid DeepSeek API key and auto-configures.

# ── Ensure pnpm and global npm packages are in PATH ────────────
export PATH="$PATH:$PNPM_HOME:/home/node/.npm-global/bin"

WORKSPACE_DIR="$(pwd)"

# ── Load .env if it exists ────────────────────────────────────
if [ -f "$WORKSPACE_DIR/.env" ]; then
  set -a  # auto-export all variables
  source "$WORKSPACE_DIR/.env" 2>/dev/null || true
  set +a
fi

# ── Check if key is set and real ──────────────────────────────
if [ -n "$DEEPSEEK_API_KEY" ] && [ "$DEEPSEEK_API_KEY" != "sk-your-api-key-here" ]; then
  echo "🔑 DeepSeek API key found in .env, configuring Claude Code..."
  bash "$WORKSPACE_DIR/.devcontainer/scripts/configure-claude.sh" --quiet
else
  echo ""
  echo "💡 Tip: Edit .env and set DEEPSEEK_API_KEY to use Claude Code."
  echo "    Then run: bash .devcontainer/scripts/configure-claude.sh"
  echo ""
fi
