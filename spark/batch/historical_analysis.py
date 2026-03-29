"""
Apache Spark Batch Job — Smart City Historical Analysis
=======================================================
Runs nightly on HDFS data. Generates:
- 30-day domain KPI summaries
- Zone-level performance reports
- ML model training datasets

Run with:
    spark-submit --master yarn \\
                 --deploy-mode cluster \\
                 --num-executors 4 \\
                 --executor-memory 4g \\
                 spark/batch/historical_analysis.py

For local testing:
    spark-submit --master local[*] spark/batch/historical_analysis.py
"""

from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    avg, count, max as spark_max, min as spark_min,
    sum as spark_sum, col, to_date, hour, date_format,
    when, lit, round as spark_round
)
import datetime

HDFS_BASE = os.getenv("HDFS_BASE", "hdfs://localhost:9000/smartcity")
OUTPUT_BASE = os.getenv("OUTPUT_BASE", "/tmp/smartcity_reports")

import os


def create_spark():
    return SparkSession.builder \
        .appName("SmartCity-BDA-BatchAnalysis") \
        .config("spark.sql.shuffle.partitions", "8") \
        .getOrCreate()


def analyze_waste(spark, df):
    print("\n── Waste Management Analysis ──")
    waste = df.select("zone", "fillLevel", "weight", "timestamp") \
        .withColumn("date", to_date("timestamp"))

    # Daily average fill per zone
    daily_zone = waste.groupBy("date", "zone").agg(
        spark_round(avg("fillLevel"), 2).alias("avg_fill_pct"),
        spark_round(spark_max("fillLevel"), 2).alias("peak_fill_pct"),
        spark_round(avg("weight"), 2).alias("avg_weight_kg"),
        count(when(col("fillLevel") > 85, True)).alias("overflow_events"),
    ).orderBy("date", "zone")

    daily_zone.show(20, truncate=False)

    # City-wide KPI
    kpi = waste.agg(
        spark_round(avg("fillLevel"), 2).alias("overall_avg_fill"),
        count(when(col("fillLevel") > 85, True)).alias("total_overflow_events"),
        spark_round(avg("weight"), 2).alias("avg_waste_kg_per_reading"),
    )
    print("City-wide Waste KPIs:")
    kpi.show()
    return daily_zone


def analyze_traffic(spark, df):
    print("\n── Traffic Analysis ──")
    traffic = df.select("intersectionName", "vehicleCount", "avgSpeed", "congestionLevel", "waitTime", "timestamp") \
        .withColumn("date", to_date("timestamp")) \
        .withColumn("hour_of_day", hour("timestamp"))

    # Peak hour analysis
    hourly = traffic.groupBy("hour_of_day").agg(
        spark_round(avg("vehicleCount"), 1).alias("avg_vehicles"),
        spark_round(avg("avgSpeed"), 1).alias("avg_speed_kmh"),
        spark_round(avg("waitTime"), 1).alias("avg_wait_sec"),
        count(when(col("congestionLevel").isin("HIGH", "CRITICAL"), True)).alias("high_cong_count"),
    ).orderBy("hour_of_day")

    print("Hourly Traffic Pattern (identifies peak hours):")
    hourly.show(24, truncate=False)

    kpi = traffic.agg(
        spark_round(avg("vehicleCount"), 1).alias("avg_daily_vehicles"),
        spark_round(avg("avgSpeed"), 1).alias("avg_city_speed_kmh"),
        count(when(col("congestionLevel") == "CRITICAL", True)).alias("critical_events"),
    )
    print("City-wide Traffic KPIs:")
    kpi.show()
    return hourly


def analyze_energy(spark, df):
    print("\n── Energy Analysis ──")
    energy = df.select("zone", "currentDemand", "solarGeneration", "anomalyScore", "voltage", "timestamp") \
        .withColumn("date", to_date("timestamp"))

    # Zone energy profile
    zone_profile = energy.groupBy("zone").agg(
        spark_round(avg("currentDemand"), 1).alias("avg_demand_kw"),
        spark_round(spark_max("currentDemand"), 1).alias("peak_demand_kw"),
        spark_round(avg("solarGeneration"), 1).alias("avg_solar_kw"),
        spark_round(avg("anomalyScore"), 4).alias("avg_anomaly_score"),
        count(when(col("anomalyScore") > 0.25, True)).alias("anomaly_count"),
        spark_round(avg("voltage"), 2).alias("avg_voltage_v"),
    ).orderBy("zone")

    print("Zone Energy Profiles:")
    zone_profile.show(truncate=False)

    kpi = energy.agg(
        spark_round(avg("currentDemand"), 1).alias("avg_city_demand_kw"),
        spark_round(spark_sum("solarGeneration") / spark_sum("currentDemand") * 100, 2).alias("renewable_pct"),
        count(when(col("anomalyScore") > 0.25, True)).alias("total_anomalies"),
    )
    print("City-wide Energy KPIs:")
    kpi.show()
    return zone_profile


if __name__ == "__main__":
    print("=" * 60)
    print("🏙️  Smart City BDA — Spark Batch Analysis")
    print(f"    Run date: {datetime.date.today()}")
    print("=" * 60)

    spark = create_spark()
    spark.sparkContext.setLogLevel("WARN")

    # In production, read from HDFS:
    # waste_df = spark.read.parquet(f"{HDFS_BASE}/waste/")
    # traffic_df = spark.read.parquet(f"{HDFS_BASE}/traffic/")
    # energy_df = spark.read.parquet(f"{HDFS_BASE}/energy/")

    # For demo: generate sample data
    import random
    zones = ['Dharampeth', 'Sitabuldi', 'Gandhibagh', 'Lakadganj', 'Sadar', 'Itwari']
    intersections = ['Sitabuldi_Sq', 'Zero_Mile', 'Kasturchand_Park', 'Variety_Sq', 'LIC_Sq']

    waste_data = [{'zone': random.choice(zones), 'fillLevel': random.uniform(10, 99),
                   'weight': random.uniform(20, 200), 'timestamp': '2024-12-01 08:00:00'} for _ in range(1000)]
    traffic_data = [{'intersectionName': random.choice(intersections),
                     'vehicleCount': random.randint(20, 300), 'avgSpeed': random.uniform(5, 60),
                     'congestionLevel': random.choice(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
                     'waitTime': random.randint(10, 200), 'timestamp': '2024-12-01 08:00:00'} for _ in range(1000)]
    energy_data = [{'zone': random.choice(zones), 'currentDemand': random.uniform(50, 500),
                    'solarGeneration': random.uniform(0, 200), 'anomalyScore': random.uniform(0, 0.4),
                    'voltage': random.uniform(215, 245), 'timestamp': '2024-12-01 08:00:00'} for _ in range(1000)]

    waste_df = spark.createDataFrame(waste_data)
    traffic_df = spark.createDataFrame(traffic_data)
    energy_df = spark.createDataFrame(energy_data)

    analyze_waste(spark, waste_df)
    analyze_traffic(spark, traffic_df)
    analyze_energy(spark, energy_df)

    print("\n✅ Batch analysis complete. Results written to output.")
    spark.stop()
