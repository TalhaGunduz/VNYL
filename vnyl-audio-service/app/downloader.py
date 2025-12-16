import os
import urllib.request
import ssl

MODEL_DIR = "models"
MODELS = {
    # Genre (Discogs 400 - Effnet)
    "genre_discogs400.pb": "https://essentia.upf.edu/models/classification-heads/genre_discogs400/genre_discogs400-discogs-effnet-1.pb",
    "genre_discogs400_metadata.json": "https://essentia.upf.edu/models/classification-heads/genre_discogs400/genre_discogs400-discogs-effnet-1.json",
    
    # Embedding Model (Required for Genre)
    "discogs-effnet-bs64-1.pb": "https://essentia.upf.edu/models/feature-extractors/discogs-effnet/discogs-effnet-bs64-1.pb"
}

def download_models():
    if not os.path.exists(MODEL_DIR):
        os.makedirs(MODEL_DIR)
        print(f"Created directory: {MODEL_DIR}")

    # Bypass SSL verification
    ssl._create_default_https_context = ssl._create_unverified_context

    for filename, url in MODELS.items():
        path = os.path.join(MODEL_DIR, filename)
        if not os.path.exists(path):
            print(f"Downloading {filename}...")
            try:
                urllib.request.urlretrieve(url, path)
                print(f"Downloaded {filename}")
            except Exception as e:
                print(f"Failed to download {filename}: {e}")
        else:
            print(f"Skipping {filename} (already exists)")

if __name__ == "__main__":
    download_models()
