#!/usr/bin/env bash
# scripts/dojo/teardown.sh
#
# Stops and deletes dojo environments.
#
# Usage:
#   ./scripts/dojo/teardown.sh              # teardown all dojo envs
#   ./scripts/dojo/teardown.sh chrry vex    # teardown specific slugs
#   ./scripts/dojo/teardown.sh --stop-only  # stop but don't delete

set -euo pipefail

B='\033[0;34m'; G='\033[0;32m'; Y='\033[1;33m'; R='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${B}▶ $1${NC}"; }
ok()   { echo -e "${G}✓ $1${NC}"; }
warn() { echo -e "${Y}⚠ $1${NC}"; }
err()  { echo -e "${R}✗ $1${NC}"; }

STOP_ONLY=false
SLUGS=""

for arg in "$@"; do
  if [[ "$arg" == "--stop-only" ]]; then
    STOP_ONLY=true
  else
    SLUGS="$SLUGS $arg"
  fi
done

SLUGS="${SLUGS:-chrry vex focus burn hippo donut peach bloom vault atlas sushi jules debugger architect coder writer reviewer researcher nebula quantumlab starmap cosmos grape pear popcorn zarathustra meditations dune grok benjamin harper lucas}"

ALL_ENVS=$(gitpod environment list --output json 2>/dev/null || echo "[]")

teardown_env() {
  local slug="$1"
  local env_name="dojo-$slug"

  local env_id
  env_id=$(echo "$ALL_ENVS" | python3 -c "
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

  if [[ -z "$env_id" ]]; then
    warn "$slug — no environment found, skipping"
    return 0
  fi

  if [[ "$STOP_ONLY" == "true" ]]; then
    log "Stopping $env_name ($env_id)..."
    gitpod environment stop "$env_id" 2>&1 && ok "Stopped: $env_name" || err "Failed to stop: $env_name"
  else
    log "Deleting $env_name ($env_id)..."
    gitpod environment delete "$env_id" --force 2>&1 && ok "Deleted: $env_name" || err "Failed to delete: $env_name"
  fi
}

echo ""
if [[ "$STOP_ONLY" == "true" ]]; then
  log "Dojo teardown (stop only) — slugs:$SLUGS"
else
  log "Dojo teardown (delete) — slugs:$SLUGS"
fi
echo ""

for slug in $SLUGS; do
  teardown_env "$slug"
done

echo ""
ok "Teardown complete."
echo "Status: ./scripts/dojo/status.sh"
