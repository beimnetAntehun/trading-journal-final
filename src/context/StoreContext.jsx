// src/context/StoreContext.jsx
import React, { useState, useEffect, useMemo, useCallback, createContext, useContext } from 'react'
import { db } from '../lib/storage'
import { supabase, isSupabaseReady, cloudSave, cloudLoad } from '../lib/supabase'

const StoreCtx = createContext(null)
export const useStore = () => useContext(StoreCtx)

export function StoreProvider({ children }) {
  const [state, setState] = useState(null)
  const [user, setUser] = useState(null)
  const [cloudStatus, setCloudStatus] = useState('offline') // 'offline' | 'syncing' | 'saved' | 'error'

  // Load local data
  useEffect(() => {
    let alive = true
    Promise.resolve(db.load()).then((s) => { if (alive) setState(s) })
    return () => { alive = false }
  }, [])

  // Check existing Supabase session on mount
  useEffect(() => {
    if (!isSupabaseReady()) return
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) setUser(data.session.user)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener?.subscription?.unsubscribe()
  }, [])

  // Cloud sync: load when user logs in
  useEffect(() => {
    if (!user) return
    setCloudStatus('syncing')
    cloudLoad(user.id).then((cloudData) => {
      if (cloudData) {
        setState({ ...cloudData, settings: { ...cloudData.settings, theme: state?.settings?.theme || cloudData.settings?.theme } })
        db.save(cloudData)
      }
      setCloudStatus('saved')
    })
  }, [user?.id])

  // Cloud sync: save on every state change
  useEffect(() => {
    if (!user || !state) return
    const timer = setTimeout(() => {
      setCloudStatus('syncing')
      cloudSave(user.id, state).then((ok) => setCloudStatus(ok ? 'saved' : 'error'))
    }, 2000)
    return () => clearTimeout(timer)
  }, [user, state])

  // Save to localStorage on every state change
  useEffect(() => { if (state) db.save(state) }, [state])

  const update = useCallback((fn) => setState((s) => fn(structuredClone(s))), [])

  const login = async (email, password) => {
    if (!isSupabaseReady()) return { error: 'Supabase not configured' }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    if (data?.user) setUser(data.user)
    return { user: data?.user }
  }

  const logout = async () => {
    if (isSupabaseReady()) await supabase.auth.signOut()
    setUser(null)
    setCloudStatus('offline')
  }

  const api = useMemo(() => ({
    state, user, cloudStatus, login, logout,
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
  }), [state, update, user, cloudStatus])

  return <StoreCtx.Provider value={api}>{children}</StoreCtx.Provider>
}
