#!/bin/bash
set -e

echo "🔧 Running post-create setup..."

# ── Ensure pnpm and global npm packages are in PATH ────────────
export PATH="$PATH:$PNPM_HOME:/home/node/.npm-global/bin"

# ── Build the project ─────────────────────────────────────────
echo "🏗️  Building project..."
pnpm build

# ── Install Claude Code CLI ───────────────────────────────────
echo "🤖 Installing Claude Code CLI..."
if ! command -v claude &> /dev/null; then
  npm install -g @anthropic-ai/claude-code
  echo "   Claude Code installed: $(claude --version 2>/dev/null || echo 'OK')"
else
  echo "   Claude Code already installed: $(claude --version 2>/dev/null || echo 'OK')"
fi

# ── Try auto-config if template already has a real token ───────
WORKSPACE_DIR="$(pwd)"
TEMPLATE="$WORKSPACE_DIR/.devcontainer/.deepseek-claude.json"
if [ -f "$TEMPLATE" ]; then
  # Quick check: does ANTHROPIC_AUTH_TOKEN look like a real key?
  if grep -q '"ANTHROPIC_AUTH_TOKEN"' "$TEMPLATE" 2>/dev/null; then
    TOKEN=$(grep '"ANTHROPIC_AUTH_TOKEN"' "$TEMPLATE" 2>/dev/null | head -1 | sed 's/.*"ANTHROPIC_AUTH_TOKEN"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
    if [ -n "$TOKEN" ] && [ "$TOKEN" != "your-deepseek-api-token" ] && [ "$TOKEN" != "your-api-key-here" ]; then
      echo "🔑 Valid API token found in .devcontainer/.deepseek-claude.json, auto-configuring Claude Code..."
      bash "$WORKSPACE_DIR/.devcontainer/scripts/configure-claude.sh" --quiet
    fi
  fi
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  🎉 Devcontainer is ready!                                   ║"
echo "║                                                              ║"
echo "║  Claude Code CLI is installed and ready to use.              ║"
echo "║                                                              ║"
echo "║  📌 To use DeepSeek API with Claude Code:                    ║"
echo "║     1. Edit .devcontainer/.deepseek-claude.json              ║"
echo "║        Set env.ANTHROPIC_AUTH_TOKEN to your real key         ║"
echo "║     2. Run: bash .devcontainer/scripts/configure-claude.sh   ║"
echo "║        (or restart the codespace — it auto-configures)       ║"
echo "║                                                              ║"
echo "║  📖 See .devcontainer/README.md for detailed instructions.   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

echo "✅ postCreate finished."
