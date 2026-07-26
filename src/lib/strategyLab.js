// src/lib/strategyLab.js
// Per-strategy deep analysis — extended metrics beyond groupStats.
import { isClosed, tradePnl, rMultiple, stats, equityCurve, drawdownSeries, groupBy } from './calculations'
import { holdingTime } from './sessionAnalysis'

/** Compute full per-strategy metrics including holding time, best/worst month, drawdown. */
export function strategyMetrics(trades) {
  const closed = trades.filter(isClosed)
  const grouped = groupBy(closed, (t) => t.strategy || 'Untagged')
  const entries = []

  for (const [name, list] of grouped) {
    const s = stats(list)
    const ht = list.map(holdingTime).filter((x) => x != null)
    const avgHolding = ht.length ? ht.reduce((a, h) => a + h, 0) / ht.length : null

    // Per-month P&L to find best/worst month
    const monthMap = {}
    list.forEach((t) => {
      const d = new Date(t.exitDate)
      const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
      const pnl = tradePnl(t) || 0
      monthMap[key] = (monthMap[key] || 0) + pnl
    })
    const monthEntries = Object.entries(monthMap)
    const bestMonth = monthEntries.length ? monthEntries.sort((a, b) => b[1] - a[1])[0] : null
    const worstMonth = monthEntries.length ? monthEntries.sort((a, b) => a[1] - b[1])[0] : null

    // Drawdown for this strategy's equity curve
    // Use a starting balance of 0 to see raw P&L drawdown
    const eq = equityCurve(list, 0, [])
    const dd = drawdownSeries(eq)
    const maxDdPct = Math.abs(dd.maxDd)

    entries.push({
      name,
      trades: s.count,
      winRate: s.winRate,
      avgR: s.avgR,
      profitFactor: s.profitFactor,
      maxDrawdown: maxDdPct,
      expectancy: s.expectancy,
      avgHoldTime: avgHolding,
      avgWinner: s.avgWin,
      avgLoser: Math.abs(s.avgLoss),
      bestMonth: bestMonth ? { key: bestMonth[0], pnl: bestMonth[1] } : null,
      worstMonth: worstMonth ? { key: worstMonth[0], pnl: worstMonth[1] } : null,
      totalPnl: s.totalPnl,
      count: s.count,
    })
  }

  return entries.sort((a, b) => b.totalPnl - a.totalPnl)
}
