
import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity, Thermometer, Zap, AlertTriangle,
  Cpu, Terminal, Signal, Cloud, History,
  Network, Eye, ShieldCheck, User, Info,
  Moon, Sun, Bell, BellRing
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import mqtt from 'mqtt';
import { SensorData, DeviceStatus } from './types.ts';

const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [dataHistory, setDataHistory] = useState<SensorData[]>([]);
  const [status, setStatus] = useState<DeviceStatus>({
    online: false,
    lastSeen: "WAITING",
    uptime: "00:00:00",
    ipAddress: "10.0.0.x (Wokwi-GUEST)",
    signalStrength: 0
  });
  const [mqttMessages, setMqttMessages] = useState<string[]>([]);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const currentData = useMemo(() =>
    dataHistory[dataHistory.length - 1] || { temperature: 0, vibration: 0, alert: 0, timestamp: '--:--' },
    [dataHistory]);

  const isDanger = useMemo(() => (
    currentData.temperature > 50 || currentData.vibration > 80 || currentData.alert === 1
  ), [currentData]);

  // Combined theme/danger logic for background
  const themeClasses = useMemo(() => {
    if (isDarkMode) {
      return isDanger ? 'bg-rose-950/40 text-rose-100' : 'bg-[#05070A] text-slate-100';
    }
    return isDanger ? 'bg-rose-50/30' : 'bg-[#F8FAFC]';
  }, [isDarkMode, isDanger]);

  useEffect(() => {
    let client: mqtt.MqttClient | null = null;
    try {
      const broker = 'wss://25dd38cfeafc4bfc93609ecad6ec8492.s1.eu.hivemq.cloud:8884/mqtt';
      client = mqtt.connect(broker, {
        username: 'altagi',
        password: 'Altagi@020',
        clientId: `AIU_DCE2243_${Math.random().toString(16).slice(2, 8)}`,
        connectTimeout: 30000,
        reconnectPeriod: 2000,
      });

      client.on('connect', () => {
        setStatus(prev => ({ ...prev, online: true }));
        client?.subscribe('Altagi Group');
        setIsInitializing(false);
      });

      client.on('message', (_, msg) => {
        const raw = msg.toString();
        setMqttMessages(prev => [raw, ...prev.slice(0, 15)]);
        try {
          const p = JSON.parse(raw);
          setDataHistory(prev => [...prev, {
            temperature: p.temperature || 0,
            vibration: p.vibration || 0,
            alert: p.alert || 0,
            timestamp: new Date().toLocaleTimeString([], { hour12: false, second: '2-digit' })
          }].slice(-40));
          setStatus(prev => ({ ...prev, lastSeen: "LIVE", signalStrength: -55 + Math.floor(Math.random() * 10) }));
        } catch (e) {
          setMqttMessages(prev => ["WARN: Received non-JSON payload", ...prev]);
        }
      });

      client.on('error', (err) => {
        console.error("MQTT Error", err);
        setStatus(prev => ({ ...prev, online: false }));
        setIsInitializing(false);
      });
    } catch (e) {
      setIsInitializing(false);
    }
    return () => { client?.end(); };
  }, []);

  useEffect(() => {
    if (!isDemoMode) return;
    const interval = setInterval(() => {
      setDataHistory(prev => [...prev, {
        temperature: +(45 + Math.random() * 12).toFixed(1),
        vibration: Math.floor(65 + Math.random() * 25),
        alert: 0,
        timestamp: new Date().toLocaleTimeString([], { hour12: false, second: '2-digit' })
      }].slice(-40));
      setStatus(prev => ({ ...prev, online: true }));
      setIsInitializing(false);
    }, 2000);
    return () => clearInterval(interval);
  }, [isDemoMode]);

  if (isInitializing && !isDemoMode) {
    return (
      <div className={`h-screen flex flex-col items-center justify-center space-y-8 ${isDarkMode ? 'bg-[#05070A]' : 'bg-[#FDFDFF]'}`}>
        <div className="relative">
          <div className={`w-20 h-20 border-[3px] rounded-full animate-pulse ${isDarkMode ? 'border-emerald-900' : 'border-emerald-100'}`}></div>
          <div className="absolute inset-0 w-20 h-20 border-t-[3px] border-emerald-500 rounded-full animate-spin"></div>
        </div>
        <div className="text-center space-y-2">
          <h2 className={`font-medium tracking-tight text-lg ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>System Handshake in Progress</h2>
          <p className={`text-[10px] font-medium uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Establishing Encrypted Tunnel</p>
        </div>
        <button onClick={() => setIsDemoMode(true)} className={`px-6 py-2.5 border text-[10px] font-bold uppercase tracking-widest rounded-full transition-all shadow-sm ${isDarkMode ? 'bg-[#0F172A] border-slate-800 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
          Enter Simulator Mode
        </button>
      </div>
    );
  }

  const cardBase = isDarkMode ? 'bg-[#0F172A]/60 border-slate-800 shadow-2xl' : 'bg-white border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className={`h-screen flex flex-col transition-all duration-700 ${themeClasses}`}>
      {!isDarkMode && <div className="absolute inset-0 bg-gradient-to-tr from-slate-100 via-white to-emerald-50/10 pointer-events-none opacity-50"></div>}
      {isDarkMode && <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.05),transparent)] pointer-events-none"></div>}

      {/* Header */}
      <header className={`h-20 px-10 flex items-center justify-between backdrop-blur-xl border-b relative z-30 transition-all ${isDarkMode ? 'bg-slate-950/60 border-slate-800/80 shadow-2xl' : 'bg-white/70 border-slate-200/60'}`}>
        <div className="flex items-center gap-10">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-lg shadow-lg shadow-emerald-500/20">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <h1 className={`font-bold text-xl tracking-tight leading-none uppercase italic ${textPrimary}`}>
                Smart Industry <span className="text-emerald-500 font-black">X</span>
              </h1>
            </div>
            <div className={`text-[10px] uppercase tracking-widest font-black mt-1.5 ml-12 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>DCE2243 • Albukhary International University</div>
          </div>
          <div className="h-8 w-px bg-slate-200/20"></div>
          <div className={`flex items-center gap-3 px-4 py-1.5 rounded-full border ${status.online ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
            <div className={`w-2 h-2 rounded-full ${status.online ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">
              {status.online ? 'Secure-SSL' : 'Offline'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Safety Matrix</span>
            <div className="flex items-center gap-2 mt-1">
              {isDanger ? <BellRing className="w-3.5 h-3.5 text-rose-500 animate-bounce" /> : <Bell className={`w-3.5 h-3.5 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-500'}`} />}
              <span className={`text-xs font-bold leading-none uppercase tracking-tighter ${isDanger ? 'text-rose-500' : 'text-emerald-500'}`}>
                {isDanger ? 'Critical Alert' : 'Normal'}
              </span>
            </div>
          </div>

          <div className="flex items-center bg-slate-100/10 p-1 rounded-full border border-white/5 gap-2 px-3">
            <button onClick={() => setIsDarkMode(false)} className={`p-1.5 rounded-full transition-all ${!isDarkMode ? 'bg-white shadow-xl text-amber-500 scale-110' : 'text-slate-600'}`}><Sun className="w-3.5 h-3.5" /></button>
            <button onClick={() => setIsDarkMode(true)} className={`p-1.5 rounded-full transition-all ${isDarkMode ? 'bg-slate-800 shadow-xl text-emerald-400 scale-110' : 'text-slate-300'}`}><Moon className="w-3.5 h-3.5" /></button>
          </div>

          <button
            onClick={() => setIsDemoMode(!isDemoMode)}
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase transition-all shadow-lg ${isDemoMode ? 'bg-emerald-500 text-white shadow-emerald-500/20' : isDarkMode ? 'bg-slate-800 border border-slate-700 text-white hover:bg-slate-700' : 'bg-slate-900 text-white hover:bg-black shadow-slate-900/10'}`}
          >
            {isDemoMode ? 'Simulator Active' : 'Live Mode'}
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 overflow-hidden p-8 gap-8 flex relative z-10">

        {/* Left Control Rail */}
        <aside className="w-72 flex flex-col gap-8">
          <div className={`${cardBase} backdrop-blur-2xl border p-6 rounded-[2rem] space-y-5`}>
            <h3 className={`font-black text-[10px] uppercase tracking-widest flex items-center gap-2 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Secure Node
            </h3>
            <div className="grid gap-3">
              {[
                { label: "IP ADDRESS", value: status.ipAddress },
                { label: "CRYPTO", value: "AES-256 TLS" },
                { label: "CLIENT", value: "AU-IOT-WOKWI" },
              ].map((item, i) => (
                <div key={i} className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50/50 border-slate-100'}`}>
                  <div className={`text-[8px] font-black uppercase tracking-wider ${isDarkMode ? 'text-slate-700' : 'text-slate-400'}`}>{item.label}</div>
                  <div className={`text-[11px] font-bold mt-0.5 ${isDarkMode ? 'text-emerald-400' : 'text-slate-700'}`}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* MQTT Console */}
          <div className={`flex-1 ${cardBase} backdrop-blur-2xl border p-6 rounded-[2rem] flex flex-col ${isDanger ? (isDarkMode ? 'bg-rose-950/20 border-rose-900/50' : 'bg-rose-50/50 border-rose-100') : ''}`}>
            <h3 className={`font-black text-[10px] uppercase tracking-widest flex items-center justify-between mb-4 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
              <span className="flex items-center gap-2"><Terminal className={`w-3.5 h-3.5 ${isDanger ? 'text-rose-500' : 'text-emerald-500'}`} /> Port 8883 Uptime</span>
              {isDanger && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>}
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {mqttMessages.map((msg, i) => (
                <div key={i} className="text-[10px] leading-relaxed group">
                  <span className={`font-mono ${isDarkMode ? 'text-slate-700' : 'text-slate-300'}`}>[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                  <p className={`mt-0.5 font-medium ${isDanger ? 'text-rose-400' : isDarkMode ? 'text-emerald-500/60' : 'text-slate-600'}`}>{msg}</p>
                </div>
              ))}
              {mqttMessages.length === 0 && <span className="text-slate-500 italic text-[10px]">Establishing handshake...</span>}
            </div>
          </div>
        </aside>

        {/* Dynamic Telemetry Canvas */}
        <section className="flex-1 flex flex-col gap-8">
          <div className="grid grid-cols-2 gap-8 h-56">
            <div className={`${cardBase} relative p-10 border rounded-[2.5rem] group overflow-hidden`}>
              <div className={`absolute top-0 left-0 w-full h-1.5 transition-all duration-500 ${currentData.temperature > 50 ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
              <div className="flex items-center justify-between mb-2 pb-4">
                <div className={`p-4 rounded-2xl group-hover:scale-110 transition-transform ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
                  <Thermometer className={`w-6 h-6 ${currentData.temperature > 50 ? 'text-rose-500' : 'text-emerald-500'}`} />
                </div>
                <div className="text-right">
                  <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Sensor: DHT22</div>
                  <div className={`text-[8px] font-bold ${isDarkMode ? 'text-rose-900' : 'text-rose-300'}`}>ALERT @ 50.0°C</div>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h2 className={`text-7xl font-bold tracking-tighter ${currentData.temperature > 50 ? 'text-rose-500' : textPrimary}`}>
                  {currentData.temperature}
                </h2>
                <span className="text-xl font-bold text-slate-500 uppercase tracking-widest leading-none"> °C</span>
              </div>
            </div>

            <div className={`${cardBase} relative p-10 border rounded-[2.5rem] group overflow-hidden`}>
              <div className={`absolute top-0 left-0 w-full h-1.5 transition-all duration-500 ${currentData.vibration > 80 ? 'bg-rose-500' : 'bg-blue-500'}`}></div>
              <div className="flex items-center justify-between mb-2 pb-4">
                <div className={`p-4 rounded-2xl group-hover:scale-110 transition-transform ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
                  <Zap className={`w-6 h-6 ${currentData.vibration > 80 ? 'text-rose-500' : 'text-blue-500'}`} />
                </div>
                <div className="text-right">
                  <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Proprietary Vibration</div>
                  <div className={`text-[8px] font-bold ${isDarkMode ? 'text-blue-900' : 'text-blue-200'}`}>LIMIT: 80%</div>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h2 className={`text-7xl font-bold tracking-tighter ${currentData.vibration > 80 ? 'text-rose-500' : textPrimary}`}>
                  {currentData.vibration}
                </h2>
                <span className="text-xl font-bold text-slate-500 uppercase tracking-widest leading-none"> %</span>
              </div>
            </div>
          </div>

          {/* Area Chart */}
          <div className={`${cardBase} flex-1 p-10 border rounded-[3rem] flex flex-col`}>
            <div className="flex items-center justify-between mb-10">
              <div>
                <h4 className={`font-bold text-base tracking-tight italic ${textPrimary}`}>Dynamic Telemetry Pulse</h4>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Live Window: 40 Packets</p>
              </div>
              <div className="flex gap-8">
                <div className="flex items-center gap-2.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Temp
                </div>
                <div className="flex items-center gap-2.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> Vibration
                </div>
              </div>
            </div>

            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dataHistory} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={isDarkMode ? 0.3 : 0.1} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorVib" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={isDarkMode ? 0.2 : 0.1} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} vertical={false} />
                  <XAxis dataKey="timestamp" hide />
                  <YAxis stroke="#475569" fontSize={9} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                      border: isDarkMode ? '1px solid #1E293B' : 'none',
                      borderRadius: '16px',
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                      color: isDarkMode ? '#FFFFFF' : '#000000'
                    }}
                  />
                  <Area type="monotone" dataKey="temperature" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorTemp)" />
                  <Area type="monotone" dataKey="vibration" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorVib)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Right Info Rail */}
        <aside className="w-72 flex flex-col gap-8">
          <div className={`p-8 rounded-[2.5rem] border shadow-2xl relative overflow-hidden group transition-all duration-500 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-900 border-slate-900 text-white'}`}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
              <Cpu className="w-24 h-24 text-emerald-400" />
            </div>
            <div className="relative z-10">
              <h3 className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.3em] mb-6">Development Core</h3>
              <div className="space-y-5">
                {[
                  { name: "Abdalhafeedh Omer", id: "AIU22102365" },
                  { name: "Altagi Abdallah", id: "AIU22102396" },
                  { name: "Almonzer Hamid", id: "AIU22102343" },
                ].map((user, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center border border-white/5">
                      <User className="w-3.5 h-3.5 text-white/40" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-white uppercase tracking-tight">{user.name}</div>
                      <div className="text-[8px] text-white/30 font-mono">{user.id}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={`flex-1 rounded-[2rem] border p-8 flex flex-col backdrop-blur-3xl ${cardBase}`}>
            <h3 className={`font-black text-[10px] uppercase tracking-widest mb-6 flex items-center gap-2 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
              <Info className="w-3.5 h-3.5" /> Project Methodology
            </h3>
            <div className="space-y-6 flex-1 pr-2 overflow-y-auto custom-scrollbar">
              {[
                { step: "SENSE", desc: "Edge IoT Nodes", active: true },
                { step: "PROCESS", desc: "ESP32 Logic Engine", active: true },
                { step: "ENCRYPT", desc: "TLS SSL Tunneling", active: true },
                { step: "BROKER", desc: "HiveMQ Distribution", active: true },
                { step: "MONITOR", desc: "React Zenith Dashboard", active: true },
              ].map((it, i) => (
                <div key={i} className="flex gap-4 relative">
                  {i < 4 && <div className={`absolute left-[7px] top-6 w-[2px] h-6 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}></div>}
                  <div className={`w-3.5 h-3.5 rounded-full mt-1 border-2 transition-all duration-1000 ${it.active ? 'bg-emerald-500 border-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-white border-slate-200'}`}></div>
                  <div>
                    <div className={`text-[10px] font-black uppercase ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{it.step}</div>
                    <div className={`text-[9px] font-medium ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>{it.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer className={`h-14 px-10 flex items-center justify-between text-[10px] font-bold border-t z-30 transition-all ${isDarkMode ? 'bg-slate-950 border-slate-900 text-slate-600' : 'bg-white border-slate-100 text-slate-400'}`}>
        <div className="flex gap-8 items-center uppercase tracking-widest italic">
          <span>© 2024 Final Year Project Portfolio</span>
          <div className={`w-1 h-1 rounded-full ${isDarkMode ? 'bg-slate-800' : 'bg-slate-300'}`}></div>
          <span>DCE2243 Albukhary International University</span>
        </div>
        <div className="flex gap-6 uppercase tracking-[0.2em]">
          <span className="text-emerald-500 underline decoration-2 underline-offset-4">Latency: 240ms</span>
          <span className="text-blue-500 underline decoration-2 underline-offset-4">Handshake: 100%</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
