import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import Dashboard from './pages/Dashboard';
import WastePage from './pages/WastePage';
import TrafficPage from './pages/TrafficPage';
import EnergyPage from './pages/EnergyPage';
import AnalyticsPage from './pages/AnalyticsPage';
import MLPage from './pages/MLPage';
import {
  LayoutDashboard, Trash2, Car, Zap, BarChart3, Brain,
  Wifi, WifiOff, Bell, Menu, X
} from 'lucide-react';

const SOCKET_URL = 'http://localhost:3001';

export const SocketContext = React.createContext(null);
export const LiveDataContext = React.createContext({});

const NAV = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/waste', icon: Trash2, label: 'Waste' },
  { path: '/traffic', icon: Car, label: 'Traffic' },
  { path: '/energy', icon: Zap, label: 'Energy' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/ml', icon: Brain, label: 'ML Models' },
];

export default function App() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [liveData, setLiveData] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const s = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    s.on('connect', () => { setConnected(true); s.emit('subscribe', 'all'); });
    s.on('disconnect', () => setConnected(false));
    s.on('dashboard:update', data => setLiveData(data));
    s.on('alerts:new', newAlerts => {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 50));
      newAlerts.forEach(a => {
        toast(a.message, {
          icon: a.severity === 'CRITICAL' ? '🚨' : a.type === 'WASTE' ? '🗑️' : a.type === 'TRAFFIC' ? '🚦' : '⚡',
          style: { background: a.severity === 'CRITICAL' ? '#7f1d1d' : '#1c1f2e', color: '#fff', border: '1px solid #374151' },
          duration: 5000,
        });
      });
    });
    setSocket(s);
    return () => s.disconnect();
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      <LiveDataContext.Provider value={{ liveData, alerts }}>
        <BrowserRouter>
          <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0f1e', color: '#e2e8f0' }}>
            <Toaster position="top-right" />

            {/* Sidebar */}
            <aside style={{
              width: sidebarOpen ? 220 : 64, transition: 'width 0.3s',
              background: '#0d1424', borderRight: '1px solid #1e2a3a',
              display: 'flex', flexDirection: 'column', flexShrink: 0,
            }}>
              {/* Logo */}
              <div style={{ padding: '20px 16px', borderBottom: '1px solid #1e2a3a' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: 'linear-gradient(135deg, #065A82, #02C39A)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0
                  }}>🏙️</div>
                  {sidebarOpen && (
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#e2e8f0' }}>SmartCity BDA</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>Group 19 | Roll 55,56,57</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Nav */}
              <nav style={{ flex: 1, padding: '12px 8px' }}>
                {NAV.map(({ path, icon: Icon, label }) => (
                  <NavLink key={path} to={path} end={path === '/'}
                    style={({ isActive }) => ({
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', borderRadius: 8, marginBottom: 4,
                      textDecoration: 'none', fontSize: 13, fontWeight: 500,
                      color: isActive ? '#02C39A' : '#94a3b8',
                      background: isActive ? 'rgba(2,195,154,0.1)' : 'transparent',
                      transition: 'all 0.2s',
                    })}>
                    <Icon size={18} style={{ flexShrink: 0 }} />
                    {sidebarOpen && label}
                  </NavLink>
                ))}
              </nav>

              {/* Status */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid #1e2a3a' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {connected
                    ? <Wifi size={14} color="#02C39A" />
                    : <WifiOff size={14} color="#ef4444" />}
                  {sidebarOpen && (
                    <span style={{ fontSize: 11, color: connected ? '#02C39A' : '#ef4444' }}>
                      {connected ? 'Live Connected' : 'Offline'}
                    </span>
                  )}
                </div>
              </div>
            </aside>

            {/* Main */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Topbar */}
              <header style={{
                height: 56, background: '#0d1424', borderBottom: '1px solid #1e2a3a',
                display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16,
              }}>
                <button onClick={() => setSidebarOpen(!sidebarOpen)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
                <span style={{ flex: 1, fontSize: 14, color: '#64748b' }}>
                  Smart City Data Analytics — Real-time BDA Dashboard
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {alerts.length > 0 && (
                    <div style={{ position: 'relative' }}>
                      <Bell size={18} color="#f59e0b" />
                      <span style={{
                        position: 'absolute', top: -6, right: -6, background: '#ef4444',
                        color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: '50%',
                        width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>{Math.min(alerts.length, 9)}</span>
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {new Date().toLocaleTimeString('en-IN')}
                  </div>
                </div>
              </header>

              {/* Page Content */}
              <main style={{ flex: 1, overflow: 'auto', padding: 24 }}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/waste" element={<WastePage />} />
                  <Route path="/traffic" element={<TrafficPage />} />
                  <Route path="/energy" element={<EnergyPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/ml" element={<MLPage />} />
                </Routes>
              </main>
            </div>
          </div>
        </BrowserRouter>
      </LiveDataContext.Provider>
    </SocketContext.Provider>
  );
}
