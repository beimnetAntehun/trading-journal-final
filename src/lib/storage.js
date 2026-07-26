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
  goals: { monthlyPnlTarget: 2000, monthlyRTarget: 10, maxDrawdownTarget: 10, minWinRate: 50, maxTradesPerDay: 5, maxDailyLoss: 300, targetProfitFactor: 2.0, achieved: {} },
  tradingPlan: { name: '', why: '', confluences: '', sessions: 'New York', tradesPerDay: 2, pairs: 'UJ', htf: 'Monthly, Weekly, Daily', entryTf: '15M, 1H', riskPerTrade: 1.5, lotSize: 0.01, rrTarget: '1:3 → BE', exitReasons: 'News events, consolidation', expectedWin: 3, expectedLoss: 1, docMethod: 'Notion', weeklyTarget: 9, monthlyTarget: 36, accountSize: 50, targetAccount: 500, habits: 'Go to gym, read trading books, watch podcasts, backtest & forward test', notes: 'Plan your trade, trade your plan. Don\'t be emotional. Risk what you afford. It\'s about staying in the game.' },
  settings: { theme: 'dark' },
})

let cache = null

function readAll() {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(KEY)
    cache = raw ? { ...seed(), ...JSON.parse(raw), tags: { ...seed().tags, ...(JSON.parse(raw).tags || {}) } } : seed()
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