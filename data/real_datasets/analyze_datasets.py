"""
Real Dataset Analysis — Smart City BDA Group 19
================================================
Loads the 4 real datasets and performs:
  - Descriptive statistics
  - Peak hour analysis (Traffic)
  - Zone energy profiles
  - Waste fill patterns & overflow incidents
  - Weather correlation with all domains

Run:
    pip3 install pandas numpy matplotlib
    python3 data/real_datasets/analyze_datasets.py
"""

import pandas as pd
import numpy as np
import os

BASE = os.path.join(os.path.dirname(__file__))

def sep(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print('='*60)

def load_datasets():
    sep("Loading Datasets")
    traffic = pd.read_csv(f"{BASE}/traffic_volume_60days.csv", parse_dates=["timestamp"])
    energy  = pd.read_csv(f"{BASE}/smart_meter_energy_60days.csv", parse_dates=["timestamp"])
    waste   = pd.read_csv(f"{BASE}/waste_bins_60days.csv", parse_dates=["timestamp"])
    weather = pd.read_csv(f"{BASE}/nagpur_weather_2024.csv", parse_dates=["date"])

    for name, df in [("Traffic", traffic), ("Energy", energy), ("Waste", waste), ("Weather", weather)]:
        print(f"  ✅ {name:<10}: {len(df):>6,} rows × {df.shape[1]} cols")
    return traffic, energy, waste, weather


def analyze_traffic(df):
    sep("🚦 TRAFFIC ANALYSIS")

    df["hour"] = df["timestamp"].dt.hour
    df["day_of_week"] = df["timestamp"].dt.day_name()
    df["is_weekend"] = df["timestamp"].dt.dayofweek >= 5

    print("\n--- Congestion Level Distribution ---")
    cong_dist = df["congestion_level"].value_counts(normalize=True).mul(100).round(1)
    for level, pct in cong_dist.items():
        bar = "█" * int(pct / 2)
        print(f"  {level:<10}: {bar} {pct}%")

    print("\n--- Hourly Avg Vehicle Count (City-wide) ---")
    hourly = df.groupby("hour")["vehicle_count"].mean().round(1)
    for h, v in hourly.items():
        bar = "█" * int(v / 10)
        label = " ← PEAK" if (7<=h<=9 or 16<=h<=19) else ""
        print(f"  {h:02d}:00  {bar} {v:.0f}{label}")

    print("\n--- Top 3 Most Congested Intersections ---")
    top = df.groupby("intersection")["vehicle_count"].mean().sort_values(ascending=False).head(3)
    for inter, count in top.items():
        print(f"  {inter:<25}: {count:.0f} avg vehicles/hr")

    print("\n--- Weather Impact on Avg Speed ---")
    weather_speed = df.groupby("weather")["avg_speed_kmh"].mean().round(1).sort_values()
    for w, s in weather_speed.items():
        print(f"  {w:<15}: {s} km/h")

    print("\n--- Weekday vs Weekend ---")
    comp = df.groupby("is_weekend")[["vehicle_count","avg_speed_kmh","wait_time_sec"]].mean().round(1)
    comp.index = ["Weekday", "Weekend"]
    print(comp.to_string())


def analyze_energy(df):
    sep("⚡ ENERGY ANALYSIS")

    df["hour"] = df["timestamp"].dt.hour

    print("\n--- Zone-wise Average Demand (kW) ---")
    zone_demand = df.groupby("zone")["demand_kw"].agg(["mean","max","std"]).round(2).sort_values("mean", ascending=False)
    print(zone_demand.to_string())

    print("\n--- Time-of-Day Energy Profile ---")
    tod = df.groupby("time_of_day")[["demand_kw","solar_kw","grid_import_kw"]].mean().round(2)
    print(tod.to_string())

    print("\n--- Anomaly Detection Summary ---")
    df["is_anomaly"] = df["anomaly_score"] > 0.25
    anomaly_rate = df["is_anomaly"].mean() * 100
    print(f"  Overall anomaly rate: {anomaly_rate:.2f}%")
    print(f"  (Kaggle Smart Grid dataset: ~3.2% instability rate)")
    by_zone = df.groupby("zone")["is_anomaly"].sum().sort_values(ascending=False)
    print("\n  Anomalies by zone:")
    for zone, count in by_zone.items():
        print(f"    {zone:<15}: {count} events")

    print("\n--- Hourly Peak Demand ---")
    hourly = df.groupby("hour")["demand_kw"].mean().round(1)
    peak_hour = hourly.idxmax()
    print(f"  Peak demand hour: {peak_hour:02d}:00 ({hourly[peak_hour]:.1f} kW avg)")
    print(f"  Min demand hour:  {hourly.idxmin():02d}:00 ({hourly.min():.1f} kW avg)")

    total_demand = df["demand_kw"].sum()
    total_solar = df["solar_kw"].sum()
    print(f"\n  Total demand (60 days): {total_demand:,.0f} kW-readings")
    print(f"  Total solar generated:  {total_solar:,.0f} kW-readings")
    print(f"  Renewable share:        {total_solar/total_demand*100:.1f}%")


def analyze_waste(df):
    sep("🗑️ WASTE MANAGEMENT ANALYSIS")

    print("\n--- Fill Level Statistics by Zone ---")
    zone_fill = df.groupby("zone")["fill_level_pct"].agg(["mean","max","std"]).round(1).sort_values("mean", ascending=False)
    print(zone_fill.to_string())

    print("\n--- Overflow Events (fill > 85%) by Zone ---")
    df["is_overflow"] = df["fill_level_pct"] > 85
    overflow = df.groupby("zone")["is_overflow"].sum().sort_values(ascending=False)
    for zone, count in overflow.items():
        bar = "█" * int(count / 3)
        print(f"  {zone:<15}: {bar} {count}")

    print("\n--- Waste Type Distribution ---")
    wt = df["waste_type"].value_counts(normalize=True).mul(100).round(1)
    for wtype, pct in wt.items():
        bar = "█" * int(pct / 3)
        print(f"  {wtype:<15}: {bar} {pct}%")

    print("\n--- Collection Efficiency ---")
    total_collections = df["collection_flag"].sum()
    overflow_at_collect = df[(df["collection_flag"]==1) & (df["fill_level_pct"]>85)].shape[0]
    print(f"  Total collections:           {total_collections}")
    print(f"  Collections at overflow risk: {overflow_at_collect} ({overflow_at_collect/total_collections*100:.1f}%)")
    print(f"  Avg weight per collection:   {df[df['collection_flag']==1]['weight_kg'].mean():.1f} kg")

    print("\n--- Avg Fill Level by Time of Day ---")
    df["hour"] = df["timestamp"].dt.hour
    tod_fill = df.groupby("hour")["fill_level_pct"].mean().round(1)
    for h in [6, 9, 12, 15, 18, 21]:
        if h in tod_fill.index:
            print(f"  {h:02d}:00  {tod_fill[h]:.1f}%")


def analyze_weather_correlation(traffic, energy, waste, weather):
    sep("🌦️ WEATHER CORRELATION ANALYSIS")

    # Daily aggregation for correlation
    traffic["date"] = traffic["timestamp"].dt.date
    energy["date"] = energy["timestamp"].dt.date
    waste["date"] = waste["timestamp"].dt.date
    weather["date"] = weather["date"].dt.date

    daily_traffic = traffic.groupby("date")["vehicle_count"].mean().reset_index()
    daily_energy  = energy.groupby("date")["demand_kw"].mean().reset_index()
    daily_waste   = waste.groupby("date")["fill_level_pct"].mean().reset_index()
    weather_sub   = weather[["date","avg_temp_c","rainfall_mm","humidity_pct","solar_radiation_wm2"]]

    merged = (daily_traffic
              .merge(daily_energy, on="date")
              .merge(daily_waste, on="date")
              .merge(weather_sub, on="date"))

    merged.columns = ["date","vehicles","demand_kw","fill_pct","temp","rain","humidity","solar"]

    corr = merged[["vehicles","demand_kw","fill_pct","temp","rain","humidity","solar"]].corr().round(3)
    print("\n  Cross-domain Pearson Correlation Matrix:")
    print(corr.to_string())

    print(f"\n  Key Findings:")
    print(f"  • Temperature ↔ Energy Demand:  {corr.loc['temp','demand_kw']:+.3f}  (higher temp → more AC usage)")
    print(f"  • Rain ↔ Vehicle Count:         {corr.loc['rain','vehicles']:+.3f}  (rain reduces traffic)")
    print(f"  • Solar ↔ Energy Demand:        {corr.loc['solar','demand_kw']:+.3f}  (solar offsets grid demand)")
    print(f"  • Temperature ↔ Waste Fill:     {corr.loc['temp','fill_pct']:+.3f}  (heat accelerates decomposition)")


def main():
    print("🏙️  Smart City BDA — Real Dataset Analysis")
    print("    Group 19 | Roll 55, 56, 57")

    traffic, energy, waste, weather = load_datasets()
    analyze_traffic(traffic)
    analyze_energy(energy)
    analyze_waste(waste)
    analyze_weather_correlation(traffic, energy, waste, weather)

    print(f"\n{'='*60}")
    print("  ✅ Analysis complete!")
    print("  These datasets feed the ML models:")
    print("    • traffic → LSTM congestion forecaster")
    print("    • energy  → XGBoost demand forecaster + Isolation Forest")
    print("    • waste   → Random Forest overflow predictor")
    print("    • weather → Feature in all 3 models")
    print('='*60)


if __name__ == "__main__":
    main()
