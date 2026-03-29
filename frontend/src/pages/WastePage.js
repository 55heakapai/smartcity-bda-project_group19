import React from 'react';
import { useApi } from '../hooks/useApi';
import { StatCard, SectionTitle, Card, Grid, Badge } from '../components/shared/UI';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Cell
} from 'recharts';

function FillBar({ level }) {
  const color = level > 85 ? '#ef4444' : level > 70 ? '#f59e0b' : '#02C39A';
  return (
    <div style={{ background: '#1e2a3a', borderRadius: 4, height: 8, overflow: 'hidden' }}>
      <div style={{ width: `${level}%`, height: '100%', background: color, transition: 'width 0.5s', borderRadius: 4 }} />
    </div>
  );
}

export default function WastePage() {
  const { data: liveData, loading } = useApi('/waste/live', 4000);
  const { data: predict } = useApi('/waste/predict', 15000);
  const { data: routes } = useApi('/waste/routes', 20000);
  const { data: history } = useApi('/waste/history?days=7', 60000);

  const bins = liveData?.data?.bins || [];
  const summary = liveData?.data?.summary || {};
  const histData = history?.history?.slice(-24).map((h, i) => ({
    hour: `${i}h`, avgFill: h.waste?.avgFill || 0, collections: h.waste?.collections || 0
  })) || [];

  return (
    <div>
      <SectionTitle sub="Real-time bin monitoring, ML-based overflow prediction & route optimization">
        🗑️ Waste Management Analytics
      </SectionTitle>

      <Grid cols={4} style={{ marginBottom: 24 }}>
        <StatCard icon="🗑️" label="Avg Fill Level" value={`${summary.avgFillLevel ?? '--'}%`} color="#f59e0b" />
        <StatCard icon="⚠️" label="Overflow Risk Bins" value={summary.overflowRisk ?? '--'} color="#ef4444" />
        <StatCard icon="🛣️" label="Route Efficiency" value={`${summary.routeEfficiency ?? '--'}%`} color="#02C39A" />
        <StatCard icon="⛽" label="Fuel Saved Today" value={`${summary.fuelSaved ?? '--'} L`} color="#8b5cf6" />
      </Grid>

      <Grid cols={2} style={{ marginBottom: 24 }}>
        {/* Bin Status Table */}
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 16 }}>📍 Live Bin Status (IoT Sensors)</div>
          {loading ? <div style={{ color: '#64748b' }}>Loading sensor data...</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 360, overflowY: 'auto' }}>
              {bins.map(bin => (
                <div key={bin.id} style={{ padding: '10px 12px', background: '#111827', borderRadius: 8, border: '1px solid #1e2a3a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 12, color: '#e2e8f0' }}>{bin.id}</span>
                      <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>{bin.zone}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: bin.fillLevel > 85 ? '#ef4444' : bin.fillLevel > 70 ? '#f59e0b' : '#02C39A' }}>
                        {bin.fillLevel}%
                      </span>
                      <Badge label={bin.status.replace('_', ' ')} />
                    </div>
                  </div>
                  <FillBar level={bin.fillLevel} />
                  <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>
                    Weight: {bin.weight} kg · Temp: {bin.temperature}°C
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* History chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 12 }}>📈 Fill Level Trend (24h)</div>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={histData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#0d1424', border: '1px solid #1e2a3a', color: '#e2e8f0' }} />
                <Line type="monotone" dataKey="avgFill" stroke="#f59e0b" strokeWidth={2} dot={false} name="Avg Fill %" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 12 }}>🚛 Collections Per Hour</div>
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={histData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#0d1424', border: '1px solid #1e2a3a', color: '#e2e8f0' }} />
                <Bar dataKey="collections" fill="#02C39A" name="Collections" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </Grid>

      {/* ML Predictions */}
      {predict?.predictions && (
        <Card style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 16 }}>
            🤖 ML Overflow Predictions — Random Forest (Accuracy: {predict.accuracy})
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e2a3a' }}>
                  {['Bin ID', 'Zone', 'Current Fill', 'Predicted (4h)', 'Overflow Risk', 'Recommended Action', 'Confidence'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {predict.predictions.slice(0, 8).map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1e2a3a' }}>
                    <td style={{ padding: '8px 12px', color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{p.binId}</td>
                    <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{p.zone}</td>
                    <td style={{ padding: '8px 12px', color: '#f59e0b', fontWeight: 700 }}>{p.currentFill}%</td>
                    <td style={{ padding: '8px 12px', color: parseFloat(p.predictedFillIn4h) > 85 ? '#ef4444' : '#f59e0b', fontWeight: 700 }}>{p.predictedFillIn4h}%</td>
                    <td style={{ padding: '8px 12px' }}><Badge label={p.overflowRisk} /></td>
                    <td style={{ padding: '8px 12px', color: '#cbd5e1', fontSize: 11 }}>{p.recommendedCollectionTime}</td>
                    <td style={{ padding: '8px 12px', color: '#02C39A' }}>{p.confidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Route Optimization */}
      {routes?.optimizedRoutes && (
        <Grid cols={2}>
          {routes.optimizedRoutes.map(route => (
            <Card key={route.truckId}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#02C39A', marginBottom: 12 }}>
                🚛 {route.truckId} — Optimized Route
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>
                Distance: {route.totalDistance} · Fuel Saved: {route.fuelSaved} · Algorithm: {route.algorithm}
              </div>
              {route.stops.map((stop, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid #1e2a3a' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#065A82', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: '#e2e8f0' }}>{stop.id} — {stop.zone}</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>Fill: {stop.fillLevel}% · ETA: {stop.estimatedTime}</div>
                  </div>
                  <Badge label={stop.status.replace('_', ' ')} />
                </div>
              ))}
            </Card>
          ))}
        </Grid>
      )}
    </div>
  );
}
