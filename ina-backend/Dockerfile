# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Install system dependencies (ping, traceroute)
RUN apt-get update && apt-get install -y \
    iputils-ping \
    traceroute \
    dnsutils \
    net-tools \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and model file first (for build caching)
COPY ina-backend/requirements.txt .
COPY ina-backend/network_anomaly_model.pkl .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend code 
COPY ina-backend/ .

# Expose the port FastAPI will run on
EXPOSE 8000

# Command to run the FastAPI application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]