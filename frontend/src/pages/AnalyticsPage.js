import React from 'react';
import { useApi } from '../hooks/useApi';
import { StatCard, SectionTitle, Card, Grid, Badge } from '../components/shared/UI';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ComposedChart, Area
} from 'recharts';

export default function AnalyticsPage() {
  const { data: history } = useApi('/analytics/history?days=30', 60000);
  const { data: kpi } = useApi('/analytics/kpi', 30000);

  const hist = history?.history || [];

  const weeklyData = [];
  for (let i = 0; i < 30; i++) {
    const slice = hist.slice(i * 24, (i + 1) * 24);
    if (slice.length === 0) continue;
    weeklyData.push({
      day: `Day ${i + 1}`,
      wasteAvgFill: parseFloat((slice.reduce((s, h) => s + (h.waste?.avgFill || 0), 0) / slice.length).toFixed(1)),
      congestion: parseFloat((slice.reduce((s, h) => s + (h.traffic?.congestionIndex || 0), 0) / slice.length).toFixed(1)),
      gridLoad: parseFloat((slice.reduce((s, h) => s + (h.energy?.gridLoad || 0), 0) / slice.length).toFixed(1)),
    });
  }

  const techStack = [
    { layer: 'Data Sources', tech: 'IoT Sensors, CCTV, Smart Meters, GPS, Mobile Apps', volume: '~910 GB/day' },
    { layer: 'Ingestion', tech: 'Apache Kafka (3-node cluster, 12 topics)', volume: '800+ msg/sec' },
    { layer: 'Batch Processing', tech: 'Apache Hadoop HDFS + MapReduce', volume: '82 TB HDFS' },
    { layer: 'Stream Processing', tech: 'Apache Spark Streaming (micro-batch 10s)', volume: 'Real-time' },
    { layer: 'ML Models', tech: 'scikit-learn, PyTorch (LSTM), XGBoost, Prophet', volume: '4 models' },
    { layer: 'Storage', tech: 'HDFS + HBase + PostgreSQL + AWS S3', volume: '90-day rolling' },
    { layer: 'Visualisation', tech: 'Tableau + Power BI + React Dashboard', volume: 'Real-time' },
  ];

  return (
    <div>
      <SectionTitle sub="30-day trend analysis, KPI tracking & Big Data pipeline overview">
        📊 Analytics & BDA Pipeline Overview
      </SectionTitle>

      {/* 30-day trend */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 16 }}>
          📈 30-Day Cross-Domain Trend Analysis (Hadoop Batch Jobs)
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
            <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
            <Tooltip contentStyle={{ background: '#0d1424', border: '1px solid #1e2a3a', color: '#e2e8f0' }} />
            <Legend formatter={v => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>} />
            <Area type="monotone" dataKey="wasteAvgFill" fill="rgba(245,158,11,0.1)" stroke="#f59e0b" name="Waste Fill %" />
            <Line type="monotone" dataKey="congestion" stroke="#ef4444" strokeWidth={2} dot={false} name="Congestion Index" />
            <Line type="monotone" dataKey="gridLoad" stroke="#02C39A" strokeWidth={2} dot={false} name="Grid Load %" />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      {/* KPI Table */}
      {kpi?.kpis && (
        <Card style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 16 }}>🎯 Project KPIs vs Targets</div>
          <Grid cols={3}>
            {kpi.kpis.map((k, i) => (
              <div key={i} style={{ padding: 16, background: '#111827', borderRadius: 10, border: '1px solid #1e2a3a' }}>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>{k.domain.toUpperCase()}</div>
                <div style={{ fontSize: 13, color: '#e2e8f0', marginBottom: 8 }}>{k.metric}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#02C39A', fontFamily: 'JetBrains Mono, monospace' }}>{k.value}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Target: {k.target}</div>
                <div style={{ marginTop: 8 }}><Badge label={k.status} /></div>
              </div>
            ))}
          </Grid>
        </Card>
      )}

      {/* Big Data Stack */}
      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 16 }}>
          🏗️ Big Data Technology Stack (Lambda Architecture)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {techStack.map((layer, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '12px 16px',
              background: i % 2 === 0 ? '#111827' : '#0d1424',
              borderBottom: '1px solid #1e2a3a',
              borderRadius: i === 0 ? '8px 8px 0 0' : i === techStack.length - 1 ? '0 0 8px 8px' : 0,
            }}>
              <div style={{
                minWidth: 120, fontSize: 11, fontWeight: 700,
                color: '#02C39A', textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>{layer.layer}</div>
              <div style={{ flex: 1, fontSize: 12, color: '#e2e8f0' }}>{layer.tech}</div>
              <div style={{ fontSize: 11, color: '#8b5cf6', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>{layer.volume}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
