const express = require('express');
const router = express.Router();
const { generateEnergyData, generateHistoricalData } = require('../utils/dataSimulator');
const { predictEnergyDemand } = require('../utils/mlPredictor');

router.get('/live', (req, res) => {
  res.json({ success: true, data: generateEnergyData() });
});

router.get('/zones', (req, res) => {
  const data = generateEnergyData();
  res.json({ success: true, zones: data.zones, count: data.zones.length });
});

router.get('/summary', (req, res) => {
  const data = generateEnergyData();
  res.json({ success: true, summary: data.summary, timestamp: data.timestamp });
});

router.get('/predict', (req, res) => {
  const data = generateEnergyData();
  const predictions = predictEnergyDemand(data.zones);
  res.json({
    success: true, predictions,
    model: 'Prophet + XGBoost Ensemble v2.3',
    mape: '5.6%',
    timestamp: new Date().toISOString()
  });
});

router.get('/history', (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const history = generateHistoricalData(Math.min(days, 90), 'energy');
  res.json({ success: true, history, days });
});

router.get('/anomalies', (req, res) => {
  const data = generateEnergyData();
  const anomalies = data.zones
    .filter(z => z.anomalyScore > 0.2)
    .map(z => ({
      zone: z.zone,
      anomalyScore: z.anomalyScore,
      severity: z.anomalyScore > 0.25 ? 'HIGH' : 'MEDIUM',
      type: ['Power Theft', 'Equipment Fault', 'Meter Tampering', 'Grid Fault'][Math.floor(Math.random() * 4)],
      detectedAt: new Date().toISOString(),
      model: 'Isolation Forest',
    }));
  res.json({ success: true, anomalies, totalDetected: anomalies.length, timestamp: new Date().toISOString() });
});

module.exports = router;
