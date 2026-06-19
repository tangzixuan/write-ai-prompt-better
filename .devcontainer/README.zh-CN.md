# Devcontainer for write-ai-prompt-better（中文）

VSCode 扩展项目的开箱即用开发环境，适用于：

- **GitHub Codespaces** — 一键云端开发
- **VSCode Dev Containers** — 本地容器化开发

## 包含的工具

| 工具 | 用途 |
|------|------|
| **Node.js 20**（TypeScript） | 扩展运行时与构建 |
| **pnpm 9.15** | 包管理器 |
| **Claude Code CLI** | AI 辅助编程 |
| **GitHub CLI**（`gh`） | PR、Issue、仓库管理 |
| **VSCode 扩展** | ESLint、Prettier、GitLens |

## 快速开始

1. 在 **GitHub Codespaces** 中打开此仓库（`<> Code` → Codespaces → Create）
2. 等待容器构建完成（约 2 分钟）
3. **编辑 `.devcontainer/.deepseek-claude.json`** — 将占位符替换为你的真实 API key：
   ```json
   "ANTHROPIC_AUTH_TOKEN": "sk-你的真实key"
   ```
4. 运行配置脚本：
   ```bash
   bash .devcontainer/scripts/configure-claude.sh
   ```
5. `claude` 命令即可使用

## Claude Code + DeepSeek API

所有配置集中在一个文件：**`.devcontainer/.deepseek-claude.json`**。配置脚本读取该文件，将设置直接写入 `~/.claude/settings.json` —— Claude Code 从中读取 API token 和模型配置，无需 `.env` 文件。

```
.devcontainer/.deepseek-claude.json  →  ~/.claude/settings.json  →  Claude Code CLI
```

### 配置方式

编辑 `.devcontainer/.deepseek-claude.json`，将 `env.ANTHROPIC_AUTH_TOKEN` 设置为你的真实 key，然后运行：

```bash
bash .devcontainer/scripts/configure-claude.sh
```

或者直接运行脚本，按提示输入 key，脚本会自动写入 JSON 文件。

### 自动配置

每次 codespace 启动时，`post-start.sh` 会运行 `configure-claude.sh --quiet` 确保 Claude Code 配置是最新的。编辑 `.devcontainer/.deepseek-claude.json` 后重启即可，无需手动操作。

### 使用 Claude Code

```bash
claude                          # 进入交互式会话
claude -p "重构这个文件"          # 单次对话
```

### Git 保护

`.devcontainer/.deepseek-claude.json` 被 git 追踪（仓库中保留占位符），但你的真实 API key **不应被提交**。devcontainer 脚本会自动执行：

```bash
git update-index --skip-worktree .devcontainer/.deepseek-claude.json
```

这会让 git 忽略该文件的本地修改 —— 不会出现在 `git status` 中，`git add .` 也不会暂存它。如果需要更新仓库中的占位符：

```bash
git update-index --no-skip-worktree .devcontainer/.deepseek-claude.json   # 恢复追踪
# 编辑文件为新的占位符
git add .devcontainer/.deepseek-claude.json && git commit -m "..."
git update-index --skip-worktree .devcontainer/.deepseek-claude.json      # 重新忽略
```

> **获取 API key：** https://platform.deepseek.com/api_keys

## 开发命令

```bash
pnpm build             # 构建所有包
pnpm dev               # 监听模式
pnpm typecheck         # 仅类型检查
```

## 文件结构

```
.devcontainer/
├── .deepseek-claude.json       # Claude Code 配置模板（API token + 模型设置）
├── devcontainer.json           # 容器定义
├── README.md                   # 英文说明
├── README.zh-CN.md             # 本文件（中文说明）
└── scripts/
    ├── on-create.sh            # 安装 pnpm + 依赖
    ├── post-create.sh          # 构建项目 + 安装 Claude Code
    ├── post-start.sh           # 启动时自动配置 Claude Code
    └── configure-claude.sh     # 读取配置模板 → 写入 ~/.claude/settings.json
```
