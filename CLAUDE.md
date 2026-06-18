# CLAUDE.md

> AI-assisted development guide for the write-ai-prompt-better project.
> Primary target: Claude Code and similar coding agents.

## Project Identity

**write-ai-prompt-better** is a VSCode extension that streamlines prompt writing for AI coding assistants (Claude Code, GitHub Copilot, Cursor, Cline, Windsurf). Users right-click in the editor/terminal/explorer to collect context, then assemble and copy structured Markdown prompts.

- **Author**: tangzixuan
- **License**: MIT
- **Status**: Active development — the VSCode extension is the only functional product; `apps/website` and `packages/*` are scaffolds.

## Repository Structure

```
write-ai-prompt-better/
├── apps/
│   ├── vscode-extension/     ← Core product (active)
│   │   ├── src/
│   │   │   ├── extension.ts           # Activation entry, command registration
│   │   │   ├── WriteBetterPromptProvider.ts  # Webview provider + embedded UI
│   │   │   ├── types.ts              # Shared types & message protocol
│   │   │   └── i18n.ts               # EN / zh-CN translations
│   │   ├── media/icon.svg
│   │   ├── package.json              # Extension manifest
│   │   └── tsconfig.json             # CommonJS build (for Extension Host)
│   └── website/               ← Scaffold (inactive)
├── packages/
│   ├── ui/                    ← Scaffold (inactive)
│   └── utils/                 ← Scaffold (inactive)
├── design.md                  # Original project brief (Chinese, 1 line)
├── tsconfig.base.json         # Shared TS base config (ESM)
├── pnpm-workspace.yaml        # Defines apps/* and packages/*
└── package.json               # Root workspace scripts
```

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Monorepo | pnpm workspaces | `packageManager: pnpm@9.15.0` |
| Language | TypeScript (strict) | Root/base: ESNext modules; Extension: CommonJS |
| Extension runtime | VSCode Extension Host (Node.js, API ^1.85.0) | |
| Extension UI | Inline HTML + CSS + Vanilla JS in a single TS file | **No framework, no bundler.** All UI is a template string in `WriteBetterPromptProvider._getHtml()` |
| Build | `tsc` directly | `tsc -p ./` outputs to `out/` |
| Storage | `ExtensionContext.globalState` | Keys: `wbp.history`, `wbp.presets`, `wbp.validationPresets`, `wbp.lang` |
| Security | CSP with nonce | Inline scripts only, no external resources |
| i18n | Custom module | Two locales: `en` (default) and `zh-cn`; user-preference persisted |

## Architecture

### Core Pattern: Centralized State + Multi-View Sync

All context items live in the **Extension Host** process (not in any webview). The `WriteBetterPromptProvider` manages:

- `_contextItems: ContextItem[]` — shared context items
- `_history: HistoryItem[]` — persisted to globalState
- `_presets: PresetPrompt[]` — persisted to globalState
- `_validationPresets: PresetPrompt[]` — persisted to globalState
- `_skills: SkillItem[]` — lazily scanned from disk
- `_view?: WebviewView` — sidebar view (0 or 1)
- `_editorPanels: WebviewPanel[]` — editor panels (0 to N)

The provider implements `vscode.WebviewViewProvider` for the sidebar and creates/manages `WebviewPanel` instances for editor tabs. Both share the same `_handleMessage()` and `_getHtml()` methods.

### Message Protocol

**Webview → Extension** (type: `WebviewMessage`):
- `ready` — init complete, request state
- `copyToClipboard`, `saveHistory`, `deleteHistoryItem`, `clearHistory`
- `savePresets`, `saveValidationPresets`
- `getSkills`, `openSkillFile`
- `removeContextItem`, `addManualItem`, `setContextItems`, `clearContextItems`
- `openEditorPanel`, `openEditorPanelBeside`
- `changeLanguage`

**Extension → Webview** (type: `ExtensionMessage`):
- `syncContextItems` — broadcast on any context change
- `historyData`, `presetsData`, `validationPresetsData` — broadcast on change
- `skillsData` — sent only to the requesting view
- `clearAll` — reset all local state

### Data Flow

```
User right-clicks → Command handler → provider.addContextItem(item)
  → _contextItems.push(item)
  → _broadcast({ type: 'syncContextItems', items: _contextItems })
  → All views update their DOM

Webview JS (any view) → postMessage → provider._handleMessage()
  → update state → _broadcast() → all views
```

### Key Design Decisions

1. **No framework in the webview** — HTML/CSS/JS are template literals in `_getHtml()`. This avoids a build step for the webview and keeps the extension self-contained. The JS is an IIFE using `var` (no `let`/`const` or template literals) to survive TS template literal interpolation.

2. **No bundler** — The extension compiles with plain `tsc`. The `tsconfig.json` overrides the root base config to use CommonJS modules (required by VSCode's Extension Host).

3. **Global state over settings.json** — Presets modified via the UI are stored in `globalState` and take priority over `settings.json` values (which only seed the initial defaults).

4. **Webview regeneration for language switch** — When language changes, all views' HTML is regenerated and set via `webview.html = ...`. The `ready` handshake re-syncs server-side state; local state (textarea content, selected skills) is reset.

5. **Terminal content via clipboard** — VSCode API cannot read terminal selection directly. The command runs `workbench.action.terminal.copySelection`, waits 150ms, then reads the clipboard.

## Development Commands

All commands from the repo root:

```bash
pnpm install                          # Install all workspace dependencies
pnpm build                            # Build all packages
pnpm dev                              # Watch mode (parallel)
pnpm typecheck                        # Type-check only, no emit

# VSCode extension specific
pnpm --filter write-ai-prompt-better run build
pnpm --filter write-ai-prompt-better run watch
pnpm --filter write-ai-prompt-better run typecheck
```

To run/debug the extension: open `apps/vscode-extension/` in VSCode and press **F5** to launch the Extension Development Host.

## Key Files Reference

| File | Purpose | When to Edit |
|------|---------|-------------|
| `apps/vscode-extension/src/extension.ts` | Activation entry, 6 command handlers | Adding a new right-click command |
| `apps/vscode-extension/src/WriteBetterPromptProvider.ts` | Core provider + all HTML/CSS/JS (~1120 lines) | Any UI change, new message handler, layout change |
| `apps/vscode-extension/src/types.ts` | `ContextItem`, `SkillItem`, `HistoryItem`, `PresetPrompt`, message types | Adding new message types or fields |
| `apps/vscode-extension/src/i18n.ts` | All translatable strings for EN and zh-CN + `t()`, `getLang()`, `setLang()` | Adding new UI text |
| `apps/vscode-extension/package.json` | Extension manifest: commands, menus, views, config | Adding commands, menu items, config keys |

## UI Layout (Sidebar)

```
┌─────────────────────────────┐
│ [Clear]   [中文] [↗ New Win]│  ← Toolbar (lang toggle button)
├─────────────────────────────┤
│ 📄 Background               │  ← Context cards
│ 📌 Select Skills            │  ← Skill dropdown + chips
│ 💬 Requirements             │  ← Preset dropdown + textarea (6 rows)
│ ✅ Validation               │  ← Preset dropdown + textarea (3 rows)
│         [👁 Preview] [📋 Copy]│  ← Action bar
│ 👁 Prompt Preview           │  ← Inline preview (hidden by default)
├─────────────────────────────┤
│ ⏱ History [N]           ›  │  ← Collapsible (flex-shrink:0 removed, now scrolls with page)
└─────────────────────────────┘
```

## Code Conventions

1. **Webview JS constraints**: The JS string is embedded in a TypeScript template literal (backtick-delimited). To avoid escaping issues:
   - Use `var` not `let`/`const`
   - Use `NL` (newline) and `BT` (backtick) constants instead of literal `\n` and `` ` ``
   - Use `FENCE` for triple-backtick code fences
   - Access localized strings via `MSG.keyName`

2. **CSS**: Uses VSCode CSS variables (`--vscode-*`) for theme compatibility. All selectors are flat (no nesting — it's raw CSS, not SCSS).

3. **TypeScript**: Strict mode. All public APIs have explicit types. The `WebviewMessage` and `ExtensionMessage` union types are the single source of truth for the message protocol.

4. **File organization**: The provider file is large (~1120 lines). When adding features, prefer adding code to the appropriate existing section rather than creating new files, unless the new code is a genuinely separate concern (like i18n was split out).

5. **No tests**: The project currently has no test suite. Manual testing is done via F5 → Extension Development Host.

## Common Tasks

### Adding a new UI section
1. Add HTML structure in `_getBody()` (in the `.main-content` div or as a new sibling)
2. Add CSS in `_getCss()`
3. Add JS logic in `_getJs()` (event handlers, render functions)
4. Add i18n keys in `i18n.ts` (interface + both locales)
5. Use `t('key')` in `_getBody()` for static labels; use `MSG.key` in `_getJs()` for dynamic text

### Adding a new message type
1. Add to `WebviewMessage` or `ExtensionMessage` union in `types.ts`
2. Handle in `_handleMessage()` switch (extension side)
3. Handle in `window.addEventListener('message', ...)` switch (webview JS side)

### Adding a new context menu command
1. Register command + menu contribution in `package.json`
2. Add command handler in `extension.ts` (follow existing pattern)
3. Register in `activate()` with `context.subscriptions.push()`

### Adding a new language
1. Add a new locale object in `i18n.ts` (e.g., `ja: I18nMessages`)
2. Update `getLang()` / `setLang()` to accept the new code
3. Update `getWebviewMessages()` to return the new locale
4. Update `WebviewMessage.changeLanguage.lang` union type in `types.ts`

### Changing the layout (CSS)
- The CSS is minified in `_getCss()`. Each rule is on a single line separated by newlines.
- Key layout classes: `.app` (outer flex column, scrollable), `.main-content` (content flow), `.history-section` (history at bottom)
- VSCode theme variables are used: use `var(--vscode-*)` with a hardcoded fallback

## Dependencies

The VSCode extension has **zero runtime npm dependencies**. Dev dependencies only:
- `@types/vscode` (^1.85.0)
- `@types/node` (^20.0.0)
- `typescript` (^5.7.0)
