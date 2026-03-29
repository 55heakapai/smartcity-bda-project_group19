import React from 'react';

export function StatCard({ icon, label, value, sub, color = '#02C39A', trend }) {
  return (
    <div style={{
      background: '#0d1424', border: '1px solid #1e2a3a', borderRadius: 12,
      padding: 20, display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        {trend !== undefined && (
          <span style={{ fontSize: 11, color: trend >= 0 ? '#02C39A' : '#ef4444', fontWeight: 600 }}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#475569' }}>{sub}</div>}
    </div>
  );
}

export function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>{children}</h2>
      {sub && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>{sub}</p>}
    </div>
  );
}

export function Badge({ label, color }) {
  const colors = {
    OK: '#065A82', HIGH: '#b45309', CRITICAL: '#7f1d1d',
    MEDIUM: '#78350f', LOW: '#14532d', ACHIEVED: '#065A82',
    GREEN: '#14532d', RED: '#7f1d1d', YELLOW: '#78350f',
  };
  const textColors = {
    OK: '#7dd3fc', HIGH: '#fbbf24', CRITICAL: '#fca5a5',
    MEDIUM: '#fde68a', LOW: '#86efac', ACHIEVED: '#7dd3fc',
    GREEN: '#86efac', RED: '#fca5a5', YELLOW: '#fde68a',
  };
  const bg = colors[label] || '#1e2a3a';
  const text = textColors[label] || '#94a3b8';
  return (
    <span style={{
      background: bg, color: text, fontSize: 10, fontWeight: 700,
      padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase',
    }}>{label}</span>
  );
}

export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: '#0d1424', border: '1px solid #1e2a3a',
      borderRadius: 12, padding: 20, ...style
    }}>
      {children}
    </div>
  );
}

export function Grid({ cols = 4, children, style = {} }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: 16, ...style
    }}>
      {children}
    </div>
  );
}
