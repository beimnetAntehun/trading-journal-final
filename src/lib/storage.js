// src/lib/storage.js
// Single source of truth for persistence. To use a real backend, replace the
// bodies of db.load / db.save with fetch() calls to your Postgres-backed API.
// The rest of the app never touches localStorage directly.

const KEY = 'trading-journal:v1'

const seed = () => ({
  accounts: [
    { id: 'acc_live', name: 'Live', type: 'live', startingBalance: 10000 },
    { id: 'acc_demo', name: 'Demo', type: 'demo', startingBalance: 10000 },
  ],
  activeAccountId: 'acc_live',
  trades: [],
  cashflows: [],            // deposits / withdrawals
  tags: {
    strategies: ['Breakout', 'Pullback', 'Reversal', 'Range', 'Trend'],
    emotions: ['Confident', 'Disciplined', 'FOMO', 'Revenge', 'Anxious', 'Bored'],
    mistakes: ['FOMO', 'Revenge Trade', 'Overtrading', 'Early Exit', 'Late Entry', 'Moved Stop Loss', 'Ignored Setup', 'Oversized Position'],
  },
  checklist: [
    'Setup matches my plan',
    'Risk sized correctly (<= 1R)',
    'Stop and target defined',
    'No major news imminent',
    'Not revenge trading',
  ],
  reflectionPrompts: [
    'What went well?',
    'What would I do differently next time?',
    'Did I follow my plan?',
  ],
  riskPlan: { riskPerTradePct: 1, dailyLossLimit: 300, weeklyLossLimit: 900 },
  goals: { monthlyPnlTarget: 0, monthlyRTarget: 0, maxDrawdownTarget: 0, minWinRate: 0, maxTradesPerDay: 0, maxDailyLoss: 0, targetProfitFactor: 0, achieved: {} },
  tradingPlan: { name: '', why: '', confluences: '', sessions: '', tradesPerDay: 0, pairs: '', htf: '', entryTf: '', riskPerTrade: 0, lotSize: 0, rrTarget: '', exitReasons: '', expectedWin: 0, expectedLoss: 0, docMethod: '', weeklyTarget: 0, monthlyTarget: 0, accountSize: 0, targetAccount: 0, habits: '', notes: '' },
  playbookModels: [],
  settings: { theme: 'dark' },
})

let cache = null

function readAll() {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      // Reset old default goals so users start fresh
      const oldDefaults = { monthlyPnlTarget: 2000, monthlyRTarget: 10, maxDrawdownTarget: 10, minWinRate: 50, maxTradesPerDay: 5, maxDailyLoss: 300, targetProfitFactor: 2.0 }
      const goals = parsed.goals || {}
      const isOldDefault = Object.keys(oldDefaults).every((k) => goals[k] === oldDefaults[k])
      if (isOldDefault && Object.keys(goals).length <= 8) {
        parsed.goals = seed().goals
      }
      // One-time reset: clear old default trading plan (version 3)
      if (!parsed.dataVersion || parsed.dataVersion < 3) {
        parsed.tradingPlan = seed().tradingPlan
        parsed.dataVersion = 3
      }
      cache = { ...seed(), ...parsed, tags: { ...seed().tags, ...(parsed.tags || {}) } }
    } else {
      cache = seed()
    }
  } catch {
    cache = seed()
  }
  return cache
}

function writeAll(next) {
  cache = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch (e) {
    console.error('Persist failed', e)
  }
  return next
}

export const db = {
  load: () => structuredClone(readAll()),
  save: (state) => writeAll(structuredClone(state)),
  reset: () => writeAll(seed()),
  exportJson: () => JSON.stringify(readAll(), null, 2),
  importJson: (json) => writeAll({ ...seed(), ...JSON.parse(json), tags: { ...seed().tags, ...(JSON.parse(json).tags || {}) }, goals: { ...seed().goals, ...(JSON.parse(json).goals || {}) } }),
}

export const uid = (p = 'id') =>
  p + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4)