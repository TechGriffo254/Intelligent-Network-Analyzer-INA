import axios from "axios";

const BASE_URL = "https://ina-griffo.koyeb.app"; // Backend URL

// Format raw text output into a structured array
const formatOutput = (text) => {
  if (!text) return [];
  return text.split("\n").filter((line) => line.trim() !== "");
};

// ✅ Parse Ping Data into Structured Metrics
export const parsePingData = (pingOutput) => {
  const lines = pingOutput.split("\n");
  let packetLoss = 0, minRTT = 0, avgRTT = 0, maxRTT = 0, jitter = 0;

  lines.forEach((line) => {
    if (line.includes("packet loss")) {
      packetLoss = parseFloat(line.match(/(\d+)% packet loss/)[1]);
    }
    if (line.includes("rtt min/avg/max/mdev")) {
      const rttValues = line.match(/([\d.]+)\/([\d.]+)\/([\d.]+)\/([\d.]+)/);
      minRTT = parseFloat(rttValues[1]);
      avgRTT = parseFloat(rttValues[2]);
      maxRTT = parseFloat(rttValues[3]);
      jitter = parseFloat(rttValues[4]);
    }
  });

  return { packetLoss, minRTT, avgRTT, maxRTT, jitter };
};

// ✅ Parse Traceroute Data into Structured Metrics
export const parseTracerouteData = (tracerouteOutput) => {
  const lines = tracerouteOutput.split("\n");
  const hops = lines.length - 1; // Number of hops
  let maxRTT = 0;
  
  lines.forEach((line) => {
    const match = line.match(/\d+\s+([\d.]+) ms/);
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
    return { error: "Failed to fetch data" };
  }
};

// ✅ Traceroute API Call
export const tracerouteServer = async (host) => {
  try {
    const response = await axios.get(`${BASE_URL}/traceroute/${host}`);
    return { host: response.data.host, output: formatOutput(response.data.output) };
  } catch (error) {
    return { error: "Failed to fetch data" };
  }
};

// ✅ Send Structured Data to Anomaly Detection API
export const predictAnomalies = async (avgRTT, maxRTT, numHops) => {
  try {
    const response = await axios.post(`${BASE_URL}/predict-anomalies/`, {
      avg_rtt: avgRTT,
      max_rtt: maxRTT,
      num_hops: numHops
    });
    return response.data;
  } catch (error) {
    return { error: "Failed to fetch data" };
  }
};
