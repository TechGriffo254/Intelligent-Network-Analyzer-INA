from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from network_discovery import network_discovery
from traffic_analysis import traffic_analyzer

import os
import subprocess
import joblib
import numpy as np
import logging
from datetime import datetime
import asyncio

# Initialize FastAPI app
app = FastAPI()

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Consider restricting this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Model input schema with only 3 fields
class AnomalyInput(BaseModel):
    avg_rtt: float
    max_rtt: float
    num_hops: int

# In-memory log storage
logs = []

# Helper: Get current time
def get_current_time():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

# Helper: Update logs
def update_historical_logs(event):
    logs.append({"timestamp": get_current_time(), "event": event})
    if len(logs) > 100:
        logs.pop(0)

# Helper: Run command asynchronously
async def run_command(command):
    process = await asyncio.create_subprocess_exec(*command, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
    stdout, stderr = await process.communicate()
    return process.returncode, stdout.decode(), stderr.decode()

# Ping Endpoint
@app.get("/ping/{host}")
async def ping(host: str):
    try:
        returncode, stdout, stderr = await run_command(["ping", "-c", "4", "-4", host])
        if returncode == 0:
            update_historical_logs(f"Ping test for {host}")
            return {"host": host, "output": stdout}
        else:
            raise HTTPException(status_code=400, detail=f"Ping failed: {stderr}")
    except Exception as e:
        logging.error(f"Error pinging {host}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Traceroute Endpoint
@app.get("/traceroute/{host}")
async def traceroute(host: str):
    try:
        returncode, stdout, stderr = await run_command(["traceroute", "-n", host])
        if returncode == 0:
            update_historical_logs(f"Traceroute test for {host}")
            return {"host": host, "output": stdout}
        else:
            raise HTTPException(status_code=400, detail=f"Traceroute failed: {stderr}")
    except Exception as e:
        logging.error(f"Error tracerouting {host}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Load Machine Learning Model
model_path = os.path.join(os.path.dirname(__file__), "network_anomaly_model.pkl")
model = joblib.load(model_path) if os.path.exists(model_path) else None

# Predict Anomalies
@app.post("/predict-anomalies/")
def predict_anomalies(data: AnomalyInput):
    if model is None:
        raise HTTPException(status_code=500, detail="Model file not found.")
    
    input_data = np.array([[data.avg_rtt, data.max_rtt, data.num_hops]])
    
    try:
        prediction = model.predict(input_data)
        result = "Anomaly detected!" if prediction[0] == -1 else "Normal traffic"
        update_historical_logs(f"Anomaly detection run - Result: {result}")
        return {"result": result}
    except Exception as e:
        logging.error(f"Prediction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Historical Logs
@app.get("/historical-logs/")
def historical_logs():
    try:
        return {"logs": logs}
    except Exception as e:
        logging.error(f"Historical logs error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Health Check
@app.get("/")
def home():
    return {"message": "Welcome to Intelligent Network Analyzer (INA) API"}
# Network Discovery Endpoint
@app.get("/network/discover/{subnet}")
async def discover_network(subnet: str):
    """Discover devices on a subnet (e.g., 192.168.1.0/24)"""
    result = await network_discovery.discover_network(subnet)
    if "error" not in result:
        update_historical_logs(f"Network discovery on {subnet}")
    return result
# Traffic Analysis Endpoint
@app.get("/traffic/analyze")
async def analyze_traffic():
    """Analyze current network traffic"""
    result = await traffic_analyzer.analyze_network_traffic()
    if "error" not in result:
        update_historical_logs("Traffic analysis performed")
    return result