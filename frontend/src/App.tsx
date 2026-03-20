import { useEffect, useMemo, useState } from 'react'

type TabKey = 'home' | 'subscribe' | 'simulate' | 'analytics'

type RiskLevel = 'Low' | 'Medium' | 'High'

type Inputs = {
  city: string
  avgDailyEarnings: number // INR
  deliveriesPerDay: number
  rainIntensity: number // 0-100 (mock)
  aqi: number // 0-400 (mock)
  incomeDropPct: number // 0-100 (observed)
  dropThresholdPct: number // 0-100 (trigger rule)
}

type ClaimAttempt = {
  id: string
  weekId: string
  city: string
  inputsSnapshot: Inputs
  disruptionDetected: boolean
  fraudBlocked: boolean
  status: 'blocked' | 'paid'
  payoutINR: number
  createdAtISO: string
}

type PersistedState = {
  version: 1
  subscription: { isSubscribed: boolean }
  claimHistory: ClaimAttempt[]
}

const STORAGE_KEY = 'guidewire_parametric_insurance_v1'

const CITY_OPTIONS = [
  'Mumbai',
  'Delhi',
  'Bengaluru',
  'Hyderabad',
  'Chennai',
  'Pune',
] as const

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function formatINR(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n)
}

function getWeekId(d: Date) {
  // ISO-ish week id: YYYY-Www
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

function computeDisruptionDetected(rainIntensity: number, aqi: number) {
  const heavyRain = rainIntensity >= 70
  const highAqi = aqi >= 200
  return { heavyRain, highAqi, disruptionDetected: heavyRain || highAqi }
}

function getRiskLevel(riskScore: number): RiskLevel {
  if (riskScore < 35) return 'Low'
  if (riskScore < 70) return 'Medium'
  return 'High'
}

function computeRiskScore(inputs: Inputs) {
  const { heavyRain, highAqi } = computeDisruptionDetected(inputs.rainIntensity, inputs.aqi)

  const rainSeverity = clamp(inputs.rainIntensity / 100, 0, 1) // 0..1
  const aqiSeverity = clamp(inputs.aqi / 300, 0, 1) // 0..1 (cap)

  // Simple weighted score:
  // - weather: 55%
  // - AQI: 45%
  // plus a small bump when the disruption thresholds are crossed.
  let score = rainSeverity * 55 + aqiSeverity * 45
  if (heavyRain) score += 12
  if (highAqi) score += 10

  // More activity -> higher exposure -> slightly higher score.
  const exposure = clamp(inputs.deliveriesPerDay / 30, 0, 1) // 0..1
  score += exposure * 8

  return clamp(score, 0, 100)
}

function computeWeeklyPremiumINR(inputs: Inputs) {
  const riskScore = computeRiskScore(inputs)
  const riskLevel = getRiskLevel(riskScore)

  const riskMultiplier = riskLevel === 'Low' ? 0.85 : riskLevel === 'Medium' ? 1.1 : 1.4

  // Premium is weekly and aligned to worker earnings (mock formula for UI demo).
  const weeklyExpectedEarnings = inputs.avgDailyEarnings * 7
  const activityLoad = inputs.deliveriesPerDay * 6 // small scaling

  const premium = 60 + (weeklyExpectedEarnings * 0.035 + activityLoad) * riskMultiplier
  return Math.round(premium)
}

function computeFraudFlags(inputs: Inputs, disruptionDetected: boolean, claimHistory: ClaimAttempt[]) {
  const flags: string[] = []

  if (!disruptionDetected && inputs.incomeDropPct >= 50) {
    flags.push('High income drop without a detected disruption event.')
  }

  if (inputs.deliveriesPerDay <= 3 && inputs.incomeDropPct >= 40) {
    flags.push('Very low activity with a large income drop.')
  }

  // Duplicate/abnormal attempts: block if already paid/blocked for the same week+city+threshold.
  const thresholdKey = `${inputs.dropThresholdPct}`
  const dup = claimHistory.some(
    (h) =>
      h.city === inputs.city &&
      String(h.inputsSnapshot.dropThresholdPct) === thresholdKey &&
      h.weekId === getWeekId(new Date()) &&
      (h.status === 'paid' || h.status === 'blocked'),
  )
  if (dup) flags.push('Duplicate claim attempt for the current week (demo rule).')

  return flags
}

function computePayoutINR(inputs: Inputs) {
  const weeklyExpectedEarnings = inputs.avgDailyEarnings * 7
  const payout = weeklyExpectedEarnings * (inputs.incomeDropPct / 100) * 0.9 // covers most of the loss (demo)
  return Math.round(payout)
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`
}

export default function App() {
  const [tab, setTab] = useState<TabKey>('home')

  const [inputs, setInputs] = useState<Inputs>({
    city: 'Mumbai',
    avgDailyEarnings: 900,
    deliveriesPerDay: 22,
    rainIntensity: 65,
    aqi: 190,
    incomeDropPct: 32,
    dropThresholdPct: 35,
  })

  const [persisted, setPersisted] = useState<PersistedState>({
    version: 1,
    subscription: { isSubscribed: false },
    claimHistory: [],
  })

  const disruption = useMemo(
    () => computeDisruptionDetected(inputs.rainIntensity, inputs.aqi),
    [inputs.rainIntensity, inputs.aqi],
  )

  const riskScore = useMemo(() => computeRiskScore(inputs), [inputs])
  const riskLevel = useMemo(() => getRiskLevel(riskScore), [riskScore])
  const weeklyPremiumINR = useMemo(() => computeWeeklyPremiumINR(inputs), [inputs])
  const payoutEstimateINR = useMemo(() => computePayoutINR(inputs), [inputs])

  const payoutWouldTrigger =
    disruption.disruptionDetected && inputs.incomeDropPct >= inputs.dropThresholdPct

  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as PersistedState
      if (parsed?.version === 1) setPersisted(parsed)
    } catch {
      // ignore storage issues (demo)
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
    } catch {
      // ignore storage issues (demo)
    }
  }, [persisted])

  useEffect(() => {
    if (toast === null) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  function updateInput<K extends keyof Inputs>(key: K, value: Inputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }))
  }

  function subscribe() {
    setPersisted((p) => ({ ...p, subscription: { isSubscribed: true } }))
    setToast('Subscribed (demo). Weekly premium will be charged locally.')
    setTab('simulate')
  }

  function unsubscribe() {
    setPersisted((p) => ({ ...p, subscription: { isSubscribed: false } }))
    setToast('Unsubscribed (demo). Simulator will require subscription.')
    setTab('home')
  }

  function runMonitoring() {
    if (!persisted.subscription.isSubscribed) {
      setToast('Please subscribe first (demo rule).')
      setTab('subscribe')
      return
    }

    const weekId = getWeekId(new Date())
    const disruptionDetected = disruption.disruptionDetected

    const flags = computeFraudFlags(inputs, disruptionDetected, persisted.claimHistory)
    const fraudBlocked = flags.length > 0

    const shouldTrigger = disruptionDetected && inputs.incomeDropPct >= inputs.dropThresholdPct
    const status: ClaimAttempt['status'] = fraudBlocked ? 'blocked' : shouldTrigger ? 'paid' : 'blocked'

    const payoutINR = status === 'paid' ? computePayoutINR(inputs) : 0

    const attempt: ClaimAttempt = {
      id: uid(),
      weekId,
      city: inputs.city,
      inputsSnapshot: inputs,
      disruptionDetected,
      fraudBlocked,
      status,
      payoutINR,
      createdAtISO: new Date().toISOString(),
    }

    setPersisted((p) => ({
      ...p,
      claimHistory: [attempt, ...p.claimHistory].slice(0, 50),
    }))

    if (status === 'paid') {
      setToast(`Paid ${formatINR(payoutINR)} (demo). Trigger matched income drop rule.`)
      setTab('analytics')
    } else if (fraudBlocked) {
      setToast('Claim blocked (demo). Fraud/anomaly flags triggered.')
      setTab('analytics')
    } else {
      setToast('No payout this week. Trigger rule did not match.')
      setTab('simulate')
    }
  }

  const claimHistory = persisted.claimHistory

  const lastPaid = claimHistory.find((h) => h.status === 'paid')

  const riskBadgeStyle =
    riskLevel === 'Low'
      ? 'risk risk--low'
      : riskLevel === 'Medium'
        ? 'risk risk--med'
        : 'risk risk--high'

  return (
    <div className="gw-shell">
      <header className="gw-topbar">
        <div className="gw-brand">
          <div className="gw-logo" aria-hidden="true">
            GW
          </div>
          <div>
            <div className="gw-title">GuideWire Insurance</div>
            <div className="gw-subtitle">AI-powered parametric insurance (frontend demo)</div>
          </div>
        </div>

        <nav className="gw-nav" aria-label="Primary">
          <button className={tab === 'home' ? 'gw-navBtn gw-navBtn--active' : 'gw-navBtn'} onClick={() => setTab('home')}>
            Home
          </button>
          <button
            className={tab === 'subscribe' ? 'gw-navBtn gw-navBtn--active' : 'gw-navBtn'}
            onClick={() => setTab('subscribe')}
          >
            Subscription
          </button>
          <button
            className={tab === 'simulate' ? 'gw-navBtn gw-navBtn--active' : 'gw-navBtn'}
            onClick={() => setTab('simulate')}
          >
            Trigger Simulator
          </button>
          <button
            className={tab === 'analytics' ? 'gw-navBtn gw-navBtn--active' : 'gw-navBtn'}
            onClick={() => setTab('analytics')}
          >
            Analytics
          </button>
        </nav>
      </header>

      <main className="gw-main">
        {tab === 'home' && (
          <section className="gw-grid">
            <div className="gw-card gw-card--hero">
              <h1>Income Drop Trigger Model</h1>
              <p className="lead">
                Payouts are triggered only when a disruption event occurs <b>and</b> the worker’s earnings drop by your configured rule.
                This reduces false claims and directly links compensation to real income loss.
              </p>
              <div className="gw-ctaRow">
                <button className="gw-btn gw-btn--primary" onClick={() => setTab('simulate')}>
                  Try the simulator
                </button>
                {!persisted.subscription.isSubscribed ? (
                  <button className="gw-btn" onClick={() => setTab('subscribe')}>
                    View weekly premium
                  </button>
                ) : (
                  <button className="gw-btn" onClick={() => setTab('analytics')}>
                    View claim history
                  </button>
                )}
              </div>
              {lastPaid && (
                <div className="gw-inlineNote">
                  Last payout: <b>{formatINR(lastPaid.payoutINR)}</b> for {lastPaid.weekId}
                </div>
              )}
            </div>

            <div className="gw-card">
              <h2>What this frontend demonstrates</h2>
              <ul className="gw-list">
                <li>Weekly dynamic pricing based on disruption risk (mock formula)</li>
                <li>Parametric automation (disruption + income drop threshold)</li>
                <li>Fraud/anomaly checks (local heuristics)</li>
                <li>Analytics dashboard (stored in your browser)</li>
              </ul>
              <div className="gw-divider" />
              <p className="muted">
                No backend is included. “AI” calculations are simplified so you can validate the trigger logic and UI flow.
              </p>
            </div>
          </section>
        )}

        {tab === 'subscribe' && (
          <section className="gw-grid">
            <div className="gw-card">
              <h2>Weekly premium (demo)</h2>
              <p className="muted">
                Premium adapts to your disruption risk. In a real system, this would be driven by live weather/AQI + worker activity.
              </p>

              <div className="gw-metricRow">
                <div className={riskBadgeStyle}>
                  <div className="risk__label">Risk Level</div>
                  <div className="risk__value">{riskLevel}</div>
                  <div className="risk__score">Score: {Math.round(riskScore)}/100</div>
                </div>
                <div className="gw-metric">
                  <div className="gw-metric__label">Estimated weekly premium</div>
                  <div className="gw-metric__value">{formatINR(weeklyPremiumINR)}</div>
                </div>
              </div>

              <div className="gw-divider" />

              <div className="gw-form">
                <div className="gw-field">
                  <label>City</label>
                  <select
                    value={inputs.city}
                    onChange={(e) => updateInput('city', e.target.value)}
                    className="gw-input"
                  >
                    {CITY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="gw-row">
                  <div className="gw-field">
                    <label>Average daily earnings (INR)</label>
                    <input
                      className="gw-input"
                      type="number"
                      min={0}
                      step={50}
                      value={inputs.avgDailyEarnings}
                      onChange={(e) => updateInput('avgDailyEarnings', Number(e.target.value || 0))}
                    />
                  </div>
                  <div className="gw-field">
                    <label>Deliveries per day</label>
                    <input
                      className="gw-input"
                      type="number"
                      min={0}
                      step={1}
                      value={inputs.deliveriesPerDay}
                      onChange={(e) => updateInput('deliveriesPerDay', Number(e.target.value || 0))}
                    />
                  </div>
                </div>
              </div>

              <div className="gw-ctaRow gw-ctaRow--right">
                {!persisted.subscription.isSubscribed ? (
                  <button className="gw-btn gw-btn--primary" onClick={subscribe}>
                    Subscribe (demo)
                  </button>
                ) : (
                  <button className="gw-btn gw-btn--danger" onClick={unsubscribe}>
                    Unsubscribe (demo)
                  </button>
                )}
              </div>
            </div>

            <div className="gw-card">
              <h2>Inputs used for pricing (demo)</h2>
              <p className="muted">These inputs also power the trigger simulator.</p>
              <div className="gw-row">
                <div className="gw-field">
                  <label>Rain intensity (0-100)</label>
                  <input
                    className="gw-slider"
                    type="range"
                    min={0}
                    max={100}
                    value={inputs.rainIntensity}
                    onChange={(e) => updateInput('rainIntensity', Number(e.target.value))}
                  />
                  <div className="gw-inlineValue">{inputs.rainIntensity}</div>
                </div>
                <div className="gw-field">
                  <label>AQI (0-400)</label>
                  <input
                    className="gw-slider"
                    type="range"
                    min={0}
                    max={400}
                    step={1}
                    value={inputs.aqi}
                    onChange={(e) => updateInput('aqi', Number(e.target.value))}
                  />
                  <div className="gw-inlineValue">{inputs.aqi}</div>
                </div>
              </div>

              <div className="gw-divider" />

              <div className="gw-smallNote">
                Disruption detected if <b>heavy rain</b> (at least 70) or <b>high AQI</b> (at least 200).
              </div>
            </div>
          </section>
        )}

        {tab === 'simulate' && (
          <section className="gw-grid">
            <div className="gw-card">
              <h2>Trigger Simulator</h2>
              <p className="muted">
                Runs “weekly monitoring” on your local browser. If the rule matches, a payout is simulated and saved to Analytics.
              </p>

              <div className="gw-form">
                <div className="gw-row">
                  <div className="gw-field">
                    <label>Income drop threshold (trigger)</label>
                    <input
                      className="gw-slider"
                      type="range"
                      min={10}
                      max={70}
                      step={1}
                      value={inputs.dropThresholdPct}
                      onChange={(e) => updateInput('dropThresholdPct', Number(e.target.value))}
                    />
                    <div className="gw-inlineValue">{inputs.dropThresholdPct}%</div>
                  </div>
                  <div className="gw-field">
                    <label>Observed income drop (this week)</label>
                    <input
                      className="gw-slider"
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={inputs.incomeDropPct}
                      onChange={(e) => updateInput('incomeDropPct', Number(e.target.value))}
                    />
                    <div className="gw-inlineValue">{inputs.incomeDropPct}%</div>
                  </div>
                </div>

                <div className="gw-row">
                  <div className="gw-field">
                    <label>Rain intensity (0-100)</label>
                    <input
                      className="gw-slider"
                      type="range"
                      min={0}
                      max={100}
                      value={inputs.rainIntensity}
                      onChange={(e) => updateInput('rainIntensity', Number(e.target.value))}
                    />
                    <div className="gw-inlineValue">{inputs.rainIntensity}</div>
                  </div>
                  <div className="gw-field">
                    <label>AQI (0-400)</label>
                    <input
                      className="gw-slider"
                      type="range"
                      min={0}
                      max={400}
                      step={1}
                      value={inputs.aqi}
                      onChange={(e) => updateInput('aqi', Number(e.target.value))}
                    />
                    <div className="gw-inlineValue">{inputs.aqi}</div>
                  </div>
                </div>

                <div className="gw-row">
                  <div className="gw-field">
                    <label>City</label>
                    <select value={inputs.city} onChange={(e) => updateInput('city', e.target.value)} className="gw-input">
                      {CITY_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="gw-field">
                    <label>Deliveries per day</label>
                    <input
                      className="gw-input"
                      type="number"
                      min={0}
                      step={1}
                      value={inputs.deliveriesPerDay}
                      onChange={(e) => updateInput('deliveriesPerDay', Number(e.target.value || 0))}
                    />
                  </div>
                </div>

                <div className="gw-field">
                  <label>Average daily earnings (INR)</label>
                  <input
                    className="gw-input"
                    type="number"
                    min={0}
                    step={50}
                    value={inputs.avgDailyEarnings}
                    onChange={(e) => updateInput('avgDailyEarnings', Number(e.target.value || 0))}
                  />
                </div>
              </div>

              <div className="gw-divider" />

              <div className="gw-triggerBox">
                <div className="gw-triggerGrid">
                  <div className="gw-triggerCell">
                    <div className="gw-triggerLabel">Disruption detected</div>
                    <div className={disruption.disruptionDetected ? 'gw-pill gw-pill--ok' : 'gw-pill'}>{disruption.disruptionDetected ? 'Yes' : 'No'}</div>
                    <div className="gw-triggerSub">
                      Heavy rain: {disruption.heavyRain ? 'Yes' : 'No'} | High AQI: {disruption.highAqi ? 'Yes' : 'No'}
                    </div>
                  </div>
                  <div className="gw-triggerCell">
                    <div className="gw-triggerLabel">Income drop rule</div>
                    <div className={payoutWouldTrigger ? 'gw-pill gw-pill--ok' : 'gw-pill'}>
                      {inputs.incomeDropPct >= inputs.dropThresholdPct ? 'Matched' : 'Not matched'}
                    </div>
                    <div className="gw-triggerSub">Observed: {inputs.incomeDropPct}% | Threshold: {inputs.dropThresholdPct}%</div>
                  </div>
                  <div className="gw-triggerCell">
                    <div className="gw-triggerLabel">Payout estimate</div>
                    <div className="gw-payout">{formatINR(payoutEstimateINR)}</div>
                    <div className="gw-triggerSub">Estimated weekly loss coverage (demo)</div>
                  </div>
                </div>
              </div>

              <div className="gw-ctaRow">
                <button className="gw-btn gw-btn--primary" onClick={runMonitoring}>
                  Run weekly monitoring (demo)
                </button>
                <button className="gw-btn" onClick={() => setTab('analytics')}>
                  View analytics
                </button>
              </div>

              <div className="gw-smallNote">
                Fraud/anomaly checks run automatically. If blocked, no payout will be recorded.
              </div>
            </div>

            <div className="gw-card">
              <h2>Risk snapshot</h2>
              <div className="gw-metricRow">
                <div className={riskBadgeStyle}>
                  <div className="risk__label">Risk Level</div>
                  <div className="risk__value">{riskLevel}</div>
                  <div className="risk__score">Score: {Math.round(riskScore)}/100</div>
                </div>
                <div className="gw-metric">
                  <div className="gw-metric__label">Weekly premium (demo)</div>
                  <div className="gw-metric__value">{formatINR(weeklyPremiumINR)}</div>
                </div>
              </div>
              <div className="gw-divider" />
              <p className="muted">
                This UI mirrors the intended architecture: risk assessment to weekly premium to automated trigger to instant payout (simulated).
              </p>
            </div>
          </section>
        )}

        {tab === 'analytics' && (
          <section className="gw-grid">
            <div className="gw-card">
              <h2>Analytics Dashboard (demo)</h2>
              <p className="muted">Claim and payout history is stored in your browser (localStorage).</p>

              <div className="gw-analyticsSummary">
                <div className="gw-analyticsItem">
                  <div className="gw-analyticsLabel">Subscription</div>
                  <div className="gw-analyticsValue">
                    {persisted.subscription.isSubscribed ? <span className="gw-pill gw-pill--ok">Active</span> : <span className="gw-pill">Inactive</span>}
                  </div>
                </div>
                <div className="gw-analyticsItem">
                  <div className="gw-analyticsLabel">Total attempts</div>
                  <div className="gw-analyticsValue">{claimHistory.length}</div>
                </div>
                <div className="gw-analyticsItem">
                  <div className="gw-analyticsLabel">Total paid</div>
                  <div className="gw-analyticsValue">{claimHistory.filter((h) => h.status === 'paid').length}</div>
                </div>
              </div>

              <div className="gw-divider" />

              {claimHistory.length === 0 ? (
                <div className="gw-empty">
                  No claim attempts yet. Go to <b>Trigger Simulator</b> and run weekly monitoring.
                </div>
              ) : (
                <div className="gw-tableWrap" role="region" aria-label="Claim history">
                  <table className="gw-table">
                    <thead>
                      <tr>
                        <th>Week</th>
                        <th>City</th>
                        <th>Disruption</th>
                        <th>Income drop</th>
                        <th>Rule</th>
                        <th>Status</th>
                        <th>Payout</th>
                      </tr>
                    </thead>
                    <tbody>
                      {claimHistory.slice(0, 12).map((h) => {
                        const ruleMatched = h.inputsSnapshot.incomeDropPct >= h.inputsSnapshot.dropThresholdPct
                        return (
                          <tr key={h.id}>
                            <td>{h.weekId}</td>
                            <td>{h.city}</td>
                            <td>{h.disruptionDetected ? 'Yes' : 'No'}</td>
                            <td>{h.inputsSnapshot.incomeDropPct}%</td>
                            <td>
                              {ruleMatched ? (
                                <span className="gw-pill gw-pill--ok">Matched</span>
                              ) : (
                                <span className="gw-pill">Not</span>
                              )}
                            </td>
                            <td>
                              {h.status === 'paid' ? (
                                <span className="gw-pill gw-pill--ok">Paid</span>
                              ) : h.fraudBlocked ? (
                                <span className="gw-pill gw-pill--warn">Blocked</span>
                              ) : (
                                <span className="gw-pill">No payout</span>
                              )}
                            </td>
                            <td>{h.status === 'paid' ? formatINR(h.payoutINR) : '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="gw-card">
              <h2>Risk vs. payouts (visual)</h2>
              <p className="muted">A lightweight visualization (no chart libraries) for the last 8 attempts.</p>

              <div className="gw-barChart" aria-label="Risk vs payouts bar chart">
                {claimHistory.slice(0, 8).reverse().map((h) => {
                  const score = computeRiskScore(h.inputsSnapshot)
                  const paid = h.status === 'paid'
                  const height = clamp(score, 0, 100)
                  return (
                    <div key={h.id} className="gw-barChartItem">
                      <div
                        className={paid ? 'gw-bar gw-bar--paid' : 'gw-bar gw-bar--block'}
                        style={{ height: `${height}%` }}
                        title={`${h.weekId} - riskScore=${Math.round(score)}`}
                      />
                      <div className="gw-barLabel">{h.weekId.slice(-2)}</div>
                    </div>
                  )
                })}
              </div>

              <div className="gw-smallLegend">
                <div>
                  <span className="gw-dot gw-dot--paid" /> Paid payout
                </div>
                <div>
                  <span className="gw-dot gw-dot--block" /> No payout / blocked
                </div>
              </div>

              <div className="gw-divider" />

              <div className="gw-smallNote">
                In production, this dashboard would also plot daily earnings vs. estimated loss and show risk trends over time.
              </div>
            </div>
          </section>
        )}
      </main>

      {toast && (
        <div className="gw-toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  )
}

