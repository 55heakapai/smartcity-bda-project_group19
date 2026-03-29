# 🏙️ Smart City Data Analytics — Full BDA Project

> **Topic 19 | Group 19 | Roll Nos: 55, 56, 57**
> Big Data Analytics — Complete Full-Stack Project
> Domains: **Waste Management · Traffic Management · Energy Management**

---

## 📁 Project Structure

```
smartcity-bda/
│
├── 📦 backend/                    Node.js + Express REST API + Socket.IO
│   ├── server.js                  Main server entry point
│   ├── routes/                    REST API routes (waste, traffic, energy)
│   └── utils/                     Data simulator, ML predictor, logger
│
├── 🌐 frontend/                   React.js Dashboard
│   └── src/
│       ├── pages/                 Dashboard, Waste, Traffic, Energy, Analytics, ML
│       ├── components/shared/     Reusable UI components
│       └── hooks/                 Custom API data hooks
│
├── 🔴 kafka/                      Apache Kafka producers & consumers
│   ├── producers/                 IoT sensor data producers
│   └── consumers/                 Domain-specific consumers
│
├── ⚡ spark/                      Apache Spark jobs
│   ├── streaming/                 Real-time Spark Streaming (Kafka → Spark)
│   └── batch/                     Nightly historical analysis jobs
│
├── 🗄️ hadoop/                     Hadoop ecosystem
│   ├── mapreduce/                 Python Hadoop Streaming MapReduce
│   └── hive/                      HiveQL DDL + analytics queries
│
├── 🤖 ml/models/                  Machine Learning models
│   ├── waste_overflow_model.py    Random Forest (scikit-learn)
│   ├── traffic_lstm_model.py      LSTM Neural Network (PyTorch)
│   └── energy_demand_model.py     XGBoost + Isolation Forest
│
├── 📜 scripts/simulation/         IoT sensor data simulator
├── 📊 data/sample/                Sample JSON sensor data
├── 🐳 docker-compose.yml          Full stack Docker setup
└── 📖 README.md                   This file
```

---

## ⚙️ Architecture Overview

```
IoT Sensors  ──▶  Apache Kafka  ──▶  Apache Spark Streaming  ──▶  HBase / HDFS
(Simulated)         (Broker)          (Real-time analytics)       (Storage)
                                              │
                                              ▼
                                    ML Models (Predictions)
                                              │
                                              ▼
                              Node.js Backend API + Socket.IO
                                              │
                                              ▼
                                  React.js Dashboard (Live)
```

---

## 🛠️ Tools to Install

### 1. Node.js (v20+)
```bash
# Windows: Download from https://nodejs.org/
# Ubuntu/Mac:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version    # Should show v20.x.x
npm --version     # Should show 10.x.x
```

### 2. Python (3.10+)
```bash
# Windows: Download from https://python.org/downloads/
# Ubuntu:
sudo apt update && sudo apt install python3 python3-pip -y

# Verify
python3 --version   # Should show 3.10+
pip3 --version
```

### 3. Docker + Docker Compose (recommended for Kafka/Hadoop)
```bash
# Windows/Mac: Install Docker Desktop from https://docker.com/get-started
# Ubuntu:
sudo apt-get install docker.io docker-compose-plugin -y
sudo usermod -aG docker $USER   # add yourself to docker group
newgrp docker

# Verify
docker --version            # Docker version 24.x+
docker compose version      # Docker Compose version 2.x+
```

### 4. Java (for Hadoop/Spark — optional if using Docker)
```bash
# Windows: Download JDK 11 from https://adoptium.net/
# Ubuntu:
sudo apt install openjdk-11-jdk -y

# Verify
java -version    # openjdk 11.x.x
```

### 5. Python ML Libraries
```bash
pip3 install scikit-learn pandas numpy matplotlib joblib xgboost
pip3 install torch --index-url https://download.pytorch.org/whl/cpu
pip3 install pyspark kafka-python
```

### 6. Git
```bash
# Windows: https://git-scm.com/download/win
# Ubuntu:
sudo apt install git -y
git --version
```

---

## 🚀 Quick Start (Recommended — Without Docker)

This runs the backend + frontend locally without needing Docker/Hadoop.

### Step 1: Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/smartcity-bda-group19.git
cd smartcity-bda-group19
```

### Step 2: Install Backend Dependencies
```bash
cd backend
npm install
cd ..
```

### Step 3: Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### Step 4: Start the Backend Server
```bash
cd backend
node server.js
```
You should see:
```
[INFO] 🏙️  Smart City BDA Server running on http://localhost:5000
[INFO] 📡 WebSocket server active
[INFO] 🔄 Live sensor simulation running every 3s
```

### Step 5: Start the Frontend (new terminal)
```bash
cd frontend
npm start
```
Browser opens automatically at **http://localhost:3000** ✅

---

## 🔍 Testing the API (Backend Endpoints)

Open these URLs in your browser OR use curl/Postman:

```bash
# Health check
curl http://localhost:5000/api/health

# Waste APIs
curl http://localhost:5000/api/waste/live
curl http://localhost:5000/api/waste/bins
curl http://localhost:5000/api/waste/predict
curl http://localhost:5000/api/waste/routes
curl http://localhost:5000/api/waste/history?days=7

# Traffic APIs
curl http://localhost:5000/api/traffic/live
curl http://localhost:5000/api/traffic/intersections
curl http://localhost:5000/api/traffic/predict
curl http://localhost:5000/api/traffic/signals

# Energy APIs
curl http://localhost:5000/api/energy/live
curl http://localhost:5000/api/energy/zones
curl http://localhost:5000/api/energy/predict
curl http://localhost:5000/api/energy/anomalies

# Analytics
curl http://localhost:5000/api/analytics/overview
curl http://localhost:5000/api/analytics/kpi
curl http://localhost:5000/api/analytics/ml

# Alerts
curl http://localhost:5000/api/alerts
```

---

## 🐳 Full Stack with Docker (Kafka + MongoDB included)

```bash
# Start everything (Kafka, MongoDB, Backend, Frontend)
docker compose up -d

# View running containers
docker compose ps

# Check logs
docker compose logs -f backend
docker compose logs -f kafka

# Stop everything
docker compose down
```

**Services started:**
| Service | URL |
|---------|-----|
| Frontend Dashboard | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| Kafka UI | http://localhost:8090 |
| MongoDB | localhost:27017 |
| Zookeeper | localhost:2181 |

---

## 📡 Apache Kafka (Real IoT Producer/Consumer)

### Option A: Using Docker (easiest)
```bash
# Start only Kafka
docker compose up -d zookeeper kafka kafka-setup kafka-ui

# Wait ~30 seconds for Kafka to be ready, then:
cd kafka/producers
node smart_city_producer.js

# In another terminal — run waste consumer:
cd kafka/consumers
node waste_consumer.js
```

### Option B: Local Kafka Installation
```bash
# Download Kafka 3.6
wget https://downloads.apache.org/kafka/3.6.1/kafka_2.13-3.6.1.tgz
tar -xzf kafka_2.13-3.6.1.tgz
cd kafka_2.13-3.6.1

# Start Zookeeper
bin/zookeeper-server-start.sh config/zookeeper.properties &

# Start Kafka broker
bin/kafka-server-start.sh config/server.properties &

# Create topics
bin/kafka-topics.sh --create --bootstrap-server localhost:9092 --topic smartcity.waste.sensors --partitions 3
bin/kafka-topics.sh --create --bootstrap-server localhost:9092 --topic smartcity.traffic.sensors --partitions 3
bin/kafka-topics.sh --create --bootstrap-server localhost:9092 --topic smartcity.energy.meters --partitions 3
bin/kafka-topics.sh --create --bootstrap-server localhost:9092 --topic smartcity.alerts --partitions 1

# List topics (verify)
bin/kafka-topics.sh --list --bootstrap-server localhost:9092

# Watch messages (consumer test)
bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic smartcity.waste.sensors --from-beginning
```

### Then run the producer:
```bash
# Install kafkajs
cd kafka/producers
npm install kafkajs
node smart_city_producer.js
```

---

## ⚡ Apache Spark

### Install Spark locally:
```bash
# Download Spark 3.4 with Hadoop
wget https://archive.apache.org/dist/spark/spark-3.4.1/spark-3.4.1-bin-hadoop3.tgz
tar -xzf spark-3.4.1-bin-hadoop3.tgz
export SPARK_HOME=$(pwd)/spark-3.4.1-bin-hadoop3
export PATH=$SPARK_HOME/bin:$PATH

# Verify
spark-submit --version
```

### Run Batch Job (local test — no Kafka needed):
```bash
pip3 install pyspark

spark-submit --master local[*] spark/batch/historical_analysis.py
```

### Run Streaming Job (needs Kafka running):
```bash
spark-submit \
  --packages org.apache.spark:spark-sql-kafka-0-10_2.12:3.4.1 \
  --master local[4] \
  spark/streaming/smart_city_streaming.py
```

---

## 🗄️ Hadoop MapReduce

### Run MapReduce Locally (Python — no Hadoop install needed):
```bash
python3 hadoop/mapreduce/mapreduce.py test
```
Expected output:
```
══════════════════════════════════════════════════════════════
📊 Hadoop MapReduce OUTPUT — Waste Zone Aggregation
══════════════════════════════════════════════════════════════
Zone            Avg Fill    Max Fill    Overflow    Readings
--------------------------------------------------------------
Dharampeth         52.31       98.12          18         200
Gandhibagh         48.75       96.44          15         200
...
```

### Run on Real Hadoop (if installed):
```bash
# Download Hadoop 3.3
wget https://archive.apache.org/dist/hadoop/common/hadoop-3.3.6/hadoop-3.3.6.tar.gz
tar -xzf hadoop-3.3.6.tar.gz
export HADOOP_HOME=$(pwd)/hadoop-3.3.6
export PATH=$HADOOP_HOME/bin:$PATH

# Format namenode (first time only)
hdfs namenode -format

# Start HDFS
$HADOOP_HOME/sbin/start-dfs.sh

# Copy sample data to HDFS
hdfs dfs -mkdir -p /smartcity/waste/raw/2024-12-01
hdfs dfs -put data/sample/waste_sample.json /smartcity/waste/raw/2024-12-01/

# Run MapReduce streaming job
hadoop jar $HADOOP_HOME/share/hadoop/tools/lib/hadoop-streaming-*.jar \
  -input  hdfs:///smartcity/waste/raw/2024-12-01 \
  -output hdfs:///smartcity/waste/aggregated/2024-12-01 \
  -mapper  "python3 mapreduce.py mapper" \
  -reducer "python3 mapreduce.py reducer" \
  -file hadoop/mapreduce/mapreduce.py

# View results
hdfs dfs -cat /smartcity/waste/aggregated/2024-12-01/part-00000
```

### Hive Queries:
```bash
# Start Hive (requires Hadoop running)
hive -f hadoop/hive/hive_queries.sql

# Or interactive:
hive
> USE smartcity_bda;
> SELECT zone, ROUND(AVG(fill_level),2) FROM waste_sensors GROUP BY zone;
```

---

## 🤖 Machine Learning Models

### Train Waste Overflow Model (Random Forest):
```bash
cd ml/models
pip3 install scikit-learn pandas numpy joblib
python3 waste_overflow_model.py
```
Expected output:
```
🗑️  Waste Overflow Predictor — Random Forest Training
📦 Generating training dataset (simulates 18 months HDFS data)...
   Dataset shape: (50000, 12)
   Overflow rate: 42.35%
🏋️  Training Random Forest Classifier...
📈 RESULTS:
   Accuracy:       0.9134 (91.34%)
   ROC-AUC:        0.9512
   CV Accuracy:    0.9118 ± 0.0043
```

### Train Traffic LSTM Model (PyTorch):
```bash
pip3 install torch scikit-learn pandas numpy
python3 ml/models/traffic_lstm_model.py
```

### Train Energy Forecasting + Anomaly Detection:
```bash
pip3 install xgboost scikit-learn pandas numpy joblib
python3 ml/models/energy_demand_model.py
```

---

## 📊 IoT Sensor Simulator (Python)

```bash
# Generate 30 days of all domain sample data
python3 scripts/simulation/sensor_simulator.py

# Generate waste only
python3 scripts/simulation/sensor_simulator.py --domain waste --count 7

# Stream live data to terminal
python3 scripts/simulation/sensor_simulator.py --live

# Pipe into Kafka (if Kafka running)
python3 scripts/simulation/sensor_simulator.py --live | \
  kafka-console-producer.sh --broker-list localhost:9092 \
  --topic smartcity.waste.sensors
```

---

## 📤 Pushing to GitHub

```bash
# Step 1: Initialize git
git init
git add .
git commit -m "Initial commit: Smart City BDA Project - Group 19"

# Step 2: Create repository on github.com
# Go to https://github.com/new
# Name: smartcity-bda-group19
# Public repo, NO README (we have one)

# Step 3: Push
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/smartcity-bda-group19.git
git push -u origin main

# Step 4: Verify
# Visit: https://github.com/YOUR_USERNAME/smartcity-bda-group19
```

---

## 📱 Dashboard Pages

| Page | URL | Features |
|------|-----|----------|
| 🏠 Dashboard | localhost:3000/ | Live KPIs, sparklines, alerts, KPI tracker |
| 🗑️ Waste | localhost:3000/waste | Bin status, fill bars, ML predictions, routes |
| 🚦 Traffic | localhost:3000/traffic | Intersection live data, LSTM forecast, adaptive signals |
| ⚡ Energy | localhost:3000/energy | Zone demand, anomaly detection, solar forecast |
| 📊 Analytics | localhost:3000/analytics | 30-day trends, KPI cards, tech stack |
| 🤖 ML Models | localhost:3000/ml | Model cards, accuracy, features, pipeline |

---

## 📋 Tech Stack Summary

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Data Ingestion | Apache Kafka 3.6 | Real-time IoT message broker |
| Batch Processing | Apache Hadoop 3.3 | HDFS storage + MapReduce |
| Stream Processing | Apache Spark 3.4 | Real-time analytics |
| Data Warehouse | Apache Hive | SQL analytics on HDFS |
| ML — Waste | scikit-learn Random Forest | Overflow prediction |
| ML — Traffic | PyTorch LSTM | Congestion forecasting |
| ML — Energy | XGBoost + Prophet | Demand forecasting |
| ML — Anomaly | Isolation Forest | Energy theft detection |
| Backend API | Node.js + Express | REST API + WebSocket |
| Real-time Push | Socket.IO | Live dashboard updates |
| Frontend | React.js + Recharts | Interactive dashboard |
| Database | MongoDB (optional) | Persistent storage |
| Containers | Docker + Compose | Easy deployment |

---

## 👥 Team

| Roll No | Name |
|---------|------|
| 55 | Member 1 |
| 56 | Member 2 |
| 57 | Member 3 |

**Course:** Big Data Analytics | **Topic:** 19 — Smart City Data Analytics | **AY:** 2024–25

---

## 📚 References

- Apache Hadoop: https://hadoop.apache.org/docs/r3.3.6/
- Apache Spark: https://spark.apache.org/docs/3.4.1/
- Apache Kafka: https://kafka.apache.org/documentation/
- scikit-learn: https://scikit-learn.org/stable/
- PyTorch: https://pytorch.org/docs/stable/
- Smart Cities Mission India: https://smartcities.gov.in
- McKinsey — Smart Cities (2018): https://mckinsey.com/smart-cities
