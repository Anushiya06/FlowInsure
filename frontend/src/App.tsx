
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { 
  Shield, 
  CloudRain, 
  Wind, 
  AlertTriangle, 
  TrendingUp, 
  History, 
  Settings, 
  ChevronRight,
  Zap,
  Lock,
  Loader2,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './app.css';

const API_BASE = 'http://localhost:5000/api';
const socket = io('http://localhost:5000');

type Tab = 'dashboard' | 'subscription' | 'simulator' | 'history';

export default function App() {
  const [currentTab, setCurrentTab] = useState<Tab>('dashboard');
  const [userId] = useState('usr-1'); // Static for demo
  const [userData, setUserData] = useState<any>(null);
  const [subData, setSubData] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [form, setForm] = useState({
    city: 'Mumbai',
    earnings: 950,
    deliveries: 24,
    threshold: 30
  });

  // Simulator State
  const [sim, setSim] = useState({
    rain: 65,
    aqi: 180,
    drop: 20
  });

  const [alertData, setAlertData] = useState<any>(null);

  const fetchData = async () => {
    try {
      console.log("Fetching data from:", `${API_BASE}/user/${userId}`);
      const { data } = await axios.get(`${API_BASE}/user/${userId}`);
      setUserData(data.user);
      setSubData(data.sub);
      
      const claimsRes = await axios.get(`${API_BASE}/claims/${userId}`);
      setClaims(claimsRes.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data", err);
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/subscribe`, {
        userId,
        city: form.city,
        deliveriesPerDay: form.deliveries,
        avgDailyEarnings: form.earnings,
        payoutRulePct: form.threshold
      });
      setSubData(data);
      setCurrentTab('dashboard');
      showGlobalAlert("Weekly Subscription Active", "success");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runSimulation = async () => {
    console.log("Trigger button was clicked. Sub status:", subData?.isSubscribed);
    if (!subData?.isSubscribed) {
      showGlobalAlert("Subscription Required", "error");
      return;
    }
    
    try {
      console.log("Sending simulation request to backend...");
      const { data } = await axios.post(`${API_BASE}/simulate-disruption`, {
        userId,
        rain: sim.rain,
        aqi: sim.aqi,
        incomeDrop: sim.drop
      });
      console.log("Simulation Result:", data);
      
      if (data.status === 'paid') {
        showGlobalAlert(`Success! Payout of ₹${data.payoutAmount} initiated.`, 'success');
      } else if (data.fraudFlags?.length > 0) {
        showGlobalAlert(`Claim Blocked: Fraud Anomaly Detected.`, 'error');
      } else {
        showGlobalAlert(`No Payout: Trigger conditions not met.`, 'info');
      }
    } catch (err: any) {
      console.error("Simulation API Error:", err.message, err.response?.data);
      showGlobalAlert("Backend connection failed.", "error");
    }
  };

  useEffect(() => {
    fetchData();
    
    socket.on('claim_updated', (newClaim) => {
      setClaims(prev => [newClaim, ...prev].slice(0, 50));
      if (newClaim.status === 'paid') {
        showGlobalAlert(`Automatic Payout Triggered: ₹${newClaim.payoutAmount}`, 'success');
      }
    });

    socket.on('weather_spike', (data) => {
      setAlertData(data);
      setTimeout(() => setAlertData(null), 8000);
    });

    return () => {
      socket.off('claim_updated');
      socket.off('weather_spike');
    };
  }, []);

  const [toast, setToast] = useState<any>(null);
  const showGlobalAlert = (msg: string, type: 'success' | 'error' | 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  if (loading && !userData) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#070911]">
        <Loader2 className="animate-spin text-purple-500" size={48} />
      </div>
    );
  }

  return (
    <div className="premium-container">
      {/* Real-time Alert */}
      <AnimatePresence>
        {alertData && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] w-[400px] glass-panel p-6 border-red-500/50 alert-active"
          >
             <div className="flex items-center gap-4">
                <div className="p-3 bg-red-500/20 rounded-full text-red-500">
                  <CloudRain size={24} />
                </div>
                <div>
                   <h4 className="font-bold text-red-500">PARAMETRIC ALERT</h4>
                   <p className="text-sm text-slate-300">Severe rain detected in {alertData.city}. Monitoring your income logs...</p>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-emerald-500 rounded-xl flex items-center justify-center font-black text-xl">FP</div>
             <div>
                <h1 className="text-2xl font-black m-0">FlowInsure AI</h1>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Parametric Protection v2.0</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right">
                <p className="text-slate-300 font-bold">{userData?.name}</p>
                <p className="text-emerald-500 text-xs font-black">ACTIVE • {subData?.riskLevel} RISK</p>
             </div>
             <img src={userData?.avatar} className="w-12 h-12 rounded-full border border-white/10" alt="avatar" />
          </div>
        </div>

        <nav className="app-nav">
          <div className="glass-panel p-1 flex gap-1">
            {(['dashboard', 'subscription', 'simulator', 'history'] as Tab[]).map(t => (
              <button 
                key={t}
                onClick={() => setCurrentTab(t)}
                className={`nav-pill ${currentTab === t ? 'active' : ''}`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main>
        {currentTab === 'dashboard' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="metric-grid">
            <div className="glass-panel metric-card panel-hover">
               <div className="metric-label flex justify-between">Weekly Coverage <Shield size={16} className="text-violet-500" /></div>
               <div className="metric-value">₹{subData?.avgDailyEarnings * 7 || 0}</div>
               <div className="metric-trend trend-up">Full Income Protection</div>
            </div>
            <div className="glass-panel metric-card panel-hover">
               <div className="metric-label flex justify-between">Risk Score <TrendingUp size={16} className="text-emerald-500" /></div>
               <div className="metric-value">{subData?.riskScore || 0}%</div>
               <div className={`badge ${subData?.riskScore < 40 ? 'badge-risk-low' : 'badge-risk-high'} mt-2`}>
                 {subData?.riskLevel} Risk Profile
               </div>
            </div>
            <div className="glass-panel metric-card panel-hover">
               <div className="metric-label flex justify-between">Weekly Premium <Zap size={16} className="text-yellow-500" /></div>
               <div className="metric-value">₹{subData?.weeklyPremiumINR || 0}</div>
               <div className="text-xs text-slate-500 mt-2">Deducted every Monday from earnings</div>
            </div>
          </motion.div>
        )}

        {currentTab === 'subscription' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-8 max-w-2xl mx-auto">
             <h2 className="text-2xl font-black mb-6">Manage Protection Policy</h2>
             <div className="grid grid-cols-2 gap-6">
                <div className="input-group">
                  <label className="input-label">Operating City</label>
                  <select 
                    className="input-control" 
                    value={form.city} 
                    onChange={e => setForm({...form, city: e.target.value})}
                  >
                    <option>Mumbai</option>
                    <option>Delhi</option>
                    <option>Bengaluru</option>
                    <option>Chennai</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Avg Daily Earnings (₹)</label>
                  <input 
                    type="number" 
                    className="input-control" 
                    value={form.earnings} 
                    onChange={e => setForm({...form, earnings: Number(e.target.value)})}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Deliveries / Day</label>
                  <input 
                    type="number" 
                    className="input-control" 
                    value={form.deliveries}
                    onChange={e => setForm({...form, deliveries: Number(e.target.value)})}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Loss Trigger Threshold (%)</label>
                  <input 
                    type="number" 
                    className="input-control" 
                    value={form.threshold}
                    onChange={e => setForm({...form, threshold: Number(e.target.value)})}
                  />
                </div>
             </div>
             
             <div className="mt-8 p-4 bg-violet-600/10 border border-violet-500/20 rounded-xl mb-8">
                <div className="flex items-center gap-3 text-violet-400 font-bold">
                  <Shield size={20} /> AI Risk Assessment 
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  Based on Mumbai's historical flood data and your 24 delivery/day profile, your weekly risk is {form.earnings > 1000 ? 'Medium' : 'Low'}.
                </p>
             </div>

             <button 
               onClick={handleSubscribe}
               disabled={loading}
               className="btn-premium btn-primary w-full flex items-center justify-center gap-2"
             >
               {loading ? <Loader2 className="animate-spin" /> : <Lock size={18} />} Update Weekly Subscription
             </button>
          </motion.div>
        )}

        {currentTab === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="glass-panel p-8">
                <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                  <CloudRain className="text-violet-500" /> Disruption Simulator
                </h3>
                <div className="space-y-8">
                   <div className="input-group">
                      <div className="flex justify-between mb-2">
                         <span className="input-label m-0">Rain Intensity</span>
                         <span className="text-violet-500 font-black">{sim.rain}mm</span>
                      </div>
                      <input type="range" className="w-full accent-violet-500" min="0" max="100" value={sim.rain} onChange={e => setSim({...sim, rain: Number(e.target.value)})} />
                   </div>
                   <div className="input-group">
                      <div className="flex justify-between mb-2">
                         <span className="input-label m-0">Pollution (AQI)</span>
                         <span className="text-emerald-500 font-black">{sim.aqi}</span>
                      </div>
                      <input type="range" className="w-full accent-emerald-500" min="50" max="400" value={sim.aqi} onChange={e => setSim({...sim, aqi: Number(e.target.value)})} />
                   </div>
                   <div className="input-group">
                      <div className="flex justify-between mb-2">
                         <span className="input-label m-0">Realized Income Drop</span>
                         <span className="text-red-500 font-black">{sim.drop}%</span>
                      </div>
                      <input type="range" className="w-full accent-red-500" min="0" max="100" value={sim.drop} onChange={e => setSim({...sim, drop: Number(e.target.value)})} />
                   </div>
                </div>
                <button 
                  onClick={runSimulation}
                  className="btn-premium btn-primary w-full mt-8 flex items-center justify-center gap-2"
                >
                  <Zap size={18} /> Trigger Parametric Event
                </button>
             </motion.div>
             
             <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="glass-panel p-8 overflow-hidden relative">
                <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                   <AlertTriangle className="text-yellow-500" /> Fraud & Anomaly Guard
                </h3>
                <div className="space-y-4">
                   <div className="flex gap-4 items-start p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                      <div className="p-2 bg-emerald-500/20 text-emerald-500 rounded-lg"><Shield size={18}/></div>
                      <div>
                         <p className="text-sm font-bold text-slate-200">GPS Coherence: Valid</p>
                         <p className="text-xs text-slate-500">Device activity timeline matches delivery logs.</p>
                      </div>
                   </div>
                   <div className="flex gap-4 items-start p-4 bg-slate-500/5 rounded-xl border border-white/5">
                      <div className="p-2 bg-slate-500/20 text-slate-400 rounded-lg"><Wind size={18}/></div>
                      <div>
                         <p className="text-sm font-bold text-slate-200">Environmental Match: {sim.rain > 70 || sim.aqi > 250 ? 'Severe' : 'Normal'}</p>
                         <p className="text-xs text-slate-500">Cross-referencing with IMD weather satellites.</p>
                      </div>
                   </div>
                   
                   <div className="mt-8 pt-6 border-t border-white/10">
                      <p className="text-xs text-slate-500 uppercase font-black tracking-widest mb-4">Payout Projection</p>
                      <div className="flex items-end justify-between">
                         <div className="text-4xl font-black font-mono">₹{(sim.rain > 70 || sim.aqi > 250) && sim.drop >= subData?.payoutRulePct ? Math.round((subData?.avgDailyEarnings * 7) * (sim.drop/100) * 0.85) : 0}</div>
                         <div className="text-sm text-emerald-500 font-bold mb-1">AUTOMATED READY</div>
                      </div>
                   </div>
                </div>
                
                {/* Decorative background grid */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-violet-600/10 to-transparent pointer-events-none opacity-50" />
             </motion.div>
          </div>
        )}

        {currentTab === 'history' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-4 overflow-x-auto">
             <table className="premium-table">
               <thead>
                 <tr>
                   <th>Reference</th>
                   <th>Event Time</th>
                   <th>Status</th>
                   <th>Trigger Factors</th>
                   <th>Loss (%)</th>
                   <th>Payout</th>
                 </tr>
               </thead>
               <tbody>
                 {claims.map((c, i) => (
                   <tr key={c.id}>
                     <td className="font-mono text-xs opacity-50">#{c.id}</td>
                     <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                     <td>
                        <div className={`badge ${c.status === 'paid' ? 'badge-risk-low' : 'badge-risk-high'}`}>
                          {c.status}
                        </div>
                     </td>
                     <td className="text-xs text-slate-400">
                        Rain: {c.rainIntensity}mm | AQI: {c.aqi}
                     </td>
                     <td className="font-bold text-slate-300">{c.incomeDropPct}%</td>
                     <td className="font-black text-emerald-400">
                        {c.status === 'paid' ? `₹${c.payoutAmount}` : '—'}
                     </td>
                   </tr>
                 ))}
                 {claims.length === 0 && (
                   <tr>
                     <td colSpan={6} className="text-center py-12 text-slate-500">No insurance events recorded yet.</td>
                   </tr>
                 )}
               </tbody>
             </table>
          </motion.div>
        )}
      </main>

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`fixed bottom-8 right-8 z-[200] p-4 rounded-2xl glass-panel shadow-2xl border-l-4 ${
              toast.type === 'success' ? 'border-l-emerald-500' : 
              toast.type === 'error' ? 'border-l-red-500' : 'border-l-blue-500'
            }`}
          >
            <div className="flex items-center gap-3">
               <div className={`p-2 rounded-full ${
                  toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-500' : 
                  toast.type === 'error' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'
               }`}>
                  {toast.type === 'success' ? <Shield size={18}/> : <AlertTriangle size={18}/>}
               </div>
               <span className="font-bold text-slate-200">{toast.msg}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
