from fastapi import FastAPI
import subprocess
import joblib
import numpy as np
from scapy.all import sniff  # Importing Scapy's sniff function

app = FastAPI()

@app.get("/")
def home():
    return {"message": "Welcome to Intelligent Network Analyzer (INA) API"}

@app.get("/ping/{host}")
def ping(host: str):
    try:
        # Use correct ping format for Linux (Koyeb)
        result = subprocess.run(["ping", "-c", "4", host], capture_output=True, text=True)
        return {"host": host, "output": result.stdout}
    except Exception as e:
        return {"error": str(e)}

@app.get("/traceroute/{host}")
def traceroute(host: str):
    try:
        # Use ICMP for better results on cloud servers
        result = subprocess.run(["traceroute", "-I", host], capture_output=True, text=True)
        return {"host": host, "output": result.stdout}
    except Exception as e:
        return {"error": str(e)}


@app.get("/dnslookup/{domain}")
def dns_lookup(domain: str):
    try:
        result = subprocess.run(["nslookup", domain], capture_output=True, text=True, shell=True)
        return {"domain": domain, "output": result.stdout}
    except Exception as e:
        return {"error": str(e)}

# Capture network packets using Scapy
@app.get("/capture/{count}")
def capture_packets(count: int):
    try:
        packets = sniff(count=count)  # Capture packets
        packet_info = [{"summary": pkt.summary()} for pkt in packets]
        return {"captured_packets": packet_info}
    except Exception as e:
        return {"error": str(e)}


@app.get("/tshark/{count}")
def tshark_capture(count: int):
    try:
       
        result = subprocess.run(["tshark", "-i", "6", "-c", str(count)], capture_output=True, text=True, timeout=10)
        return {"packets": result.stdout}
    except subprocess.TimeoutExpired:
        return {"error": "TShark took too long to respond."}
    except Exception as e:
        return {"error": str(e)}

model = joblib.load("network_anomaly_model.pkl")

@app.get("/predict-anomalies/")
def predict_anomalies(packet_size: float, response_time: float, connections: float):
    try:
        # Prepare input for the model
        input_data = np.array([[packet_size, response_time, connections]])
        prediction = model.predict(input_data)

        if prediction[0] == -1:
            return {"result": "Anomaly detected!", "details": "Potential network issue or attack."}
        else:
            return {"result": "Normal traffic", "details": "No anomalies detected."}
    except Exception as e:
        return {"error": str(e)}