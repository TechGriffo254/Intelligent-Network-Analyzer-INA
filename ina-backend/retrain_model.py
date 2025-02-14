import numpy as np
from sklearn.ensemble import IsolationForest
from joblib import dump

# Step 1: Generate realistic sample data

# Simulating normal network traffic
normal_data = np.random.normal(loc=100, scale=20, size=(1000, 3))  # avg_rtt, max_rtt, num_hops

# Simulating network anomalies
anomalies = np.random.uniform(low=300, high=1000, size=(50, 3))

# Combine normal data and anomalies
training_data = np.vstack((normal_data, anomalies))

# Step 2: Train the Isolation Forest model
model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
model.fit(training_data)

# Step 3: Save the trained model
dump(model, "network_anomaly_model.pkl")

print("✅ Model retrained and saved successfully!")
