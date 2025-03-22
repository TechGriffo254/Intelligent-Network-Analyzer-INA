import React, { useState, useEffect, useRef } from "react";
import {
  pingServer,
  tracerouteServer,
  predictAnomalies,
  getHistoricalLogs,
  parsePingData,
  parseTracerouteData,
  discoverNetwork,
  analyzeTraffic,
  getSecurityAlerts,
  getDashboardSummary,
  getPerformanceMetrics
} from "./api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as d3 from 'd3';

// Constants come after imports
const BASE_URL = "https://ina-griffo.koyeb.app";
function App() {
  // Active Tab State
  const [activeTab, setActiveTab] = useState("dashboard");

  // Dashboard States
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  // Diagnostic States
  const [host, setHost] = useState("");
  const [pingResult, setPingResult] = useState({ host: "", output: [] });
  const [tracerouteResult, setTracerouteResult] = useState({ host: "", output: [] });
  const [predictionResult, setPredictionResult] = useState(null);
  const [pingChartData, setPingChartData] = useState([]);
  const [tracerouteChartData, setTracerouteChartData] = useState([]);
  const [anomalyChartData, setAnomalyChartData] = useState([]);
  const [logChartData, setLogChartData] = useState([]);

  // Network Discovery States
  const [subnet, setSubnet] = useState("192.168.1.0/24");
  const [discoveryResults, setDiscoveryResults] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  
  // Traffic Analysis States
  const [trafficData, setTrafficData] = useState(null);
  const [trafficView, setTrafficView] = useState("protocols");
  
  // Security Monitoring States
  const [securityAlerts, setSecurityAlerts] = useState(null);
  const [alertSeverityFilter, setAlertSeverityFilter] = useState(null);
  
  // Performance Monitoring States
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  
  // Loading States
  const [isLoadingPing, setIsLoadingPing] = useState(false);
  const [isLoadingTraceroute, setIsLoadingTraceroute] = useState(false);
  const [isLoadingAnomaly, setIsLoadingAnomaly] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isAnalyzingTraffic, setIsAnalyzingTraffic] = useState(false);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(false);

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

  // Dashboard data fetching
  const fetchDashboardData = async () => {
    setIsLoadingDashboard(true);
    try {
      const data = await getDashboardSummary();
      if (!data.error) {
        setDashboardData(data);
      } else {
        toast.error("Failed to load dashboard data");
      }
    } catch (error) {
      console.error("Dashboard error:", error);
      toast.error("Error loading dashboard");
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  // Run Ping 5 times
  const handlePing = async () => {
    if (!host) {
      toast.error("Please enter a host to ping");
      return;
    }
    
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
    if (!host) {
      toast.error("Please enter a host for traceroute");
      return;
    }
    
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
    if (!host) {
      toast.error("Please enter a host for anomaly detection");
      return;
    }
    
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

// Add this state in your component
const [networkTopology, setNetworkTopology] = useState(null);
const [isLoadingTopology, setIsLoadingTopology] = useState(false);
const networkRef = useRef(null);

// Add this function to render the topology
const renderNetworkTopology = () => {
  if (!networkRef.current || !networkTopology) return;

  const width = 800;
  const height = 600;
  
  // Clear any existing visualization
  d3.select(networkRef.current).selectAll("*").remove();
  
  // Create SVG container
  const svg = d3.select(networkRef.current)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height]);
  
  // Create simulation
  const simulation = d3.forceSimulation(networkTopology.nodes)
    .force("link", d3.forceLink(networkTopology.links).id(d => d.id).distance(100))
    .force("charge", d3.forceManyBody().strength(-400))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(50));
  
  // Create links
  const link = svg.append("g")
    .selectAll("line")
    .data(networkTopology.links)
    .join("line")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .attr("stroke-width", d => Math.sqrt(d.value));
  
  // Create node groups
  const node = svg.append("g")
    .selectAll("g")
    .data(networkTopology.nodes)
    .join("g")
    .call(drag(simulation));
  
  // Add device icons/circles
  node.append("circle")
    .attr("r", d => d.type === 'router' ? 25 : 15)
    .attr("fill", d => {
      if (d.type === 'router') return "#FF8C00";
      if (d.type === 'server') return "#4CAF50";
      return d.status === 'active' ? "#1E88E5" : "#E53935";
    });
  
  // Add labels
  node.append("text")
    .attr("dx", 20)
    .attr("dy", ".35em")
    .text(d => d.name)
    .style("font-size", "12px")
    .style("fill", "#333");
  
  // Add tooltips
  node.append("title")
    .text(d => `${d.name}\nIP: ${d.ip}\nType: ${d.type}\nStatus: ${d.status}`);
  
  // Update positions on tick
  simulation.on("tick", () => {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);
    
    node.attr("transform", d => `translate(${d.x},${d.y})`);
  });
  
  // Drag functionality
  function drag(simulation) {
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    
    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    
    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
    
    return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }
};

// Add this effect to update the visualization when data changes
useEffect(() => {
  if (networkTopology) {
    renderNetworkTopology();
  }
}, [networkTopology]);

// Function to get network topology
const fetchNetworkTopology = async (subnet) => {
  setIsLoadingTopology(true);
  try {
    const response = await fetch(`${BASE_URL}/network/topology/${subnet || '192.168.1.0/24'}`);
    if (!response.ok) {
      throw new Error(`Network topology request failed: ${response.status}`);
    }
    const data = await response.json();
    setNetworkTopology(data);
  } catch (error) {
    console.error("Error fetching network topology:", error);
    toast.error("Failed to get network topology. Using sample data.");
    // Provide sample topology data
    setNetworkTopology({
      nodes: [
        { id: "router", name: "Router", type: "router", ip: "192.168.1.1", status: "active" },
        { id: "device1", name: "Desktop-1", type: "host", ip: "192.168.1.10", status: "active" },
        { id: "device2", name: "Laptop-1", type: "host", ip: "192.168.1.15", status: "active" },
        { id: "device3", name: "Printer", type: "host", ip: "192.168.1.20", status: "inactive" },
        { id: "device4", name: "Server", type: "server", ip: "192.168.1.25", status: "active" }
      ],
      links: [
        { source: "router", target: "device1", value: 1 },
        { source: "router", target: "device2", value: 1 },
        { source: "router", target: "device3", value: 1 },
        { source: "router", target: "device4", value: 2 }
      ]
    });
  } finally {
    setIsLoadingTopology(false);
  }
};

  // Handle Network Discovery
  const handleNetworkDiscovery = async () => {
    if (!subnet) {
      toast.error("Please enter a subnet to scan");
      return;
    }
    
    setIsDiscovering(true);
    toast.info(`Starting network discovery on ${subnet}...`);
    
    try {
      const result = await discoverNetwork(subnet);
      if (result.error) {
        toast.error(`Network discovery failed: ${result.error}`);
      } else {
        setDiscoveryResults(result);
        toast.success(`Found ${result.discovered_hosts} devices on ${subnet}`);
      }
    } catch (error) {
      console.error("Network discovery error:", error);
      toast.error("Network discovery failed");
    } finally {
      setIsDiscovering(false);
    }
  };

  // Handle Traffic Analysis
  const handleTrafficAnalysis = async () => {
    setIsAnalyzingTraffic(true);
    toast.info("Analyzing network traffic...");
    
    try {
      const result = await analyzeTraffic();
      if (result.error) {
        toast.error(`Traffic analysis failed: ${result.error}`);
      } else {
        setTrafficData(result);
        toast.success("Traffic analysis completed");
      }
    } catch (error) {
      console.error("Traffic analysis error:", error);
      toast.error("Traffic analysis failed");
    } finally {
      setIsAnalyzingTraffic(false);
    }
  };

  // Handle Security Alerts
  const handleFetchSecurityAlerts = async (severity = null) => {
    setIsLoadingAlerts(true);
    
    try {
      const result = await getSecurityAlerts(severity);
      if (result.error) {
        toast.error(`Failed to fetch security alerts: ${result.error}`);
      } else {
        setSecurityAlerts(result);
        setAlertSeverityFilter(severity);
      }
    } catch (error) {
      console.error("Security alerts error:", error);
      toast.error("Failed to fetch security alerts");
    } finally {
      setIsLoadingAlerts(false);
    }
  };

  // Handle Performance Metrics
  const handleFetchPerformanceMetrics = async () => {
    setIsLoadingPerformance(true);
    
    try {
      const result = await getPerformanceMetrics();
      if (result.error) {
        toast.error(`Failed to fetch performance metrics: ${result.error}`);
      } else {
        setPerformanceMetrics(result);
      }
    } catch (error) {
      console.error("Performance metrics error:", error);
      toast.error("Failed to fetch performance metrics");
    } finally {
      setIsLoadingPerformance(false);
    }
  };

  // Fetch historical logs periodically
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
            : log.event.includes("discovery")
            ? "Discovery"
            : log.event.includes("traffic")
            ? "Traffic"
            : log.event.includes("alert")
            ? "Alert"
            : "Anomaly",
        }));
        setLogChartData(formattedLogs);
      }
    };
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  // Initial fetch for dashboard data
  useEffect(() => {
    if (activeTab === "dashboard") {
      fetchDashboardData();
      const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Initial fetch for security alerts
  useEffect(() => {
    if (activeTab === "security") {
      handleFetchSecurityAlerts();
    }
  }, [activeTab]);

  // Initial fetch for performance metrics
  useEffect(() => {
    if (activeTab === "performance") {
      handleFetchPerformanceMetrics();
      const interval = setInterval(handleFetchPerformanceMetrics, 15000); // Refresh every 15 seconds
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Dashboard Tab
  const renderDashboard = () => {
    if (isLoadingDashboard) {
      return (
        <div className="flex justify-center items-center h-64">
          <p className="text-lg text-gray-600">Loading dashboard data...</p>
        </div>
      );
    }

    if (!dashboardData) {
      return (
        <div className="flex justify-center items-center h-64">
          <p className="text-lg text-red-600">Failed to load dashboard data. Please try again.</p>
        </div>
      );
    }

    const statusColor = 
      dashboardData.status === "healthy" ? "bg-green-500" :
      dashboardData.status === "concerning" ? "bg-yellow-500" :
      dashboardData.status === "warning" ? "bg-orange-500" :
      "bg-red-500";

    return (
      <div className="space-y-6">
        {/* Status Card */}
        <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
          <div className="flex items-center">
            <div className={`${statusColor} w-4 h-4 rounded-full mr-2`}></div>
            <h3 className="text-lg font-semibold">System Status: {dashboardData.status}</h3>
          </div>
          <div className="flex gap-2">
            <p className="px-2 py-1 bg-red-100 text-red-800 rounded">
              {dashboardData.alerts.counts.critical} Critical
            </p>
            <p className="px-2 py-1 bg-orange-100 text-orange-800 rounded">
              {dashboardData.alerts.counts.high} High
            </p>
            <p className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
              {dashboardData.alerts.counts.medium} Medium
            </p>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recent Alerts */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">Recent Alerts</h3>
            {dashboardData.alerts.recent && dashboardData.alerts.recent.length > 0 ? (
              <div className="space-y-2">
                {dashboardData.alerts.recent.map((alert, index) => (
                  <div 
                    key={index} 
                    className={`p-2 rounded ${
                      alert.severity === "critical" ? "bg-red-100" :
                      alert.severity === "high" ? "bg-orange-100" :
                      alert.severity === "medium" ? "bg-yellow-100" :
                      "bg-blue-100"
                    }`}
                  >
                    <div className="flex justify-between">
                      <p className="font-medium">{alert.title}</p>
                      <span className="text-sm text-gray-600">{alert.timestamp}</span>
                    </div>
                    <p className="text-sm">{alert.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No recent alerts</p>
            )}
          </div>

          {/* Recent Logs */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
            {dashboardData.recent_logs && dashboardData.recent_logs.length > 0 ? (
              <div className="space-y-1">
                {dashboardData.recent_logs.map((log, index) => (
                  <div key={index} className="flex justify-between border-b py-1">
                    <p>{log.event}</p>
                    <span className="text-sm text-gray-600">{log.timestamp}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No recent logs</p>
            )}
          </div>

          {/* Traffic Overview */}
          {dashboardData.traffic && (
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-3">Traffic Overview</h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardData.traffic.protocols || []}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label
                    >
                      {dashboardData.traffic.protocols && dashboardData.traffic.protocols.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setActiveTab("diagnostics")}
                className="p-3 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Run Diagnostics
              </button>
              <button
                onClick={() => setActiveTab("network")}
                className="p-3 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Network Discovery
              </button>
              <button
                onClick={() => setActiveTab("traffic")}
                className="p-3 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                Traffic Analysis
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className="p-3 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Security Alerts
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Diagnostics Tab (Original UI)
  const renderDiagnostics = () => (
    <div>
      <h2 className="text-2xl font-bold text-center text-blue-700 mb-6">
        Network Diagnostics
      </h2>

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
  );

  // Network Discovery Tab
// In your renderNetworkDiscovery function, add:
const renderNetworkDiscovery = () => {
  // Your existing code...
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-blue-700 mb-4">Network Discovery</h2>
      
      {/* Subnet scanning form */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            className="w-full p-3 border rounded-md"
            placeholder="Enter subnet (e.g., 192.168.1.0/24)"
            value={subnet}
            onChange={(e) => setSubnet(e.target.value)}
          />
        </div>
        <button
          onClick={() => {
            handleNetworkDiscovery();
            fetchNetworkTopology(subnet);
          }}
          className={`px-6 py-2 rounded-md ${
            isDiscovering ? "bg-gray-400" : "bg-blue-500"
          } text-white hover:bg-blue-600`}
          disabled={isDiscovering}
        >
          {isDiscovering ? "Scanning..." : "Scan Network"}
        </button>
      </div>
      
      {/* Network Topology Visualization - NEW! */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-blue-600 mb-3">Network Topology</h3>
        {isLoadingTopology ? (
          <div className="flex justify-center items-center h-96">
            <p className="text-lg text-gray-600">Loading network topology...</p>
          </div>
        ) : (
          <div 
            ref={networkRef} 
            className="border rounded-lg bg-gray-50 h-96 overflow-hidden"
          ></div>
        )}
      </div>
      
      {/* Your existing device table */}
      {discoveryResults && (
        <div className="mt-4">
          {/* ... your existing code ... */}
        </div>
      )}
    </div>
  );
};

  // Traffic Analysis Tab
  const renderTrafficAnalysis = () => {
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD'];
    
    return (
      <div>
        <h2 className="text-2xl font-bold text-blue-700 mb-4">Traffic Analysis</h2>
        
        <div className="flex gap-4 mb-6">
          <button
            onClick={handleTrafficAnalysis}
            className={`px-6 py-2 rounded-md ${
              isAnalyzingTraffic ? "bg-gray-400" : "bg-blue-500"
            } text-white hover:bg-blue-600`}
            disabled={isAnalyzingTraffic}
          >
            {isAnalyzingTraffic ? "Analyzing..." : "Analyze Network Traffic"}
          </button>
        </div>
        
        {trafficData && (
          <div className="mt-4">
            <div className="flex space-x-2 mb-4">
              <button
                className={`px-4 py-2 rounded-md ${
                  trafficView === 'protocols' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}
                onClick={() => setTrafficView('protocols')}
              >
                Protocol Distribution
              </button>
              <button
                className={`px-4 py-2 rounded-md ${
                  trafficView === 'sources' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}
                onClick={() => setTrafficView('sources')}
              >
                Top Sources
              </button>
              <button
                className={`px-4 py-2 rounded-md ${
                  trafficView === 'destinations' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}
                onClick={() => setTrafficView('destinations')}
              >
                Top Destinations
              </button>
            </div>
            
            <div className="h-80">
              {trafficView === 'protocols' && trafficData.protocols && trafficData.protocols.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={trafficData.protocols}
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {trafficData.protocols.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} connections`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
              
              {trafficView === 'sources' && trafficData.topSources && trafficData.topSources.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={trafficData.topSources}
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="ip"
                      label={({ip, percent}) => `${ip}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {trafficData.topSources.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, ip) => [`${value} connections`, ip]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
              
              {trafficView === 'destinations' && trafficData.topDestinations && trafficData.topDestinations.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={trafficData.topDestinations}
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="ip"
                      label={({ip, percent}) => `${ip}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {trafficData.topDestinations.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, ip) => [`${value} connections`, ip]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
              
              {((trafficView === 'protocols' && (!trafficData.protocols || trafficData.protocols.length === 0)) ||
                (trafficView === 'sources' && (!trafficData.topSources || trafficData.topSources.length === 0)) ||
                (trafficView === 'destinations' && (!trafficData.topDestinations || trafficData.topDestinations.length === 0))) && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No data available for this view</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {!trafficData && (
          <div className="text-center py-8">
            <p>No traffic data available. Click "Analyze Network Traffic" to start.</p>
          </div>
        )}
      </div>
    );
  };

  // Security Monitoring Tab
  const renderSecurityMonitoring = () => {
    if (isLoadingAlerts) {
      return (
        <div className="flex justify-center items-center h-64">
          <p className="text-lg text-gray-600">Loading security alerts...</p>
        </div>
      );
    }

    return (
      <div>
        <h2 className="text-2xl font-bold text-blue-700 mb-4">Security Monitoring</h2>
        
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => handleFetchSecurityAlerts(null)}
            className={`px-4 py-2 rounded-md ${!alertSeverityFilter ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            All
          </button>
          <button
            onClick={() => handleFetchSecurityAlerts("critical")}
            className={`px-4 py-2 rounded-md ${alertSeverityFilter === 'critical' ? 'bg-red-500 text-white' : 'bg-red-100'}`}
          >
            Critical
          </button>
          <button
            onClick={() => handleFetchSecurityAlerts("high")}
            className={`px-4 py-2 rounded-md ${alertSeverityFilter === 'high' ? 'bg-orange-500 text-white' : 'bg-orange-100'}`}
          >
            High
          </button>
          <button
            onClick={() => handleFetchSecurityAlerts("medium")}
            className={`px-4 py-2 rounded-md ${alertSeverityFilter === 'medium' ? 'bg-yellow-500 text-white' : 'bg-yellow-100'}`}
          >
            Medium
          </button>
          <button
            onClick={() => handleFetchSecurityAlerts("low")}
            className={`px-4 py-2 rounded-md ${alertSeverityFilter === 'low' ? 'bg-green-500 text-white' : 'bg-green-100'}`}
          >
            Low
          </button>
        </div>
        
        {/* Alert Summary */}
        {securityAlerts && (
          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <h3 className="text-lg font-semibold mb-2">Alert Summary</h3>
            <div className="flex gap-4">
              <div className="px-4 py-2 bg-red-100 rounded flex flex-col items-center">
                <span className="text-2xl font-bold">{securityAlerts.counts.critical}</span>
                <span className="text-sm">Critical</span>
              </div>
              <div className="px-4 py-2 bg-orange-100 rounded flex flex-col items-center">
                <span className="text-2xl font-bold">{securityAlerts.counts.high}</span>
                <span className="text-sm">High</span>
              </div>
              <div className="px-4 py-2 bg-yellow-100 rounded flex flex-col items-center">
                <span className="text-2xl font-bold">{securityAlerts.counts.medium}</span>
                <span className="text-sm">Medium</span>
              </div>
              <div className="px-4 py-2 bg-green-100 rounded flex flex-col items-center">
                <span className="text-2xl font-bold">{securityAlerts.counts.low}</span>
                <span className="text-sm">Low</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Alert List */}
        {securityAlerts && securityAlerts.alerts && securityAlerts.alerts.length > 0 ? (
          <div className="space-y-3">
            {securityAlerts.alerts.map((alert, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg shadow ${
                  alert.severity === "critical" ? "bg-red-50 border-l-4 border-red-500" :
                  alert.severity === "high" ? "bg-orange-50 border-l-4 border-orange-500" :
                  alert.severity === "medium" ? "bg-yellow-50 border-l-4 border-yellow-500" :
                  "bg-green-50 border-l-4 border-green-500"
                }`}
              >
                <div className="flex justify-between mb-1">
                  <h4 className="font-semibold text-lg">{alert.title}</h4>
                  <span className="text-sm bg-gray-200 px-2 py-1 rounded">{alert.id}</span>
                </div>
                <p className="mb-2">{alert.description}</p>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Source: {alert.source}</span>
                  <span>Detected: {alert.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <p className="text-gray-500">
              {securityAlerts ? "No alerts found matching the selected criteria" : "No security alerts available"}
            </p>
          </div>
        )}
      </div>
    );
  };

  
// Performance Metrics Fetching Function (with error handling)
// In your fetchPerformanceMetrics function
const fetchPerformanceMetrics = async () => {
  setIsLoadingPerformance(true);
  try {
    const data = await getPerformanceMetrics();
    setPerformanceMetrics(data);
  } catch (error) {
    console.error("Error fetching performance metrics:", error);
    toast.error("Failed to fetch performance metrics. Using demo data instead.");
  } finally {
    setIsLoadingPerformance(false);
  }
};
// Add this useEffect to fetch performance data when the tab is active
// Add this useEffect to your App.js
useEffect(() => {
  if (activeTab === "performance") {
    fetchPerformanceMetrics();
    const interval = setInterval(fetchPerformanceMetrics, 30000);
    return () => clearInterval(interval);
  }
}, [activeTab]);

// Performance Monitoring Tab
const renderPerformanceMonitoring = () => {
  if (isLoadingPerformance) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg text-gray-600">Loading performance metrics...</p>
      </div>
    );
  }
  
  if (!performanceMetrics) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg text-red-600">Failed to load performance metrics. Please try again.</p>
      </div>
    );
  }
  
  // Only access properties if performanceMetrics exists
  const pingResponse = performanceMetrics.ping_response_time || 0;
  const cpuUsage = performanceMetrics.cpu_usage_percent || 0;
  const memoryUsage = performanceMetrics.memory_usage_percent || 0;
  const activity = performanceMetrics.activity || [];
  const eventsLastHour = performanceMetrics.events_last_hour || 0;
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-blue-700 mb-4">Performance Monitoring</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-1">Ping Response</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold">{pingResponse.toFixed(1)}</span>
            <span className="text-gray-600 mb-1">ms</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-1">CPU Usage</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold">{performanceMetrics.cpu_usage_percent.toFixed(1)}</span>
            <span className="text-gray-600 mb-1">%</span>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-1">Memory Usage</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold">{performanceMetrics.memory_usage_percent.toFixed(1)}</span>
            <span className="text-gray-600 mb-1">%</span>
          </div>
        </div>
      </div>
      
      {/* Activity Chart */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-3">System Activity</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={performanceMetrics.activity}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" name="Event Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-3">System Stats</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="border p-3 rounded">
            <p className="text-gray-600">Events Last Hour</p>
            <p className="text-2xl font-bold">{performanceMetrics.events_last_hour}</p>
          </div>
          <div className="border p-3 rounded">
            <p className="text-gray-600">Total Activities</p>
            <p className="text-2xl font-bold">
              {performanceMetrics.activity.reduce((sum, item) => sum + item.value, 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <ToastContainer position="top-right" />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-center text-blue-700">
            Intelligent Network Analyzer (INA)
          </h1>
          
          {/* Navigation */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-2 rounded-md ${activeTab === "dashboard" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("diagnostics")}
              className={`px-4 py-2 rounded-md ${activeTab === "diagnostics" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
            >
              Diagnostics
            </button>
            <button
              onClick={() => setActiveTab("network")}
              className={`px-4 py-2 rounded-md ${activeTab === "network" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
            >
              Network Discovery
            </button>
            <button
              onClick={() => setActiveTab("traffic")}
              className={`px-4 py-2 rounded-md ${activeTab === "traffic" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
            >
              Traffic Analysis
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`px-4 py-2 rounded-md ${activeTab === "security" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
            >
              Security
            </button>
            <button
              onClick={() => setActiveTab("performance")}
              className={`px-4 py-2 rounded-md ${activeTab === "performance" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
            >
              Performance
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          {activeTab === "dashboard" && renderDashboard()}
          {activeTab === "diagnostics" && renderDiagnostics()}
          {activeTab === "network" && renderNetworkDiscovery()}
          {activeTab === "traffic" && renderTrafficAnalysis()}
          {activeTab === "security" && renderSecurityMonitoring()}
          {activeTab === "performance" && renderPerformanceMonitoring()}
        </div>
      </div>
    </div>
  );
}

export default App;