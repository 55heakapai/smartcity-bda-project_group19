const express = require('express');
const router = express.Router();
const { generateHistoricalData, generateLiveSensorData } = require('../utils/dataSimulator');
const { getMLSummary } = require('../utils/mlPredictor');

// GET /api/analytics/overview
router.get('/overview', (req, res) => {
  const live = generateLiveSensorData();
  res.json({
    success: true,
    overview: {
      waste: {
        avgFillLevel: live.waste.summary.avgFillLevel,
        overflowRisk: live.waste.summary.overflowRisk,
        routeEfficiency: live.waste.summary.routeEfficiency,
      },
      traffic: {
        congestionIndex: live.traffic.summary.congestionIndex,
        avgSpeed: live.traffic.summary.avgCitySpeed,
        isPeakHour: live.traffic.summary.isPeakHour,
      },
      energy: {
        gridLoad: live.energy.summary.gridLoad,
        totalDemand: live.energy.summary.totalDemand,
        renewablePercent: live.energy.summary.renewablePercent,
        anomalies: live.energy.summary.anomaliesDetected,
      },
      timestamp: new Date().toISOString(),
    }
  });
});

// GET /api/analytics/history
router.get('/history', (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const history = generateHistoricalData(days, 'all');
  res.json({ success: true, history, days });
});

// GET /api/analytics/ml
router.get('/ml', (req, res) => {
  res.json({ success: true, ...getMLSummary() });
});

// GET /api/analytics/kpi
router.get('/kpi', (req, res) => {
  res.json({
    success: true,
    kpis: [
      { domain: 'Waste', metric: 'Trip Reduction', value: '30%', status: 'ACHIEVED', target: '25%' },
      { domain: 'Waste', metric: 'Overflow Events', value: '-42%', status: 'ACHIEVED', target: '-30%' },
      { domain: 'Traffic', metric: 'Congestion Reduction', value: '22%', status: 'ACHIEVED', target: '20%' },
      { domain: 'Traffic', metric: 'Emergency Response', value: '+34%', status: 'ACHIEVED', target: '+25%' },
      { domain: 'Energy', metric: 'Distribution Loss', value: '-18%', status: 'ACHIEVED', target: '-15%' },
      { domain: 'Energy', metric: 'Demand MAPE', value: '5.6%', status: 'ACHIEVED', target: '<8%' },
    ],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

// ─── Alerts Routes 
const alertRouter = express.Router();
let alertStore = [];

alertRouter.get('/', (req, res) => {
  // Generate some sample alerts
  const live = generateLiveSensorData();
  const alerts = [];

  live.waste.bins.forEach(bin => {
    if (bin.fillLevel > 85) alerts.push({
      id: `W-${Date.now()}-${bin.id}`, type: 'WASTE', severity: 'HIGH',
      message: `Bin ${bin.id} in ${bin.zone} at ${bin.fillLevel}% capacity`,
      timestamp: new Date().toISOString(), acknowledged: false
    });
  });

  if (live.traffic.summary.congestionIndex > 70) alerts.push({
    id: `T-${Date.now()}`, type: 'TRAFFIC', severity: 'HIGH',
    message: `High traffic congestion: index ${live.traffic.summary.congestionIndex}`,
    timestamp: new Date().toISOString(), acknowledged: false
  });

  if (live.energy.summary.gridLoad > 85) alerts.push({
    id: `E-${Date.now()}`, type: 'ENERGY', severity: 'CRITICAL',
    message: `Grid overload warning: ${live.energy.summary.gridLoad}% load`,
    timestamp: new Date().toISOString(), acknowledged: false
  });

  res.json({ success: true, alerts, count: alerts.length, timestamp: new Date().toISOString() });
});

alertRouter.post('/acknowledge/:id', (req, res) => {
  res.json({ success: true, message: `Alert ${req.params.id} acknowledged`, timestamp: new Date().toISOString() });
});

module.exports.analyticsRouter = router;
module.exports.alertRouter = alertRouter;
module.exports = router;
