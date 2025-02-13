from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import subprocess
import joblib
import numpy as np

app = FastAPI()

# ✅ Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnomalyInput(BaseModel):
    avg_rtt: float
    max_rtt: float
    num_hops: int
    packet_loss: float
    jitter: float

@app.get("/ping/{host}")
def ping(host: str):
    result = subprocess.run(["ping", "-c", "4", host], capture_output=True, text=True)
    return {"host": host, "output": result.stdout}

@app.get("/traceroute/{host}")
def traceroute(host: str):
    result = subprocess.run(["traceroute", "-I", host], capture_output=True, text=True)
    return {"host": host, "output": result.stdout}

model_path = os.path.join(os.path.dirname(__file__), "network_anomaly_model.pkl")
model = joblib.load(model_path) if os.path.exists(model_path) else None

@app.post("/predict-anomalies/")
def predict_anomalies(data: AnomalyInput):
    if model is None:
        return {"error": "Model file not found."}
    
    input_data = np.array([[data.avg_rtt, data.max_rtt, data.num_hops, data.packet_loss, data.jitter]])
    prediction = model.predict(input_data)

    if prediction[0] == -1:
        return {"result": "Anomaly detected!", "details": "Potential network issue or attack."}
    else:
        return {"result": "Normal traffic", "details": "No anomalies detected."}
