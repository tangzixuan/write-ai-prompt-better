# Write AI Prompt Better — Website

> [write-ai-prompt-better](https://github.com/tangzixuan/write-ai-prompt-better) 项目官网，介绍 AI Prompt 的概念、推荐学习资源，以及推广 VSCode 插件。

## 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | React 18 + TypeScript |
| 样式 | Tailwind CSS 3.4（暗色模式支持） |
| 构建 | Vite 5 |
| 部署 | Cloudflare Pages |
| 包管理 | pnpm（monorepo） |

## 本地开发

### 前提条件

- Node.js >= 20
- pnpm >= 9.15.0

### 启动开发服务器

```bash
# 在仓库根目录执行
pnpm install
pnpm --filter @write-ai-prompt-better/website run dev

# 或者进入子目录
cd apps/website
pnpm dev
```

开发服务器默认运行在 `http://localhost:3000`，支持 HMR 热更新。

### 构建生产版本

```bash
# 在仓库根目录
pnpm --filter @write-ai-prompt-better/website run build

# 或者进入子目录
cd apps/website
pnpm build
```

构建产物输出到 `apps/website/dist/`。

### 本地预览生产构建

```bash
cd apps/website
pnpm preview
```

## 项目结构

```
apps/website/
├── index.html                  # 入口 HTML
├── package.json                # 项目依赖与脚本
├── tsconfig.json               # TypeScript 配置（继承 base）
├── vite.config.ts              # Vite 配置
├── tailwind.config.js          # Tailwind 主题（brand 色系、字体、暗色模式）
├── postcss.config.js           # PostCSS 配置
├── wrangler.toml               # Cloudflare Pages 部署配置
├── public/
│   ├── _headers                # Cloudflare 安全头 + 缓存策略
│   └── _redirects              # SPA 路由回退
├── src/
│   ├── main.tsx                # React 入口
│   ├── App.tsx                 # 根组件，组装各 Section
│   ├── index.css               # Tailwind 基础 + 全局样式 + 组件层
│   └── components/
│       ├── Header.tsx          # 响应式导航（PC 横向 / Mobile 汉堡菜单）
│       ├── Hero.tsx            # 主视觉区（标题、CTA、代码预览窗口）
│       ├── WhatIsPrompt.tsx    # Prompt 概念三步讲解
│       ├── Resources.tsx       # 学习资源卡片（3 个 GitHub 仓库）
│       ├── SkillsSection.tsx   # skills.sh 介绍 + 特性
│       ├── ExtensionPromo.tsx  # VSCode 插件推广（6 大特性 + 安装按钮）
│       └── Footer.tsx          # 页脚
└── dist/                       # 构建产物（gitignore，部署到 Cloudflare Pages）
```

## 页面内容

| Section | 组件 | 说明 |
|---------|------|------|
| 导航栏 | `Header` | sticky 顶部，PC/Mobile 响应式，GitHub 链接 |
| 主视觉 | `Hero` | 标题、描述、CTA 按钮、代码预览窗口（展示 prompt 格式） |
| 概念讲解 | `WhatIsPrompt` | 3 张卡片：什么是 Prompt → 为什么重要 → 结构化是关键 |
| 学习资源 | `Resources` | 3 个可点击卡片，指向 GitHub 优秀资源仓库 |
| Skills | `SkillsSection` | 介绍 skills.sh 平台，3 个特性卡片 + CTA |
| 插件推广 | `ExtensionPromo` | 6 大特性卡片 + VSCode 安装按钮 + 工具兼容列表 |
| 页脚 | `Footer` | Logo、导航链接、版权信息 |

## 部署到 Cloudflare Pages

### 方式一：Git 集成（推荐）

1. 在 [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **创建** → **Pages** → **连接到 Git**
2. 选择 GitHub 仓库 `tangzixuan/write-ai-prompt-better`
3. 配置构建设置：

| 配置项 | 值 |
|--------|-----|
| 框架预设 | Vite（或自定义） |
| 构建命令 | `cd ../.. && pnpm install --frozen-lockfile && cd apps/website && pnpm build` |
| 输出目录 | `apps/website/dist` |
| 根目录 | `apps/website` |

4. 点击 **保存并部署**

> **说明**：`root_dir` 设为 `apps/website`，但 `pnpm install` 必须在 monorepo 根目录执行（因为根目录有 `pnpm-workspace.yaml` 和 `pnpm-lock.yaml`），所以构建命令需要先 `cd ../..` 回到根目录安装依赖，再 `cd apps/website` 回来构建。

首次部署完成后，Cloudflare Pages 会自动为该分支分配 `*.pages.dev` 域名。后续每次推送到该分支都会自动部署。

### 方式二：CLI 手动部署

```bash
# 1. 安装 Wrangler CLI
pnpm add -g wrangler

# 2. 登录 Cloudflare
wrangler login

# 3. 构建
cd apps/website
pnpm build

# 4. 部署
wrangler pages deploy dist --project-name=write-ai-prompt-better
```

### 自定义域名

在 Cloudflare Dashboard → **Workers & Pages** → 选择项目 → **自定义域** 中绑定你自己的域名。

## 设计原则

- **开发者风格**：简洁、清爽、现代化，大量留白，网格背景点缀
- **暗色模式**：跟随系统偏好（`prefers-color-scheme`），全部组件适配
- **响应式**：`sm:`（640px）、`md:`（768px）、`lg:`（1024px）三个断点，同时适配移动端和桌面端
- **性能**：零运行时依赖（仅 react/react-dom），Vite 构建产物 < 200KB gzipped
- **无障碍**：语义化 HTML，可访问的交互元素
