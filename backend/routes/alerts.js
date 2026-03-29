const express = require('express');
const router = express.Router();
const { generateLiveSensorData } = require('../utils/dataSimulator');

router.get('/', (req, res) => {
  const live = generateLiveSensorData();
  const alerts = [];

  live.waste.bins.forEach(bin => {
    if (bin.fillLevel > 85) alerts.push({
      id: `W-${bin.id}-${Date.now()}`, type: 'WASTE', severity: 'HIGH',
      message: `Bin ${bin.id} in ${bin.zone} at ${bin.fillLevel}% capacity`,
      timestamp: new Date().toISOString(), acknowledged: false
    });
  });

  if (live.traffic.summary.congestionIndex > 70) alerts.push({
    id: `T-${Date.now()}`, type: 'TRAFFIC', severity: 'HIGH',
    message: `High congestion: index ${live.traffic.summary.congestionIndex}`,
    timestamp: new Date().toISOString(), acknowledged: false
  });

  if (live.energy.summary.gridLoad > 85) alerts.push({
    id: `E-${Date.now()}`, type: 'ENERGY', severity: 'CRITICAL',
    message: `Grid overload: ${live.energy.summary.gridLoad}% load`,
    timestamp: new Date().toISOString(), acknowledged: false
  });

  res.json({ success: true, alerts, count: alerts.length });
});

router.post('/acknowledge/:id', (req, res) => {
  res.json({ success: true, message: `Alert ${req.params.id} acknowledged` });
});

module.exports = router;
