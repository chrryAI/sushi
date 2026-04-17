#!/bin/bash
# =============================================================================
# Real Agent Memory Benchmark Runner
# =============================================================================

set -e

cd "$(dirname "$0")/.."

echo "🔥 Real Agent Memory Benchmark"
echo "==============================="
echo ""

# Parse arguments
MODE="${1:-mock}"
USE_REAL_API="false"

if [ "$MODE" == "real" ]; then
    if [ -z "$OPENAI_API_KEY" ]; then
        echo "❌ OPENAI_API_KEY not set. Using mock mode."
        echo "   Set it with: export OPENAI_API_KEY=sk-xxx"
        MODE="mock"
    else
        USE_REAL_API="true"
        echo "🤖 Running in REAL API mode"
    fi
else
    echo "🔮 Running in MOCK mode (no API calls)"
fi

echo ""

# Run benchmark
MODE="$MODE" USE_REAL_API="$USE_REAL_API" pnpm tsx scripts/benchmark-agent-memory-real.ts

echo ""
echo "✅ Benchmark complete!"
echo ""
echo "Next steps:"
echo "  1. Review the ROUGE scores above"
echo "  2. If scores are low, run Optuna optimization:"
echo "     ./scripts/setup-optuna-local.sh start"
echo ""
