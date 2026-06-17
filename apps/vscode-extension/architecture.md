# write-ai-prompt-better — 架构设计图

## 整体架构

```mermaid
graph TB
    subgraph VSCode["VS Code 宿主环境"]
        subgraph ExtHost["Extension Host 进程"]
            EXT["extension.ts<br/>激活入口 & 命令注册"]
            PROVIDER["WriteBetterPromptProvider<br/>WebviewViewProvider"]
            TYPES["types.ts<br/>共享类型定义"]

            EXT -->|"实例化 + 注册"| PROVIDER
            TYPES -.->|"类型约束"| EXT
            TYPES -.->|"类型约束"| PROVIDER
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
        C6["clearAll<br/>清空上下文"]
    end

    subgraph "WriteBetterPromptProvider — 核心层"
        P1["resolveWebviewView()<br/>初始化 Webview"]
        P2["addContextItem()<br/>接收并分发上下文条目"]
        P3["clearAll()<br/>通知 Webview 清空"]
        P4["_post()<br/>消息发送封装"]
        P5["_pendingItems[]<br/>离屏消息队列"]
        P6["_history[]<br/>提示词历史"]
        P7["_getHtml()<br/>生成完整 HTML"]
    end

    subgraph "Webview JS — 视图层"
        W1["状态管理<br/>contextItems / presets / history"]
        W2["renderContextList()<br/>渲染上下文卡片"]
        W3["renderPresets()<br/>渲染快捷短语"]
        W4["generateBtn 点击<br/>组装并生成 Prompt"]
        W5["restoreFromHistory()<br/>从历史恢复"]
        W6["消息监听<br/>window.addEventListener('message')"]
    end

    C1 & C2 & C3 & C4 --> P2
    C5 --> |"executeCommand"| P1
    C6 --> P3
    P2 --> P5
    P2 --> P4
    P7 --> |"HTML 字符串"| P1
    P4 --> W6
    W6 --> W1
    W1 --> W2 & W3
    W4 --> |"postMessage"| P6
    W5 --> W1
```

---

## 文件结构

```
write-ai-prompt-better-vs-plugin/
├── src/
│   ├── extension.ts              # 激活入口，注册 Provider 和 6 个命令
│   ├── WriteBetterPromptProvider.ts  # 核心 Provider，含完整嵌入式 UI
│   └── types.ts                  # 共享 TS 类型 (ContextItem / HistoryItem / 消息协议)
├── package.json                  # 扩展清单，贡献点配置
├── tsconfig.json                 # tsc 编译配置
├── images/icon.png               # ActivityBar 图标
└── out/                          # 编译产物（.js）
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

---

## 核心类型关系

```mermaid
classDiagram
    class ContextItem {
        +string id
        +string type
        +string content
        +string filePath
        +LineRange lineRange
        +number timestamp
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
    }

    class ExtensionMessage {
        <<union>>
        addContextItem
        historyData
        presetsData
        clearAll
    }

    HistoryItem "1" *-- "n" ContextItem : snapshot
    WebviewMessage ..> HistoryItem : saveHistory payload
    ExtensionMessage ..> ContextItem : addContextItem payload
    ExtensionMessage ..> HistoryItem : historyData payload
    ExtensionMessage ..> PresetPrompt : presetsData payload
```

---

## 上下文类型枚举

| type 值 | 来源命令 | 内容 |
|---------|---------|------|
| `file` | addFileContent | 编辑器选中代码块（含文件路径和行号）|
| `terminal` | addTerminalContent | 终端选中文本 |
| `file`（全文）| addFileToContext | 完整文件内容 |
| `fileRef` | addPathToContext（文件）| 仅文件路径引用 |
| `folder` | addPathToContext（目录）| 目录路径引用 |
| `manual` | Webview 内手动输入 | 用户手动填写的上下文 |
