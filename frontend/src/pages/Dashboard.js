import React, { useContext, useState, useEffect } from 'react';
import { LiveDataContext } from '../App';
import { StatCard, SectionTitle, Card, Grid, Badge } from '../components/shared/UI';
import { useApi } from '../hooks/useApi';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#02C39A', '#065A82', '#f59e0b', '#ef4444', '#8b5cf6'];

function generateSparkline(count = 20) {
  let v = 50;
  return Array.from({ length: count }, (_, i) => {
    v = Math.max(10, Math.min(95, v + (Math.random() - 0.5) * 15));
    return { t: i, v: parseFloat(v.toFixed(1)) };
  });
}

export default function Dashboard() {
  const { liveData, alerts } = useContext(LiveDataContext);
  const { data: overview } = useApi('/analytics/overview', 5000);
  const { data: kpi } = useApi('/analytics/kpi', 30000);

  const [wasteHistory, setWasteHistory] = useState(generateSparkline());
  const [trafficHistory, setTrafficHistory] = useState(generateSparkline());
  const [energyHistory, setEnergyHistory] = useState(generateSparkline());

  useEffect(() => {
    const id = setInterval(() => {
      const addPoint = (prev, val) => {
        const next = [...prev.slice(1), { t: prev[prev.length - 1].t + 1, v: val }];
        return next;
      };
      if (liveData?.waste) setWasteHistory(p => addPoint(p, liveData.waste.summary?.avgFillLevel || 50));
      if (liveData?.traffic) setTrafficHistory(p => addPoint(p, liveData.traffic.summary?.congestionIndex || 50));
      if (liveData?.energy) setEnergyHistory(p => addPoint(p, liveData.energy.summary?.gridLoad || 50));
    }, 3000);
    return () => clearInterval(id);
  }, [liveData]);

  const waste = liveData?.waste?.summary || {};
  const traffic = liveData?.traffic?.summary || {};
  const energy = liveData?.energy?.summary || {};

  const domainPie = [
    { name: 'Waste', value: 30 },
    { name: 'Traffic', value: 35 },
    { name: 'Energy', value: 35 },
  ];

  return (
    <div>
      <SectionTitle sub="Real-time IoT sensor data across Nagpur smart city domains">
        🏙️ Smart City Command Centre
      </SectionTitle>

      {/* Top KPI cards */}
      <Grid cols={4} style={{ marginBottom: 24 }}>
        <StatCard icon="🗑️" label="Avg Bin Fill Level" value={`${waste.avgFillLevel ?? '--'}%`}
          sub={`${waste.overflowRisk ?? 0} bins at overflow risk`} color="#f59e0b" />
        <StatCard icon="🚦" label="Congestion Index" value={traffic.congestionIndex ?? '--'}
          sub={traffic.isPeakHour ? '🔴 Peak Hour Active' : '🟢 Off-Peak'} color="#ef4444" />
        <StatCard icon="⚡" label="Grid Load" value={`${energy.gridLoad ?? '--'}%`}
          sub={`${energy.renewablePercent ?? 0}% renewable`} color="#02C39A" />
        <StatCard icon="🚨" label="Active Alerts" value={alerts.length}
          sub="Across all 3 domains" color="#8b5cf6" />
      </Grid>

      {/* Sparkline charts */}
      <Grid cols={3} style={{ marginBottom: 24 }}>
        {[
          { title: '♻️ Waste Fill Level (Live)', data: wasteHistory, color: '#f59e0b', unit: '%' },
          { title: '🚦 Congestion Index (Live)', data: trafficHistory, color: '#ef4444', unit: '' },
          { title: '⚡ Grid Load (Live)', data: energyHistory, color: '#02C39A', unit: '%' },
        ].map(({ title, data, color, unit }) => (
          <Card key={title}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 12 }}>{title}</div>
            <ResponsiveContainer width="100%" height={100}>
              <LineChart data={data}>
                <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
                <Tooltip formatter={v => [`${v}${unit}`]} labelFormatter={() => ''} contentStyle={{ background: '#0d1424', border: '1px solid #1e2a3a' }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        ))}
      </Grid>

      {/* Middle section */}
      <Grid cols={3} style={{ marginBottom: 24 }}>
        {/* Domain distribution */}
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 12 }}>📊 Data Volume by Domain</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={domainPie} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                {domainPie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0d1424', border: '1px solid #1e2a3a' }} />
              <Legend formatter={v => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Live stats */}
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 12 }}>📡 Live Pipeline Stats</div>
          {[
            { label: 'Data Ingestion Rate', val: '~910 GB/day' },
            { label: 'IoT Sensors Active', val: '1,247' },
            { label: 'Kafka Messages/sec', val: `${Math.floor(Math.random() * 500 + 800)}` },
            { label: 'Spark Jobs Running', val: '12' },
            { label: 'HDFS Storage Used', val: '14.2 TB / 82 TB' },
            { label: 'ML Predictions/min', val: `${Math.floor(Math.random() * 200 + 300)}` },
          ].map(({ label, val }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #1e2a3a' }}>
              <span style={{ fontSize: 11, color: '#64748b' }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#02C39A', fontFamily: 'JetBrains Mono, monospace' }}>{val}</span>
            </div>
          ))}
        </Card>

        {/* Alerts */}
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 12 }}>🚨 Recent Alerts</div>
          {alerts.length === 0 ? (
            <div style={{ color: '#64748b', fontSize: 12, textAlign: 'center', padding: 20 }}>No active alerts</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alerts.slice(0, 5).map((a, i) => (
                <div key={i} style={{
                  padding: '8px 10px', borderRadius: 8,
                  background: a.severity === 'CRITICAL' ? 'rgba(127,29,29,0.3)' : 'rgba(120,53,15,0.3)',
                  border: `1px solid ${a.severity === 'CRITICAL' ? '#7f1d1d' : '#78350f'}`,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: a.severity === 'CRITICAL' ? '#fca5a5' : '#fde68a' }}>
                    {a.type} · {a.severity}
                  </div>
                  <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 2 }}>{a.message}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </Grid>

      {/* KPI Table */}
      {kpi?.kpis && (
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 16 }}>🎯 Project KPI Tracker</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e2a3a' }}>
                  {['Domain', 'Metric', 'Achieved', 'Target', 'Status'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kpi.kpis.map((k, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1e2a3a' }}>
                    <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{k.domain}</td>
                    <td style={{ padding: '8px 12px', color: '#e2e8f0' }}>{k.metric}</td>
                    <td style={{ padding: '8px 12px', color: '#02C39A', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{k.value}</td>
                    <td style={{ padding: '8px 12px', color: '#64748b' }}>{k.target}</td>
                    <td style={{ padding: '8px 12px' }}><Badge label={k.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
