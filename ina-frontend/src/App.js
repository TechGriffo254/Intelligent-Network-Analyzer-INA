import React, { useState } from "react";
import { pingServer, tracerouteServer, predictAnomalies } from "./api";

function App() {
  const [host, setHost] = useState("");
  const [pingResult, setPingResult] = useState(null);
  const [tracerouteResult, setTracerouteResult] = useState(null);

  const handlePing = async () => {
    const result = await pingServer(host);
    setPingResult(result);
  };

  const handleTraceroute = async () => {
    const result = await tracerouteServer(host);
    setTracerouteResult(result);
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Intelligent Network Analyzer</h1>
      <input
        type="text"
        placeholder="Enter Host (e.g., google.com)"
        value={host}
        onChange={(e) => setHost(e.target.value)}
      />
      <button onClick={handlePing}>Ping</button>
      <button onClick={handleTraceroute}>Traceroute</button>

      {pingResult && (
        <div>
          <h3>Ping Result:</h3>
          <pre>{JSON.stringify(pingResult, null, 2)}</pre>
        </div>
      )}

      {tracerouteResult && (
        <div>
          <h3>Traceroute Result:</h3>
          <pre>{JSON.stringify(tracerouteResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default App;
