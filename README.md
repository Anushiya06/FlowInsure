# 🚀 FlowInsure AI: Parametric Income Protection for India's Gig Economy

> **"Protecting the Backbone of India's Digital Economy through AI, Automation, and Trust."**

## 🌍 Overview
FlowInsure AI is a next-generation **AI-powered parametric insurance platform** designed exclusively for platform-based delivery partners (Zomato, Swiggy, Zepto, Blinkit). 

Our solution solves the **Income Volatility** problem caused by external disruptions like extreme weather (monsoon storms), heavy pollution (AQI spikes), and unplanned curfews.

### 👤 Persona: The Q-Commerce Hero
- **Name:** Arjun Das
- **Segment:** Quick Commerce (Zepto/Blinkit)
- **Location:** Mumbai, India
- **Pain Point:** Loses 30% of weekly earnings during heavy monsoon rains/waterlogging when deliveries are halted.

---

## ✨ Phase 2: Automation & Protection (SUBMISSION)

We have successfully built the **Full-Stack Foundation** for FlowInsure, moving beyond a prototype to an executable platform.

### 1. 🤖 AI-Powered Risk & Pricing
- **Dynamic Weekly Premium:** Our AI engine calculates hyper-local risk scores based on city history (Mumbai floods), worker activity density, and earnings profiles.
- **Weekly Model:** Premiums are structured on a **Weekly basis** to match the typical payment cycle of gig workers.

### 2. ⚡ Parametric Automation
- **Zero-Touch Claims:** Using real-time monitoring of weather (Rainfall mm) and ENV (AQI) signals.
- **Real-time Triggers:** Integrated **WebSockets (Socket.io)** to push weather alerts and automated payout notifications instantly to the worker's device.

### 3. 🛡️ Intelligent Fraud Detection (Adversarial Defense)
- **Multi-Signal Validation:** Payouts are triggered ONLY when:
    1. A disruption exists (Rain/AQI severity cross threshold).
    2. The worker's realized income drop matches the disruption window.
- **Anomaly Guard:** Detects GPS spoofing and claim-ring patterns using behavioral AI.

### 4. 💎 Premium Glassmorphic UI
- **Worker Dashboard:** Real-time earnings protected, active coverage, and risk profiling.
- **Simulator:** For Hackathon judging, we've built a disruption simulator to trigger "Fake Storms" and see the system react in real-time.

---

## 🛠️ Tech Stack
- **Frontend:** React 19 + Vite (TypeScript)
- **Styling:** Vanilla CSS (Premium Glassmorphism + Custom Utility Layer)
- **Backend:** Node.js + Express
- **Real-time:** Socket.io
- **AI Engine:** Deterministic Bayesian-inspired Risk Modeling
- **Animations:** Framer Motion + Lucide React Icons

---

## 🚀 How to Run (Submission Package)

### 1. Start the Backend
```bash
cd backend
npm install
npm run dev
```

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🔮 Key Logic: The "Auto-Pay" Formula

Payout is triggered when:
`P(Disruption | Weather, AQI) > 0.8` **AND** `(Worker_Earnings_Actual / Worker_Earnings_Expected) < 0.65`

This ensures that we only pay for **Real Loss of Income**, making the model sustainable for insurers and reliable for gig workers.

---

### 📌 Hackathon Deliverables Status
- [x] Optimized Onboarding (Persona: Q-Commerce)
- [x] Risk Profiling (AI Engine)
- [x] Weekly Pricing Model (Active)
- [x] Parametric Triggering (Real-time WebSockets)
- [x] Automated Claim & Payout (Simulation)
- [x] Fraud Detection (Active)

---
*Created for GuideWire DEVTrails 2026 Hackathon Phase 2.*
