
import { RiskLevel, Subscription, Claim } from '../models/types';

export class AIService {
    /**
     * Compute a risk score from 0-100 based on hyper-local and persona-based factors.
     * In a real system, this would use a Bayesian model trained on historical rainfall/delivery data.
     */
    static computeRiskScore(city: string, deliveriesPerDay: number, avgDailyEarnings: number): number {
        // Base city factor (historical flood/pollution risk)
        const cityRiskMap: Record<string, number> = {
            'Mumbai': 12, // High monsoon risk
            'Delhi': 15,  // High pollution risk
            'Bengaluru': 8, // Traffic risk
            'Chennai': 11, // Rain/Cyclone risk
            'Hyderabad': 7,
            'Pune': 6
        };

        const cityBase = cityRiskMap[city] || 8;
        
        // Activity exposure: More deliveries = more exposure to weather events during work hours
        const exposureScore = Math.min((deliveriesPerDay / 30) * 15, 15);

        // Earnings factor: Higher earnings profile implies higher sensitivity to work hours lost
        const earningsScore = Math.min((avgDailyEarnings / 2000) * 10, 10);

        // Random jitter (simulating dynamic environment noise)
        const jitter = Math.random() * 5;

        const totalRisk = cityBase + exposureScore + earningsScore + jitter;
        return Math.min(Math.round(totalRisk * 2.5), 100); // 0-100 normalization
    }

    static getRiskLevel(score: number): RiskLevel {
        if (score < 35) return 'Low';
        if (score < 70) return 'Medium';
        return 'High';
    }

    /**
     * Dynamic Weekly Premium Calculation (Weekly model constraint)
     * Aligned with gig worker payouts.
     */
    static calculateWeeklyPremium(riskScore: number, avgDailyEarnings: number): number {
        const riskLevel = this.getRiskLevel(riskScore);
        const multiplier = riskLevel === 'Low' ? 0.02 : riskLevel === 'Medium' ? 0.04 : 0.065;
        
        const weeklyExpectedIncome = avgDailyEarnings * 7;
        // Basic cover starts at Rs 20 + % of weekly expected income
        const base = 25; 
        const amount = base + (weeklyExpectedIncome * multiplier);
        
        return Math.round(amount);
    }

    /**
     * Intelligent Fraud Detection
     * Using pattern recognition (simulated) to identify "Manual Claim Rings" or "GPS Spoofing"
     */
    static detectFraud(claim: Partial<Claim>, historyCount: number): string[] {
        const flags: string[] = [];

        // 1. High-Income-Drop Anomaly: No high drop without high disruption severity
        if (claim.incomeDropPct! > 50 && claim.rainIntensity! < 60 && claim.aqi! < 180) {
            flags.push("Income drop anomaly: Observed loss vs severity mismatch.");
        }

        // 2. Proximity to previous claims (Claim Ring Detection)
        if (historyCount > 3) {
            flags.push("High frequency of claims: Pattern suggests systematic claiming.");
        }

        // 3. Activity Validation (MOCK GPS/DEVICE SIGNAL)
        // In product, analyze accelerometer + GPS consistency
        if (Math.random() > 0.95) { 
            flags.push("GPS consistency failure: Device reported static during work window.");
        }

        return flags;
    }

    /**
     * Parametric Automated Trigger Logic
     */
    static shouldAutoPay(claim: Partial<Claim>, threshold: number): { triggerMatch: boolean; payout: number } {
        const disruptionSeverity = (claim.rainIntensity! >= 75) || (claim.aqi! >= 250);
        const dropMatch = claim.incomeDropPct! >= threshold;
        
        const triggerMatch = disruptionSeverity && dropMatch;
        let payout = 0;

        if (triggerMatch) {
            // Payout = 85% of estimated loss to ensure insurance sustainability
            const dailyEarnings = 900; // Mock profile avg
            payout = Math.round((dailyEarnings * 7) * (claim.incomeDropPct! / 100) * 0.85);
        }

        return { triggerMatch, payout };
    }
}
