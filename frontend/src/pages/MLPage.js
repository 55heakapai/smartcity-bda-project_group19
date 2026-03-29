import React from 'react';
import { useApi } from '../hooks/useApi';
import { SectionTitle, Card, Grid, Badge } from '../components/shared/UI';

const MODEL_DETAILS = [
  {
    name: 'Waste Overflow Predictor',
    algorithm: 'Random Forest Classifier',
    framework: 'scikit-learn',
    accuracy: '91.3%',
    features: ['Fill level history', 'Time of day', 'Day of week', 'Weather', 'Event calendar', 'Route proximity', 'Bin age', 'Collection history', 'Zone type', 'Population density', 'Temperature', 'Humidity'],
    target: 'Overflow probability in 4h',
    dataSize: '18 months, ~2.1M records',
    retraining: 'Weekly (Sunday 02:00 IST)',
    color: '#f59e0b',
    icon: '🗑️',
  },
  {
    name: 'Traffic Congestion Forecaster',
    algorithm: 'LSTM Neural Network',
    framework: 'PyTorch',
    accuracy: '88.7%',
    features: ['Vehicle count (t-1 to t-30)', 'Avg speed', 'Signal phase', 'Weather', 'Time features', 'Special events', 'Historical patterns', 'Adjacent intersections', 'GPS speed data', 'Accident incidents', 'Road work flags', 'Hour/day/month'],
    target: 'Congestion level (30-min ahead)',
    dataSize: '2 years, ~8.7M records',
    retraining: 'Nightly (02:00 IST)',
    color: '#ef4444',
    icon: '🚦',
  },
  {
    name: 'Energy Demand Forecaster',
    algorithm: 'Prophet + XGBoost Ensemble',
    framework: 'Facebook Prophet + XGBoost',
    accuracy: '94.2% (MAPE 5.6%)',
    features: ['Historical demand', 'Temperature', 'Humidity', 'Solar irradiance', 'Time features', 'Holiday flags', 'Industrial activity', 'Consumer growth', 'AC penetration rate', 'Smart meter data', 'Weekday/weekend', 'Season'],
    target: 'kW demand (hour-ahead)',
    dataSize: '3 years, ~26M records',
    retraining: 'Nightly (03:00 IST)',
    color: '#02C39A',
    icon: '⚡',
  },
  {
    name: 'Energy Anomaly Detector',
    algorithm: 'Isolation Forest',
    framework: 'scikit-learn',
    accuracy: '93.8% recall',
    features: ['Current draw', 'Power factor', 'Voltage variation', 'Usage pattern deviation', 'Time-of-day norm', 'Zone baseline', 'Meter reading gaps', 'Sudden spike'],
    target: 'Anomaly score (0-1)',
    dataSize: '1 year, ~5.2M records',
    retraining: 'Daily (04:00 IST)',
    color: '#8b5cf6',
    icon: '🔍',
  },
];

function AccuracyBar({ val }) {
  const num = parseFloat(val);
  const color = num > 90 ? '#02C39A' : num > 85 ? '#f59e0b' : '#ef4444';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#64748b' }}>Accuracy</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{val}</span>
      </div>
      <div style={{ background: '#1e2a3a', borderRadius: 4, height: 6 }}>
        <div style={{ width: `${Math.min(num, 100)}%`, height: '100%', background: color, borderRadius: 4 }} />
      </div>
    </div>
  );
}

export default function MLPage() {
  const { data: mlData } = useApi('/analytics/ml', 60000);

  return (
    <div>
      <SectionTitle sub="Machine learning models powering the Smart City predictions pipeline">
        🤖 ML Models & Predictions Engine
      </SectionTitle>

      {/* Pipeline overview */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 16 }}>
          ⚙️ ML Pipeline Architecture
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', paddingBottom: 8 }}>
          {[
            { label: 'Raw IoT Data', sub: 'HDFS / Kafka', icon: '📡' },
            { label: 'Feature Eng.', sub: 'Spark MLlib', icon: '🔧' },
            { label: 'Training', sub: 'scikit / PyTorch', icon: '🏋️' },
            { label: 'Validation', sub: 'K-Fold CV', icon: '✅' },
            { label: 'Deployment', sub: 'Flask API', icon: '🚀' },
            { label: 'Inference', sub: 'Real-time', icon: '⚡' },
            { label: 'Monitoring', sub: 'MAPE/Accuracy', icon: '📊' },
          ].map((step, i, arr) => (
            <React.Fragment key={i}>
              <div style={{
                minWidth: 110, textAlign: 'center', padding: '12px 8px',
                background: '#111827', borderRadius: 8, border: '1px solid #1e2a3a'
              }}>
                <div style={{ fontSize: 20 }}>{step.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0', marginTop: 4 }}>{step.label}</div>
                <div style={{ fontSize: 9, color: '#64748b' }}>{step.sub}</div>
              </div>
              {i < arr.length - 1 && (
                <div style={{ fontSize: 18, color: '#02C39A', padding: '0 4px', flexShrink: 0 }}>→</div>
              )}
            </React.Fragment>
          ))}
        </div>
      </Card>

      {/* Model cards */}
      <Grid cols={2} style={{ marginBottom: 24 }}>
        {MODEL_DETAILS.map(model => (
          <Card key={model.name}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 24 }}>{model.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{model.name}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{model.algorithm}</div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span style={{ fontSize: 10, background: '#1e2a3a', padding: '3px 8px', borderRadius: 4, color: model.color, fontWeight: 600 }}>
                  {model.framework}
                </span>
              </div>
            </div>

            <AccuracyBar val={model.accuracy} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '16px 0' }}>
              {[
                { label: 'Target Variable', val: model.target },
                { label: 'Training Data', val: model.dataSize },
                { label: 'Retraining Schedule', val: model.retraining },
                { label: 'Feature Count', val: `${model.features.length} features` },
              ].map(({ label, val }) => (
                <div key={label} style={{ padding: 10, background: '#111827', borderRadius: 6 }}>
                  <div style={{ fontSize: 9, color: '#64748b', marginBottom: 3, textTransform: 'uppercase' }}>{label}</div>
                  <div style={{ fontSize: 11, color: '#cbd5e1' }}>{val}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8, fontWeight: 600 }}>FEATURES USED:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {model.features.map(f => (
                <span key={f} style={{ fontSize: 9, padding: '2px 7px', background: '#1e2a3a', borderRadius: 20, color: '#94a3b8' }}>{f}</span>
              ))}
            </div>
          </Card>
        ))}
      </Grid>

      {/* Spark MLlib info */}
      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 16 }}>
          ⚡ Apache Spark MLlib Integration
        </div>
        <Grid cols={3}>
          {[
            { title: 'Distributed Training', desc: 'Models retrained nightly on full HDFS dataset using Spark\'s distributed ML pipeline across 5-node cluster', icon: '🔄' },
            { title: 'Real-time Inference', desc: 'Trained models serialized to MLflow registry; Flask microservice loads and serves predictions via REST API', icon: '🚀' },
            { title: 'Feature Pipeline', desc: 'Spark ML Pipeline handles imputation, scaling, encoding, and feature selection before model ingestion', icon: '🔧' },
          ].map(({ title, desc, icon }) => (
            <div key={title} style={{ padding: 16, background: '#111827', borderRadius: 10, border: '1px solid #1e2a3a' }}>
              <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 6 }}>{title}</div>
              <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </Grid>
      </Card>
    </div>
  );
}
