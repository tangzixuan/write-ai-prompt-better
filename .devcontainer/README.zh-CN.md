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
3. **编辑 `.env`** — 将占位符替换为你的真实 API key：
   ```
   DEEPSEEK_API_KEY=sk-你的真实key
   ```
4. 运行配置脚本：
   ```bash
   bash .devcontainer/scripts/configure-claude.sh
   ```
5. `claude` 命令即可使用

## Claude Code + DeepSeek API

API key 存放在项目根目录的 **`.env`** 文件中，Claude Code 直接从文件读取，无需手动 export 环境变量。

```
.env  →  apiKeyHelper  →  Claude Code CLI
```

### 配置方式

编辑 `.env`，替换占位符，然后运行：

```bash
bash .devcontainer/scripts/configure-claude.sh
```

或者直接运行脚本，按提示输入 key，脚本会自动写入 `.env`。

### 自动配置

每次 codespace 启动时，`post-start.sh` 会检查 `.env` 中是否有真实 key，有则自动配置 Claude Code。编辑 `.env` 后重启即可，无需手动操作。

### 使用 Claude Code

```bash
claude                          # 进入交互式会话
claude -p "重构这个文件"          # 单次对话
```

### .env 的 Git 保护

`.env` 被 git 追踪（仓库中保留占位符），但你的真实 API key **不应被提交**。devcontainer 脚本会自动执行：

```bash
git update-index --skip-worktree .env
```

这会让 git 忽略 `.env` 的本地修改 —— 不会出现在 `git status` 中，`git add .` 也不会暂存它。如果需要更新仓库中的占位符：

```bash
git update-index --no-skip-worktree .env   # 恢复追踪
# 编辑 .env 为新的占位符
git add .env && git commit -m "..."
git update-index --skip-worktree .env      # 重新忽略
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
├── devcontainer.json          # 容器定义
├── README.md                  # 英文说明
├── README.zh-CN.md            # 本文件（中文说明）
└── scripts/
    ├── on-create.sh           # 安装 pnpm + 依赖
    ├── post-create.sh         # 构建项目 + 安装 Claude Code
    ├── post-start.sh          # 加载 .env，自动配置
    └── configure-claude.sh    # 将 key 写入 .env + Claude Code 配置
```
