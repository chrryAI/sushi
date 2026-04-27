FROM python:3.11-slim

WORKDIR /app

# Sistem bağımlılıkları (soundfile libsndfile için)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# KittenTTS ve API bağımlılıkları
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn[standard] \
    soundfile \
    numpy \
    https://github.com/KittenML/KittenTTS/releases/download/0.8.1/kittentts-0.8.1-py3-none-any.whl

COPY main.py .

ENV MODEL_NAME=KittenML/kitten-tts-nano-0.8
ENV HF_HOME=/cache/huggingface

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
