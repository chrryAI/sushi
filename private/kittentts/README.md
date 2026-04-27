# KittenTTS Docker Deployment

Lightweight self-hosted TTS API based on [KittenTTS](https://github.com/KittenML/KittenTTS).

## Requirements

- Docker + Docker Compose
- ~30GB disk free (model caches on first run)
- 2GB+ RAM

## Deploy

```bash
cd infra/kittentts
docker compose up -d --build
```

First boot downloads the ONNX model from HuggingFace (~25-80MB depending on `MODEL_NAME`).

## Usage

```bash
# List voices
curl http://localhost:8000/voices

# Generate speech
curl -X POST http://localhost:8000/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world","voice":"Jasper","speed":1.0}' \
  --output hello.wav
```

## Environment Variables

| Variable     | Default                        | Description                          |
| ------------ | ------------------------------ | ------------------------------------ |
| `MODEL_NAME` | `KittenML/kitten-tts-nano-0.8` | HuggingFace model repo to load       |
| `HF_HOME`    | `/cache/huggingface`           | Internal cache path (volume mounted) |

## Available Models

- `KittenML/kitten-tts-nano-0.8` (15M, ~25MB int8 / ~56MB) — fastest, lowest quality
- `KittenML/kitten-tts-micro-0.8` (40M, ~41MB)
- `KittenML/kitten-tts-mini-0.8` (80M, ~80MB) — best quality

To switch models, update `MODEL_NAME` in `docker-compose.yml` and run:

```bash
docker compose up -d --build
```

## Reverse Proxy (nginx)

Add to your nginx server block:

```nginx
location /tts/ {
    proxy_pass http://127.0.0.1:8000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```
