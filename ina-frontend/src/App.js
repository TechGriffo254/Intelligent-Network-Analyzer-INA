import React, { useState, useEffect } from "react";
import { pingServer, tracerouteServer, predictAnomalies, getHistoricalLogs, parsePingData, parseTracerouteData } from "./api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [host, setHost] = useState("");
  const [pingResult, setPingResult] = useState({ host: "", output: [] });
  const [tracerouteResult, setTracerouteResult] = useState({ host: "", output: [] });
  const [predictionResult, setPredictionResult] = useState(null);
  const [pingChartData, setPingChartData] = useState([]);
  const [tracerouteChartData, setTracerouteChartData] = useState([]);
  const [anomalyChartData, setAnomalyChartData] = useState([]);
  const [logChartData, setLogChartData] = useState([]);

  // Loader states
  const [isLoadingPing, setIsLoadingPing] = useState(false);
  const [isLoadingTraceroute, setIsLoadingTraceroute] = useState(false);
  const [isLoadingAnomaly, setIsLoadingAnomaly] = useState(false);

  // Function to add new data points to charts
  const updateChartData = (metricType, data) => {
    const timestamp = new Date().toLocaleTimeString();
    const newPoint = { time: timestamp, value: data };
    if (metricType === "ping") {
      setPingChartData((prev) => [...prev.slice(-49), newPoint]);
    } else if (metricType === "traceroute") {
      setTracerouteChartData((prev) => [...prev.slice(-49), newPoint]);
    } else if (metricType === "anomaly") {
      setAnomalyChartData((prev) => [...prev.slice(-49), newPoint]);
    }
  };

  // Run Ping 5 times
  const handlePing = async () => {
    setIsLoadingPing(true);
    toast.info("Running Ping 5 times for better analysis...");

    let avgRTT = 0;
    for (let i = 0; i < 5; i++) {
      const result = await pingServer(host);
      if (result.error) {
        toast.error(`Ping failed on attempt ${i + 1}: ${result.error}`);
        continue;
      } else {
        setPingResult(result || { host: host, output: [] });
        const pingMetrics = parsePingData(result.output.join("\n"));
        updateChartData("ping", pingMetrics.avgRTT);
        avgRTT += pingMetrics.avgRTT;
      }
    }

    avgRTT /= 5;
    toast.success(`Ping completed. Average RTT: ${avgRTT.toFixed(2)}ms`);
    setIsLoadingPing(false);
  };

  // Run Traceroute 5 times
  const handleTraceroute = async () => {
    setIsLoadingTraceroute(true);
    toast.info("Running Traceroute 5 times for better analysis...");

    let maxRTT = 0;
    for (let i = 0; i < 5; i++) {
      const result = await tracerouteServer(host);
      if (result.error) {
        toast.error(`Traceroute failed on attempt ${i + 1}: ${result.error}`);
        continue;
      } else {
        setTracerouteResult(result || { host: host, output: [] });
        const tracerouteMetrics = parseTracerouteData(result.output.join("\n"));
        updateChartData("traceroute", tracerouteMetrics.maxRTT);
        maxRTT = Math.max(maxRTT, tracerouteMetrics.maxRTT);
      }
    }

    toast.success(`Traceroute completed. Max RTT: ${maxRTT.toFixed(2)}ms`);
    setIsLoadingTraceroute(false);
  };

  // Handle Anomaly Detection
  const handleAutomaticAnomalyDetection = async () => {
    setIsLoadingAnomaly(true);
    toast.info("Running anomaly detection...");
  
    // Run ping and traceroute 3 times each for accuracy
    let avgRTT = 0, maxRTT = 0, hops = 0;
  
    for (let i = 0; i < 3; i++) {
      const pingData = await pingServer(host);
      const tracerouteData = await tracerouteServer(host);
  
      if (!pingData?.output?.length || !tracerouteData?.output?.length) {
        toast.error("Failed to fetch network data for anomaly detection.");
        setIsLoadingAnomaly(false);
        return;
      }
  
      const pingMetrics = parsePingData(pingData.output.join("\n"));
      const tracerouteMetrics = parseTracerouteData(tracerouteData.output.join("\n"));
  
      avgRTT += pingMetrics.avgRTT;
      maxRTT = Math.max(maxRTT, pingMetrics.maxRTT);
      hops = tracerouteMetrics.hops;
    }
  
    avgRTT /= 3;
  
    // Send average data for anomaly detection
    const result = await predictAnomalies(avgRTT, maxRTT, hops);
  
    if (result.error) {
      toast.error(`Anomaly detection failed: ${result.error}`);
    } else {
      toast.success(`Anomaly Detection Completed: ${result.result}`);
      setPredictionResult(result);
      updateChartData("anomaly", result.result === "Anomaly detected!" ? 1 : 0);
    }
  
    setIsLoadingAnomaly(false);
  };
  

  // Fetch historical logs every 5 seconds
  useEffect(() => {
    const fetchLogs = async () => {
      const logs = await getHistoricalLogs();
      if (logs && logs.logs) {
        const formattedLogs = logs.logs.map((log) => ({
          time: log.timestamp,
          eventType: log.event.includes("Ping")
            ? "Ping"
            : log.event.includes("Traceroute")
            ? "Traceroute"
            : "Anomaly",
        }));
        setLogChartData(formattedLogs);
      }
    };
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-5xl">
        <h1 className="text-3xl font-bold text-center text-blue-700 mb-6">
          Intelligent Network Analyzer (INA)
        </h1>

        {/* Network Testing */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              className="w-full p-3 border rounded-md"
              placeholder="Enter Host (e.g., google.com)"
              value={host}
              onChange={(e) => setHost(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePing}
              className={`px-6 py-2 rounded-md ${
                isLoadingPing ? "bg-gray-400" : "bg-blue-500"
              } text-white hover:bg-blue-600`}
              disabled={isLoadingPing}
            >
              {isLoadingPing ? "Pinging..." : "Ping (x5)"}
            </button>
            <button
              onClick={handleTraceroute}
              className={`px-6 py-2 rounded-md ${
                isLoadingTraceroute ? "bg-gray-400" : "bg-green-500"
              } text-white hover:bg-green-600`}
              disabled={isLoadingTraceroute}
            >
              {isLoadingTraceroute ? "Running..." : "Traceroute (x5)"}
            </button>
            <button
              onClick={handleAutomaticAnomalyDetection}
              className={`px-6 py-2 rounded-md ${
                isLoadingAnomaly ? "bg-gray-400" : "bg-red-500"
              } text-white hover:bg-red-600`}
              disabled={isLoadingAnomaly}
            >
              {isLoadingAnomaly ? "Analyzing..." : "Detect Anomalies"}
            </button>
          </div>
        </div>

        {/* Results Display */}
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          {/* Ping Results */}
          {pingResult?.output?.length > 0 && (
            <div className="flex-1 bg-gray-100 p-3 rounded-md">
              <h3 className="font-semibold mb-2">Ping Result for {pingResult.host}</h3>
              <ul className="text-sm text-gray-700">
                {pingResult.output.map((line, index) => (
                  <li key={index} className="border-b py-1">{line}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Traceroute Results */}
          {tracerouteResult?.output?.length > 0 && (
            <div className="flex-1 bg-gray-100 p-3 rounded-md">
              <h3 className="font-semibold mb-2">Traceroute Result for {tracerouteResult.host}</h3>
              <ul className="text-sm text-gray-700">
                {tracerouteResult.output.map((line, index) => (
                  <li key={index} className="border-b py-1">{line}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Anomaly Detection Results */}
          {predictionResult && (
            <div className="flex-1 bg-gray-100 p-3 rounded-md">
              <h3 className="font-semibold mb-2">Anomaly Detection Result:</h3>
              <pre className="text-sm text-gray-700">{JSON.stringify(predictionResult, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ping Chart */}
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="text-blue-600 font-semibold mb-2">Ping (ms)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={pingChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#007bff" name="Ping (ms)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Traceroute Chart */}
          <div className="bg-green-50 p-4 rounded-md">
            <h3 className="text-green-600 font-semibold mb-2">Traceroute Max RTT (ms)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={tracerouteChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#28a745" name="Traceroute (ms)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Anomaly Detection Chart */}
          <div className="bg-red-50 p-4 rounded-md">
            <h3 className="text-red-600 font-semibold mb-2">Anomaly Detection Events</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={anomalyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#dc3545" name="Anomalies" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Historical Logs Chart */}
          <div className="bg-purple-50 p-4 rounded-md">
            <h3 className="text-purple-600 font-semibold mb-2">Historical Logs</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={logChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="eventType" stroke="#6f42c1" name="Events" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
