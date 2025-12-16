import os
import essentia.standard as es
import numpy as np

# Mock execution to check if algorithms load
try:
    print("Checking Essential Version...")
    import essentia
    print(f"Version: {essentia.__version__}")

    print("Checking for TensorflowPredictEffnetDiscogs...")
    try:
        # Just instantiate to check existence
        algo = es.TensorflowPredictEffnetDiscogs(graphFilename="models/discogs-effnet-bs64-1.pb")
        print("TensorflowPredictEffnetDiscogs FOUND and LOADED.")
    except AttributeError:
        print("TensorflowPredictEffnetDiscogs NOT FOUND in essentia.standard")
    except Exception as e:
        print(f"Error loading TensorflowPredictEffnetDiscogs: {e}")

    print("Checking for TensorflowPredict2D...")
    try:
        algo2 = es.TensorflowPredict2D(graphFilename="models/genre_discogs400.pb")
        print("TensorflowPredict2D FOUND and LOADED.")
    except AttributeError:
        print("TensorflowPredict2D NOT FOUND in essentia.standard")
    except Exception as e:
        print(f"Error loading TensorflowPredict2D: {e}")

except Exception as e:
    print(f"General Error: {e}")
