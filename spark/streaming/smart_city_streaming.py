"""
Apache Spark Streaming Job — Smart City Real-time Analytics
============================================================
Consumes from Kafka topics and performs real-time analytics:
- Waste: 5-minute bin fill aggregations, overflow detection
- Traffic: 10-second congestion sliding window averages
- Energy: 1-minute demand aggregation, anomaly flagging

Run with:
    spark-submit \\
      --packages org.apache.spark:spark-sql-kafka-0-10_2.12:3.4.0 \\
      --master local[4] \\
      spark/streaming/smart_city_streaming.py

Requirements:
    pip install pyspark kafka-python
"""

from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    from_json, col, window, avg, max as spark_max, min as spark_min,
    count, sum as spark_sum, when, lit, current_timestamp
)
from pyspark.sql.types import (
    StructType, StructField, StringType, DoubleType, IntegerType, TimestampType
)
import os

KAFKA_BROKER = os.getenv("KAFKA_BROKER", "localhost:9092")
CHECKPOINT_DIR = "/tmp/smartcity_checkpoints"

# ─── Schema Definitions ────────────────────────────────────────────
waste_schema = StructType([
    StructField("binId", StringType(), True),
    StructField("zone", StringType(), True),
    StructField("fillLevel", DoubleType(), True),
    StructField("weight", DoubleType(), True),
    StructField("temperature", DoubleType(), True),
    StructField("lat", DoubleType(), True),
    StructField("lng", DoubleType(), True),
    StructField("timestamp", StringType(), True),
])

traffic_schema = StructType([
    StructField("intersectionId", StringType(), True),
    StructField("intersectionName", StringType(), True),
    StructField("vehicleCount", IntegerType(), True),
    StructField("avgSpeed", DoubleType(), True),
    StructField("congestionLevel", StringType(), True),
    StructField("waitTime", IntegerType(), True),
    StructField("timestamp", StringType(), True),
])

energy_schema = StructType([
    StructField("meterId", StringType(), True),
    StructField("zone", StringType(), True),
    StructField("currentDemand", DoubleType(), True),
    StructField("voltage", DoubleType(), True),
    StructField("powerFactor", DoubleType(), True),
    StructField("solarGeneration", DoubleType(), True),
    StructField("anomalyScore", DoubleType(), True),
    StructField("timestamp", StringType(), True),
])


def create_spark_session():
    return SparkSession.builder \
        .appName("SmartCity-BDA-Streaming") \
        .config("spark.streaming.stopGracefullyOnShutdown", "true") \
        .config("spark.sql.streaming.schemaInference", "true") \
        .getOrCreate()


def read_kafka_stream(spark, topic, schema):
    """Read a Kafka topic as a structured streaming DataFrame."""
    raw = spark.readStream \
        .format("kafka") \
        .option("kafka.bootstrap.servers", KAFKA_BROKER) \
        .option("subscribe", topic) \
        .option("startingOffsets", "latest") \
        .option("failOnDataLoss", "false") \
        .load()

    return raw.select(
        from_json(col("value").cast("string"), schema).alias("data"),
        col("timestamp").alias("kafka_ts")
    ).select("data.*", "kafka_ts")


def process_waste_stream(spark):
    """5-minute tumbling window: avg fill per zone, overflow count."""
    df = read_kafka_stream(spark, "smartcity.waste.sensors", waste_schema)

    agg = df \
        .withWatermark("kafka_ts", "2 minutes") \
        .groupBy(
            window(col("kafka_ts"), "5 minutes"),
            col("zone")
        ).agg(
            avg("fillLevel").alias("avg_fill_level"),
            spark_max("fillLevel").alias("max_fill_level"),
            count(when(col("fillLevel") > 85, True)).alias("overflow_risk_count"),
            count("*").alias("sensor_readings"),
        )

    return agg.writeStream \
        .outputMode("append") \
        .format("console") \
        .option("truncate", False) \
        .option("checkpointLocation", f"{CHECKPOINT_DIR}/waste") \
        .trigger(processingTime="30 seconds") \
        .start()


def process_traffic_stream(spark):
    """10-second sliding window: city congestion index."""
    df = read_kafka_stream(spark, "smartcity.traffic.sensors", traffic_schema)

    agg = df \
        .withWatermark("kafka_ts", "1 minute") \
        .groupBy(
            window(col("kafka_ts"), "1 minute", "10 seconds")
        ).agg(
            avg("vehicleCount").alias("avg_vehicle_count"),
            avg("avgSpeed").alias("avg_speed_kmh"),
            avg("waitTime").alias("avg_wait_time_sec"),
            count(when(col("congestionLevel").isin("HIGH", "CRITICAL"), True)).alias("high_congestion_count"),
            count("*").alias("intersections_sampled"),
        )

    return agg.writeStream \
        .outputMode("append") \
        .format("console") \
        .option("truncate", False) \
        .option("checkpointLocation", f"{CHECKPOINT_DIR}/traffic") \
        .trigger(processingTime="10 seconds") \
        .start()


def process_energy_stream(spark):
    """1-minute zone demand aggregation with anomaly flagging."""
    df = read_kafka_stream(spark, "smartcity.energy.meters", energy_schema)

    agg = df \
        .withWatermark("kafka_ts", "2 minutes") \
        .groupBy(
            window(col("kafka_ts"), "1 minute"),
            col("zone")
        ).agg(
            spark_sum("currentDemand").alias("total_demand_kw"),
            spark_sum("solarGeneration").alias("total_solar_kw"),
            avg("voltage").alias("avg_voltage"),
            avg("powerFactor").alias("avg_power_factor"),
            count(when(col("anomalyScore") > 0.25, True)).alias("anomaly_count"),
            count("*").alias("meter_readings"),
        )

    return agg.writeStream \
        .outputMode("append") \
        .format("console") \
        .option("truncate", False) \
        .option("checkpointLocation", f"{CHECKPOINT_DIR}/energy") \
        .trigger(processingTime="60 seconds") \
        .start()


if __name__ == "__main__":
    print("=" * 60)
    print("🏙️  Smart City BDA — Spark Streaming Engine")
    print("    Group 19 | Roll 55, 56, 57")
    print("=" * 60)

    spark = create_spark_session()
    spark.sparkContext.setLogLevel("WARN")

    print(f"✅ Spark Session started: {spark.version}")
    print(f"📡 Kafka Broker: {KAFKA_BROKER}")
    print("🔄 Starting streaming queries...\n")

    q1 = process_waste_stream(spark)
    q2 = process_traffic_stream(spark)
    q3 = process_energy_stream(spark)

    print("✅ All 3 streaming queries running. Press Ctrl+C to stop.")
    spark.streams.awaitAnyTermination()
