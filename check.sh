#!/usr/bin/env bash
# Unified local verification script (resolves non-interactive nvm/pnpm/uv PATHs automatically).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PATH="$HOME/.local/bin:$HOME/.local/share/pnpm:$PATH"
if ! command -v pnpm >/dev/null 2>&1 || ! command -v node >/dev/null 2>&1; then
  for dir in "$HOME/.nvm/versions/node/$(cat "$ROOT/.nvmrc" 2>/dev/null || true)/bin" "$HOME"/.nvm/versions/node/v24*/bin "$HOME"/.nvm/versions/node/*/bin; do
    [ -x "$dir/node" ] && [ -x "$dir/pnpm" ] && export PATH="$dir:$PATH" && break
  done
fi

uv run --script "$ROOT/data_apps/sync_lookml_bundles.py" --check

cd "$ROOT/backend"
[ -d .venv ] || uv sync --all-groups
uv run pytest tests/ -v
uv run ruff check . "$ROOT/data_apps/sync_lookml_bundles.py"
uv run ty check

cd "$ROOT/frontend"
[ -d node_modules ] || pnpm install --frozen-lockfile --prefer-offline
pnpm exec tsc --noEmit
pnpm run test
pnpm run build
