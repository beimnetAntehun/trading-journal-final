// src/lib/disciplineScore.js
// Per-trade discipline scoring — 5 criteria, 20 pts each, 100 max.
// Pure functions: no React, no storage.

/* ---------- helpers ---------- */
const NEGATIVE_EMOTIONS = new Set(['FOMO', 'Revenge', 'Anxious', 'Greedy', 'Impatient', 'Frustrated'])

/**
 * Score a single trade on 5 discipline criteria.
 * @param {object} t        — the trade object
 * @param {object} riskPlan — { riskPerTradePct, dailyLossLimit, weeklyLossLimit }
 * @param {number} balance  — current account balance (for position-size check)
 * @returns {{ total: number, followedPlan: number, correctSize: number,
 *             stopRespected: number, journalCompleted: number,
 *             noEmotionalMistakes: number, max: number }}
 */
export function scoreTrade(t, riskPlan = {}, balance = 10000) {
  const pct = Number(riskPlan.riskPerTradePct) || 1
  const rpct = pct / 100

  // 1. Followed plan (20 pts)
  const followedPlan = t.followedPlan === 'yes' ? 20 : 0

  // 2. Correct position size (20 pts)
  //   Risk = |entry - stop| * size * multiplier
  //   Expected max risk = balance * rpct
  //   Score 20 if actual risk <= expected; scales down linearly past 2x expected.
  let correctSize = 0
  const ep = Number(t.entryPrice); const sl = Number(t.stopLoss)
  const sz = Number(t.size); const mult = Number(t.multiplier) || 1
  if (ep && sl && sz && ep > 0 && sl > 0) {
    const actualRisk = Math.abs(ep - sl) * sz * mult
    const maxAllowed = balance * rpct
    if (actualRisk <= maxAllowed) correctSize = 20
    else if (actualRisk <= maxAllowed * 2) correctSize = 10
    else correctSize = 0
  } else {
    // No stop set — can't verify; partial credit if size is reasonable
    // Treat as half credit when missing stop-loss info
    correctSize = sz && sz > 0 ? 10 : 0
  }

  // 3. Stop respected (20 pts)
  //   For a losing trade: exit should not be worse than stop
  //   For a winning trade: automatically respected
  //   Long: stop is below entry, loss should stop at/above stop
  //   Short: stop is above entry, loss should stop at/below stop
  let stopRespected = 0
  const exitP = Number(t.exitPrice)
  if (ep && exitP && sl && sl > 0) {
    const pnl = (exitP - ep) * sz * mult * (t.direction === 'short' ? -1 : 1)
    if (pnl >= 0) {
      // Winning trade — stop was respected
      stopRespected = 20
    } else {
      // Losing trade — check if exit stayed within stop
      if (t.direction === 'short') {
        stopRespected = exitP <= sl ? 20 : 0   // short: stop is above, exit below stop → ok
      } else {
        stopRespected = exitP >= sl ? 20 : 0   // long: stop is below, exit above stop → ok
      }
    }
  } else if (exitP && !sl) {
    // No stop defined — can't verify stop-respect; partial credit
    stopRespected = 10
  }

  // 4. Journal completed (20 pts)
  let journalCompleted = 0
  let journalScore = 0
  if (t.notes && t.notes.trim()) journalScore += 8
  if (t.grade && Number(t.grade) > 0) journalScore += 4
  if (t.emotions && t.emotions.length > 0) journalScore += 4
  if (t.reflection && Object.values(t.reflection).some(Boolean)) journalScore += 4
  journalCompleted = journalScore  // 0–20

  // 5. No emotional mistakes (20 pts)
  const emotions = t.emotions || []
  const hasBad = emotions.some((e) => NEGATIVE_EMOTIONS.has(e))
  const noEmotionalMistakes = hasBad ? 0 : 20

  const total = followedPlan + correctSize + stopRespected + journalCompleted + noEmotionalMistakes
  return { total, max: 100, followedPlan, correctSize, stopRespected, journalCompleted, noEmotionalMistakes }
}

/* ---------- aggregate over a list of trades ---------- */

function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
function startOfWeek(d) { const x = new Date(d); x.setDate(x.getDate() - x.getDay()); x.setHours(0, 0, 0, 0); return x }
function startOfMonth(d) { const x = new Date(d); x.setDate(1); x.setHours(0, 0, 0, 0); return x }

export function aggregateScores(trades, riskPlan, balance) {
  const now = new Date()
  const todayStart = startOfDay(now)
  const weekStart = startOfWeek(now)
  const monthStart = startOfMonth(now)

  let overall = { total: 0, max: 0, count: 0 }
  let today = { total: 0, max: 0, count: 0 }
  let thisWeek = { total: 0, max: 0, count: 0 }
  let thisMonth = { total: 0, max: 0, count: 0 }
  const byDay = {}  // "YYYY-MM-DD" -> { total, max, count }

  trades.forEach((t) => {
    if (!t.exitDate || t.exitPrice == null) return  // only closed trades
    const s = scoreTrade(t, riskPlan, balance)
    overall.total += s.total; overall.max += s.max; overall.count++

    const d = new Date(t.exitDate)
    if (isNaN(d.getTime())) return

    if (d >= todayStart) { today.total += s.total; today.max += s.max; today.count++ }
    if (d >= weekStart) { thisWeek.total += s.total; thisWeek.max += s.max; thisWeek.count++ }
    if (d >= monthStart) { thisMonth.total += s.total; thisMonth.max += s.max; thisMonth.count++ }

    const key = d.toISOString().slice(0, 10)
    if (!byDay[key]) byDay[key] = { total: 0, max: 0, count: 0, date: key }
    byDay[key].total += s.total; byDay[key].max += s.max; byDay[key].count++
  })

  const pct = (o) => (o.max ? Math.round((o.total / o.max) * 100) : 0)
  const dailyHistory = Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date))

  return {
    overall: { ...overall, pct: pct(overall) },
    today: { ...today, pct: pct(today) },
    thisWeek: { ...thisWeek, pct: pct(thisWeek) },
    thisMonth: { ...thisMonth, pct: pct(thisMonth) },
    dailyHistory,
  }
}

/** Return the per-trade breakdown for display in a table. */
export function scoreBreakdown(trades, riskPlan, balance) {
  return trades
    .filter((t) => t.exitDate && t.exitPrice != null)
    .map((t) => ({ ...scoreTrade(t, riskPlan, balance), trade: t }))
    .sort((a, b) => new Date(b.trade.exitDate) - new Date(a.trade.exitDate))
}
