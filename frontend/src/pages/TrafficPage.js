import React from 'react';
import { useApi } from '../hooks/useApi';
import { StatCard, SectionTitle, Card, Grid, Badge } from '../components/shared/UI';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, RadialBarChart, RadialBar
} from 'recharts';

function CongestionBar({ level }) {
  const pct = Math.min(level, 100);
  const color = pct > 75 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#02C39A';
  return (
    <div style={{ background: '#1e2a3a', borderRadius: 4, height: 6 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.5s' }} />
    </div>
  );
}

export default function TrafficPage() {
  const { data: liveData } = useApi('/traffic/live', 4000);
  const { data: predict } = useApi('/traffic/predict', 15000);
  const { data: signals } = useApi('/traffic/signals', 10000);
  const { data: history } = useApi('/traffic/history?days=7', 60000);

  const intersections = liveData?.data?.intersections || [];
  const summary = liveData?.data?.summary || {};
  const histData = history?.history?.slice(-24).map((h, i) => ({
    hour: `${i}h`,
    congestion: h.traffic?.congestionIndex || 0,
    speed: h.traffic?.avgSpeed || 0,
    vehicles: h.traffic?.vehicles || 0,
  })) || [];

  const congestionLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const congDistrib = congestionLevels.map(l => ({
    name: l,
    count: intersections.filter(i => i.congestionLevel === l).length,
    fill: l === 'LOW' ? '#02C39A' : l === 'MEDIUM' ? '#f59e0b' : l === 'HIGH' ? '#f97316' : '#ef4444'
  }));

  return (
    <div>
      <SectionTitle sub="Real-time traffic flow, LSTM congestion forecasting & adaptive signal control">
        🚦 Traffic Management Analytics
      </SectionTitle>

      <Grid cols={4} style={{ marginBottom: 24 }}>
        <StatCard icon="🚗" label="Congestion Index" value={summary.congestionIndex ?? '--'} color="#ef4444"
          sub={summary.isPeakHour ? '🔴 Peak hour' : '🟢 Off-peak'} />
        <StatCard icon="⚡" label="Avg City Speed" value={`${summary.avgCitySpeed ?? '--'} km/h`} color="#f59e0b" />
        <StatCard icon="⏱️" label="Avg Wait Time" value={`${summary.avgWaitTime ?? '--'}s`} color="#8b5cf6" />
        <StatCard icon="📉" label="Congestion Reduction" value={`${summary.congestionReduction ?? '--'}%`} color="#02C39A" />
      </Grid>

      <Grid cols={2} style={{ marginBottom: 24 }}>
        {/* Intersection status */}
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 16 }}>🗺️ Live Intersection Status</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 360, overflowY: 'auto' }}>
            {intersections.map((inter, i) => (
              <div key={i} style={{ padding: '10px 12px', background: '#111827', borderRadius: 8, border: '1px solid #1e2a3a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{inter.name}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Badge label={inter.signalPhase} />
                    <Badge label={inter.congestionLevel} />
                  </div>
                </div>
                <CongestionBar level={inter.vehicleCount / 2} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#475569', marginTop: 4 }}>
                  <span>🚗 {inter.vehicleCount} vehicles</span>
                  <span>⚡ {inter.avgSpeed} km/h</span>
                  <span>⏱️ {inter.waitTime}s wait</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 12 }}>📈 Congestion Index (24h)</div>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={histData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#0d1424', border: '1px solid #1e2a3a', color: '#e2e8f0' }} />
                <Line type="monotone" dataKey="congestion" stroke="#ef4444" strokeWidth={2} dot={false} name="Congestion" />
                <Line type="monotone" dataKey="speed" stroke="#02C39A" strokeWidth={2} dot={false} name="Avg Speed" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 12 }}>🚗 Congestion Distribution</div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={congDistrib}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#0d1424', border: '1px solid #1e2a3a', color: '#e2e8f0' }} />
                <Bar dataKey="count" name="Intersections" radius={[4, 4, 0, 0]}>
                  {congDistrib.map((entry, i) => (
                    <Bar key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </Grid>

      {/* ML Predictions */}
      {predict?.predictions?.predictions && (
        <Card style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>
            🤖 LSTM Congestion Forecast (30-min ahead) — Accuracy: {predict.accuracy}
          </div>
          <div style={{ fontSize: 11, color: '#02C39A', marginBottom: 16 }}>
            💡 {predict.predictions.recommendation}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e2a3a' }}>
                  {['Intersection', 'Current', 'Predicted 30min', 'Suggested Signal Timing', 'Confidence'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {predict.predictions.predictions.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1e2a3a' }}>
                    <td style={{ padding: '8px 12px', color: '#e2e8f0' }}>{p.intersection}</td>
                    <td style={{ padding: '8px 12px' }}><Badge label={p.currentCongestion} /></td>
                    <td style={{ padding: '8px 12px' }}><Badge label={p.predicted30min} /></td>
                    <td style={{ padding: '8px 12px', color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{p.suggestedSignalTiming}</td>
                    <td style={{ padding: '8px 12px', color: '#02C39A' }}>{p.confidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Adaptive Signals */}
      {signals?.adaptiveSignals && (
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>
            🚦 Adaptive Signal Control — Mode: <span style={{ color: '#02C39A' }}>{signals.mode}</span>
          </div>
          <Grid cols={3}>
            {signals.adaptiveSignals.map((sig, i) => (
              <div key={i} style={{ padding: '12px', background: '#111827', borderRadius: 8, border: '1px solid #1e2a3a' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', marginBottom: 8 }}>{sig.intersection}</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <div style={{ flex: 1, textAlign: 'center', padding: '4px', background: '#14532d', borderRadius: 4 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#86efac' }}>{sig.greenDuration}s</div>
                    <div style={{ fontSize: 9, color: '#86efac' }}>GREEN</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center', padding: '4px', background: '#7f1d1d', borderRadius: 4 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#fca5a5' }}>{sig.redDuration}s</div>
                    <div style={{ fontSize: 9, color: '#fca5a5' }}>RED</div>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: '#64748b' }}>Vehicles cleared: {sig.vehiclesCleared}</div>
                {sig.adaptiveMode && <div style={{ fontSize: 10, color: '#02C39A', marginTop: 4 }}>⚡ ML-Adaptive ON</div>}
              </div>
            ))}
          </Grid>
        </Card>
      )}
    </div>
  );
}
