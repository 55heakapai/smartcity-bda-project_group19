-- Smart City BDA — Apache Hive DDL & Analytics Queries
-- Group 19 | Roll 55, 56, 57
-- Run on: hive -f hive_queries.sql

-- ─── CREATE DATABASE ─────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS smartcity_bda
COMMENT 'Smart City Big Data Analytics — Group 19'
LOCATION '/smartcity/hive/';

USE smartcity_bda;

-- ─── WASTE TABLE (external, partitioned by date) ─────────────────
CREATE EXTERNAL TABLE IF NOT EXISTS waste_sensors (
    bin_id        STRING,
    zone          STRING,
    fill_level    DOUBLE,
    weight        DOUBLE,
    temperature   DOUBLE,
    latitude      DOUBLE,
    longitude     DOUBLE,
    status        STRING,
    sensor_id     STRING,
    event_ts      TIMESTAMP
)
PARTITIONED BY (event_date STRING)
STORED AS PARQUET
LOCATION 'hdfs:///smartcity/waste/parquet/'
TBLPROPERTIES ('parquet.compression'='SNAPPY');

-- ─── TRAFFIC TABLE ───────────────────────────────────────────────
CREATE EXTERNAL TABLE IF NOT EXISTS traffic_sensors (
    intersection_id   STRING,
    intersection_name STRING,
    vehicle_count     INT,
    avg_speed         DOUBLE,
    signal_phase      STRING,
    congestion_level  STRING,
    wait_time         INT,
    latitude          DOUBLE,
    longitude         DOUBLE,
    camera_id         STRING,
    event_ts          TIMESTAMP
)
PARTITIONED BY (event_date STRING)
STORED AS PARQUET
LOCATION 'hdfs:///smartcity/traffic/parquet/'
TBLPROPERTIES ('parquet.compression'='SNAPPY');

-- ─── ENERGY TABLE ────────────────────────────────────────────────
CREATE EXTERNAL TABLE IF NOT EXISTS energy_meters (
    meter_id          STRING,
    zone              STRING,
    current_demand    DOUBLE,
    voltage           DOUBLE,
    current_amp       DOUBLE,
    power_factor      DOUBLE,
    solar_generation  DOUBLE,
    grid_import       DOUBLE,
    anomaly_score     DOUBLE,
    discoms           STRING,
    event_ts          TIMESTAMP
)
PARTITIONED BY (event_date STRING)
STORED AS PARQUET
LOCATION 'hdfs:///smartcity/energy/parquet/'
TBLPROPERTIES ('parquet.compression'='SNAPPY');

-- ─── ANALYTICS QUERIES ───────────────────────────────────────────

-- Query 1: Average fill level per zone (last 7 days)
SELECT
    zone,
    ROUND(AVG(fill_level), 2)          AS avg_fill_pct,
    ROUND(MAX(fill_level), 2)          AS peak_fill_pct,
    COUNT(CASE WHEN fill_level > 85
               THEN 1 END)             AS overflow_events,
    COUNT(*)                           AS total_readings
FROM waste_sensors
WHERE event_date >= DATE_SUB(CURRENT_DATE, 7)
GROUP BY zone
ORDER BY avg_fill_pct DESC;

-- Query 2: Peak traffic hours (city-wide)
SELECT
    HOUR(event_ts)                     AS hour_of_day,
    ROUND(AVG(vehicle_count), 1)       AS avg_vehicles,
    ROUND(AVG(avg_speed), 1)           AS avg_speed_kmh,
    ROUND(AVG(wait_time), 1)           AS avg_wait_sec,
    COUNT(CASE WHEN congestion_level IN ('HIGH','CRITICAL')
               THEN 1 END)             AS high_congestion_count
FROM traffic_sensors
WHERE event_date >= DATE_SUB(CURRENT_DATE, 30)
GROUP BY HOUR(event_ts)
ORDER BY hour_of_day;

-- Query 3: Zone-wise energy profile
SELECT
    zone,
    ROUND(AVG(current_demand), 2)      AS avg_demand_kw,
    ROUND(MAX(current_demand), 2)      AS peak_demand_kw,
    ROUND(SUM(solar_generation) /
          SUM(current_demand) * 100, 2) AS renewable_pct,
    COUNT(CASE WHEN anomaly_score > 0.25
               THEN 1 END)             AS anomaly_count,
    COUNT(*)                           AS meter_readings
FROM energy_meters
WHERE event_date >= DATE_SUB(CURRENT_DATE, 30)
GROUP BY zone
ORDER BY avg_demand_kw DESC;

-- Query 4: Cross-domain daily KPI report
WITH waste_kpi AS (
    SELECT event_date,
           ROUND(AVG(fill_level), 2) AS avg_fill,
           COUNT(CASE WHEN fill_level > 85 THEN 1 END) AS overflow_events
    FROM waste_sensors GROUP BY event_date
),
traffic_kpi AS (
    SELECT event_date,
           ROUND(AVG(vehicle_count), 0) AS avg_vehicles,
           ROUND(AVG(avg_speed), 1) AS avg_speed
    FROM traffic_sensors GROUP BY event_date
),
energy_kpi AS (
    SELECT event_date,
           ROUND(SUM(current_demand) / COUNT(*), 2) AS avg_demand_kw,
           COUNT(CASE WHEN anomaly_score > 0.25 THEN 1 END) AS anomalies
    FROM energy_meters GROUP BY event_date
)
SELECT
    w.event_date,
    w.avg_fill          AS waste_avg_fill_pct,
    w.overflow_events,
    t.avg_vehicles,
    t.avg_speed         AS traffic_avg_speed_kmh,
    e.avg_demand_kw,
    e.anomalies         AS energy_anomalies
FROM waste_kpi w
JOIN traffic_kpi t ON w.event_date = t.event_date
JOIN energy_kpi e ON w.event_date = e.event_date
ORDER BY w.event_date DESC
LIMIT 30;

-- Query 5: Worst performing bins (last 30 days)
SELECT
    bin_id, zone,
    ROUND(AVG(fill_level), 2) AS avg_fill,
    COUNT(CASE WHEN fill_level > 85 THEN 1 END) AS overflow_incidents
FROM waste_sensors
WHERE event_date >= DATE_SUB(CURRENT_DATE, 30)
GROUP BY bin_id, zone
HAVING overflow_incidents > 5
ORDER BY overflow_incidents DESC;
