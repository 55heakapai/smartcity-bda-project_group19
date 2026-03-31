require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');

const logger = require('./utils/logger');
const { generateLiveSensorData } = require('./utils/dataSimulator');

// Routes
const wasteRoutes = require('./routes/waste');
const trafficRoutes = require('./routes/traffic');
const energyRoutes = require('./routes/energy');
const analyticsRoutes = require('./routes/analytics');
const alertRoutes = require('./routes/alerts');

const app = express();
const server = http.createServer(app);

//  Socket.IO setup 
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Make io accessible in routes
app.set('io', io);

// Middleware 
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*' }));
app.use(compression());
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 }));

// ─── Routes ──────────────────────────────────────────────────────
app.use('/api/waste', wasteRoutes);
app.use('/api/traffic', trafficRoutes);
app.use('/api/energy', energyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/alerts', alertRoutes);

// Root route — visiting localhost:3001 directly
app.get('/', (req, res) => {
  res.json({
    project: '🏙️ Smart City Data Analytics — BDA Group 19',
    group: 'Roll Nos: 55, 56, 57',
    status: '✅ Backend API is running',
    frontend: 'http://localhost:3000  (run: cd frontend && npm start)',
    endpoints: {
      health:          'GET /api/health',
      waste_live:      'GET /api/waste/live',
      waste_bins:      'GET /api/waste/bins',
      waste_predict:   'GET /api/waste/predict',
      waste_routes:    'GET /api/waste/routes',
      traffic_live:    'GET /api/traffic/live',
      traffic_predict: 'GET /api/traffic/predict',
      traffic_signals: 'GET /api/traffic/signals',
      energy_live:     'GET /api/energy/live',
      energy_predict:  'GET /api/energy/predict',
      energy_anomalies:'GET /api/energy/anomalies',
      analytics_kpi:   'GET /api/analytics/kpi',
      analytics_ml:    'GET /api/analytics/ml',
      alerts:          'GET /api/alerts',
    },
    timestamp: new Date().toISOString(),
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Smart City BDA API',
    group: 'Group 19 | Roll 55,56,57',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    domains: ['waste', 'traffic', 'energy']
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ─── Socket.IO Events ────────────────────────────────────────────
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('subscribe', (domain) => {
    socket.join(domain);
    logger.info(`Client ${socket.id} subscribed to ${domain}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// ─── Real-time data emission (simulates IoT sensor pipeline) ─────
// Emits live sensor data every 3 seconds to connected dashboards
cron.schedule('*/3 * * * * *', () => {
  const data = generateLiveSensorData();
  
  io.to('waste').emit('waste:update', data.waste);
  io.to('traffic').emit('traffic:update', data.traffic);
  io.to('energy').emit('energy:update', data.energy);
  io.emit('dashboard:update', data);
});

// Alert checker every 30 seconds
cron.schedule('*/30 * * * * *', () => {
  const data = generateLiveSensorData();
  const alerts = checkAlerts(data);
  if (alerts.length > 0) {
    io.emit('alerts:new', alerts);
    logger.warn(`${alerts.length} new alert(s) generated`);
  }
});

function checkAlerts(data) {
  const alerts = [];
  const ts = new Date().toISOString();

  data.waste.bins.forEach(bin => {
    if (bin.fillLevel > 85) {
      alerts.push({ type: 'WASTE', severity: 'HIGH', message: `Bin ${bin.id} at ${bin.fillLevel}% capacity`, timestamp: ts });
    }
  });

  if (data.traffic.congestionIndex > 75) {
    alerts.push({ type: 'TRAFFIC', severity: 'HIGH', message: `High congestion detected: index ${data.traffic.congestionIndex}`, timestamp: ts });
  }

  if (data.energy.gridLoad > 90) {
    alerts.push({ type: 'ENERGY', severity: 'CRITICAL', message: `Grid overload: ${data.energy.gridLoad}% load`, timestamp: ts });
  }

  return alerts;
}

// ─── Start server ─────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger.info(`🏙️  Smart City BDA Server running on http://localhost:${PORT}`);
  logger.info(`📡 WebSocket server active`);
  logger.info(`🔄 Live sensor simulation running every 3s`);
});
