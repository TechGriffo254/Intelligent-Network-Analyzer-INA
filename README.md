# 🚀 Intelligent Network Analyzer (INA) 🌐

## 🛠️ Project Overview

**Intelligent Network Analyzer (INA)** is a comprehensive network monitoring and diagnostic platform designed to provide real-time visibility into network performance, security, and topology. This all-in-one solution combines automated diagnostics, traffic analysis, security monitoring, and machine learning to help IT professionals identify and resolve network issues efficiently.

## 🎯 Key Features

- 🔍 **Advanced Network Diagnostics**: Run comprehensive Ping and Traceroute operations with in-depth statistical analysis
- 🖧 **Network Discovery**: Automatically scan subnets to discover and map connected devices
- 📊 **Traffic Analysis**: Visualize protocol distribution, top talkers, and bandwidth utilization
- 🛡️ **Security Monitoring**: Track security alerts and potential threats with severity-based classification
- 📈 **Performance Metrics**: Monitor system resources and network performance in real-time
- 🧠 **Machine Learning-Powered Anomaly Detection**: Identify unusual network behavior using Isolation Forest algorithm
- 📜 **Historical Logging**: Maintain comprehensive logs of all network events for trend analysis
- 📱 **Responsive Interface**: Access all features through an intuitive tab-based dashboard

## 🧑‍💻 Tech Stack

### 🌐 Frontend
- **React.js** – Component-based UI architecture
- **Tailwind CSS** – Responsive styling with utility classes
- **Recharts** – Interactive data visualization components
- **Axios** – Promise-based HTTP client for API requests
- **React-Toastify** – User-friendly notification system

### ⚙️ Backend
- **FastAPI** – High-performance, easy-to-use API framework
- **Python 3.11** – Versatile language for network operations and data analysis
- **Scikit-learn** – Machine learning library for anomaly detection
- **Pandas & NumPy** – Data manipulation and analysis
- **Network Tools** – Integration with system-level network utilities

### 🛡️ DevOps
- **Docker** – Containerization for consistent deployment
- **Koyeb** – Cloud platform for backend hosting
- **Vercel** – Frontend deployment and hosting

## 🔄 System Architecture

```
┌─────────────────────────────────┐     ┌─────────────────────────────────┐
│           FRONTEND              │     │             BACKEND              │
│  ┌─────────────────────────┐   │     │  ┌─────────────────────────────┐ │
│  │       Dashboard         │   │     │  │    FastAPI Application      │ │
│  └─────────────────────────┘   │     │  └─────────────────────────────┘ │
│  ┌───────────┐ ┌───────────┐   │     │  ┌───────────┐ ┌───────────────┐ │
│  │ Network   │ │ Traffic   │   │     │  │ Network   │ │ Traffic       │ │
│  │ Discovery │ │ Analysis  │   │     │  │ Tools     │ │ Analysis      │ │
│  └───────────┘ └───────────┘   │     │  └───────────┘ └───────────────┘ │
│  ┌───────────┐ ┌───────────┐   │     │  ┌───────────┐ ┌───────────────┐ │
│  │ Security  │ │Performance│   │ ◄─► │  │ Security  │ │ ML-based      │ │
│  │ Monitoring│ │ Metrics   │   │     │  │ Monitoring│ │ Anomaly       │ │
│  └───────────┘ └───────────┘   │     │  └───────────┘ └───────────────┘ │
│  ┌───────────┐                 │     │  ┌───────────────────────────────┐│
│  │Diagnostics│                 │     │  │      Historical Logging       ││
│  └───────────┘                 │     │  └───────────────────────────────┘│
└─────────────────────────────────┘     └─────────────────────────────────┘
```

## 🚀 Live Demo

🌐 **Live URL:** [INA Live App](https://intelligent-network-analyzer-ina.vercel.app/)
🔧 **API Endpoint:** [INA API](https://ina-griffo.koyeb.app)

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/TechGriffo254/Intelligent-Network-Analyzer-INA.git
cd Intelligent-Network-Analyzer-INA
```

### 2️⃣ Backend Setup

```bash
cd ina-backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3️⃣ Frontend Setup

```bash
cd ina-frontend

# Install dependencies
npm install

# Start development server
npm start
```

### 4️⃣ Docker Deployment (Optional)

```bash
# Build and run backend container
docker build -t ina-backend ./ina-backend
docker run -p 8000:8000 ina-backend

# In a separate terminal, run frontend
cd ina-frontend
npm start
```

## 📡 API Endpoints

### Core Diagnostic Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/ping/{host}` | GET | Run ping diagnostic on specified host |
| `/traceroute/{host}` | GET | Perform traceroute to specified host |
| `/predict-anomalies/` | POST | Detect network anomalies using ML model |
| `/historical-logs/` | GET | Retrieve historical network events |

### Advanced Network Analysis

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/network/discover/{subnet}` | GET | Discover devices on a subnet |
| `/network/device/{ip}` | GET | Get detailed information about a device |
| `/traffic/analyze` | GET | Analyze current network traffic patterns |
| `/security/alerts` | GET | Get security alerts with optional filtering |
| `/performance/metrics` | GET | Get system performance metrics |
| `/dashboard/summary` | GET | Get consolidated summary for dashboard |

## 📊 Usage Examples

### Network Discovery
Scan your local subnet to identify all connected devices:

```javascript
const result = await fetch('/network/discover/192.168.1.0/24');
const devices = await result.json();
console.log(`Discovered ${devices.discovered_hosts} devices on the network`);
```

### Anomaly Detection
Submit network metrics to check for abnormal patterns:

```javascript
const response = await fetch('/predict-anomalies/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    avg_rtt: 89.7,
    max_rtt: 120.5,
    num_hops: 12
  })
});
const analysis = await response.json();
console.log(`Network status: ${analysis.result}`);
```

## 🧠 Machine Learning Implementation

The INA system uses an **Isolation Forest** algorithm for anomaly detection based on three key network metrics:

1. **Average Round Trip Time (RTT)**: Typical response time for network packets
2. **Maximum RTT**: Highest observed latency during testing
3. **Number of Hops**: Count of network segments traversed

The model identifies anomalies by detecting statistical outliers:
- **Normal traffic**: Consistent RTT values (typically <150ms) with predictable routing
- **Anomalous traffic**: Unusually high latency, packet loss, or unexpected routing changes

The system performs multiple test runs per operation to improve statistical reliability and reduce false positives.

## 🔧 Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| "Failed to fetch performance metrics" | API connection issue | Check Koyeb service status, verify network connectivity |
| "Network discovery failed" | Permission or subnet issues | Ensure proper network access, try a smaller subnet range |
| Blank or incomplete dashboard | Data loading error | Check browser console for errors, verify API connection |
| Authentication failures | Environment variables not set | Configure proper authentication credentials in .env file |

## 🌟 Advanced Features

### Real-time Monitoring
- **WebSocket Support**: Subscribe to real-time network events
- **Visual Alerts**: Immediate notification of critical issues
- **Trend Analysis**: Spot developing problems before they impact users

### Security Analysis
- **Threat Detection**: Identify suspicious network activity
- **Alert Classification**: Prioritize issues by severity level
- **Security Dashboard**: Comprehensive security overview

### Network Visualization
- **Interactive Topology**: Visual representation of network devices
- **Performance Graphs**: Real-time metrics visualization
- **Traffic Flow Analysis**: Identify bandwidth utilization patterns

## 🗂️ Project Structure

```plaintext
📂 Intelligent-Network-Analyzer
   ├── 📁 ina-backend
   │   ├── main.py                  # FastAPI application
   │   ├── network_discovery.py     # Network discovery module
   │   ├── traffic_analysis.py      # Traffic analysis module
   │   ├── network_anomaly_model.pkl # Pre-trained ML model
   │   ├── requirements.txt         # Backend dependencies
   │   └── Dockerfile               # Backend container config
   │
   ├── 📁 ina-frontend
   │   ├── public/                  # Static assets
   │   ├── src/
   │   │   ├── App.js               # Main application component
   │   │   ├── api.js               # API client functions
   │   │   └── index.js             # Application entry point
   │   ├── package.json             # Frontend dependencies
   │   └── tailwind.config.js       # Tailwind CSS configuration
   │
   ├── 📄 docker-compose.yml        # Multi-container config
   └── 📄 README.md                 # Project documentation
```

## 🚀 Future Roadmap

- 🔐 **User Authentication**: Role-based access control for team environments
- 🔍 **Deep Packet Inspection**: Advanced protocol analysis
- 📱 **Mobile Application**: Native mobile client for on-the-go monitoring
- 🤖 **Automated Remediation**: AI-powered issue resolution suggestions
- 🔌 **Integration APIs**: Connect with other IT management systems
- 🌐 **Multi-site Monitoring**: Support for distributed network environments

## 👥 Contributors

👨‍💻 **Mudenyo Griffins** – Project Lead & Developer (COM/0065/21)  
🏫 **Kibabii University** – Bachelor of Science in Computer Science

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

📧 **Contact**: [griffinsmudenyo@gmail.com](mailto:griffinsmudenyo@gmail.com)  
🔗 **GitHub**: [TechGriffo254](https://github.com/TechGriffo254)
