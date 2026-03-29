import React from 'react';
import { useApi } from '../hooks/useApi';
import { StatCard, SectionTitle, Card, Grid, Badge } from '../components/shared/UI';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';

export default function EnergyPage() {
  const { data: liveData } = useApi('/energy/live', 4000);
  const { data: predict } = useApi('/energy/predict', 15000);
  const { data: anomalies } = useApi('/energy/anomalies', 20000);
  const { data: history } = useApi('/energy/history?days=7', 60000);

  const zones = liveData?.data?.zones || [];
  const summary = liveData?.data?.summary || {};
  const histData = history?.history?.slice(-24).map((h, i) => ({
    hour: `${i}h`,
    demand: h.energy?.demand || 0,
    solar: h.energy?.solar || 0,
    gridLoad: h.energy?.gridLoad || 0,
  })) || [];

  return (
    <div>
      <SectionTitle sub="Smart meter monitoring, demand forecasting & anomaly detection">
        ⚡ Energy Management Analytics
      </SectionTitle>

      <Grid cols={4} style={{ marginBottom: 24 }}>
        <StatCard icon="⚡" label="Grid Load" value={`${summary.gridLoad ?? '--'}%`}
          color={summary.gridLoad > 85 ? '#ef4444' : '#02C39A'}
          sub={summary.gridLoad > 85 ? '⚠️ Overload Risk' : '✅ Normal'} />
        <StatCard icon="☀️" label="Solar Generation" value={`${summary.totalSolar ?? '--'} kW`} color="#f59e0b" />
        <StatCard icon="🌿" label="Renewable %" value={`${summary.renewablePercent ?? '--'}%`} color="#02C39A" />
        <StatCard icon="🔍" label="Anomalies Detected" value={summary.anomaliesDetected ?? '--'} color="#8b5cf6" />
      </Grid>

      <Grid cols={2} style={{ marginBottom: 24 }}>
        {/* Zone cards */}
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 16 }}>🏘️ Zone-wise Smart Meter Data</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
            {zones.map((zone, i) => (
              <div key={i} style={{ padding: '10px 12px', background: '#111827', borderRadius: 8, border: '1px solid #1e2a3a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{zone.zone}</span>
                  {zone.anomalyScore > 0.25 && (
                    <Badge label="ANOMALY" />
                  )}
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
                  <span style={{ color: '#f59e0b' }}>⚡ {zone.currentDemand} kW</span>
                  <span style={{ color: '#02C39A' }}>☀️ {zone.solarGeneration} kW</span>
                  <span style={{ color: '#64748b' }}>🔌 {zone.gridImport} kW</span>
                  <span style={{ color: '#8b5cf6' }}>📊 PQ: {zone.powerQuality}%</span>
                </div>
                <div style={{ background: '#1e2a3a', borderRadius: 4, height: 4, marginTop: 8 }}>
                  <div style={{ width: `${Math.min(zone.currentDemand / 5, 100)}%`, height: '100%', background: zone.anomalyScore > 0.25 ? '#ef4444' : '#065A82', borderRadius: 4, transition: 'width 0.5s' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 12 }}>📈 Demand vs Solar (24h)</div>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={histData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#0d1424', border: '1px solid #1e2a3a', color: '#e2e8f0' }} />
                <Area type="monotone" dataKey="demand" stroke="#f59e0b" fill="rgba(245,158,11,0.15)" name="Demand kW" />
                <Area type="monotone" dataKey="solar" stroke="#02C39A" fill="rgba(2,195,154,0.15)" name="Solar kW" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 12 }}>🔌 Grid Load % (24h)</div>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={histData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#0d1424', border: '1px solid #1e2a3a', color: '#e2e8f0' }} />
                <Line type="monotone" dataKey="gridLoad" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Grid Load %" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </Grid>

      {/* Demand Forecast */}
      {predict?.predictions?.hourAheadForecast && (
        <Card style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>
            🤖 Prophet+XGBoost Demand Forecast — MAPE: {predict.mape}
          </div>
          <div style={{ fontSize: 11, color: '#02C39A', marginBottom: 16 }}>
            💡 {predict.predictions.peakShavingRecommendation}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e2a3a' }}>
                  {['Zone', 'Current Demand', 'Forecast (1h)', 'Solar Forecast', 'Anomaly', 'Confidence'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {predict.predictions.hourAheadForecast.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1e2a3a' }}>
                    <td style={{ padding: '8px 12px', color: '#e2e8f0' }}>{p.zone}</td>
                    <td style={{ padding: '8px 12px', color: '#f59e0b', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{Math.round(p.currentDemand)} kW</td>
                    <td style={{ padding: '8px 12px', color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace' }}>{Math.round(p.forecastNextHour)} kW</td>
                    <td style={{ padding: '8px 12px', color: '#02C39A', fontFamily: 'JetBrains Mono, monospace' }}>{Math.round(p.solarForecast)} kW</td>
                    <td style={{ padding: '8px 12px' }}>
                      {p.anomalyDetected ? <Badge label="HIGH" /> : <span style={{ color: '#64748b', fontSize: 11 }}>None</span>}
                    </td>
                    <td style={{ padding: '8px 12px', color: '#02C39A' }}>{p.confidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Anomaly Detection */}
      {anomalies?.anomalies && (
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 16 }}>
            🔍 Isolation Forest Anomaly Detection ({anomalies.totalDetected} detected)
          </div>
          {anomalies.anomalies.length === 0 ? (
            <div style={{ color: '#02C39A', fontSize: 12 }}>✅ No anomalies detected in current window</div>
          ) : (
            <Grid cols={2}>
              {anomalies.anomalies.map((a, i) => (
                <div key={i} style={{ padding: 12, background: '#111827', borderRadius: 8, border: '1px solid #7f1d1d' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{a.zone}</span>
                    <Badge label={a.severity} />
                  </div>
                  <div style={{ fontSize: 11, color: '#fca5a5' }}>Type: {a.type}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Anomaly Score: <span style={{ color: '#ef4444' }}>{a.anomalyScore.toFixed(3)}</span></div>
                  <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>Model: {a.model}</div>
                </div>
              ))}
            </Grid>
          )}
        </Card>
      )}
    </div>
  );
}
