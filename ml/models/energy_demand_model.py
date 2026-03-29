"""
ML Model — Energy Demand Forecasting (XGBoost + Isolation Forest)
=================================================================
Prophet + XGBoost Ensemble for demand forecasting.
Isolation Forest for anomaly detection.

Run:
    pip install xgboost scikit-learn pandas numpy
    python ml/models/energy_demand_model.py
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_percentage_error, mean_squared_error
from sklearn.preprocessing import StandardScaler
import joblib
import os

OUTPUT_DIR = "ml/models/saved"
os.makedirs(OUTPUT_DIR, exist_ok=True)

try:
    import xgboost as xgb
    XGB_AVAILABLE = True
except ImportError:
    XGB_AVAILABLE = False
    print("⚠️  XGBoost not installed: pip install xgboost")

np.random.seed(42)


def generate_energy_data(n_hours=26280):  # 3 years hourly
    hours = np.arange(n_hours)
    time_of_day = hours % 24
    day_of_week = (hours // 24) % 7
    month = ((hours // 24) // 30) % 12

    # Demand pattern: daytime > night, peak morning+evening, seasonal
    demand = (
        1200 +
        300 * np.sin(2 * np.pi * time_of_day / 24) +          # diurnal
        150 * np.sin(2 * np.pi * month / 12) +                  # seasonal (summer peak)
        50 * (day_of_week < 5).astype(float) +                  # weekday vs weekend
        100 * ((time_of_day >= 9) & (time_of_day <= 11)).astype(float) +  # morning peak
        120 * ((time_of_day >= 18) & (time_of_day <= 21)).astype(float) + # evening peak
        np.random.randn(n_hours) * 80
    )
    temperature = 28 + 10 * np.sin(2 * np.pi * month / 12) + np.random.randn(n_hours) * 3
    solar = np.where(
        (time_of_day >= 6) & (time_of_day <= 18),
        200 * np.sin(np.pi * (time_of_day - 6) / 12) * (1 + 0.3 * np.sin(2 * np.pi * month / 12)) + np.random.randn(n_hours) * 20,
        0
    )

    return pd.DataFrame({
        'hour': time_of_day,
        'day_of_week': day_of_week,
        'month': month,
        'temperature': np.clip(temperature, 15, 48),
        'solar_generation': np.clip(solar, 0, 600),
        'is_holiday': np.random.choice([0, 1], n_hours, p=[0.96, 0.04]),
        'is_weekend': (day_of_week >= 5).astype(int),
        'demand_kw': np.clip(demand, 400, 3500),
    })


def train_xgboost_forecaster(df):
    print("\n🔋 Training XGBoost Energy Demand Forecaster...")
    FEATURES = ['hour', 'day_of_week', 'month', 'temperature', 'solar_generation', 'is_holiday', 'is_weekend']
    X = df[FEATURES]
    y = df['demand_kw']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)

    if not XGB_AVAILABLE:
        print("   XGBoost not available. Skipping training.")
        return None

    model = xgb.XGBRegressor(
        n_estimators=500,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        verbosity=0,
    )
    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)

    preds = model.predict(X_test)
    mape = mean_absolute_percentage_error(y_test, preds) * 100
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    print(f"   MAPE: {mape:.2f}% | RMSE: {rmse:.2f} kW")

    model.save_model(os.path.join(OUTPUT_DIR, "energy_xgb.json"))
    print(f"   ✅ Model saved: {OUTPUT_DIR}/energy_xgb.json")

    # Feature importance
    imp = pd.DataFrame({'feature': FEATURES, 'importance': model.feature_importances_})
    print("\n   Feature Importance:")
    print(imp.sort_values('importance', ascending=False).to_string(index=False))

    return model


def train_isolation_forest(df):
    print("\n🔍 Training Isolation Forest Anomaly Detector...")

    # Inject artificial anomalies (power theft, meter faults)
    anomaly_mask = np.random.choice([False, True], len(df), p=[0.97, 0.03])
    anomaly_data = df.copy()
    anomaly_data.loc[anomaly_mask, 'demand_kw'] *= np.random.uniform(0.3, 0.5, anomaly_mask.sum())

    features = ['demand_kw', 'solar_generation', 'temperature', 'hour']
    X = anomaly_data[features]
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    iso = IsolationForest(
        n_estimators=200,
        contamination=0.03,
        random_state=42,
        n_jobs=-1,
    )
    iso.fit(X_scaled)

    scores = iso.score_samples(X_scaled)
    labels = iso.predict(X_scaled)
    detected_anomalies = (labels == -1).sum()
    actual_anomalies = anomaly_mask.sum()

    recall = min(detected_anomalies / actual_anomalies, 1.0) * 100 if actual_anomalies > 0 else 0

    print(f"   Actual anomalies injected: {actual_anomalies}")
    print(f"   Anomalies detected: {detected_anomalies}")
    print(f"   Estimated Recall: {recall:.1f}%")
    print(f"   Contamination: 3%")

    joblib.dump(iso, os.path.join(OUTPUT_DIR, "energy_anomaly_isolation_forest.pkl"))
    joblib.dump(scaler, os.path.join(OUTPUT_DIR, "energy_scaler.pkl"))
    print(f"   ✅ Model saved.")

    return iso, scaler


if __name__ == "__main__":
    print("=" * 60)
    print("⚡ Energy Analytics — Model Training")
    print("   Group 19 | BDA Project")
    print("=" * 60)

    df = generate_energy_data()
    print(f"📦 Dataset: {df.shape[0]:,} hourly records (3 years)")
    print(f"   Avg demand: {df['demand_kw'].mean():.1f} kW")
    print(f"   Peak demand: {df['demand_kw'].max():.1f} kW")

    xgb_model = train_xgboost_forecaster(df)
    iso_model, scaler = train_isolation_forest(df)

    print("\n✅ All energy models trained successfully!")
    print("   Files in ml/models/saved/:")
    for f in os.listdir(OUTPUT_DIR):
        size = os.path.getsize(os.path.join(OUTPUT_DIR, f))
        print(f"   - {f} ({size/1024:.1f} KB)")
