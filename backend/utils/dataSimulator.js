/**
 * Smart City Sensor Data Simulator
 * Simulates real-time IoT data from:
 * - Waste bin ultrasonic sensors
 * - Traffic CCTV / GPS / signal systems
 * - Smart electricity meters / grid SCADA
 *
 * In production, this is replaced by Apache Kafka consumers
 * receiving data from real IoT devices.
 */

const NAGPUR_ZONES = ['Dharampeth', 'Sitabuldi', 'Gandhibagh', 'Lakadganj', 'Sadar', 'Itwari', 'Manewada', 'Hingna'];
const INTERSECTIONS = ['Sitabuldi Sq', 'Zero Mile', 'Kasturchand Park', 'Variety Sq', 'LIC Sq', 'Empress Mall Sq'];

let tick = 0;

function rand(min, max, decimals = 0) {
  const val = Math.random() * (max - min) + min;
  return decimals > 0 ? parseFloat(val.toFixed(decimals)) : Math.round(val);
}

function randChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Simulate fill level that rises over time and resets when collected
const binState = {};
for (let i = 1; i <= 12; i++) {
  binState[`BIN-${String(i).padStart(3, '0')}`] = rand(10, 60);
}

function generateWasteData() {
  const bins = Object.entries(binState).map(([id, fillLevel]) => {
    // Gradually fill bins, reset if collected
    const newFill = fillLevel + rand(0, 3);
    const collected = newFill > 95 && Math.random() > 0.6;
    binState[id] = collected ? rand(5, 15) : Math.min(newFill, 99);

    return {
      id,
      zone: randChoice(NAGPUR_ZONES),
      fillLevel: binState[id],
      weight: parseFloat((binState[id] * 0.82).toFixed(1)),
      temperature: rand(22, 45),
      lastCollected: collected
        ? new Date().toISOString()
        : new Date(Date.now() - rand(1, 48) * 3600000).toISOString(),
      status: binState[id] > 85 ? 'OVERFLOW_RISK' : binState[id] > 70 ? 'NEARLY_FULL' : 'OK',
      lat: 21.1458 + (Math.random() - 0.5) * 0.1,
      lng: 79.0882 + (Math.random() - 0.5) * 0.1,
    };
  });

  const overflowCount = bins.filter(b => b.fillLevel > 85).length;
  const avgFill = parseFloat((bins.reduce((s, b) => s + b.fillLevel, 0) / bins.length).toFixed(1));
  const routeEfficiency = parseFloat((100 - overflowCount * 4.5).toFixed(1));

  return {
    timestamp: new Date().toISOString(),
    bins,
    summary: {
      totalBins: bins.length,
      overflowRisk: overflowCount,
      avgFillLevel: avgFill,
      routeEfficiency,
      predictedCollections: overflowCount + rand(1, 3),
      fuelSaved: parseFloat((rand(15, 35) + tick * 0.01).toFixed(1)),
      co2Reduced: parseFloat((rand(8, 20)).toFixed(1)),
    }
  };
}

function generateTrafficData() {
  const hour = new Date().getHours();
  // Peak hours: 8-10 AM, 5-8 PM
  const isPeak = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);
  const baseLoad = isPeak ? 70 : 40;

  const intersections = INTERSECTIONS.map(name => ({
    name,
    vehicleCount: rand(baseLoad, baseLoad + 80),
    avgSpeed: rand(isPeak ? 8 : 20, isPeak ? 25 : 45),
    signalPhase: randChoice(['GREEN', 'RED', 'YELLOW']),
    congestionLevel: randChoice(isPeak ? ['HIGH', 'HIGH', 'MEDIUM', 'CRITICAL'] : ['LOW', 'LOW', 'MEDIUM']),
    waitTime: rand(isPeak ? 45 : 15, isPeak ? 180 : 60),
    lat: 21.1458 + (Math.random() - 0.5) * 0.08,
    lng: 79.0882 + (Math.random() - 0.5) * 0.08,
  }));

  const congestionIndex = rand(baseLoad - 10, baseLoad + 25);

  return {
    timestamp: new Date().toISOString(),
    intersections,
    summary: {
      congestionIndex,
      isPeakHour: isPeak,
      avgCitySpeed: rand(isPeak ? 12 : 28, isPeak ? 22 : 42),
      totalVehicles: intersections.reduce((s, i) => s + i.vehicleCount, 0),
      avgWaitTime: parseFloat((intersections.reduce((s, i) => s + i.waitTime, 0) / intersections.length).toFixed(1)),
      emergencyCorridors: rand(0, 2),
      predictionAccuracy: rand(88, 95),
      congestionReduction: parseFloat((rand(18, 28)).toFixed(1)),
    }
  };
}

function generateEnergyData() {
  const hour = new Date().getHours();
  const isDaytime = hour >= 6 && hour <= 18;
  const isPeak = (hour >= 9 && hour <= 12) || (hour >= 18 && hour <= 22);

  const zones = NAGPUR_ZONES.map(zone => ({
    zone,
    currentDemand: rand(isPeak ? 200 : 80, isPeak ? 450 : 200),
    forecastDemand: rand(isPeak ? 220 : 90, isPeak ? 480 : 220),
    solarGeneration: isDaytime ? rand(30, 150) : 0,
    gridImport: rand(100, 350),
    powerQuality: parseFloat((rand(97, 100)).toFixed(1)),
    anomalyScore: parseFloat((Math.random() * 0.3).toFixed(3)),
  }));

  const totalDemand = zones.reduce((s, z) => s + z.currentDemand, 0);
  const totalSolar = zones.reduce((s, z) => s + z.solarGeneration, 0);
  const gridLoad = parseFloat(((totalDemand / (zones.length * 450)) * 100).toFixed(1));

  return {
    timestamp: new Date().toISOString(),
    zones,
    summary: {
      totalDemand,
      totalSolar,
      gridLoad: Math.min(gridLoad, 99),
      peakShaving: rand(8, 18),
      distributionLoss: parseFloat((rand(3, 8)).toFixed(2)),
      demandForecast: totalDemand + rand(-20, 40),
      mape: parseFloat((rand(4, 7)).toFixed(2)),
      renewablePercent: parseFloat(((totalSolar / totalDemand) * 100).toFixed(1)),
      anomaliesDetected: rand(0, 3),
      energySaved: parseFloat((rand(12, 22)).toFixed(1)),
    }
  };
}

function generateLiveSensorData() {
  tick++;
  return {
    waste: generateWasteData(),
    traffic: generateTrafficData(),
    energy: generateEnergyData(),
    tick,
  };
}

function generateHistoricalData(days = 30, domain = 'all') {
  const history = [];
  const now = Date.now();
  for (let i = days * 24; i >= 0; i -= 1) {
    const ts = new Date(now - i * 3600000).toISOString();
    const d = { timestamp: ts };
    if (domain === 'waste' || domain === 'all') d.waste = { avgFill: rand(30, 80), collections: rand(3, 12), overflow: rand(0, 4) };
    if (domain === 'traffic' || domain === 'all') d.traffic = { congestionIndex: rand(20, 90), avgSpeed: rand(15, 50), vehicles: rand(500, 3000) };
    if (domain === 'energy' || domain === 'all') d.energy = { demand: rand(800, 2500), solar: rand(0, 600), gridLoad: rand(40, 95) };
    history.push(d);
  }
  return history;
}

module.exports = { generateLiveSensorData, generateHistoricalData, generateWasteData, generateTrafficData, generateEnergyData };
