#!/usr/bin/env bash
set -euo pipefail

CPU="${CPU:-4}"
MEMORY="${MEMORY:-4}"
DISK="${DISK:-60}"

command -v brew >/dev/null 2>&1 || { echo "Homebrew gerekli"; exit 1; }

if ! command -v colima >/dev/null 2>&1; then
  brew install colima docker docker-compose
fi

mkdir -p ~/.docker/cli-plugins
if [ -x /opt/homebrew/opt/docker-compose/bin/docker-compose ]; then
  ln -sfn /opt/homebrew/opt/docker-compose/bin/docker-compose ~/.docker/cli-plugins/docker-compose
fi
if [ -x /opt/homebrew/bin/docker-buildx ]; then
  ln -sfn /opt/homebrew/bin/docker-buildx ~/.docker/cli-plugins/docker-buildx
fi

if ! colima status >/dev/null 2>&1; then
  colima start --cpu "$CPU" --memory "$MEMORY" --disk "$DISK"
fi

docker context use colima >/dev/null 2>&1 || true

echo "Docker version:"
docker --version || true
echo "Compose version:"
docker compose version || docker-compose version || true
echo "Colima status:"
colima status || true