#!/usr/bin/env bash
# scripts/dojo/status.sh
#
# Shows status of all dojo environments.
#
# Usage:
#   ./scripts/dojo/status.sh

set -euo pipefail

B='\033[0;34m'; G='\033[0;32m'; Y='\033[1;33m'; R='\033[0;31m'; D='\033[0;90m'; NC='\033[0m'

DOJO_SLUGS="chrry vex focus burn hippo donut peach bloom vault atlas sushi jules debugger architect coder writer reviewer researcher nebula quantumlab starmap cosmos grape pear popcorn zarathustra meditations dune grok benjamin harper lucas"

echo ""
echo -e "${B}Dojo Environment Status${NC}"
echo "────────────────────────────────────────────────────────"
printf "%-20s %-12s %-38s\n" "SLUG" "PHASE" "ENV ID"
echo "────────────────────────────────────────────────────────"

# Fetch all environments once
ALL_ENVS=$(gitpod environment list --output json 2>/dev/null || echo "[]")

for slug in $DOJO_SLUGS; do
  env_name="dojo-$slug"

  result=$(echo "$ALL_ENVS" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    envs = data if isinstance(data, list) else data.get('environments', [])
    for e in envs:
        if e.get('name') == '$env_name':
            print(e.get('id','?') + '|' + e.get('status', {}).get('phase', e.get('phase','?')))
            sys.exit(0)
    print('none|none')
except Exception as ex:
    print('error|' + str(ex))
" 2>/dev/null || echo "none|none")

  env_id="${result%%|*}"
  phase="${result##*|}"

  if [[ "$env_id" == "none" ]]; then
    printf "%-20s ${D}%-12s${NC} %-38s\n" "$slug" "not spawned" "-"
  elif [[ "$phase" == "running" ]]; then
    printf "%-20s ${G}%-12s${NC} %-38s\n" "$slug" "$phase" "$env_id"
  elif [[ "$phase" == "stopped" || "$phase" == "stopping" ]]; then
    printf "%-20s ${Y}%-12s${NC} %-38s\n" "$slug" "$phase" "$env_id"
  else
    printf "%-20s ${B}%-12s${NC} %-38s\n" "$slug" "$phase" "$env_id"
  fi
done

echo "────────────────────────────────────────────────────────"
echo ""
echo "Spawn:    ./scripts/dojo/spawn.sh [slug...]"
echo "Teardown: ./scripts/dojo/teardown.sh [slug...]"
