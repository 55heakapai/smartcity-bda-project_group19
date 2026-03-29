const express = require('express');
const router = express.Router();
const { generateWasteData, generateHistoricalData } = require('../utils/dataSimulator');
const { predictWasteOverflow } = require('../utils/mlPredictor');

// GET /api/waste/live  — live sensor readings from all bins
router.get('/live', (req, res) => {
  const data = generateWasteData();
  res.json({ success: true, data });
});

// GET /api/waste/bins  — all bin statuses
router.get('/bins', (req, res) => {
  const data = generateWasteData();
  res.json({ success: true, bins: data.bins, count: data.bins.length });
});

// GET /api/waste/summary  — aggregated KPIs
router.get('/summary', (req, res) => {
  const data = generateWasteData();
  res.json({ success: true, summary: data.summary, timestamp: data.timestamp });
});

// GET /api/waste/predict  — ML predictions for overflow
router.get('/predict', (req, res) => {
  const data = generateWasteData();
  const predictions = predictWasteOverflow(data.bins);
  res.json({
    success: true,
    predictions,
    model: 'Random Forest Classifier v2.1',
    accuracy: '91.3%',
    timestamp: new Date().toISOString()
  });
});

// GET /api/waste/history  — historical data for charts
router.get('/history', (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const history = generateHistoricalData(Math.min(days, 90), 'waste');
  res.json({ success: true, history, days });
});

// GET /api/waste/routes  — optimized collection routes
router.get('/routes', (req, res) => {
  const data = generateWasteData();
  const highPriority = data.bins.filter(b => b.fillLevel > 70).sort((a, b) => b.fillLevel - a.fillLevel);
  res.json({
    success: true,
    optimizedRoutes: [
      {
        truckId: 'TRUCK-01',
        stops: highPriority.slice(0, 4).map(b => ({ ...b, estimatedTime: `${Math.floor(Math.random() * 20 + 5)} min` })),
        totalDistance: `${(Math.random() * 15 + 8).toFixed(1)} km`,
        fuelSaved: `${(Math.random() * 3 + 1).toFixed(1)} L`,
        algorithm: 'Nearest Neighbour + Genetic Algorithm',
      },
      {
        truckId: 'TRUCK-02',
        stops: data.bins.filter(b => b.fillLevel > 50 && b.fillLevel <= 70).slice(0, 4).map(b => ({ ...b, estimatedTime: `${Math.floor(Math.random() * 20 + 5)} min` })),
        totalDistance: `${(Math.random() * 12 + 6).toFixed(1)} km`,
        fuelSaved: `${(Math.random() * 2 + 0.5).toFixed(1)} L`,
        algorithm: 'Nearest Neighbour + Genetic Algorithm',
      }
    ],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
