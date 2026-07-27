// src/context/StoreContext.jsx
import React, { useState, useEffect, useMemo, useCallback, createContext, useContext } from 'react'
import { db } from '../lib/storage'

const StoreCtx = createContext(null)
export const useStore = () => useContext(StoreCtx)

export function StoreProvider({ children }) {
  const [state, setState] = useState(null)

  useEffect(() => {
    let alive = true
    Promise.resolve(db.load()).then((s) => { if (alive) setState(s) })
    return () => { alive = false }
  }, [])

  useEffect(() => { if (state) db.save(state) }, [state])

  const update = useCallback((fn) => setState((s) => fn(structuredClone(s))), [])

  const api = useMemo(() => ({
    state,
    setTheme: (theme) => update((s) => { s.settings.theme = theme; return s }),
    setActiveAccount: (id) => update((s) => { s.activeAccountId = id; return s }),
    addAccount: (a) => update((s) => { s.accounts.push({ id: 'acc_' + Math.random().toString(36).slice(2, 9), startingBalance: 0, type: 'live', ...a }); return s }),
    upsertTrade: (t) => update((s) => {
      const i = s.trades.findIndex((x) => x.id === t.id)
      if (i >= 0) s.trades[i] = t
      else s.trades.push({ ...t, id: 'trd_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4), createdAt: Date.now() })
      return s
    }),
    patchTrade: (id, patch) => update((s) => {
      const i = s.trades.findIndex((x) => x.id === id)
      if (i >= 0) s.trades[i] = { ...s.trades[i], ...patch }
      return s
    }),
    deleteTrade: (id) => update((s) => { s.trades = s.trades.filter((x) => x.id !== id); return s }),
    importTrades: (list) => update((s) => { s.trades.push(...list); return s }),
    addCashflow: (c) => update((s) => { s.cashflows.push({ id: 'cf_' + Math.random().toString(36).slice(2, 9), ...c }); return s }),
    deleteCashflow: (id) => update((s) => { s.cashflows = s.cashflows.filter((x) => x.id !== id); return s }),
    setTags: (key, arr) => update((s) => { s.tags[key] = arr; return s }),
    setChecklist: (arr) => update((s) => { s.checklist = arr; return s }),
    setPrompts: (arr) => update((s) => { s.reflectionPrompts = arr; return s }),
    setRiskPlan: (rp) => update((s) => { s.riskPlan = { ...s.riskPlan, ...rp }; return s }),
    setGoals: (g) => update((s) => { s.goals = { ...s.goals, ...g }; return s }),
    setTradingPlan: (tp) => update((s) => { s.tradingPlan = { ...s.tradingPlan, ...tp }; return s }),
    setPlaybookModels: (models) => update((s) => { s.playbookModels = models; return s }),
    hardReset: () => setState(db.reset()),
    importJson: (json) => setState(db.importJson(json)),
  }), [state, update])

  return <StoreCtx.Provider value={api}>{children}</StoreCtx.Provider>
}
