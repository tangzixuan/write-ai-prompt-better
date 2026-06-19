# Devcontainer for write-ai-prompt-better

Ready-to-code environment for this VSCode extension project. Works with:

- **GitHub Codespaces** — one-click cloud development
- **VSCode Dev Containers** — local container-based development

## What's included

| Tool | Purpose |
|------|---------|
| **Node.js 20** (TypeScript) | Extension runtime & build |
| **pnpm 9.15** | Package manager |
| **Claude Code CLI** | AI-assisted coding |
| **GitHub CLI** (`gh`) | PR, issues, repo management |
| **VSCode extensions** | ESLint, Prettier, GitLens |

## Quick start

1. Open this repo in **GitHub Codespaces** (`<> Code` → Codespaces → Create)
2. Wait for the container to build (~2 minutes)
3. **Edit `.devcontainer/.deepseek-claude.json`** — replace the placeholder token with your real key:
   ```json
   "ANTHROPIC_AUTH_TOKEN": "sk-your-real-key"
   ```
4. Run:
   ```bash
   bash .devcontainer/scripts/configure-claude.sh
   ```
5. `claude` is ready

## Claude Code + DeepSeek API

All configuration lives in a single file: **`.devcontainer/.deepseek-claude.json`**. The setup script reads it and writes the settings directly into `~/.claude/settings.json` — Claude Code picks up the API token and model settings from there. No `.env` needed.

```
.devcontainer/.deepseek-claude.json  →  ~/.claude/settings.json  →  Claude Code CLI
```

### Setup

Edit `.devcontainer/.deepseek-claude.json`, set `env.ANTHROPIC_AUTH_TOKEN` to your real key, then run:

```bash
bash .devcontainer/scripts/configure-claude.sh
```

Or run the script first — it prompts for your key and writes it to the JSON file automatically.

### Auto-configuration

Every codespace start, `post-start.sh` runs `configure-claude.sh --quiet` to ensure Claude Code settings are up-to-date. Just edit `.devcontainer/.deepseek-claude.json` and restart — done.

### Using Claude Code

```bash
claude                          # Interactive session
claude -p "refactor this file"  # One-shot prompt
```

### Git protection

`.devcontainer/.deepseek-claude.json` is tracked in git (with a placeholder token), but your real API key should **never** be committed. The devcontainer scripts automatically run:

```bash
git update-index --skip-worktree .devcontainer/.deepseek-claude.json
```

This tells git to ignore local changes to the file — it won't show up in `git status`, and `git add .` won't stage it. If you ever need to update the placeholder in the repo:

```bash
git update-index --no-skip-worktree .devcontainer/.deepseek-claude.json   # re-enable tracking
# edit the file with the new placeholder
git add .devcontainer/.deepseek-claude.json && git commit -m "..."
git update-index --skip-worktree .devcontainer/.deepseek-claude.json      # re-ignore
```

> **Get your key:** https://platform.deepseek.com/api_keys

## Development commands

```bash
pnpm build             # Build all packages
pnpm dev               # Watch mode
pnpm typecheck         # Type-check only
```

## File structure

```
.devcontainer/
├── .deepseek-claude.json       # Claude Code config template (API token + model settings)
├── devcontainer.json           # Container definition
├── README.md                   # This file
└── scripts/
    ├── on-create.sh            # Install pnpm + dependencies
    ├── post-create.sh          # Build + install Claude Code
    ├── post-start.sh           # Auto-configure Claude Code on start
    └── configure-claude.sh     # Read config template → write ~/.claude/settings.json
```
