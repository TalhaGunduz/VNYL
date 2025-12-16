from fastapi import FastAPI
from app.analyzer import analyze_genre, analyze_mood, analyze_bpm
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title=os.getenv("SERVICE_NAME", "vnyl-audio-service"))

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/analyze/full")
async def get_full_analysis(path: str):
    from app.analyzer import analyze_full
    return analyze_full(path)

@app.get("/analyze/genre")
async def get_genre(path: str):
    return analyze_genre(path)

@app.get("/analyze/mood")
async def get_mood(path: str):
    return analyze_mood(path)

@app.get("/analyze/bpm")
async def get_bpm(path: str):
    return analyze_bpm(path)
