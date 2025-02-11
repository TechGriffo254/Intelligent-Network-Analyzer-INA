import React, { useState } from "react";
import { pingServer, tracerouteServer, predictAnomalies, parsePingData, parseTracerouteData } from "./api";

function App() {
  const [host, setHost] = useState("");
  const [pingResult, setPingResult] = useState({ host: "", output: [] });
  const [tracerouteResult, setTracerouteResult] = useState({ host: "", output: [] });
  const [predictionResult, setPredictionResult] = useState(null);

  const handlePing = async () => {
    const result = await pingServer(host);
    setPingResult(result || { host: host, output: [] });
  };

  const handleTraceroute = async () => {
    const result = await tracerouteServer(host);
    setTracerouteResult(result || { host: host, output: [] });
  };

  const handleAutomaticAnomalyDetection = async () => {
    const pingData = await pingServer(host);
    const tracerouteData = await tracerouteServer(host);

    if (!pingData || pingData.error || !tracerouteData || tracerouteData.error) {
      setPredictionResult({ error: "Failed to fetch network data for anomaly detection." });
      return;
    }

    const pingMetrics = parsePingData(pingData.output.join("\n"));
    const tracerouteMetrics = parseTracerouteData(tracerouteData.output.join("\n"));

    const result = await predictAnomalies(
      pingMetrics.avgRTT || 0,
      tracerouteMetrics.maxRTT || 0,
      tracerouteMetrics.hops || 0
    );

    setPredictionResult(result);
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
          <button onClick={handlePing} className="flex-1 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600">
            Ping
          </button>
          <button onClick={handleTraceroute} className="flex-1 bg-green-500 text-white p-2 rounded-md hover:bg-green-600">
            Traceroute
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

        <button onClick={handleAutomaticAnomalyDetection} className="w-full bg-red-500 text-white p-2 rounded-md mt-4 hover:bg-red-600">
          Run Anomaly Detection
        </button>

        {/* Display Anomaly Detection Results */}
        {predictionResult && (
          <div className="mt-4 p-3 bg-gray-200 rounded-md">
            <h3 className="font-semibold">Anomaly Detection Result:</h3>
            <pre className="text-sm text-gray-700">{JSON.stringify(predictionResult, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
