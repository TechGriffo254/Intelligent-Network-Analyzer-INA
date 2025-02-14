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
    return { error: "Failed to fetch Ping data." };
  }
};

// ✅ Traceroute API Call
export const tracerouteServer = async (host) => {
  try {
    const response = await axios.get(`${BASE_URL}/traceroute/${host}`);
    return { host: response.data.host, output: formatOutput(response.data.output) };
  } catch (error) {
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
    return { error: "Failed to fetch anomaly detection data." };
  }
};

// ✅ Get Historical Logs
export const getHistoricalLogs = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/historical-logs/`);
    return response.data;
  } catch (error) {
    return { error: "Failed to fetch historical logs." };
  }
};
