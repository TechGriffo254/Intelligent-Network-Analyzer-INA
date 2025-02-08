import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
import joblib

# Generate simulated network traffic data
def generate_training_data():
    np.random.seed(42)
    normal_traffic = np.random.normal(loc=100, scale=10, size=(1000, 3))
    anomaly_traffic = np.random.normal(loc=200, scale=50, size=(50, 3))  # Simulated anomalies

    data = np.vstack((normal_traffic, anomaly_traffic))
    labels = np.hstack((np.zeros(1000), np.ones(50)))  # 0 = normal, 1 = anomaly

    df = pd.DataFrame(data, columns=["packet_size", "response_time", "connections"])
    df["label"] = labels
    return df

# Train an anomaly detection model
def train_model():
    df = generate_training_data()

    model = IsolationForest(contamination=0.05)  # 5% contamination (anomalies)
    model.fit(df[["packet_size", "response_time", "connections"]])

    # Save model
    joblib.dump(model, "network_anomaly_model.pkl")
    print("Model trained and saved as 'network_anomaly_model.pkl'.")

if __name__ == "__main__":
    train_model()
