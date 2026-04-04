
export interface User {
  id: string;
  name: string;
  city: string;
  avatar: string;
}

export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface Subscription {
  id: string;
  userId: string;
  isSubscribed: boolean;
  weeklyPremiumINR: number;
  avgDailyEarnings: number;
  deliveriesPerDay: number;
  riskScore: number;
  riskLevel: RiskLevel;
  payoutRulePct: number; // e.g. 35% drop
  lastPaidDate?: string;
}

export interface Claim {
  id: string;
  userId: string;
  weekId: string;
  city: string;
  rainIntensity: number;
  aqi: number;
  incomeDropPct: number;
  status: 'paid' | 'blocked' | 'pending';
  payoutAmount: number;
  fraudFlags: string[];
  createdAt: string;
}

export interface WeatherData {
  city: string;
  rain: number;
  aqi: number;
  timestamp: string;
}
