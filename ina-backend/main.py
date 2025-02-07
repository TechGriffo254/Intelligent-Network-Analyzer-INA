from fastapi import FastAPI
import subprocess

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
