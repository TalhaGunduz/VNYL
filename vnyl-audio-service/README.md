# VNYL Audio Service

This is a standalone Python service for audio analysis using Essentia.

## Purpose
- Genre Detection
- Mood & Energy Analysis
- BPM Detection

## Setup

1.  **Create Virtual Environment**:
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

2.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

3.  **Configuration**:
    Copy `.env.example` to `.env`:
    ```bash
    cp .env.example .env
    ```

4.  **Run Service**:
    ```bash
    uvicorn main:app --reload --port 8001
    ```

## Endpoints

- `GET /health`: Health check
