#!/usr/bin/env bash
# Chrry Branch-Based AI Agent Hook
# Add this to your .zshrc or .bashrc:
#   source /path/to/scripts/chrry-branch-hook.sh
#
# This hook auto-detects git branch changes and switches the AI agent context.

_CHRRY_LAST_BRANCH=""

_chrry_prompt_hook() {
  local current_branch
  current_branch=$(git branch --show-current 2>/dev/null)

  if [[ -z "$current_branch" ]]; then
    return
  fi

  if [[ "$current_branch" != "$_CHRRY_LAST_BRANCH" ]]; then
    _CHRRY_LAST_BRANCH="$current_branch"

    # Optional: call API to notify branch switch
    if command -v curl &> /dev/null; then
      (
        curl -s -X POST "${CHRRY_API_URL:-http://localhost:3001}/branch/switch" \
          -H "Content-Type: application/json" \
          -d "{\"branch\":\"$current_branch\"}" \
          > /dev/null 2>&1
      ) &
    fi

    # Visual feedback in terminal
    if [[ -n "$CHRRY_BRANCH_AGENT_VERBOSE" ]]; then
      echo ""
      echo "🌿 Chrry branch agent switched to: $current_branch"
    fi
  fi
}

# Register hook in PROMPT_COMMAND (bash) or precmd (zsh)
if [[ -n "$ZSH_VERSION" ]]; then
  autoload -U add-zsh-hook 2>/dev/null || true
  if type add-zsh-hook &> /dev/null; then
    add-zsh-hook precmd _chrry_prompt_hook
  else
    # Fallback for very minimal zsh
    precmd_functions+=(_chrry_prompt_hook)
  fi
elif [[ -n "$BASH_VERSION" ]]; then
  if [[ -n "$PROMPT_COMMAND" ]]; then
    PROMPT_COMMAND="${PROMPT_COMMAND}; _chrry_prompt_hook"
  else
    PROMPT_COMMAND="_chrry_prompt_hook"
  fi
fi

# Optional: manual switch command
chrry-branch() {
  local branch="${1:-$(git branch --show-current 2>/dev/null)}"
  if [[ -z "$branch" ]]; then
    echo "❌ No git branch detected. Are you in a git repository?"
    return 1
  fi

  _CHRRY_LAST_BRANCH="$branch"
  export CHRRY_BRANCH="$branch"

  if command -v curl &> /dev/null; then
    curl -s -X POST "${CHRRY_API_URL:-http://localhost:3001}/branch/switch" \
      -H "Content-Type: application/json" \
      -d "{\"branch\":\"$branch\"}" \
      > /dev/null 2>&1
  fi

  echo "🌿 Chrry branch agent context: $branch"
}

# Auto-switch on shell start if inside a git repo
_chrry_prompt_hook
