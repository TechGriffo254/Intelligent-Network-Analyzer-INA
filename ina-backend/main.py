from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import subprocess
import joblib

app = FastAPI()

# ✅ Allow frontend access (Fix CORS Issues)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all frontend origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

class AnomalyInput(BaseModel):
    avg_rtt: float
    max_rtt: float
    num_hops: int

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
    
    input_data = [[data.avg_rtt, data.max_rtt, data.num_hops]]
    prediction = model.predict(input_data)
    return {"result": "Anomaly detected!" if prediction[0] == -1 else "Normal traffic"}
