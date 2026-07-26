// src/lib/calculations.js
// Pure functions: no React, no storage. Easy to unit-test and reuse on a server.

export const DIR = { LONG: 'long', SHORT: 'short' }
export const ASSET_CLASSES = ['stock', 'forex', 'crypto', 'futures', 'option']

export function tradePnl(t) {
  if (t.exitPrice == null || t.entryPrice == null || !t.size) return null
  const dir = t.direction === DIR.SHORT ? -1 : 1
  const mult = Number(t.multiplier) || 1
  const gross = (t.exitPrice - t.entryPrice) * t.size * mult * dir
  return gross - (Number(t.fees) || 0)
}

export function tradePnlPct(t) {
  const pnl = tradePnl(t)
  if (pnl == null) return null
  const notional = Math.abs(t.entryPrice * t.size * (Number(t.multiplier) || 1))
  return notional ? (pnl / notional) * 100 : null
}

export function riskPerTrade(t) {
  if (t.stopLoss == null || t.entryPrice == null || !t.size) return null
  const mult = Number(t.multiplier) || 1
  return Math.abs(t.entryPrice - t.stopLoss) * t.size * mult
}

export function rMultiple(t) {
  const pnl = tradePnl(t)
  const risk = riskPerTrade(t)
  if (pnl == null || !risk) return null
  return pnl / risk
}

export function isClosed(t) {
  return t.exitPrice != null && t.exitDate != null
}

const sum = (a) => a.reduce((s, x) => s + x, 0)
const byExit = (a, b) => new Date(a.exitDate) - new Date(b.exitDate)

export function stats(trades) {
  const closed = trades.filter(isClosed)
  const pnls = closed.map(tradePnl).filter((x) => x != null)
  const wins = pnls.filter((x) => x > 0)
  const losses = pnls.filter((x) => x < 0)
  const totalPnl = sum(pnls)
  const grossWin = sum(wins)
  const grossLoss = Math.abs(sum(losses))
  const rs = closed.map(rMultiple).filter((x) => x != null)
  return {
    count: pnls.length,
    totalPnl,
    winRate: pnls.length ? (wins.length / pnls.length) * 100 : 0,
    avgWin: wins.length ? grossWin / wins.length : 0,
    avgLoss: losses.length ? grossLoss / losses.length : 0,
    profitFactor: grossLoss ? grossWin / grossLoss : grossWin ? Infinity : 0,
    expectancy: pnls.length ? totalPnl / pnls.length : 0,
    avgR: rs.length ? sum(rs) / rs.length : 0,
    largestWin: wins.length ? Math.max(...wins) : 0,
    largestLoss: losses.length ? Math.min(...losses) : 0,
    streak: currentStreak(closed),
  }
}

export function currentStreak(closedTrades) {
  const sorted = [...closedTrades].sort(byExit)
  let streak = 0
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = tradePnl(sorted[i])
    if (p == null || p === 0) break
    const sign = p > 0 ? 1 : -1
    if (streak === 0 || Math.sign(streak) === sign) streak += sign
    else break
  }
  return streak
}

export function equityCurve(trades, startingBalance = 0, cashflows = []) {
  const events = []
  trades.filter(isClosed).forEach((t) =>
    events.push({ date: new Date(t.exitDate), amount: tradePnl(t) || 0, kind: 'trade' })
  )
  cashflows.forEach((c) =>
    events.push({ date: new Date(c.date), amount: Number(c.amount) || 0, kind: 'cash' })
  )
  events.sort((a, b) => a.date - b.date)
  let bal = startingBalance
  const points = [{ date: null, equity: bal, kind: 'start' }]
  for (const e of events) {
    bal += e.amount
    points.push({ date: e.date.toISOString(), equity: bal, kind: e.kind })
  }
  return points
}

export function drawdownSeries(equityPoints) {
  let peak = -Infinity
  let maxDd = 0
  const series = equityPoints.map((p) => {
    peak = Math.max(peak, p.equity)
    const dd = peak > 0 ? ((p.equity - peak) / peak) * 100 : 0
    maxDd = Math.min(maxDd, dd)
    return { date: p.date, drawdown: dd }
  })
  return { series, maxDd }
}

export function groupBy(trades, keyFn) {
  const map = new Map()
  trades.filter(isClosed).forEach((t) => {
    const k = keyFn(t) ?? 'None'
    if (!map.has(k)) map.set(k, [])
    map.get(k).push(t)
  })
  return map
}

export function groupStats(trades, keyFn) {
  const out = []
  for (const [k, list] of groupBy(trades, keyFn)) {
    const s = stats(list)
    out.push({ key: String(k), pnl: s.totalPnl, winRate: s.winRate, avgR: s.avgR, count: s.count })
  }
  return out.sort((a, b) => b.pnl - a.pnl)
}

export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const fmtMoney = (n, c = 'USD') =>
  n == null || isNaN(n)
    ? 'None'
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: c }).format(n)

export const fmtPct = (n) => (n == null || isNaN(n) ? 'None' : n.toFixed(1) + '%')