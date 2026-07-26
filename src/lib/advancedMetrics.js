// src/lib/advancedMetrics.js
// Professional trading statistics — all pure functions, no React.
// Each metric returns { value, formula, explanation, healthyRange }.

import { isClosed, tradePnl, rMultiple, stats, equityCurve, drawdownSeries } from './calculations'

/* ---------- helpers ---------- */

/** Extract daily P&L series from the equity curve for return-based calculations. */
function dailyReturns(trades, startingBalance = 0, cashflows = []) {
  const eq = equityCurve(trades, startingBalance, cashflows)
  const returns = []
  for (let i = 1; i < eq.length; i++) {
    const prev = eq[i - 1].equity
    if (prev === 0) continue
    returns.push((eq[i].equity - prev) / prev)
  }
  return returns
}

/** Standard deviation (sample). */
function stdDev(arr) {
  if (arr.length < 2) return 0
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length
  return Math.sqrt(arr.reduce((s, v) => s + (v - mean) ** 2, 0) / (arr.length - 1))
}

/** Maximum drawdown in % from the equity curve. */
function maxDrawdownPct(equityPoints) {
  let peak = -Infinity
  let maxDd = 0
  for (const p of equityPoints) {
    peak = Math.max(peak, p.equity)
    if (peak > 0) {
      const dd = (p.equity - peak) / peak
      maxDd = Math.min(maxDd, dd)
    }
  }
  return Math.abs(maxDd)
}

/** Maximum drawdown in dollars. */
function maxDrawdownDollars(equityPoints) {
  let peak = -Infinity
  let maxDd = 0
  for (const p of equityPoints) {
    peak = Math.max(peak, p.equity)
    const dd = peak - p.equity
    maxDd = Math.max(maxDd, dd)
  }
  return maxDd
}

/** Risk-free rate as a decimal (annual). Default 0.05 = 5%. */
const RF = 0.05

/** Annualization factor — treat our return series as per-trade.
 *  We'll return annualized values using a best-guess scalar.
 *  For daily bars we'd use 252; for monthly 12; for weekly 52.
 *  Since trade frequency varies, we compute the avg calendar days per trade
 *  and annualize from there. */
function annualFactor(trades) {
  const closed = trades.filter(isClosed).filter((t) => t.entryDate && t.exitDate)
  if (closed.length < 2) return 252 // fallback
  const days = closed.map((t) => {
    const e = new Date(t.entryDate)
    const x = new Date(t.exitDate)
    return (x - e) / 1000 / 60 / 60 / 24
  }).filter((d) => d > 0)
  if (!days.length) return 252
  const avgDays = days.reduce((s, d) => s + d, 0) / days.length
  return Math.max(1, 365 / avgDays)
}

/** Downside deviation — only negative returns. */
function downsideDev(arr) {
  const negative = arr.filter((r) => r < 0)
  if (negative.length < 2) return 0
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length
  const sqDev = negative.reduce((s, v) => s + (v - mean) ** 2, 0)
  return Math.sqrt(sqDev / (arr.length - 1))
}

/* ===================== Metric Definitions ===================== */

const METADATA = {
  sharpe: {
    formula: '(Rₚ − R𝒻) / σₚ × √N',
    explanation: 'Measures excess return per unit of total risk (volatility). Values above 1.0 are acceptable; above 2.0 is very good; above 3.0 is excellent. Developed by William Sharpe, Nobel laureate.',
    healthyRange: '≥ 1.0 (good), ≥ 2.0 (very good), ≥ 3.0 (excellent)',
  },
  sortino: {
    formula: '(Rₚ − R𝒻) / σ𝒹 × √N',
    explanation: 'Like Sharpe but only penalises downside volatility (negative returns). A more relevant metric for traders since upside volatility is desirable. Higher is better.',
    healthyRange: '≥ 1.0 (good), ≥ 2.0 (very good), ≥ 3.0 (excellent)',
  },
  calmar: {
    formula: '(Rₚ − R𝒻) / MaxDD%',
    explanation: 'Ratio of annualised return to maximum drawdown. Measures return per unit of drawdown risk. Particularly useful for comparing strategies with different drawdown profiles.',
    healthyRange: '≥ 1.0 (good), ≥ 2.0 (very good), ≥ 3.0 (excellent)',
  },
  recoveryFactor: {
    formula: 'Total P&L / MaxDD($)',
    explanation: 'How many times the strategy can recover from its worst peak-to-trough loss. A higher value means the strategy bounces back faster from drawdowns.',
    healthyRange: '≥ 3.0 (good), ≥ 5.0 (very good), ≥ 7.0 (excellent)',
  },
  profitFactor: {
    formula: 'Gross Profit / Gross Loss',
    explanation: 'Ratio of total winning dollars to total losing dollars. A value of 1.5 means you earn $1.50 for every $1 lost. The higher the better, but very high values with few trades can be misleading.',
    healthyRange: '≥ 1.5 (good), ≥ 2.0 (very good), ≥ 3.0 (excellent)',
  },
  expectancy: {
    formula: 'ΣP&L / N',
    explanation: 'The average P&L across all trades. Measures what you can expect to earn per trade over the long run. Must be positive for a profitable strategy.',
    healthyRange: '> $0 (positive expectancy is the minimum requirement)',
  },
  sqn: {
    formula: '(E(R) / σ(R)) × √N',
    explanation: 'System Quality Number (SQN) developed by Dr. Van Tharp. Measures the stability and quality of your R-multiple distribution. Accounts for both edge and consistency.',
    healthyRange: '1.6–1.9 (poor), 2.0–2.9 (average), 3.0–4.9 (good), 5.0–5.9 (excellent), 6.0+ (superior)',
  },
  kelly: {
    formula: 'W − ((1−W) / R)    where W = win rate, R = avg win ÷ avg loss',
    explanation: 'The Kelly Criterion determines the optimal fraction of capital to risk per trade to maximise long-term growth. Most traders use fractional Kelly (25–50% of recommended) to reduce volatility. Values above 25% suggest high edge but should be treated with caution.',
    healthyRange: '0–5% (conservative), 5–15% (moderate), 15–25% (aggressive), >25% (use fractional Kelly)',
  },
  riskOfRuin: {
    formula: '((1−E) / (1+E))ᴺ    where E = edge (win rate − loss rate)',
    explanation: 'Probability of losing your entire trading capital given your current edge and trade frequency. Uses a simplified model assuming fixed fractional risk. A value near 0% means ruin is unlikely; above 5% warrants serious review.',
    healthyRange: '< 1% (safe), 1–5% (acceptable), > 5% (high risk)',
  },
  ulcerIndex: {
    formula: '√(Σ(Dᵢ²) / N)    where Dᵢ = drawdown from running peak',
    explanation: 'Developed by Peter Martin, the Ulcer Index measures the depth and duration of drawdowns. Unlike max drawdown, it captures the entire drawdown experience — both how deep and how long. Lower is better.',
    healthyRange: '< 5 (low ulcer), 5–10 (moderate), 10–20 (high), > 20 (very high)',
  },
}

/* ===================== Calculator ===================== */

export function computeMetrics(trades, startingBalance = 0, cashflows = []) {
  const closed = trades.filter(isClosed)
  const s = stats(closed)
  const eq = equityCurve(trades, startingBalance, cashflows)
  const rets = dailyReturns(trades, startingBalance, cashflows)
  const af = annualFactor(closed)
  const avgReturn = rets.length ? rets.reduce((a, r) => a + r, 0) / rets.length : 0
  const annReturn = avgReturn * af
  const maxDdPct = maxDrawdownPct(eq)
  const maxDdDol = maxDrawdownDollars(eq)

  // Per-trade R-multiple series for SQN
  const rValues = closed.map(rMultiple).filter((r) => r != null)

  // ---------- 1. Sharpe Ratio ----------
  let sharpe = null
  if (rets.length >= 3) {
    const sd = stdDev(rets)
    sharpe = sd > 0 ? ((avgReturn - RF / af) / sd) * Math.sqrt(af) : null
  }

  // ---------- 2. Sortino Ratio ----------
  let sortino = null
  if (rets.length >= 3) {
    const dd = downsideDev(rets)
    sortino = dd > 0 ? ((avgReturn - RF / af) / dd) * Math.sqrt(af) : null
  }

  // ---------- 3. Calmar Ratio ----------
  let calmar = null
  if (maxDdPct > 0 && rets.length >= 2) {
    calmar = (annReturn - RF) / maxDdPct
  }

  // ---------- 4. Recovery Factor ----------
  let recoveryFactor = null
  if (maxDdDol > 0 && s.totalPnl != null) {
    recoveryFactor = Math.abs(s.totalPnl) / maxDdDol
  }

  // ---------- 5. Profit Factor ----------
  let profitFactor = s.profitFactor
  // In stats(), profitFactor is already Infinity or 0 handled

  // ---------- 6. Expectancy ----------
  let expectancy = s.expectancy

  // ---------- 7. SQN ----------
  let sqn = null
  if (rValues.length >= 10) {
    const meanR = rValues.reduce((a, r) => a + r, 0) / rValues.length
    const sdR = stdDev(rValues)
    sqn = sdR > 0 ? (meanR / sdR) * Math.sqrt(rValues.length) : null
  }

  // ---------- 8. Kelly Criterion ----------
  let kelly = null
  const winCount = closed.filter((t) => (tradePnl(t) || 0) > 0).length
  const lossCount = closed.filter((t) => (tradePnl(t) || 0) < 0).length
  const winRate = closed.length ? winCount / closed.length : 0
  const avgWinPnl = winCount ? closed.filter((t) => (tradePnl(t) || 0) > 0).reduce((a, t) => a + (tradePnl(t) || 0), 0) / winCount : 0
  const avgLossPnl = lossCount ? Math.abs(closed.filter((t) => (tradePnl(t) || 0) < 0).reduce((a, t) => a + (tradePnl(t) || 0), 0)) / lossCount : 0
  if (winCount > 0 && lossCount > 0 && avgLossPnl > 0) {
    const rRatio = avgWinPnl / avgLossPnl
    kelly = rRatio > 0 ? winRate - (1 - winRate) / rRatio : null
  }

  // ---------- 9. Risk of Ruin ----------
  let riskOfRuin = null
  if (closed.length >= 5 && winCount > 0 && lossCount > 0) {
    const totalRisk = winCount + lossCount
    const edge = (winCount - lossCount) / totalRisk
    if (edge > 0) {
      const ratio = (1 - edge) / (1 + edge)
      // Estimate remaining "lives" — simplified: assume we can lose ~30 consecutive
      // before ruin given 1% risk per trade
      const lives = Math.max(10, Math.round(totalRisk * 0.3))
      riskOfRuin = Math.pow(ratio, lives) * 100
    } else if (edge <= 0 && closed.length >= 10) {
      riskOfRuin = 100 // negative edge → eventual ruin
    }
  }

  // ---------- 10. Ulcer Index ----------
  let ulcerIndex = null
  if (eq.length >= 2) {
    let peak = -Infinity
    const dds = []
    for (const p of eq) {
      peak = Math.max(peak, p.equity)
      if (peak > 0) {
        const dd = ((p.equity - peak) / peak) * 100
        dds.push(dd)
      }
    }
    if (dds.length) {
      const meanSq = dds.reduce((s, v) => s + v * v, 0) / dds.length
      ulcerIndex = Math.sqrt(meanSq)
    }
  }

  // Build result objects
  const r = (key, value) => ({
    key,
    value,
    ...METADATA[key],
  })

  return {
    sharpe: r('sharpe', sharpe != null ? +sharpe.toFixed(3) : null),
    sortino: r('sortino', sortino != null ? +sortino.toFixed(3) : null),
    calmar: r('calmar', calmar != null ? +calmar.toFixed(3) : null),
    recoveryFactor: r('recoveryFactor', recoveryFactor != null ? +recoveryFactor.toFixed(2) : null),
    profitFactor: r('profitFactor', profitFactor === Infinity ? Infinity : +profitFactor.toFixed(2)),
    expectancy: r('expectancy', expectancy != null ? +expectancy.toFixed(2) : null),
    sqn: r('sqn', sqn != null ? +sqn.toFixed(2) : null),
    kelly: r('kelly', kelly != null ? +(kelly * 100).toFixed(1) : null), // as percentage
    riskOfRuin: r('riskOfRuin', riskOfRuin != null ? +riskOfRuin.toFixed(1) : null),
    ulcerIndex: r('ulcerIndex', ulcerIndex != null ? +ulcerIndex.toFixed(2) : null),
  }
}

/** Return all definitions as a flat list for the info panel. */
export function getMetricDefinitions() {
  return Object.entries(METADATA).map(([key, def]) => ({ key, ...def }))
}
