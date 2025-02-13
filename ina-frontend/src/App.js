import React, { useState, useEffect } from "react";
import { pingServer, tracerouteServer, predictAnomalies, parsePingData, parseTracerouteData } from "./api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

function App() {
  const [host, setHost] = useState("");
  const [pingResult, setPingResult] = useState({ host: "", output: [] });
  const [tracerouteResult, setTracerouteResult] = useState({ host: "", output: [] });
  const [predictionResult, setPredictionResult] = useState(null);
  const [pingChartData, setPingChartData] = useState([]);
  const [tracerouteChartData, setTracerouteChartData] = useState([]);
  const [anomalyChartData, setAnomalyChartData] = useState([]);

  const [isLoadingPing, setIsLoadingPing] = useState(false);
  const [isLoadingTraceroute, setIsLoadingTraceroute] = useState(false);
  const [isLoadingAnomaly, setIsLoadingAnomaly] = useState(false);

  // Function to add new data points to charts
  const updateChartData = (metricType, data) => {
    const timestamp = new Date().toLocaleTimeString();
    const newPoint = { time: timestamp, value: data };
    if (metricType === "ping") {
      setPingChartData((prev) => [...prev.slice(-19), newPoint]);
    } else if (metricType === "traceroute") {
      setTracerouteChartData((prev) => [...prev.slice(-19), newPoint]);
    } else if (metricType === "anomaly") {
      setAnomalyChartData((prev) => [...prev.slice(-19), newPoint]);
    }
  };

  const handlePing = async () => {
    setIsLoadingPing(true);
    const result = await pingServer(host);
    setPingResult(result || { host: host, output: [] });
    if (result.output) {
      const pingMetrics = parsePingData(result.output.join("\n"));
      updateChartData("ping", pingMetrics.avgRTT);
    }
    setIsLoadingPing(false);
  };

  const handleTraceroute = async () => {
    setIsLoadingTraceroute(true);
    const result = await tracerouteServer(host);
    setTracerouteResult(result || { host: host, output: [] });
    if (result.output) {
      const tracerouteMetrics = parseTracerouteData(result.output.join("\n"));
      updateChartData("traceroute", tracerouteMetrics.maxRTT);
    }
    setIsLoadingTraceroute(false);
  };

  const handleAutomaticAnomalyDetection = async () => {
    setIsLoadingAnomaly(true);
    const pingData = await pingServer(host);
    const tracerouteData = await tracerouteServer(host);

    if (!pingData || pingData.error || !tracerouteData || tracerouteData.error) {
      setPredictionResult({ error: "Failed to fetch network data for anomaly detection." });
      setIsLoadingAnomaly(false);
      return;
    }

    const pingMetrics = parsePingData(pingData.output.join("\n"));
    const tracerouteMetrics = parseTracerouteData(tracerouteData.output.join("\n"));

    const result = await predictAnomalies(
      pingMetrics.avgRTT || 0,
      tracerouteMetrics.maxRTT || 0,
      tracerouteMetrics.hops || 0,
      pingMetrics.packetLoss || 0,
      pingMetrics.jitter || 0
    );

    setPredictionResult(result);
    updateChartData("anomaly", result.result === "Anomaly detected!" ? 1 : 0);
    setIsLoadingAnomaly(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-4">
          Intelligent Network Analyzer
        </h1>

        {/* Network Testing */}
        <h2 className="text-lg font-semibold mt-4">Network Testing</h2>
        <input
          type="text"
          className="w-full p-2 border rounded-md mt-2"
          placeholder="Enter Host (e.g., google.com)"
          value={host}
          onChange={(e) => setHost(e.target.value)}
        />
        <div className="flex space-x-2 mt-4">
          <button
            onClick={handlePing}
            className={`flex-1 p-2 rounded-md ${isLoadingPing ? "bg-gray-400" : "bg-blue-500"} text-white hover:bg-blue-600`}
            disabled={isLoadingPing}
          >
            {isLoadingPing ? "Pinging..." : "Ping"}
          </button>
          <button
            onClick={handleTraceroute}
            className={`flex-1 p-2 rounded-md ${isLoadingTraceroute ? "bg-gray-400" : "bg-green-500"} text-white hover:bg-green-600`}
            disabled={isLoadingTraceroute}
          >
            {isLoadingTraceroute ? "Running Traceroute..." : "Traceroute"}
          </button>
        </div>

        {/* Display Ping Results */}
        {pingResult?.output?.length > 0 && (
          <div className="mt-4 p-3 bg-gray-200 rounded-md">
            <h3 className="font-semibold">Ping Result for {pingResult.host}:</h3>
            <ul className="text-sm text-gray-700">
              {pingResult.output.map((line, index) => (
                <li key={index} className="border-b py-1">{line}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Display Traceroute Results */}
        {tracerouteResult?.output?.length > 0 && (
          <div className="mt-4 p-3 bg-gray-200 rounded-md">
            <h3 className="font-semibold">Traceroute Result for {tracerouteResult.host}:</h3>
            <ul className="text-sm text-gray-700">
              {tracerouteResult.output.map((line, index) => (
                <li key={index} className="border-b py-1">{line}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Automatic Anomaly Detection */}
        <h2 className="text-lg font-semibold mt-6">Automatic Anomaly Detection</h2>
        <p className="text-sm text-gray-600 mt-2">
          This feature will automatically collect network data and detect anomalies.
        </p>

        <button
          onClick={handleAutomaticAnomalyDetection}
          className={`w-full p-2 rounded-md mt-4 ${isLoadingAnomaly ? "bg-gray-400" : "bg-red-500"} text-white hover:bg-red-600`}
          disabled={isLoadingAnomaly}
        >
          {isLoadingAnomaly ? "Analyzing..." : "Run Anomaly Detection"}
        </button>

        {/* Display Anomaly Detection Results */}
        {predictionResult && (
          <div className="mt-4 p-3 bg-gray-200 rounded-md">
            <h3 className="font-semibold">Anomaly Detection Result:</h3>
            <pre className="text-sm text-gray-700">{JSON.stringify(predictionResult, null, 2)}</pre>
          </div>
        )}

        {/* Real-Time Chart Section */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-center mb-3">Real-Time Network Metrics</h2>

          {/* Ping Chart */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-blue-600">Ping (ms)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={pingChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#8884d8" name="Ping (ms)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Traceroute Chart */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-green-600">Traceroute Max RTT (ms)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={tracerouteChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#82ca9d" name="Traceroute Max RTT (ms)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Anomaly Detection Chart */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-red-600">Anomaly Detection Events</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={anomalyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#FF0000" name="Anomalies Detected" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
