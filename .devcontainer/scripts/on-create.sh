#!/bin/bash
set -e

echo "🚀 Setting up write-ai-prompt-better devcontainer..."

# ── Ensure pnpm and global npm packages are in PATH ────────────
export PATH="$PATH:$PNPM_HOME:/home/node/.npm-global/bin"

# ── Install pnpm ──────────────────────────────────────────────
echo "📦 Installing pnpm..."
npm install -g pnpm@9.15.0

# ── Configure pnpm store ──────────────────────────────────────
pnpm config set store-dir "$PNPM_HOME/store" --location global 2>/dev/null || true

# ── Install project dependencies ──────────────────────────────
echo "📥 Installing project dependencies..."
pnpm install --frozen-lockfile

# ── Ignore local changes to .env ──────────────────────────────
# .env is tracked for the placeholder, but each dev has their own key.
# skip-worktree tells git to ignore local modifications to this file.
git update-index --skip-worktree .env 2>/dev/null || true
echo "🔒 .env local changes will be ignored by git."

# ── Persist PATH to shell RC for interactive sessions ─────────
for rc in "$HOME/.bashrc" "$HOME/.zshrc" "$HOME/.profile"; do
  if [ -f "$rc" ]; then
    if ! grep -q "PNPM_HOME" "$rc" 2>/dev/null; then
      echo "" >> "$rc"
      echo "# Added by devcontainer on-create" >> "$rc"
      echo "export PNPM_HOME=\"$PNPM_HOME\"" >> "$rc"
      echo "export PATH=\"\$PATH:\$PNPM_HOME:/home/node/.npm-global/bin\"" >> "$rc"
    fi
  fi
done

echo "✅ onCreate finished."
