# 🚀 Intelligent Network Analyzer (INA) 🌐

## 🛠️ Project Overview

**Intelligent Network Analyzer (INA)** is a powerful web-based application designed to monitor, analyze, and detect anomalies in network traffic in real-time. It provides actionable insights into network performance using **Ping**, **Traceroute**, and **Anomaly Detection** techniques.

## 🎯 Key Features

- 🔍 **Real-Time Network Analysis**: Perform **Ping** and **Traceroute** operations with real-time data visualization
- 🧠 **Anomaly Detection**: Uses a **Machine Learning model** to identify abnormal network behavior
- 📊 **Interactive Charts**: Displays network metrics with **intuitive, real-time charts**
- 🛎️ **User Feedback**: Interactive loaders and **toast notifications** for ongoing operations
- 📖 **Historical Logs**: Track past network events with a **dedicated chart**
- ⚙️ **Cross-Platform Compatibility**: Runs seamlessly across **different network environments**

## 🧑‍💻 Tech Stack

### 🌐 Frontend
- **React.js** – Interactive user interface
- **Recharts** – Real-time network metrics visualization
- **React-Toastify** – Real-time notifications

### ⚙️ Backend
- **FastAPI** – High-performance API framework
- **Python (scikit-learn)** – **Machine Learning-based anomaly detection**
- **Joblib** – **Model persistence**
- **Subprocess** – **Ping/Traceroute execution**

### ☁️ Deployment
- **Koyeb** – Cloud-based deployment platform

## 🚀 Live Demo

🌐 **Live URL:** [INA Live App](https://ina-griffo.koyeb.app)

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/TechGriffo254/-Intelligent-Network-Analyzer-INA.git
cd -Intelligent-Network-Analyzer-INA
```

### 2️⃣ Backend Setup

```bash
cd ina-backend
python -m venv venv

# Windows
source venv/Scripts/activate

# Linux/Mac
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3️⃣ Frontend Setup

```bash
cd ../ina-frontend
npm install
npm start
```

## 📡 API Endpoints

### 1. Ping a Host

- **URL:** `/ping/{host}`
- **Method:** GET
- **Description:** Sends 4 ICMP Echo Requests to the target host

**Example:**
```bash
GET /ping/google.com
```

**Sample Response:**
```json
{
  "host": "google.com",
  "output": [
    "PING google.com (142.250.180.206): 56 data bytes",
    "64 bytes from 142.250.180.206: icmp_seq=0 ttl=118 time=24.3 ms",
    "--- google.com ping statistics ---",
    "4 packets transmitted, 4 packets received, 0.0% packet loss",
    "round-trip min/avg/max/stddev = 23.2/24.4/26.1/0.5 ms"
  ]
}
```

### 2. Traceroute a Host

- **URL:** `/traceroute/{host}`
- **Method:** GET
- **Description:** Traces the network path to a specified host

**Example:**
```bash
GET /traceroute/google.com
```

**Sample Response:**
```json
{
  "host": "google.com",
  "output": [
    "1 192.168.1.1 1.2 ms",
    "2 10.10.10.1 3.5 ms",
    "3 142.250.180.206 24.1 ms"
  ]
}
```

### 3. Predict Network Anomalies

- **URL:** `/predict-anomalies/`
- **Method:** POST
- **Description:** Uses an Isolation Forest model to predict network anomalies based on RTT and hops

**Request Body:**
```json
{
  "avg_rtt": 100,
  "max_rtt": 150,
  "num_hops": 5
}
```

**Sample Response:**
```json
{
  "result": "Normal traffic",
  "details": "No anomalies detected."
}
```

### 4. Retrieve Historical Logs

- **URL:** `/historical-logs/`
- **Method:** GET
- **Description:** Retrieves historical network events

**Sample Response:**
```json
{
  "logs": [
    {"timestamp": "2025-02-10 14:00", "event": "Ping to google.com - 50ms"},
    {"timestamp": "2025-02-10 14:05", "event": "Traceroute anomaly detected"},
    {"timestamp": "2025-02-10 14:10", "event": "Anomaly detected: high latency"}
  ]
}
```

## 🧠 Understanding the Anomaly Detection

The Isolation Forest model is trained to detect anomalies based on:
- Average Round Trip Time (RTT)
- Maximum Round Trip Time (RTT)
- Number of Hops

**Normal traffic** typically has:
- RTT values ≈ 100ms
- Low variability in RTT across runs

**Anomalous traffic:**
- High RTT spikes (> 300ms)
- Irregular traceroute paths

The app uses 5 runs of Ping/Traceroute per click to improve accuracy.

## ⚠️ Troubleshooting

### ❌ 1. "Failed to fetch network data for anomaly detection."
**Cause:** Ping/Traceroute APIs failed to return results
**Fix:**
- Ensure network connectivity
- Restart backend if the issue persists

### ❌ 2. Anomaly Detection Always Says "Anomaly Detected"
**Cause:** Model trained incorrectly
**Fix:**
- Retrain the model locally using retrain_model.py
- Upload the new network_anomaly_model.pkl to Koyeb

Run the retrain script:
```bash
python retrain_model.py
```

### ❌ 3. Blank Frontend Screen
**Cause:** Missing dependencies
**Fix:**
```bash
npm install react-toastify recharts axios
npm start
```

## 🎯 Future Improvements

- 🤖 **Model Optimization:** Improve anomaly detection accuracy with better training data
- 📊 **Customizable Analysis:** Allow users to customize the number of Ping/Traceroute runs
- ⚙️ **Advanced Diagnostics:** Include DNS lookup and packet capture

## 📖 Project Structure

```plaintext
📂 Intelligent-Network-Analyzer
   ├── 📁 ina-backend
   │   ├── main.py                # FastAPI server
   │   ├── retrain_model.py       # Model retraining
   │   ├── network_anomaly_model.pkl # Pretrained ML model
   │   └── requirements.txt       # Backend dependencies
   │
   ├── 📁 ina-frontend
   │   ├── src
   │   │   ├── App.js            # React main component
   │   │   ├── api.js            # Frontend API logic
   │   │   └── index.js          # App entry point
   │   ├── package.json          # Frontend dependencies
   │   └── public                # Static files
   │
   └── 📄 README.md               # Project documentation
```

## 🎯 Contributors

👨‍💻 Mudenyo Griffins – Lead Developer

## 📜 License

🛡️ MIT License – Free for commercial and personal use.
