# write-ai-prompt-better — 架构设计图

## 整体架构

```mermaid
graph TB
    subgraph VSCode["VS Code 宿主环境"]
        subgraph ExtHost["Extension Host 进程"]
            EXT["extension.ts<br/>激活入口 & 命令注册"]
            PROVIDER["WriteBetterPromptProvider<br/>WebviewViewProvider + Disposable"]
            TYPES["types.ts<br/>共享类型定义"]
            I18N["i18n.ts<br/>国际化（EN / zh-CN）"]

            EXT -->|"实例化 + 注册"| PROVIDER
            TYPES -.->|"类型约束"| EXT
            TYPES -.->|"类型约束"| PROVIDER
            I18N -.->|"t() / getLang()"| EXT
            I18N -.->|"t() / getWebviewMessages()"| PROVIDER
        end

        subgraph WebviewProc["Webview 渲染进程（隔离沙箱）"]
            HTML["HTML 结构"]
            CSS["内联 CSS 样式"]
            JS["内联 Vanilla JS<br/>（IIFE）"]
            DOM["DOM 状态<br/>contextItems[] / presets[] / history[]"]

            HTML --> CSS
            HTML --> JS
            JS -->|"读写"| DOM
        end

        subgraph VSCodeAPI["VS Code Extension API"]
            CLIPBOARD["vscode.env.clipboard"]
            FS["vscode.workspace.fs"]
            GLOBALSTATE["context.globalState<br/>持久化存储"]
            CONFIG["vscode.workspace<br/>.getConfiguration"]
            COMMANDS["vscode.commands"]
            EDITOR["vscode.window<br/>.activeTextEditor"]
        end

        subgraph UI["VS Code 原生 UI"]
            ACTIVITYBAR["ActivityBar 图标<br/>write-ai-prompt-better"]
            SIDEBAR["侧边栏面板<br/>writeBetterPrompt.panel"]
            CTXMENU["右键菜单<br/>editor / terminal / explorer"]
        end
    end

    PROVIDER <-->|"postMessage 双向通信"| JS
    PROVIDER -->|"读写"| GLOBALSTATE
    PROVIDER -->|"读取"| CONFIG
    EXT -->|"读取"| CLIPBOARD
    EXT -->|"写入"| CLIPBOARD
    EXT -->|"读取"| FS
    EXT -->|"调用"| COMMANDS
    EXT -->|"读取"| EDITOR
    CTXMENU -->|"触发命令"| EXT
    ACTIVITYBAR -->|"显示"| SIDEBAR
    SIDEBAR -->|"渲染"| WebviewProc
    PROVIDER -->|"resolveWebviewView"| SIDEBAR
```

---

## 模块职责

```mermaid
graph LR
    subgraph "extension.ts — 命令层"
        C1["addFileContent<br/>读取编辑器选中内容"]
        C2["addTerminalContent<br/>读取终端选中内容"]
        C3["addFileToContext<br/>读取完整文件内容"]
        C4["addPathToContext<br/>添加文件/目录路径引用"]
        C5["openPanel<br/>打开侧边栏"]
        C6["openEditor<br/>打开独立编辑窗口"]
        C7["clearAll<br/>清空所有内容"]
    end

    subgraph "WriteBetterPromptProvider — 核心层"
        P1["resolveWebviewView()<br/>初始化 Webview"]
        P2["addContextItem()<br/>接收并分发上下文条目"]
        P3["clearAll()<br/>通知所有视图清空"]
        P4["_broadcast()<br/>消息广播到所有视图"]
        P5["loadState()<br/>从 globalState 加载持久化状态"]
        P6["_scanSkills()<br/>扫描全局+项目 skill 文件"]
        P7["_getHtml()<br/>生成完整 HTML（含 i18n 注入）"]
        P8["openEditorPanel()<br/>创建独立编辑器面板"]
    end

    subgraph "Webview JS — 视图层"
        W1["状态管理<br/>contextItems / presets / history / skills"]
        W2["renderContextList()<br/>渲染上下文卡片"]
        W3["renderPresets()<br/>渲染预设管理面板"]
        W4["generateBtn 点击<br/>组装并生成 Prompt"]
        W5["restoreFromHistory()<br/>从历史恢复"]
        W6["消息监听<br/>window.addEventListener('message')"]
    end

    subgraph "i18n.ts — 国际化"
        I1["t(key, ...args)<br/>带参数翻译"]
        I2["getWebviewMessages()<br/>注入 Webview JS 的 MSG 对象"]
        I3["getDefaultPresets()<br/>按当前语言生成默认预设"]
        I4["setLang() / getLang()<br/>语言偏好持久化"]
    end

    C1 & C2 & C3 & C4 --> P2
    C5 --> |"executeCommand"| P1
    C6 --> P8
    C7 --> P3
    P2 --> P4
    P7 --> |"HTML 字符串"| P1
    P4 --> W6
    W6 --> W1
    W1 --> W2 & W3
    W4 --> |"postMessage"| P5
    W5 --> W1
    I2 -->|"MSG 对象"| JS
    I3 -->|"预设种子数据"| P5
```

---

## 文件结构

```
apps/vscode-extension/
├── src/
│   ├── extension.ts                   # 激活入口，注册 Provider 和 7 个命令
│   ├── WriteBetterPromptProvider.ts   # 核心 Provider，含完整嵌入式 UI (~1150 行)
│   ├── types.ts                       # 共享 TS 类型 (ContextItem / SkillItem / HistoryItem / 消息协议)
│   └── i18n.ts                        # EN / zh-CN 国际化模块
├── media/
│   └── icon.svg                       # ActivityBar 图标（铅笔）
├── scripts/
│   └── build-and-install.sh           # 一键构建 + 打包 + 安装脚本
├── package.json                       # 扩展清单，贡献点配置
├── package.nls.json                   # 清单 i18n 默认语言（EN）
├── package.nls.zh-cn.json             # 清单 i18n 中文翻译
├── tsconfig.json                      # tsc 编译配置（CommonJS）
├── .vscodeignore                      # 打包排除文件
├── LICENSE                            # MIT 许可证
└── out/                               # 编译产物（.js）
```

---

## 技术栈

| 层次 | 技术 |
|------|------|
| 语言 | TypeScript（strict 模式）|
| 运行时 | VS Code Extension Host (Node.js) |
| UI | 原生 HTML + CSS + Vanilla JS（内联嵌入）|
| 构建 | `tsc` 直接编译，无打包器 |
| 存储 | `vscode.ExtensionContext.globalState`（键值对）|
| 安全 | CSP nonce 保护 Webview 脚本 |
| 通信 | `postMessage` 双向消息协议 |
| i18n | 自定义模块，支持 EN / zh-CN，语言偏好持久化 |

---

## 核心类型关系

```mermaid
classDiagram
    class ContextItem {
        +string id
        +string type
        +string content
        +string filePath
        +string lineRange
        +number timestamp
    }

    class SkillItem {
        +string name
        +string description
        +string path
        +string agent
        +string content
    }

    class HistoryItem {
        +string id
        +string prompt
        +string preview
        +number timestamp
        +ContextItem[] contextItems
    }

    class PresetPrompt {
        +string label
        +string value
    }

    class WebviewMessage {
        <<union>>
        ready
        copyToClipboard
        saveHistory
        deleteHistoryItem
        clearHistory
        savePresets
        saveValidationPresets
        getSkills
        openSkillFile
        removeContextItem
        addManualItem
        setContextItems
        clearContextItems
        openEditorPanel
        openEditorPanelBeside
        changeLanguage
    }

    class ExtensionMessage {
        <<union>>
        syncContextItems
        historyData
        presetsData
        validationPresetsData
        skillsData
        clearAll
    }

    HistoryItem "1" *-- "n" ContextItem : snapshot
    WebviewMessage ..> HistoryItem : saveHistory payload
    WebviewMessage ..> PresetPrompt : savePresets / saveValidationPresets payload
    ExtensionMessage ..> ContextItem : syncContextItems payload
    ExtensionMessage ..> HistoryItem : historyData payload
    ExtensionMessage ..> PresetPrompt : presetsData / validationPresetsData payload
    ExtensionMessage ..> SkillItem : skillsData payload
```

---

## 上下文类型枚举

| type 值 | 来源命令 | 内容 |
|---------|---------|------|
| `file` | `addFileContent` | 编辑器选中代码块（含文件路径和行号）|
| `file`（全文） | `addFileToContext` | 完整文件内容（标签页右键）|
| `terminal` | `addTerminalContent` | 终端选中文本（含完整内容）|
| `fileRef` | `addPathToContext`（文件）| 仅文件路径引用，不含内容 |
| `folder` | `addPathToContext`（目录）| 目录路径引用，不含内容 |
| `manual` | Webview 内手动输入 | 用户手动填写的自由文本 |

---

## 持久化存储键

| globalState Key | 类型 | 说明 |
|-----------------|------|------|
| `wbp.history` | `HistoryItem[]` | 提示词历史，无上限 |
| `wbp.presets` | `PresetPrompt[]` | 需求预设列表 |
| `wbp.validationPresets` | `PresetPrompt[]` | 验证方法预设列表 |
| `wbp.lang` | `'en' \| 'zh-cn'` | 用户语言偏好 |

---

## VSCode 配置项

| 配置键 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `writeBetterPrompt.presets` | `array` | `[]` | 初始需求预设（种子数据；UI 管理的预设优先级更高，保存在 globalState） |

> 通过 ⚙ 面板管理的预设保存在 `globalState`（key: `wbp.presets` / `wbp.validationPresets`），优先级高于 `settings.json`。`settings.json` 仅作为首次安装时的种子数据。内置默认预设由 `i18n.ts` 的 `getDefaultPresets()` 按当前语言生成。
