# write-ai-prompt-better

> A VSCode extension that streamlines prompt writing for Claude Code, GitHub Copilot, Cursor, Cline, Windsurf, and other AI coding assistants.

Instead of manually copying file paths, line numbers, and code snippets into a chat box, this extension lets you right-click anything in VSCode — code selection, file tab, terminal output, Explorer item — and instantly add it as a structured context card. Open a dedicated prompt editor in the sidebar or as a standalone editor tab, write your requirement, pick a skill if needed, and copy a clean, formatted Markdown prompt to clipboard.

All open prompt editors stay in sync: adding context from a right-click updates every window immediately.

---

## Installation

**From VSIX (local install):**

```bash
code --install-extension write-ai-prompt-better-0.1.0.vsix
```

**From source (this pnpm monorepo):**

```bash
# From the repository root — installs dependencies for every workspace package
pnpm install

# Build the extension (TypeScript → out/)
pnpm --filter write-ai-prompt-better run build

# Press F5 in VSCode (open apps/vscode-extension/) to launch the Extension Development Host
```

> The extension lives at `apps/vscode-extension/` inside the pnpm workspace. It is self-contained — no runtime dependency on the other workspace packages — and compiles with plain `tsc`, so there is no bundler step.

> VS Marketplace listing coming soon.

---

## Quick Start

1. Click the **pencil icon** in the Activity Bar to open the sidebar panel
2. In your editor, select some code → right-click → **Add to write-ai-prompt-better**
   - The item is added to all open prompt editors without interrupting your current focus
3. Type your requirement in the **💬 需求描述** textarea
4. Click **📋 复制** — a structured prompt is copied to your clipboard
5. Paste into Claude Code, Copilot Chat, or any AI assistant

**Tip:** Click **↗ 新窗口编辑** at the top of the sidebar panel to open a full editor tab — useful for split-screen workflows where you want the prompt editor and your code side by side.

---

## Features

- **Sidebar panel** — A dedicated prompt editor docked in the Activity Bar (pencil icon)
- **Standalone editor tab** — Click **↗ 新窗口编辑** to open the prompt editor as a full editor tab next to your code; click **→ 向右分屏** inside the tab to add another editor to the right
- **Multi-window real-time sync** — All open prompt editors (sidebar + editor tabs) share the same context items; adding or removing a context item updates every window instantly
- **Add code from editor** — Select code → right-click → "Add to write-ai-prompt-better" — adds the file path + line range as a reference card and copies the code to clipboard; does not interrupt your current editor focus
- **Add whole file from tab** — Right-click an editor tab title → "Add to write-ai-prompt-better" — adds the file path as a reference card
- **Add terminal output** — Select text in the integrated terminal → right-click → "Add to write-ai-prompt-better"
- **Add folder/file from Explorer** — Right-click any folder or file → "Add to write-ai-prompt-better" — adds the path as a reference card
- **Manual add** — Click **＋ 手动添加** (Add manually) to type any freeform note, URL, or path
- **Select Skills** — Auto-discovers AI assistant skills across global and workspace directories (Claude Code, Cursor, Copilot, Cline, Windsurf); custom dropdown with fuzzy search; selected skills are referenced by file path in the generated prompt
- **Real-time preview** — Click **👁 预览** (Preview) to open an inline preview panel that updates as you edit
- **Copy prompt** — Click **📋 复制** (Copy) to assemble and copy the structured Markdown prompt, and save it to history
- **Requirement presets** — Dropdown with preset requirement starters; append multiple presets to the textarea
- **Validation method** — A separate section to describe how to verify the change, with its own preset dropdown
- **Manage presets** — Add, edit, and delete presets via the ⚙ panel; changes persist across sessions
- **Unlimited history** — Browse, restore, preview, and delete previously generated prompts; history is saved persistently with no cap

> **Note:** The sidebar UI labels are currently in Chinese (e.g., 背景描述 = Background context, 需求描述 = Requirements, 验证方法 = Validation method). An English UI option is planned.

---

## Usage

### Add context items

**From editor — code selection:**

1. Select code in the editor
2. Right-click → **Add to write-ai-prompt-better** (appears at the top of the context menu)
3. The file path and line range are added as a `📄` reference card across all open prompt editors; the code text is also copied to clipboard
4. Your current editor focus is not changed — switch to the prompt editor when ready

**From editor — whole file (tab right-click):**

1. Right-click a file tab in the editor title area
2. Select **Add to write-ai-prompt-better**
3. The file path is added as a `📄` reference card

**From terminal:**

1. Select text in the integrated terminal
2. Right-click → **Add to write-ai-prompt-better**
3. The terminal output is added as a `💻` card with its content

**From Explorer — folder:**

1. Right-click any folder in the Explorer panel
2. Select **Add to write-ai-prompt-better**
3. The folder path is added as a `📁` reference card

**From Explorer — file:**

1. Right-click any file in the Explorer panel
2. Select **Add to write-ai-prompt-better**
3. The file path is added as a `📄` reference card

**Manually (手动添加):**

1. Click **＋ 手动添加** in the sidebar or editor tab
2. Type any text (path, notes, a URL, etc.) and press Enter or click **添加**

---

### Open in editor / Split view

The plugin supports working in a full editor tab alongside your code:

**Open editor tab (sidebar → editor):**

1. Click **↗ 新窗口编辑** at the top of the sidebar panel
2. A prompt editor tab opens to the right of the current editor
3. It shares the same context items as the sidebar; changes in either window sync instantly

**Split to the right (within an editor tab):**

1. Inside the prompt editor tab, click **→ 向右分屏** in the header bar
2. Another prompt editor tab opens to the right
3. All windows stay in sync — adding context in any window updates the others

> **Note on VS Code's built-in "Split Right":** VS Code's native Split Right action does not work correctly with webview editor tabs (one side becomes blank). Use the **→ 向右分屏** button provided in the editor tab header instead.

---

### Select Skills

The **📌 按需选择需要的 Skill** (Select Skills) section auto-loads all discoverable AI assistant skills when the panel opens.

**Supported sources:**

| Group | Path / Source |
| --- | --- |
| Claude Code · Global | `~/.claude/skills/<name>/SKILL.md` |
| Claude Code · Global | `~/.claude/CLAUDE.md` |
| Cursor · Global | `~/.cursor/rules/*.mdc` |
| Cursor · Global | `~/.cursorrules` |
| Copilot · Global | VS Code user setting `github.copilot.chat.codeGeneration.instructions` |
| Claude Code · Project | `.claude/skills/<name>/SKILL.md` (workspace root) |
| Cursor · Project | `.cursor/rules/*.mdc` · `.cursorrules` (workspace root) |
| Cline · Project | `.clinerules` (workspace root) |
| Windsurf · Project | `.windsurfrules` (workspace root) |
| Copilot · Project | `.github/copilot-instructions.md` (workspace root) |

**To add a skill to your prompt:**

1. Click the **添加 Skill… ▾** (Add Skill) dropdown button — a panel opens showing all available skills grouped by agent
2. Type in the search box to filter by skill name (fuzzy matching — characters don't need to be consecutive)
3. Click a skill item to add it; it appears as a chip below the dropdown
4. Each chip shows: agent tag, skill name, 📂 open-in-editor button (for file-backed skills), × remove button
5. Repeat to select multiple skills; adding the same skill twice shows a toast warning

---

### Write requirements

1. Optionally pick a preset from the **💬 需求描述** (Requirements) dropdown — the preset text is appended to the textarea (new line if text already exists)
2. Type or edit requirements in the textarea

### Set validation method

1. Optionally pick a preset from the **✅ 验证方法** (Validation method) dropdown
2. Describe how the result should be verified (e.g. "项目构建通过" = build passes, "单元测试全部通过" = all tests pass)

---

### Preview and copy

The toolbar at the top of each prompt editor contains:

- **清空** (Clear) — Clears all context cards, requirements, validation text, and selected skills; closes the preview panel. In the sidebar, located at the top-left; in the editor tab, located next to the split button in the header bar.

The action bar at the bottom contains:

- **👁 预览** (Preview) — Generates the prompt and displays it in an inline preview panel. Updates in real time as you edit. Click again to close.
- **📋 复制** (Copy) — Generates the prompt, copies it to clipboard, and saves it to history.

### Generated prompt format

````markdown
## 参考使用以下 SKILL

- `/Users/you/.claude/skills/my-skill/SKILL.md`
- `/path/to/project/.claude/skills/another/SKILL.md`

## 背景描述

参考以下文件或者文件夹的内容:
📄 `/path/to/src/app.tsx`#L12-20
📁 `/path/to/src/components`
📄 `/path/to/src/utils.ts`

💻 Terminal output:
```
Error: Cannot find module './utils'
```

📝 Some manual note

## 需求描述

帮我排查问题：组件在初次渲染后出现闪烁

## 验证方法

项目构建通过
````

Context item types and their format in the generated prompt:

| Type | Source | Format in prompt |
| --- | --- | --- |
| `file` (with selection) | Editor selection | `📄 path#Lstart-end` |
| `file` (whole file) | Editor tab right-click | `📄 path` |
| `folder` | Explorer folder right-click | `📁 path` |
| `fileRef` | Explorer file right-click | `📄 path` |
| `terminal` | Terminal selection | `💻 Terminal output:` + fenced code block |
| `manual` | Manual add button | `📝 text` |

> Sections using `##` headings are omitted entirely if empty — no `---` separators are added.

> File-type items display their full content in the sidebar cards (for quick review), but the generated prompt only outputs the path reference — the AI tool reads the file itself.

---

### History

- The **⏱ 历史记录** (History) section at the bottom is collapsed by default; click the section header to expand
- Each entry shows a preview (first ~100 characters) and a relative timestamp (just now / N minutes ago / N hours ago / N days ago)
- **Preview** — Hover over the 👁 button to see the full prompt in a popup
- **Restore** — Click **使用** on any history entry to restore the context items and requirements text to the editor; the history list collapses automatically
- **Copy** — Click 📋 inside the preview popup to copy the historical prompt directly
- **Delete** — Hover over an entry and click × to remove it
- **Clear all** — Click **清空历史** in the history section header (when expanded)
- History is persisted across VSCode sessions with no entry limit

---

### Manage presets

Click the **⚙** button next to the requirements or validation preset dropdown to open the preset management panel:

- **Edit** — Click ✏ next to a preset to expand an inline edit form; change the label or content, then click **保存** (Save)
- **Delete** — Click × to remove a preset
- **Add** — Click **＋ 添加预设** (Add preset), fill in a name and content, then click **添加**

All changes are saved immediately and persist across VSCode sessions.

> **Priority rule:** Presets saved via the ⚙ panel are stored in extension storage and take precedence over `writeBetterPrompt.presets` in `settings.json`. The settings value is only used as the initial seed when no UI-managed presets exist yet. To reset to the defaults, delete all presets in the panel.

---

## Configuration

Open VSCode Settings (`Cmd+,` / `Ctrl+,`) and search for **write-ai-prompt-better**.

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| `writeBetterPrompt.presets` | `array` | 6 built-in presets | Initial requirement preset list (seed only — UI-managed presets take precedence) |

### Default presets

| Label | Value |
| --- | --- |
| 调整样式 | 帮我调整样式： |
| 排查问题 | 帮我排查问题： |
| 实现功能 | 帮我实现功能： |
| 完善功能 | 帮我完善功能： |
| 代码审查 | 帮我做代码审查： |
| 添加注释 | 帮我添加注释： |

### Custom presets via settings.json

```json
"writeBetterPrompt.presets": [
  { "label": "调整样式", "value": "帮我调整样式：" },
  { "label": "排查问题", "value": "帮我排查问题：" },
  { "label": "Write tests", "value": "Please write unit tests for:" }
]
```

---

## Commands

All commands are accessible via the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`):

| Command | Description |
| --- | --- |
| `write-ai-prompt-better: Open Panel` | Open / focus the sidebar panel |
| `write-ai-prompt-better: Open Editor` | Open a standalone prompt editor tab (same as clicking ↗ 新窗口编辑) |
| `write-ai-prompt-better: Clear All` | Clear all context items and the requirements text across all open editors |

Context-menu commands (triggered by right-clicking, not shown in Command Palette):

| Command | Trigger |
| --- | --- |
| `writeBetterPrompt.addFileContent` | Editor right-click (requires a text selection) |
| `writeBetterPrompt.addFileToContext` | Editor tab title right-click |
| `writeBetterPrompt.addTerminalContent` | Terminal right-click |
| `writeBetterPrompt.addPathToContext` | Explorer right-click (file or folder) |

---

## Development

```bash
# From the repository root
pnpm install
pnpm --filter write-ai-prompt-better run build
# Press F5 in VSCode (open apps/vscode-extension/) to open the Extension Development Host
```

Watch mode during development:

```bash
pnpm --filter write-ai-prompt-better run watch
```

Or run the scripts directly from `apps/vscode-extension/`: `pnpm run build` / `pnpm run watch`.

### Project structure

```
apps/vscode-extension/
├── package.json                        # Extension manifest (commands, menus, views, config)
├── tsconfig.json                       # CommonJS build config for the extension host
├── .vscodeignore                       # Files excluded from the packaged .vsix
├── design.md                           # Technical design document (Chinese)
├── architecture.md                     # Architecture diagrams
├── README.md                           # This file
├── media/
│   └── icon.svg                        # ActivityBar icon (pencil)
├── src/
│   ├── extension.ts                    # Activation entry, registers all commands
│   ├── types.ts                        # Shared type definitions
│   └── WriteBetterPromptProvider.ts    # WebviewView/Panel provider + full UI HTML
└── out/                                # Compiled output (TypeScript → JavaScript)
```

---

## Build & Publish

```bash
# Install vsce
npm install -g @vscode/vsce

# Package as .vsix
vsce package

# Install locally
code --install-extension write-ai-prompt-better-0.1.0.vsix

# Publish to VS Marketplace (requires Personal Access Token)
vsce publish
```

---

## License

MIT
