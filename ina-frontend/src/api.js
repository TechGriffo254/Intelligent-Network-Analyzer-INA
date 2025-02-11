import axios from "axios";

const BASE_URL = "https://ina-griffo.koyeb.app"; // Backend URL

// Format the response text into a readable array
const formatOutput = (text) => {
  if (!text) return [];
  return text.split("\n").filter((line) => line.trim() !== "");
};

// Ping API Call
export const pingServer = async (host) => {
  try {
    const response = await axios.get(`${BASE_URL}/ping/${host}`);
    return { host: response.data.host, output: formatOutput(response.data.output) };
  } catch (error) {
    return { error: "Failed to fetch data" };
  }
};

// Traceroute API Call
export const tracerouteServer = async (host) => {
  try {
    const response = await axios.get(`${BASE_URL}/traceroute/${host}`);
    return { host: response.data.host, output: formatOutput(response.data.output) };
  } catch (error) {
    return { error: "Failed to fetch data" };
  }
};

// Predict Network Anomalies
export const predictAnomalies = async (packetSize, responseTime, connections) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/predict-anomalies/?packet_size=${packetSize}&response_time=${responseTime}&connections=${connections}`
    );
    return response.data;
  } catch (error) {
    return { error: "Failed to fetch data" };
  }
};
