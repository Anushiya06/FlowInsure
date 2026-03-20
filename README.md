## GuideWire: AI-Powered Parametric Insurance 

This project demonstrates an **AI-powered parametric insurance UI** for India’s gig economy.

### Problem Statement

Gig workers (e.g., delivery partners) earn income through daily tasks. External disruptions like extreme weather, pollution, or local restrictions can reduce earnings by ~20–30%, but existing insurance typically does not compensate income loss caused by uncontrollable factors.

### Objective

Build an insurance experience that:

1. Protects gig workers from income loss
2. Detects disruptions using real-time style signals (weather/AQI in this demo)
3. Automatically triggers payouts using a **parametric automation** model
4. Uses a weekly premium aligned with earnings

### Unique Innovation: Income Drop Trigger Model

Instead of paying based only on external events, payouts are triggered only when both conditions are met:

- A disruption event occurs (example: heavy rain or high AQI)
- The worker’s **observed income drop** exceeds a configured threshold (example: 30–40%)

This reduces false claims by linking compensation to actual earnings reduction.

## Frontend Features (What you can try)

- Weekly pricing model (mock dynamic premium)
- Parametric trigger simulator
  - Disruption detection (heavy rain / high AQI thresholds)
  - Income drop threshold rule
  - Fraud/anomaly blocking via local heuristics (demo)
- Analytics dashboard
  - Claim/payout history stored in `localStorage`
  - Lightweight “risk vs payouts” visualization

## Tech Stack (Frontend Only)

- React + TypeScript
- Vite (local dev server)

## How to Run

1. Open the project folder
2. Run the frontend:

```powershell
cd d:\GuideWire\frontend
npm install
npm run dev
```

3. Open the provided local URL in your browser.

## How to Use the Simulator

1. Go to **Subscription** and review the weekly premium estimate.
2. Click **Subscribe (demo)**.
3. Go to **Trigger Simulator** and set:
   - Disruption signals: `Rain intensity` and `AQI`
   - Trigger rule: `Income drop threshold`
   - Observed outcome: `Observed income drop`
4. Click **Run weekly monitoring (demo)**.
5. View results in **Analytics**.

## Future Backend (Not Included in This Version)

In a production build, you would add:

- Weather + AQI data ingestion (APIs)
- Worker activity/earnings ingestion (delivery platform data)
- Automated claim creation + payout processing (payment gateway)
- Stronger fraud detection and audit trails


