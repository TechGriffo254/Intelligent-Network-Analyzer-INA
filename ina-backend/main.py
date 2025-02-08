from fastapi import FastAPI
import subprocess
from scapy.all import sniff  # Importing Scapy's sniff function

app = FastAPI()

@app.get("/")
def home():
    return {"message": "Welcome to Intelligent Network Analyzer (INA) API"}

@app.get("/ping/{host}")
def ping(host: str):
    try:
        result = subprocess.run(["ping", "-n", "4", host], capture_output=True, text=True)
        return {"host": host, "output": result.stdout}
    except Exception as e:
        return {"error": str(e)}

@app.get("/traceroute/{host}")
def traceroute(host: str):
    try:
        result = subprocess.run(["tracert", host], capture_output=True, text=True, shell=True)
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

# Capture network packets using TShark (Wireshark CLI)
@app.get("/tshark/{count}")
def tshark_capture(count: int):
    try:
        # Use interface 6 (Wi-Fi) for packet capture
        result = subprocess.run(["tshark", "-i", "6", "-c", str(count)], capture_output=True, text=True, timeout=10)
        return {"packets": result.stdout}
    except subprocess.TimeoutExpired:
        return {"error": "TShark took too long to respond."}
    except Exception as e:
        return {"error": str(e)}

