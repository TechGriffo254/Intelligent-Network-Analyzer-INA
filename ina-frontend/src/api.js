import axios from "axios";

const BASE_URL = "https://ina-griffo.koyeb.app"; // Backend URL

export const pingServer = async (host) => {
  try {
    const response = await axios.get(`${BASE_URL}/ping/${host}`);
    return response.data;
  } catch (error) {
    return { error: "Failed to fetch data" };
  }
};

export const tracerouteServer = async (host) => {
  try {
    const response = await axios.get(`${BASE_URL}/traceroute/${host}`);
    return response.data;
  } catch (error) {
    return { error: "Failed to fetch data" };
  }
};

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
