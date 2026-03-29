/**
 * Apache Kafka Producer — Smart City IoT Simulator
 * 
 * Produces sensor data to Kafka topics:
 *   - smartcity.waste.sensors
 *   - smartcity.traffic.sensors  
 *   - smartcity.energy.meters
 *
 * Usage: node kafka/producers/smart_city_producer.js
 * Requires: Kafka running on localhost:9092
 */

const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'smartcity-producer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
  retry: { initialRetryTime: 300, retries: 5 },
});

const producer = kafka.producer();

const TOPICS = {
  WASTE:   'smartcity.waste.sensors',
  TRAFFIC: 'smartcity.traffic.sensors',
  ENERGY:  'smartcity.energy.meters',
  ALERTS:  'smartcity.alerts',
};

const ZONES = ['Dharampeth', 'Sitabuldi', 'Gandhibagh', 'Lakadganj', 'Sadar', 'Itwari'];

function rand(min, max, dec = 0) {
  const v = Math.random() * (max - min) + min;
  return dec > 0 ? parseFloat(v.toFixed(dec)) : Math.round(v);
}

function generateWasteSensorEvent(binId) {
  return {
    eventType: 'WASTE_BIN_UPDATE',
    binId: `BIN-${String(binId).padStart(3, '0')}`,
    zone: ZONES[binId % ZONES.length],
    fillLevel: rand(10, 95),
    weight: rand(20, 200),
    temperature: rand(22, 50),
    batteryLevel: rand(60, 100),
    lat: parseFloat((21.1458 + (Math.random() - 0.5) * 0.1).toFixed(6)),
    lng: parseFloat((79.0882 + (Math.random() - 0.5) * 0.1).toFixed(6)),
    timestamp: new Date().toISOString(),
    sensorId: `SENSOR-W-${binId}`,
  };
}

function generateTrafficEvent(intersectionId) {
  const intersections = ['Sitabuldi_Sq', 'Zero_Mile', 'Kasturchand_Park', 'Variety_Sq', 'LIC_Sq'];
  return {
    eventType: 'TRAFFIC_SENSOR_UPDATE',
    intersectionId: `INT-${String(intersectionId).padStart(3, '0')}`,
    intersectionName: intersections[intersectionId % intersections.length],
    vehicleCount: rand(20, 300),
    avgSpeed: rand(5, 60),
    signalPhase: ['GREEN', 'RED', 'YELLOW'][rand(0, 2)],
    congestionLevel: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][rand(0, 3)],
    waitTime: rand(10, 200),
    lat: parseFloat((21.1458 + (Math.random() - 0.5) * 0.08).toFixed(6)),
    lng: parseFloat((79.0882 + (Math.random() - 0.5) * 0.08).toFixed(6)),
    timestamp: new Date().toISOString(),
    cameraId: `CAM-${intersectionId}`,
  };
}

function generateEnergyMeterEvent(meterId) {
  return {
    eventType: 'SMART_METER_READING',
    meterId: `METER-${String(meterId).padStart(4, '0')}`,
    zone: ZONES[meterId % ZONES.length],
    currentDemand: rand(50, 500),
    voltage: rand(218, 242),
    current: rand(5, 50, 2),
    powerFactor: rand(85, 100, 2),
    solarGeneration: rand(0, 200),
    gridImport: rand(30, 400),
    anomalyScore: parseFloat((Math.random() * 0.4).toFixed(4)),
    timestamp: new Date().toISOString(),
    discoms: 'MSEDCL_Nagpur',
  };
}

async function startProducer() {
  await producer.connect();
  console.log('✅ Kafka Producer connected to broker');
  console.log('📡 Publishing to topics:', Object.values(TOPICS).join(', '));
  console.log('⏱️  Sending events every 1 second...\n');

  let tick = 0;

  setInterval(async () => {
    tick++;
    const messages = [];

    // 12 waste bins
    for (let i = 1; i <= 12; i++) {
      messages.push({
        topic: TOPICS.WASTE,
        messages: [{ key: `bin-${i}`, value: JSON.stringify(generateWasteSensorEvent(i)) }],
      });
    }

    // 6 traffic intersections
    for (let i = 1; i <= 6; i++) {
      messages.push({
        topic: TOPICS.TRAFFIC,
        messages: [{ key: `int-${i}`, value: JSON.stringify(generateTrafficEvent(i)) }],
      });
    }

    // 8 energy meters per zone
    for (let i = 1; i <= 48; i++) {
      messages.push({
        topic: TOPICS.ENERGY,
        messages: [{ key: `meter-${i}`, value: JSON.stringify(generateEnergyMeterEvent(i)) }],
      });
    }

    try {
      await producer.sendBatch({ topicMessages: messages });
      process.stdout.write(`\r🚀 Tick ${tick} | Sent: ${messages.length * 1} events | ${new Date().toLocaleTimeString()}`);
    } catch (e) {
      console.error('\nFailed to send:', e.message);
    }
  }, 1000);
}

startProducer().catch(e => {
  console.error('Producer failed to start:', e.message);
  console.error('💡 Make sure Kafka is running: docker-compose up -d kafka');
  process.exit(1);
});

process.on('SIGINT', async () => {
  console.log('\n\nShutting down producer...');
  await producer.disconnect();
  process.exit(0);
});
