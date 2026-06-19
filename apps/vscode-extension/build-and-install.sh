#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# 1. 从 package.json 读取版本号
VERSION=$(node -e "console.log(require('./package.json').version)")
VSIX="write-ai-prompt-better-${VERSION}.vsix"

echo "==> 1/3 编译 TypeScript..."
pnpm run build
echo ""

echo "==> 2/3 打包 .vsix..."
npx @vscode/vsce package --no-dependencies
echo ""

echo "==> 3/3 安装到 VSCode..."
code --install-extension "$VSIX" --force
echo ""

echo "✔ 完成！write-ai-prompt-better v${VERSION} 已安装。"
echo "  请运行 VSCode 的 'Developer: Reload Window' 或重启窗口使插件生效。"
