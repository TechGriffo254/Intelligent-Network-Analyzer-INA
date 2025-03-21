from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import network_discovery
import traffic_analysis

import os
import subprocess
import joblib
import numpy as np
import logging
from datetime import datetime
import asyncio
import ipaddress
import platform
import json

# Initialize FastAPI app
app = FastAPI(
    title="Intelligent Network Analyzer (INA) API",
    description="Advanced network monitoring and diagnostic platform",
    version="1.0.0"
)

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
alerts = []
performance_data = []

# Helper: Get current time
def get_current_time():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

# Helper: Update logs
def update_historical_logs(event):
    timestamp = get_current_time()
    logs.append({"timestamp": timestamp, "event": event})
    
    # Also add to performance data for trending
    performance_data.append({
        "timestamp": timestamp,
        "event_type": event.split(" ")[0],  # First word as event type
        "count": 1
    })
    
    # Limit log size
    if len(logs) > 100:
        logs.pop(0)
    if len(performance_data) > 200:
        performance_data.pop(0)

# Helper: Run command asynchronously
async def run_command(command):
    process = await asyncio.create_subprocess_exec(*command, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
    stdout, stderr = await process.communicate()
    return process.returncode, stdout.decode(), stderr.decode()

# Helper: Create a security alert
def create_security_alert(severity, title, description, source=None):
    alert_id = len(alerts) + 1
    alert = {
        "id": f"ALERT-{alert_id}",
        "timestamp": get_current_time(),
        "severity": severity,  # critical, high, medium, low
        "title": title,
        "description": description,
        "source": source or "System",
        "status": "new"
    }
    alerts.append(alert)
    update_historical_logs(f"Security alert: {title} ({severity})")
    
    # Limit alerts size
    if len(alerts) > 100:
        alerts.pop(0)
    
    return alert

# Ping Endpoint
@app.get("/ping/{host}")
async def ping(host: str):
    try:
        # Platform-specific ping command
        if platform.system().lower() == "windows":
            command = ["ping", "-n", "4", host]
        else:  # Linux/Mac
            command = ["ping", "-c", "4", "-4", host]
            
        returncode, stdout, stderr = await run_command(command)
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
        # Platform-specific traceroute command
        if platform.system().lower() == "windows":
            command = ["tracert", host]
        else:  # Linux/Mac
            command = ["traceroute", "-n", host]
            
        returncode, stdout, stderr = await run_command(command)
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
        
        # Create security alert if anomaly detected
        if prediction[0] == -1:
            create_security_alert(
                "high", 
                "Network Anomaly Detected", 
                f"Unusual network behavior detected: RTT={data.avg_rtt}ms, Max RTT={data.max_rtt}ms, Hops={data.num_hops}",
                "ML Model"
            )
        
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

# Network Discovery Endpoint
@app.get("/network/discover/{subnet}")
async def discover_network(subnet: str):
    """Discover devices on a subnet (e.g., 192.168.1.0/24)"""
    try:
        result = await network_discovery.discover_network(subnet)
        if "error" not in result:
            update_historical_logs(f"Network discovery on {subnet}")
            
            # Check for suspicious devices
            if result.get("discovered_hosts", 0) > 0:
                unknown_devices = [d for d in result.get("devices", []) if not d.get("hostname")]
                if len(unknown_devices) > 3:  # More than 3 unknown devices could be suspicious
                    create_security_alert(
                        "medium",
                        "Multiple Unknown Devices Detected",
                        f"Found {len(unknown_devices)} devices without hostnames on subnet {subnet}",
                        "Network Discovery"
                    )
        return result
    except Exception as e:
        logging.error(f"Network discovery error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Device Details endpoint
@app.get("/network/device/{ip}")
async def get_device_details(ip: str):
    """Get detailed information about a device"""
    try:
        result = await network_discovery.check_host(ip)
        if not result:
            raise HTTPException(status_code=404, detail=f"Device {ip} not found or not responding")
        update_historical_logs(f"Device details check for {ip}")
        return result
    except Exception as e:
        logging.error(f"Device details error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Traffic Analysis endpoint
@app.get("/traffic/analyze")
async def analyze_traffic():
    """Analyze current network traffic"""
    try:
        result = await traffic_analyzer.analyze_network_traffic()
        if "error" not in result:
            update_historical_logs("Traffic analysis performed")
            
            # Check for abnormal traffic patterns
            if result.get("topSources") and len(result["topSources"]) > 0:
                top_source = result["topSources"][0]
                if top_source.get("value", 0) > 50:  # Threshold for suspicious traffic
                    create_security_alert(
                        "medium",
                        "High Volume Traffic Source",
                        f"Unusually high traffic from {top_source.get('ip', 'unknown')}: {top_source.get('value')} connections",
                        "Traffic Analysis"
                    )
        return result
    except Exception as e:
        logging.error(f"Traffic analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Security Alerts endpoint
@app.get("/security/alerts")
async def get_security_alerts(severity: str = None):
    """Get security alerts with optional filtering by severity"""
    try:
        if severity:
            filtered_alerts = [a for a in alerts if a["severity"] == severity]
        else:
            filtered_alerts = alerts
            
        # Count by severity
        counts = {
            "critical": len([a for a in alerts if a["severity"] == "critical"]),
            "high": len([a for a in alerts if a["severity"] == "high"]),
            "medium": len([a for a in alerts if a["severity"] == "medium"]),
            "low": len([a for a in alerts if a["severity"] == "low"])
        }
        
        return {
            "alerts": filtered_alerts,
            "total": len(filtered_alerts),
            "counts": counts
        }
    except Exception as e:
        logging.error(f"Security alerts error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Performance Monitoring endpoint
@app.get("/performance/metrics")
async def get_performance_metrics():
    """Get system performance metrics"""
    try:
        # In a real implementation, you'd collect CPU, memory, etc.
        # Here we'll just return some activity stats from our logs
        
        # Group performance data by event type and count
        event_counts = {}
        for item in performance_data:
            event_type = item["event_type"]
            if event_type not in event_counts:
                event_counts[event_type] = 0
            event_counts[event_type] += 1
        
        # Calculate response times (simulate with random values)
        import random
        current_ping_time = random.uniform(10, 100)
        current_cpu_usage = random.uniform(5, 95)
        current_memory_usage = random.uniform(20, 80)
        
        metrics = {
            "ping_response_time": current_ping_time,
            "cpu_usage_percent": current_cpu_usage,
            "memory_usage_percent": current_memory_usage,
            "activity": [{"name": k, "value": v} for k, v in event_counts.items()],
            "events_last_hour": len(performance_data)
        }
        
        return metrics
    except Exception as e:
        logging.error(f"Performance metrics error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Dashboard Summary endpoint
@app.get("/dashboard/summary")
async def get_dashboard_summary():
    """Get consolidated summary for dashboard"""
    try:
        # Get the latest network discovery data (if any)
        network_data = {"devices": 0, "subnets": 0}
        
        # Get latest traffic data (simulation)
        traffic_data = await traffic_analyzer.analyze_network_traffic()
        
        # Get alerts summary
        alert_counts = {
            "critical": len([a for a in alerts if a["severity"] == "critical"]),
            "high": len([a for a in alerts if a["severity"] == "high"]),
            "medium": len([a for a in alerts if a["severity"] == "medium"]),
            "low": len([a for a in alerts if a["severity"] == "low"])
        }
        
        # Get recent logs
        recent_logs = logs[-10:] if logs else []
        
        # Calculate overall system health
        total_alerts = sum(alert_counts.values())
        if alert_counts["critical"] > 0:
            health_status = "critical"
        elif alert_counts["high"] > 2:
            health_status = "warning"
        elif total_alerts > 5:
            health_status = "concerning"
        else:
            health_status = "healthy"
        
        return {
            "status": health_status,
            "alerts": {
                "counts": alert_counts,
                "total": total_alerts,
                "recent": alerts[-5:] if alerts else []
            },
            "traffic": traffic_data if traffic_data and "error" not in traffic_data else None,
            "network": network_data,
            "recent_logs": recent_logs
        }
    except Exception as e:
        logging.error(f"Dashboard summary error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Health Check
@app.get("/")
def home():
    return {"message": "Welcome to Intelligent Network Analyzer (INA) API", "status": "running"}