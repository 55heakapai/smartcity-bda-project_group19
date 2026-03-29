"""
ML Model — Waste Overflow Prediction (Random Forest)
=====================================================
Trains a Random Forest classifier to predict bin overflow.

Features used:
  - fill_level, weight, temperature
  - hour_of_day, day_of_week
  - zone (encoded), is_event_nearby
  - days_since_last_collection

Target:
  - overflow_risk_4h (1 = overflow likely in 4h, 0 = no risk)

Run:
    pip install scikit-learn pandas numpy joblib matplotlib
    python ml/models/waste_overflow_model.py
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score, classification_report,
    confusion_matrix, roc_auc_score
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
import joblib
import os

OUTPUT_DIR = "ml/models/saved"
os.makedirs(OUTPUT_DIR, exist_ok=True)

ZONES = ['Dharampeth', 'Sitabuldi', 'Gandhibagh', 'Lakadganj', 'Sadar', 'Itwari', 'Manewada', 'Hingna']

np.random.seed(42)


def generate_training_data(n=10000):
    """Simulate 18 months of historical waste sensor readings."""
    data = []
    for _ in range(n):
        zone = np.random.choice(ZONES)
        fill_level = np.random.uniform(5, 100)
        hour = np.random.randint(0, 24)
        day = np.random.randint(0, 7)
        is_event = np.random.choice([0, 1], p=[0.85, 0.15])

        # Overflow risk: higher fill + hot temp + event nearby = higher risk
        noise = np.random.normal(0, 5)
        overflow_prob = (fill_level / 100) * 0.7 + (is_event * 0.15) + noise * 0.01
        overflow_risk = 1 if (fill_level + noise > 75 or overflow_prob > 0.75) else 0

        data.append({
            'fill_level': fill_level,
            'weight': fill_level * 0.8 + np.random.uniform(-10, 10),
            'temperature': np.random.uniform(20, 50),
            'hour_of_day': hour,
            'day_of_week': day,
            'is_weekend': 1 if day >= 5 else 0,
            'zone': zone,
            'is_event_nearby': is_event,
            'days_since_collection': np.random.randint(0, 5),
            'collection_count_week': np.random.randint(1, 7),
            'fill_velocity': np.random.uniform(0, 15),   # % per hour
            'overflow_risk_4h': overflow_risk,
        })
    return pd.DataFrame(data)


def train_and_evaluate():
    print("=" * 60)
    print("🗑️  Waste Overflow Predictor — Random Forest Training")
    print("    Group 19 | BDA Project")
    print("=" * 60)

    print("\n📦 Generating training dataset (simulates 18 months HDFS data)...")
    df = generate_training_data(n=50000)
    print(f"   Dataset shape: {df.shape}")
    print(f"   Overflow rate: {df['overflow_risk_4h'].mean():.2%}")

    # Encode categorical
    le = LabelEncoder()
    df['zone_encoded'] = le.fit_transform(df['zone'])

    FEATURES = [
        'fill_level', 'weight', 'temperature', 'hour_of_day', 'day_of_week',
        'is_weekend', 'zone_encoded', 'is_event_nearby', 'days_since_collection',
        'collection_count_week', 'fill_velocity',
    ]
    TARGET = 'overflow_risk_4h'

    X = df[FEATURES]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    print(f"\n📊 Train: {len(X_train)} | Test: {len(X_test)}")

    # Model
    print("\n🏋️  Training Random Forest Classifier...")
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=15,
        min_samples_leaf=5,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    accuracy = accuracy_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_proba)
    cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='accuracy')

    print("\n📈 RESULTS:")
    print(f"   Accuracy:       {accuracy:.4f} ({accuracy*100:.2f}%)")
    print(f"   ROC-AUC:        {auc:.4f}")
    print(f"   CV Accuracy:    {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
    print("\n" + classification_report(y_test, y_pred, target_names=['No Risk', 'Overflow Risk']))

    # Feature importance
    importance = pd.DataFrame({
        'feature': FEATURES,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    print("\n🔑 TOP FEATURES:")
    print(importance.to_string(index=False))

    # Save model
    model_path = os.path.join(OUTPUT_DIR, "waste_overflow_model.pkl")
    encoder_path = os.path.join(OUTPUT_DIR, "zone_encoder.pkl")
    joblib.dump(model, model_path)
    joblib.dump(le, encoder_path)
    print(f"\n✅ Model saved: {model_path}")
    print(f"✅ Encoder saved: {encoder_path}")

    return model, le


def predict_overflow(bin_data, model, le):
    """Run inference on a new bin reading."""
    df = pd.DataFrame([{
        'fill_level': bin_data['fillLevel'],
        'weight': bin_data.get('weight', bin_data['fillLevel'] * 0.8),
        'temperature': bin_data.get('temperature', 30),
        'hour_of_day': pd.Timestamp.now().hour,
        'day_of_week': pd.Timestamp.now().dayofweek,
        'is_weekend': 1 if pd.Timestamp.now().dayofweek >= 5 else 0,
        'zone_encoded': le.transform([bin_data.get('zone', 'Sitabuldi')])[0],
        'is_event_nearby': 0,
        'days_since_collection': 1,
        'collection_count_week': 3,
        'fill_velocity': 5.0,
    }])
    proba = model.predict_proba(df)[0][1]
    return {'overflow_probability': proba, 'risk': 'HIGH' if proba > 0.7 else 'MEDIUM' if proba > 0.4 else 'LOW'}


if __name__ == "__main__":
    model, le = train_and_evaluate()

    print("\n🔮 SAMPLE PREDICTIONS:")
    test_bins = [
        {'fillLevel': 92, 'zone': 'Sitabuldi', 'temperature': 38},
        {'fillLevel': 55, 'zone': 'Dharampeth', 'temperature': 28},
        {'fillLevel': 20, 'zone': 'Sadar', 'temperature': 25},
    ]
    for bin_data in test_bins:
        result = predict_overflow(bin_data, model, le)
        print(f"   Fill: {bin_data['fillLevel']}% → Risk: {result['risk']} (prob: {result['overflow_probability']:.3f})")
