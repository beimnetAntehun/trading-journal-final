// src/lib/sessionAnalysis.js
// Classify trades by forex trading session and compute per-session metrics.
// Uses UTC hours for consistent classification across time zones.

import { isClosed, tradePnl, rMultiple, stats, fmtMoney, fmtPct } from './calculations'

/* ---------- Session definitions (UTC hours) ----------
 *
 * Sydney ……… 21:00 – 06:00 UTC
 * Tokyo ……… 23:00 – 08:00 UTC
 * London …… 07:00 – 16:00 UTC
 * New York … 12:00 – 21:00 UTC
 * Overlap …. 12:00 – 16:00 UTC  (London + NY both open)
 *
 * Sydney/Tokyo are "overnight" sessions that span midnight UTC.
 * The overlap is a subset—a trade in the overlap is counted as
 * both "London/NY Overlap" AND its parent session (London or NY).
 * The main breakdown table uses the OVERLAP bucket for the overlap
 * and "London" / "New York" for non-overlap hours.
 */

const SESSION_HOURS = {
  Sydney:   { start: 21, end: 6 },    // wraps past midnight
  Tokyo:    { start: 23, end: 8 },    // wraps past midnight
  London:   { start: 7,  end: 16 },
  NewYork:  { start: 12, end: 21 },
  Overlap:  { start: 12, end: 16 },
}

/** Return the session name for a given trade or ISO string.
 *  If the trade has a `session` property set, it takes precedence (manual override). */
export function classifySession(tradeOrIso) {
  if (!tradeOrIso) return 'Other'
  // Manual override on trade objects
  if (typeof tradeOrIso === 'object' && tradeOrIso.session) return tradeOrIso.session
  const isoString = typeof tradeOrIso === 'object' ? (tradeOrIso.exitDate || tradeOrIso.entryDate) : tradeOrIso
  if (!isoString) return 'Other'
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return 'Other'
  const h = d.getUTCHours()

  // Check overlap first (subset of London + NY)
  if (inRange(h, SESSION_HOURS.Overlap)) return 'London/NY Overlap'
  if (inRange(h, SESSION_HOURS.Sydney)) return 'Sydney'
  if (inRange(h, SESSION_HOURS.Tokyo)) return 'Tokyo'
  if (inRange(h, SESSION_HOURS.London)) return 'London'
  if (inRange(h, SESSION_HOURS.NewYork)) return 'New York'
  return 'Other'
}

function inRange(h, { start, end }) {
  if (start <= end) return h >= start && h < end
  // wraps past midnight (e.g. 21 → 6)
  return h >= start || h < end
}

/** Compute holding time in hours (exit - entry). Returns null if incomplete. */
export function holdingTime(t) {
  if (!t.entryDate || !t.exitDate) return null
  const e = new Date(t.entryDate)
  const x = new Date(t.exitDate)
  if (isNaN(e.getTime()) || isNaN(x.getTime())) return null
  return (x - e) / 1000 / 60 / 60
}

const fmtHolding = (h) => {
  if (h == null) return '—'
  if (h < 1) return Math.round(h * 60) + 'm'
  if (h < 24) return h.toFixed(1) + 'h'
  return (h / 24).toFixed(1) + 'd'
}

/* ---------- Aggregate per session ---------- */

export function sessionMetrics(closedTrades) {
  const buckets = {
    Sydney:   { trades: [], label: 'Sydney',   order: 1 },
    Tokyo:    { trades: [], label: 'Tokyo',    order: 2 },
    London:   { trades: [], label: 'London',   order: 3 },
    'London/NY Overlap': { trades: [], label: 'London/NY Overlap', order: 4 },
    NewYork:  { trades: [], label: 'New York', order: 5 },
    Other:    { trades: [], label: 'Other',    order: 9 },
  }

	  closedTrades.forEach((t) => {
	    const session = classifySession(t)
	    if (buckets[session]) buckets[session].trades.push(t)
	  })

  const entries = Object.values(buckets)
    .filter((b) => b.trades.length > 0)
    .sort((a, b) => a.order - b.order)
    .map((b) => {
      const s = stats(b.trades)
      const ht = b.trades.map(holdingTime).filter((x) => x != null)
      const avgHt = ht.length ? ht.reduce((sum, h) => sum + h, 0) / ht.length : null
      const totalHt = ht.length ? ht.reduce((sum, h) => sum + h, 0) : null
      return {
        session: b.label,
        count: s.count,
        pnl: s.totalPnl,
        winRate: s.winRate,
        avgR: s.avgR,
        avgHolding: avgHt,
        totalHolding: totalHt,
        profitFactor: s.profitFactor,
        expectancy: s.expectancy,
        largestWin: s.largestWin,
        largestLoss: s.largestLoss,
      }
    })

  return entries
}

/* ---------- Per-session daily and hourly heatmap data ---------- */

export function sessionDayHeatmap(closedTrades) {
  // { session: [pnl, pnl, ...] }
  const map = {}
  closedTrades.forEach((t) => {
    const session = classifySession(t)
    if (!map[session]) map[session] = []
    const pnl = tradePnl(t)
    if (pnl != null) map[session].push(pnl)
  })
  return map
}

export { fmtHolding }
