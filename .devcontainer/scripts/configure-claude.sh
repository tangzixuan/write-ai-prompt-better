#!/bin/bash
# ──────────────────────────────────────────────────────────────
# Configure Claude Code to use DeepSeek API
# ──────────────────────────────────────────────────────────────
# Reads DEEPSEEK_API_KEY from .env file (priority) or env var,
# then writes Claude Code settings so the CLI works immediately.
#
# Usage:
#   bash .devcontainer/scripts/configure-claude.sh          # interactive
#   bash .devcontainer/scripts/configure-claude.sh --quiet  # non-interactive
# ──────────────────────────────────────────────────────────────

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

QUIET=false
if [ "$1" = "--quiet" ]; then
  QUIET=true
fi

WORKSPACE_DIR="$(pwd)"
ENV_FILE="$WORKSPACE_DIR/.env"

# ── Step 1: Try to get API key from .env file first ─────────
try_load_env_file() {
  if [ -f "$ENV_FILE" ]; then
    # Extract value, strip quotes and whitespace
    local key
    key=$(grep -E '^DEEPSEEK_API_KEY=' "$ENV_FILE" 2>/dev/null | head -1 | cut -d= -f2- | xargs)
    # Remove surrounding quotes if present
    key="${key#\"}"; key="${key%\"}"
    key="${key#\'}"; key="${key%\'}"
    if [ -n "$key" ] && [ "$key" != "sk-your-api-key-here" ]; then
      DEEPSEEK_API_KEY="$key"
      return 0
    fi
  fi
  return 1
}

# ── Step 2: Check environment variable ──────────────────────
try_env_var() {
  if [ -n "$DEEPSEEK_API_KEY" ] && [ "$DEEPSEEK_API_KEY" != "sk-your-api-key-here" ]; then
    return 0
  fi
  return 1
}

# ── Step 3: Prompt user interactively ───────────────────────
prompt_interactive() {
  if $QUIET; then
    echo -e "${YELLOW}⚠️  No valid DEEPSEEK_API_KEY found in .env or environment.${NC}"
    echo "   Edit .env and set DEEPSEEK_API_KEY=sk-..., then re-run this script."
    exit 0
  fi

  echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║        Configure Claude Code with DeepSeek API              ║${NC}"
  echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "  Get your API key at: ${GREEN}https://platform.deepseek.com/api_keys${NC}"
  echo ""

  read -r -p "  Paste your DeepSeek API key (sk-...): " DEEPSEEK_API_KEY

  if [ -z "$DEEPSEEK_API_KEY" ]; then
    echo -e "${RED}❌ No API key provided. Aborting.${NC}"
    exit 1
  fi

  # Write key to .env (replace placeholder)
  if grep -q '^DEEPSEEK_API_KEY=' "$ENV_FILE" 2>/dev/null; then
    sed -i "s/^DEEPSEEK_API_KEY=.*/DEEPSEEK_API_KEY=$DEEPSEEK_API_KEY/" "$ENV_FILE"
  else
    echo "DEEPSEEK_API_KEY=$DEEPSEEK_API_KEY" >> "$ENV_FILE"
  fi
  echo -e "${GREEN}✅ Key saved to .env${NC}"
}

# ── Resolve API key ─────────────────────────────────────────
KEY_SOURCE=""  # "env_file", "env_var", or "interactive"
if try_load_env_file; then
  KEY_SOURCE="env_file"
else
  if try_env_var; then
    KEY_SOURCE="env_var"
  else
    prompt_interactive
    KEY_SOURCE="interactive"
  fi
fi

# ── Persist key to .env if it came from the environment ─────
# When the key is from $DEEPSEEK_API_KEY (e.g. remoteEnv mapping),
# the .env file still has the placeholder. Write the real key to
# .env so later steps (source in RC file, apiKeyHelper fallback)
# get the real key, not the placeholder.
if [ "$KEY_SOURCE" = "env_var" ]; then
  if grep -q '^DEEPSEEK_API_KEY=' "$ENV_FILE" 2>/dev/null; then
    sed -i "s|^DEEPSEEK_API_KEY=.*|DEEPSEEK_API_KEY=$DEEPSEEK_API_KEY|" "$ENV_FILE"
  else
    echo "DEEPSEEK_API_KEY=$DEEPSEEK_API_KEY" >> "$ENV_FILE"
  fi
  $QUIET || echo -e "${GREEN}✅ Key persisted to .env${NC}"
fi

# ── Validate format ─────────────────────────────────────────
if ! echo "$DEEPSEEK_API_KEY" | grep -qE '^sk-[a-zA-Z0-9]+'; then
  echo -e "${YELLOW}⚠️  API key doesn't match expected format (sk-...). Continuing anyway.${NC}"
fi

# ── Ignore local changes to .env in git ──────────────────────
# Prevents accidental commits of real API keys.
git update-index --skip-worktree "$ENV_FILE" 2>/dev/null || true

# ── Configure Claude Code settings ──────────────────────────
CLAUDE_CONFIG_DIR="$HOME/.claude"
mkdir -p "$CLAUDE_CONFIG_DIR"
SETTINGS_FILE="$CLAUDE_CONFIG_DIR/settings.json"

# Helper: write Claude Code settings.json using node or python3.
# apiKeyHelper reads DEEPSEEK_API_KEY from project .env file so it
# works in any shell session. Falls back to env var if .env missing.
_write_claude_settings() {
  if command -v node &>/dev/null; then
    # Primary: use Node.js (available in the devcontainer image).
    # The apiKeyHelper is a sh -c command that reads the key from env or .env.
    node -e "
      var fs = require('fs');
      var settings = {};
      if (fs.existsSync('$SETTINGS_FILE')) {
        try { settings = JSON.parse(fs.readFileSync('$SETTINGS_FILE', 'utf8')); } catch(e) {}
      }
      settings.apiKeyHelper = 'sh -c ' + \"'\" + 'key=\"\$DEEPSEEK_API_KEY\"; if [ -n \"\$key\" ] && [ \"\$key\" != \"sk-your-api-key-here\" ]; then echo \"\$key\"; else grep -E \"^DEEPSEEK_API_KEY=\" \"$WORKSPACE_DIR/.env\" 2>/dev/null | head -1 | cut -d= -f2- | xargs; fi' + \"'\";
      settings.permissions = settings.permissions || {};
      settings.permissions.allow = settings.permissions.allow || [];
      var defaults = [
        'Bash(pnpm install *)',
        'Bash(pnpm run *)',
        'Bash(pnpm --filter *)',
        'Bash(ls *)',
        'Bash(cat *)',
      ];
      for (var i = 0; i < defaults.length; i++) {
        if (settings.permissions.allow.indexOf(defaults[i]) === -1) {
          settings.permissions.allow.push(defaults[i]);
        }
      }
      fs.writeFileSync('$SETTINGS_FILE', JSON.stringify(settings, null, 2) + '\n');
      console.log('✅ Claude Code settings updated: $SETTINGS_FILE');
    "
  elif command -v python3 &>/dev/null; then
    # Fallback: use Python 3 (available on most systems).
    # Pass workspace dir via env var to avoid nested-quote headaches.
    _WSP="$WORKSPACE_DIR" python3 -c "
import json, os
f = '$SETTINGS_FILE'
wsp = os.environ.get('_WSP', '')
# Build apiKeyHelper: sh -c command that reads key from env var or .env file
helper = 'sh -c ' + \"'\" + 'key=\"\$DEEPSEEK_API_KEY\"; if [ -n \"\$key\" ] && [ \"\$key\" != \"sk-your-api-key-here\" ]; then echo \"\$key\"; else grep -E \"^DEEPSEEK_API_KEY=\" \"' + wsp + '/.env\" 2>/dev/null | head -1 | cut -d= -f2- | xargs; fi' + \"'\"
s = {}
try:
    with open(f) as fh: s = json.load(fh)
except: pass
s['apiKeyHelper'] = helper
s.setdefault('permissions', {}).setdefault('allow', [])
for d in ['Bash(pnpm install *)', 'Bash(pnpm run *)', 'Bash(pnpm --filter *)', 'Bash(ls *)', 'Bash(cat *)']:
    if d not in s['permissions']['allow']: s['permissions']['allow'].append(d)
with open(f, 'w') as fh:
    json.dump(s, fh, indent=2)
    fh.write('\n')
print('✅ Claude Code settings updated: ' + f)
"
  else
    echo -e "${RED}❌ Neither node nor python3 found in PATH.${NC}"
    echo "   The devcontainer may still be initializing — wait for setup to complete,"
    echo "   then re-run this script."
    return 1
  fi
}

_write_claude_settings

# ── Also write to shell RC for terminal convenience ─────────
SHELL_RC=""
case "$SHELL" in
  */zsh)  SHELL_RC="$HOME/.zshrc" ;;
  */bash) SHELL_RC="$HOME/.bashrc" ;;
  *)      SHELL_RC="$HOME/.profile" ;;
esac

if [ -f "$SHELL_RC" ]; then
  sed -i '/^export DEEPSEEK_API_KEY=/d' "$SHELL_RC" 2>/dev/null || true
  # Source .env in shell RC so the key is available in interactive terminals
  if ! grep -q 'source.*\.env.*2>/dev/null' "$SHELL_RC" 2>/dev/null; then
    echo "" >> "$SHELL_RC"
    echo "# Auto-load .env (added by configure-claude.sh)" >> "$SHELL_RC"
    echo "[ -f \"$WORKSPACE_DIR/.env\" ] && source \"$WORKSPACE_DIR/.env\" 2>/dev/null || true" >> "$SHELL_RC"
  fi
fi

# ── Source .env to update current session ────────────────────
# After writing the key to .env, the current shell may still
# have an old value (e.g. the placeholder from post-start).
# Source .env now so that 'claude' works immediately.
source "$ENV_FILE" 2>/dev/null || true

# ── Summary ─────────────────────────────────────────────────
if ! $QUIET; then
  echo ""
  echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  ✅ Claude Code + DeepSeek API configured!                   ║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  # Show the actual source, not always .env
  case "$KEY_SOURCE" in
    env_file)  echo -e "  API key source: ${CYAN}$ENV_FILE${NC}" ;;
    env_var)   echo -e "  API key source: ${CYAN}environment variable → $ENV_FILE${NC}" ;;
    *)         echo -e "  API key source: ${CYAN}$ENV_FILE${NC}" ;;
  esac
  echo -e "  Claude config:  ${CYAN}$SETTINGS_FILE${NC}"
  echo ""
  echo -e "  Try it now: ${CYAN}claude${NC}"
  echo ""
fi
