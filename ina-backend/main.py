from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import subprocess
import joblib
import numpy as np
import logging

# Initialize FastAPI app
app = FastAPI()

# ✅ Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Setup logging
logging.basicConfig(level=logging.INFO)

# 📊 Model input schema
class AnomalyInput(BaseModel):
    avg_rtt: float
    max_rtt: float
    num_hops: int
    packet_loss: float
    jitter: float

# ✅ Ping Endpoint
@app.get("/ping/{host}")
def ping(host: str):
    try:
        # Run ping with IPv4 enforcement
        result = subprocess.run(["ping", "-c", "4", "-4", host], capture_output=True, text=True)
        if result.returncode == 0 and result.stdout:
            return {"host": host, "output": result.stdout}
        else:
            return {"error": f"Ping failed: {result.stderr}"}
    except Exception as e:
        return {"error": str(e)}


@app.get("/traceroute/{host}")
def traceroute(host: str):
    try:
        # Run traceroute without DNS resolution for better performance
        result = subprocess.run(["traceroute", "-n", host], capture_output=True, text=True)
        if result.returncode == 0 and result.stdout:
            return {"host": host, "output": result.stdout}
        else:
            return {"error": f"Traceroute failed: {result.stderr}"}
    except Exception as e:
        return {"error": str(e)}

# ✅ Load Machine Learning Model
model_path = os.path.join(os.path.dirname(__file__), "network_anomaly_model.pkl")
model = joblib.load(model_path) if os.path.exists(model_path) else None

# ✅ Traffic Patterns Analysis
@app.get("/traffic-patterns/")
def traffic_patterns():
    try:
        sample_data = {
            "latency_spike": "Detected at 3:42 PM (200ms spike)",
            "packet_loss_trend": "Consistent 5% packet loss in the last 30 min",
            "anomaly_frequency": "3 anomalies detected in the past hour"
        }
        return sample_data
    except Exception as e:
        logging.error(f"Traffic pattern error: {e}")
        return {"error": str(e)}

# ✅ Predict Anomalies
@app.post("/predict-anomalies/")
def predict_anomalies(data: AnomalyInput):
    if model is None:
        return {"error": "Model file not found."}
    
    # Only use the first 3 features that the model expects
    input_data = np.array([[data.avg_rtt, data.max_rtt, data.num_hops]])
    
    try:
        prediction = model.predict(input_data)
        if prediction[0] == -1:
            return {"result": "Anomaly detected!", "details": "Potential network issue or attack."}
        else:
            return {"result": "Normal traffic", "details": "No anomalies detected."}
    except Exception as e:
        return {"error": f"Prediction failed: {str(e)}"}S
        return {"error": f"Prediction failed: {str(e)}"}

# ✅ Historical Logs
logs = []

@app.get("/historical-logs/")
def historical_logs():
    try:
        return {"logs": logs}
    except Exception as e:
        logging.error(f"Historical logs error: {e}")
        return {"error": str(e)}

# ✅ Helper: Update logs
def update_historical_logs(event):
    logs.append({"timestamp": get_current_time(), "event": event})
    if len(logs) > 100:
        logs.pop(0)

# ✅ Helper: Get current time
from datetime import datetime
def get_current_time():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

# ✅ Health Check
@app.get("/")
def home():
    return {"message": "Welcome to Intelligent Network Analyzer (INA) API"}

