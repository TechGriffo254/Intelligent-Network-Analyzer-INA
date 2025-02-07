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
