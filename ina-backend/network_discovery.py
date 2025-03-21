import asyncio
import ipaddress
import logging
from typing import Dict, List, Any
import socket

class NetworkDiscovery:
    async def discover_network(self, subnet: str) -> Dict[str, Any]:
        """Discover devices in the specified subnet"""
        try:
            network = ipaddress.ip_network(subnet)
            logging.info(f"Starting network discovery for {subnet}")
            
            # Create tasks for all hosts in the subnet
            tasks = []
            for ip in network.hosts():
                ip_str = str(ip)
                tasks.append(self.check_host(ip_str))
            
            # Run all tasks concurrently (with a limit to avoid overloading)
            chunk_size = 20
            active_hosts = []
            for i in range(0, len(tasks), chunk_size):
                chunk_results = await asyncio.gather(*tasks[i:i+chunk_size])
                active_hosts.extend([host for host in chunk_results if host])
            
            return {
                "subnet": subnet,
                "total_hosts": network.num_addresses - 2,  # Exclude network and broadcast addresses
                "discovered_hosts": len(active_hosts),
                "devices": active_hosts
            }
        except Exception as e:
            logging.error(f"Network discovery error: {str(e)}")
            return {"error": str(e)}
    
    async def check_host(self, ip: str) -> Dict[str, Any]:
        """Check if a host is active and get basic info"""
        try:
            # Run ping command
            proc = await asyncio.create_subprocess_exec(
                "ping", "-c", "1", "-W", "1", ip,
                stdout=asyncio.subprocess.PIPE, 
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await proc.communicate()
            
            if proc.returncode == 0:
                # Host is active, try to get hostname
                try:
                    hostname, _, _ = socket.gethostbyaddr(ip)
                except (socket.herror, socket.gaierror):
                    hostname = ""
                
                # Return device info
                return {
                    "ip": ip,
                    "hostname": hostname,
                    "status": "active"
                }
            return None  # Host is not active
        except Exception as e:
            logging.error(f"Error checking host {ip}: {str(e)}")
            return None

# Create instance
network_discovery = NetworkDiscovery()