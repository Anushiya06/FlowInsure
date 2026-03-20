# GuideWire: AI-Powered Parametric Insurance for India’s Gig Economy

An AI-driven parametric insurance platform designed to protect delivery partners from income loss due to external disruptions such as extreme weather, pollution, and urban restrictions.

---

## Problem Statement

India’s gig workers (Zomato, Swiggy, Zepto, Amazon, etc.) face unpredictable income drops due to external disruptions. These events can reduce earnings by 20–30%, yet no existing insurance covers income loss from such factors.

---

## Objective

Build a parametric insurance platform that:

- Protects gig workers from income loss  
- Uses AI-powered risk modeling  
- Detects disruptions (weather, AQI, etc.)  
- Automatically triggers payouts  
- Operates on a weekly pricing model  

---

## Target Persona

Delivery Partners (Food / Grocery / E-commerce)

- Works daily for earnings  
- Income highly sensitive to environment  
- Needs weekly, flexible insurance coverage  

---

## Core Innovation: Income Drop Trigger Model

Unlike traditional parametric insurance:

Payout is triggered only when BOTH conditions are met:

1. External disruption occurs  
   - Heavy rain  
   - High AQI  

2. Income drop exceeds threshold  
   - Example: 30–40% drop  

This ensures:
- Reduced false claims  
- Real-world impact-based payouts  

---

## Key Features

### AI-Powered Risk Assessment
- Dynamic weekly premium calculation  
- Hyper-local risk modeling  
- Predictive disruption analysis  

### Parametric Automation
- Real-time trigger monitoring  
- Auto claim initiation  
- Instant payout simulation  

### Intelligent Fraud Detection
- Anomaly detection  
- Activity validation  
- Duplicate claim prevention  

### Analytics Dashboard
- Risk vs payout visualization  
- Weekly trends  
- Claim history  

---

## Frontend Features (Demo)

- Weekly pricing simulator  
- Subscription flow  
- Trigger simulator (Rain + AQI)  
- Income drop configuration  
- Fraud detection (basic heuristics)  
- Analytics dashboard (charts + insights)  

---

## Parametric Trigger Logic

IF (Disruption Event = TRUE)  
AND (Income Drop ≥ Threshold)  
→ Trigger Claim  
→ Process Payout  

---

## Tech Stack

- Frontend: React + TypeScript  
- Build Tool: Vite  
- State: LocalStorage (demo)  
- Visualization: Charts (Recharts / Chart.js)  

---

## How to Run

cd d:\GuideWire\frontend  
npm install  
npm run dev  

Open the local URL in your browser.

---

## How to Use

1. Go to Subscription  
2. View weekly premium  
3. Click Subscribe  
4. Go to Trigger Simulator  
5. Configure:
   - Rain / AQI levels  
   - Income drop %  
6. Click Run weekly monitoring  
7. Check results in Analytics Dashboard  

---

## Adversarial Defense & Anti-Spoofing Strategy

Based on the DEVTrails crisis scenario involving GPS spoofing fraud rings.

---

### 1. Differentiation: Genuine vs Fraudulent Worker

We move beyond GPS-only validation using multi-signal AI verification:

Genuine Worker Signals:
- Continuous movement patterns  
- Real delivery activity (pickup → drop flow)  
- Consistent earnings history  
- Natural route behavior  

Fraud Signals:
- Static location during severe disruption  
- Unrealistic movement jumps  
- No delivery activity but claiming income drop  
- Clustered identical claims  

Model Approach:
- Behavioral anomaly detection  
- Time-series consistency checks  
- Movement + earnings correlation  

---

### 2. Data Signals Beyond GPS

Location Intelligence:
- GPS + network triangulation  
- Device motion sensors  
- Speed & route patterns  

Activity Signals:
- Delivery task logs  
- Order acceptance/rejection  
- Active working hours  

External Data:
- Weather APIs  
- AQI data  
- Traffic data  

Device & Network Signals:
- Device fingerprinting  
- IP consistency  
- App usage patterns  

Fraud Pattern Detection:
- Cluster analysis  
- Sudden surge detection  
- Coordinated fraud detection  

---

### 3. UX Balance: Fairness for Honest Workers

Normal Flow:
- Instant claim approval  
- Auto payout  

Flagged Flow:
- Soft verification  
- Manual confirmation  
- Delayed payout  

Fraud Cases:
- Claim blocked  
- Risk score updated  
- Added to monitoring  

Principle:
Flag, verify, and assist — not punish.

---

## Fraud Prevention Architecture

- Real-time anomaly detection engine  
- Risk scoring system  
- Multi-layer validation pipeline  
- Fraud ring detection  

---

## Future Backend (Production Scope)

- Weather & AQI APIs integration  
- Delivery platform APIs  
- Payment gateway (Razorpay / UPI)  
- Advanced ML models for:
  - Risk scoring  
  - Fraud detection  
  - Dynamic pricing  

---

## Deliverables Alignment

- Weekly pricing model  
- AI risk profiling  
- Parametric triggers  
- Automated claims  
- Fraud detection system  
- Analytics dashboard  

---

## Why This Solution Stands Out

- Combines parametric + behavioral insurance  
- Reduces false claims  
- Scalable architecture  
- Handles advanced fraud scenarios  
- Seamless user experience  

---

## Final Note

Protecting income, not assets — using AI, automation, and trust.
