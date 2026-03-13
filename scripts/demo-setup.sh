#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# 1P OS — Demo Database Setup
# ============================================================
# This script bootstraps a local Supabase instance with
# full demo data so every feature has data to display.
#
# Prerequisites:
#   - Docker running
#   - Supabase CLI installed (npm i -g supabase)
#
# Usage:
#   ./scripts/demo-setup.sh
#
# Login credentials:
#   Email:    demo@1pos.dev
#   Password: demo1234
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo ""
echo "  1P OS — Demo Setup"
echo "  ─────────────────────────────"
echo ""

# Check Docker
if ! docker info >/dev/null 2>&1; then
  echo "  ✗ Docker is not running. Please start Docker first."
  exit 1
fi
echo "  ✓ Docker running"

# Check Supabase CLI
if ! command -v supabase >/dev/null 2>&1; then
  echo "  ✗ Supabase CLI not found. Install: npm i -g supabase"
  exit 1
fi
echo "  ✓ Supabase CLI found"

# Stop existing Supabase if running
echo ""
echo "  Starting Supabase (this may take a minute)..."
supabase stop --no-backup 2>/dev/null || true
supabase start

echo ""
echo "  Applying migrations and seed data..."
supabase db reset

# Extract Supabase URLs from status
SUPABASE_URL=$(supabase status --output json 2>/dev/null | grep -o '"API_URL":"[^"]*"' | cut -d'"' -f4)
SUPABASE_ANON_KEY=$(supabase status --output json 2>/dev/null | grep -o '"ANON_KEY":"[^"]*"' | cut -d'"' -f4)
SUPABASE_SERVICE_KEY=$(supabase status --output json 2>/dev/null | grep -o '"SERVICE_ROLE_KEY":"[^"]*"' | cut -d'"' -f4)

# Create or update .env.local
if [ -f .env.local ]; then
  echo "  Updating .env.local with Supabase credentials..."
  # Remove old Supabase entries
  grep -v 'NEXT_PUBLIC_SUPABASE_URL\|NEXT_PUBLIC_SUPABASE_ANON_KEY\|SUPABASE_SERVICE_ROLE_KEY' .env.local > .env.local.tmp || true
  mv .env.local.tmp .env.local
else
  echo "  Creating .env.local..."
  cp .env.example .env.local
fi

# Append Supabase credentials
cat >> .env.local << EOF

# Supabase (local dev — auto-configured by demo-setup.sh)
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL:-http://127.0.0.1:54421}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_KEY:-}
EOF

# Generate encryption key if not set
if ! grep -q 'ENCRYPTION_KEY=.' .env.local 2>/dev/null; then
  ENC_KEY=$(openssl rand -hex 32)
  echo "ENCRYPTION_KEY=${ENC_KEY}" >> .env.local
  echo "  ✓ Generated encryption key"
fi

echo ""
echo "  ─────────────────────────────"
echo "  ✓ Demo database ready!"
echo ""
echo "  Login credentials:"
echo "    Email:    demo@1pos.dev"
echo "    Password: demo1234"
echo ""
echo "  Supabase Studio: http://127.0.0.1:54423"
echo "  App:             http://localhost:3000"
echo ""
echo "  Run the app:     npm run dev"
echo "  ─────────────────────────────"
echo ""
