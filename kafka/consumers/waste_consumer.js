/**
 * Kafka Consumer — Waste Sensor Stream Processor
 * 
 * Consumes from: smartcity.waste.sensors
 * Processes: Fill-level aggregation, overflow detection, alert generation
 *
 * Usage: node kafka/consumers/waste_consumer.js
 */

const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'smartcity-waste-consumer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'waste-processing-group' });

const binStateCache = {};

async function startConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'smartcity.waste.sensors', fromBeginning: false });

  console.log('✅ Waste Consumer running. Waiting for sensor events...');

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const event = JSON.parse(message.value.toString());

      // Update in-memory state (in production this goes to HBase/Redis)
      binStateCache[event.binId] = {
        ...event,
        receivedAt: new Date().toISOString(),
      };

      // Overflow detection
      if (event.fillLevel > 85) {
        console.log(`\n🚨 ALERT: Bin ${event.binId} in ${event.zone} at ${event.fillLevel}% — OVERFLOW RISK`);
        // In production: publish alert to smartcity.alerts topic
      }

      // Log aggregate stats every 12 messages
      if (Object.keys(binStateCache).length % 12 === 0) {
        const fills = Object.values(binStateCache).map(b => b.fillLevel);
        const avg = (fills.reduce((s, f) => s + f, 0) / fills.length).toFixed(1);
        process.stdout.write(`\r📊 Bins tracked: ${fills.length} | Avg fill: ${avg}% | ${new Date().toLocaleTimeString()}`);
      }
    },
  });
}

startConsumer().catch(e => {
  console.error('Consumer error:', e.message);
  process.exit(1);
});
