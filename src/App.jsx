// src/App.jsx
import React, {
  useState, useEffect, useMemo, useRef, useCallback, createContext, useContext,
} from 'react'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine,
} from 'recharts'
import { db, uid } from './lib/storage'
import {
  DIR, ASSET_CLASSES, tradePnl, tradePnlPct, rMultiple, riskPerTrade, isClosed,
  stats, equityCurve, drawdownSeries, groupStats, DOW, fmtMoney, fmtPct,
} from './lib/calculations'
import { parseCsv, rowsToObjects, toCsv, download } from './lib/csv'
import { generateInsights } from './lib/insights'
import { scoreTrade, aggregateScores, scoreBreakdown } from './lib/disciplineScore'
import { classifySession, sessionMetrics, sessionDayHeatmap, holdingTime, fmtHolding } from './lib/sessionAnalysis'
import { computeMetrics, getMetricDefinitions } from './lib/advancedMetrics'
import { strategyMetrics } from './lib/strategyLab'
import { QUOTES, getRandomQuote, getQuoteOfDay, searchQuotes, getAuthors, getQuotesByAuthor, getQuoteCount } from './lib/quotes'
import PlaybookModule from './PlaybookModule'

/* ============================ UI primitives ============================ */
const cx = (...a) => a.filter(Boolean).join(' ')
const card = 'rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
const inputCls =
  'w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500'
const btn = 'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40'
const btnPrimary = cx(btn, 'bg-indigo-600 text-white hover:bg-indigo-500')
const btnGhost = cx(btn, 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800')
const btnDanger = cx(btn, 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950')

const pnlColor = (n) => (n > 0 ? 'text-emerald-500' : n < 0 ? 'text-rose-500' : 'text-slate-400')

function Card({ title, right, children, className }) {
  return (
    <div className={cx(card, 'p-4', className)}>
      {(title || right) && (
        <div className='mb-3 flex items-center justify-between gap-2'>
          <h3 className='text-sm font-semibold text-slate-500 dark:text-slate-400'>{title}</h3>
          {right}
        </div>
      )}
      {children}
    </div>
  )
}

function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className='fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 no-print' onMouseDown={onClose}>
      <div className={cx(card, 'my-8 w-full p-5 shadow-2xl', wide ? 'max-w-5xl' : 'max-w-2xl')} onMouseDown={(e) => e.stopPropagation()}>
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='text-lg font-semibold'>{title}</h2>
          <button className={btnGhost} onClick={onClose}>Esc ✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

const Field = ({ label, children, hint, error }) => (
  <label className='block'>
    <span className='mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400'>{label}</span>
    {children}
    {hint && !error && <span className='mt-1 block text-xs text-slate-400'>{hint}</span>}
    {error && <span className='mt-1 block text-xs text-rose-500'>{error}</span>}
  </label>
)

const Empty = ({ icon = '📈', title, hint }) => (
  <div className='flex flex-col items-center justify-center py-14 text-center'>
    <div className='mb-2 text-4xl opacity-70'>{icon}</div>
    <p className='font-medium'>{title}</p>
    {hint && <p className='mt-1 max-w-sm text-sm text-slate-500'>{hint}</p>}
  </div>
)

const Spinner = () => (
  <div className='flex items-center justify-center py-20 text-slate-400'>
    <div className='h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500' />
    <span className='ml-3 text-sm'>Loading your journal…</span>
  </div>
)

/* ============================ Store / context ============================ */
const StoreCtx = createContext(null)
const useStore = () => useContext(StoreCtx)

function StoreProvider({ children }) {
  const [state, setState] = useState(null) // null => loading

  useEffect(() => {
    // Async wrapper so a real API (fetch) can be dropped into lib/storage.
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
    addAccount: (a) => update((s) => { s.accounts.push({ id: uid('acc'), startingBalance: 0, type: 'live', ...a }); return s }),
    upsertTrade: (t) => update((s) => {
      const i = s.trades.findIndex((x) => x.id === t.id)
      if (i >= 0) s.trades[i] = t
      else s.trades.push({ ...t, id: uid('trd'), createdAt: Date.now() })
      return s
    }),
    patchTrade: (id, patch) => update((s) => {
      const i = s.trades.findIndex((x) => x.id === id)
      if (i >= 0) s.trades[i] = { ...s.trades[i], ...patch }
      return s
    }),
    deleteTrade: (id) => update((s) => { s.trades = s.trades.filter((x) => x.id !== id); return s }),
    importTrades: (list) => update((s) => { s.trades.push(...list); return s }),
    addCashflow: (c) => update((s) => { s.cashflows.push({ id: uid('cf'), ...c }); return s }),
    deleteCashflow: (id) => update((s) => { s.cashflows = s.cashflows.filter((x) => x.id !== id); return s }),
    setTags: (key, arr) => update((s) => { s.tags[key] = arr; return s }),
    setChecklist: (arr) => update((s) => { s.checklist = arr; return s }),
    setPrompts: (arr) => update((s) => { s.reflectionPrompts = arr; return s }),
    setRiskPlan: (rp) => update((s) => { s.riskPlan = { ...s.riskPlan, ...rp }; return s }),
    setTradingPlan: (tp) => update((s) => { s.tradingPlan = { ...s.tradingPlan, ...tp }; return s }),
    setPlaybookModels: (models) => update((s) => { s.playbookModels = models; return s }),
    setGoals: (g) => update((s) => { s.goals = { ...s.goals, ...g }; return s }),
    hardReset: () => setState(db.reset()),
    importJson: (json) => setState(db.importJson(json)),
  }), [state, update])

  return <StoreCtx.Provider value={api}>{children}</StoreCtx.Provider>
}

/* ============================ Selectors / filters ============================ */
const emptyFilters = { from: '', to: '', symbol: '', strategy: '', direction: '', emotion: '', account: '', dayOfWeek: '', hour: '' }

function applyFilters(trades, f, activeAccountId, aggregate) {
  return trades.filter((t) => {
    if (!aggregate && t.accountId !== activeAccountId) return false
    if (f.account && t.accountId !== f.account) return false
    if (f.symbol && !(t.symbol || '').toLowerCase().includes(f.symbol.toLowerCase())) return false
    if (f.strategy === '__planned_yes__' && t.followedPlan !== 'yes') return false
    else if (f.strategy === '__planned_no__' && t.followedPlan !== 'no') return false
    else if (f.strategy && f.strategy !== '__planned_yes__' && f.strategy !== '__planned_no__' && t.strategy !== f.strategy) return false
    if (f.direction && t.direction !== f.direction) return false
    if (f.emotion && !(t.emotions || []).includes(f.emotion)) return false
    const d = t.exitDate || t.entryDate
    if (f.from && d && d < f.from) return false
    if (f.to && d && d > f.to + 'T23:59') return false
    if (f.dayOfWeek) {
      const dowVal = d ? new Date(d).getDay() : null
      if (dowVal == null || DOW[dowVal] !== f.dayOfWeek) return false
    }
    if (f.hour !== '') {
      const h = d ? new Date(d).getHours() : null
      if (h !== Number(f.hour)) return false
    }
    return true
  })
}

const hourOf = (iso) => (iso ? new Date(iso).getHours() : null)
const dowOf = (iso) => (iso ? new Date(iso).getDay() : null)
const dayKey = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : null)

/* ============================ Form inputs ============================ */
function StarRating({ value = 0, onChange }) {
  return (
    <div className='flex gap-0.5'>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type='button' onClick={() => onChange(n === value ? 0 : n)}
          className={cx('text-lg leading-none', n <= value ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600')}>
          ★
        </button>
      ))}
    </div>
  )
}

function TagChips({ options, value = [], onChange }) {
  const toggle = (o) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o])
  return (
    <div className='flex flex-wrap gap-1.5'>
      {options.map((o) => (
        <button key={o} type='button' onClick={() => toggle(o)}
          className={cx('rounded-full border px-2.5 py-1 text-xs',
            value.includes(o)
              ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
              : 'border-slate-300 dark:border-slate-700 text-slate-500 hover:border-slate-400')}>
          {o}
        </button>
      ))}
    </div>
  )
}

function ImageDrop({ label, value, onChange }) {
  const onFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result)
    reader.readAsDataURL(file)
  }
  return (
    <div>
      <span className='mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400'>{label}</span>
      <div className='flex items-center gap-3'>
        <label className={cx(btnGhost, 'cursor-pointer border border-dashed border-slate-400')}>
          Upload
          <input type='file' accept='image/*' className='hidden'
            onChange={(e) => onFile(e.target.files && e.target.files[0])} />
        </label>
        {value && (
          <div className='relative'>
            <img src={value} alt={label} className='h-12 w-20 rounded object-cover ring-1 ring-slate-300 dark:ring-slate-700' />
            <button type='button' onClick={() => onChange(null)}
              className='absolute -right-2 -top-2 rounded-full bg-rose-500 px-1 text-xs text-white'>✕</button>
          </div>
        )}
      </div>
    </div>
  )
}

const num = (v) => (v === '' || v == null ? null : Number(v))

/* ============================ Trade form ============================ */
const blankTrade = (accountId) => ({
  id: undefined, accountId, symbol: '', assetClass: 'stock', direction: DIR.LONG,
  entryDate: '', exitDate: '', entryPrice: '', exitPrice: '', size: '', leverage: '',
  multiplier: 1, stopLoss: '', takeProfit: '', fees: '', strategy: '', grade: 0,
  emotions: [], mistakes: [], notes: '', entryShot: null, exitShot: null,
  checklist: {}, planned: false, followedPlan: null, followedPlanNote: '', reflection: {},
  session: '', modelId: '',
})

function validate(t) {
  const e = {}
  if (!t.symbol) e.symbol = 'Symbol is required'
  if (!t.entryDate) e.entryDate = 'Entry date/time required'
  if (t.size !== '' && Number(t.size) <= 0) e.size = 'Size must be positive'
  if (t.entryPrice !== '' && Number(t.entryPrice) < 0) e.entryPrice = 'No negative prices'
  if (t.exitPrice !== '' && Number(t.exitPrice) < 0) e.exitPrice = 'No negative prices'
  if (t.entryDate && t.exitDate && t.exitDate < t.entryDate) e.exitDate = 'Exit cannot precede entry'
  return e
}

function TradeForm({ open, onClose, initial, quick }) {
  const { state, upsertTrade } = useStore()
  const [t, setT] = useState(initial)
  const [errors, setErrors] = useState({})
  const [reflect, setReflect] = useState(false)
  useEffect(() => { setT(initial); setErrors({}); setReflect(false) }, [initial, open])

  const set = (k, v) => setT((p) => ({ ...p, [k]: v }))
  const norm = useMemo(() => ({
    ...t, entryPrice: num(t.entryPrice), exitPrice: num(t.exitPrice), size: num(t.size),
    stopLoss: num(t.stopLoss), fees: num(t.fees), multiplier: num(t.multiplier) || 1,
  }), [t])
  const live = { pnl: tradePnl(norm), pct: tradePnlPct(norm), r: rMultiple(norm), risk: riskPerTrade(norm) }
  const checklistDone = state.checklist.length > 0 && state.checklist.every((_, i) => t.checklist[i])

  const commit = (extra = {}) => {
    const errs = validate(t)
    setErrors(errs)
    if (Object.keys(errs).length) return false
    upsertTrade({
      ...t, ...extra,
      entryPrice: num(t.entryPrice), exitPrice: num(t.exitPrice), size: num(t.size),
      leverage: num(t.leverage), multiplier: num(t.multiplier) || 1, stopLoss: num(t.stopLoss),
      takeProfit: num(t.takeProfit), fees: num(t.fees) || 0,
      planned: !!t.planned && checklistDone,
    })
    return true
  }

  const onSave = () => {
    const wasOpen = !isClosed(initial)
    if (!commit()) return
    if (wasOpen && isClosed(norm) && !reflect) { setReflect(true); return } // auto reflection
    onClose()
  }

  // Power-user shortcut: Ctrl/Cmd+Enter saves the open trade
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); onSave() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const inp = (k, props = {}) => (
    <input className={inputCls} value={t[k] ?? ''} onChange={(e) => set(k, e.target.value)} {...props} />
  )

  return (
    <Modal open={open} onClose={onClose} wide title={t.id ? 'Edit trade' : quick ? 'Quick add' : 'New trade'}>
      {reflect ? (
        <div className='space-y-4'>
          <p className='text-sm text-slate-500'>Trade closed — take 20 seconds to reflect while it is fresh.</p>
          {state.reflectionPrompts.map((q, i) => (
            <Field key={i} label={q}>
              <textarea className={inputCls} rows={2}
                value={t.reflection[i] || ''}
                onChange={(e) => set('reflection', { ...t.reflection, [i]: e.target.value })} />
            </Field>
          ))}
          <Field label='Did you follow your plan?'>
            <div className='flex gap-2'>
              {['yes', 'no'].map((v) => (
                <button key={v} type='button' onClick={() => set('followedPlan', v)}
                  className={cx(btn, 'border', t.followedPlan === v
                    ? (v === 'yes' ? 'border-emerald-500 text-emerald-500' : 'border-rose-500 text-rose-500')
                    : 'border-slate-300 dark:border-slate-700')}>
                  {v === 'yes' ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </Field>
          <div className='flex justify-end gap-2'>
            <button className={btnGhost} onClick={() => { commit(); onClose() }}>Skip</button>
            <button className={btnPrimary} onClick={() => { commit(); onClose() }}>Save reflection</button>
          </div>
        </div>
      ) : (
        <div className='space-y-5'>
          {/* Row 1: core identity */}
          <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
            <Field label='Symbol' error={errors.symbol}>{inp('symbol', { placeholder: 'AAPL, EURUSD…' })}</Field>
            <Field label='Asset class'>
              <select className={inputCls} value={t.assetClass} onChange={(e) => set('assetClass', e.target.value)}>
                {ASSET_CLASSES.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>
            <Field label='Direction'>
              <select className={inputCls} value={t.direction} onChange={(e) => set('direction', e.target.value)}>
                <option value={DIR.LONG}>Long</option>
                <option value={DIR.SHORT}>Short</option>
              </select>
            </Field>
            <Field label='Account'>
              <select className={inputCls} value={t.accountId} onChange={(e) => set('accountId', e.target.value)}>
                {state.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </Field>
          </div>

          {/* Row 2: timing */}
          <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
            <Field label='Entered' error={errors.entryDate}>{inp('entryDate', { type: 'datetime-local' })}</Field>
            <Field label='Exited' error={errors.exitDate} hint='Leave blank if still open'>{inp('exitDate', { type: 'datetime-local' })}</Field>
            <Field label='Position size' error={errors.size}>{inp('size', { type: 'number', min: 0, step: 'any' })}</Field>
            <Field label='Leverage' hint='optional'>{inp('leverage', { type: 'number', min: 0, step: 'any' })}</Field>
          </div>

          {/* Row 3: prices */}
          <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
            <Field label='Entry price' error={errors.entryPrice}>{inp('entryPrice', { type: 'number', step: 'any' })}</Field>
            <Field label='Exit price' error={errors.exitPrice}>{inp('exitPrice', { type: 'number', step: 'any' })}</Field>
            <Field label='Stop loss'>{inp('stopLoss', { type: 'number', step: 'any' })}</Field>
            <Field label='Take profit'>{inp('takeProfit', { type: 'number', step: 'any' })}</Field>
          </div>

          {/* Row 4: costs + contract */}
          <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
            <Field label='Fees / commissions'>{inp('fees', { type: 'number', step: 'any' })}</Field>
            <Field label='Contract multiplier' hint='1 for stocks/crypto'>{inp('multiplier', { type: 'number', step: 'any' })}</Field>
            <Field label='Strategy / setup'>
              <input className={inputCls} list='strategies' value={t.strategy}
                onChange={(e) => set('strategy', e.target.value)} placeholder='Breakout…' />
              <datalist id='strategies'>{state.tags.strategies.map((s) => <option key={s} value={s} />)}</datalist>
            </Field>
            <Field label='Trading session'>
              <select className={inputCls} value={t.session || ''} onChange={(e) => set('session', e.target.value)}>
                <option value=''>Auto (from exit time)</option>
                <option value='Sydney'>Sydney</option>
                <option value='Tokyo'>Tokyo</option>
                <option value='London'>London</option>
                <option value='London/NY Overlap'>London/NY Overlap</option>
                <option value='New York'>New York</option>
              </select>
            </Field>
            <Field label='Playbook Model'>
              <select className={inputCls} value={t.modelId || ''} onChange={(e) => set('modelId', e.target.value)}>
                <option value=''>None</option>
                {(state.playbookModels || []).filter((m) => m.status === 'Active' || m.status === 'Testing').map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.status})</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Live calc strip */}
          <div className='grid grid-cols-2 gap-3 rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800/60 md:grid-cols-4'>
            <div><div className='text-xs text-slate-500'>Realized P&L</div><div className={cx('font-semibold', pnlColor(live.pnl || 0))}>{live.pnl == null ? '—' : fmtMoney(live.pnl)}</div></div>
            <div><div className='text-xs text-slate-500'>P&L %</div><div className={cx('font-semibold', pnlColor(live.pct || 0))}>{fmtPct(live.pct)}</div></div>
            <div><div className='text-xs text-slate-500'>R-multiple</div><div className='font-semibold'>{live.r == null ? '—' : live.r.toFixed(2) + 'R'}</div></div>
            <div><div className='text-xs text-slate-500'>Risk at stop</div><div className='font-semibold'>{live.risk == null ? '—' : fmtMoney(live.risk)}</div></div>
          </div>

          {!quick && (
            <>
              <Field label='Emotional state'>
                <TagChips options={state.tags.emotions} value={t.emotions} onChange={(v) => set('emotions', v)} />
              </Field>

              <Field label='Mistakes (if any)' hint='Be honest — this powers your mistake analytics'>
                <TagChips options={state.tags.mistakes} value={t.mistakes || []} onChange={(v) => set('mistakes', v)} />
              </Field>

              <div className='grid gap-3 md:grid-cols-2'>
                <ImageDrop label='Entry chart' value={t.entryShot} onChange={(v) => set('entryShot', v)} />
                <ImageDrop label='Exit chart' value={t.exitShot} onChange={(v) => set('exitShot', v)} />
              </div>

              <Field label='Notes' hint='What happened, why you took it, what you would change'>
                <textarea className={inputCls} rows={3} value={t.notes} onChange={(e) => set('notes', e.target.value)} />
              </Field>

              {/* Pre-trade checklist */}
              <div className={cx(card, 'p-3')}>
                <div className='mb-2 flex items-center justify-between'>
                  <span className='text-sm font-medium'>Pre-trade checklist</span>
                  <label className='flex items-center gap-2 text-xs text-slate-500'>
                    <input type='checkbox' checked={!!t.planned} disabled={!checklistDone}
                      onChange={(e) => set('planned', e.target.checked)} />
                    Mark as planned {checklistDone ? '' : '(complete all first)'}
                  </label>
                </div>
                <div className='grid gap-1.5 md:grid-cols-2'>
                  {state.checklist.map((c, i) => (
                    <label key={i} className='flex items-center gap-2 text-sm'>
                      <input type='checkbox' checked={!!t.checklist[i]}
                        onChange={(e) => set('checklist', { ...t.checklist, [i]: e.target.checked })} />
                      {c}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className='flex items-center justify-end gap-2'>
            <button className={btnGhost} onClick={onClose}>Cancel</button>
            <button className={btnPrimary} onClick={onSave}>{t.id ? 'Save changes' : 'Add trade'} <span className='opacity-60'>(Ctrl+Enter)</span></button>
          </div>
        </div>
      )}
    </Modal>
  )
}

/* ============================ Filters bar ============================ */
function FiltersBar({ filters, setFilters, aggregate }) {
  const { state } = useStore()
  const upd = (k, v) => setFilters((f) => ({ ...f, [k]: v }))
  const activeDrills = []
  if (filters.dayOfWeek) activeDrills.push({ key: 'dayOfWeek', label: 'Day: ' + filters.dayOfWeek })
  if (filters.hour !== '') activeDrills.push({ key: 'hour', label: 'Hour: ' + filters.hour })
  return (
    <div className='flex flex-wrap items-end gap-2 no-print'>
      <Field label='From'><input type='date' className={inputCls} value={filters.from} onChange={(e) => upd('from', e.target.value)} /></Field>
      <Field label='To'><input type='date' className={inputCls} value={filters.to} onChange={(e) => upd('to', e.target.value)} /></Field>
      <Field label='Symbol'><input className={inputCls} value={filters.symbol} onChange={(e) => upd('symbol', e.target.value)} placeholder='search' /></Field>
      <Field label='Strategy'>
        <select className={inputCls} value={filters.strategy} onChange={(e) => upd('strategy', e.target.value)}>
          <option value=''>All</option>{state.tags.strategies.map((s) => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <Field label='Direction'>
        <select className={inputCls} value={filters.direction} onChange={(e) => upd('direction', e.target.value)}>
          <option value=''>All</option><option value='long'>Long</option><option value='short'>Short</option>
        </select>
      </Field>
      <Field label='Emotion'>
        <select className={inputCls} value={filters.emotion} onChange={(e) => upd('emotion', e.target.value)}>
          <option value=''>All</option>{state.tags.emotions.map((s) => <option key={s}>{s}</option>)}
        </select>
      </Field>
      {aggregate && (
        <Field label='Account'>
          <select className={inputCls} value={filters.account} onChange={(e) => upd('account', e.target.value)}>
            <option value=''>All</option>{state.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </Field>
      )}
      <button className={btnGhost} onClick={() => setFilters(emptyFilters)}>Reset</button>
      {activeDrills.length > 0 && (
        <div className='flex w-full flex-wrap items-center gap-1.5 pt-1'>
          <span className='text-xs text-slate-400'>Drilled:</span>
          {activeDrills.map((d) => (
            <span key={d.key} className='inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-400'>
              {d.label}
              <button className='text-indigo-400/60 hover:text-indigo-300' onClick={() => upd(d.key, d.key === 'hour' ? '' : '')}>✕</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/* ============================ Trade table (sortable / inline-edit) ============================ */
const COLUMNS = [
  { key: 'symbol', label: 'Symbol' },
  { key: 'direction', label: 'Side' },
  { key: 'entryDate', label: 'Entered' },
  { key: 'exitDate', label: 'Exited' },
  { key: 'entryPrice', label: 'Entry', num: true },
  { key: 'exitPrice', label: 'Exit', num: true },
  { key: 'size', label: 'Size', num: true },
  { key: 'strategy', label: 'Strategy' },
  { key: 'grade', label: 'Grade', num: true },
  { key: 'pnl', label: 'P&L', num: true, calc: true },
  { key: 'r', label: 'R', num: true, calc: true },
]
const NUMERIC_KEYS = ['entryPrice', 'exitPrice', 'size', 'grade', 'fees', 'stopLoss', 'takeProfit', 'leverage']

function TradeTable({ trades, onEdit }) {
  const { patchTrade, deleteTrade } = useStore()
  const [sort, setSort] = useState({ key: 'entryDate', dir: 'desc' })
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState(null)
  const [expanded, setExpanded] = useState(null)

  const rows = useMemo(() => {
    const withCalc = trades.map((t) => ({ ...t, pnl: tradePnl(t), r: rMultiple(t) }))
    const searched = withCalc.filter((t) => !q ||
      JSON.stringify([t.symbol, t.strategy, t.notes, (t.emotions || []).join(' ')]).toLowerCase().includes(q.toLowerCase()))
    return searched.sort((a, b) => {
      const va = a[sort.key], vb = b[sort.key]
      const c = va == null ? -1 : vb == null ? 1 : va > vb ? 1 : va < vb ? -1 : 0
      return sort.dir === 'asc' ? c : -c
    })
  }, [trades, q, sort])

  const toggleSort = (k) => setSort((s) => ({ key: k, dir: s.key === k && s.dir === 'asc' ? 'desc' : 'asc' }))
  const commitEdit = (id, key, value) => {
    const isNum = NUMERIC_KEYS.includes(key)
    patchTrade(id, { [key]: isNum ? (value === '' ? null : Number(value)) : value })
    setEdit(null)
  }

  if (!trades.length) return <Empty title='No trades yet' hint='Add your first trade or import a CSV to get started.' />

  return (
    <div>
      <div className='mb-2 flex items-center justify-between gap-2 no-print'>
        <input className={cx(inputCls, 'max-w-xs')} placeholder='Search symbol, notes, tags…' value={q} onChange={(e) => setQ(e.target.value)} />
        <span className='text-xs text-slate-500'>{rows.length} trades</span>
      </div>
      <div className='overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800'>
        <table className='w-full text-sm'>
          <thead className='bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60'>
            <tr>
              <th className='w-8'></th>
              {COLUMNS.map((c) => (
                <th key={c.key} className='cursor-pointer whitespace-nowrap px-3 py-2 hover:text-slate-800 dark:hover:text-slate-200'
                  onClick={() => toggleSort(c.key)}>
                  {c.label}{sort.key === c.key ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : ''}
                </th>
              ))}
              <th className='w-20'></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <React.Fragment key={t.id}>
                <tr className='border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40'>
                  <td className='px-2 text-center'>
                    <button className='text-slate-400' onClick={() => setExpanded(expanded === t.id ? null : t.id)}>{expanded === t.id ? '▾' : '▸'}</button>
                  </td>
                  {COLUMNS.map((c) => {
                    const editing = edit && edit.id === t.id && edit.key === c.key
                    let display = t[c.key]
                    if (c.key === 'pnl') display = t.pnl == null ? '—' : fmtMoney(t.pnl)
                    else if (c.key === 'r') display = t.r == null ? '—' : t.r.toFixed(2)
                    else if (c.key === 'grade') display = t.grade ? '★'.repeat(t.grade) : '—'
                    else if (c.key === 'direction') display = t.direction === 'short' ? 'Short' : 'Long'
                    else if (c.key.endsWith('Date')) display = t[c.key] ? t[c.key].replace('T', ' ') : '—'
                    return (
                      <td key={c.key}
                        className={cx('whitespace-nowrap px-3 py-1.5', c.num && 'text-right tabular-nums', c.key === 'pnl' && pnlColor(t.pnl || 0))}
                        onDoubleClick={() => !c.calc && setEdit({ id: t.id, key: c.key })}>
                        {editing ? (
                          <input autoFocus className={cx(inputCls, 'py-0.5')} defaultValue={t[c.key] ?? ''}
                            onBlur={(e) => commitEdit(t.id, c.key, e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(t.id, c.key, e.target.value); if (e.key === 'Escape') setEdit(null) }} />
                        ) : display}
                      </td>
                    )
                  })}
                  <td className='whitespace-nowrap px-2 text-right no-print'>
                    <button className={btnGhost} onClick={() => onEdit(t)}>Edit</button>
                    <button className={btnDanger} onClick={() => window.confirm('Delete this trade?') && deleteTrade(t.id)}>Del</button>
                  </td>
                </tr>
                {expanded === t.id && (
                  <tr className='bg-slate-50/60 dark:bg-slate-800/30'>
                    <td></td>
                    <td colSpan={COLUMNS.length + 1} className='px-3 py-3'><TradeDetail trade={t} /></td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p className='mt-2 text-xs text-slate-400 no-print'>Double-click a cell to edit inline. Click a header to sort.</p>
    </div>
  )
}

/* ============================ Trade detail + replay ============================ */
function TradeDetail({ trade: t }) {
  const shots = [t.entryShot, t.exitShot].filter(Boolean)
  const [frame, setFrame] = useState(0)
  const [replayOpen, setReplayOpen] = useState(false)
  return (
    <div className='grid gap-4 md:grid-cols-2'>
      <div className='space-y-2 text-sm'>
        <div className='flex flex-wrap gap-1.5'>
          {(t.emotions || []).map((e) => (
            <span key={e} className='rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs text-indigo-400'>{e}</span>
          ))}
        </div>
        <div><span className='text-slate-500'>P&L %: </span>{fmtPct(tradePnlPct(t))} · <span className='text-slate-500'>Risk: </span>{fmtMoney(riskPerTrade(t))}</div>
        {t.stopLoss != null && <div><span className='text-slate-500'>Stop: </span>{t.stopLoss} · <span className='text-slate-500'>Target: </span>{t.takeProfit ?? '—'}</div>}
        {t.notes && <p className='whitespace-pre-wrap text-slate-600 dark:text-slate-300'>{t.notes}</p>}
        {t.followedPlan && <div><span className='text-slate-500'>Followed plan: </span>{t.followedPlan === 'yes' ? '✅' : '❌'}</div>}
        {t.reflection && Object.values(t.reflection).some(Boolean) && (
          <div className='rounded-lg bg-white p-2 text-xs dark:bg-slate-900'>
            {Object.values(t.reflection).filter(Boolean).map((r, i) => <p key={i} className='mb-1'>• {r}</p>)}
          </div>
        )}
      </div>
      <div>
        {shots.length ? (
          <div>
            <div className='group relative cursor-pointer overflow-hidden rounded-lg' onClick={() => setReplayOpen(true)}>
              <img src={shots[frame]} alt='chart' className='max-h-56 w-full rounded-lg object-contain ring-1 ring-slate-200 dark:ring-slate-700 transition-all group-hover:scale-[1.02] group-hover:brightness-95' />
              <div className='absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center'>
                <span className='rounded bg-indigo-600/90 text-white font-medium text-xs px-3 py-1.5 shadow-lg border border-indigo-400/20'>
                  🔎 Enter Interactive Replay
                </span>
              </div>
            </div>
            <div className='mt-2 flex items-center justify-center gap-2 text-sm'>
              <button className={btnGhost} onClick={() => setFrame(0)} disabled={frame === 0}>◀ Entry</button>
              <span className='text-xs text-slate-500'>{frame + 1}/{shots.length}</span>
              <button className={btnGhost} onClick={() => setFrame(shots.length - 1)} disabled={frame >= shots.length - 1}>Exit ▶</button>
            </div>
          </div>
        ) : (
          <div className='flex h-full items-center justify-center rounded-lg border border-dashed border-slate-300 py-8 text-xs text-slate-400 dark:border-slate-700'>No chart screenshots</div>
        )}
      </div>
      <ReplayModal open={replayOpen} onClose={() => setReplayOpen(false)} trade={t} />
    </div>
  )
}

/* ============================ Advanced Trade Replay Modal ============================ */
function ReplayModal({ open, onClose, trade }) {
  const { patchTrade } = useStore()
  const shots = useMemo(() => [trade?.entryShot, trade?.exitShot].filter(Boolean), [trade])
  const [frame, setFrame] = useState(0)

  // Zoom & Pan State
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  // Interaction Mode: 'pan' or 'annotate' or 'edit-levels'
  const [interactionMode, setInteractionMode] = useState('pan') // 'pan' | 'annotate' | 'levels'

  // Draggable levels and pins state
  const replayData = trade?.replayData || {}
  const [entryY, setEntryY] = useState(replayData.entryY ?? 40)
  const [exitY, setExitY] = useState(replayData.exitY ?? 50)
  const [slY, setSlY] = useState(replayData.slY ?? 70)
  const [tpY, setTpY] = useState(replayData.tpY ?? 20)
  const [pins, setPins] = useState(replayData.pins || [])
  const [frameNotes, setFrameNotes] = useState(replayData.frameNotes || { 0: '', 1: '' })

  // Active state for level editing
  const [activeLevelDrag, setActiveLevelDrag] = useState(null) // 'entry' | 'exit' | 'sl' | 'tp' | null
  const [activePin, setActivePin] = useState(null) // pin object being edited
  const [newPinNote, setNewPinNote] = useState('')

  const containerRef = useRef(null)
  const imgRef = useRef(null)

  // Synchronize internal state with trade data when modal opens/trade changes
  useEffect(() => {
    if (!trade) return
    const rd = trade.replayData || {}
    setEntryY(rd.entryY ?? 40)
    setExitY(rd.exitY ?? 50)
    setSlY(rd.slY ?? 70)
    setTpY(rd.tpY ?? 20)
    setPins(rd.pins || [])
    setFrameNotes(rd.frameNotes || { 0: trade.notes || '', 1: '' })
    setScale(1)
    setOffset({ x: 0, y: 0 })
    setFrame(0)
    setInteractionMode('pan')
    setActivePin(null)
  }, [trade, open])

  if (!open || !trade) return null

  const activeImage = shots[frame]

  const saveReplayData = (updatedFields = {}) => {
    const updated = {
      entryY,
      exitY,
      slY,
      tpY,
      pins,
      frameNotes,
      ...updatedFields,
    }
    patchTrade(trade.id, { replayData: updated })
  }

  // Zoom handlers
  const handleZoom = (amount) => {
    setScale((s) => Math.max(1, Math.min(4, s + amount)))
  }

  const handleResetZoom = () => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }

  // Pan / Drag handlers
  const handleMouseDown = (e) => {
    if (interactionMode === 'pan') {
      setIsPanning(true)
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
    }
  }

  const handleMouseMove = (e) => {
    if (isPanning && interactionMode === 'pan') {
      setOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      })
    } else if (activeLevelDrag && interactionMode === 'levels' && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const relativeY = ((e.clientY - rect.top) / rect.height) * 100
      const clampedY = Math.max(0, Math.min(100, relativeY))

      if (activeLevelDrag === 'entry') setEntryY(clampedY)
      if (activeLevelDrag === 'exit') setExitY(clampedY)
      if (activeLevelDrag === 'sl') setSlY(clampedY)
      if (activeLevelDrag === 'tp') setTpY(clampedY)
    }
  }

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false)
    }
    if (activeLevelDrag) {
      setActiveLevelDrag(null)
      saveReplayData()
    }
  }

  const handleWheel = (e) => {
    if (interactionMode === 'pan') {
      e.preventDefault()
      const delta = e.deltaY < 0 ? 0.2 : -0.2
      setScale((s) => Math.max(1, Math.min(4, s + delta)))
    }
  }

  // Level editing triggers
  const startLevelDrag = (level) => (e) => {
    e.stopPropagation()
    if (interactionMode === 'levels') {
      setActiveLevelDrag(level)
    }
  }

  // Annotation click drop
  const handleCanvasClick = (e) => {
    if (interactionMode !== 'annotate' || !containerRef.current) return

    // Get coordinates relative to container size
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const newPin = {
      id: 'pin_' + Date.now() + Math.random().toString(36).slice(2, 5),
      x,
      y,
      note: '',
      frame,
    }

    setPins([...pins, newPin])
    setActivePin(newPin)
    setNewPinNote('')
  }

  const saveActivePinNote = () => {
    if (!activePin) return
    const updatedPins = pins.map((p) => (p.id === activePin.id ? { ...p, note: newPinNote } : p))
    setPins(updatedPins)
    saveReplayData({ pins: updatedPins })
    setActivePin(null)
  }

  const deletePin = (id) => {
    const updatedPins = pins.filter((p) => p.id !== id)
    setPins(updatedPins)
    saveReplayData({ pins: updatedPins })
    setActivePin(null)
  }

  const updateFrameNote = (val) => {
    const nextNotes = { ...frameNotes, [frame]: val }
    setFrameNotes(nextNotes)
    saveReplayData({ frameNotes: nextNotes })
  }

  const activePins = pins.filter((p) => p.frame === frame)

  return (
    <div className='fixed inset-0 z-50 flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 no-print'>
      {/* Top Header Row */}
      <div className='absolute left-0 right-0 top-0 z-10 flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900 px-4'>
        <div className='flex items-center gap-3'>
          <button className='rounded-lg hover:bg-slate-800 px-3 py-1.5 text-sm transition-colors' onClick={onClose}>
            ✕ Close Replay
          </button>
          <div className='h-4 w-px bg-slate-800' />
          <span className='font-bold text-base'>{trade.symbol} Replay</span>
          <span className='text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30'>
            {trade.direction === 'short' ? 'SHORT' : 'LONG'}
          </span>
        </div>

        {/* Timeline Slider controls */}
        {shots.length > 1 && (
          <div className='flex items-center gap-3 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800'>
            <button className='text-xs font-semibold hover:text-indigo-400 disabled:opacity-40' onClick={() => setFrame(0)} disabled={frame === 0}>
              ◀ Entry
            </button>
            <input
              type='range'
              min='0'
              max={shots.length - 1}
              value={frame}
              onChange={(e) => setFrame(Number(e.target.value))}
              className='h-1 w-24 cursor-pointer appearance-none rounded-lg bg-slate-700 accent-indigo-500'
            />
            <button className='text-xs font-semibold hover:text-indigo-400 disabled:opacity-40' onClick={() => setFrame(1)} disabled={frame === 1}>
              Exit ▶
            </button>
            <span className='text-[10px] text-slate-400 font-mono'>
              {frame === 0 ? 'ENTRY CHART' : 'EXIT CHART'}
            </span>
          </div>
        )}

        <div className='flex items-center gap-2'>
          <span className='text-xs text-slate-500 hidden sm:inline'>Mode:</span>
          <div className='flex rounded-lg bg-slate-950 border border-slate-800 p-0.5'>
            <button
              onClick={() => { setInteractionMode('pan'); setActivePin(null) }}
              className={cx(
                'px-2.5 py-1 text-xs font-medium rounded',
                interactionMode === 'pan' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              )}
              title='Zoom and Pan around the chart'
            >
              ✋ Pan & Zoom
            </button>
            <button
              onClick={() => { setInteractionMode('levels'); setActivePin(null) }}
              className={cx(
                'px-2.5 py-1 text-xs font-medium rounded',
                interactionMode === 'levels' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              )}
              title='Drag entry, exit, stop loss, and target lines'
            >
              📏 Price Levels
            </button>
            <button
              onClick={() => { setInteractionMode('annotate'); handleResetZoom() }}
              className={cx(
                'px-2.5 py-1 text-xs font-medium rounded',
                interactionMode === 'annotate' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              )}
              title='Click on the chart to drop sticky annotations'
            >
              📌 Drop Pins
            </button>
          </div>
        </div>
      </div>

      {/* Main content grid: Canvas area (left) and side detail panel (right) */}
      <div className='flex h-full w-full pt-14 flex-col lg:flex-row'>
        {/* Left Side: Interactive Canvas */}
        <div
          className={cx(
            'relative flex-1 bg-slate-950 select-none overflow-hidden flex items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-800',
            interactionMode === 'pan' ? 'cursor-grab active:cursor-grabbing' : interactionMode === 'annotate' ? 'cursor-crosshair' : 'cursor-default'
          )}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {activeImage ? (
            <div
              ref={containerRef}
              onClick={handleCanvasClick}
              className='relative max-w-full max-h-full transition-transform duration-75 origin-center'
              style={{
                transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
              }}
            >
              <img
                ref={imgRef}
                src={activeImage}
                alt='Trade replay chart'
                className='max-w-[85vw] max-h-[75vh] object-contain pointer-events-none'
              />

              {/* Price Levels Layer */}
              <div className='absolute inset-0 pointer-events-none'>
                {/* Entry Level */}
                {entryY != null && (
                  <div
                    className={cx(
                      'absolute left-0 right-0 border-t border-dashed border-emerald-400/80 flex items-center justify-end pr-2 text-[10px] text-emerald-400 font-mono',
                      interactionMode === 'levels' && 'pointer-events-auto cursor-row-resize'
                    )}
                    style={{ top: `${entryY}%`, height: '12px', marginTop: '-6px' }}
                    onMouseDown={startLevelDrag('entry')}
                  >
                    <span className='bg-slate-950 px-1 rounded border border-emerald-500/20 shadow'>
                      Entry {trade.entryPrice ? `(${trade.entryPrice})` : ''}
                    </span>
                  </div>
                )}

                {/* Exit Level */}
                {exitY != null && frame === 1 && (
                  <div
                    className={cx(
                      'absolute left-0 right-0 border-t border-dashed border-orange-400/80 flex items-center justify-end pr-2 text-[10px] text-orange-400 font-mono',
                      interactionMode === 'levels' && 'pointer-events-auto cursor-row-resize'
                    )}
                    style={{ top: `${exitY}%`, height: '12px', marginTop: '-6px' }}
                    onMouseDown={startLevelDrag('exit')}
                  >
                    <span className='bg-slate-950 px-1 rounded border border-orange-500/20 shadow'>
                      Exit {trade.exitPrice ? `(${trade.exitPrice})` : ''}
                    </span>
                  </div>
                )}

                {/* Stop Loss (SL) Level */}
                {slY != null && (
                  <div
                    className={cx(
                      'absolute left-0 right-0 border-t border-dashed border-rose-500/80 flex items-center justify-end pr-2 text-[10px] text-rose-500 font-mono',
                      interactionMode === 'levels' && 'pointer-events-auto cursor-row-resize'
                    )}
                    style={{ top: `${slY}%`, height: '12px', marginTop: '-6px' }}
                    onMouseDown={startLevelDrag('sl')}
                  >
                    <span className='bg-slate-950 px-1 rounded border border-rose-500/20 shadow'>
                      SL {trade.stopLoss ? `(${trade.stopLoss})` : ''}
                    </span>
                  </div>
                )}

                {/* Take Profit (TP) Level */}
                {tpY != null && (
                  <div
                    className={cx(
                      'absolute left-0 right-0 border-t border-dashed border-indigo-400/80 flex items-center justify-end pr-2 text-[10px] text-indigo-400 font-mono',
                      interactionMode === 'levels' && 'pointer-events-auto cursor-row-resize'
                    )}
                    style={{ top: `${tpY}%`, height: '12px', marginTop: '-6px' }}
                    onMouseDown={startLevelDrag('tp')}
                  >
                    <span className='bg-slate-950 px-1 rounded border border-indigo-500/20 shadow'>
                      TP {trade.takeProfit ? `(${trade.takeProfit})` : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Pin Annotations Layer */}
              <div className='absolute inset-0 pointer-events-none'>
                {activePins.map((pin, i) => {
                  const isActive = activePin && activePin.id === pin.id
                  return (
                    <div
                      key={pin.id}
                      className='absolute pointer-events-auto'
                      style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                    >
                      {/* Pin Circle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setActivePin(pin)
                          setNewPinNote(pin.note)
                        }}
                        className={cx(
                          'flex h-6 w-6 -translate-x-3 -translate-y-3 items-center justify-center rounded-full border text-xs font-bold shadow-lg transition-transform hover:scale-110',
                          isActive
                            ? 'bg-indigo-600 text-white border-white scale-110 ring-2 ring-indigo-400'
                            : 'bg-slate-900/90 text-indigo-300 border-indigo-500 hover:border-white'
                        )}
                        title={pin.note || 'Click to edit note'}
                      >
                        {i + 1}
                      </button>

                      {/* Tooltip display */}
                      {pin.note && !isActive && (
                        <div className='absolute left-full top-0 ml-2 -translate-y-1/2 w-48 rounded bg-slate-950/95 border border-slate-800 p-1.5 text-[10px] text-slate-200 shadow-md font-sans leading-tight whitespace-pre-wrap pointer-events-none'>
                          {pin.note}
                        </div>
                      )}

                      {/* Inline Pin Note Editor Popup */}
                      {isActive && (
                        <div
                          className='absolute left-full top-0 ml-2 -translate-y-1/2 w-56 rounded-lg bg-slate-900 border border-slate-700 p-2 shadow-xl z-20 font-sans'
                          onClick={(e) => e.stopPropagation()}
                        >
                          <textarea
                            autoFocus
                            className='w-full rounded bg-slate-950 border border-slate-800 p-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 text-white'
                            rows={2}
                            placeholder='Describe this annotation...'
                            value={newPinNote}
                            onChange={(e) => setNewPinNote(e.target.value)}
                          />
                          <div className='mt-1.5 flex justify-end gap-1.5'>
                            <button
                              className='rounded bg-rose-950/60 hover:bg-rose-900/80 px-2 py-0.5 text-[10px] text-rose-300 border border-rose-800/40 transition-colors'
                              onClick={() => deletePin(pin.id)}
                            >
                              Delete
                            </button>
                            <button
                              className='rounded bg-indigo-600 hover:bg-indigo-500 px-2 py-0.5 text-[10px] text-white transition-colors'
                              onClick={saveActivePinNote}
                            >
                              Save Note
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className='text-sm text-slate-500'>Error loading chart image</div>
          )}

          {/* Zoom Controls floating toolbar */}
          {interactionMode === 'pan' && (
            <div className='absolute bottom-4 left-4 flex gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-lg shadow-lg'>
              <button
                className='h-7 w-7 rounded bg-slate-800 hover:bg-slate-700 font-bold flex items-center justify-center hover:text-white transition-colors'
                onClick={() => handleZoom(0.25)}
              >
                +
              </button>
              <button
                className='h-7 w-7 rounded bg-slate-800 hover:bg-slate-700 font-bold flex items-center justify-center hover:text-white transition-colors'
                onClick={() => handleZoom(-0.25)}
              >
                -
              </button>
              <button
                className='h-7 px-2 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center justify-center hover:text-white transition-colors'
                onClick={handleResetZoom}
              >
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Replay Notes & Metrics Side Panel */}
        <div className='w-full lg:w-80 shrink-0 bg-slate-900 border-t lg:border-t-0 border-slate-800 flex flex-col p-4 overflow-y-auto'>
          {/* Header section with setup data */}
          <div className='space-y-3 pb-4 border-b border-slate-800'>
            <h3 className='text-sm font-bold text-slate-400 uppercase tracking-wider'>Replay Dashboard</h3>
            <div className='grid grid-cols-2 gap-2 text-xs'>
              <div className='bg-slate-950 p-2 rounded border border-slate-800/60'>
                <div className='text-slate-500 text-[10px]'>ENTRY PRICE</div>
                <div className='font-mono font-semibold text-slate-200 mt-0.5'>{trade.entryPrice ? fmtMoney(trade.entryPrice) : '—'}</div>
              </div>
              <div className='bg-slate-950 p-2 rounded border border-slate-800/60'>
                <div className='text-slate-500 text-[10px]'>EXIT PRICE</div>
                <div className='font-mono font-semibold text-slate-200 mt-0.5'>{trade.exitPrice ? fmtMoney(trade.exitPrice) : '—'}</div>
              </div>
              <div className='bg-slate-950 p-2 rounded border border-slate-800/60'>
                <div className='text-slate-500 text-[10px]'>RISK-STOP</div>
                <div className='font-mono font-semibold text-rose-400 mt-0.5'>{trade.stopLoss ? `SL: ${trade.stopLoss}` : '—'}</div>
              </div>
              <div className='bg-slate-950 p-2 rounded border border-slate-800/60'>
                <div className='text-slate-500 text-[10px]'>TARGET</div>
                <div className='font-mono font-semibold text-emerald-400 mt-0.5'>{trade.takeProfit ? `TP: ${trade.takeProfit}` : '—'}</div>
              </div>
            </div>
          </div>

          {/* Instructions box based on interactionMode */}
          <div className='my-3 bg-slate-950 p-3 rounded-lg border border-indigo-950/40 text-xs text-slate-400 leading-relaxed'>
            {interactionMode === 'pan' && (
              <p>✋ <b>Pan & Zoom Mode:</b> Click and drag the chart to pan around. Scroll with mouse wheel or trackpad to zoom in/out.</p>
            )}
            {interactionMode === 'levels' && (
              <p>📏 <b>Price Levels Mode:</b> Click and drag the dashed horizontal lines (Entry, Exit, SL, TP) to line up with key prices on your chart.</p>
            )}
            {interactionMode === 'annotate' && (
              <p>📌 <b>Drop Pins Mode:</b> Click anywhere on the chart image to place a numbered flag and document structural setups or key triggers.</p>
            )}
          </div>

          {/* Replay Frame specific notes */}
          <div className='flex-1 flex flex-col min-h-[160px] space-y-2 mt-2'>
            <label className='text-xs font-bold text-slate-400 uppercase tracking-wider block'>
              {frame === 0 ? 'Entry Setup Notes' : 'Exit Reflection Notes'}
            </label>
            <textarea
              className='w-full flex-1 rounded-lg bg-slate-950 border border-slate-800 p-2.5 text-xs md:text-sm outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200 resize-none font-sans leading-relaxed'
              placeholder={
                frame === 0
                  ? 'What technical patterns triggered your entry? Write market sentiment, orderbook state, or breakout confirmations...'
                  : 'Reflect on the exit execution. Did you hit target, get stopped out, exit early, or violate rules? What could be improved?'
              }
              value={frameNotes[frame] || ''}
              onChange={(e) => updateFrameNote(e.target.value)}
            />
            <span className='text-[10px] text-slate-600 block text-right'>
              Changes are saved automatically to your log.
            </span>
          </div>

          {/* Active pins index listing */}
          {activePins.length > 0 && (
            <div className='mt-4 pt-4 border-t border-slate-800 space-y-2'>
              <h4 className='text-xs font-bold text-slate-400 uppercase tracking-wider'>Annotations on this Frame</h4>
              <div className='space-y-1.5 max-h-36 overflow-y-auto pr-1'>
                {activePins.map((p, i) => (
                  <div
                    key={p.id}
                    className='flex items-start gap-2 bg-slate-950 p-2 rounded border border-slate-800/40 text-[11px] cursor-pointer hover:bg-slate-950/80 hover:border-slate-700 transition-all'
                    onClick={() => {
                      setInteractionMode('annotate')
                      setActivePin(p)
                      setNewPinNote(p.note)
                    }}
                  >
                    <span className='flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded bg-indigo-900/50 border border-indigo-500/30 text-[9px] font-bold text-indigo-300'>
                      {i + 1}
                    </span>
                    <p className='text-slate-300 truncate flex-1'>{p.note || '(No note written yet)'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ============================ CSV import (column mapping) ============================ */
const FIELD_TARGETS = [
  ['symbol', 'Symbol'], ['direction', 'Direction (long/short)'], ['entryDate', 'Entry date'],
  ['exitDate', 'Exit date'], ['entryPrice', 'Entry price'], ['exitPrice', 'Exit price'],
  ['size', 'Size'], ['fees', 'Fees'], ['stopLoss', 'Stop loss'], ['strategy', 'Strategy'], ['notes', 'Notes'],
]

function guessMap(headers) {
  const m = {}
  const norm = (s) => s.toLowerCase().replace(/[^a-z]/g, '')
  const dict = {
    symbol: ['symbol', 'ticker', 'instrument'], direction: ['direction', 'side', 'buysell'],
    entryDate: ['entrydate', 'opentime', 'opened', 'datetime', 'date'], exitDate: ['exitdate', 'closetime', 'closed'],
    entryPrice: ['entryprice', 'openprice', 'entry', 'open'], exitPrice: ['exitprice', 'closeprice', 'exit', 'close'],
    size: ['size', 'qty', 'quantity', 'volume', 'lots', 'shares'], fees: ['fees', 'commission', 'fee'],
    stopLoss: ['stoploss', 'sl', 'stop'], strategy: ['strategy', 'setup'], notes: ['notes', 'comment', 'comments'],
  }
  for (const [field, aliases] of Object.entries(dict)) {
    const hit = headers.find((h) => aliases.includes(norm(h)))
    if (hit) m[field] = hit
  }
  return m
}

function ImportModal({ open, onClose }) {
  const { state, importTrades } = useStore()
  const [parsed, setParsed] = useState(null) // { headers, rows }
  const [map, setMap] = useState({})

  const onFile = async (file) => {
    if (!file) return
    const text = await file.text()
    const p = parseCsv(text)
    setParsed(p)
    setMap(guessMap(p.headers))
  }

  const preview = useMemo(() => {
    if (!parsed) return []
    const objs = rowsToObjects(parsed.headers, parsed.rows)
    return objs.slice(0, 200).map((o) => {
      const dir = (o[map.direction] || '').toString().toLowerCase()
      return {
        accountId: state.activeAccountId,
        symbol: o[map.symbol] || '',
        direction: dir.startsWith('s') || dir.includes('sell') ? DIR.SHORT : DIR.LONG,
        entryDate: o[map.entryDate] || '', exitDate: o[map.exitDate] || '',
        entryPrice: num(o[map.entryPrice]), exitPrice: num(o[map.exitPrice]),
        size: num(o[map.size]), fees: num(o[map.fees]) || 0, stopLoss: num(o[map.stopLoss]),
        multiplier: 1, strategy: o[map.strategy] || '', notes: o[map.notes] || '',
        emotions: [], grade: 0, checklist: {}, reflection: {},
      }
    })
  }, [parsed, map, state.activeAccountId])

  const doImport = () => {
    importTrades(preview.map((p) => ({ ...p, id: uid('trd'), createdAt: Date.now() })))
    onClose(); setParsed(null); setMap({})
  }

  return (
    <Modal open={open} onClose={onClose} wide title='Import trades from CSV'>
      <div className='space-y-4'>
        <label className={cx(btnGhost, 'cursor-pointer border border-dashed border-slate-400')}>
          Choose CSV file
          <input type='file' accept='.csv,text/csv' className='hidden' onChange={(e) => onFile(e.target.files && e.target.files[0])} />
        </label>
        {parsed && (
          <>
            <p className='text-sm text-slate-500'>Map your broker columns to journal fields. Imports into <b>{state.accounts.find((a) => a.id === state.activeAccountId)?.name}</b>.</p>
            <div className='grid gap-2 md:grid-cols-2'>
              {FIELD_TARGETS.map(([field, label]) => (
                <div key={field} className='flex items-center justify-between gap-2 text-sm'>
                  <span className='text-slate-500'>{label}</span>
                  <select className={cx(inputCls, 'max-w-[55%]')} value={map[field] || ''} onChange={(e) => setMap((m) => ({ ...m, [field]: e.target.value }))}>
                    <option value=''>— ignore —</option>
                    {parsed.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className='rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-800'>
              <div className='mb-1 font-medium'>Preview ({preview.length} rows)</div>
              <div className='max-h-40 overflow-auto'>
                {preview.slice(0, 8).map((p, i) => (
                  <div key={i} className='flex gap-3 border-t border-slate-100 py-1 dark:border-slate-800'>
                    <span className='w-16'>{p.symbol}</span><span className='w-12'>{p.direction}</span>
                    <span className='w-16 text-right'>{p.entryPrice ?? '—'}</span><span className='w-16 text-right'>{p.exitPrice ?? '—'}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className='flex justify-end gap-2'>
              <button className={btnGhost} onClick={onClose}>Cancel</button>
              <button className={btnPrimary} disabled={!preview.length} onClick={doImport}>Import {preview.length} trades</button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

/* ============================ Professional Home Dashboard ============================ */
const AXIS = '#94a3b8'
const GRID = 'rgba(148,163,184,0.15)'
const tipStyle = { background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: 12 }

function MiniStat({ label, value, sub, tone, className }) {
  return (
    <div className={cx('rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900', className)}>
      <div className='text-[10px] font-medium uppercase tracking-wider text-slate-500'>{label}</div>
      <div className={cx('mt-0.5 text-lg font-bold tabular-nums', tone)}>{value}</div>
      {sub && <div className='text-[10px] text-slate-400'>{sub}</div>}
    </div>
  )
}

function Dashboard({ trades, setFilters, onNavigate }) {
  const { state } = useStore()
  const acct = state.accounts.find((a) => a.id === state.activeAccountId)
  const balance = acct ? acct.startingBalance : 0
  const netCashflow = state.cashflows.filter((c) => c.accountId === state.activeAccountId).reduce((s, c) => s + Number(c.amount), 0)
  const currentBalance = balance + netCashflow
  const closed = trades.filter(isClosed)
  const openTrades = trades.filter((t) => !isClosed(t))
  const s = useMemo(() => stats(trades), [trades])
  const eq = useMemo(() => equityCurve(trades, balance, state.cashflows.filter((c) => c.accountId === state.activeAccountId)), [trades, balance, state.cashflows])
  const eqData = eq.map((p, i) => ({ i, equity: Math.round(p.equity), label: p.date ? p.date.slice(0, 10) : 'Start' }))
  const dd = useMemo(() => drawdownSeries(eq), [eq])
  const now = new Date()
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0, 0, 0, 0)
  const monthStart = new Date(now); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
  const todayPnl = closed.filter((t) => new Date(t.exitDate) >= todayStart).reduce((s, t) => s + (tradePnl(t) || 0), 0)
  const weekPnl = closed.filter((t) => new Date(t.exitDate) >= weekStart).reduce((s, t) => s + (tradePnl(t) || 0), 0)
  const monthPnl = closed.filter((t) => new Date(t.exitDate) >= monthStart).reduce((s, t) => s + (tradePnl(t) || 0), 0)
  const monthTrades = closed.filter((t) => new Date(t.exitDate) >= monthStart)
  const monthR = monthTrades.reduce((s, t) => s + (rMultiple(t) || 0), 0)
  const byStrategy = groupStats(trades, (t) => t.strategy || 'Untagged')
  const topStrategy = byStrategy.length ? byStrategy[0] : null
  const insights = useMemo(() => generateInsights(trades), [trades])
  const bestInsight = insights.find((i) => i.type === 'success') || insights[0] || null

  // Session perf
  const sessionPerf = useMemo(() => sessionMetrics(closed), [closed])
  const bestSession = sessionPerf.filter((s) => s.session !== 'Other').sort((a, b) => b.pnl - a.pnl)[0]

  // Discipline score
  const aggScore = useMemo(() => aggregateScores(trades, state.riskPlan, currentBalance), [trades, state.riskPlan, currentBalance])

  // Emotion tracking
  const moodRows = state.tags.emotions.map((emo) => {
    const withTag = closed.filter((t) => (t.emotions || []).includes(emo))
    const s2 = stats(withTag)
    return { emo, count: s2.count, pnl: s2.totalPnl }
  }).filter((r) => r.count > 0).sort((a, b) => b.pnl - a.pnl)

  // Open risk
  const openRisk = openTrades.reduce((sum, t) => sum + (riskPerTrade(t) || 0), 0)
  const openRiskPct = currentBalance ? (openRisk / currentBalance) * 100 : 0

  // Risk meter: composite of drawdown, daily loss, open risk
  const riskMeterPct = Math.min(100, Math.round(
    ((Math.abs(dd.maxDd) / (state.goals.maxDrawdownTarget || 10)) * 40) +
    ((Math.max(0, -todayPnl) / (state.riskPlan.dailyLossLimit || 1)) * 30) +
    (openRiskPct / (state.riskPlan.riskPerTradePct || 1) * 30)
  ))

  const byDow = DOW.map((d, i) => {
    const g = stats(closed.filter((t) => dowOf(t.exitDate || t.entryDate) === i))
    return { key: d, pnl: Math.round(g.totalPnl), count: g.count }
  })

  if (!closed.length) {
    return (
      <div className='space-y-4'>
        <DailyQuoteWidget />
        {/* Empty state */}
        <div className='grid gap-3 md:grid-cols-4'>
          <MiniStat label='Current Balance' value={fmtMoney(currentBalance)} tone='text-indigo-500' sub='No trades yet' />
          <MiniStat label='Today' value='—' sub='No activity' />
          <MiniStat label='This Week' value='—' sub='No activity' />
          <MiniStat label='This Month' value='—' sub='No activity' />
        </div>
        <div className={cx(card, 'flex flex-col items-center py-14 text-center')}>
          <div className='mb-2 text-5xl opacity-60'>📈</div>
          <p className='text-lg font-semibold'>Welcome to TradeJournal</p>
          <p className='mt-1 max-w-md text-sm text-slate-500'>Start by adding your first trade. Your professional dashboard will populate with real-time analytics, risk metrics, and performance insights as you log your journey.</p>
        </div>
        {/* Quick-start equity curve placeholder */}
        <div className={cx(card, 'p-4')}>
          <div className='mb-3 flex items-center justify-between'>
            <h3 className='text-xs font-semibold uppercase tracking-wider text-slate-500'>Equity Curve</h3>
          </div>
          <div className='flex h-48 items-center justify-center text-sm text-slate-400'>Add trades to see your equity curve</div>
        </div>
      </div>
    )
  }

  const rDist = closed.map((t) => rMultiple(t)).filter((x) => x != null)
    .reduce((acc, r) => { const b = Math.round(r * 2) / 2; acc[b] = (acc[b] || 0) + 1; return acc }, {})
  const rData = Object.entries(rDist).map(([r, n]) => ({ r: Number(r), n })).sort((a, b) => a.r - b.r)

  return (
    <div className='space-y-3'>

      <DailyQuoteWidget />

      {/* ── ROW 1: Key metrics bar ── */}
      <div className='grid gap-2 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8'>
        <MiniStat label='Equity' value={fmtMoney(eq.length ? eq[eq.length - 1].equity : balance)} tone={pnlColor(eq.length ? eq[eq.length - 1].equity - balance : 0)} sub={`Start ${fmtMoney(balance)}`} />
        <MiniStat label='Daily P&L' value={fmtMoney(todayPnl)} tone={pnlColor(todayPnl)} sub={new Date().toLocaleDateString()} />
        <MiniStat label='Weekly P&L' value={fmtMoney(weekPnl)} tone={pnlColor(weekPnl)} sub='This week' />
        <MiniStat label='Monthly P&L' value={fmtMoney(monthPnl)} tone={pnlColor(monthPnl)} sub={`${monthR.toFixed(1)}R total`} />
        <MiniStat label='Drawdown' value={dd.maxDd.toFixed(1) + '%'} tone='text-amber-500' sub={`Max ${Math.abs(dd.maxDd).toFixed(1)}%`} />
        <MiniStat label='Streak' value={(s.streak > 0 ? '+' : '') + s.streak} tone={pnlColor(s.streak)} sub={s.streak > 0 ? 'Winning' : s.streak < 0 ? 'Losing' : 'Even'} />
        <MiniStat label='Win Rate' value={fmtPct(s.winRate)} tone='text-indigo-500' sub={s.count + ' trades'} />
        <MiniStat label='Profit Factor' value={s.profitFactor === Infinity ? '∞' : s.profitFactor.toFixed(2)} tone={s.profitFactor >= 1.5 ? 'text-emerald-500' : 'text-rose-500'} sub='PF' />
      </div>

      {/* ── ROW 2: Equity curve + AI insights + Risk meter + Discipline ── */}
      <div className='grid gap-3 lg:grid-cols-3 xl:grid-cols-4'>
        {/* Equity curve — spans 2 cols */}
        <div className={cx(card, 'p-3 lg:col-span-2')}>
          <div className='mb-2 flex items-center justify-between'>
            <h3 className='text-xs font-semibold uppercase tracking-wider text-slate-500'>Equity Curve</h3>
            <span className='text-[10px] text-slate-400'>+{fmtMoney(s.totalPnl)}</span>
          </div>
          <ResponsiveContainer width='100%' height={180}>
            <AreaChart data={eqData}>
              <defs><linearGradient id='eq2' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='0%' stopColor='#6366f1' stopOpacity={0.35} /><stop offset='100%' stopColor='#6366f1' stopOpacity={0} />
              </linearGradient></defs>
              <CartesianGrid stroke={GRID} />
              <XAxis dataKey='label' tick={{ fontSize: 10, fill: AXIS }} minTickGap={60} />
              <YAxis domain={['dataMin - 50', 'dataMax + 50']} tick={{ fontSize: 10, fill: AXIS }} width={50} />
              <Tooltip contentStyle={tipStyle} />
              <Area type='monotone' dataKey='equity' stroke='#6366f1' fill='url(#eq2)' strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Risk meter */}
        <div className={cx(card, 'p-3')}>
          <div className='mb-2 flex items-center justify-between'>
            <h3 className='text-xs font-semibold uppercase tracking-wider text-slate-500'>Risk Meter</h3>
            <span className={cx('text-xs font-bold', riskMeterPct >= 75 ? 'text-rose-500' : riskMeterPct >= 50 ? 'text-amber-500' : 'text-emerald-500')}>
              {riskMeterPct >= 75 ? 'High' : riskMeterPct >= 50 ? 'Medium' : 'Low'}
            </span>
          </div>
          {/* Radial risk gauge */}
          <div className='flex items-center justify-center py-1'>
            <div className='relative h-24 w-24'>
              <svg viewBox='0 0 100 100' className='h-full w-full -rotate-90'>
                <circle cx='50' cy='50' r='42' fill='none' stroke='rgba(148,163,184,0.2)' strokeWidth='8' />
                <circle cx='50' cy='50' r='42' fill='none'
                  stroke={riskMeterPct >= 75 ? '#ef4444' : riskMeterPct >= 50 ? '#f59e0b' : '#10b981'}
                  strokeWidth='8' strokeLinecap='round'
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - riskMeterPct / 100)}`}
                  className='transition-all duration-700' />
              </svg>
              <div className='absolute inset-0 flex flex-col items-center justify-center'>
                <span className='text-xl font-bold tabular-nums'>{riskMeterPct}%</span>
                <span className='text-[10px] text-slate-400'>Risk</span>
              </div>
            </div>
          </div>
          <div className='mt-1 space-y-1 text-[10px] text-slate-400'>
            <div className='flex justify-between'><span>Open risk</span><span>{fmtMoney(openRisk)}</span></div>
            <div className='flex justify-between'><span>Daily loss</span><span>{fmtMoney(todayPnl < 0 ? Math.abs(todayPnl) : 0)}</span></div>
            <div className='flex justify-between'><span>DD budget</span><span>{Math.abs(dd.maxDd).toFixed(1)}% / {state.goals.maxDrawdownTarget}%</span></div>
          </div>
        </div>

        {/* AI Insight + Discipline combo */}
        <div className={cx(card, 'p-3')}>
          <div className='mb-2 flex items-center justify-between'>
            <h3 className='text-xs font-semibold uppercase tracking-wider text-slate-500'>AI Insight</h3>
            {insights.length > 0 && <span className='rounded bg-indigo-500/10 px-1.5 py-0.5 text-[10px] text-indigo-400'>{insights.length}</span>}
          </div>
          {bestInsight ? (
            <div className='space-y-1'>
              <p className='text-xs font-medium text-indigo-400 dark:text-indigo-300'>{bestInsight.title}</p>
              <p className='text-[11px] leading-relaxed text-slate-600 dark:text-slate-300'>{bestInsight.text}</p>
              <button className='mt-1 text-[10px] text-indigo-500 hover:underline' onClick={() => onNavigate && onNavigate('coach')}>View all insights →</button>
            </div>
          ) : (
            <p className='text-xs text-slate-400'>Add more trades with strategies and tags to generate coaching insights.</p>
          )}
          <div className='mt-3 border-t border-slate-100 pt-3 dark:border-slate-800'>
            <div className='flex items-center justify-between'>
              <span className='text-[10px] font-medium uppercase tracking-wider text-slate-500'>Discipline</span>
              <span className={cx('text-sm font-bold', aggScore.overall.pct >= 80 ? 'text-emerald-500' : aggScore.overall.pct >= 60 ? 'text-amber-500' : 'text-rose-500')}>
                {aggScore.overall.pct}%
              </span>
            </div>
            <div className='mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700'>
              <div className={cx('h-full rounded-full transition-all', aggScore.overall.pct >= 80 ? 'bg-emerald-500' : aggScore.overall.pct >= 60 ? 'bg-amber-500' : 'bg-rose-500')}
                style={{ width: aggScore.overall.pct + '%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 3: Session perf + Emotion + DOW + Open trades ── */}
      <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-4'>
        {/* Session performance */}
        <div className={cx(card, 'p-3')}>
          <h3 className='mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500'>Session</h3>
          {bestSession ? (
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <span className='text-lg'>{bestSession.session === 'London' ? '🇬🇧' : bestSession.session === 'New York' ? '🇺🇸' : bestSession.session === 'Tokyo' ? '🇯🇵' : bestSession.session === 'Sydney' ? '🇦🇺' : bestSession.session === 'London/NY Overlap' ? '🌐' : '🌍'}</span>
                <span className='text-sm font-semibold'>{bestSession.session}</span>
              </div>
              <div className='grid grid-cols-2 gap-1 text-[10px]'>
                <span className='text-slate-400'>P&L:</span><span className={cx('text-right font-medium tabular-nums', pnlColor(bestSession.pnl))}>{fmtMoney(bestSession.pnl)}</span>
                <span className='text-slate-400'>Win rate:</span><span className='text-right font-medium tabular-nums'>{fmtPct(bestSession.winRate)}</span>
                <span className='text-slate-400'>Trades:</span><span className='text-right font-medium tabular-nums'>{bestSession.count}</span>
              </div>
              <button className='mt-1 text-[10px] text-indigo-500 hover:underline' onClick={() => onNavigate && onNavigate('sessions')}>All sessions →</button>
            </div>
          ) : (
            <p className='text-xs text-slate-400'>No session data yet.</p>
          )}
        </div>

        {/* Emotion tracker */}
        <div className={cx(card, 'p-3')}>
          <h3 className='mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500'>Emotions</h3>
          {moodRows.length ? (
            <div className='space-y-1'>
              {moodRows.slice(0, 4).map((r) => {
                const maxPnl = Math.max(1, ...moodRows.map((x) => Math.abs(x.pnl)))
                const barW = (Math.abs(r.pnl) / maxPnl) * 100
                return (
                  <div key={r.emo} className='flex items-center gap-2'>
                    <span className='w-16 truncate text-[10px] text-slate-500'>{r.emo}</span>
                    <div className='h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700'>
                      <div className={cx('h-full rounded-full', r.pnl >= 0 ? 'bg-emerald-500' : 'bg-rose-500')}
                        style={{ width: barW + '%' }} />
                    </div>
                    <span className={cx('w-16 text-right text-[10px] tabular-nums', pnlColor(r.pnl))}>{fmtMoney(r.pnl)}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className='text-xs text-slate-400'>Tag emotions on trades to see patterns.</p>
          )}
        </div>

        {/* Day of week mini */}
        <div className={cx(card, 'p-3')}>
          <h3 className='mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500'>By Day</h3>
          <div className='space-y-0.5'>
            {byDow.filter((d) => d.count > 0).map((d) => (
              <div key={d.key} className='flex items-center gap-2'>
                <span className='w-8 text-[10px] text-slate-500'>{d.key}</span>
                <div className='h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700'>
                  <div className={cx('h-full rounded-full', d.pnl >= 0 ? 'bg-emerald-500' : 'bg-rose-500')}
                    style={{ width: Math.min(Math.abs(d.pnl) / (Math.max(1, ...byDow.map((x) => Math.abs(x.pnl)))) * 100, 100) + '%' }} />
                </div>
                <span className={cx('w-14 text-right text-[10px] tabular-nums', pnlColor(d.pnl))}>{fmtMoney(d.pnl)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Open positions + Goal progress */}
        <div className={cx(card, 'p-3')}>
          <h3 className='mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500'>Open Risk</h3>
          {openTrades.length > 0 ? (
            <div className='space-y-1 text-xs'>
              {openTrades.slice(0, 5).map((t) => {
                const risk = riskPerTrade(t)
                return (
                  <div key={t.id} className='flex items-center justify-between'>
                    <span className='font-medium'>{t.symbol}</span>
                    <span className='text-slate-400 tabular-nums'>{risk ? fmtMoney(risk) : '—'}</span>
                  </div>
                )
              })}
              {openTrades.length > 5 && <p className='text-[10px] text-slate-400'>+{openTrades.length - 5} more</p>}
              <div className='mt-2 border-t border-slate-100 pt-2 dark:border-slate-800'>
                <div className='flex justify-between text-[10px]'><span>Total at risk</span><span className='font-semibold'>{fmtMoney(openRisk)}</span></div>
                <div className='flex justify-between text-[10px]'><span>Portfolio %</span><span className='font-semibold'>{openRiskPct.toFixed(1)}%</span></div>
              </div>
            </div>
          ) : (
            <p className='text-xs text-slate-400'>No open positions.</p>
          )}
          <div className='mt-3 border-t border-slate-100 pt-3 dark:border-slate-800'>
            <div className='flex items-center justify-between'>
              <span className='text-[10px] font-medium uppercase tracking-wider text-slate-500'>Goals</span>
              <span className='text-[10px] text-indigo-500 tabular-nums'>{monthTrades.length > 0 ? (monthTrades.filter((t) => (tradePnl(t) || 0) > 0).length / monthTrades.length * 100).toFixed(0) : 0}% WR</span>
            </div>
            <div className='mt-1 flex gap-1'>
              {[monthPnl / (state.goals.monthlyPnlTarget || 1) * 100, Math.abs(dd.maxDd) / (state.goals.maxDrawdownTarget || 1) * 100].map((pct, i) => (
                <div key={i} className='h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700'>
                  <div className={cx('h-full rounded-full', pct >= 100 ? 'bg-emerald-500' : 'bg-indigo-500')}
                    style={{ width: Math.min(Math.max(pct, 0), 100) + '%' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 4: Recent trades + Top strategy + Trend + Calendar ── */}
      <div className='grid gap-3 lg:grid-cols-2 xl:grid-cols-4'>
        {/* Recent trades mini-table */}
        <div className={cx(card, 'xl:col-span-2')}>
          <div className='flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-slate-800'>
            <h3 className='text-xs font-semibold uppercase tracking-wider text-slate-500'>Recent Trades</h3>
            <button className='text-[10px] text-indigo-500 hover:underline' onClick={() => onNavigate && onNavigate('trades')}>View all →</button>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-xs'>
              <thead className='text-left text-slate-400'>
                <tr><th className='px-3 py-1.5 font-medium'>Sym</th><th className='px-2 py-1.5 font-medium text-right'>P&L</th><th className='px-2 py-1.5 font-medium text-right hidden sm:table-cell'>R</th><th className='px-2 py-1.5 font-medium text-right hidden md:table-cell'>Date</th></tr>
              </thead>
              <tbody>
                {closed.slice(-8).reverse().map((t) => (
                  <tr key={t.id} className='border-t border-slate-100 dark:border-slate-800'>
                    <td className='px-3 py-1.5 font-medium'>{t.symbol}</td>
                    <td className={cx('px-2 py-1.5 text-right tabular-nums', pnlColor(tradePnl(t) || 0))}>{fmtMoney(tradePnl(t))}</td>
                    <td className={cx('px-2 py-1.5 text-right tabular-nums hidden sm:table-cell', (rMultiple(t) || 0) > 0 ? 'text-emerald-500' : (rMultiple(t) || 0) < 0 ? 'text-rose-500' : '')}>
                      {rMultiple(t) != null ? rMultiple(t).toFixed(1) + 'R' : '—'}
                    </td>
                    <td className='px-2 py-1.5 text-right text-slate-400 hidden md:table-cell'>{(t.exitDate || '').slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top strategy */}
        <div className={cx(card, 'p-3')}>
          <h3 className='mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500'>Top Strategy</h3>
          {topStrategy && topStrategy.count >= 1 ? (
            <div className='space-y-1.5'>
              <div className='flex items-center gap-2'>
                <span className='text-xl'>🥇</span>
                <span className='text-sm font-bold'>{topStrategy.key}</span>
              </div>
              <div className='grid grid-cols-2 gap-1 text-[10px]'>
                <span className='text-slate-400'>Trades:</span><span className='text-right font-medium tabular-nums'>{topStrategy.count}</span>
                <span className='text-slate-400'>Win rate:</span><span className={cx('text-right font-medium tabular-nums', topStrategy.winRate >= 50 ? 'text-emerald-500' : 'text-rose-500')}>{fmtPct(topStrategy.winRate)}</span>
                <span className='text-slate-400'>Avg R:</span><span className='text-right font-medium tabular-nums'>{topStrategy.avgR.toFixed(2)}</span>
                <span className='text-slate-400'>Net P&L:</span><span className={cx('text-right font-medium tabular-nums', pnlColor(topStrategy.pnl))}>{fmtMoney(topStrategy.pnl)}</span>
              </div>
            </div>
          ) : (
            <p className='text-xs text-slate-400'>Add more trades with strategy tags.</p>
          )}
        </div>

        {/* Calendar mini */}
        <div className={cx(card, 'p-3')}>
          <CalendarHeat trades={closed} onDrillDay={(d) => setFilters((f) => ({ ...f, from: d, to: d }))} compact />
          <button className='mt-1 text-[10px] text-indigo-500 hover:underline' onClick={() => setView('dashboard')}>Full view →</button>
        </div>
      </div>

      {/* ── ROW 5: R distribution + Drawdown chart + Daily Quote + Notes ── */}
      <div className='grid gap-3 lg:grid-cols-2 xl:grid-cols-4'>
        <div className={cx(card, 'p-3')}>
          <h3 className='mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500'>R-Distribution</h3>
          <ResponsiveContainer width='100%' height={120}>
            <BarChart data={rData}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey='r' tick={{ fontSize: 9, fill: AXIS }} />
              <YAxis tick={{ fontSize: 9, fill: AXIS }} width={20} />
              <Tooltip contentStyle={tipStyle} />
              <ReferenceLine x={0} stroke={AXIS} />
              <Bar dataKey='n'>{rData.map((d, i) => <Cell key={i} fill={d.r >= 0 ? '#10b981' : '#f43f5e'} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={cx(card, 'p-3')}>
          <h3 className='mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500'>Drawdown</h3>
          <ResponsiveContainer width='100%' height={120}>
            <AreaChart data={dd.series.slice(-30).map((p, i) => ({ i, drawdown: +p.drawdown.toFixed(2) }))}>
              <CartesianGrid stroke={GRID} />
              <XAxis dataKey='i' tick={false} />
              <YAxis tick={{ fontSize: 9, fill: AXIS }} width={30} domain={['auto', 0]} />
              <Tooltip contentStyle={tipStyle} />
              <Area type='monotone' dataKey='drawdown' stroke='#f43f5e' fill='#f43f5e' fillOpacity={0.15} strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent notes */}
        <div className={cx(card, 'p-3')}>
          <h3 className='mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500'>Recent Notes</h3>
          {closed.filter((t) => t.notes).length > 0 ? (
            <div className='space-y-1 max-h-24 overflow-y-auto'>
              {closed.filter((t) => t.notes).slice(-5).reverse().map((t) => (
                <div key={t.id} className='flex items-start gap-2 text-[10px]'>
                  <span className='shrink-0 font-medium text-slate-500'>{t.symbol}</span>
                  <span className='line-clamp-1 text-slate-600 dark:text-slate-300'>{t.notes}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className='text-xs text-slate-400'>No notes yet. Add notes when logging trades.</p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ============================ Daily Inspiration Widget ============================ */
function DailyQuoteWidget({ compact }) {
  const [quote, setQuote] = useState(() => getQuoteOfDay())
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('trading-journal:favQuotes') || '[]') } catch { return [] }
  })
  const [fading, setFading] = useState(false)
  const [copied, setCopied] = useState(false)

  const refresh = useCallback(() => {
    setFading(true)
    setTimeout(() => {
      setQuote(getRandomQuote(quote.index))
      setFading(false)
    }, 150)
  }, [quote])

  const toggleFav = useCallback(() => {
    const exists = favorites.some((f) => f.index === quote.index)
    const next = exists ? favorites.filter((f) => f.index !== quote.index) : [...favorites, quote]
    setFavorites(next)
    localStorage.setItem('trading-journal:favQuotes', JSON.stringify(next))
  }, [quote, favorites])

  const copyText = useCallback(() => {
    navigator.clipboard.writeText(`"${quote.text}" — ${quote.author}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [quote])

  if (!quote) return null

  return (
    <div className={cx(card, 'relative overflow-hidden bg-gradient-to-r from-indigo-500/[0.04] to-transparent p-4')}>
      <div className='absolute right-4 top-2 select-none text-5xl text-indigo-500/10'>"</div>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex-1'>
          <div className='mb-1 flex items-center gap-2'>
            <span className='rounded bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-400'>Today's Insight</span>
          </div>
          <div className={cx('transition-opacity duration-300', fading ? 'opacity-0' : 'opacity-100')}>
            <p className='text-base md:text-lg leading-relaxed text-slate-700 italic dark:text-slate-200'>"{quote.text}"</p>
            <p className='mt-2 text-sm font-semibold text-indigo-500'>— {quote.author}</p>
          </div>
        </div>
        <div className='flex shrink-0 gap-1.5 pt-7'>
          <button className={cx(btnGhost, 'text-xs')} onClick={copyText} title='Copy'>{copied ? 'Copied' : '📋'}</button>
          <button className={cx(btnGhost, 'text-xs')} onClick={toggleFav} title='Favorite'>
            {favorites.some((f) => f.index === quote.index) ? '★' : '☆'}
          </button>
          <button className={cx(btnGhost, 'text-xs')} onClick={refresh} title='New quote'>⟳</button>
        </div>
      </div>
    </div>
  )
}

/* ============================ Quotes Page ============================ */
function QuotesPage() {
  const [quote, setQuote] = useState(() => getQuoteOfDay())
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('trading-journal:favQuotes') || '[]') } catch { return [] }
  })
  const [search, setSearch] = useState('')
  const [authorFilter, setAuthorFilter] = useState('')
  const [tab, setTab] = useState('all') // 'all' | 'favorites' | 'qotd'
  const [fading, setFading] = useState(false)
  const [copied, setCopied] = useState(false)

  const allAuthors = useMemo(() => getAuthors(), [])

  const refresh = useCallback(() => {
    setFading(true)
    setTimeout(() => {
      setQuote(getRandomQuote(quote.index))
      setFading(false)
    }, 150)
  }, [quote])

  const toggleFav = useCallback((q) => {
    const exists = favorites.some((f) => f.index === q.index)
    const next = exists ? favorites.filter((f) => f.index !== q.index) : [...favorites, q]
    setFavorites(next)
    localStorage.setItem('trading-journal:favQuotes', JSON.stringify(next))
  }, [favorites])

  const copyText = useCallback((q) => {
    navigator.clipboard.writeText(`"${q.text}" — ${q.author}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

  const shareText = useCallback((q) => {
    if (navigator.share) {
      navigator.share({ text: `"${q.text}" — ${q.author}` })
    } else {
      copyText(q)
    }
  }, [copyText])

  // Build displayed list
  const displayed = useMemo(() => {
    let list = []
    if (tab === 'favorites') {
      list = [...favorites]
    } else {
      list = QUOTES.map((q, i) => ({ ...q, index: i }))
    }
    if (authorFilter) list = list.filter((q) => q.author === authorFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((item) => item.text.toLowerCase().includes(q) || item.author.toLowerCase().includes(q))
    }
    return list
  }, [tab, favorites, authorFilter, search])

  return (
    <div className='space-y-4'>
      {/* Quote of the Day / Featured */}
      <div className={cx(card, 'relative overflow-hidden p-5')}>
        <div className='absolute right-3 top-3 text-6xl text-indigo-500/5 select-none'>"</div>
        <div className='flex items-start justify-between gap-3'>
          <div className='flex-1'>
            <div className='mb-1 flex items-center gap-2'>
              <span className='rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-400'>Quote of the Day</span>
              {favorites.some((f) => f.index === quote.index) && <span className='text-amber-400 text-xs'>★</span>}
            </div>
            <div className={cx('transition-opacity duration-300', fading ? 'opacity-0' : 'opacity-100')}>
              <p className='text-base leading-relaxed text-slate-700 italic dark:text-slate-200'>"{quote.text}"</p>
              <p className='mt-2 text-sm font-semibold text-indigo-500'>— {quote.author}</p>
            </div>
          </div>
          <div className='flex shrink-0 flex-col gap-1.5'>
            <button className={btnGhost} onClick={copyText} title='Copy'>{copied ? '✓' : '📋'}</button>
            <button className={btnGhost} onClick={() => toggleFav(quote)} title='Favorite'>{favorites.some((f) => f.index === quote.index) ? '★' : '☆'}</button>
            <button className={btnGhost} onClick={() => shareText(quote)} title='Share'>📤</button>
            <button className={btnPrimary} onClick={refresh} title='Load another'>⟳</button>
          </div>
        </div>
      </div>

      {/* Tabs: All / Favorites */}
      <div className='flex items-center gap-2 border-b border-slate-200 pb-2 dark:border-slate-800'>
        {['all', 'favorites', 'qotd'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cx('rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              tab === t ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800')}>
            {t === 'all' ? `All (${getQuoteCount()})` : t === 'favorites' ? `Favorites (${favorites.length})` : 'Quote of the Day'}
          </button>
        ))}
      </div>

      {/* Search + Author filter */}
      <div className='flex flex-wrap gap-2'>
        <div className='relative flex-1 min-w-[200px]'>
          <input className={cx(inputCls, 'pl-7')} placeholder='Search quotes or authors…' value={search}
            onChange={(e) => setSearch(e.target.value)} />
          <span className='absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400'>🔍</span>
        </div>
        <select className={cx(inputCls, 'w-auto')} value={authorFilter} onChange={(e) => setAuthorFilter(e.target.value)}>
          <option value=''>All authors</option>
          {allAuthors.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Quote grid */}
      <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
        {displayed.map((q, i) => (
          <div key={q.index ?? i} className={cx(card, 'group relative p-3 transition-all hover:shadow-md')}>
            <div className='flex items-start justify-between gap-2'>
              <div className='flex-1 min-w-0'>
                <p className='text-xs leading-relaxed text-slate-600 italic dark:text-slate-300'>"{q.text}"</p>
                <p className='mt-1.5 text-[11px] font-medium text-indigo-500'>— {q.author}</p>
              </div>
              <div className='flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity'>
                <button className={cx(btnGhost, 'px-1 py-0 text-[11px]')} onClick={() => copyText(q)} title='Copy'>📋</button>
                <button className={cx(btnGhost, 'px-1 py-0 text-[11px]')} onClick={() => toggleFav(q)} title='Favorite'>
                  {favorites.some((f) => f.index === (q.index ?? -1)) ? '★' : '☆'}
                </button>
                <button className={cx(btnGhost, 'px-1 py-0 text-[11px]')} onClick={() => shareText(q)} title='Share'>📤</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {displayed.length === 0 && (
        <div className='flex flex-col items-center py-10 text-sm text-slate-400'>
          {tab === 'favorites' ? 'No favorites yet. ★ quotes to save them here.' : 'No quotes match your search.'}
        </div>
      )}
    </div>
  )
}

/* ============================ Heatmaps ============================ */
const localDay = (iso) => {
  if (!iso) return null
  const d = new Date(iso)
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}
const keyFor = (mo, d) => mo.y + '-' + String(mo.m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0')

function TimeOfDayHeatmap({ trades, onDrillHour }) {
  const buckets = Array.from({ length: 24 }, () => ({ pnl: 0, count: 0 }))
  trades.forEach((t) => {
    const h = hourOf(t.exitDate || t.entryDate)
    if (h == null) return
    buckets[h].pnl += tradePnl(t) || 0
    buckets[h].count += 1
  })
  const max = Math.max(1, ...buckets.map((b) => Math.abs(b.pnl)))
  return (
    <Card title='P&L by time of day (hour)'>
      <div className='grid grid-cols-12 gap-1'>
        {buckets.map((b, h) => (
          <div key={h} title={h + ':00 — ' + fmtMoney(b.pnl) + ' (' + b.count + ')'}
            className={cx('flex h-10 cursor-pointer items-center justify-center rounded text-[10px] transition-opacity hover:opacity-80', b.count ? 'font-medium text-white' : 'text-slate-400')}
            style={{ background: b.count ? (b.pnl >= 0 ? 'rgba(16,185,129,' + (0.25 + 0.75 * Math.abs(b.pnl) / max) + ')' : 'rgba(244,63,94,' + (0.25 + 0.75 * Math.abs(b.pnl) / max) + ')') : undefined }}
            onClick={() => onDrillHour && onDrillHour(h)}>
            {h}
          </div>
        ))}
      </div>
      <p className='mt-2 text-xs text-slate-400'>Hour of day (exit time). Greener = more profit, redder = more loss.</p>
    </Card>
  )
}

function CalendarHeat({ trades, onDrillDay, compact }) {
  const [month, setMonth] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() } })
  const daily = useMemo(() => {
    const map = {}
    trades.forEach((t) => {
      const k = localDay(t.exitDate || t.entryDate)
      if (k) map[k] = (map[k] || 0) + (tradePnl(t) || 0)
    })
    return map
  }, [trades])
  const first = new Date(month.y, month.m, 1)
  const startDow = first.getDay()
  const days = new Date(month.y, month.m + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= days; d++) cells.push(d)
  const max = Math.max(1, ...Object.values(daily).map((v) => Math.abs(v)))
  const monthPnl = cells.filter(Boolean).reduce((s, d) => s + (daily[keyFor(month, d)] || 0), 0)
  const shift = (delta) => setMonth((mo) => { const d = new Date(mo.y, mo.m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() } })
  const monthName = first.toLocaleString('en-US', { month: 'long', year: 'numeric' })

  if (compact) {
    return (
      <div>
        <div className='mb-1.5 flex items-center justify-between'>
          <h3 className='text-xs font-semibold uppercase tracking-wider text-slate-500'>Calendar</h3>
          <div className='flex items-center gap-1'>
            <button className={cx(btnGhost, 'px-1 py-0 text-[10px]')} onClick={() => shift(-1)}>‹</button>
            <span className='text-[10px] font-medium'>{monthName}</span>
            <button className={cx(btnGhost, 'px-1 py-0 text-[10px]')} onClick={() => shift(1)}>›</button>
          </div>
        </div>
        <div className='grid grid-cols-7 gap-0.5 text-center text-[9px] text-slate-400'>
          {DOW.map((d) => <div key={d} className='py-0.5'>{d[0]}</div>)}
          {cells.map((d, i) => {
            if (!d) return <div key={i} />
            const pnl = daily[keyFor(month, d)]
            const bg = pnl == null ? undefined : pnl >= 0
              ? 'rgba(16,185,129,' + (0.2 + 0.8 * Math.abs(pnl) / max) + ')'
              : 'rgba(244,63,94,' + (0.2 + 0.8 * Math.abs(pnl) / max) + ')'
            return (
              <div key={i} className='flex h-7 cursor-pointer flex-col items-center justify-center rounded transition-opacity hover:opacity-80'
                style={{ background: bg }}
                onClick={() => onDrillDay && onDrillDay(keyFor(month, d))}>
                <span className={cx('font-medium', pnl != null ? 'text-white' : 'text-slate-400')}>{d}</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <Card title='Calendar (daily P&L)' right={
      <div className='flex items-center gap-2 text-sm no-print'>
        <button className={btnGhost} onClick={() => shift(-1)}>‹</button>
        <span className='w-36 text-center font-medium'>{monthName}</span>
        <button className={btnGhost} onClick={() => shift(1)}>›</button>
        <span className={cx('ml-2 tabular-nums', pnlColor(monthPnl))}>{fmtMoney(monthPnl)}</span>
      </div>
    }>
      <div className='grid grid-cols-7 gap-1 text-center text-xs text-slate-400'>
        {DOW.map((d) => <div key={d} className='py-1'>{d}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />
          const pnl = daily[keyFor(month, d)]
          const bg = pnl == null ? undefined : pnl >= 0
            ? 'rgba(16,185,129,' + (0.2 + 0.8 * Math.abs(pnl) / max) + ')'
            : 'rgba(244,63,94,' + (0.2 + 0.8 * Math.abs(pnl) / max) + ')'
          return (
            <div key={i} className='flex h-14 cursor-pointer flex-col items-center justify-center rounded border border-slate-100 p-1 transition-opacity hover:opacity-80 dark:border-slate-800'
              style={{ background: bg }}
              onClick={() => onDrillDay && onDrillDay(keyFor(month, d))}>
              <span className={cx('text-[11px]', pnl != null && 'font-semibold text-white')}>{d}</span>
              {pnl != null && <span className='text-[10px] text-white/90'>{Math.round(pnl)}</span>}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

/* ============================ Risk & money management ============================ */
const clampPct = (pct) => Math.max(0, Math.min(100, pct))

const FOREX_PAIRS = [
  // type: 'usdQuote' = $10/pip fixed (EUR/USD, GBP/USD, AUD/USD, NZD/USD)
  // type: 'jpyQuote' = pip value ~$6.1/pip (EUR/JPY, GBP/JPY, AUD/JPY, etc.)
  // type: 'usdBase'  = pip value = $10/pip fixed for standard USD pairs
  // type: 'nonJpyCross' = pip value ≈ $10/pip (variance depends on rate, close enough)
  // type: 'cfd'    = $10/pt
  // type: 'crypto' = $1/pip
  // type: 'metal'  = $10 (Gold), $50 (Silver)
  { pair: 'AUD/CAD', type: 'nonJpyCross' }, { pair: 'AUD/CHF', type: 'nonJpyCross' }, { pair: 'AUD/JPY', type: 'jpyQuote' }, { pair: 'AUD/NZD', type: 'nonJpyCross' }, { pair: 'AUD/USD', type: 'usdQuote' },
  { pair: 'BTC/USD', type: 'crypto' }, { pair: 'CAD/CHF', type: 'nonJpyCross' }, { pair: 'CAD/JPY', type: 'jpyQuote' }, { pair: 'CHF/JPY', type: 'jpyQuote' }, { pair: 'ETH/USD', type: 'crypto' },
  { pair: 'EUR/AUD', type: 'nonJpyCross' }, { pair: 'EUR/CAD', type: 'nonJpyCross' }, { pair: 'EUR/CHF', type: 'nonJpyCross' }, { pair: 'EUR/CZK', type: 'nonJpyCross' }, { pair: 'EUR/DKK', type: 'nonJpyCross' },
  { pair: 'EUR/GBP', type: 'nonJpyCross' }, { pair: 'EUR/HUF', type: 'nonJpyCross' }, { pair: 'EUR/JPY', type: 'jpyQuote' }, { pair: 'EUR/NOK', type: 'nonJpyCross' }, { pair: 'EUR/NZD', type: 'nonJpyCross' },
  { pair: 'EUR/PLN', type: 'nonJpyCross' }, { pair: 'EUR/SEK', type: 'nonJpyCross' }, { pair: 'EUR/TRY', type: 'nonJpyCross' }, { pair: 'EUR/USD', type: 'usdQuote' }, { pair: 'EUR/ZAR', type: 'nonJpyCross' },
  { pair: 'GBP/AUD', type: 'nonJpyCross' }, { pair: 'GBP/CAD', type: 'nonJpyCross' }, { pair: 'GBP/CHF', type: 'nonJpyCross' }, { pair: 'GBP/JPY', type: 'jpyQuote' }, { pair: 'GBP/NOK', type: 'nonJpyCross' },
  { pair: 'GBP/NZD', type: 'nonJpyCross' }, { pair: 'GBP/SEK', type: 'nonJpyCross' }, { pair: 'GBP/USD', type: 'usdQuote' },
  { pair: 'GER40', type: 'cfd' }, { pair: 'NAS100', type: 'cfd' }, { pair: 'NZD/CAD', type: 'nonJpyCross' }, { pair: 'NZD/CHF', type: 'nonJpyCross' }, { pair: 'NZD/JPY', type: 'jpyQuote' }, { pair: 'NZD/USD', type: 'usdQuote' },
  { pair: 'SPX500', type: 'cfd' }, { pair: 'US30', type: 'cfd' },
  { pair: 'USD/CAD', type: 'usdBase' }, { pair: 'USD/CHF', type: 'usdBase' }, { pair: 'USD/CNH', type: 'nonJpyCross' }, { pair: 'USD/CZK', type: 'nonJpyCross' }, { pair: 'USD/DKK', type: 'nonJpyCross' },
  { pair: 'USD/HKD', type: 'nonJpyCross' }, { pair: 'USD/HUF', type: 'nonJpyCross' }, { pair: 'USD/JPY', type: 'jpyQuote' }, { pair: 'USD/MXN', type: 'nonJpyCross' }, { pair: 'USD/NOK', type: 'nonJpyCross' },
  { pair: 'USD/PLN', type: 'nonJpyCross' }, { pair: 'USD/SEK', type: 'nonJpyCross' }, { pair: 'USD/SGD', type: 'nonJpyCross' }, { pair: 'USD/TRY', type: 'nonJpyCross' }, { pair: 'USD/ZAR', type: 'nonJpyCross' },
  { pair: 'XAG/USD (Silver)', type: 'metal' }, { pair: 'XAU/USD (Gold)', type: 'metal' },
]

function PositionCalc() {
  const { state } = useStore()
  const acct = state.accounts.find((a) => a.id === state.activeAccountId)
  const [balance, setBalance] = useState(acct ? acct.startingBalance : 10000)
  const [riskPct, setRiskPct] = useState(state.riskPlan.riskPerTradePct)
  const [selectedPair, setSelectedPair] = useState('EUR/USD')
  const [stopPipsInput, setStopPipsInput] = useState('')
  const [calculated, setCalculated] = useState(false)
  const [accountCurrency, setAccountCurrency] = useState('USD')

  const pairInfo = FOREX_PAIRS.find((p) => p.pair === selectedPair) || FOREX_PAIRS[0]
  const riskAmt = balance * riskPct / 100

  function getPipValue() {
    switch (pairInfo.type) {
      case 'usdQuote': return 10
      case 'usdBase': return 10
      case 'jpyQuote': return 6.1
      case 'nonJpyCross': return 10
      case 'cfd': return 10
      case 'crypto': return 1
      case 'metal': return selectedPair.includes('XAG') ? 50 : 10
      default: return 10
    }
  }

  const pipValue = getPipValue()

  const standardLots = (Number(stopPipsInput) > 0 && pipValue > 0 && riskAmt > 0)
    ? riskAmt / (Number(stopPipsInput) * pipValue) : null
  const units = standardLots != null ? standardLots * 100000 : null
  const miniLots = standardLots != null ? standardLots * 10 : null
  const microLots = standardLots != null ? standardLots * 100 : null
  const nanoLots = standardLots != null ? standardLots * 1000 : null

  const doCalculate = () => {
    if (Number(stopPipsInput) > 0 && balance > 0) setCalculated(true)
  }

  return (
    <Card title='Lot Size Calculator'>
      <div className='grid gap-3 sm:grid-cols-2'>
        <div className='space-y-3'>
          <Field label='Currency Pair'>
            <select className={inputCls} value={selectedPair} onChange={(e) => { setSelectedPair(e.target.value); setCalculated(false) }}>
              {FOREX_PAIRS.map((p) => <option key={p.pair} value={p.pair}>{p.pair}</option>)}
            </select>
          </Field>
          <Field label='Account Currency'>
            <select className={inputCls} value={accountCurrency} onChange={(e) => setAccountCurrency(e.target.value)}>
              <option value='USD'>USD</option><option value='EUR'>EUR</option><option value='GBP'>GBP</option>
            </select>
          </Field>
          <Field label='Account Balance'>
            <input type='number' className={inputCls} value={balance} onChange={(e) => { setBalance(Number(e.target.value)); setCalculated(false) }} />
          </Field>
          <Field label='Risk %'>
            <input type='number' step='any' className={inputCls} value={riskPct} onChange={(e) => { setRiskPct(Number(e.target.value)); setCalculated(false) }} />
          </Field>
          <Field label='Stop Loss in Pips'>
            <input type='number' step='any' className={inputCls} value={stopPipsInput} onChange={(e) => { setStopPipsInput(e.target.value); setCalculated(false) }} placeholder='e.g. 10' />
          </Field>
          <button className={btnPrimary} onClick={doCalculate} disabled={!Number(stopPipsInput)}>Calculate</button>
        </div>

        <div className='space-y-3'>
          {calculated && standardLots != null ? (
            <>
              <div className='rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3 text-center'>
                <div className='text-2xl font-bold text-indigo-500 tabular-nums'>{standardLots.toFixed(4)}</div>
                <div className='text-xs text-slate-400'>Standard Lots</div>
              </div>
              <div className='grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800/60'>
                <div><div className='text-xs text-slate-500'>Risk</div><div className='font-semibold tabular-nums'>{fmtMoney(riskAmt, accountCurrency)}</div></div>
                <div><div className='text-xs text-slate-500'>Units</div><div className='font-semibold tabular-nums text-indigo-500'>{units != null ? units.toFixed(0) : '—'}</div></div>
                <div><div className='text-xs text-slate-500'>Mini Lots</div><div className='font-semibold tabular-nums'>{miniLots != null ? miniLots.toFixed(4) : '—'}</div></div>
                <div><div className='text-xs text-slate-500'>Micro Lots</div><div className='font-semibold tabular-nums'>{microLots != null ? microLots.toFixed(4) : '—'}</div></div>
                <div className='col-span-2'>
                  <div className='text-xs text-slate-500'>Nano Lots</div>
                  <div className='font-semibold tabular-nums'>{nanoLots != null ? nanoLots.toFixed(4) : '—'}</div>
                </div>
              </div>
              <div className='rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-2 text-[10px] text-slate-500'>
                <p>Pip value: <span className='font-semibold tabular-nums'>{fmtMoney(pipValue, accountCurrency)}</span> per standard lot</p>
                <p>1 standard lot = 100,000 units · 1 mini lot = 10,000 units · 1 micro lot = 1,000 units · 1 nano lot = 100 units</p>
              </div>
            </>
          ) : (
            <div className='flex h-full items-center justify-center rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400 dark:border-slate-700'>
              <div><div className='mb-1 text-3xl'>📏</div><p>Enter your account details and stop loss in pips, then click Calculate.</p></div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

function LossLimits({ trades }) {
  const { state } = useStore()
  const today = localDay(new Date().toISOString())
  const now = new Date()
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0, 0, 0, 0)
  const closed = trades.filter(isClosed)
  const todayPnl = closed.filter((t) => localDay(t.exitDate) === today).reduce((s, t) => s + (tradePnl(t) || 0), 0)
  const weekPnl = closed.filter((t) => new Date(t.exitDate) >= weekStart).reduce((s, t) => s + (tradePnl(t) || 0), 0)
  const bar = (used, limit, label) => {
    const pct = clampPct(Math.max(0, -used) / (limit || 1) * 100)
    const tone = pct >= 100 ? 'bg-rose-600' : pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
    return (
      <div>
        <div className='mb-1 flex justify-between text-xs'><span>{label}</span><span className={pnlColor(used)}>{fmtMoney(used)} / limit {fmtMoney(-limit)}</span></div>
        <div className='h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700'><div className={cx('h-full transition-all', tone)} style={{ width: pct + '%' }} /></div>
        {pct >= 75 && <p className={cx('mt-1 text-xs', pct >= 100 ? 'text-rose-500' : 'text-amber-500')}>{pct >= 100 ? 'Limit hit — stop trading for the period.' : 'Approaching your loss limit.'}</p>}
      </div>
    )
  }
  return (
    <Card title='Loss-limit tracker'>
      <div className='space-y-3'>
        {bar(todayPnl, state.riskPlan.dailyLossLimit, 'Today')}
        {bar(weekPnl, state.riskPlan.weeklyLossLimit, 'This week')}
      </div>
    </Card>
  )
}

function CashflowPanel() {
  const { state, addCashflow, deleteCashflow } = useStore()
  const [form, setForm] = useState({ type: 'deposit', amount: '', date: '' })
  const flows = state.cashflows.filter((c) => c.accountId === state.activeAccountId)
  const add = () => {
    if (!form.amount || !form.date) return
    const amt = Math.abs(Number(form.amount)) * (form.type === 'withdrawal' ? -1 : 1)
    addCashflow({ accountId: state.activeAccountId, amount: amt, date: form.date, type: form.type })
    setForm({ type: 'deposit', amount: '', date: '' })
  }
  return (
    <Card title='Deposits & withdrawals'>
      <div className='flex flex-wrap items-end gap-2'>
        <Field label='Type'><select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value='deposit'>Deposit</option><option value='withdrawal'>Withdrawal</option></select></Field>
        <Field label='Amount'><input type='number' className={inputCls} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
        <Field label='Date'><input type='date' className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
        <button className={btnPrimary} onClick={add}>Add</button>
      </div>
      <ul className='mt-3 space-y-1 text-sm'>
        {flows.length === 0 && <li className='text-xs text-slate-400'>No cash movements logged.</li>}
        {flows.map((c) => (
          <li key={c.id} className='flex items-center justify-between border-t border-slate-100 py-1 dark:border-slate-800'>
            <span>{c.date} · {c.type}</span>
            <span className='flex items-center gap-2'><span className={pnlColor(c.amount)}>{fmtMoney(c.amount)}</span><button className={btnDanger} onClick={() => deleteCashflow(c.id)}>✕</button></span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function Goals({ trades }) {
  const { state } = useStore()
  const now = new Date()
  const monthPnl = trades.filter(isClosed)
    .filter((t) => { const d = new Date(t.exitDate); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() })
    .reduce((s, t) => s + (tradePnl(t) || 0), 0)
  const maxDd = Math.abs(drawdownSeries(equityCurve(trades, 0, [])).maxDd)
  const pnlPct = clampPct(monthPnl / (state.goals.monthlyPnlTarget || 1) * 100)
  const ddPct = clampPct(maxDd / (state.goals.maxDrawdownTarget || 1) * 100)
  return (
    <Card title='Goals'>
      <div className='space-y-4 text-sm'>
        <div>
          <div className='mb-1 flex justify-between text-xs'><span>Monthly P&L target</span><span>{fmtMoney(monthPnl)} / {fmtMoney(state.goals.monthlyPnlTarget)}</span></div>
          <div className='h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-700'><div className='h-full rounded-full bg-indigo-500' style={{ width: pnlPct + '%' }} /></div>
        </div>
        <div>
          <div className='mb-1 flex justify-between text-xs'><span>Max drawdown budget</span><span>{maxDd.toFixed(1)}% / {state.goals.maxDrawdownTarget}%</span></div>
          <div className='h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-700'><div className={cx('h-full rounded-full', ddPct >= 100 ? 'bg-rose-600' : 'bg-amber-500')} style={{ width: ddPct + '%' }} /></div>
        </div>
      </div>
    </Card>
  )
}

function RiskView({ trades }) {
  return (
    <div className='grid gap-4 lg:grid-cols-2'>
      <PositionCalc /><LossLimits trades={trades} /><CashflowPanel /><Goals trades={trades} />
    </div>
  )
}

/* ============================ Psychology layer ============================ */
function PsychologyView({ trades, setFilters }) {
  const { state } = useStore()
  const closed = trades.filter(isClosed)

  const moodRows = state.tags.emotions.map((emo) => {
    const withTag = closed.filter((t) => (t.emotions || []).includes(emo))
    const s = stats(withTag)
    return { emo, count: s.count, pnl: s.totalPnl, winRate: s.winRate, avg: s.count ? s.totalPnl / s.count : 0 }
  }).filter((r) => r.count > 0)

  const withPlan = closed.filter((t) => t.followedPlan)
  const followed = withPlan.filter((t) => t.followedPlan === 'yes')
  const broke = withPlan.filter((t) => t.followedPlan === 'no')
  const sFollowed = stats(followed)
  const sBroke = stats(broke)
  const planned = stats(closed.filter((t) => t.planned))
  const unplanned = stats(closed.filter((t) => !t.planned))

  return (
    <div className='space-y-4'>
      <div className='grid gap-4 lg:grid-cols-2'>
        <Card title='Mood vs performance (avg P&L by emotion)'>
          {moodRows.length ? (
            <ResponsiveContainer width='100%' height={240}>
              <BarChart data={moodRows} layout='vertical' margin={{ left: 20 }}>
                <CartesianGrid stroke={GRID} horizontal={false} />
                <XAxis type='number' tick={{ fontSize: 11, fill: AXIS }} />
                <YAxis type='category' dataKey='emo' width={80} tick={{ fontSize: 11, fill: AXIS }} />
                <Tooltip contentStyle={tipStyle} />
                <Bar dataKey='avg' name='Avg P&L' cursor='pointer'
                onClick={(data) => setFilters((f) => ({ ...f, emotion: data.emo, dayOfWeek: '', hour: '' }))}>
                {moodRows.map((d, i) => <Cell key={i} fill={d.avg >= 0 ? '#10b981' : '#f43f5e'} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty icon='🧠' title='No emotion tags yet' hint='Tag emotions on your trades to see how they affect performance.' />}
        </Card>
        <Card title='Rule adherence'>
          <div className='grid grid-cols-2 gap-3 text-sm'>
            <div className='cursor-pointer rounded-lg border border-emerald-500/30 p-3 transition-colors hover:bg-emerald-500/5'
              onClick={() => setFilters((f) => ({ ...f, strategy: '__planned_yes__', dayOfWeek: '', hour: '' }))}>
              <div className='text-xs text-slate-500'>Followed plan</div>
              <div className='text-lg font-semibold text-emerald-500'>{followed.length} trades</div>
              <div className='text-xs'>Win {fmtPct(sFollowed.winRate)} · {fmtMoney(sFollowed.totalPnl)}</div>
            </div>
            <div className='cursor-pointer rounded-lg border border-rose-500/30 p-3 transition-colors hover:bg-rose-500/5'
              onClick={() => setFilters((f) => ({ ...f, strategy: '__planned_no__', dayOfWeek: '', hour: '' }))}>
              <div className='text-xs text-slate-500'>Broke plan</div>
              <div className='text-lg font-semibold text-rose-500'>{broke.length} trades</div>
              <div className='text-xs'>Win {fmtPct(sBroke.winRate)} · {fmtMoney(sBroke.totalPnl)}</div>
            </div>
          </div>
          <div className='mt-4 grid grid-cols-2 gap-3 text-sm'>
            <div><div className='text-xs text-slate-500'>Planned expectancy</div><div className={cx('font-semibold', pnlColor(planned.expectancy))}>{fmtMoney(planned.expectancy)}</div></div>
            <div><div className='text-xs text-slate-500'>Unplanned expectancy</div><div className={cx('font-semibold', pnlColor(unplanned.expectancy))}>{fmtMoney(unplanned.expectancy)}</div></div>
          </div>
        </Card>
      </div>

      <Card title='Setup / tag correlation (win rate by strategy)'>
        {closed.length ? (
          <div className='grid gap-2 md:grid-cols-2'>
            {groupStats(trades, (t) => t.strategy || 'Untagged').map((g) => (
              <div key={g.key} className='flex items-center gap-3 text-sm'>
                <span className='w-28 truncate'>{g.key}</span>
                <div className='h-2.5 flex-1 rounded-full bg-slate-200 dark:bg-slate-700'><div className='h-full rounded-full bg-indigo-500' style={{ width: g.winRate + '%' }} /></div>
                <span className='w-24 text-right text-xs text-slate-500'>{fmtPct(g.winRate)} · {g.count}</span>
              </div>
            ))}
          </div>
        ) : <Empty title='No closed trades' hint='Correlations appear once you have logged some results.' />}
      </Card>
    </div>
  )
}

/* ============================ Reports & export ============================ */
const TRADE_CSV_COLS = ['symbol', 'assetClass', 'direction', 'entryDate', 'exitDate', 'entryPrice', 'exitPrice', 'size', 'leverage', 'stopLoss', 'takeProfit', 'fees', 'strategy', 'grade', 'pnl', 'rMultiple', 'notes']

function exportTradesCsv(trades) {
  const records = trades.map((t) => ({ ...t, pnl: tradePnl(t) ?? '', rMultiple: rMultiple(t) != null ? rMultiple(t).toFixed(3) : '' }))
  download('trades.csv', toCsv(TRADE_CSV_COLS, records))
}

function ReportRow({ t }) {
  return (
    <div className='flex items-center justify-between border-t border-slate-100 py-1 text-sm dark:border-slate-800'>
      <span>{t.symbol} · {t.exitDate ? t.exitDate.slice(0, 10) : ''}</span>
      <span className={cx('tabular-nums', pnlColor(t.pnl))}>{fmtMoney(t.pnl)}</span>
    </div>
  )
}

function StatCard({ label, value, sub, tone }) {
  return (
    <div className='rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900'>
      <div className='text-xs text-slate-500'>{label}</div>
      <div className={cx('mt-1 text-xl font-semibold tabular-nums', tone)}>{value}</div>
      {sub && <div className='mt-0.5 text-xs text-slate-400'>{sub}</div>}
    </div>
  )
}

function ReportsView({ trades }) {
  const { state } = useStore()
  const s = stats(trades)
  const closed = trades.filter(isClosed)
  const withPnl = closed.map((t) => ({ ...t, pnl: tradePnl(t) })).sort((a, b) => b.pnl - a.pnl)
  const best = withPnl.slice(0, 5)
  const worst = withPnl.slice(-5).reverse()
  const acct = state.accounts.find((a) => a.id === state.activeAccountId)

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap gap-2 no-print'>
        <button className={btnPrimary} onClick={() => window.print()}>🖨 Print / Save as PDF</button>
        <button className={btnGhost} onClick={() => exportTradesCsv(closed)}>⬇ Export trades CSV</button>
        <button className={btnGhost} onClick={() => download('journal-backup.json', db.exportJson(), 'application/json')}>⬇ Backup JSON</button>
      </div>

      <div className='print-block'>
        <h2 className='mb-1 text-xl font-bold'>Performance report</h2>
        <p className='mb-4 text-sm text-slate-500'>{acct ? acct.name : ''} · generated {new Date().toLocaleDateString()}</p>
        <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
          <StatCard label='Net P&L' value={fmtMoney(s.totalPnl)} tone={pnlColor(s.totalPnl)} />
          <StatCard label='Win rate' value={fmtPct(s.winRate)} sub={s.count + ' trades'} />
          <StatCard label='Profit factor' value={s.profitFactor === Infinity ? '∞' : s.profitFactor.toFixed(2)} />
          <StatCard label='Expectancy' value={fmtMoney(s.expectancy)} />
        </div>
        <div className='mt-4 grid gap-4 md:grid-cols-2'>
          <Card title='Best trades'>{best.length ? best.map((t) => <ReportRow key={t.id} t={t} />) : <p className='text-xs text-slate-400'>None</p>}</Card>
          <Card title='Worst trades'>{worst.length ? worst.map((t) => <ReportRow key={t.id} t={t} />) : <p className='text-xs text-slate-400'>None</p>}</Card>
        </div>
      </div>

      <Card title='Broker API sync (placeholder)'>
        <p className='text-sm text-slate-500'>Wire a broker/exchange API here to auto-import fills. Because the data layer in <code>lib/storage.js</code> is isolated, a real integration only needs to call <code>importTrades()</code>.</p>
        <button className={cx(btnGhost, 'mt-2')} disabled>Connect broker (coming soon)</button>
      </Card>
    </div>
  )
}

/* ============================ AI Trading Coach ============================ */
function CoachView({ trades }) {
  const insights = useMemo(() => generateInsights(trades), [trades])

  if (!insights.length) {
    return (
      <Empty
        icon='🤖'
        title='No coaching insights yet'
        hint='Insights are generated as you trade. To get recommendations, please log at least 2 closed trades with strategies, days, sessions, or emotions tagged.'
      />
    )
  }

  const counts = insights.reduce(
    (acc, ins) => {
      acc[ins.type] = (acc[ins.type] || 0) + 1
      return acc
    },
    { success: 0, warning: 0, opportunity: 0 }
  )

  const getThemeClasses = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
          border: 'border-emerald-200 dark:border-emerald-800/60',
          title: 'text-emerald-800 dark:text-emerald-400',
          icon: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40',
          badge: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40',
          iconGlyph: '✓'
        }
      case 'warning':
        return {
          bg: 'bg-rose-50/50 dark:bg-rose-950/20',
          border: 'border-rose-200 dark:border-rose-800/60',
          title: 'text-rose-800 dark:text-rose-400',
          icon: 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/40',
          badge: 'bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/40',
          iconGlyph: '⚠'
        }
      case 'opportunity':
      default:
        return {
          bg: 'bg-indigo-50/50 dark:bg-indigo-950/20',
          border: 'border-indigo-200 dark:border-indigo-800/60',
          title: 'text-indigo-800 dark:text-indigo-400',
          icon: 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/40',
          badge: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40',
          iconGlyph: '💡'
        }
    }
  }

  return (
    <div className='space-y-4'>
      {/* Overview Cards */}
      <div className='grid grid-cols-3 gap-3 md:max-w-xl'>
        <div className='rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-center'>
          <div className='text-xs text-slate-500'>Strengths</div>
          <div className='mt-1 text-2xl font-bold text-emerald-500'>{counts.success}</div>
        </div>
        <div className='rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-center'>
          <div className='text-xs text-slate-500'>Vulnerabilities</div>
          <div className='mt-1 text-2xl font-bold text-rose-500'>{counts.warning}</div>
        </div>
        <div className='rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-center'>
          <div className='text-xs text-slate-500'>Opportunities</div>
          <div className='mt-1 text-2xl font-bold text-indigo-500'>{counts.opportunity}</div>
        </div>
      </div>

      {/* Main Insights Stack */}
      <div className='space-y-3'>
        {insights.map((ins, idx) => {
          const cls = getThemeClasses(ins.type)
          return (
            <div key={idx} className={cx('flex items-start gap-4 rounded-xl border p-4 shadow-sm', cls.bg, cls.border)}>
              <div className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg font-bold', cls.icon)}>
                {cls.iconGlyph}
              </div>
              <div className='flex-1 space-y-1'>
                <div className='flex items-center justify-between gap-2 flex-wrap'>
                  <h4 className={cx('font-semibold text-sm md:text-base', cls.title)}>{ins.title}</h4>
                  {ins.value && (
                    <span className={cx('rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums', cls.badge)}>
                      {ins.value}
                    </span>
                  )}
                </div>
                <p className='text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed'>
                  {ins.text}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Architecture Disclaimer */}
      <div className='rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/40 p-4 text-xs text-slate-500 dark:text-slate-400 no-print flex flex-col md:flex-row md:items-center justify-between gap-2'>
        <span>
          ⚙️ <b>Architecture Note:</b> This coaching module runs on a high-speed, local rule-based inference engine.
        </span>
        <span className='font-medium text-indigo-500 dark:text-indigo-400'>
          Ready for LLM Integration (Claude Sonnet 3.5 / Haiku API)
        </span>
      </div>
    </div>
  )
}

/* ============================ Discipline Score ============================ */
function ProgressRing({ pct = 0, size = 120, strokeWidth = 10, label, sub, color }) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(pct, 100) / 100) * circ
  const resolvedColor = color || (pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : pct >= 40 ? '#f97316' : '#ef4444')
  const bgColor = 'rgba(148,163,184,0.2)'

  return (
    <div className='flex flex-col items-center gap-1.5'>
      <svg width={size} height={size} className='drop-shadow-sm'>
        <circle cx={size / 2} cy={size / 2} r={r} fill='none' stroke={bgColor} strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={r} fill='none' stroke={resolvedColor} strokeWidth={strokeWidth}
          strokeLinecap='round' strokeDasharray={circ} strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className='transition-all duration-700 ease-out' />
        <text x={size / 2} y={size / 2} textAnchor='middle' dominantBaseline='central'
          className='fill-current font-bold' fontSize={size * 0.28} style={{ color: resolvedColor }}>
          {pct}%
        </text>
      </svg>
      {label && <span className='text-xs font-semibold text-slate-500 dark:text-slate-400'>{label}</span>}
      {sub && <span className='text-[10px] text-slate-400'>{sub}</span>}
    </div>
  )
}

function DisciplineScoreView({ trades }) {
  const { state } = useStore()
  const acct = state.accounts.find((a) => a.id === state.activeAccountId)
  const balance = acct ? acct.startingBalance : 10000
  // Incorporate cashflows for a rough current balance
  const netCashflow = state.cashflows
    .filter((c) => c.accountId === state.activeAccountId)
    .reduce((s, c) => s + Number(c.amount), 0)
  const currentBalance = balance + netCashflow
  const riskPlan = state.riskPlan

  const agg = useMemo(() => aggregateScores(trades, riskPlan, currentBalance), [trades, riskPlan, currentBalance])
  const breakdown = useMemo(() => scoreBreakdown(trades, riskPlan, currentBalance), [trades, riskPlan, currentBalance])

  const gradeLabel = (pct) => pct >= 90 ? 'Excellent' : pct >= 80 ? 'Great' : pct >= 70 ? 'Good' : pct >= 60 ? 'Fair' : pct >= 40 ? 'Needs Work' : 'Struggling'
  const gradeSub = (pct) => pct >= 90 ? 'Elite discipline' : pct >= 80 ? 'Strong habits' : pct >= 70 ? 'Room to improve' : pct >= 60 ? 'Be more consistent' : pct >= 40 ? 'Focus on the basics' : 'Reset your routine'

  const last20 = breakdown.slice(0, 20)

  if (!agg.overall.count) {
    return <Empty icon='🎯' title='No closed trades yet' hint='Close a few trades with plan adherence, journaling, and emotions tagged to build your discipline score.' />
  }

  return (
    <div className='space-y-4'>
      {/* Big 4 rings */}
      <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
        <ProgressRing pct={agg.overall.pct} size={140} strokeWidth={12} label={gradeLabel(agg.overall.pct)}
          sub={`${agg.overall.count} trades · Overall`} />
        <ProgressRing pct={agg.today.pct} size={140} strokeWidth={12} label='Today'
          sub={agg.today.count ? `${agg.today.count} trades` : 'No trades'} />
        <ProgressRing pct={agg.thisWeek.pct} size={140} strokeWidth={12} label='This Week'
          sub={agg.thisWeek.count ? `${agg.thisWeek.count} trades` : 'No trades'} />
        <ProgressRing pct={agg.thisMonth.pct} size={140} strokeWidth={12} label='This Month'
          sub={agg.thisMonth.count ? `${agg.thisMonth.count} trades` : 'No trades'} />
      </div>

      {/* Grade description */}
      <div className='rounded-xl border border-slate-200 bg-gradient-to-r from-indigo-500/5 to-slate-50 p-4 text-center dark:border-slate-800 dark:from-indigo-950/20 dark:to-slate-900'>
        <span className='text-2xl font-bold' style={{ color: agg.overall.pct >= 80 ? '#10b981' : agg.overall.pct >= 60 ? '#f59e0b' : agg.overall.pct >= 40 ? '#f97316' : '#ef4444' }}>
          {gradeLabel(agg.overall.pct)}
        </span>
        <p className='mt-1 text-sm text-slate-500'>{gradeSub(agg.overall.pct)}</p>
      </div>

      {/* Daily history sparkline table */}
      {agg.dailyHistory.length > 0 && (
        <div className='rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900'>
          <h3 className='mb-3 text-sm font-semibold text-slate-500 dark:text-slate-400'>Daily Score History</h3>
          <div className='flex flex-wrap gap-1.5'>
            {agg.dailyHistory.slice(-30).map((d) => (
              <div key={d.date} className='flex flex-col items-center' title={`${d.date} — ${d.pct}% (${d.count} trades)`}>
                <div className='relative h-16 w-5 rounded-md bg-slate-100 dark:bg-slate-800' style={{ overflow: 'hidden' }}>
                  <div className='absolute bottom-0 left-0 right-0 rounded-b-md transition-all duration-500'
                    style={{ height: Math.max(4, d.pct) + '%', backgroundColor: d.pct >= 80 ? '#10b981' : d.pct >= 60 ? '#f59e0b' : d.pct >= 40 ? '#f97316' : '#ef4444' }}>
                  </div>
                </div>
                <span className='mt-0.5 text-[9px] text-slate-400'>{d.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-criteria breakdown of the most recent trades */}
      {last20.length > 0 && (
        <div className='rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className='bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60'>
                <tr>
                  <th className='px-3 py-2'>Trade</th>
                  <th className='px-3 py-2'>Score</th>
                  <th className='px-3 py-2 hidden md:table-cell'>Plan</th>
                  <th className='px-3 py-2 hidden md:table-cell'>Size</th>
                  <th className='px-3 py-2 hidden md:table-cell'>Stop</th>
                  <th className='px-3 py-2 hidden md:table-cell'>Journal</th>
                  <th className='px-3 py-2 hidden md:table-cell'>Emotions</th>
                  <th className='px-3 py-2'>Date</th>
                </tr>
              </thead>
              <tbody>
                {last20.map((r) => {
                  const t = r.trade
                  const missingClass = 'text-slate-300 dark:text-slate-600'
                  return (
                    <tr key={t.id} className='border-t border-slate-100 dark:border-slate-800'>
                      <td className='px-3 py-1.5 font-medium'>{t.symbol}</td>
                      <td className='px-3 py-1.5 tabular-nums font-semibold'
                        style={{ color: r.total >= 80 ? '#10b981' : r.total >= 60 ? '#f59e0b' : '#ef4444' }}>
                        {r.total}
                      </td>
                      <td className={cx('px-3 py-1.5 tabular-nums hidden md:table-cell', r.followedPlan ? 'text-emerald-500' : missingClass)}>{r.followedPlan}</td>
                      <td className={cx('px-3 py-1.5 tabular-nums hidden md:table-cell', r.correctSize ? 'text-emerald-500' : missingClass)}>{r.correctSize}</td>
                      <td className={cx('px-3 py-1.5 tabular-nums hidden md:table-cell', r.stopRespected ? 'text-emerald-500' : missingClass)}>{r.stopRespected}</td>
                      <td className={cx('px-3 py-1.5 tabular-nums hidden md:table-cell', r.journalCompleted ? 'text-emerald-500' : missingClass)}>{r.journalCompleted}</td>
                      <td className={cx('px-3 py-1.5 tabular-nums hidden md:table-cell', r.noEmotionalMistakes ? 'text-emerald-500' : missingClass)}>{r.noEmotionalMistakes}</td>
                      <td className='px-3 py-1.5 text-slate-500'>{t.exitDate ? t.exitDate.slice(0, 10) : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className='border-t border-slate-100 px-3 py-2 text-xs text-slate-400 dark:border-slate-800'>{breakdown.length} trade{breakdown.length !== 1 ? 's' : ''} scored · Each criterion worth 20 pts (max 100/trade).</p>
        </div>
      )}
    </div>
  )
}
function ListEditor({ label, items = [], onChange }) {
  const [val, setVal] = useState('')
  const addItem = () => { if (val.trim()) { onChange([...items, val.trim()]); setVal('') } }
  return (
    <div>
      <div className='mb-2 flex flex-wrap gap-1.5'>
        {items.map((it, i) => (
          <span key={i} className='flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800'>
            {it}<button className='text-slate-400 hover:text-rose-500' onClick={() => onChange(items.filter((_, j) => j !== i))}>✕</button>
          </span>
        ))}
      </div>
      <div className='flex gap-2'>
        <input className={inputCls} value={val} onChange={(e) => setVal(e.target.value)} placeholder={'Add ' + label.toLowerCase() + '…'}
          onKeyDown={(e) => { if (e.key === 'Enter') addItem() }} />
        <button className={btnGhost} onClick={addItem}>Add</button>
      </div>
    </div>
  )
}

/* ============================ Session Analysis ============================ */
const SESSION_ORDER = ['Sydney', 'Tokyo', 'London', 'London/NY Overlap', 'New York', 'Other']

function SessionAnalysisView({ trades }) {
  const closed = trades.filter(isClosed)
  const metrics = useMemo(() => sessionMetrics(closed), [closed])
  const dayHeat = useMemo(() => sessionDayHeatmap(closed), [closed])

  if (!metrics.length) {
    return <Empty icon='🌍' title='No closed trades to analyze' hint='Close a trade with entry/exit timestamps to see session breakdown.' />
  }

  const maxCount = Math.max(1, ...metrics.map((m) => m.count))
  const maxPnl = Math.max(1, ...metrics.map((m) => Math.abs(m.pnl)))

  return (
    <div className='space-y-4'>
      {/* Summary cards */}
      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <div className={cx(card, 'p-3')}>
          <div className='text-xs text-slate-500'>Best Session</div>
          <div className='mt-1 text-lg font-semibold'>
            {metrics.filter((m) => m.session !== 'Other').sort((a, b) => b.pnl - a.pnl)[0]?.session || '—'}
          </div>
          <div className='mt-0.5 text-xs text-slate-400'>
            {(() => {
              const best = metrics.filter((m) => m.session !== 'Other').sort((a, b) => b.pnl - a.pnl)[0]
              return best ? fmtMoney(best.pnl) + ' net' : ''
            })()}
          </div>
        </div>
        <div className={cx(card, 'p-3')}>
          <div className='text-xs text-slate-500'>Worst Session</div>
          <div className='mt-1 text-lg font-semibold'>
            {metrics.filter((m) => m.session !== 'Other').sort((a, b) => a.pnl - b.pnl)[0]?.session || '—'}
          </div>
          <div className='mt-0.5 text-xs text-slate-400'>
            {(() => {
              const worst = metrics.filter((m) => m.session !== 'Other').sort((a, b) => a.pnl - b.pnl)[0]
              return worst ? fmtMoney(worst.pnl) + ' net' : ''
            })()}
          </div>
        </div>
        <div className={cx(card, 'p-3')}>
          <div className='text-xs text-slate-500'>Most Active Session</div>
          <div className='mt-1 text-lg font-semibold'>
            {metrics.filter((m) => m.session !== 'Other').sort((a, b) => b.count - a.count)[0]?.session || '—'}
          </div>
          <div className='mt-0.5 text-xs text-slate-400'>
            {metrics.filter((m) => m.session !== 'Other').sort((a, b) => b.count - a.count)[0]?.count || 0} trades
          </div>
        </div>
        <div className={cx(card, 'p-3')}>
          <div className='text-xs text-slate-500'>Avg Holding Time</div>
          <div className='mt-1 text-2xl font-bold tabular-nums'>
            {fmtHolding(metrics.reduce((s, m) => s + (m.avgHolding || 0), 0) / metrics.length)}
          </div>
          <div className='mt-0.5 text-xs text-slate-400'>across all sessions</div>
        </div>
      </div>

      {/* Main session breakdown table */}
      <div className={cx(card)}>
        <div className='border-b border-slate-200 px-4 py-3 dark:border-slate-800'>
          <h3 className='text-sm font-semibold text-slate-500 dark:text-slate-400'>Session Breakdown</h3>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60'>
              <tr>
                <th className='px-4 py-2'>Session</th>
                <th className='px-3 py-2'>Trades</th>
                <th className='px-3 py-2'>Win Rate</th>
                <th className='px-3 py-2'>Avg R</th>
                <th className='px-3 py-2'>Avg Holding</th>
                <th className='px-3 py-2'>Profit Factor</th>
                <th className='px-3 py-2'>Net P&L</th>
              </tr>
            </thead>
            <tbody>
              {SESSION_ORDER.filter((s) => metrics.find((m) => m.session === s)).map((sessionName) => {
                const m = metrics.find((r) => r.session === sessionName)
                if (!m) return null
                const barW = maxCount ? (m.count / maxCount) * 100 : 0
                const pnlBar = maxPnl ? (Math.abs(m.pnl) / maxPnl) * 100 : 0
                return (
                  <tr key={m.session} className='border-t border-slate-100 dark:border-slate-800'>
                    <td className='px-4 py-2 font-medium'>{m.session}</td>
                    <td className='px-3 py-2 tabular-nums'>
                      <div className='flex items-center gap-2'>
                        <span className='w-6 text-right'>{m.count}</span>
                        <div className='h-2 w-16 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700'>
                          <div className='h-full rounded-full bg-indigo-500' style={{ width: barW + '%' }} />
                        </div>
                      </div>
                    </td>
                    <td className={cx('px-3 py-2 tabular-nums', m.winRate >= 50 ? 'text-emerald-500' : 'text-rose-500')}>{fmtPct(m.winRate)}</td>
                    <td className={cx('px-3 py-2 tabular-nums', m.avgR > 0 ? 'text-emerald-500' : m.avgR < 0 ? 'text-rose-500' : '')}>
                      {m.avgR.toFixed(2)}R
                    </td>
                    <td className='px-3 py-2 tabular-nums text-slate-600 dark:text-slate-300'>{fmtHolding(m.avgHolding)}</td>
                    <td className='px-3 py-2 tabular-nums'>{m.profitFactor === Infinity ? '∞' : m.profitFactor.toFixed(2)}</td>
                    <td className={cx('px-3 py-2 tabular-nums', pnlColor(m.pnl))}>
                      <div className='flex items-center justify-end gap-2'>
                        <span>{fmtMoney(m.pnl)}</span>
                        <div className='h-2 w-12 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700'>
                          <div className={cx('h-full rounded-full', m.pnl >= 0 ? 'bg-emerald-500' : 'bg-rose-500')}
                            style={{ width: pnlBar + '%', marginLeft: m.pnl >= 0 ? '0%' : 'auto' }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Heatmap grid: sessions × days of week */}
      {metrics.length > 1 && (
        <div className={cx(card, 'p-4')}>
          <h3 className='mb-3 text-sm font-semibold text-slate-500 dark:text-slate-400'>Session × Day of Week Heatmap</h3>
          <p className='mb-3 text-xs text-slate-400'>Average P&L per trade. Color intensity = magnitude. Green = profit, red = loss.</p>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className='text-left text-xs uppercase tracking-wide text-slate-500'>
                <tr>
                  <th className='px-2 py-1'>Session</th>
                  {DOW.map((d) => <th key={d} className='px-2 py-1 text-right'>{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {SESSION_ORDER.filter((s) => metrics.find((m) => m.session === s) && s !== 'Other').map((session) => {
                  const dayPnls = DOW.map((_, dayIdx) => {
                    const dayTrades = closed.filter((t) => {
                      const d = new Date(t.exitDate || t.entryDate)
                      return classifySession(t) === session && d.getDay() === dayIdx
                    })
                    if (!dayTrades.length) return null
                    const total = dayTrades.reduce((s, t) => s + (tradePnl(t) || 0), 0)
                    return { avg: total / dayTrades.length, count: dayTrades.length }
                  })
                  const maxHeat = Math.max(1, ...dayPnls.filter(Boolean).map((d) => Math.abs(d.avg)))
                  return (
                    <tr key={session} className='border-t border-slate-100 dark:border-slate-800'>
                      <td className='px-2 py-1.5 font-medium text-slate-500'>{session}</td>
                      {dayPnls.map((d, i) => {
                          if (!d) return <td key={i} className='px-2 py-1.5 text-right text-slate-300 dark:text-slate-700'>·</td>
                          const intensity = 0.2 + 0.8 * Math.min(1, Math.abs(d.avg) / maxHeat)
                          return (
                            <td key={i} className='px-2 py-1.5 text-right tabular-nums text-xs font-medium'
                              style={{ backgroundColor: d.avg >= 0 ? `rgba(16,185,129,${intensity})` : `rgba(244,63,94,${intensity})`, color: intensity > 0.5 ? '#fff' : undefined }}>
                              {fmtMoney(d.avg)}
                            </td>
                          )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Holding time overview */}
      <div className={cx(card, 'p-4')}>
        <h3 className='mb-3 text-sm font-semibold text-slate-500 dark:text-slate-400'>Holding Time by Session</h3>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='text-left text-xs uppercase tracking-wide text-slate-500'>
              <tr>
                <th className='px-2 py-1'>Session</th>
                <th className='px-2 py-1 text-right'>Avg Holding</th>
                <th className='px-2 py-1 text-right'>Total Holding</th>
                <th className='px-2 py-1 text-right'>Min</th>
                <th className='px-2 py-1 text-right'>Max</th>
              </tr>
            </thead>
            <tbody>
              {SESSION_ORDER.filter((s) => metrics.find((m) => m.session === s)).map((sessionName) => {
                const m = metrics.find((r) => r.session === sessionName)
                if (!m || !m.avgHolding) return null
                const htValues = closed
                  .filter((t) => classifySession(t) === sessionName)
                  .map(holdingTime).filter((x) => x != null)
                const minH = htValues.length ? Math.min(...htValues) : null
                const maxH = htValues.length ? Math.max(...htValues) : null
                return (
                  <tr key={sessionName} className='border-t border-slate-100 dark:border-slate-800'>
                    <td className='px-2 py-1.5 font-medium'>{sessionName}</td>
                    <td className='px-2 py-1.5 text-right tabular-nums'>{fmtHolding(m.avgHolding)}</td>
                    <td className='px-2 py-1.5 text-right tabular-nums text-slate-500'>{fmtHolding(m.totalHolding)}</td>
                    <td className='px-2 py-1.5 text-right tabular-nums text-slate-500'>{minH != null ? fmtHolding(minH) : '—'}</td>
                    <td className='px-2 py-1.5 text-right tabular-nums text-slate-500'>{maxH != null ? fmtHolding(maxH) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scatter-like: session trade list */}
      <div className={cx(card)}>
        <div className='border-b border-slate-200 px-4 py-3 dark:border-slate-800'>
          <h3 className='text-sm font-semibold text-slate-500 dark:text-slate-400'>Recent Trades by Session</h3>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60'>
              <tr>
                <th className='px-4 py-2'>Date</th>
                <th className='px-3 py-2'>Symbol</th>
                <th className='px-3 py-2'>Session</th>
                <th className='px-3 py-2'>Holding</th>
                <th className='px-3 py-2'>P&L</th>
                <th className='px-3 py-2'>R</th>
              </tr>
            </thead>
            <tbody>
              {closed.sort((a, b) => new Date(b.exitDate || b.entryDate) - new Date(a.exitDate || a.entryDate)).slice(0, 30).map((t) => {
                const session = classifySession(t)
                const ht = holdingTime(t)
                const pnl = tradePnl(t)
                const r = rMultiple(t)
                return (
                  <tr key={t.id} className='border-t border-slate-100 dark:border-slate-800'>
                    <td className='px-4 py-1.5 text-slate-500'>{(t.exitDate || t.entryDate || '').slice(0, 10)}</td>
                    <td className='px-3 py-1.5 font-medium'>{t.symbol}</td>
                    <td className='px-3 py-1.5'>
                      <span className={cx('rounded-full px-2 py-0.5 text-xs font-medium',
                        session === 'Sydney' ? 'bg-amber-500/10 text-amber-400' :
                        session === 'Tokyo' ? 'bg-rose-500/10 text-rose-400' :
                        session === 'London' ? 'bg-blue-500/10 text-blue-400' :
                        session === 'London/NY Overlap' ? 'bg-purple-500/10 text-purple-400' :
                        session === 'New York' ? 'bg-emerald-500/10 text-emerald-400' :
                        'bg-slate-500/10 text-slate-400'
                      )}>{session}</span>
                    </td>
                    <td className='px-3 py-1.5 tabular-nums text-slate-500'>{fmtHolding(ht)}</td>
                    <td className={cx('px-3 py-1.5 tabular-nums', pnlColor(pnl || 0))}>{fmtMoney(pnl)}</td>
                    <td className={cx('px-3 py-1.5 tabular-nums', r != null && r > 0 ? 'text-emerald-500' : r != null && r < 0 ? 'text-rose-500' : '')}>
                      {r != null ? r.toFixed(2) + 'R' : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ============================ Professional Metrics ============================ */
const METRIC_EMOJI = {
  sharpe: '📈', sortino: '📉', calmar: '🛡️', recoveryFactor: '🔄',
  profitFactor: '💰', expectancy: '🎯', sqn: '⭐', kelly: '🧮',
  riskOfRuin: '💀', ulcerIndex: '🩹',
}

function ValueIndicator({ value, healthyRange }) {
  // Parse the healthy range to auto-color the value
  const isGood = (() => {
    if (value == null) return false
    // Simple heuristic: >= first number is "good"
    const m = healthyRange && healthyRange.match(/≥\s*([\d.]+)/)
    return m ? value >= parseFloat(m[1]) : false
  })()
  const isBad = (() => {
    if (value == null) return true
    const m = healthyRange && healthyRange.match(/<\s*([\d.]+)/)
    if (m) return value >= parseFloat(m[1]) * 3
    return false
  })()

  if (value == null) return <span className='text-slate-400 italic'>Insufficient data</span>

  if (typeof value === 'number' && !Number.isFinite(value) && value > 0) {
    return <span className='text-emerald-500 font-bold text-lg'>∞</span>
  }

  return (
    <span className={cx(
      'font-bold text-lg tabular-nums',
      isGood ? 'text-emerald-500' : isBad ? 'text-rose-500' : 'text-amber-500'
    )}>
      {typeof value === 'number' ? (value % 1 === 0 ? value : value.toFixed(2)) : value}
      {value === Infinity && ''}
    </span>
  )
}

function MetricCard({ metric, onToggle, expanded }) {
  if (!metric) return null
  const prefix = metric.value == null ? '' : typeof metric.value === 'number' && metric.key === 'kelly' ? '%' : metric.key === 'riskOfRuin' ? '%' : ''
  return (
    <div className={cx(card, 'p-4 transition-all')}>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex-1'>
          <div className='flex items-center gap-2'>
            <span className='text-lg'>{METRIC_EMOJI[metric.key] || '📊'}</span>
            <h3 className='font-semibold text-sm capitalize'>{metric.key.replace(/([A-Z])/g, ' $1').trim()}</h3>
          </div>
          <div className='mt-2'>
            <ValueIndicator value={metric.value} healthyRange={metric.healthyRange} />
            {prefix && <span className='text-xs text-slate-400 ml-0.5'>{prefix}</span>}
          </div>
          <div className='mt-1 text-xs text-slate-500 italic'>{metric.healthyRange}</div>
        </div>
        <button className={cx(btnGhost, 'shrink-0 self-start')}
          onClick={() => onToggle && onToggle(metric.key)}>
          {expanded ? '▲' : '▼'}
        </button>
      </div>
      {expanded && (
        <div className='mt-3 space-y-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800'>
          <div>
            <span className='font-semibold text-slate-500'>Formula:</span>
            <code className='ml-2 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800'>{metric.formula}</code>
          </div>
          <div>
            <span className='font-semibold text-slate-500'>Explanation:</span>
            <p className='mt-0.5 text-slate-600 dark:text-slate-300 leading-relaxed'>{metric.explanation}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function ProfessionalMetricsView({ trades }) {
  const { state } = useStore()
  const acct = state.accounts.find((a) => a.id === state.activeAccountId)
  const startingBalance = acct ? acct.startingBalance : 0
  const closed = trades.filter(isClosed)

  const metrics = useMemo(() =>
    computeMetrics(trades, startingBalance, state.cashflows),
    [trades, startingBalance, state.cashflows]
  )

  const [expanded, setExpanded] = useState({})
  const toggle = (key) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))

  if (closed.length < 3) {
    return <Empty icon='📊' title='Not enough data'
      hint='Professional metrics require at least 3 closed trades. Keep journaling and check back as your sample grows.' />
  }

  const cards = Object.entries(metrics).map(([key, metric]) => (
    <MetricCard key={key} metric={metric} onToggle={toggle} expanded={!!expanded[key]} />
  ))

  return (
    <div className='space-y-4'>
      <div className={cx(card, 'p-4')}>
        <div className='flex items-center gap-2'>
          <span className='text-2xl'>📊</span>
          <div>
            <h2 className='font-bold text-lg'>Professional Statistics</h2>
            <p className='text-xs text-slate-500 mt-0.5'>
              {closed.length} closed trades · Click ▼ on any card for formula, explanation, and healthy range
            </p>
          </div>
        </div>
      </div>

      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
        {cards}
      </div>

      <div className={cx(card, 'p-4')}>
        <h3 className='mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400'>Important Notes</h3>
        <ul className='space-y-1.5 text-xs text-slate-500 leading-relaxed'>
          <li>• <strong>Sharpe / Sortino</strong> use an annualization factor based on your average trade duration. Results become more reliable with 30+ trades.</li>
          <li>• <strong>SQN</strong> requires at least 10 trades with R-multiple values to produce a meaningful result.</li>
          <li>• <strong>Risk of Ruin</strong> assumes a simplified fixed-fractional model. Use fractional Kelly (25–50%) rather than full Kelly for position sizing.</li>
          <li>• <strong>Ulcer Index</strong> captures both depth and duration of drawdowns — lower is better. Compare it to your max drawdown for a fuller picture.</li>
          <li>• All metrics are <strong>sample-dependent</strong>. They describe past performance and don&apos;t guarantee future results.</li>
        </ul>
      </div>
    </div>
  )
}

/* ============================ Goal Center ============================ */
const GOAL_DEFS = [
  { key: 'monthlyPnlTarget', label: 'Monthly P&L Target', icon: '💰', format: 'money', unit: '', higherIsBetter: true, desc: 'Net profit target for the current month' },
  { key: 'monthlyRTarget', label: 'Monthly R Target', icon: '📊', format: 'number', unit: 'R', higherIsBetter: true, desc: 'Total R-multiple target for the month' },
  { key: 'maxDrawdownTarget', label: 'Max Drawdown', icon: '📉', format: 'pct', unit: '%', higherIsBetter: false, desc: 'Maximum allowable peak-to-trough drawdown' },
  { key: 'minWinRate', label: 'Minimum Win Rate', icon: '🎯', format: 'pct', unit: '%', higherIsBetter: true, desc: 'Lowest acceptable win rate percentage' },
  { key: 'targetProfitFactor', label: 'Target Profit Factor', icon: '⚡', format: 'number', unit: '', higherIsBetter: true, desc: 'Profit factor you aim to maintain' },
  { key: 'maxTradesPerDay', label: 'Max Trades/Day', icon: '📋', format: 'number', unit: '', higherIsBetter: false, desc: 'Maximum number of trades you allow per day' },
  { key: 'maxDailyLoss', label: 'Max Daily Loss', icon: '🛑', format: 'money', unit: '', higherIsBetter: false, desc: 'Stop trading for the day when you hit this loss' },
]

function computeGoalProgress(trades, goals) {
  if (!goals) return null
  const now = new Date()
  const closed = trades.filter(isClosed)

  // Current month trades
  const monthTrades = closed.filter((t) => {
    const d = new Date(t.exitDate)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const monthPnl = monthTrades.reduce((s, t) => s + (tradePnl(t) || 0), 0)
  const monthR = monthTrades.reduce((s, t) => s + (rMultiple(t) || 0), 0)
  const monthWinRate = monthTrades.length ? (monthTrades.filter((t) => (tradePnl(t) || 0) > 0).length / monthTrades.length) * 100 : 0

  // Overall stats
  const s = stats(closed)

  // Drawdown
  const maxDd = Math.abs(drawdownSeries(equityCurve(trades, 0, [])).maxDd)

  // Trades today
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const todayTrades = closed.filter((t) => new Date(t.exitDate) >= todayStart).length
  const todayPnl = closed.filter((t) => new Date(t.exitDate) >= todayStart).reduce((s, t) => s + (tradePnl(t) || 0), 0)

  const values = {
    monthlyPnlTarget: monthPnl,
    monthlyRTarget: monthR,
    maxDrawdownTarget: maxDd,
    minWinRate: monthTrades.length >= 3 ? monthWinRate : null,
    targetProfitFactor: s.count >= 3 ? s.profitFactor : null,
    maxTradesPerDay: todayTrades,
    maxDailyLoss: todayPnl,
  }

  return GOAL_DEFS.map((def) => {
    const goalValue = goals[def.key]
    const current = values[def.key]
    const achieved = current != null && goalValue > 0 &&
      (def.higherIsBetter ? current >= goalValue : current <= goalValue)
    const progress = goalValue > 0
      ? clampPct((current == null ? 0 : def.higherIsBetter
          ? (current / goalValue) * 100
          : (goalValue / Math.max(current, 0.01)) * 100))
      : 0
    return { ...def, goalValue, current, achieved, progress }
  })
}

function GoalCenterView({ trades }) {
  const { state, setGoals } = useStore()
  const goals = state.goals

  // Compute progress
  const goalProgress = useMemo(() => computeGoalProgress(trades, goals), [trades, goals])

  // Edit state for each goal
  const [editValues, setEditValues] = useState(() => {
    const v = {}
    GOAL_DEFS.forEach((d) => { v[d.key] = goals[d.key] ?? '' })
    return v
  })
  const [saved, setSaved] = useState(false)
  const [dismissedNotifs, setDismissedNotifs] = useState(new Set())

  const saveGoal = (key, value) => {
    const num = Number(value)
    setEditValues((v) => ({ ...v, [key]: value }))
    if (!isNaN(num) && num > 0) {
      setGoals({ [key]: num })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  // Achievement notifications
  const newAchievements = useMemo(() => {
    if (!goalProgress) return []
    return goalProgress.filter((g) => g.achieved && !dismissedNotifs.has(g.key))
  }, [goalProgress, dismissedNotifs])

  const dismissNotif = (key) => setDismissedNotifs((prev) => new Set([...prev, key]))

  const closed = trades.filter(isClosed)

  if (!closed.length && !Object.values(goals).some((v) => v > 0 && v !== true && typeof v === 'number')) {
    return <Empty icon='🏆' title='Set your trading goals' hint='Define targets for P&L, win rate, drawdown, and more. Track your progress with visual milestones.' />
  }

  const overallProgress = goalProgress.length
    ? Math.round(goalProgress.filter((g) => g.achieved).length / goalProgress.length * 100)
    : 0

  return (
    <div className='space-y-4'>
      {/* Achievement toasts */}
      {newAchievements.length > 0 && (
        <div className='space-y-2'>
          {newAchievements.map((g) => (
            <div key={g.key}
              className='flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-800 dark:bg-emerald-950/30'>
              <span className='text-2xl'>{g.icon}</span>
              <div className='flex-1'>
                <span className='font-semibold text-emerald-700 dark:text-emerald-400'>Goal achieved!</span>
                <p className='text-emerald-600 dark:text-emerald-300'>{g.label}: {g.format === 'money' ? fmtMoney(g.current) : g.format === 'pct' ? g.current.toFixed(1) + '%' : g.current?.toFixed(1)} / {g.goalValue}{g.unit}</p>
              </div>
              <button className={cx(btnGhost, 'text-emerald-600')} onClick={() => dismissNotif(g.key)}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Quick edit success banner */}
      {saved && (
        <div className='rounded-lg bg-indigo-500/10 px-4 py-2 text-sm text-indigo-400'>
          Goal updated ✓
        </div>
      )}

      {/* Overall completion ring */}
      <div className={cx(card, 'flex flex-col items-center p-6')}>
        <ProgressRing pct={overallProgress} size={140} strokeWidth={12}
          label={`${goalProgress.filter((g) => g.achieved).length}/${goalProgress.length} goals met`}
          sub={`${overallProgress}% complete`} />
        <p className='mt-2 text-xs text-slate-400'>Click any goal to edit its target value</p>
      </div>

      {/* Goal cards grid */}
      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
        {goalProgress.map((g) => {
          const displayCurrent = (() => {
            if (g.current == null) return '—'
            if (g.format === 'money') return fmtMoney(g.current)
            if (g.format === 'pct') return g.current.toFixed(1) + '%'
            return g.current.toFixed(1)
          })()
          const displayGoal = g.format === 'money'
            ? fmtMoney(g.goalValue)
            : g.goalValue + (g.format === 'pct' ? '%' : ' ' + g.unit)

          return (
            <div key={g.key} className={cx(card, 'p-3 transition-all hover:ring-1',
              g.achieved ? 'hover:ring-emerald-500' : 'hover:ring-indigo-500')}>
              <div className='flex items-start justify-between gap-2'>
                <div className='flex items-center gap-2'>
                  <span className='text-lg'>{g.icon}</span>
                  <div>
                    <h3 className='text-xs font-medium text-slate-500 dark:text-slate-400'>{g.label}</h3>
                    <p className='text-[10px] text-slate-400'>{g.desc}</p>
                  </div>
                </div>
                {g.achieved && <span className='text-emerald-500 text-sm'>✓</span>}
              </div>

              {/* Progress bar */}
              <div className='mt-2 space-y-1'>
                <div className='flex justify-between text-xs'>
                  <span className='tabular-nums'>{displayCurrent}</span>
                  <span className='text-slate-400 tabular-nums'>{displayGoal}</span>
                </div>
                <div className='h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700'>
                  <div className={cx('h-full rounded-full transition-all duration-500',
                    g.achieved ? 'bg-emerald-500' : g.progress >= 80 ? 'bg-amber-500' : 'bg-indigo-500')}
                    style={{ width: Math.min(g.progress, 100) + '%' }} />
                </div>
                <div className='flex justify-between text-[10px]'>
                  <span className={g.achieved ? 'text-emerald-500 font-medium' : 'text-slate-400'}>
                    {g.achieved ? 'Achieved' : Math.round(g.progress) + '%'}
                  </span>
                  <span className='text-slate-400'>{g.unit ? g.unit + ' target' : 'target'}</span>
                </div>
              </div>

              {/* Inline editor (click to reveal) */}
              <details className='group mt-2'>
                <summary className='cursor-pointer text-[10px] text-slate-400 hover:text-indigo-400'>Edit target</summary>
                <div className='mt-1.5 flex items-center gap-1.5'>
                  <input type='number' step='any'
                    className={cx(inputCls, 'py-0.5 text-xs')}
                    value={editValues[g.key] ?? ''}
                    onChange={(e) => setEditValues((v) => ({ ...v, [g.key]: e.target.value }))}
                    onBlur={(e) => saveGoal(g.key, e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveGoal(g.key, e.target.value) }} />
                  <button className={cx(btnGhost, 'text-xs py-0.5')}
                    onClick={() => saveGoal(g.key, editValues[g.key])}>Set</button>
                </div>
              </details>
            </div>
          )
        })}
      </div>

      {/* Milestones section */}
      <div className={cx(card, 'p-4')}>
        <h3 className='mb-3 text-sm font-semibold text-slate-500 dark:text-slate-400'>🏅 Milestones</h3>
        <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-4'>
          {[
            { label: 'First Trade', icon: '🌱', check: closed.length >= 1, detail: closed.length >= 1 ? `${closed.length} trades` : '0 trades' },
            { label: '10 Trades', icon: '🌿', check: closed.length >= 10, detail: `${Math.min(closed.length, 10)}/10` },
            { label: '50 Trades', icon: '🌳', check: closed.length >= 50, detail: `${Math.min(closed.length, 50)}/50` },
            { label: '100 Trades', icon: '🏛️', check: closed.length >= 100, detail: `${Math.min(closed.length, 100)}/100` },
            { label: 'Profitable Month', icon: '📈', check: closed.filter((t) => { const d = new Date(t.exitDate); return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear() }).reduce((s, t) => s + (tradePnl(t) || 0), 0) > 0,
              detail: 'Current month positive' },
            { label: '3x Profit Factor', icon: '🔥', check: stats(closed).profitFactor >= 3 && closed.length >= 10, detail: closed.length >= 10 ? (stats(closed).profitFactor === Infinity ? '∞' : stats(closed).profitFactor.toFixed(1)) : 'Need 10 trades' },
            { label: '10-Day Streak', icon: '⚡', check: Math.abs(stats(closed).streak) >= 10, detail: `Streak: ${stats(closed).streak}` },
            { label: 'Risk Master', icon: '🛡️', check: closed.filter((t) => (t.mistakes || []).includes('Oversized Position')).length === 0 && closed.length >= 10,
              detail: closed.length >= 10 ? 'No oversized trades' : 'Need 10 trades' },
          ].map((m) => (
            <div key={m.label} className={cx('flex items-center gap-2 rounded-lg border p-2.5 text-sm',
              m.check ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-800')}>
              <span className='text-lg'>{m.icon}</span>
              <div className='flex-1'>
                <div className='flex items-center gap-1.5'>
                  <span className='font-medium text-xs'>{m.label}</span>
                  {m.check && <span className='text-emerald-500 text-xs'>✓</span>}
                </div>
                <p className='text-[10px] text-slate-400'>{m.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ============================ Strategy Lab ============================ */
const STRAT_COLS = [
  { key: 'trades', label: 'Trades', fmt: (v) => v, color: null },
  { key: 'winRate', label: 'Win Rate', fmt: (v) => fmtPct(v), color: (v) => v >= 50 ? 'text-emerald-500' : 'text-rose-500' },
  { key: 'avgR', label: 'Avg R', fmt: (v) => v != null ? v.toFixed(2) + 'R' : '—', color: (v) => v > 0 ? 'text-emerald-500' : v < 0 ? 'text-rose-500' : '' },
  { key: 'profitFactor', label: 'Profit Factor', fmt: (v) => v === Infinity ? '∞' : v.toFixed(2), color: (v) => v >= 1.5 ? 'text-emerald-500' : 'text-rose-500' },
  { key: 'maxDrawdown', label: 'Max DD%', fmt: (v) => v.toFixed(1) + '%', color: (v) => v < 10 ? 'text-emerald-500' : v < 20 ? 'text-amber-500' : 'text-rose-500' },
  { key: 'expectancy', label: 'Expectancy', fmt: (v) => fmtMoney(v), color: (v) => v > 0 ? 'text-emerald-500' : v < 0 ? 'text-rose-500' : '' },
  { key: 'avgHoldTime', label: 'Avg Hold', fmt: (v) => fmtHolding(v), color: null },
  { key: 'avgWinner', label: 'Avg Winner', fmt: (v) => fmtMoney(v), color: () => 'text-emerald-500' },
  { key: 'avgLoser', label: 'Avg Loser', fmt: (v) => fmtMoney(v), color: () => 'text-rose-500' },
  { key: 'totalPnl', label: 'Net P&L', fmt: (v) => fmtMoney(v), color: (v) => v > 0 ? 'text-emerald-500' : v < 0 ? 'text-rose-500' : '' },
]

function StrategyLabView({ trades }) {
  const closed = trades.filter(isClosed)
  const metrics = useMemo(() => strategyMetrics(trades), [trades])

  const [selected, setSelected] = useState([])
  const [sortKey, setSortKey] = useState('totalPnl')
  const [sortDir, setSortDir] = useState('desc')
  const [showAll, setShowAll] = useState(false)

  const toggleSelect = (name) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )
  }

  const toggleSort = (key) => {
    setSortDir((prev) => sortKey === key && prev === 'desc' ? 'asc' : 'desc')
    setSortKey(key)
  }

  const sorted = useMemo(() => {
    const list = showAll ? metrics : metrics.filter((m) => m.count >= 2)
    return [...list].sort((a, b) => {
      const va = a[sortKey] ?? 0, vb = b[sortKey] ?? 0
      return sortDir === 'desc' ? vb - va : va - vb
    })
  }, [metrics, sortKey, sortDir, showAll])

  const compared = metrics.filter((m) => selected.includes(m.name))

  if (!closed.length) {
    return <Empty icon='🧪' title='No closed trades yet' hint='Log and close trades with strategies assigned to power the Strategy Lab.' />
  }

  return (
    <div className='space-y-4'>
      {/* Side-by-side comparison cards (when selected) */}
      {compared.length >= 2 && (
        <div className={cx(card, 'p-4')}>
          <div className='mb-3 flex items-center justify-between'>
            <h3 className='text-sm font-semibold text-slate-500 dark:text-slate-400'>📊 Side-by-Side Comparison</h3>
            <button className={btnGhost} onClick={() => setSelected([])}>Clear all</button>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className='bg-indigo-500/10 text-left text-xs uppercase tracking-wide text-slate-500'>
                <tr>
                  <th className='px-3 py-2 font-semibold text-indigo-400'>Metric</th>
                  {compared.map((m) => (
                    <th key={m.name} className='px-3 py-2 text-right font-semibold'>{m.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {STRAT_COLS.map((col) => (
                  <tr key={col.key} className='border-t border-slate-100 dark:border-slate-800'>
                    <td className='px-3 py-1.5 font-medium text-slate-500'>{col.label}</td>
                    {compared.map((m) => {
                      const val = m[col.key]
                      const color = typeof col.color === 'function' ? col.color(val) : ''
                      return (
                        <td key={m.name} className={cx('px-3 py-1.5 text-right tabular-nums', color)}>
                          {col.fmt(val)}
                        </td>
                      )
                    })}
                  </tr>
                ))}
                {/* Best/worst month rows */}
                <tr className='border-t border-slate-100 dark:border-slate-800'>
                  <td className='px-3 py-1.5 font-medium text-slate-500'>Best Month</td>
                  {compared.map((m) => (
                    <td key={m.name} className='px-3 py-1.5 text-right tabular-nums text-emerald-500'>
                      {m.bestMonth ? `${m.bestMonth.key} (${fmtMoney(m.bestMonth.pnl)})` : '—'}
                    </td>
                  ))}
                </tr>
                <tr className='border-t border-slate-100 dark:border-slate-800'>
                  <td className='px-3 py-1.5 font-medium text-slate-500'>Worst Month</td>
                  {compared.map((m) => (
                    <td key={m.name} className='px-3 py-1.5 text-right tabular-nums text-rose-500'>
                      {m.worstMonth ? `${m.worstMonth.key} (${fmtMoney(m.worstMonth.pnl)})` : '—'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Strategy list with checkboxes */}
      <div className={cx(card)}>
        <div className='flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800'>
          <h3 className='text-sm font-semibold text-slate-500 dark:text-slate-400'>All Strategies</h3>
          <div className='flex items-center gap-3'>
            <label className='flex items-center gap-1.5 text-xs text-slate-500'>
              <input type='checkbox' checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
              Show all (incl. &lt;2 trades)
            </label>
            {selected.length > 0 && (
              <span className='text-xs text-indigo-400'>{selected.length} selected for comparison</span>
            )}
          </div>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60'>
              <tr>
                <th className='w-10 px-2 py-2'>Compare</th>
                <th className={cx('cursor-pointer px-3 py-2 hover:text-slate-800 dark:hover:text-slate-200')}
                  onClick={() => toggleSort('name')}>
                  Strategy {sortKey === 'name' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                </th>
                {STRAT_COLS.map((col) => (
                  <th key={col.key} className={cx('cursor-pointer px-3 py-2 text-right hover:text-slate-800 dark:hover:text-slate-200')}
                    onClick={() => toggleSort(col.key)}>
                    {col.label}{sortKey === col.key ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((m) => (
                <tr key={m.name} className={cx('border-t border-slate-100 dark:border-slate-800',
                  selected.includes(m.name) && 'bg-indigo-500/5')}>
                  <td className='px-2 py-1.5 text-center'>
                    <input type='checkbox' checked={selected.includes(m.name)}
                      onChange={() => toggleSelect(m.name)} />
                  </td>
                  <td className='px-3 py-1.5 font-medium'>{m.name}</td>
                  {STRAT_COLS.map((col) => {
                    const val = m[col.key]
                    const color = typeof col.color === 'function' ? col.color(val) : ''
                    return (
                      <td key={col.key} className={cx('px-3 py-1.5 text-right tabular-nums', color)}>
                        {col.fmt(val)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Star chart: win rate vs avg R for all strategies */}
      {metrics.length >= 2 && (
        <div className={cx(card, 'p-4')}>
          <h3 className='mb-3 text-sm font-semibold text-slate-500 dark:text-slate-400'>Strategy Scatter: Win Rate × Avg R</h3>
          <div className='grid gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {metrics.filter((m) => m.count >= 2).map((m) => {
              const quadrant = m.winRate >= 50 && m.avgR > 0 ? 'top-right' : m.winRate >= 50 ? 'top-left' : m.avgR > 0 ? 'bottom-right' : 'bottom-left'
              const colors = {
                'top-right': 'border-emerald-500 bg-emerald-500/5',
                'top-left': 'border-amber-500 bg-amber-500/5',
                'bottom-right': 'border-amber-500 bg-amber-500/5',
                'bottom-left': 'border-rose-500 bg-rose-500/5',
              }
              return (
                <div key={m.name} className={cx('flex flex-col rounded-lg border p-3 text-sm', colors[quadrant])}>
                  <div className='flex items-center justify-between'>
                    <span className='font-semibold truncate'>{m.name}</span>
                    <span className='text-xs text-slate-400'>{m.count} trades</span>
                  </div>
                  <div className='mt-1 flex items-center gap-4 text-xs'>
                    <span className={m.winRate >= 50 ? 'text-emerald-500' : 'text-rose-500'}>{fmtPct(m.winRate)}</span>
                    <span className={m.avgR > 0 ? 'text-emerald-500' : m.avgR < 0 ? 'text-rose-500' : ''}>{m.avgR.toFixed(2)}R</span>
                    <span>{fmtMoney(m.totalPnl)}</span>
                  </div>
                  <div className='mt-2 flex gap-1'>
                    <div className='h-2 flex-1 rounded-full bg-slate-200 dark:bg-slate-700' title='Win rate'>
                      <div className='h-full rounded-full bg-emerald-500' style={{ width: m.winRate + '%' }} />
                    </div>
                    <div className='h-2 flex-1 rounded-full bg-slate-200 dark:bg-slate-700' title='Drawdown'>
                      <div className={cx('h-full rounded-full', m.maxDrawdown < 10 ? 'bg-emerald-500' : m.maxDrawdown < 20 ? 'bg-amber-500' : 'bg-rose-500')}
                        style={{ width: Math.min(m.maxDrawdown * 5, 100) + '%' }} />
                    </div>
                  </div>
                  <div className='flex justify-between text-[10px] text-slate-400'>
                    <span>Win rate</span><span>Drawdown</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ============================ Mistake Analytics ============================ */
function MistakeAnalyticsView({ trades }) {
  const { state } = useStore()
  const mistakesList = state.tags.mistakes || []
  const closed = trades.filter(isClosed)

  const stats = useMemo(() => {
    const map = {}
    closed.forEach((t) => {
      const ms = t.mistakes || []
      if (!ms.length) return
      const pnl = tradePnl(t) || 0
      const r = rMultiple(t)
      ms.forEach((m) => {
        if (!map[m]) map[m] = { count: 0, pnl: 0, winCount: 0, rSum: 0, rCount: 0, dates: [] }
        map[m].count++
        map[m].pnl += pnl
        if (pnl > 0) map[m].winCount++
        if (r != null) { map[m].rSum += r; map[m].rCount++ }
        map[m].dates.push({ date: t.exitDate || t.entryDate, pnl, r: r ?? 0 })
      })
    })
    mistakesList.forEach((m) => { if (!map[m]) map[m] = { count: 0, pnl: 0, winCount: 0, rSum: 0, rCount: 0, dates: [] } })

    const entries = Object.entries(map)
      .map(([name, d]) => ({
        name,
        count: d.count,
        pnl: d.pnl,
        winRate: d.count ? (d.winCount / d.count) * 100 : 0,
        avgR: d.rCount ? d.rSum / d.rCount : 0,
        share: closed.length ? (d.count / closed.length) * 100 : 0,
        dates: d.dates,
      }))
      .sort((a, b) => b.count - a.count)
    return entries
  }, [closed, mistakesList])

  const monthlyTrend = useMemo(() => {
    const monthMap = {}
    closed.forEach((t) => {
      const ms = t.mistakes || []
      if (!ms.length) return
      const d = new Date(t.exitDate || t.entryDate)
      if (isNaN(d.getTime())) return
      const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
      if (!monthMap[key]) monthMap[key] = { total: 0 }
      ms.forEach((m) => {
        monthMap[key][m] = (monthMap[key][m] || 0) + 1
        monthMap[key].total++
      })
    })
    const months = Object.keys(monthMap).sort()
    return { months, monthMap, mistakes: mistakesList }
  }, [closed, mistakesList])

  const maxCount = Math.max(1, ...stats.map((s) => s.count))

  if (!closed.length) {
    return <Empty icon='⚠️' title='No closed trades to analyze' hint='Log and close a few trades, then tag any mistakes you made. Mistakes can be selected when adding or editing a trade.' />
  }

  return (
    <div className='space-y-4'>
      {/* Summary cards */}
      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <div className={cx(card, 'p-3')}>
          <div className='text-xs text-slate-500'>Total Mistakes Tagged</div>
          <div className='mt-1 text-2xl font-bold'>{stats.reduce((s, e) => s + e.count, 0)}</div>
          <div className='mt-0.5 text-xs text-slate-400'>across {stats.filter((s) => s.count > 0).length} categories</div>
        </div>
        <div className={cx(card, 'p-3')}>
          <div className='text-xs text-slate-500'>Most Common</div>
          <div className='mt-1 text-lg font-semibold'>{stats[0]?.count ? stats[0].name : '—'}</div>
          <div className='mt-0.5 text-xs text-slate-400'>{stats[0]?.count || 0} occurrences</div>
        </div>
        <div className={cx(card, 'p-3')}>
          <div className='text-xs text-slate-500'>Worst Avg R Mistake</div>
          <div className='mt-1 text-lg font-semibold'>
            {(() => {
              const worst = [...stats].filter((s) => s.count >= 2).sort((a, b) => a.avgR - b.avgR)
              return worst.length ? worst[0].name : '—'
            })()}
          </div>
          <div className='mt-0.5 text-xs text-slate-400'>{stats.filter((s) => s.count >= 2).sort((a, b) => a.avgR - b.avgR)[0]?.avgR.toFixed(2) || ''}R avg</div>
        </div>
        <div className={cx(card, 'p-3')}>
          <div className='text-xs text-slate-500'>Mistake Frequency</div>
          <div className='mt-1 text-2xl font-bold'>
            {closed.length ? Math.round(stats.reduce((s, e) => s + e.count, 0) / closed.length * 100) : 0}%
          </div>
          <div className='mt-0.5 text-xs text-slate-400'>of trades have ≥1 mistake</div>
        </div>
      </div>

      {/* Mistake breakdown table */}
      <div className={cx(card)}>
        <div className='border-b border-slate-200 px-4 py-3 dark:border-slate-800'>
          <h3 className='text-sm font-semibold text-slate-500 dark:text-slate-400'>Mistake Breakdown</h3>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60'>
              <tr>
                <th className='px-4 py-2'>Mistake</th>
                <th className='px-3 py-2'>Frequency</th>
                <th className='px-3 py-2'>Share</th>
                <th className='px-3 py-2'>Win Rate</th>
                <th className='px-3 py-2'>Avg R</th>
                <th className='px-3 py-2'>Net P&L</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => {
                const barW = maxCount ? (s.count / maxCount) * 100 : 0
                return (
                  <tr key={s.name} className='border-t border-slate-100 dark:border-slate-800'>
                    <td className='px-4 py-2 font-medium'>{s.name}</td>
                    <td className='px-3 py-2 tabular-nums'>
                      <div className='flex items-center gap-2'>
                        <span className='w-6 text-right'>{s.count}</span>
                        <div className='h-2 w-16 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700'>
                          <div className='h-full rounded-full bg-indigo-500' style={{ width: barW + '%' }} />
                        </div>
                      </div>
                    </td>
                    <td className='px-3 py-2 tabular-nums text-slate-500'>{s.share.toFixed(0)}%</td>
                    <td className={cx('px-3 py-2 tabular-nums', s.winRate >= 50 ? 'text-emerald-500' : 'text-rose-500')}>{fmtPct(s.winRate)}</td>
                    <td className={cx('px-3 py-2 tabular-nums', s.avgR > 0 ? 'text-emerald-500' : s.avgR < 0 ? 'text-rose-500' : '')}>
                      {s.rCount ? s.avgR.toFixed(2) + 'R' : '—'}
                    </td>
                    <td className={cx('px-3 py-2 tabular-nums', pnlColor(s.pnl))}>{fmtMoney(s.pnl)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trend over time */}
      {monthlyTrend.months.length > 0 && (
        <div className={cx(card, 'p-4')}>
          <h3 className='mb-3 text-sm font-semibold text-slate-500 dark:text-slate-400'>Trend Over Time</h3>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className='text-left text-xs uppercase tracking-wide text-slate-500'>
                <tr>
                  <th className='px-2 py-1'>Month</th>
                  {monthlyTrend.mistakes.filter((m) => monthlyTrend.months.some((mo) => (monthlyTrend.monthMap[mo][m] || 0) > 0)).map((m) => (
                    <th key={m} className='px-2 py-1 text-right'>{m}</th>
                  ))}
                  <th className='px-2 py-1 text-right'>Total</th>
                </tr>
              </thead>
              <tbody>
                {monthlyTrend.months.slice(-12).map((mo) => {
                  const data = monthlyTrend.monthMap[mo]
                  const activeMistakes = monthlyTrend.mistakes.filter((m) => (data[m] || 0) > 0)
                  if (!activeMistakes.length) return null
                  return (
                    <tr key={mo} className='border-t border-slate-100 dark:border-slate-800'>
                      <td className='px-2 py-1.5 font-medium text-slate-500'>{mo}</td>
                      {monthlyTrend.mistakes.map((m) => (
                        <td key={m} className='px-2 py-1.5 text-right tabular-nums'>
                          {data[m] ? <span className='font-medium text-indigo-500'>{data[m]}</span> : <span className='text-slate-300 dark:text-slate-700'>·</span>}
                        </td>
                      ))}
                      <td className='px-2 py-1.5 text-right tabular-nums font-semibold'>{data.total}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent mistake log */}
      <div className={cx(card)}>
        <div className='border-b border-slate-200 px-4 py-3 dark:border-slate-800'>
          <h3 className='text-sm font-semibold text-slate-500 dark:text-slate-400'>Recent Mistake Log</h3>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60'>
              <tr>
                <th className='px-4 py-2'>Date</th>
                <th className='px-3 py-2'>Symbol</th>
                <th className='px-3 py-2'>Mistakes</th>
                <th className='px-3 py-2'>P&L</th>
              </tr>
            </thead>
            <tbody>
              {closed.filter((t) => (t.mistakes || []).length > 0).sort((a, b) => new Date(b.exitDate || b.entryDate) - new Date(a.exitDate || a.entryDate)).slice(0, 25).map((t) => (
                <tr key={t.id} className='border-t border-slate-100 dark:border-slate-800'>
                  <td className='px-4 py-1.5 text-slate-500'>{(t.exitDate || t.entryDate || '').slice(0, 10)}</td>
                  <td className='px-3 py-1.5 font-medium'>{t.symbol}</td>
                  <td className='px-3 py-1.5'>
                    <div className='flex flex-wrap gap-1'>
                      {(t.mistakes || []).map((m) => (
                        <span key={m} className='rounded-full bg-rose-500/10 px-2 py-0.5 text-xs text-rose-400'>{m}</span>
                      ))}
                    </div>
                  </td>
                  <td className={cx('px-3 py-1.5 tabular-nums', pnlColor(tradePnl(t) || 0))}>{fmtMoney(tradePnl(t))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ============================ Trading Plan ============================ */
const PLAN_SECTIONS = [
  { key: 'why', label: 'Your Why', icon: '🎯', type: 'textarea' },
  { key: 'confluences', label: 'Setup Confluences', icon: '📐', type: 'text' },
  { key: 'sessions', label: 'Trading Sessions', icon: '🌍', type: 'text' },
  { key: 'pairs', label: 'Trading Pairs', icon: '💱', type: 'text' },
  { key: 'htf', label: 'Higher Timeframe Analysis', icon: '📊', type: 'text' },
  { key: 'entryTf', label: 'Entry Timeframe', icon: '⏱️', type: 'text' },
  { key: 'tradesPerDay', label: 'Max Trades / Day', icon: '📋', type: 'number' },
  { key: 'riskPerTrade', label: 'Risk % Per Trade', icon: '🛡️', type: 'number', suffix: '%' },
  { key: 'lotSize', label: 'Lot Size', icon: '📏', type: 'number' },
  { key: 'rrTarget', label: 'R:R Target', icon: '⚖️', type: 'text' },
  { key: 'exitReasons', label: 'Exit Reasons', icon: '🚪', type: 'textarea' },
  { key: 'expectedWin', label: 'Expected Win %', icon: '📈', type: 'number', suffix: '%' },
  { key: 'expectedLoss', label: 'Max Loss %', icon: '📉', type: 'number', suffix: '%' },
  { key: 'docMethod', label: 'Documentation Method', icon: '📝', type: 'text' },
  { key: 'weeklyTarget', label: 'Weekly Profit Target', icon: '💰', type: 'number', suffix: '%' },
  { key: 'monthlyTarget', label: 'Monthly Profit Target', icon: '💎', type: 'number', suffix: '%' },
  { key: 'accountSize', label: 'Account Size', icon: '🏦', type: 'number', prefix: '$' },
  { key: 'targetAccount', label: 'Target Account Size', icon: '🚀', type: 'number', prefix: '$' },
  { key: 'habits', label: 'High Priority Actions / Habits', icon: '⚡', type: 'textarea' },
  { key: 'notes', label: 'Extra Notes', icon: '📌', type: 'textarea' },
]

function TradingPlanView() {
  const { state, setTradingPlan } = useStore()
  const plan = state.tradingPlan || {}
  const [editing, setEditing] = useState(null) // which key is being edited
  const [draft, setDraft] = useState('')
  const [saved, setSaved] = useState(false)

  const startEdit = (key, currentVal) => {
    setEditing(key)
    setDraft(currentVal ?? '')
  }

  const saveField = (key) => {
    const num = Number(draft)
    const section = PLAN_SECTIONS.find((s) => s.key === key)
    const value = section && (section.type === 'number' || section.suffix) ? (isNaN(num) ? draft : num) : draft
    setTradingPlan({ [key]: value })
    setEditing(null)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const cancelEdit = () => setEditing(null)

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-lg font-bold'>📜 BT's Trading Plan</h2>
          <p className='text-xs text-slate-400 mt-0.5'>Tap any field to edit. Your plan is saved automatically.</p>
        </div>
        {saved && <span className='text-xs text-emerald-500 font-medium'>✓ Saved</span>}
      </div>

      {/* Name & Why — hero section */}
      <div className={cx(card, 'relative overflow-hidden bg-gradient-to-r from-indigo-500/[0.04] p-5')}>
        <div className='flex items-start justify-between gap-3'>
          <div className='flex-1'>
            {editing === 'name' ? (
              <div className='space-y-2'>
                <input className={cx(inputCls, 'text-lg font-bold')} value={draft} onChange={(e) => setDraft(e.target.value)}
                  placeholder='Your name' autoFocus onKeyDown={(e) => e.key === 'Enter' && saveField('name')} />
                <div className='flex gap-2'>
                  <button className={btnPrimary} onClick={() => saveField('name')}>Save</button>
                  <button className={btnGhost} onClick={cancelEdit}>Cancel</button>
                </div>
              </div>
            ) : (
              <h1 className='text-2xl font-bold cursor-pointer hover:text-indigo-500 transition-colors'
                onClick={() => startEdit('name', plan.name)}>
                {plan.name || 'BT'} <span className='text-sm font-normal text-slate-400'>✎</span>
              </h1>
            )}
            {editing === 'why' ? (
              <div className='space-y-2 mt-3'>
                <textarea className={cx(inputCls, 'min-h-[80px]')} value={draft} onChange={(e) => setDraft(e.target.value)}
                  placeholder='Why do you trade?' autoFocus />
                <div className='flex gap-2'>
                  <button className={btnPrimary} onClick={() => saveField('why')}>Save</button>
                  <button className={btnGhost} onClick={cancelEdit}>Cancel</button>
                </div>
              </div>
            ) : (
              <p className='mt-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-indigo-500 transition-colors'
                onClick={() => startEdit('why', plan.why)}>
                {plan.why || 'Click to add your why...'} <span className='text-xs text-slate-400'>✎</span>
              </p>
            )}
          </div>
          <div className='shrink-0 text-4xl opacity-30 select-none'>📜</div>
        </div>
      </div>

      {/* Plan grid */}
      <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
        {PLAN_SECTIONS.map((section) => {
          const currentVal = plan[section.key]
          const displayVal = currentVal != null && currentVal !== '' ? currentVal : '—'
          const prefix = section.prefix || ''
          const suffix = section.suffix || ''

          return (
            <div key={section.key} className={cx(card, 'p-3 transition-all hover:ring-1 hover:ring-indigo-500/30')}>
              <div className='flex items-start justify-between gap-2'>
                <div className='flex items-center gap-2'>
                  <span className='text-lg'>{section.icon}</span>
                  <h3 className='text-xs font-semibold uppercase tracking-wider text-slate-500'>{section.label}</h3>
                </div>
                {editing === section.key ? (
                  <button className={btnGhost} onClick={cancelEdit}>✕</button>
                ) : (
                  <button className={cx(btnGhost, 'opacity-0 group-hover:opacity-100 text-[10px]')}
                    onClick={() => startEdit(section.key, currentVal ?? '')}>✎</button>
                )}
              </div>

              {editing === section.key ? (
                <div className='mt-2 space-y-2'>
                  {section.type === 'textarea' ? (
                    <textarea className={cx(inputCls, 'min-h-[60px]')} value={draft}
                      onChange={(e) => setDraft(e.target.value)} autoFocus />
                  ) : (
                    <input className={inputCls} type={section.type === 'number' ? 'number' : 'text'} step='any'
                      value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && saveField(section.key)} />
                  )}
                  <div className='flex gap-2'>
                    <button className={btnPrimary} onClick={() => saveField(section.key)}>Save</button>
                    <button className={btnGhost} onClick={cancelEdit}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className='mt-1.5 cursor-pointer' onClick={() => startEdit(section.key, currentVal ?? '')}>
                  <span className='text-sm font-semibold tabular-nums'>
                    {prefix}{typeof displayVal === 'number' ? displayVal.toFixed(2) : displayVal}{suffix}
                  </span>
                  <span className='ml-1.5 text-[10px] text-slate-400 opacity-0 group-hover:opacity-100'>✎</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer moto */}
      <div className={cx(card, 'p-4 text-center')}>
        <p className='text-sm font-semibold text-indigo-600 dark:text-indigo-400'>Plan your trade, trade your plan.</p>
        <p className='mt-1 text-xs text-slate-400'>Don't be emotional. Risk what you can afford. It's about staying in the game.</p>
      </div>
    </div>
  )
}

/* ============================ Settings ============================ */
function SettingsView() {
  const { state, setTags, setChecklist, setPrompts, setRiskPlan, setGoals, addAccount, hardReset, importJson } = useStore()
  const [acc, setAcc] = useState({ name: '', type: 'live', startingBalance: 10000 })
  const rp = state.riskPlan
  const g = state.goals
  return (
    <div className='grid gap-4 lg:grid-cols-2'>
      <Card title='Strategy tags'><ListEditor label='strategy' items={state.tags.strategies} onChange={(a) => setTags('strategies', a)} /></Card>
      <Card title='Emotion tags'><ListEditor label='emotion' items={state.tags.emotions} onChange={(a) => setTags('emotions', a)} /></Card>
      <Card title='Mistake tags'><ListEditor label='mistake' items={state.tags.mistakes} onChange={(a) => setTags('mistakes', a)} /></Card>
      <Card title='Pre-trade checklist'><ListEditor label='checklist item' items={state.checklist} onChange={setChecklist} /></Card>
      <Card title='Reflection prompts'><ListEditor label='prompt' items={state.reflectionPrompts} onChange={setPrompts} /></Card>
      <Card title='Risk plan'>
        <div className='grid grid-cols-3 gap-2'>
          <Field label='Risk %/trade'><input type='number' step='any' className={inputCls} value={rp.riskPerTradePct} onChange={(e) => setRiskPlan({ riskPerTradePct: Number(e.target.value) })} /></Field>
          <Field label='Daily loss limit'><input type='number' className={inputCls} value={rp.dailyLossLimit} onChange={(e) => setRiskPlan({ dailyLossLimit: Number(e.target.value) })} /></Field>
          <Field label='Weekly loss limit'><input type='number' className={inputCls} value={rp.weeklyLossLimit} onChange={(e) => setRiskPlan({ weeklyLossLimit: Number(e.target.value) })} /></Field>
        </div>
      </Card>
      <Card title='Goals'>
        <div className='grid grid-cols-2 gap-2'>
          <Field label='Monthly P&L target'><input type='number' className={inputCls} value={g.monthlyPnlTarget} onChange={(e) => setGoals({ monthlyPnlTarget: Number(e.target.value) })} /></Field>
          <Field label='Monthly R target'><input type='number' step='any' className={inputCls} value={g.monthlyRTarget} onChange={(e) => setGoals({ monthlyRTarget: Number(e.target.value) })} /></Field>
          <Field label='Max drawdown %'><input type='number' step='any' className={inputCls} value={g.maxDrawdownTarget} onChange={(e) => setGoals({ maxDrawdownTarget: Number(e.target.value) })} /></Field>
          <Field label='Min win rate %'><input type='number' className={inputCls} value={g.minWinRate} onChange={(e) => setGoals({ minWinRate: Number(e.target.value) })} /></Field>
          <Field label='Max trades/day'><input type='number' className={inputCls} value={g.maxTradesPerDay} onChange={(e) => setGoals({ maxTradesPerDay: Number(e.target.value) })} /></Field>
          <Field label='Max daily loss'><input type='number' className={inputCls} value={g.maxDailyLoss} onChange={(e) => setGoals({ maxDailyLoss: Number(e.target.value) })} /></Field>
          <Field label='Target profit factor'><input type='number' step='any' className={inputCls} value={g.targetProfitFactor} onChange={(e) => setGoals({ targetProfitFactor: Number(e.target.value) })} /></Field>
        </div>
      </Card>
      <Card title='Add account'>
        <div className='grid grid-cols-3 gap-2'>
          <Field label='Name'><input className={inputCls} value={acc.name} onChange={(e) => setAcc({ ...acc, name: e.target.value })} /></Field>
          <Field label='Type'><select className={inputCls} value={acc.type} onChange={(e) => setAcc({ ...acc, type: e.target.value })}><option value='live'>Live</option><option value='demo'>Demo</option><option value='prop'>Prop firm</option></select></Field>
          <Field label='Starting balance'><input type='number' className={inputCls} value={acc.startingBalance} onChange={(e) => setAcc({ ...acc, startingBalance: Number(e.target.value) })} /></Field>
        </div>
        <button className={cx(btnPrimary, 'mt-2')} disabled={!acc.name} onClick={() => { addAccount(acc); setAcc({ name: '', type: 'live', startingBalance: 10000 }) }}>Add account</button>
      </Card>
      <Card title='Data'>
        <div className='flex flex-wrap gap-2'>
          <label className={cx(btnGhost, 'cursor-pointer')}>Restore JSON<input type='file' accept='application/json' className='hidden' onChange={async (e) => { const f = e.target.files && e.target.files[0]; if (f) importJson(await f.text()) }} /></label>
          <button className={btnDanger} onClick={() => {
            if (window.confirm('Reset ALL data? This cannot be undone. A backup will be downloaded first.')) {
              download('journal-backup-before-reset.json', db.exportJson(), 'application/json')
              hardReset()
            }
          }}>Reset everything</button>
        </div>
      </Card>
    </div>
  )
}

/* ============================ App shell ============================ */
const NAV = [
  ['dashboard', 'Dashboard', '📊'],
  ['trades', 'Trades', '📋'],
  ['score', 'Score', '🎯'],
  ['goals', 'Goals', '🏆'],
  ['plan', 'Plan', '📜'],
  ['playbook', 'Playbook', '📘'],
  ['strategies', 'Strategies', '🧪'],
  ['sessions', 'Sessions', '🌍'],
  ['mistakes', 'Mistakes', '⚠️'],
  ['prostats', 'Pro Stats', '📈'],
  ['risk', 'Risk', '🛡'],
  ['psych', 'Psychology', '🧠'],
  ['coach', 'AI Coach', '🤖'],
  ['reports', 'Reports', '📄'],
  ['settings', 'Settings', '⚙'],
]

function Shell() {
  const { state, setTheme, setActiveAccount, setPlaybookModels } = useStore()
  const [view, setView] = useState('dashboard')
  const [filters, setFilters] = useState(emptyFilters)
  const [aggregate, setAggregate] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [quick, setQuick] = useState(false)
  const [editing, setEditing] = useState(null)
  const [importOpen, setImportOpen] = useState(false)

  const dark = state.settings.theme === 'dark'
  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])

  const openNew = useCallback((q) => { setEditing(blankTrade(state.activeAccountId)); setQuick(!!q); setFormOpen(true) }, [state.activeAccountId])
  const openEdit = (t) => { setEditing(t); setQuick(false); setFormOpen(true) }

  // Global keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'n') { e.preventDefault(); openNew(false) }
      else if (e.key === 'q') { e.preventDefault(); openNew(true) }
      else if (e.key === 'd') setView('dashboard')
      else if (e.key === 't') setView('trades')
      else if (e.key === 's') setView('score')
      else if (e.key === 'g') setView('goals')
      else if (e.key === 'l') setView('plan')
      else if (e.key === 'r') setView('strategies')
      else if (e.key === 'm') setView('mistakes')
      else if (e.key === 'e') setView('sessions')
      else if (e.key === 'p') setView('prostats')
      else if (e.key === 'c') setView('coach')
      else if (e.key === '?') alert('Shortcuts:\nn  new trade\nq  quick add\nd  dashboard\nt  trades\ns  score\ng  goals\nl  trading plan\nr  strategies\ne  sessions\nm  mistakes\np  pro stats\nc  AI coach\nCtrl/Cmd+Enter  save trade')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openNew])

  const visible = useMemo(() => applyFilters(state.trades, filters, state.activeAccountId, aggregate), [state.trades, filters, state.activeAccountId, aggregate])
  const showFilters = view === 'dashboard' || view === 'trades' || view === 'score' || view === 'goals' || view === 'plan' || view === 'playbook' || view === 'strategies' || view === 'sessions' || view === 'mistakes' || view === 'prostats' || view === 'reports' || view === 'psych' || view === 'coach'

  return (
    <div className='min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100'>
      <div className='mx-auto flex max-w-[1500px] flex-col md:flex-row'>
        <aside className='no-print border-b border-slate-200 dark:border-slate-800 md:sticky md:top-0 md:h-screen md:w-56 md:shrink-0 md:border-b-0 md:border-r'>
          <div className='flex items-center gap-2 p-4'><span className='text-xl'>📈</span><span className='font-bold'>TradeJournal</span></div>
          <nav className='flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:overflow-visible'>
            {NAV.map(([id, label, icon]) => (
              <button key={id} onClick={() => setView(id)}
                className={cx('flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm', view === id ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800')}>
                <span>{icon}</span>{label}
              </button>
            ))}
          </nav>
        </aside>

        <main className='min-w-0 flex-1 p-4'>
          <div className='mb-4 flex flex-wrap items-center justify-between gap-2 no-print'>
            <div className='flex items-center gap-2'>
              <select className={cx(inputCls, 'w-auto')} value={state.activeAccountId} onChange={(e) => setActiveAccount(e.target.value)}>
                {state.accounts.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
              </select>
              <label className='flex items-center gap-1.5 text-xs text-slate-500'>
                <input type='checkbox' checked={aggregate} onChange={(e) => setAggregate(e.target.checked)} /> All accounts
              </label>
            </div>
            <div className='flex items-center gap-2'>
              <button className={btnGhost} onClick={() => setImportOpen(true)}>Import CSV</button>
              <button className={btnGhost} onClick={() => openNew(true)}>Quick add <kbd className='ml-1 rounded bg-slate-200 px-1 dark:bg-slate-700'>q</kbd></button>
              <button className={btnPrimary} onClick={() => openNew(false)}>+ New trade <kbd className='ml-1 rounded bg-indigo-500/60 px-1'>n</kbd></button>
              <button className={btnGhost} onClick={() => setTheme(dark ? 'light' : 'dark')} title='Toggle theme'>{dark ? '☀' : '🌙'}</button>
            </div>
          </div>

          <div className='mb-2 flex items-center justify-between'>
            <h1 className='text-lg font-bold capitalize'>{view === 'psych' ? 'Psychology' : view === 'coach' ? 'AI Coach' : view === 'sessions' ? 'Sessions' : view === 'prostats' ? 'Pro Stats' : view === 'goals' ? 'Goals' : view === 'strategies' ? 'Strategy Lab' : view === 'plan' ? 'Trading Plan' : view === 'playbook' ? 'Playbook' : view}</h1>
            {aggregate && <span className='text-xs text-slate-400 no-print'>Aggregated across all accounts</span>}
          </div>

          {showFilters && <div className='mb-4'><FiltersBar filters={filters} setFilters={setFilters} aggregate={aggregate} /></div>}

          {view === 'dashboard' && <Dashboard trades={visible} setFilters={setFilters} onNavigate={setView} />}
          {view === 'trades' && <TradeTable trades={visible} onEdit={openEdit} />}
          {view === 'score' && <DisciplineScoreView trades={visible} />}
          {view === 'goals' && <GoalCenterView trades={visible} />}
          {view === 'plan' && <TradingPlanView />}
          {view === 'playbook' && <PlaybookModule allTrades={state.trades} models={state.playbookModels || []} onModelsChange={(m) => setPlaybookModels(m)} />}
          {view === 'strategies' && <StrategyLabView trades={visible} />}
          {view === 'sessions' && <SessionAnalysisView trades={visible} />}
          {view === 'mistakes' && <MistakeAnalyticsView trades={visible} />}
          {view === 'prostats' && <ProfessionalMetricsView trades={visible} />}
          {view === 'risk' && <RiskView trades={visible} />}
          {view === 'psych' && <PsychologyView trades={visible} setFilters={setFilters} />}
          {view === 'coach' && <CoachView trades={visible} />}
          {view === 'reports' && <ReportsView trades={visible} />}
          {view === 'settings' && <SettingsView />}
        </main>
      </div>

      <TradeForm open={formOpen} quick={quick} initial={editing || blankTrade(state.activeAccountId)} onClose={() => setFormOpen(false)} />
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  )
}

function Root() {
  const { state } = useStore()
  if (!state) return <div className='min-h-screen bg-slate-50 dark:bg-slate-950'><Spinner /></div>
  return <Shell />
}

export default function App() {
  return (
    <StoreProvider>
      <ErrorBoundary>
        <Root />
      </ErrorBoundary>
    </StoreProvider>
  )
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div className='min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4'>
          <div className='max-w-md text-center'>
            <div className='mb-2 text-5xl'>💥</div>
            <h2 className='text-lg font-bold text-slate-900 dark:text-slate-100'>Something went wrong</h2>
            <p className='mt-1 text-sm text-slate-500'>{this.state.error.message}</p>
            <button className='mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500'
              onClick={() => { this.setState({ error: null }); window.location.reload() }}>
              Reload app
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}