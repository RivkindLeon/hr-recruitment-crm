#!/usr/bin/env bash
set -euo pipefail

echo "==> Setting up backend database..."

cd "$(dirname "$0")/.."

echo "==> Creating tables..."
npx tsx src/db/migrate.ts

echo "==> Seeding data..."
npx tsx src/db/seed.ts

echo "==> Done. Run 'npm run dev' to start the API server."