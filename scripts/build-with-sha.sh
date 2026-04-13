#!/bin/bash

# Get the current git SHA
GIT_SHA=$(git rev-parse HEAD 2>/dev/null || echo "unknown")

# Export it for the build process
export GIT_SHA

echo "🔖 Build ID: $GIT_SHA"

# Run the build command passed as arguments
"$@"
