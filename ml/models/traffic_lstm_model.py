"""
ML Model — Traffic Congestion Forecasting (LSTM)
=================================================
Trains an LSTM neural network to predict congestion
30 minutes ahead using time-series traffic data.

Run:
    pip install torch scikit-learn pandas numpy
    python ml/models/traffic_lstm_model.py
"""

import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error
import os

OUTPUT_DIR = "ml/models/saved"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Check PyTorch availability
try:
    import torch
    import torch.nn as nn
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    print("⚠️  PyTorch not installed. Showing architecture only.")
    print("   Install with: pip install torch")

np.random.seed(42)
SEQ_LEN = 30      # Use 30 time steps (30 min) to predict next step
FEATURES = 5      # vehicle_count, avg_speed, wait_time, hour, is_peak
HIDDEN_DIM = 128
NUM_LAYERS = 2
EPOCHS = 30
BATCH_SIZE = 64


def generate_traffic_series(n=10000):
    """Simulate 2 years of hourly traffic data."""
    hours = np.arange(n)
    # Morning and evening peaks
    peak_pattern = (
        0.4 * np.sin(2 * np.pi * hours / 24 - 2) +    # morning peak ~8AM
        0.3 * np.sin(2 * np.pi * hours / 24 - 5) +    # evening peak ~5PM
        0.1 * np.random.randn(n)
    )
    vehicle_count = np.clip(150 + 100 * peak_pattern + np.random.randn(n) * 20, 20, 400)
    avg_speed = np.clip(50 - 0.12 * vehicle_count + np.random.randn(n) * 3, 5, 80)
    wait_time = np.clip(10 + 0.3 * vehicle_count + np.random.randn(n) * 5, 5, 300)
    hour_of_day = hours % 24
    is_peak = ((hour_of_day >= 8) & (hour_of_day <= 10)) | ((hour_of_day >= 17) & (hour_of_day <= 20))
    congestion_index = np.clip(vehicle_count / 3 + np.random.randn(n) * 5, 10, 100)

    return pd.DataFrame({
        'vehicle_count': vehicle_count,
        'avg_speed': avg_speed,
        'wait_time': wait_time,
        'hour_of_day': hour_of_day.astype(float),
        'is_peak': is_peak.astype(float),
        'congestion_index': congestion_index,
    })


def make_sequences(data, seq_len, target_col_idx=5):
    X, y = [], []
    for i in range(len(data) - seq_len):
        X.append(data[i:i + seq_len, :FEATURES])
        y.append(data[i + seq_len, target_col_idx])
    return np.array(X, dtype=np.float32), np.array(y, dtype=np.float32)


if TORCH_AVAILABLE:
    class TrafficLSTM(nn.Module):
        def __init__(self, input_dim, hidden_dim, num_layers, output_dim=1, dropout=0.2):
            super().__init__()
            self.lstm = nn.LSTM(
                input_size=input_dim,
                hidden_size=hidden_dim,
                num_layers=num_layers,
                batch_first=True,
                dropout=dropout if num_layers > 1 else 0,
            )
            self.fc = nn.Sequential(
                nn.Linear(hidden_dim, 64),
                nn.ReLU(),
                nn.Dropout(0.1),
                nn.Linear(64, output_dim)
            )

        def forward(self, x):
            out, _ = self.lstm(x)
            return self.fc(out[:, -1, :]).squeeze(-1)


def train_model():
    print("=" * 60)
    print("🚦 Traffic Congestion LSTM — Training")
    print("   Group 19 | BDA Project")
    print("=" * 60)

    print("\n📦 Generating 2-year traffic time series...")
    df = generate_traffic_series(n=17520)   # 2 years hourly
    print(f"   Shape: {df.shape}")

    scaler = MinMaxScaler()
    scaled = scaler.fit_transform(df.values)

    X, y = make_sequences(scaled, SEQ_LEN)
    split = int(0.8 * len(X))
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]
    print(f"   Train: {len(X_train)} | Test: {len(X_test)} sequences")

    if not TORCH_AVAILABLE:
        print("\n❌ PyTorch not available. Cannot train. Architecture shown:")
        print(f"   LSTM(input={FEATURES}, hidden={HIDDEN_DIM}, layers={NUM_LAYERS})")
        print(f"   FC: {HIDDEN_DIM} → 64 → 1 (congestion index)")
        return None, None

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"\n💻 Training on: {device}")

    model = TrafficLSTM(FEATURES, HIDDEN_DIM, NUM_LAYERS).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    scheduler = torch.optim.lr_scheduler.StepLR(optimizer, step_size=10, gamma=0.5)
    criterion = nn.MSELoss()

    X_tr = torch.FloatTensor(X_train).to(device)
    y_tr = torch.FloatTensor(y_train).to(device)
    X_te = torch.FloatTensor(X_test).to(device)

    print(f"\n🏋️  Training {EPOCHS} epochs, batch {BATCH_SIZE}...")
    for epoch in range(EPOCHS):
        model.train()
        total_loss = 0
        for i in range(0, len(X_tr), BATCH_SIZE):
            xb = X_tr[i:i + BATCH_SIZE]
            yb = y_tr[i:i + BATCH_SIZE]
            optimizer.zero_grad()
            loss = criterion(model(xb), yb)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            total_loss += loss.item()
        scheduler.step()

        if (epoch + 1) % 5 == 0:
            model.eval()
            with torch.no_grad():
                val_pred = model(X_te).cpu().numpy()
            val_rmse = np.sqrt(mean_squared_error(y_test, val_pred))
            print(f"   Epoch {epoch+1:3d}/{EPOCHS} | Loss: {total_loss/len(X_tr)*BATCH_SIZE:.5f} | Val RMSE: {val_rmse:.4f}")

    # Evaluate
    model.eval()
    with torch.no_grad():
        preds = model(X_te).cpu().numpy()
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    mae = mean_absolute_error(y_test, preds)
    print(f"\n📈 RESULTS:\n   RMSE: {rmse:.4f} | MAE: {mae:.4f}")

    model_path = os.path.join(OUTPUT_DIR, "traffic_lstm.pt")
    torch.save(model.state_dict(), model_path)
    print(f"✅ Model saved: {model_path}")
    return model, scaler


if __name__ == "__main__":
    model, scaler = train_model()
    print("\n✅ LSTM training complete.")
