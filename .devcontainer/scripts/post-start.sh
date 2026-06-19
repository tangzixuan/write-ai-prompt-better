#!/bin/bash
set -e

# ── Post-start hook ───────────────────────────────────────────
# Runs every time the container starts (including restarts).
# Always runs configure-claude.sh --quiet to ensure Claude Code
# settings are up-to-date.

# ── Ensure pnpm and global npm packages are in PATH ────────────
export PATH="$PATH:$PNPM_HOME:/home/node/.npm-global/bin"

WORKSPACE_DIR="$(pwd)"

# ── Always run configure (handles token detection & settings merge) ──
bash "$WORKSPACE_DIR/.devcontainer/scripts/configure-claude.sh" --quiet || true
