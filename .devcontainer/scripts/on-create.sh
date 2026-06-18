#!/bin/bash
set -e

echo "🚀 Setting up write-ai-prompt-better devcontainer..."

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

echo "✅ onCreate finished."
