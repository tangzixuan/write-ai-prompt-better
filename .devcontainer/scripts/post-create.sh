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

# ── Try auto-config if .env already has a real key ────────────
WORKSPACE_DIR="$(pwd)"
if [ -f "$WORKSPACE_DIR/.env" ]; then
  ENV_KEY=$(grep -E '^DEEPSEEK_API_KEY=' "$WORKSPACE_DIR/.env" 2>/dev/null | cut -d= -f2- | xargs)
  if [ -n "$ENV_KEY" ] && [ "$ENV_KEY" != "sk-your-api-key-here" ]; then
    echo "🔑 Valid API key found in .env, auto-configuring Claude Code..."
    source "$WORKSPACE_DIR/.env" 2>/dev/null || true
    bash "$WORKSPACE_DIR/.devcontainer/scripts/configure-claude.sh" --quiet
  fi
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  🎉 Devcontainer is ready!                                   ║"
echo "║                                                              ║"
echo "║  Claude Code CLI is installed and ready to use.              ║"
echo "║                                                              ║"
echo "║  📌 To use DeepSeek API with Claude Code:                    ║"
echo "║     1. Edit .env file in the project root:                   ║"
echo "║        DEEPSEEK_API_KEY=sk-your-real-key-here                ║"
echo "║     2. Run: bash .devcontainer/scripts/configure-claude.sh   ║"
echo "║        (or restart the codespace — it auto-configures)       ║"
echo "║                                                              ║"
echo "║  📖 See .devcontainer/README.md for detailed instructions.   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

echo "✅ postCreate finished."
