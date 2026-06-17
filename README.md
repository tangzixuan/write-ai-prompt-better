# write-ai-prompt-better

> A toolset for writing better prompts for AI coding assistants — Claude Code, GitHub Copilot, Cursor, Cline, Windsurf, and friends.

The flagship product is a **VSCode extension** that turns right-clicks in your editor, terminal, and Explorer into structured, copy-ready Markdown prompts — no more manually stitching together file paths, line numbers, and code snippets. This repository is the pnpm workspace that hosts the extension alongside shared packages and a (future) website.

---

## Repository structure

This is a [pnpm workspace](https://pnpm.io/workspaces) monorepo:

```
write-ai-prompt-better/
├── apps/
│   ├── vscode-extension/   # The VSCode extension (core product)
│   └── website/             # Marketing/docs site (scaffold)
├── packages/
│   ├── ui/                  # Shared UI primitives (scaffold)
│   └── utils/               # Shared utilities (scaffold)
├── design.md                # Original project brief
├── pnpm-workspace.yaml      # Workspace definition (apps/*, packages/*)
├── tsconfig.base.json       # Shared TypeScript base config
└── package.json             # Workspace root scripts
```

| Package | Name | Status |
| --- | --- | --- |
| `apps/vscode-extension` | `write-ai-prompt-better` | ✅ Core product — full VSCode extension |
| `apps/website` | `@write-ai-prompt-better/website` | 🚧 Scaffold |
| `packages/ui` | `@write-ai-prompt-better/ui` | 🚧 Scaffold |
| `packages/utils` | `@write-ai-prompt-better/utils` | 🚧 Scaffold |

---

## Prerequisites

- **Node.js** 18+ (required by the VSCode extension's `@types/vscode` / `@types/node`)
- **pnpm** 9.x — the repo pins `pnpm@9.15.0` via `packageManager`

---

## Quick start

```bash
# Install dependencies for every workspace package
pnpm install

# Build all packages (TypeScript → dist/ or out/)
pnpm build

# Watch mode across all packages (parallel)
pnpm dev
```

### Run the VSCode extension

The extension is the only runnable product today. From the repo root:

```bash
# Build just the extension (TypeScript → out/)
pnpm --filter write-ai-prompt-better run build
```

Then open `apps/vscode-extension/` in VSCode and press **F5** to launch the
Extension Development Host. See the extension's own docs for full usage:

- 📄 [`apps/vscode-extension/README.md`](apps/vscode-extension/README.md) — features, usage, configuration
- 📄 [`apps/vscode-extension/design.md`](apps/vscode-extension/design.md) — technical design (Chinese)
- 📄 [`apps/vscode-extension/architecture.md`](apps/vscode-extension/architecture.md) — architecture diagrams

---

## Workspace scripts

Run from the repository root to operate on every package at once:

| Script | Command | Description |
| --- | --- | --- |
| `build` | `pnpm build` | Build all workspace packages |
| `dev` | `pnpm dev` | Watch mode for all packages in parallel |
| `typecheck` | `pnpm typecheck` | Type-check all packages without emitting |
| `lint` | `pnpm lint` | Lint all packages |

To target a single package, use pnpm's filter syntax:

```bash
pnpm --filter write-ai-prompt-better run build      # the extension
pnpm --filter @write-ai-prompt-better/utils run build
```

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Monorepo | pnpm workspaces |
| Language | TypeScript (strict) |
| Extension runtime | VSCode Extension Host (Node.js) |
| Extension UI | Inline HTML + CSS + Vanilla JS (webview) |
| Build | `tsc` directly — no bundler |

> Note: the workspace root and the shared packages use ES modules (`"type": "module"`), but the VSCode extension is built as **CommonJS** (its `tsconfig.json` overrides the shared base) so it loads correctly in the Extension Host.

---

## Project documents

- [`design.md`](design.md) — original project brief (initialization requirements)
- [`apps/vscode-extension/design.md`](apps/vscode-extension/design.md) — extension technical design
- [`apps/vscode-extension/architecture.md`](apps/vscode-extension/architecture.md) — extension architecture diagrams

---

## License

[MIT](LICENSE) © 2026 tangzixuan
