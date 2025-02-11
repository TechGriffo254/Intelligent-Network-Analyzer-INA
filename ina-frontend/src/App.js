import React, { useState } from "react";
import { pingServer, tracerouteServer, predictAnomalies } from "./api";

function App() {
  const [host, setHost] = useState("");
  const [pingResult, setPingResult] = useState(null);
  const [tracerouteResult, setTracerouteResult] = useState(null);

  const [packetSize, setPacketSize] = useState("");
  const [responseTime, setResponseTime] = useState("");
  const [connections, setConnections] = useState("");
  const [predictionResult, setPredictionResult] = useState(null);

  const handlePing = async () => {
    const result = await pingServer(host);
    setPingResult(result);
  };

  const handleTraceroute = async () => {
    const result = await tracerouteServer(host);
    setTracerouteResult(result);
  };

  const handlePrediction = async () => {
    const result = await predictAnomalies(packetSize, responseTime, connections);
    setPredictionResult(result);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-4">
          Intelligent Network Analyzer
        </h1>

        {/* Ping & Traceroute Section */}
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
            className="flex-1 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
          >
            Ping
          </button>
          <button 
            onClick={handleTraceroute} 
            className="flex-1 bg-green-500 text-white p-2 rounded-md hover:bg-green-600"
          >
            Traceroute
          </button>
        </div>

        {pingResult && (
          <div className="mt-4 p-3 bg-gray-200 rounded-md">
            <h3 className="font-semibold">Ping Result:</h3>
            <pre className="text-sm text-gray-700">{JSON.stringify(pingResult, null, 2)}</pre>
          </div>
        )}

        {tracerouteResult && (
          <div className="mt-4 p-3 bg-gray-200 rounded-md">
            <h3 className="font-semibold">Traceroute Result:</h3>
            <pre className="text-sm text-gray-700">{JSON.stringify(tracerouteResult, null, 2)}</pre>
          </div>
        )}

        {/* Anomaly Detection Section */}
        <h2 className="text-lg font-semibold mt-6">Anomaly Detection</h2>
        <input
          type="number"
          placeholder="Packet Size"
          className="w-full p-2 border rounded-md mt-2"
          value={packetSize}
          onChange={(e) => setPacketSize(e.target.value)}
        />
        <input
          type="number"
          placeholder="Response Time"
          className="w-full p-2 border rounded-md mt-2"
          value={responseTime}
          onChange={(e) => setResponseTime(e.target.value)}
        />
        <input
          type="number"
          placeholder="Connections"
          className="w-full p-2 border rounded-md mt-2"
          value={connections}
          onChange={(e) => setConnections(e.target.value)}
        />
        <button 
          onClick={handlePrediction} 
          className="w-full bg-purple-500 text-white p-2 rounded-md mt-4 hover:bg-purple-600"
        >
          Predict Anomalies
        </button>

        {predictionResult && (
          <div className="mt-4 p-3 bg-gray-200 rounded-md">
            <h3 className="font-semibold">Prediction Result:</h3>
            <pre className="text-sm text-gray-700">{JSON.stringify(predictionResult, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
