import axios from "axios";

const BASE_URL = "https://ina-griffo.koyeb.app";

// ✅ Format raw text output into an array
const formatOutput = (text) => {
  if (!text) return ["No response received"];
  return text.split("\n").filter((line) => line.trim() !== "");
};

// ✅ Extract metrics from Ping output
export const parsePingData = (pingOutput) => {
  const lines = pingOutput.split("\n");
  let avgRTT = 0, maxRTT = 0, hops = 0;
  lines.forEach((line) => {
    if (line.includes("rtt min/avg/max/mdev")) {
      const rttValues = line.match(/([\d.]+)\/([\d.]+)\/([\d.]+)\/([\d.]+)/);
      avgRTT = parseFloat(rttValues[2]);
      maxRTT = parseFloat(rttValues[3]);
    }
  });
  return { avgRTT, maxRTT, hops };
};

// ✅ Extract metrics from Traceroute output
export const parseTracerouteData = (tracerouteOutput) => {
  const lines = tracerouteOutput.split("\n");
  const hops = lines.length - 1;
  let maxRTT = 0;
  lines.forEach((line) => {
    const match = line.match(/(\d+\.\d+)\sms/);
    if (match) {
      const rtt = parseFloat(match[1]);
      if (rtt > maxRTT) maxRTT = rtt;
    }
  });
  return { hops, maxRTT };
};

// ✅ Ping API Call
export const pingServer = async (host) => {
  try {
    const response = await axios.get(`${BASE_URL}/ping/${host}`);
    return { host: response.data.host, output: formatOutput(response.data.output) };
  } catch (error) {
    console.error("Ping error:", error);
    return { error: "Failed to fetch Ping data." };
  }
};

// ✅ Traceroute API Call
export const tracerouteServer = async (host) => {
  try {
    const response = await axios.get(`${BASE_URL}/traceroute/${host}`);
    return { host: response.data.host, output: formatOutput(response.data.output) };
  } catch (error) {
    console.error("Traceroute error:", error);
    return { error: "Failed to fetch Traceroute data." };
  }
};

// ✅ Predict Anomalies
export const predictAnomalies = async (avgRTT, maxRTT, numHops) => {
  try {
    const response = await axios.post(`${BASE_URL}/predict-anomalies/`, {
      avg_rtt: avgRTT,
      max_rtt: maxRTT,
      num_hops: numHops,
    });
    return response.data;
  } catch (error) {
    console.error("Anomaly prediction error:", error);
    return { error: "Failed to fetch anomaly detection data." };
  }
};

// ✅ Get Historical Logs
export const getHistoricalLogs = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/historical-logs/`);
    return response.data;
  } catch (error) {
    console.error("Historical logs error:", error);
    return { error: "Failed to fetch historical logs." };
  }
};

// 🆕 Network Discovery API Call
export const discoverNetwork = async (subnet) => {
  try {
    const response = await axios.get(`${BASE_URL}/network/discover/${subnet}`);
    return response.data;
  } catch (error) {
    console.error("Network discovery error:", error);
    return { error: "Failed to perform network discovery." };
  }
};

// 🆕 Get Device Details
export const getDeviceDetails = async (ip) => {
  try {
    const response = await axios.get(`${BASE_URL}/network/device/${ip}`);
    return response.data;
  } catch (error) {
    console.error("Device details error:", error);
    return { error: "Failed to get device details." };
  }
};

// 🆕 Traffic Analysis API Call
export const analyzeTraffic = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/traffic/analyze`);
    return response.data;
  } catch (error) {
    console.error("Traffic analysis error:", error);
    return { error: "Failed to analyze network traffic." };
  }
};

// 🆕 Get Security Alerts
export const getSecurityAlerts = async (severity = null) => {
  try {
    let url = `${BASE_URL}/security/alerts`;
    if (severity) {
      url += `?severity=${severity}`;
    }
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Security alerts error:", error);
    return { error: "Failed to fetch security alerts." };
  }
};

// 🆕 Get Performance Metrics - Enhanced with better error handling and fallback data
export const getPerformanceMetrics = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/performance/metrics`);
    return response.data;
  } catch (error) {
    console.error("Performance metrics error:", error);
    // Return fallback data directly
    return {
      ping_response_time: 50.0,
      cpu_usage_percent: 45.0,
      memory_usage_percent: 60.0,
      activity: [
        {"name": "Ping", "value": 10},
        {"name": "Traceroute", "value": 5},
        {"name": "Analysis", "value": 8}
      ],
      events_last_hour: 23
    };
  }
};
// 🆕 Get Dashboard Summary
export const getDashboardSummary = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/dashboard/summary`);
    return response.data;
  } catch (error) {
    console.error("Dashboard summary error:", error);
    return { 
      error: true,
      message: error.message || "Failed to fetch dashboard summary",
      status: "warning",
      alerts: {
        counts: { critical: 0, high: 0, medium: 0, low: 0 },
        total: 0,
        recent: []
      },
      traffic: {
        protocols: [{ name: "TCP", value: 75 }, { name: "UDP", value: 25 }],
        topSources: [{ ip: "192.168.1.1", value: 50 }],
        topDestinations: [{ ip: "8.8.8.8", value: 40 }]
      },
      network: { devices: 5, subnets: 1 },
      recent_logs: []
    };
  }
};

// 🆕 Get Network Topology
export const getNetworkTopology = async (subnet) => {
  try {
    const response = await axios.get(`${BASE_URL}/network/topology/${subnet}`);
    return response.data;
  } catch (error) {
    console.error("Network topology error:", error);
    return { error: "Failed to fetch network topology." };
  }
};