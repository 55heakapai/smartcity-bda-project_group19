const express = require('express');
const router = express.Router();
const { generateTrafficData, generateHistoricalData } = require('../utils/dataSimulator');
const { predictTrafficCongestion } = require('../utils/mlPredictor');

router.get('/live', (req, res) => {
  res.json({ success: true, data: generateTrafficData() });
});

router.get('/intersections', (req, res) => {
  const data = generateTrafficData();
  res.json({ success: true, intersections: data.intersections, count: data.intersections.length });
});

router.get('/summary', (req, res) => {
  const data = generateTrafficData();
  res.json({ success: true, summary: data.summary, timestamp: data.timestamp });
});

router.get('/predict', (req, res) => {
  const data = generateTrafficData();
  const predictions = predictTrafficCongestion(data.intersections);
  res.json({
    success: true, predictions,
    model: 'LSTM Neural Network v3.0',
    accuracy: '88.7%',
    forecastHorizon: '30 minutes',
    timestamp: new Date().toISOString()
  });
});

router.get('/history', (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const history = generateHistoricalData(Math.min(days, 90), 'traffic');
  res.json({ success: true, history, days });
});

router.get('/signals', (req, res) => {
  const data = generateTrafficData();
  res.json({
    success: true,
    adaptiveSignals: data.intersections.map(i => ({
      intersection: i.name,
      currentPhase: i.signalPhase,
      greenDuration: Math.floor(Math.random() * 40 + 20),
      redDuration: Math.floor(Math.random() * 30 + 20),
      adaptiveMode: i.congestionLevel === 'HIGH' || i.congestionLevel === 'CRITICAL',
      vehiclesCleared: Math.floor(Math.random() * 50 + 20),
    })),
    mode: 'ADAPTIVE_ML_CONTROLLED',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
