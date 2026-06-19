# Design Document — Write AI Prompt Better (Website)

> 本文档描述 write-ai-prompt-better 官网的设计思路、信息架构、视觉规范和实现决策。
> 实际代码见 `apps/website/src/`，部署文档见 `apps/website/README.md`。

---

## 一、项目定位

**write-ai-prompt-better** 官网是面向开发者的品牌展示 + 教育落地页，承担三个核心任务：

1. **教育** — 向开发者普及 AI Prompt 的概念、重要性和结构化编写方法
2. **引导** — 推荐优质学习资源，降低入门门槛
3. **转化** — 推广 VSCode 插件，引导用户安装使用

目标用户：使用 AI 编码助手（Claude Code、GitHub Copilot、Cursor 等）的开发者。

---

## 二、信息架构

### 2.1 单页滚动结构

网站采用单页（Single Page）设计，所有内容通过锚点导航串联，用户自上而下自然阅读：

```
┌──────────────────────────────────────┐
│  Header (sticky)                     │  ← 导航 + Logo + GitHub
├──────────────────────────────────────┤
│  Hero                                │  ← 主标题 + CTA + 代码预览
├──────────────────────────────────────┤
│  What is a Prompt                    │  ← 概念讲解 (3 步卡片)
├──────────────────────────────────────┤
│  Learning Resources                  │  ← 3 个 GitHub 仓库链接
├──────────────────────────────────────┤
│  Skills (skills.sh)                  │  ← 技能发现平台介绍
├──────────────────────────────────────┤
│  VSCode Extension                    │  ← 插件特性 + 安装引导
├──────────────────────────────────────┤
│  Footer                              │  ← 链接 + 版权
└──────────────────────────────────────┘
```

### 2.2 各区块内容策略

| 区块 | 目的 | 内容策略 |
|------|------|---------|
| **Header** | 导航定位 | sticky 吸顶，提供 4 个锚点链接 + GitHub 入口。移动端汉堡菜单。 |
| **Hero** | 第一印象 | 大标题直击痛点，展示 prompt 代码示例降低认知负担，双 CTA（学习 / 安装）。 |
| **What is a Prompt** | 概念教育 | 3 张由浅入深的卡片：定义 → 价值 → 方法论。每张卡片包含图标、编号、标题、描述。 |
| **Resources** | 资源推荐 | 3 张可点击卡片展示推荐的 GitHub 仓库，每张有标签（Community / Directory / Reference）。 |
| **Skills** | 技能生态 | 介绍 skills.sh 平台，3 个特性卡片 + 醒目的 CTA 按钮跳转外部。 |
| **Extension** | 插件转化 | 6 个特性卡片全面展示插件能力 + 安装按钮（链接到 GitHub Releases）。 |
| **Footer** | 收尾 | 轻量页脚，GitHub / Marketplace / License 链接 + 版权。 |

---

## 三、视觉设计

### 3.1 设计原则

- **开发者审美** — 代码风格、暗色模式、等宽字体点缀
- **克制** — 大量留白、弱化装饰、信息密度适中
- **现代** — 微妙的渐变、圆角、阴影、毛玻璃效果
- **可信赖** — 专业但不冰冷，有温度的蓝色主色调

### 3.2 色彩系统

| Token | 亮色模式 | 暗色模式 | 用途 |
|-------|---------|---------|------|
| 品牌主色 | `#3366ff` (brand-500) | `#598bff` (brand-400) | CTA 按钮、链接、强调文字 |
| 品牌渐变 | brand-500 → brand-700 | brand-400 → brand-500 | 标题渐变文字 |
| 页面背景 | `#ffffff` | `#0a0a0a` (gray-950) | 主背景 |
| 次级背景 | `#f9fafb` (gray-50) | gray-900/50 | Resources、Extension 区块交替背景 |
| 卡片背景 | `#ffffff` | gray-900 | 所有卡片组件 |
| 正文 | `#111827` (gray-900) | gray-100 | 标题文字 |
| 辅助文字 | `#4b5563` (gray-600) | gray-400 | 描述段落 |
| 边框 | gray-200 | gray-800 | 卡片、分割线 |
| Skills 强调 | amber-500 | amber-400 | skills.sh 区块的差异化色彩 |

### 3.3 字体

| 用途 | 字体 | 备选 |
|------|------|------|
| 正文 / UI | **Inter** | -apple-system, BlinkMacSystemFont, Segoe UI, Roboto |
| 代码展示 | **JetBrains Mono** | Fira Code, Menlo, Monaco |

- 加载方式：Google Fonts（`@import` 在 CSS 最顶部）
- 代码字体仅用于 Hero 的代码预览窗口

### 3.4 圆角规范

| 元素 | 圆角 | Tailwind Class |
|------|------|---------------|
| 大按钮 | 12px | `rounded-xl` |
| 卡片 | 16px | `rounded-2xl` |
| 小标签 / 胶囊 | full | `rounded-full` |
| 图标容器 | 8-10px | `rounded-lg` / `rounded-xl` |
| 代码窗口 | 12px | `rounded-xl` |

### 3.5 阴影

| 场景 | Tailwind Class |
|------|---------------|
| 卡片悬浮 | `hover:shadow-md` |
| CTA 按钮 | `shadow-lg shadow-brand-500/25` |
| Skills CTA | `shadow-lg shadow-amber-500/25` |

---

## 四、响应式设计

### 4.1 断点策略

| 断点 | 宽度 | 目标设备 | 布局变化 |
|------|------|---------|---------|
| 默认（mobile-first） | < 640px | 手机竖屏 | 单列，汉堡菜单，卡片堆叠 |
| `sm:` | ≥ 640px | 手机横屏 / 小平板 | 按钮横向排列，部分 2 列网格 |
| `md:` | ≥ 768px | 平板 | 导航展开为横向，3 列卡片网格 |
| `lg:` | ≥ 1024px | 桌面 | 内容区最大宽度 72rem (1152px) |

### 4.2 关键响应式行为

- **导航栏** < 768px 时切换为汉堡菜单，点击展开垂直导航
- **卡片网格** 在 `sm:` 时 2 列，`lg:` 时 3 列
- **Hero 标题** 从 `text-4xl` → `sm:text-5xl` → `lg:text-6xl` 逐级放大
- **代码预览窗口** 在移动端 `max-w-xl`，桌面端居中展示，最大宽度受限

---

## 五、组件架构

### 5.1 组件树

```
App
├── Header          (sticky, 响应式导航)
├── Hero            (主视觉, 无状态)
├── WhatIsPrompt    (3 张静态卡片, 无状态)
├── Resources       (3 张链接卡片, 无状态)
├── SkillsSection   (特性卡片 + CTA, 无状态)
├── ExtensionPromo  (6 张特性卡片 + CTA, 无状态)
└── Footer          (页脚链接, 无状态)
```

### 5.2 状态管理

所有组件为**无状态函数组件**，不需要全局状态管理。唯一的交互状态是 Header 中的 `mobileOpen`（汉堡菜单开/关），通过 `useState` 在组件内管理。

### 5.3 CSS 架构

```
index.css
├── @import (Google Fonts)
├── @tailwind base / components / utilities
├── @layer base     → html, body, ::selection 全局样式
├── @layer components → .gradient-text, .card, .link, .section-container
└── @layer utilities  → .bg-grid (Hero 背景网格)
```

提取的组件类：
- `.gradient-text` — 品牌色渐变文字（标题中关键字的强调）
- `.card` — 卡片容器（圆角、边框、背景、阴影、悬浮效果）
- `.link` — 正文中的超链接样式
- `.section-container` — 内容区最大宽度 + 水平内边距

---

## 六、技术决策

### 6.1 为什么 React + Vite（而不是静态 HTML）

| 考量 | 决策 |
|------|------|
| 组件复用 | Header/Footer/Card 等可复用，不用复制 HTML |
| 类型安全 | TypeScript 全覆盖，接口与类型一目了然 |
| 暗色模式 | Tailwind `dark:` 前缀统一管理，不用维护两套 CSS |
| 构建产出 | Vite 生成的 SPA 依然是纯静态文件，适合 Cloudflare Pages |
| 未来迭代 | 后续如需添加搜索、筛选、动态内容，React 有天然优势 |

### 6.2 为什么 Tailwind CSS（而不是 CSS Modules / styled-components）

| 考量 | 决策 |
|------|------|
| 与 Vite 集成 | Tailwind + PostCSS 在 Vite 中零配置开箱即用 |
| 响应式 | `sm:` / `md:` / `lg:` 断点内联在 className，无需切文件 |
| 暗色模式 | `dark:` 前缀与 `class` 策略配合，切换无痛 |
| 体积 | Vite + Tailwind 生产构建仅包含使用到的类，CSS < 5KB gzipped |
| 维护 | 改动样式只需修改 className，不用在 .css 和 .tsx 间跳转 |

### 6.3 为什么不使用 `@write-ai-prompt-better/ui` 和 `@write-ai-prompt-better/utils`

这两个 workspace 包目前是 scaffold，尚未实现可用的 UI 组件库或工具函数。网站项目独立自立，不依赖它们。未来如果 ui/utils 包成熟，可以逐步引入。

---

## 七、部署架构

```
GitHub (tangzixuan/write-ai-prompt-better)
  │
  │  push to main
  ▼
Cloudflare Pages (Git 集成)
  │
  │  构建命令: cd ../.. && pnpm install && cd apps/website && pnpm build
  │  输出目录: apps/website/dist
  │
  ▼
write-ai-prompt-better.pages.dev  (自动分配)
  │
  │  可选: 绑定自定义域名
  ▼
(自定义域名)
```

### 7.1 Wrangler 配置要点

```toml
[build]
command = "cd ../.. && pnpm install --frozen-lockfile && cd apps/website && pnpm build"
output_dir = "dist"
root_dir = "apps/website"
```

- `root_dir` 告诉 Cloudflare Pages 项目在 monorepo 中的位置
- `cd ../..` 是必须的：pnpm workspace 的 `pnpm-lock.yaml` 和 `pnpm-workspace.yaml` 在仓库根目录，依赖安装必须从根目录执行

### 7.2 安全头

通过 `public/_headers` 配置：
- `X-Frame-Options: DENY` — 防止点击劫持
- `X-Content-Type-Options: nosniff` — 禁止 MIME 嗅探
- `Referrer-Policy: strict-origin-when-cross-origin` — 限制 Referer 泄露
- `Permissions-Policy` — 禁用不必要的浏览器 API
- 静态资源长期缓存（文件名带 hash）

---

## 八、未来规划

- [ ] 支持国际化（i18n），优先中英文切换
- [ ] 添加 prompt 模板在线预览 / 编辑
- [ ] 集成博客或教程文章（SEO 内容营销）
- [ ] 接入 analytics 统计访问数据
- [ ] 逐步引入 `@write-ai-prompt-better/ui` 组件库

---

## 九、相关文件

| 文件 | 说明 |
|------|------|
| `apps/website/design.md` | 本文档 — 设计思路与架构 |
| `apps/website/README.md` | 开发与部署操作手册 |
| `apps/website/wrangler.toml` | Cloudflare Pages 部署配置 |
| `apps/website/public/_headers` | Cloudflare 安全头与缓存策略 |
| `CLAUDE.md` | 整个 monorepo 的开发指南 |
