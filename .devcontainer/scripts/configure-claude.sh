#!/bin/bash
# ──────────────────────────────────────────────────────────────
# Configure Claude Code from .devcontainer/.deepseek-claude.json
# ──────────────────────────────────────────────────────────────
# Reads settings (env vars, model config, permissions) from
# .devcontainer/.deepseek-claude.json and writes them to
# ~/.claude/settings.json so Claude Code works immediately.
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
TEMPLATE_FILE="$WORKSPACE_DIR/.devcontainer/.deepseek-claude.json"
CLAUDE_CONFIG_DIR="$HOME/.claude"
SETTINGS_FILE="$CLAUDE_CONFIG_DIR/settings.json"

# ── Check that the template file exists ──────────────────────
if [ ! -f "$TEMPLATE_FILE" ]; then
  echo -e "${RED}❌ Template not found: $TEMPLATE_FILE${NC}"
  exit 1
fi

# ── Read token from template (node primary, python3 fallback) ─
_read_json_field() {
  local field="$1"
  if command -v node &>/dev/null; then
    node -e "
      var fs = require('fs');
      var c = JSON.parse(fs.readFileSync('$TEMPLATE_FILE', 'utf8'));
      var v = (c.env || {})['$field'] || '';
      process.stdout.write(v);
    " 2>/dev/null
  elif command -v python3 &>/dev/null; then
    python3 -c "
      import json
      with open('$TEMPLATE_FILE') as f:
        c = json.load(f)
      print(c.get('env', {}).get('$field', ''), end='')
    " 2>/dev/null
  else
    echo ""
  fi
}

TOKEN=$(_read_json_field "ANTHROPIC_AUTH_TOKEN")

# ── Check if token is a placeholder ──────────────────────────
is_placeholder() {
  local t="$1"
  [ -z "$t" ] && return 0
  [ "$t" = "your-deepseek-api-token" ] && return 0
  [ "$t" = "your-api-key-here" ] && return 0
  return 1
}

# ── Interactive prompt for token ─────────────────────────────
if is_placeholder "$TOKEN"; then
  if $QUIET; then
    echo -e "${YELLOW}⚠  No valid API token in $TEMPLATE_FILE${NC}"
    echo "   Edit .devcontainer/.deepseek-claude.json → env.ANTHROPIC_AUTH_TOKEN"
    exit 0
  fi

  echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║      Configure Claude Code with DeepSeek API                ║${NC}"
  echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "  Get your API key at: ${GREEN}https://platform.deepseek.com/api_keys${NC}"
  echo ""

  read -r -p "  Paste your DeepSeek API key (sk-...): " TOKEN

  if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ No API key provided. Aborting.${NC}"
    exit 1
  fi

  # Write the real token into the template file
  if command -v node &>/dev/null; then
    node -e "
      var fs = require('fs');
      var c = JSON.parse(fs.readFileSync('$TEMPLATE_FILE', 'utf8'));
      c.env = c.env || {};
      c.env.ANTHROPIC_AUTH_TOKEN = '$TOKEN';
      fs.writeFileSync('$TEMPLATE_FILE', JSON.stringify(c, null, 2) + '\n');
    "
  elif command -v python3 &>/dev/null; then
    python3 -c "
      import json
      with open('$TEMPLATE_FILE') as f:
        c = json.load(f)
      c.setdefault('env', {})['ANTHROPIC_AUTH_TOKEN'] = '$TOKEN'
      with open('$TEMPLATE_FILE', 'w') as f:
        json.dump(c, f, indent=2)
        f.write('\n')
    "
  fi
  echo -e "${GREEN}✅ Token saved to $TEMPLATE_FILE${NC}"
fi

# ── Validate token format ────────────────────────────────────
if ! echo "$TOKEN" | grep -qE '^sk-[a-zA-Z0-9]+'; then
  echo -e "${YELLOW}⚠  API token doesn't match expected format (sk-...). Continuing anyway.${NC}"
fi

# ── Protect template file from accidental git commits ────────
git update-index --skip-worktree "$TEMPLATE_FILE" 2>/dev/null || true

# ── Write Claude Code settings ───────────────────────────────
# Merges .deepseek-claude.json into ~/.claude/settings.json:
#   • env block → settings.env (Claude Code reads ANTHROPIC_AUTH_TOKEN from here)
#   • Top-level fields (includeCoAuthoredBy, skipDangerousModePermissionPrompt, …)
#   • Preserves existing permissions and adds safe defaults
mkdir -p "$CLAUDE_CONFIG_DIR"

_write_settings() {
  if command -v node &>/dev/null; then
    node -e "
      var fs = require('fs');

      // Load template
      var tmpl = JSON.parse(fs.readFileSync('$TEMPLATE_FILE', 'utf8'));

      // Load existing settings (if any)
      var settings = {};
      if (fs.existsSync('$SETTINGS_FILE')) {
        try { settings = JSON.parse(fs.readFileSync('$SETTINGS_FILE', 'utf8')); } catch(e) {}
      }

      // Merge env block — Claude Code reads ANTHROPIC_* vars from settings.env
      if (tmpl.env) {
        settings.env = settings.env || {};
        Object.keys(tmpl.env).forEach(function(k) {
          settings.env[k] = tmpl.env[k];
        });
      }

      // Merge top-level settings from template (skip env + permissions)
      ['env', 'permissions'].forEach(function(skip) { delete tmpl[skip]; });
      Object.keys(tmpl).forEach(function(k) {
        settings[k] = tmpl[k];
      });

      // Preserve & extend permissions
      settings.permissions = settings.permissions || {};
      settings.permissions.allow = settings.permissions.allow || [];
      var defaults = [
        'Bash(pnpm install *)',
        'Bash(pnpm run *)',
        'Bash(pnpm --filter *)',
        'Bash(ls *)',
        'Bash(cat *)',
      ];
      defaults.forEach(function(d) {
        if (settings.permissions.allow.indexOf(d) === -1) {
          settings.permissions.allow.push(d);
        }
      });

      fs.writeFileSync('$SETTINGS_FILE', JSON.stringify(settings, null, 2) + '\n');
      console.log('✅ Claude Code settings written to ' + '$SETTINGS_FILE');
    "
  elif command -v python3 &>/dev/null; then
    python3 -c "
      import json, os

      # Load template
      with open('$TEMPLATE_FILE') as f:
        tmpl = json.load(f)

      # Load existing settings
      settings = {}
      if os.path.exists('$SETTINGS_FILE'):
        try:
          with open('$SETTINGS_FILE') as f:
            settings = json.load(f)
        except: pass

      # Merge env block
      if 'env' in tmpl:
        settings.setdefault('env', {}).update(tmpl['env'])

      # Merge top-level settings (skip env + permissions)
      for k, v in tmpl.items():
        if k not in ('env', 'permissions'):
          settings[k] = v

      # Preserve & extend permissions
      settings.setdefault('permissions', {}).setdefault('allow', [])
      defaults = [
        'Bash(pnpm install *)',
        'Bash(pnpm run *)',
        'Bash(pnpm --filter *)',
        'Bash(ls *)',
        'Bash(cat *)',
      ]
      for d in defaults:
        if d not in settings['permissions']['allow']:
          settings['permissions']['allow'].append(d)

      with open('$SETTINGS_FILE', 'w') as f:
        json.dump(settings, f, indent=2)
        f.write('\n')
      print('✅ Claude Code settings written to ' + '$SETTINGS_FILE')
    "
  else
    echo -e "${RED}❌ Neither node nor python3 found in PATH.${NC}"
    echo "   Wait for devcontainer setup to complete, then re-run this script."
    return 1
  fi
}

_write_settings

# ── Summary ─────────────────────────────────────────────────
if ! $QUIET; then
  echo ""
  echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  ✅ Claude Code configured!                                  ║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "  Config source:  ${CYAN}$TEMPLATE_FILE${NC}"
  echo -e "  Claude config:  ${CYAN}$SETTINGS_FILE${NC}"
  echo ""
  echo -e "  Try it now: ${CYAN}claude${NC}"
  echo ""
fi
