
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import { AIService } from './services/aiService';
import { User, Subscription, Claim, WeatherData } from './models/types';
import { randomUUID } from 'crypto';

const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, { cors: { origin: '*' } });

app.use(cors({ origin: '*', methods: ['GET', 'POST'], allowedHeaders: ['Content-Type'] }));
app.use(express.json());

// Logger for debugging connectivity
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --- IN-MEMORY DATABASE (DEMO) ---
let users: User[] = [
  { id: 'usr-1', name: 'Arjun Das', city: 'Mumbai', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun' }
];

let subscriptions: Subscription[] = [
  { 
    id: 'sub-1', 
    userId: 'usr-1', 
    isSubscribed: true, 
    weeklyPremiumINR: 195, 
    avgDailyEarnings: 950, 
    deliveriesPerDay: 24, 
    riskScore: 28, 
    riskLevel: 'Low',
    payoutRulePct: 35
  }
];

let claims: Claim[] = [];

// --- API ROUTES ---

// 1. User/Subscription fetch
app.get('/api/user/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  const sub = subscriptions.find(s => s.userId === req.params.id);
  res.json({ user, sub });
});

// 2. Risk Assessment (AI compute)
app.post('/api/assess-risk', (req, res) => {
  const { city, deliveriesPerDay, avgDailyEarnings } = req.body;
  const score = AIService.computeRiskScore(city, deliveriesPerDay, avgDailyEarnings);
  const level = AIService.getRiskLevel(score);
  const premium = AIService.calculateWeeklyPremium(score, avgDailyEarnings);
  
  res.json({ score, level, premium });
});

// 3. Subscribe
app.post('/api/subscribe', (req, res) => {
  const { userId, city, deliveriesPerDay, avgDailyEarnings, payoutRulePct } = req.body;
  
  const score = AIService.computeRiskScore(city, deliveriesPerDay, avgDailyEarnings);
  const premium = AIService.calculateWeeklyPremium(score, avgDailyEarnings);
  
  const sub: Subscription = {
    id: `sub-${randomUUID().slice(0, 8)}`,
    userId,
    isSubscribed: true,
    weeklyPremiumINR: premium,
    avgDailyEarnings,
    deliveriesPerDay,
    riskScore: score,
    riskLevel: AIService.getRiskLevel(score),
    payoutRulePct
  };

  subscriptions = subscriptions.filter(s => s.userId !== userId);
  subscriptions.push(sub);
  res.json(sub);
});

// 4. Automated Smart Trigger (Integration with External APIs)
app.post('/api/simulate-disruption', async (req, res) => {
  const { userId, incomeDrop, useRealData } = req.body;
  const sub = subscriptions.find(s => s.userId === userId);
  const user = users.find(u => u.id === userId);
  
  if (!sub || !sub.isSubscribed) {
    return res.status(400).json({ error: 'User is not subscribed' });
  }

  let rain = req.body.rain;
  let aqi = req.body.aqi;

  if (useRealData) {
     const city = user?.city || 'Mumbai';
     const realData = await AIService.fetchEnvironmentData(city);
     rain = realData.rain;
     aqi = realData.aqi;
  }

  const fraudFlags = AIService.detectFraud({ rainIntensity: rain, aqi, incomeDropPct: incomeDrop }, claims.length);
  const { triggerMatch, payout } = AIService.shouldAutoPay({ rainIntensity: rain, aqi, incomeDropPct: incomeDrop }, sub.payoutRulePct);
  
  // Real ML logic sets status based on anomaly flags and triggers
  const status = fraudFlags.length > 0 ? 'blocked' : triggerMatch ? 'paid' : 'blocked';

  const claim: Claim = {
    id: `clm-${randomUUID().slice(0, 8)}`,
    userId,
    weekId: `2024-W${new Date().getMonth() + 1}`,
    city: sub.riskLevel, 
    rainIntensity: rain,
    aqi,
    incomeDropPct: incomeDrop,
    status,
    payoutAmount: payout,
    fraudFlags,
    createdAt: new Date().toISOString()
  };

  claims.unshift(claim);
  
  // Real-time notification via WebSockets
  io.emit('claim_updated', claim);
  
  res.json({ ...claim, usedRealData: useRealData });
});

// 5. Claim History
app.get('/api/claims/:userId', (req, res) => {
  res.json(claims.filter(c => c.userId === req.params.userId));
});

// --- SOCKET EVENTS ---
io.on('connection', (socket) => {
  console.log('Client connected through WebSockets for real-time triggers.');
  
  socket.on('request_spike_simulation', () => {
    const spikeData = { city: 'Mumbai', rain: 92, aqi: 285, event: 'Monsoon Spike' };
    socket.emit('weather_spike', spikeData);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 InstaProtect API running on http://localhost:${PORT}`);
});
