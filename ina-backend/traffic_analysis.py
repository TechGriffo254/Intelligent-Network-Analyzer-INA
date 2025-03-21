import logging
import asyncio
import json
from typing import Dict, Any, List
import time

class TrafficAnalyzer:
    def __init__(self):
        self.current_traffic_data = {
            "protocols": {},
            "sources": {},
            "destinations": {}
        }
    
    async def analyze_network_traffic(self) -> Dict[str, Any]:
        """Analyze current network traffic using simple tools"""
        try:
            # Using netstat to gather connection information
            proc = await asyncio.create_subprocess_exec(
                "netstat", "-tn",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await proc.communicate()
            
            if proc.returncode != 0:
                return {"error": f"Failed to analyze traffic: {stderr.decode()}"}
            
            output = stdout.decode().splitlines()
            
            # Reset counters
            protocols = {"TCP": 0, "UDP": 0}
            sources = {}
            destinations = {}
            
            # Parse netstat output
            for line in output:
                if "ESTABLISHED" in line or "SYN_SENT" in line:
                    parts = line.split()
                    if len(parts) >= 5:
                        # Extract source and destination addresses
                        src_full = parts[3]
                        dst_full = parts[4]
                        
                        src_parts = src_full.split(":")
                        dst_parts = dst_full.split(":")
                        
                        if len(src_parts) >= 2 and len(dst_parts) >= 2:
                            src_ip = src_parts[0]
                            dst_ip = dst_parts[0]
                            
                            # Update counters
                            protocols["TCP"] += 1
                            sources[src_ip] = sources.get(src_ip, 0) + 1
                            destinations[dst_ip] = destinations.get(dst_ip, 0) + 1
            
            # Format for frontend display
            result = {
                "timestamp": time.time(),
                "protocols": [{"name": k, "value": v} for k, v in protocols.items()],
                "topSources": sorted(
                    [{"ip": k, "value": v} for k, v in sources.items()],
                    key=lambda x: x["value"],
                    reverse=True
                )[:5],
                "topDestinations": sorted(
                    [{"ip": k, "value": v} for k, v in destinations.items()],
                    key=lambda x: x["value"],
                    reverse=True
                )[:5]
            }
            
            # Update current traffic data
            self.current_traffic_data = {
                "protocols": protocols,
                "sources": sources,
                "destinations": destinations
            }
            
            return result
        except Exception as e:
            logging.error(f"Traffic analysis error: {str(e)}")
            return {"error": str(e)}

# Create instance
traffic_analyzer = TrafficAnalyzer()