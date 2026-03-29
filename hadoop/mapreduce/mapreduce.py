#!/usr/bin/env python3
"""
Hadoop MapReduce — Smart City Daily Aggregation
================================================
Uses Hadoop Streaming to run Python MapReduce.

MAPPER: Reads raw sensor JSON lines, emits (zone, metrics)
REDUCER: Aggregates by zone, computes daily KPIs

Run locally (test):
    cat data/sample/waste_sample.json | python3 hadoop/mapreduce/mapper.py | sort | python3 hadoop/mapreduce/reducer.py

Run on Hadoop:
    hadoop jar $HADOOP_HOME/share/hadoop/tools/lib/hadoop-streaming-*.jar \\
      -input  hdfs:///smartcity/waste/raw/2024-12-01 \\
      -output hdfs:///smartcity/waste/aggregated/2024-12-01 \\
      -mapper "python3 mapper.py" \\
      -reducer "python3 reducer.py" \\
      -file mapper.py \\
      -file reducer.py

This file combines both mapper and reducer for portability.
"""

import sys
import json

# ─── MAPPER ──────────────────────────────────────────────────────
def run_mapper():
    """
    Input:  Raw JSON sensor events (one per line from HDFS)
    Output: <zone>\t<fillLevel,timestamp>
    """
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            event = json.loads(line)
            zone = event.get('zone', 'UNKNOWN')
            fill = event.get('fillLevel', 0)
            weight = event.get('weight', 0)
            temp = event.get('temperature', 0)
            ts = event.get('timestamp', '')
            # Emit key-value: zone -> metrics as CSV
            print(f"{zone}\t{fill},{weight},{temp}")
        except (json.JSONDecodeError, KeyError):
            continue  # Skip malformed records


# ─── REDUCER ─────────────────────────────────────────────────────
def run_reducer():
    """
    Input:  Sorted <zone>\t<fill,weight,temp> from mapper
    Output: <zone>\t<avg_fill,max_fill,overflow_count,total_readings>
    """
    current_zone = None
    fills, weights, temps, count = [], [], [], 0

    def emit(zone, fills, weights, temps, count):
        if count == 0:
            return
        avg_fill = sum(fills) / count
        max_fill = max(fills)
        overflow_count = sum(1 for f in fills if f > 85)
        avg_weight = sum(weights) / count
        print(f"{zone}\tavg_fill={avg_fill:.2f}\tmax_fill={max_fill:.2f}\toverflow_count={overflow_count}\ttotal_readings={count}\tavg_weight={avg_weight:.2f}")

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            parts = line.split('\t')
            zone = parts[0]
            metrics = parts[1].split(',')
            fill, weight, temp = float(metrics[0]), float(metrics[1]), float(metrics[2])

            if zone != current_zone:
                if current_zone is not None:
                    emit(current_zone, fills, weights, temps, count)
                current_zone = zone
                fills, weights, temps, count = [], [], [], 0

            fills.append(fill)
            weights.append(weight)
            temps.append(temp)
            count += 1
        except (IndexError, ValueError):
            continue

    if current_zone is not None:
        emit(current_zone, fills, weights, temps, count)


# ─── LOCAL TEST ──────────────────────────────────────────────────
def run_local_test():
    """Simulate MapReduce locally without Hadoop."""
    import random
    zones = ['Dharampeth', 'Sitabuldi', 'Gandhibagh', 'Lakadganj', 'Sadar']
    sample_data = [
        json.dumps({'zone': random.choice(zones), 'fillLevel': random.uniform(10, 99),
                    'weight': random.uniform(20, 200), 'temperature': random.uniform(22, 45),
                    'timestamp': '2024-12-01T08:00:00Z'})
        for _ in range(1000)
    ]

    # Map phase
    mapped = []
    for line in sample_data:
        try:
            e = json.loads(line)
            mapped.append((e['zone'], f"{e['fillLevel']},{e['weight']},{e['temperature']}"))
        except:
            pass

    # Sort (Hadoop shuffle equivalent)
    mapped.sort(key=lambda x: x[0])

    # Reduce phase
    from collections import defaultdict
    zone_data = defaultdict(lambda: {'fills': [], 'weights': [], 'temps': []})
    for zone, metrics in mapped:
        f, w, t = map(float, metrics.split(','))
        zone_data[zone]['fills'].append(f)
        zone_data[zone]['weights'].append(w)
        zone_data[zone]['temps'].append(t)

    print("\n" + "=" * 70)
    print("📊 Hadoop MapReduce OUTPUT — Waste Zone Aggregation")
    print("=" * 70)
    print(f"{'Zone':<15} {'Avg Fill':>10} {'Max Fill':>10} {'Overflow':>10} {'Readings':>10}")
    print("-" * 70)
    for zone, d in sorted(zone_data.items()):
        fills = d['fills']
        avg_fill = sum(fills) / len(fills)
        max_fill = max(fills)
        overflow = sum(1 for f in fills if f > 85)
        print(f"{zone:<15} {avg_fill:>10.2f} {max_fill:>10.2f} {overflow:>10} {len(fills):>10}")

    print("-" * 70)
    print(f"Total zones: {len(zone_data)} | Total readings: {len(mapped)}")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1] == 'mapper':
            run_mapper()
        elif sys.argv[1] == 'reducer':
            run_reducer()
        elif sys.argv[1] == 'test':
            run_local_test()
    else:
        # Default: run local simulation
        print("Usage:")
        print("  python3 mapreduce.py test     — Run local simulation")
        print("  python3 mapreduce.py mapper   — Run as Hadoop mapper")
        print("  python3 mapreduce.py reducer  — Run as Hadoop reducer")
        print()
        run_local_test()
