#!/usr/bin/env bash
# 配置项目 Git Hooks
# 首次克隆项目后运行：bash .githooks/setup.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
HOOKS_DIR="$ROOT_DIR/.githooks"

echo "配置 Git Hooks..."
git config core.hooksPath "$HOOKS_DIR"
chmod +x "$HOOKS_DIR/pre-commit" "$HOOKS_DIR/pre-push" 2>/dev/null || true
echo "✓ Hooks 已配置"
echo "  路径: $HOOKS_DIR"
echo "  脚本: pre-commit（提交前检查）, pre-push（推送前检查）"
echo ""
echo "如需恢复默认 hooks 路径："
echo "  git config --unset core.hooksPath"
