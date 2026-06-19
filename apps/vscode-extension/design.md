# write-ai-prompt-better — VSCode Extension

## 需求背景

在 VSCode 中使用 Claude Code / Copilot 等 AI 编码助手时，编写高质量 prompt 的体验很差：用户需要手动复制文件路径、行号、代码片段，再拼接成完整的 prompt。本插件通过侧边栏编辑区 + 独立编辑窗口 + 右键菜单集成，大幅提升 prompt 编写效率。

---

## 功能需求

### 1. 侧边栏面板

- ActivityBar 显示插件图标（铅笔图标），点击后打开侧边栏面板（WebviewView）
- 面板关闭/隐藏时，通过 `retainContextWhenHidden: true` 保持 Webview 状态
- 面板分为六个主要区域，从上到下：**顶部工具栏**、**背景描述**、**Skill 选择**、**需求描述**、**验证方法**、**历史记录**
- **顶部工具栏**：`[清空]` 按钮（左侧，红色警示风格）+ `[↗ 新窗口编辑]` 按钮（右侧），使用 `justify-content: space-between` 布局
- **语言切换**：工具栏显示语言切换按钮（中文环境显示「EN」，英文环境显示「中文」），点击切换 UI 语言并持久化偏好

### 2. 独立编辑窗口（WebviewPanel）

- 点击「↗ 新窗口编辑」按钮，或执行 `writeBetterPrompt.openEditor` 命令，在 `ViewColumn.Beside` 创建独立的 `WebviewPanel`
- 面板 Header 显示：`✍ write-ai-prompt-better [编辑器]`（左侧标题 + badge），右侧操作区为 `[清空] | [→ 向右分屏]`
- 点击「→ 向右分屏」按钮，再次以 `ViewColumn.Beside` 打开新的编辑窗口
- 支持同时打开多个编辑窗口，所有窗口通过 extension 中的 `_broadcast()` 实时同步背景描述条目和历史记录

> **注意**：VS Code 原生的「Split Right」对 WebviewPanel 不适用（分屏后一侧会空白），应使用面板内置的「→ 向右分屏」按钮。

### 3. 多窗口数据同步

- **背景描述条目**（`_contextItems`）统一存储于 Extension 进程内存，不再由各 Webview 独立维护
- 任一视图（侧边栏或编辑窗口）对背景描述的增删操作，均通过 `_broadcast({ type: 'syncContextItems', items })` 同步到所有视图
- **历史记录**变更（新增、删除、清空）同样广播到所有视图
- **预设**（需求预设、验证预设）变更同样广播到所有视图
- **各窗口独立状态**：需求描述文本、验证方法文本、选中的 Skills 均为各窗口私有，不跨窗口同步

### 4. 编辑器右键菜单 — 选中代码

- 菜单项注册在 `navigation` group，显示在右键菜单最顶部
- 条件：`editorHasSelection`（有选中内容时才显示菜单项）
- 点击后：
  - 读取选中内容、文件路径、行号范围
  - 将格式化后的代码片段写入剪贴板（便于直接粘贴）
  - 将条目（type: `file`）通过 `provider.addContextItem()` 添加，广播到所有已打开的视图
  - **不再自动聚焦/切换到侧边栏面板**（用户的编辑器焦点不受干扰）

### 5. 编辑器标签页右键菜单 — 整个文件

- 注册在 `editor/title/context` 菜单（`navigation` group 置顶）
- 点击后：
  - 读取文件完整内容（通过 `workspace.fs.readFile`）
  - 将整个文件内容作为条目（type: `file`）添加，**不自动聚焦侧边栏**

### 6. 终端右键菜单

- 注册在 `terminal/context` 菜单（`navigation` group 置顶）
- 点击后：
  - 执行 `workbench.action.terminal.copySelection` 将终端选中内容写入剪贴板
  - 等待 150ms 后读取剪贴板
  - 将内容作为条目（type: `terminal`）添加，**不自动聚焦侧边栏**

### 7. 资源管理器右键菜单

- 注册在 `explorer/context` 菜单（`navigation` group 置顶）
- 通过 `workspace.fs.stat` 判断是文件还是文件夹：
  - **文件夹**：添加路径引用条目（type: `folder`），不含内容
  - **文件**：添加路径引用条目（type: `fileRef`），不含内容
- **不自动聚焦侧边栏**

### 8. 背景描述区域

- 以卡片形式展示已添加的上下文条目
- 每张卡片显示：来源图标、文件路径/行号（文件类型）或 "Terminal output"（终端）或 "Manual note"（手动）
- 支持展开/折叠单个卡片内容（默认折叠，最大高度 90px）
- 支持删除单个卡片：点击后发送 `removeContextItem` 消息到 extension，extension 更新 `_contextItems` 并广播
- **空状态**：显示操作提示文字
- **手动添加**（＋ 手动添加按钮）：展开内联输入框，输入任意文字后按 Enter 或点击「添加」，发送 `addManualItem` 消息；extension 创建条目并广播

### 9. 需求描述区域

- **预设下拉框**：从预设列表中选择，所选预设值被追加到自定义输入框（如已有内容则换行追加）；选择后下拉框重置为占位符状态
- **⚙ 预设管理面板**（点击齿轮按钮展开）：
  - 列出所有预设，每项可内联编辑（✏）或删除（×）
  - 可添加新预设（＋ 添加预设）
  - 修改立即持久化到 `globalState`（key: `wbp.presets`）
- **自定义输入框**（textarea，6行高，可拖拽调整高度）：可输入/编辑自由文字补充需求

### 10. 验证方法区域

- 与需求描述区域结构相同，独立的预设下拉 + ⚙ 管理面板 + textarea（3行高）
- 预设持久化到 `globalState`（key: `wbp.validationPresets`），默认预设：`{ label: '项目构建通过', value: '项目构建通过' }`（中文）/ `{ label: 'Project builds successfully', value: 'Project builds successfully' }`（英文）
- 描述如何验证修改是否正确（构建通过、测试通过等）

### 11. 生成 Prompt

- **「👁 预览」** 按钮（底部操作栏）：
  - 生成 prompt 并在按钮下方展开内联预览区（`<pre>` 元素）
  - 再次点击关闭预览
  - 预览区打开后，编辑任何输入（需求、验证、上下文增减、Skill 增减）时实时更新内容
  - 所有内容清空时自动关闭预览区
- **「📋 复制」** 按钮（底部操作栏）：
  - 生成 prompt，通过 `postMessage` 发送给 Extension，由 Extension 写入剪贴板
  - 保存到历史记录（广播到所有视图）
  - 显示 Toast 提示「✓ Prompt 已复制到剪贴板」
- **「清空」** 按钮（顶部工具栏）：
  - 各视图清空自己的背景描述条目（本地即时更新）+ 发送 `clearContextItems` 消息
  - Extension 清空 `_contextItems` 并广播 `syncContextItems` 到其他视图
  - 同时清空当前窗口的需求描述、验证描述文本框、已选 Skills，关闭预览区

生成格式（各节均为 `##` 标题，节内容为空则整节省略，节间无分隔线）：

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

📝 手动备注内容

## 需求描述

帮我排查问题：具体描述...

## 验证方法

项目构建通过
````

各上下文类型的生成格式：

| type | 来源 | 生成格式 |
| --- | --- | --- |
| `file` | 编辑器选中 / 标签页整文件 | `📄 path` 或 `📄 path#Lstart-end` |
| `folder` | 资源管理器文件夹右键 | `📁 path` |
| `fileRef` | 资源管理器文件右键 | `📄 path` |
| `terminal` | 终端选中内容 | `💻 Terminal output:` + 代码块 |
| `manual` | 手动输入 | `📝 content` |

> 文件类条目在侧边栏卡片中展示完整内容（便于预览），但生成 Prompt 时仅输出路径引用，由 AI 工具自行读取文件。

> Prompt 各节的标题会根据当前 UI 语言自动切换：中文生成 `## 背景描述` / `## 需求描述` / `## 验证方法`，英文生成 `## Background` / `## Requirements` / `## Validation`。

### 12. Skill 选择区域

位于**背景描述**与**需求描述**之间，标题为「📌 按需选择需要的 Skill」（中文）/「📌 Select Skills」（英文）。

**面板打开时自动扫描以下路径**（静默忽略不存在的路径）：

| 分组标签 | 扫描路径 / 来源 |
| --- | --- |
| Claude Code · 全局 | `~/.claude/skills/<name>/SKILL.md`（子目录结构） |
| Claude Code · 全局 | `~/.claude/CLAUDE.md` |
| Cursor · 全局 | `~/.cursor/rules/*.mdc` |
| Cursor · 全局 | `~/.cursorrules` |
| Copilot · 全局 | VS Code 用户设置 `github.copilot.chat.codeGeneration.instructions` |
| Claude Code · 项目 | `<workspaceRoot>/.claude/skills/<name>/SKILL.md` |
| Cursor · 项目 | `<workspaceRoot>/.cursor/rules/*.mdc` |
| Cursor · 项目 | `<workspaceRoot>/.cursorrules` |
| Cline · 项目 | `<workspaceRoot>/.clinerules` |
| Windsurf · 项目 | `<workspaceRoot>/.windsurfrules` |
| Copilot · 项目 | `<workspaceRoot>/.github/copilot-instructions.md` |

Skill 文件通过 frontmatter 提取 `name` 和 `description`，格式：
```
---
name: my-skill
description: ...
---
```
若无 frontmatter，则以文件名（或目录名）作为 name。

**下拉交互（自定义下拉，非原生 `<select>`）：**
- 点击「添加 Skill… ▾」触发按钮，展开自定义下拉面板（绝对定位，最大高度 360px 可滚动）
- 面板顶部固定搜索框（`position: sticky`），支持模糊搜索 skill 名称（字符顺序匹配）
- 选项按 agent 分组显示，每项显示 skill 名称 + description 副标题
- 每项右侧有 📂 按钮（hover 时显示），点击在编辑器中打开 skill 文件
- 点击选项（非 📂 区域）：添加为 Chip，同名 skill 重复选择时弹出 Toast
- 点击下拉区域外或按 `Escape` 关闭，同时清空搜索词、重置列表

**Chip 展示（selected skills）：**
- 显示：agent 标签 + skill 名称
- 有文件路径时显示 📂 按钮 → 在编辑器中打开该文件
- × 按钮移除该 Chip

### 13. 历史记录

- 区域默认折叠，点击标题区可展开/折叠（含 chevron 动画）
- Badge 显示当前历史条数（无上限）
- 每条记录显示：Prompt 预览（前 100 字符）、相对时间（刚刚 / N分钟前 / N小时前 / N天前）
- **Hover 预览（👁 popup）**：鼠标移入 👁 按钮时展示浮层，显示完整 prompt 内容；浮层内含「📋 复制」按钮
- **使用**：点击「使用」按钮恢复对应的背景描述和需求描述到当前窗口（其他窗口的背景描述也同步更新），历史列表自动折叠
- **删除**：Hover 时显示 × 按钮，点击删除单条历史；删除事件广播到所有视图
- 历史**无上限**，持久化于 `globalState`（key: `wbp.history`）

### 14. 国际化（i18n）

- 支持 **English**（默认）和 **简体中文** 两种 UI 语言
- 语言切换按钮位于顶部工具栏，显示目标语言（中文环境显示「EN」，英文环境显示「中文」）
- 切换语言时：Extension 侧更新 `getLang()` 返回值，触发所有 Webview 重新生成 HTML（`webview.html = ...`），各视图通过 `ready` 消息恢复同步状态
- 切换语言后，各窗口的文本框内容（需求描述、验证描述）保留，但已选 Skills 丢失
- 语言偏好持久化到 `globalState`（key: `wbp.lang`）
- 所有 UI 文本、默认预设、Prompt 生成标题均跟随当前语言

---

## 配置项（VSCode Settings）

| 配置键 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `writeBetterPrompt.presets` | `array` | `[]` | 初始需求预设列表（种子数据；只有在无 UI 管理的预设时使用） |

`presets` 配置格式：

```json
[
  { "label": "调整样式", "value": "帮我调整样式：" },
  { "label": "排查问题", "value": "帮我排查问题：" }
]
```

**预设优先级：** 通过 ⚙ 面板管理的预设保存在 `globalState`（key: `wbp.presets` / `wbp.validationPresets`），优先级高于 `settings.json`。内置默认预设由 `i18n.ts` 的 `getDefaultPresets()` 按当前语言生成（6 个需求预设 + 1 个验证预设）。三层优先级：globalState 管理预设 > settings.json > 内置默认值。

---

## UI 交互设计

### 侧边栏布局

```
┌─────────────────────────────────┐
│ [清空]         [中文] [↗ 新窗口编辑]│  ← 顶部工具栏（含语言切换）
├─────────────────────────────────┤
│ 📄 背景描述                      │
│ ┌─────────────────────────────┐ │
│ │ 📄 src/app.tsx#L12-20  ▼ × │ │
│ │ const App = () => {         │ │
│ └─────────────────────────────┘ │
│ [+ 手动添加]                    │
├─────────────────────────────────┤
│ 📌 按需选择需要的 Skill           │
│ [添加 Skill… ▾]                 │
│ ┌──────────────────────────┐    │
│ │[Claude Code·全局]my-skill📂×│ │
│ └──────────────────────────┘    │
├─────────────────────────────────┤
│ 💬 需求描述                      │
│ [选择预设… ▼]               [⚙] │
│ ┌─────────────────────────────┐ │
│ │ 具体描述你的需求（可选）…     │ │
│ │ （6行高，可拖拽）             │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ ✅ 验证方法                      │
│ [选择预设… ▼]               [⚙] │
│ ┌─────────────────────────────┐ │
│ │ 描述如何验证修改是否正确…     │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│              [👁 预览] [📋 复制] │  ← 底部操作栏
│ ┌─────────────────────────────┐ │
│ │ 👁 Prompt 预览          [×] │ │
│ │ ## 背景描述                 │ │
│ │ ...                         │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ ⏱ 历史记录 [3]             ›   │
│ (折叠，点击展开)                 │
└─────────────────────────────────┘
```

### 编辑器面板（WebviewPanel）布局

```
┌─────────────────────────────────────────────────┐
│ ✍ write-ai-prompt-better [编辑器]  [清空] │ [→ 向右分屏] │  ← 面板 Header
├─────────────────────────────────────────────────┤
│ 📄 背景描述                                      │
│ ...（内容与侧边栏相同，但更宽更舒适）              │
└─────────────────────────────────────────────────┘
```

---

## 技术方案

### 技术栈

- **语言**：TypeScript
- **平台**：VSCode Extension API (^1.85.0)
- **WebView UI**：原生 HTML + CSS + Vanilla JS（内嵌于 Provider，无额外构建步骤）
- **样式**：VSCode CSS Variables（自动适配亮色/暗色主题）
- **状态持久化**：`ExtensionContext.globalState`（历史记录、需求预设、验证预设、语言偏好）
- **安全**：Webview 使用 CSP + nonce，禁止外部资源加载
- **国际化**：自定义 i18n 模块（`src/i18n.ts`），支持 EN / zh-CN

### 目录结构

```
apps/vscode-extension/
├── package.json                        # 插件 manifest
├── package.nls.json                    # 清单 i18n（默认 EN）
├── package.nls.zh-cn.json              # 清单 i18n（中文）
├── tsconfig.json                       # TypeScript 配置（CommonJS）
├── .vscodeignore                       # 打包排除文件
├── design.md                           # 本文档
├── architecture.md                     # 架构设计图
├── README.md                           # 用户文档
├── LICENSE                             # MIT 许可证
├── media/
│   └── icon.svg                        # ActivityBar 图标（铅笔 SVG）
├── scripts/
│   └── build-and-install.sh            # 一键构建 + 打包 + 安装
├── src/
│   ├── extension.ts                    # 激活入口，注册所有命令
│   ├── types.ts                        # 共享类型定义
│   ├── i18n.ts                         # 国际化模块
│   └── WriteBetterPromptProvider.ts    # WebviewView/Panel Provider + 完整 UI HTML (~1150 行)
└── out/                                # 编译产物（TypeScript → JavaScript）
```

### 核心架构

`WriteBetterPromptProvider` 同时实现 `vscode.WebviewViewProvider`（侧边栏视图）和 `vscode.Disposable`，并管理多个 `WebviewPanel`（独立编辑窗口）。

```
┌─────────────────────────────────────┐
│      WriteBetterPromptProvider       │
│                                     │
│  _contextItems: ContextItem[]  ←─── Extension 统一管理背景描述
│  _history: HistoryItem[]       ←─── 持久化于 globalState
│  _presets: PresetPrompt[]      ←─── 需求预设（globalState）
│  _validationPresets: PresetPrompt[] ←─── 验证预设（globalState）
│  _skills: SkillItem[]          ←─── 懒加载扫描
│  _view?: WebviewView           ←─── 侧边栏视图
│  _editorPanels: WebviewPanel[] ←─── 所有独立编辑窗口
│                                     │
│  loadState()                   ──→  从 globalState 恢复持久化状态
│  _broadcast(msg)               ──→  发送给 _view + 所有 _editorPanels
│  _handleMessage(msg, post)          共享消息处理器
│  _initWebview(post)                 新视图初始化（发送完整状态）
│  openEditorPanel(column?)           创建新 WebviewPanel
│  clearAll()                         清空上下文 + 各窗口私有状态
│  _scanSkills()                      扫描全局+项目 skill 文件
└─────────────────────────────────────┘
```

### 关键实现

1. **集中式背景描述管理**：`_contextItems` 存储于 Extension 进程，而非各 Webview。添加/删除/清空操作均经过 Extension 处理后广播，确保多窗口一致性
2. **共享消息处理器**：`_handleMessage(message, post)` 方法由侧边栏视图和所有编辑面板共用，逻辑不重复
3. **`_broadcast(message)`**：同时向 `this._view?.webview` 和 `this._editorPanels` 中每个 panel 的 webview 发送消息
4. **Webview 初始化**：新视图发送 `ready` 消息后，`_initWebview(post)` 向该视图发送完整的 `presetsData`、`validationPresetsData`、`historyData`、`syncContextItems`，然后 `_scanSkills()` 结果通过 `skillsData` 返回给请求视图
5. **视图切分**：`openEditorPanel(column = ViewColumn.Beside)` 默认使用 `Beside`，侧边栏按钮和面板内「向右分屏」按钮均调用此方法
6. **历史记录无上限**：`saveHistory` 直接 `unshift` 新条目后保存，不再截断
7. **终端内容读取**：调用 `workbench.action.terminal.copySelection` 后等待 150ms，再从剪贴板读取内容（VSCode API 限制，无法直接读取终端选区）
8. **预设持久化优先级**：globalState 管理预设 > settings.json 种子数据 > 内置默认值（由 i18n 模块按当前语言生成）；UI 操作后立即写入 globalState
9. **Skill 扫描**：`_scanSkills()` 使用三种策略：
   - `scanSkillDirs(dir)`：读取目录子项，尝试读取 `<entry>/SKILL.md`，适用于 Claude Code skills 的子目录结构
   - `scanDir(dir, ext)`：读取目录内指定扩展名的文件（平铺），适用于 Cursor `.mdc` 规则
   - `readSingle(file)`：读取单个固定路径文件
   - 所有扫描失败均静默忽略
10. **Skill 自定义下拉**：原生 `<select>` 替换为自定义按钮 + 绝对定位列表；顶部搜索框 `position: sticky`，模糊匹配算法按字符顺序依次命中
11. **实时预览**：`buildPrompt()` 提取为纯函数，供预览和复制共用；预览区通过监听 `input` 事件及 `renderContextList` / `renderSelectedSkills` 调用点触发 `refreshPreview()` 实现实时更新
12. **国际化实现**：`i18n.ts` 导出 `t(key, ...args)` 用于 Extension 侧，`getWebviewMessages()` 将完整翻译映射注入 Webview JS 作为 `MSG` 对象；语言切换时重新生成 Webview HTML 并通过 `webview.html = ...` 更新
13. **Provider 实现 Disposable**：Provider 类实现 `vscode.Disposable`，在 `dispose()` 中清理所有 `_editorPanels`

### 注册命令一览

| 命令 ID | 菜单位置 | 触发条件 | 功能 |
| --- | --- | --- | --- |
| `writeBetterPrompt.addFileContent` | `editor/context` (`navigation` group) | `editorHasSelection` | 添加编辑器选中代码 |
| `writeBetterPrompt.addFileToContext` | `editor/title/context` (`navigation` group) | 无 | 添加整个文件内容 |
| `writeBetterPrompt.addTerminalContent` | `terminal/context` (`navigation` group) | 无 | 添加终端选中输出 |
| `writeBetterPrompt.addPathToContext` | `explorer/context` (`navigation` group) | 无 | 添加文件/文件夹路径引用 |
| `writeBetterPrompt.openPanel` | 命令面板 | 无 | 打开/聚焦侧边栏面板 |
| `writeBetterPrompt.openEditor` | 命令面板 | 无 | 在 ViewColumn.Beside 打开独立编辑窗口 |
| `writeBetterPrompt.clearAll` | 命令面板 | 无 | 清空所有背景描述条目和输入内容 |

### Webview ↔ Extension 消息协议

**Webview → Extension：**

| 消息类型 | 携带数据 | 说明 |
| --- | --- | --- |
| `ready` | — | 页面初始化完成，请求初始数据 |
| `copyToClipboard` | `text: string` | 请求将生成的 prompt 写入剪贴板 |
| `saveHistory` | `item: HistoryItem` | 保存新历史记录 |
| `deleteHistoryItem` | `id: string` | 删除指定历史条目 |
| `clearHistory` | — | 清空全部历史 |
| `savePresets` | `presets: PresetPrompt[]` | 持久化需求预设列表 |
| `saveValidationPresets` | `presets: PresetPrompt[]` | 持久化验证预设列表 |
| `getSkills` | — | 请求扫描并返回 skill 列表 |
| `openSkillFile` | `path?: string` | 在编辑器中打开指定 skill 文件 |
| `removeContextItem` | `id: string` | 删除指定背景描述条目 |
| `addManualItem` | `content: string` | 添加手动输入的背景描述条目 |
| `setContextItems` | `items: ContextItem[]` | 替换全部背景描述条目（历史恢复用） |
| `clearContextItems` | — | 清空全部背景描述条目 |
| `openEditorPanel` | — | 在 ViewColumn.Beside 打开新编辑窗口 |
| `openEditorPanelBeside` | — | 在 ViewColumn.Beside 打开新编辑窗口（向右分屏） |
| `changeLanguage` | `lang: 'en' \| 'zh-cn'` | 切换 UI 语言 |

**Extension → Webview（广播到所有视图）：**

| 消息类型 | 携带数据 | 说明 |
| --- | --- | --- |
| `syncContextItems` | `items: ContextItem[]` | 同步完整背景描述条目列表 |
| `historyData` | `history: HistoryItem[]` | 下发完整历史列表 |
| `presetsData` | `presets: PresetPrompt[]` | 下发需求预设列表 |
| `validationPresetsData` | `presets: PresetPrompt[]` | 下发验证预设列表 |
| `skillsData` | `skills: SkillItem[]` | 下发 skill 列表（仅发送给请求方视图） |
| `clearAll` | — | 清空所有内容（背景描述 + 文本框 + 已选 Skills） |

### 核心类型定义（types.ts）

```typescript
interface ContextItem {
  id: string;
  type: 'file' | 'terminal' | 'manual' | 'folder' | 'fileRef';
  content: string;
  filePath?: string;
  lineRange?: string;   // e.g. "L12" or "L12-20"
  timestamp: number;
}

interface SkillItem {
  name: string;         // from frontmatter `name:`, fallback to filename/dirname
  description: string;  // from frontmatter `description:`
  path: string;         // absolute file path; '' for Copilot inline text instructions
  agent: string;        // e.g. 'Claude Code · 全局', 'Cursor · 项目'
  content: string;      // raw file content including frontmatter
}

interface HistoryItem {
  id: string;
  prompt: string;
  preview: string;      // first ~100 chars, stripped of markdown headers
  timestamp: number;
  contextItems: ContextItem[];
}

interface PresetPrompt {
  label: string;
  value: string;
}
```

### i18n 模块接口（i18n.ts）

```typescript
interface I18nMessages {
  // Extension host error messages
  // Webview: toolbar, sections, context/manual, skill picker, presets,
  //   requirements/validation, actions, history, prompt output, toast, time, default presets, skill agent labels
  // ... (130+ keys, each with EN and zh-CN translation)
}

function t(key: keyof I18nMessages, ...args: string[]): string;   // Extension side
function getWebviewMessages(): I18nMessages;                       // Inject into webview JS as MSG
function getDefaultPresets(): PresetPrompt[];                      // Language-aware default presets
function getDefaultValidationPresets(): PresetPrompt[];            // Language-aware default validation preset
function getSkillAgentLabels(): Record<string, string>;            // Language-aware skill agent labels
function getLang(): 'en' | 'zh-cn';                                // Current language
function setLang(lang: 'en' | 'zh-cn', persist?: (lang) => void);  // Switch language + persist
```

---

## 开发与发布

### 开发环境

项目位于 pnpm monorepo 的 `apps/vscode-extension/` 目录下。

```bash
# 从 monorepo 根目录
pnpm install                        # 安装所有工作区依赖
pnpm --filter write-ai-prompt-better run build   # 编译 TypeScript

# 或在 apps/vscode-extension/ 目录下
pnpm run build                      # tsc -p ./
# 按 F5 在 VSCode 中启动 Extension Development Host 调试
```

Watch 模式：

```bash
pnpm --filter write-ai-prompt-better run watch   # tsc -watch -p ./
```

### 打包发布

```bash
# 从 apps/vscode-extension/ 目录
pnpm run install                    # 执行 scripts/build-and-install.sh（构建 + 打包 + 本地安装）

# 或手动
npm install -g @vscode/vsce
vsce package                        # 生成 write-ai-prompt-better-x.x.x.vsix
vsce publish                        # 发布到 VSCode Marketplace（需要 Personal Access Token）
```

### 本地安装 .vsix

```bash
code --install-extension write-ai-prompt-better-0.1.0.vsix
```

### package.json i18n

`package.json` 中的用户可见字符串（命令标题、配置描述等）通过 VSCode 的 `%key%` 占位符 + `package.nls.json` 实现国际化：
- `package.nls.json` — 默认英文
- `package.nls.zh-cn.json` — 中文翻译（VS Code 语言为 zh-cn 时自动生效）
