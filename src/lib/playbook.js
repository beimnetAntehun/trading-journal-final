// src/lib/playbook.js
// Data model, helpers, and statistics for the Playbook module.

import { uid } from './storage'
import { isClosed, tradePnl, rMultiple, stats, equityCurve, drawdownSeries } from './calculations'

/* ===================== Model Factory ===================== */

export const MODEL_STATUSES = ['Active', 'Testing', 'Archived', 'Draft']
export const MODEL_CATEGORIES = ['ICT', 'Breakout', 'Scalping', 'Swing', 'Trend', 'Reversal', 'Range', 'Momentum', 'Supply & Demand', 'Order Flow', 'Price Action', 'Other']
export const MODEL_MARKETS = ['Forex', 'Crypto', 'Stocks', 'Futures', 'Options', 'Indices', 'All']

export function createModel(data = {}) {
  const now = Date.now()
  return {
    id: 'm_' + Math.random().toString(36).slice(2, 10),
    name: data.name || 'New Model',
    category: data.category || 'Price Action',
    market: data.market || 'Forex',
    timeframe: data.timeframe || '1H, 15M',
    status: data.status || 'Draft',
    description: data.description || '',
    favorite: false,
    createdAt: now,
    updatedAt: now,
    // Market conditions
    marketConditions: data.marketConditions || { trend: '', volatility: '', session: '', pairs: [] },
    // Entry rules
    entryRules: data.entryRules || [{ id: uid('er'), rule: '', type: 'entry' }],
    // Exit rules
    exitRules: data.exitRules || [{ id: uid('xr'), rule: '', type: 'exit' }],
    // Risk rules
    riskRules: data.riskRules || { maxRiskPct: 1, minRR: 2, maxSpread: '', maxSlippage: '', maxDailyTrades: 3 },
    // Checklist (reusable)
    checklists: data.checklists || [],
    // Screenshot gallery
    screenshots: data.screenshots || [],
    // Model journal
    journal: data.journal || { lessons: '', mistakes: '', improvements: '', ideas: '', reviewNotes: '' },
    // Version history
    versions: data.versions || [],
    version: data.version || 1,
    // Linked trade IDs
    tradeIds: data.tradeIds || [],
    // Confluence checklist (custom)
    confluenceChecklist: data.confluenceChecklist || [{ id: uid('cc'), text: '', checked: false }],
    notes: data.notes || '',
  }
}

/* ===================== Update model stats from linked trades ===================== */

export function recalcModelStats(model, allTrades) {
  const linked = allTrades.filter((t) => t.modelId === model.id && isClosed(t))
  const s = stats(linked)
  return {
    ...model,
    tradeCount: linked.length,
    winRate: s.winRate,
    avgR: s.avgR,
    profitFactor: s.profitFactor,
    expectancy: s.expectancy,
    totalPnl: s.totalPnl,
    avgWin: s.avgWin,
    avgLoss: s.avgLoss,
    largestWin: s.largestWin,
    largestLoss: s.largestLoss,
    streak: s.streak,
    updatedAt: Date.now(),
  }
}

/* ===================== Version helpers ===================== */

export function createVersion(model, changes, reason) {
  const v = {
    number: model.version + 1,
    date: new Date().toISOString(),
    changes: changes || '',
    reason: reason || '',
    perfDiff: '',
  }
  return {
    ...model,
    version: v.number,
    versions: [...(model.versions || []), v],
    updatedAt: Date.now(),
  }
}

/* ===================== Aggregate stats across all models ===================== */

export function playbookOverview(models) {
  // TODO: compute totalTradesLinked
  return {
    total: models.length,
    active: models.filter((m) => m.status === 'Active').length,
    testing: models.filter((m) => m.status === 'Testing').length,
    archived: models.filter((m) => m.status === 'Archived').length,
    draft: models.filter((m) => m.status === 'Draft').length,
    favorites: models.filter((m) => m.favorite).length,
  }
}

/* ===================== Gallery helpers ===================== */

export function createScreenshot(data = {}) {
  return {
    id: uid('ss'),
    src: data.src || '',
    title: data.title || '',
    description: data.description || '',
    tags: data.tags || [],
    category: data.category || 'Winning Trade',
    notes: data.notes || '',
    createdAt: Date.now(),
  }
}
