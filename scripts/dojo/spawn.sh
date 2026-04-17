#!/usr/bin/env bash
# scripts/dojo/spawn.sh
#
# Spawns Ona environments for dojo slugs.
# Each slug gets its own environment on the matching branch.
#
# Usage:
#   ./scripts/dojo/spawn.sh                    # spawn all slugs
#   ./scripts/dojo/spawn.sh chrry vex focus    # spawn specific slugs
#   DOJO_GROUP=sushi ./scripts/dojo/spawn.sh   # spawn a group

set -euo pipefail

REPO="https://github.com/ibsukru/sushi.git"
PROJECT_ID="019d913e-f64c-7981-a9b2-1d160eda0945"

# ── Dojo slug registry ────────────────────────────────────────
declare -A DOJO_GROUPS=(
  [blossom]="chrry vex focus burn hippo donut"
  [lifeOs]="peach bloom vault atlas"
  [sushi]="sushi jules debugger architect coder writer reviewer researcher"
  [orbit]="nebula quantumlab starmap cosmos"
  [wine]="grape pear"
  [popcorn_cinema]="popcorn"
  [books_philosophy]="zarathustra meditations dune"
  [nexus_grok]="grok benjamin harper lucas"
)

ALL_SLUGS="chrry vex focus burn hippo donut peach bloom vault atlas sushi jules debugger architect coder writer reviewer researcher nebula quantumlab starmap cosmos grape pear popcorn zarathustra meditations dune grok benjamin harper lucas"

# ── Resolve target slugs ──────────────────────────────────────
if [[ -n "${DOJO_GROUP:-}" ]]; then
  SLUGS="${DOJO_GROUPS[$DOJO_GROUP]:-}"
  if [[ -z "$SLUGS" ]]; then
    echo "Unknown group: $DOJO_GROUP"
    echo "Available groups: ${!DOJO_GROUPS[*]}"
    exit 1
  fi
elif [[ $# -gt 0 ]]; then
  SLUGS="$*"
else
  SLUGS="$ALL_SLUGS"
fi

# ── Helpers ───────────────────────────────────────────────────
B='\033[0;34m'; G='\033[0;32m'; Y='\033[1;33m'; R='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${B}▶ $1${NC}"; }
ok()   { echo -e "${G}✓ $1${NC}"; }
warn() { echo -e "${Y}⚠ $1${NC}"; }
err()  { echo -e "${R}✗ $1${NC}"; }

# ── Get existing environments (name → id map) ─────────────────
log "Fetching existing environments..."
EXISTING=$(gitpod environment list --output json 2>/dev/null || echo "[]")

get_env_id() {
  local name="$1"
  echo "$EXISTING" | python3 -c "
import sys, json
envs = json.load(sys.stdin) if sys.stdin.read(1) == '[' else []
" 2>/dev/null || true
  # Simpler: grep by name field
  echo "$EXISTING" | grep -A2 "\"name\": \"$name\"" | grep '"id"' | head -1 | grep -oP '(?<="id": ")[^"]+' || true
}

# ── Ensure slug branch exists on remote ──────────────────────
ensure_branch() {
  local slug="$1"
  if git ls-remote --heads origin "$slug" | grep -q "$slug"; then
    return 0
  fi
  log "Creating remote branch: $slug"
  git fetch origin ramen
  git push origin "origin/ramen:refs/heads/$slug" 2>/dev/null || true
}

# ── Spawn one environment ─────────────────────────────────────
spawn_env() {
  local slug="$1"
  local env_name="dojo-$slug"

  # Check if already running
  local existing_id
  existing_id=$(gitpod environment list --output json 2>/dev/null \
    | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    envs = data if isinstance(data, list) else data.get('environments', [])
    for e in envs:
        if e.get('name') == '$env_name':
            print(e.get('id',''))
            break
except: pass
" 2>/dev/null || true)

  if [[ -n "$existing_id" ]]; then
    warn "$slug already has environment $existing_id — skipping"
    return 0
  fi

  ensure_branch "$slug"

  log "Spawning environment for slug: $slug (branch: $slug)"
  gitpod environment create "$REPO#$slug" \
    --name "$env_name" \
    --dont-wait \
    2>&1 && ok "Spawned: $env_name" || err "Failed to spawn: $env_name"
}

# ── Main ──────────────────────────────────────────────────────
echo ""
log "Dojo spawn — target slugs: $SLUGS"
echo ""

SPAWNED=0
SKIPPED=0
FAILED=0

for slug in $SLUGS; do
  if spawn_env "$slug"; then
    SPAWNED=$((SPAWNED + 1))
  else
    FAILED=$((FAILED + 1))
  fi
done

echo ""
echo "────────────────────────────────"
ok "Done. Spawned: $SPAWNED | Failed: $FAILED"
echo ""
echo "Check status:  ./scripts/dojo/status.sh"
echo "Teardown:      ./scripts/dojo/teardown.sh"
