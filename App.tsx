
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Activity, Thermometer, Zap, AlertTriangle, Settings, 
  Cpu, Database, Wifi, BrainCircuit, Terminal, 
  Signal, Cloud, Laptop, History, ShieldCheck, 
  Network, Lock, Layers, Clock, Share2, Power, Eye
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';
import { GoogleGenAI } from "@google/genai";
import mqtt from 'mqtt';
import { SensorData, DeviceStatus } from './types.ts';

const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [dataHistory, setDataHistory] = useState<SensorData[]>([]);
  const [status, setStatus] = useState<DeviceStatus>({
    online: false,
    lastSeen: "WAITING",
    uptime: "00:00:00",
    ipAddress: "DHCP_PENDING",
    signalStrength: 0
  });
  const [mqttMessages, setMqttMessages] = useState<string[]>([]);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  const currentData = useMemo(() => 
    dataHistory[dataHistory.length - 1] || { temperature: 0, vibration: 0, alert: 0, timestamp: '--:--' }, 
  [dataHistory]);

  // MQTT Core Logic
  useEffect(() => {
    let client: mqtt.MqttClient | null = null;
    
    try {
      const broker = 'wss://25dd38cfeafc4bfc93609ecad6ec8492.s1.eu.hivemq.cloud:8884/mqtt';
      client = mqtt.connect(broker, {
        username: 'altagi',
        password: 'Altagi@020',
        clientId: `web_zenith_${Math.random().toString(16).slice(2, 8)}`,
        connectTimeout: 5000,
        reconnectPeriod: 2000,
      });

      client.on('connect', () => {
        setStatus(prev => ({ ...prev, online: true, ipAddress: "192.168.1.105" }));
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
        } catch (e) { console.error("Parse Error", e); }
      });

      client.on('error', (err) => { 
        console.error("MQTT Error", err);
        setStatus(prev => ({ ...prev, online: false }));
        // If it's taking too long, let's at least show the dashboard in offline mode
        setIsInitializing(false); 
      });

    } catch (e) {
      console.error("Connection Setup Error", e);
      setIsInitializing(false);
    }
    
    return () => { client?.end(); };
  }, []);

  // Demo Fallback
  useEffect(() => {
    if (!isDemoMode) return;
    const interval = setInterval(() => {
      const d = {
        temperature: +(20 + Math.random() * 40).toFixed(1),
        vibration: Math.floor(Math.random() * 100),
        alert: Math.random() > 0.9 ? 1 : 0,
        timestamp: new Date().toLocaleTimeString([], { hour12: false, second: '2-digit' })
      };
      setDataHistory(prev => [...prev, d].slice(-40));
      setStatus(prev => ({ ...prev, online: true }));
      setIsInitializing(false);
    }, 2000);
    return () => clearInterval(interval);
  }, [isDemoMode]);

  const runAiAudit = async () => {
    if (!process.env.API_KEY) return;
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `ALTAGI SYSTEM LOG: Temp ${currentData.temperature}C, Vib ${currentData.vibration}%. Status: ${status.online ? 'STABLE' : 'UNSTABLE'}. Act as an advanced industrial AI. Provide a 1-sentence tactical evaluation.`;
      const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setAiInsight(res.text || null);
    } catch (e) { setAiInsight("NEURAL LINK FAILURE."); }
    finally { setIsAiLoading(false); }
  };

  if (isInitializing && !isDemoMode) {
    return (
      <div className="h-screen bg-[#020205] flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 border-t-2 border-cyan-500 rounded-full animate-spin shadow-[0_0_20px_rgba(0,242,255,0.2)]"></div>
        <div className="text-cyan-500 font-orbitron text-xs tracking-[0.5em] uppercase animate-pulse">Initializing Command Core...</div>
        <div className="flex flex-col items-center gap-2">
           <button onClick={() => setIsDemoMode(true)} className="text-[10px] text-zinc-600 hover:text-cyan-500 transition-colors uppercase font-bold tracking-widest border border-zinc-800 px-4 py-2 rounded">Force Local Demo</button>
           <p className="text-[8px] text-zinc-800 uppercase">Awaiting Altagi HiveMQ Handshake</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col transition-colors duration-1000 ${currentData.alert ? 'bg-rose-950/20' : 'bg-[#020205]'}`}>
      <div className="cyber-grid absolute inset-0 pointer-events-none opacity-20"></div>
      <div className="cyber-scanline"></div>

      {/* Top Tactical HUD */}
      <header className="h-16 px-8 flex items-center justify-between border-b border-cyan-500/20 bg-black/40 backdrop-blur-md relative z-20">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <h1 className="font-orbitron text-xl font-black text-white tracking-tighter italic flex items-center gap-3">
              ALTAGI <span className="text-cyan-500 text-sm">ZENITH-4</span>
            </h1>
            <div className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold">Tactical Monitoring Core</div>
          </div>
          <div className="hidden md:flex gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-cyan-500/5 rounded border border-cyan-500/20">
              <div className={`w-1.5 h-1.5 rounded-full ${status.online ? 'bg-cyan-500 animate-pulse shadow-[0_0_8px_#00f2ff]' : 'bg-zinc-800'}`}></div>
              <span className="text-[9px] font-black uppercase text-cyan-500 tracking-widest">{status.online ? 'LINKED' : 'OFFLINE'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black text-zinc-600 uppercase">Alert Matrix</span>
            <span className={`text-[10px] font-bold ${currentData.alert ? 'text-rose-500' : 'text-emerald-500'}`}>
              {currentData.alert ? 'CRITICAL FAULT DETECTED' : 'SYSTEMS NOMINAL'}
            </span>
          </div>
          <button 
            onClick={() => setIsDemoMode(!isDemoMode)}
            className={`px-4 py-1.5 rounded-sm text-[9px] font-black uppercase transition-all ${isDemoMode ? 'bg-cyan-500 text-black' : 'border border-cyan-500/30 text-cyan-500 hover:bg-cyan-500/10'}`}
          >
            {isDemoMode ? 'DEMO ACTIVE' : 'LIVE MODE'}
          </button>
        </div>
      </header>

      {/* Main Command Workspace */}
      <main className="flex-1 overflow-hidden flex p-6 gap-6 relative z-10">
        
        {/* Left Control Rail */}
        <aside className="w-64 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar">
          {/* Diagnostic Stats */}
          <div className="glass-panel p-5 rounded-sm border-l-2 border-l-cyan-500 space-y-4">
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Cpu className="w-3 h-3" /> Hardware Health
            </div>
            {[
              { label: "IP ADDRESS", value: status.ipAddress, icon: Network },
              { label: "SIGNAL", value: `${status.signalStrength} DBM`, icon: Signal },
              { label: "LAST PULSE", value: status.lastSeen, icon: History },
            ].map((item, i) => (
              <div key={i} className="bg-black/40 p-3 border border-white/5 rounded-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-bold text-zinc-600 uppercase">{item.label}</span>
                  <item.icon className="w-2.5 h-2.5 text-cyan-500/50" />
                </div>
                <div className="text-[10px] font-mono text-white mt-1 uppercase font-bold">{item.value}</div>
              </div>
            ))}
          </div>

          {/* AI Module */}
          <div className="glass-panel p-5 rounded-sm border-l-2 border-l-indigo-500 space-y-4">
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <BrainCircuit className="w-3 h-3 text-indigo-400" /> Neural Oracle
            </div>
            <div className="bg-black p-4 rounded border border-white/5 min-h-[100px] flex items-center justify-center text-center">
              {isAiLoading ? (
                <div className="w-4 h-4 border border-indigo-500 border-t-transparent animate-spin"></div>
              ) : (
                <p className="text-[10px] text-zinc-400 font-medium italic">
                  {aiInsight || "Awaiting system telemetry for neural audit..."}
                </p>
              )}
            </div>
            <button 
              onClick={runAiAudit}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[9px] uppercase tracking-[0.2em] transition-all rounded-sm shadow-lg shadow-indigo-500/10"
            >
              Analyze Stack
            </button>
          </div>

          {/* Fault Summary */}
          <div className={`p-5 rounded-sm border-l-2 ${currentData.alert ? 'bg-rose-950/30 border-rose-500' : 'bg-black/40 border-emerald-500'}`}>
            <div className="text-[10px] font-black text-zinc-400 uppercase flex items-center gap-2 mb-4">
               <AlertTriangle className={`w-3 h-3 ${currentData.alert ? 'text-rose-500' : 'text-emerald-500'}`} /> Safety Matrix
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[9px]">
                <span className="text-zinc-600 font-bold uppercase">Critical Pin</span>
                <span className="text-white font-mono">D2 (LED)</span>
              </div>
              <div className="flex justify-between items-center text-[9px]">
                <span className="text-zinc-600 font-bold uppercase">Trigger</span>
                <span className="text-white font-mono">{currentData.alert ? 'ACTIVE' : 'IDLE'}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Center Canvas: Visual Telemetry */}
        <section className="flex-1 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="glass-panel p-8 rounded-sm relative group overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                 <Thermometer className="w-12 h-12 text-cyan-400" />
               </div>
               <span className="text-[9px] font-black text-cyan-500 uppercase tracking-widest mb-2 block">Ambient Core</span>
               <div className="flex items-baseline gap-2">
                  <h2 className="text-6xl font-orbitron font-black text-white">{currentData.temperature}</h2>
                  <span className="text-xl font-mono text-zinc-700 font-bold">°C</span>
               </div>
               <div className="mt-4 h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 transition-all duration-500 shadow-[0_0_10px_#00f2ff]" style={{ width: `${Math.min(100, (currentData.temperature/100)*100)}%` }}></div>
               </div>
            </div>

            <div className="glass-panel p-8 rounded-sm relative group overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                 <Zap className="w-12 h-12 text-amber-400" />
               </div>
               <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-2 block">Vibration Stress</span>
               <div className="flex items-baseline gap-2">
                  <h2 className="text-6xl font-orbitron font-black text-white">{currentData.vibration}</h2>
                  <span className="text-xl font-mono text-zinc-700 font-bold">%</span>
               </div>
               <div className="mt-4 h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 transition-all duration-500 shadow-[0_0_10px_#f59e0b]" style={{ width: `${currentData.vibration}%` }}></div>
               </div>
            </div>
          </div>

          {/* Main Spectrum Chart */}
          <div className="flex-1 glass-panel rounded-sm p-8 flex flex-col">
            <div className="flex justify-between items-center mb-10">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Live Spectrum Analysis</span>
                <span className="text-[8px] text-zinc-700 font-mono">CHANNEL_01: DHT22 // CHANNEL_02: POTENTIOMETER</span>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Temperature</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Vibration</span>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dataHistory}>
                  <defs>
                    <linearGradient id="cyanFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="amberFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                  <XAxis dataKey="timestamp" hide />
                  <YAxis stroke="#222" fontSize={10} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#050508', border: '1px solid #1e1b4b', borderRadius: '4px', fontSize: '10px' }}
                    itemStyle={{ fontSize: '10px' }}
                  />
                  <Area type="step" dataKey="temperature" stroke="#00f2ff" strokeWidth={2} fill="url(#cyanFill)" animationDuration={300} />
                  <Area type="step" dataKey="vibration" stroke="#f59e0b" strokeWidth={2} fill="url(#amberFill)" animationDuration={300} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Right Terminal Rail */}
        <aside className="w-80 flex flex-col gap-6">
          <div className="flex-1 glass-panel bg-black/90 rounded-sm border-t-2 border-t-emerald-500/50 flex flex-col">
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                <Terminal className="w-3 h-3" /> System Log
              </span>
              <div className="flex gap-1">
                 <div className="w-2 h-2 rounded-full bg-rose-500/30"></div>
                 <div className="w-2 h-2 rounded-full bg-emerald-500/30"></div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-[9px] space-y-1.5 custom-scrollbar">
              {mqttMessages.map((msg, i) => (
                <div key={i} className="text-emerald-500/60 hover:text-emerald-400 cursor-default transition-colors border-l border-emerald-500/10 pl-2">
                  <span className="text-zinc-800">[{new Date().toLocaleTimeString([], { hour12: false })}]</span> {msg}
                </div>
              ))}
              {mqttMessages.length === 0 && <div className="text-zinc-800 animate-pulse font-bold tracking-tighter">LISTENING FOR BROADCAST ON TOPIC: ALTAGI GROUP...</div>}
            </div>
          </div>

          {/* Architecture Map (Mini) */}
          <div className="glass-panel p-6 rounded-sm space-y-4">
             <div className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-4">Neural Data Path</div>
             <div className="flex flex-col gap-6 relative">
                <div className="flex items-center gap-4 group">
                   <div className="p-2 bg-zinc-900 border border-white/5 rounded"><Cpu className="w-4 h-4 text-cyan-400" /></div>
                   <div className="flex flex-col">
                     <span className="text-[8px] font-black text-white uppercase">ESP32 Device</span>
                     <span className="text-[7px] text-zinc-600">SOURCE: WOKWI SIM</span>
                   </div>
                </div>
                <div className="w-px h-6 bg-cyan-500/20 ml-4"></div>
                <div className="flex items-center gap-4">
                   <div className="p-2 bg-zinc-900 border border-white/5 rounded"><Cloud className="w-4 h-4 text-indigo-400" /></div>
                   <div className="flex flex-col">
                     <span className="text-[8px] font-black text-white uppercase">HiveMQ Cluster</span>
                     <span className="text-[7px] text-zinc-600">BROKER: WSS/TLS 1.2</span>
                   </div>
                </div>
                <div className="w-px h-6 bg-indigo-500/20 ml-4"></div>
                <div className="flex items-center gap-4">
                   <div className="p-2 bg-zinc-900 border border-white/5 rounded"><Eye className="w-4 h-4 text-emerald-400" /></div>
                   <div className="flex flex-col">
                     <span className="text-[8px] font-black text-white uppercase">Control UI</span>
                     <span className="text-[7px] text-zinc-600">CLIENT: WEB_ZENITH</span>
                   </div>
                </div>
             </div>
          </div>
        </aside>

      </main>

      {/* Footer Status Bar */}
      <footer className="h-8 bg-black border-t border-white/5 px-8 flex items-center justify-between">
        <div className="flex gap-6">
          <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest">Kernel: 5.4.0-ZENITH</span>
          <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest italic">CPU LOAD: 2%</span>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">System Latency: 14ms</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
