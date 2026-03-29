#!/usr/bin/env python3
"""
Smart City IoT Sensor Simulator
================================
Generates realistic sensor data and writes to:
  - stdout (for piping to Kafka)
  - data/sample/*.json (for Hadoop/Spark local testing)

Run:
    python3 scripts/simulation/sensor_simulator.py
    python3 scripts/simulation/sensor_simulator.py --domain waste --count 1000
    python3 scripts/simulation/sensor_simulator.py --kafka  # Requires kafka-python
"""

import json
import random
import time
import argparse
import os
from datetime import datetime, timedelta

random.seed(None)   # Live randomness

ZONES = ['Dharampeth', 'Sitabuldi', 'Gandhibagh', 'Lakadganj', 'Sadar', 'Itwari', 'Manewada', 'Hingna']
INTERSECTIONS = ['Sitabuldi_Sq', 'Zero_Mile', 'Kasturchand_Park', 'Variety_Sq', 'LIC_Sq', 'Empress_Mall_Sq']

# Nagpur coordinates
NAGPUR_LAT, NAGPUR_LNG = 21.1458, 79.0882


def rand_coord(base, spread=0.1):
    return round(base + random.uniform(-spread, spread), 6)


def waste_event(bin_id):
    return {
        "eventType": "WASTE_BIN_UPDATE",
        "binId": f"BIN-{str(bin_id).zfill(3)}",
        "zone": ZONES[bin_id % len(ZONES)],
        "fillLevel": round(random.uniform(5, 99), 1),
        "weight": round(random.uniform(10, 250), 1),
        "temperature": round(random.uniform(22, 52), 1),
        "batteryLevel": random.randint(55, 100),
        "lat": rand_coord(NAGPUR_LAT),
        "lng": rand_coord(NAGPUR_LNG),
        "timestamp": datetime.now().isoformat() + "Z",
        "sensorId": f"SENSOR-W-{bin_id}",
    }


def traffic_event(int_id):
    hour = datetime.now().hour
    is_peak = 8 <= hour <= 10 or 17 <= hour <= 20
    base = 150 if is_peak else 60
    return {
        "eventType": "TRAFFIC_SENSOR_UPDATE",
        "intersectionId": f"INT-{str(int_id).zfill(3)}",
        "intersectionName": INTERSECTIONS[int_id % len(INTERSECTIONS)],
        "vehicleCount": random.randint(base, base + 150),
        "avgSpeed": round(random.uniform(5 if is_peak else 25, 30 if is_peak else 60), 1),
        "signalPhase": random.choice(["GREEN", "RED", "YELLOW"]),
        "congestionLevel": random.choice(["HIGH", "HIGH", "CRITICAL"] if is_peak else ["LOW", "LOW", "MEDIUM"]),
        "waitTime": random.randint(60 if is_peak else 10, 200 if is_peak else 60),
        "lat": rand_coord(NAGPUR_LAT, 0.08),
        "lng": rand_coord(NAGPUR_LNG, 0.08),
        "timestamp": datetime.now().isoformat() + "Z",
        "cameraId": f"CAM-{int_id}",
    }


def energy_event(meter_id):
    hour = datetime.now().hour
    is_daytime = 6 <= hour <= 18
    return {
        "eventType": "SMART_METER_READING",
        "meterId": f"METER-{str(meter_id).zfill(4)}",
        "zone": ZONES[meter_id % len(ZONES)],
        "currentDemand": round(random.uniform(80, 450), 2),
        "voltage": round(random.uniform(218, 242), 2),
        "currentAmp": round(random.uniform(5, 55), 2),
        "powerFactor": round(random.uniform(0.85, 1.00), 4),
        "solarGeneration": round(random.uniform(30, 200), 2) if is_daytime else 0,
        "gridImport": round(random.uniform(50, 400), 2),
        "anomalyScore": round(random.uniform(0, 0.45), 4),
        "timestamp": datetime.now().isoformat() + "Z",
        "discoms": "MSEDCL_Nagpur",
    }


def generate_historical(domain, days=30, output_dir="data/sample"):
    os.makedirs(output_dir, exist_ok=True)
    filename = os.path.join(output_dir, f"{domain}_sample.json")
    events = []
    now = datetime.now()

    print(f"📦 Generating {days * 24} {domain} events...")
    for h in range(days * 24):
        ts = now - timedelta(hours=days * 24 - h)
        if domain == 'waste':
            for bin_id in range(1, 13):
                e = waste_event(bin_id)
                e['timestamp'] = ts.isoformat() + "Z"
                events.append(e)
        elif domain == 'traffic':
            for int_id in range(1, 7):
                e = traffic_event(int_id)
                e['timestamp'] = ts.isoformat() + "Z"
                events.append(e)
        elif domain == 'energy':
            for meter_id in range(1, 9):
                e = energy_event(meter_id)
                e['timestamp'] = ts.isoformat() + "Z"
                events.append(e)

    with open(filename, 'w') as f:
        for e in events:
            f.write(json.dumps(e) + '\n')

    print(f"✅ Saved {len(events)} events → {filename}")
    return events


def live_stream(domains=['waste', 'traffic', 'energy'], interval=1.0):
    print(f"📡 Live sensor simulation started (interval: {interval}s). Ctrl+C to stop.\n")
    tick = 0
    while True:
        tick += 1
        if 'waste' in domains:
            for b in range(1, 13):
                print(json.dumps(waste_event(b)))
        if 'traffic' in domains:
            for i in range(1, 7):
                print(json.dumps(traffic_event(i)))
        if 'energy' in domains:
            for m in range(1, 9):
                print(json.dumps(energy_event(m)))

        import sys
        sys.stderr.write(f"\rTick {tick} | {datetime.now().strftime('%H:%M:%S')}")
        sys.stderr.flush()
        time.sleep(interval)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Smart City Sensor Simulator')
    parser.add_argument('--domain', choices=['waste', 'traffic', 'energy', 'all'], default='all')
    parser.add_argument('--count', type=int, default=30, help='Number of days of historical data')
    parser.add_argument('--live', action='store_true', help='Stream live data to stdout')
    parser.add_argument('--interval', type=float, default=1.0, help='Seconds between live updates')
    args = parser.parse_args()

    if args.live:
        domains = ['waste', 'traffic', 'energy'] if args.domain == 'all' else [args.domain]
        live_stream(domains, args.interval)
    else:
        domains = ['waste', 'traffic', 'energy'] if args.domain == 'all' else [args.domain]
        for d in domains:
            generate_historical(d, args.count)
        print("\n✅ Sample data generation complete. Check data/sample/")
