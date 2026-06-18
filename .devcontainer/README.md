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
3. **Edit `.env`** — replace the placeholder with your real key:
   ```
   DEEPSEEK_API_KEY=sk-your-real-key
   ```
4. Run:
   ```bash
   bash .devcontainer/scripts/configure-claude.sh
   ```
5. `claude` is ready

## Claude Code + DeepSeek API

The API key lives in **`.env`** at the project root. Claude Code reads it from there — no manual `export` needed.

```
.env  →  apiKeyHelper  →  Claude Code CLI
```

### Setup

Edit `.env`, replace the placeholder, then run:

```bash
bash .devcontainer/scripts/configure-claude.sh
```

Or run the script first — it prompts for your key and writes it to `.env` automatically.

### Auto-configuration

Every codespace start, `post-start.sh` checks `.env` for a valid key and auto-configures Claude Code. Just edit `.env` and restart — done.

### Using Claude Code

```bash
claude                          # Interactive session
claude -p "refactor this file"  # One-shot prompt
```

### Git protection for `.env`

`.env` is tracked in git (with a placeholder value), but your real API key should **never** be committed. The devcontainer scripts automatically run:

```bash
git update-index --skip-worktree .env
```

This tells git to ignore local changes to `.env` — it won't show up in `git status`, and `git add .` won't stage it. If you ever need to update the placeholder, run:

```bash
git update-index --no-skip-worktree .env   # re-enable tracking
# edit .env with the new placeholder
git add .env && git commit -m "..."
git update-index --skip-worktree .env      # re-ignore
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
├── devcontainer.json          # Container definition
├── README.md                  # This file
└── scripts/
    ├── on-create.sh           # Install pnpm + dependencies
    ├── post-create.sh         # Build + install Claude Code
    ├── post-start.sh          # Source .env, auto-configure
    └── configure-claude.sh    # Write key to .env + Claude config
```
