from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import subprocess
import joblib
import numpy as np
import logging
from datetime import datetime

# Initialize FastAPI app
app = FastAPI()

#  Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#  Setup logging
logging.basicConfig(level=logging.INFO)

#  Model input schema with only 3 fields
class AnomalyInput(BaseModel):
    avg_rtt: float
    max_rtt: float
    num_hops: int

#  In-memory log storage
logs = []

# Helper: Get current time
def get_current_time():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

# Helper: Update logs
def update_historical_logs(event):
    logs.append({"timestamp": get_current_time(), "event": event})
    if len(logs) > 100:
        logs.pop(0)

#  Ping Endpoint
@app.get("/ping/{host}")
def ping(host: str):
    try:
        result = subprocess.run(["ping", "-c", "4", "-4", host], capture_output=True, text=True)
        if result.returncode == 0 and result.stdout:
            update_historical_logs(f"Ping test for {host}")
            return {"host": host, "output": result.stdout}
        else:
            return {"error": f"Ping failed: {result.stderr}"}
    except Exception as e:
        return {"error": str(e)}

#  Traceroute Endpoint
@app.get("/traceroute/{host}")
def traceroute(host: str):
    try:
        result = subprocess.run(["traceroute", "-n", host], capture_output=True, text=True)
        if result.returncode == 0 and result.stdout:
            update_historical_logs(f"Traceroute test for {host}")
            return {"host": host, "output": result.stdout}
        else:
            return {"error": f"Traceroute failed: {result.stderr}"}
    except Exception as e:
        return {"error": str(e)}

#  Load Machine Learning Model
model_path = os.path.join(os.path.dirname(__file__), "network_anomaly_model.pkl")
model = joblib.load(model_path) if os.path.exists(model_path) else None

#  Predict Anomalies
@app.post("/predict-anomalies/")
def predict_anomalies(data: AnomalyInput):
    if model is None:
        return {"error": "Model file not found."}
    
    #  Only use the 3 features that the model expects
    input_data = np.array([[data.avg_rtt, data.max_rtt, data.num_hops]])
    
    try:
        prediction = model.predict(input_data)
        result = "Anomaly detected!" if prediction[0] == -1 else "Normal traffic"
        update_historical_logs(f"Anomaly detection run - Result: {result}")
        return {"result": result}
    except Exception as e:
        return {"error": f"Prediction failed: {str(e)}"}

# Historical Logs
@app.get("/historical-logs/")
def historical_logs():
    try:
        return {"logs": logs}
    except Exception as e:
        logging.error(f"Historical logs error: {e}")
        return {"error": str(e)}

#  Health Check
@app.get("/")
def home():
    return {"message": "Welcome to Intelligent Network Analyzer (INA) API"}
