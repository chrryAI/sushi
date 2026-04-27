import io
import os

import soundfile as sf
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from kittentts import KittenTTS
from pydantic import BaseModel

app = FastAPI(title="KittenTTS API")

MODEL_NAME = os.getenv("MODEL_NAME", "KittenML/kitten-tts-nano-0.8")

print(f"Loading KittenTTS model: {MODEL_NAME}")
model = KittenTTS(MODEL_NAME)
print("Model loaded.")


class TTSRequest(BaseModel):
    text: str
    voice: str = "Jasper"
    speed: float = 1.0
    clean_text: bool = True


@app.post("/tts")
def tts(req: TTSRequest):
    try:
        audio = model.generate(
            req.text, voice=req.voice, speed=req.speed, clean_text=req.clean_text
        )
        buf = io.BytesIO()
        sf.write(buf, audio, 24000, format="WAV")
        buf.seek(0)
        return StreamingResponse(buf, media_type="audio/wav")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/voices")
def voices():
    return {"voices": model.available_voices}


@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_NAME}
