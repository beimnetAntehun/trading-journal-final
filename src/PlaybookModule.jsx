// src/PlaybookModule.jsx
// Professional playbook workspace — self-contained sub-app.
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts'
import { createModel, createVersion, createScreenshot, recalcModelStats, playbookOverview, MODEL_STATUSES, MODEL_CATEGORIES, MODEL_MARKETS } from './lib/playbook'
import { db, uid } from './lib/storage'
import { isClosed, tradePnl, rMultiple, stats, DOW, fmtMoney, fmtPct } from './lib/calculations'

const cx = (...a) => a.filter(Boolean).join(' ')
const card = 'rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
const inputCls = 'w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500'
const btn = 'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40'
const btnPrimary = cx(btn, 'bg-indigo-600 text-white hover:bg-indigo-500')
const btnGhost = cx(btn, 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800')
const btnDanger = cx(btn, 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950')
const pnlColor = (n) => (n > 0 ? 'text-emerald-500' : n < 0 ? 'text-rose-500' : 'text-slate-400')

const PB_NAV = [
  ['overview', 'Overview', '🏠'],
  ['models', 'My Models', '📚'],
  ['create', 'Create Model', '➕'],
  ['stats', 'Statistics', '📊'],
  ['version', 'Version History', '🕒'],
]

const AXIS = '#94a3b8'
const GRID = 'rgba(148,163,184,0.15)'
const tipStyle = { background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: 12 }

/* ===================== Sub-components ===================== */

function Empty({ icon, title, hint }) {
  return (
    <div className='flex flex-col items-center justify-center py-14 text-center'>
      <div className='mb-2 text-4xl opacity-70'>{icon}</div>
      <p className='font-medium'>{title}</p>
      {hint && <p className='mt-1 max-w-sm text-sm text-slate-500'>{hint}</p>}
    </div>
  )
}

function MiniStat({ label, value, tone, sub }) {
  return (
    <div className='rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900'>
      <div className='text-[10px] font-medium uppercase tracking-wider text-slate-500'>{label}</div>
      <div className={cx('mt-0.5 text-lg font-bold tabular-nums', tone)}>{value}</div>
      {sub && <div className='text-[10px] text-slate-400'>{sub}</div>}
    </div>
  )
}

function ModelCard({ model, onOpen, onToggleFav, onStatusChange }) {
  const s = model
  const wr = s.winRate != null ? (typeof s.winRate === 'number' ? s.winRate : 0) : 0
  const avgR = s.avgR ?? 0
  const pf = s.profitFactor ?? 0
  return (
    <div className={cx(card, 'group cursor-pointer p-3 transition-all hover:shadow-md')} onClick={() => onOpen && onOpen(model)}>
      <div className='flex items-start justify-between gap-2'>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-1.5'>
            <span className='text-lg'>{model.favorite ? '⭐' : '📘'}</span>
            <h3 className='font-semibold text-sm truncate'>{model.name}</h3>
          </div>
          <div className='mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400'>
            <span className='rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800'>{model.category}</span>
            <span>{model.market}</span>
            <span>{model.timeframe}</span>
            <span className={cx('rounded-full px-1.5 py-0.5', model.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : model.status === 'Testing' ? 'bg-amber-500/10 text-amber-400' : model.status === 'Archived' ? 'bg-slate-500/10 text-slate-400' : 'bg-indigo-500/10 text-indigo-400')}>{model.status}</span>
          </div>
        </div>
        <div className='flex gap-0.5'>
          <button className={cx(btnGhost, 'px-1 py-0 text-xs')} onClick={(e) => { e.stopPropagation(); onToggleFav && onToggleFav(model.id) }}>{model.favorite ? '⭐' : '☆'}</button>
        </div>
      </div>
      {(s.tradeCount != null && s.tradeCount > 0) ? (
        <div className='mt-2 grid grid-cols-3 gap-1 text-center text-xs'>
          <div><div className='text-slate-400'>WR</div><div className={cx('font-semibold tabular-nums', wr >= 50 ? 'text-emerald-500' : 'text-rose-500')}>{wr.toFixed(0)}%</div></div>
          <div><div className='text-slate-400'>Avg R</div><div className={cx('font-semibold tabular-nums', avgR > 0 ? 'text-emerald-500' : avgR < 0 ? 'text-rose-500' : '')}>{avgR.toFixed(2)}</div></div>
          <div><div className='text-slate-400'>PF</div><div className={cx('font-semibold tabular-nums', pf >= 1.5 ? 'text-emerald-500' : 'text-rose-500')}>{pf === Infinity ? '∞' : pf.toFixed(1)}</div></div>
          <div className='col-span-3 mt-1 text-[10px] text-slate-400'>{s.tradeCount} trades</div>
        </div>
      ) : (
        <div className='mt-2 text-[10px] text-slate-400'>No linked trades yet</div>
      )}
    </div>
  )
}

/* ===================== Overview Page ===================== */

function OverviewPage({ models, allTrades, onNavigate }) {
  const ov = useMemo(() => playbookOverview(models), [models])
  const statsAll = useMemo(() => {
    const linked = models.filter((m) => m.tradeCount > 0)
    const best = linked.length ? [...linked].sort((a, b) => (b.totalPnl ?? 0) - (a.totalPnl ?? 0))[0] : null
    const worst = linked.length ? [...linked].sort((a, b) => (a.totalPnl ?? 0) - (b.totalPnl ?? 0))[0] : null
    const avgWR = linked.length ? linked.reduce((s, m) => s + (m.winRate ?? 0), 0) / linked.length : 0
    const avgR = linked.length ? linked.reduce((s, m) => s + (m.avgR ?? 0), 0) / linked.length : 0
    return { best, worst, avgWR, avgR }
  }, [models])

  const recentUpdates = useMemo(() => [...models].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5), [models])

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8'>
        <MiniStat label='Total Models' value={ov.total} tone='text-indigo-500' />
        <MiniStat label='Active' value={ov.active} tone='text-emerald-500' />
        <MiniStat label='Testing' value={ov.testing} tone='text-amber-500' />
        <MiniStat label='Archived' value={ov.archived} tone='text-slate-400' />
        <MiniStat label='Favorites' value={ov.favorites} tone='text-amber-500' sub='⭐' />
        <MiniStat label='Avg WR' value={statsAll.avgWR ? fmtPct(statsAll.avgWR) : '—'} tone='text-indigo-500' />
        <MiniStat label='Avg R' value={statsAll.avgR ? statsAll.avgR.toFixed(2) + 'R' : '—'} tone={statsAll.avgR > 0 ? 'text-emerald-500' : 'text-slate-400'} />
        <MiniStat label='Total Trades Linked' value={models.reduce((s, m) => s + (m.tradeCount ?? 0), 0)} tone='text-indigo-500' />
      </div>

      {models.length === 0 ? (
        <Empty icon='📘' title='No models yet' hint='Create your first trading model to start building your playbook.' />
      ) : (
        <div className='grid gap-3 lg:grid-cols-2'>
          <div className={cx(card, 'p-3')}>
            <h3 className='mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500'>Best Model</h3>
            {statsAll.best ? (
              <div className='space-y-1'>
                <div className='flex items-center gap-2'><span className='text-lg'>🥇</span><span className='text-sm font-semibold'>{statsAll.best.name}</span></div>
                <div className='grid grid-cols-3 gap-1 text-[10px]'><span className='text-slate-400'>P&L:</span><span className={cx('font-semibold', pnlColor(statsAll.best.totalPnl ?? 0))} colSpan={2}>{fmtMoney(statsAll.best.totalPnl ?? 0)}</span><span className='text-slate-400'>WR:</span><span className='font-semibold' colSpan={2}>{fmtPct(statsAll.best.winRate ?? 0)}</span></div>
              </div>
            ) : <p className='text-xs text-slate-400'>No model data yet</p>}
          </div>
          <div className={cx(card, 'p-3')}>
            <h3 className='mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500'>Recent Updates</h3>
            <div className='space-y-1'>
              {recentUpdates.map((m) => (
                <div key={m.id} className='flex items-center justify-between text-[10px]'>
                  <span className='font-medium'>{m.name}</span>
                  <span className='text-slate-400'>{new Date(m.updatedAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ===================== My Models Page ===================== */

function ModelsPage({ models, onOpen, onToggleFav, onStatusChange, onNavigate }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [sortKey, setSortKey] = useState('updatedAt')

  const filtered = useMemo(() => {
    let list = [...models]
    if (search.trim()) { const q = search.toLowerCase(); list = list.filter((m) => m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)) }
    if (statusFilter) list = list.filter((m) => m.status === statusFilter)
    const keyFn = sortKey === 'name' ? (m) => m.name : sortKey === 'winRate' ? (m) => -(m.winRate ?? 0) : sortKey === 'updatedAt' ? (m) => -m.updatedAt : (m) => -(m.tradeCount ?? 0)
    list.sort((a, b) => keyFn(a) > keyFn(b) ? 1 : -1)
    return list
  }, [models, search, statusFilter, sortKey])

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap items-center gap-2'>
        <input className={cx(inputCls, 'max-w-xs')} placeholder='Search models...' value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className={cx(inputCls, 'w-auto')} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value=''>All Status</option>
          {MODEL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className={cx(inputCls, 'w-auto')} value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
          <option value='updatedAt'>Last Updated</option>
          <option value='name'>Name</option>
          <option value='winRate'>Win Rate</option>
          <option value='tradeCount'>Trades</option>
        </select>
        <div className='flex rounded-lg border border-slate-200 dark:border-slate-700'>
          <button className={cx(btnGhost, 'rounded-r-none text-xs', viewMode === 'grid' && 'bg-indigo-500/10 text-indigo-500')} onClick={() => setViewMode('grid')}>📱 Grid</button>
          <button className={cx(btnGhost, 'rounded-l-none text-xs', viewMode === 'list' && 'bg-indigo-500/10 text-indigo-500')} onClick={() => setViewMode('list')}>📋 List</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Empty icon='📚' title='No models found' hint={search ? 'Try a different search.' : 'Create your first model.'} />
      ) : viewMode === 'grid' ? (
        <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'>{filtered.map((m) => <ModelCard key={m.id} model={m} onOpen={onOpen} onToggleFav={onToggleFav} />)}</div>
      ) : (
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60'>
              <tr>
                <th className='px-3 py-2'>Name</th><th className='px-3 py-2'>Status</th><th className='px-3 py-2'>Category</th>
                <th className='px-3 py-2 text-right'>Trades</th><th className='px-3 py-2 text-right'>WR</th><th className='px-3 py-2 text-right'>Avg R</th><th className='px-3 py-2 text-right'>P&L</th>
                <th className='px-2 py-2'></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className='cursor-pointer border-t border-slate-100 hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/30' onClick={() => onOpen(m)}>
                  <td className='px-3 py-1.5 font-medium'>{m.name}</td>
                  <td className='px-3 py-1.5'><span className={cx('rounded-full px-1.5 py-0.5 text-[10px]', m.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : m.status === 'Testing' ? 'bg-amber-500/10 text-amber-400' : m.status === 'Archived' ? 'bg-slate-500/10 text-slate-400' : 'bg-indigo-500/10 text-indigo-400')}>{m.status}</span></td>
                  <td className='px-3 py-1.5 text-slate-500'>{m.category}</td>
                  <td className='px-3 py-1.5 text-right tabular-nums'>{m.tradeCount ?? 0}</td>
                  <td className={cx('px-3 py-1.5 text-right tabular-nums', (m.winRate ?? 0) >= 50 ? 'text-emerald-500' : 'text-rose-500')}>{fmtPct(m.winRate ?? 0)}</td>
                  <td className={cx('px-3 py-1.5 text-right tabular-nums', (m.avgR ?? 0) > 0 ? 'text-emerald-500' : (m.avgR ?? 0) < 0 ? 'text-rose-500' : '')}>{(m.avgR ?? 0).toFixed(2)}R</td>
                  <td className={cx('px-3 py-1.5 text-right tabular-nums', pnlColor(m.totalPnl ?? 0))}>{fmtMoney(m.totalPnl ?? 0)}</td>
                  <td className='px-2 py-1.5 text-center'>
                    <button className={cx(btnGhost, 'px-1 py-0 text-xs')} onClick={(e) => { e.stopPropagation(); onToggleFav(m.id) }}>{m.favorite ? '⭐' : '☆'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ===================== Create / Edit Model ===================== */

function CreateModelPage({ models, onSave, onBack }) {
  const [model, setModel] = useState(() => createModel())
  const [saved, setSaved] = useState(false)

  const set = (k, v) => setModel((p) => ({ ...p, [k]: v }))

  const handleSave = () => {
    onSave(model)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-sm font-semibold text-slate-500 dark:text-slate-400'>Create New Trading Model</h3>
        <div className='flex items-center gap-2'>
          {saved && <span className='text-xs text-emerald-500'>✓ Saved</span>}
          <button className={btnPrimary} onClick={handleSave}>Save Model</button>
        </div>
      </div>

      {/* Basic Info */}
      <div className={cx(card, 'p-3')}>
        <h4 className='mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500'>Basic Information</h4>
        <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-4'>
          <label className='block'><span className='mb-1 block text-xs text-slate-400'>Model Name</span><input className={inputCls} value={model.name} onChange={(e) => set('name', e.target.value)} placeholder='My Model' /></label>
          <label className='block'><span className='mb-1 block text-xs text-slate-400'>Category</span><select className={inputCls} value={model.category} onChange={(e) => set('category', e.target.value)}>{MODEL_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className='block'><span className='mb-1 block text-xs text-slate-400'>Market</span><select className={inputCls} value={model.market} onChange={(e) => set('market', e.target.value)}>{MODEL_MARKETS.map((m) => <option key={m}>{m}</option>)}</select></label>
          <label className='block'><span className='mb-1 block text-xs text-slate-400'>Status</span><select className={inputCls} value={model.status} onChange={(e) => set('status', e.target.value)}>{MODEL_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></label>
          <label className='block md:col-span-2'><span className='mb-1 block text-xs text-slate-400'>Timeframe(s)</span><input className={inputCls} value={model.timeframe} onChange={(e) => set('timeframe', e.target.value)} placeholder='1H, 15M' /></label>
          <label className='block md:col-span-2'><span className='mb-1 block text-xs text-slate-400'>Description</span><textarea className={inputCls} rows={2} value={model.description} onChange={(e) => set('description', e.target.value)} placeholder='Describe your model...' /></label>
        </div>
      </div>

      {/* Market Conditions */}
      <div className={cx(card, 'p-3')}>
        <h4 className='mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500'>Market Conditions</h4>
        <div className='grid gap-3 md:grid-cols-3'>
          <label className='block'><span className='mb-1 block text-xs text-slate-400'>Trend</span><input className={inputCls} value={model.marketConditions?.trend ?? ''} onChange={(e) => set('marketConditions', { ...model.marketConditions, trend: e.target.value })} placeholder='Uptrend / Downtrend / Ranging' /></label>
          <label className='block'><span className='mb-1 block text-xs text-slate-400'>Volatility</span><input className={inputCls} value={model.marketConditions?.volatility ?? ''} onChange={(e) => set('marketConditions', { ...model.marketConditions, volatility: e.target.value })} placeholder='High / Medium / Low' /></label>
          <label className='block'><span className='mb-1 block text-xs text-slate-400'>Session</span><input className={inputCls} value={model.marketConditions?.session ?? ''} onChange={(e) => set('marketConditions', { ...model.marketConditions, session: e.target.value })} placeholder='London, NY, Asia...' /></label>
        </div>
      </div>

      {/* Entry Rules */}
      <div className={cx(card, 'p-3')}>
        <h4 className='mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500'>Entry Rules</h4>
        <div className='space-y-1.5'>
          {(model.entryRules || []).map((r, i) => (
            <div key={r.id} className='flex items-center gap-2'>
              <span className='text-xs text-slate-400 w-5'>#{i + 1}</span>
              <input className={inputCls} value={r.rule} onChange={(e) => { const next = [...model.entryRules]; next[i] = { ...r, rule: e.target.value }; set('entryRules', next) }} placeholder='Enter rule...' />
              <button className={btnDanger} onClick={() => set('entryRules', model.entryRules.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
          <button className={btnGhost} onClick={() => set('entryRules', [...(model.entryRules || []), { id: uid('er'), rule: '', type: 'entry' }])}>+ Add Rule</button>
        </div>
      </div>

      {/* Exit Rules */}
      <div className={cx(card, 'p-3')}>
        <h4 className='mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500'>Exit Rules</h4>
        <div className='space-y-1.5'>
          {(model.exitRules || []).map((r, i) => (
            <div key={r.id} className='flex items-center gap-2'>
              <span className='text-xs text-slate-400 w-5'>#{i + 1}</span>
              <input className={inputCls} value={r.rule} onChange={(e) => { const next = [...model.exitRules]; next[i] = { ...r, rule: e.target.value }; set('exitRules', next) }} placeholder='Exit rule...' />
              <button className={btnDanger} onClick={() => set('exitRules', model.exitRules.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
          <button className={btnGhost} onClick={() => set('exitRules', [...(model.exitRules || []), { id: uid('xr'), rule: '', type: 'exit' }])}>+ Add Rule</button>
        </div>
      </div>

      {/* Risk Rules */}
      <div className={cx(card, 'p-3')}>
        <h4 className='mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500'>Risk Rules</h4>
        <div className='grid gap-3 grid-cols-2 md:grid-cols-4'>
          <label className='block'><span className='mb-1 block text-xs text-slate-400'>Max Risk %</span><input type='number' className={inputCls} value={model.riskRules?.maxRiskPct ?? ''} onChange={(e) => set('riskRules', { ...model.riskRules, maxRiskPct: Number(e.target.value) })} /></label>
          <label className='block'><span className='mb-1 block text-xs text-slate-400'>Min R:R</span><input type='number' step='any' className={inputCls} value={model.riskRules?.minRR ?? ''} onChange={(e) => set('riskRules', { ...model.riskRules, minRR: Number(e.target.value) })} /></label>
          <label className='block'><span className='mb-1 block text-xs text-slate-400'>Max Trades/Day</span><input type='number' className={inputCls} value={model.riskRules?.maxDailyTrades ?? ''} onChange={(e) => set('riskRules', { ...model.riskRules, maxDailyTrades: Number(e.target.value) })} /></label>
          <label className='block'><span className='mb-1 block text-xs text-slate-400'>Max Spread</span><input className={inputCls} value={model.riskRules?.maxSpread ?? ''} onChange={(e) => set('riskRules', { ...model.riskRules, maxSpread: e.target.value })} /></label>
        </div>
      </div>

      {/* Notes */}
      <div className={cx(card, 'p-3')}>
        <h4 className='mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500'>Notes</h4>
        <textarea className={inputCls} rows={3} value={model.notes} onChange={(e) => set('notes', e.target.value)} placeholder='Additional notes about this model...' />
      </div>

      {/* Screenshot Gallery */}
      <div className={cx(card, 'p-3')}>
        <h4 className='mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500'>Model Pictures / Screenshots</h4>
        <p className='mb-3 text-[11px] text-slate-400'>Add chart screenshots, setup diagrams, or any images that describe your model.</p>
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'>
          {/* Existing images */}
          {(model.screenshots || []).map((ss, i) => (
            <div key={ss.id} className='group relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700'>
              <img src={ss.src} alt={ss.title || 'Screenshot'} className='aspect-video w-full object-cover' />
              <div className='absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1'>
                <button
                  type='button'
                  onClick={() => {
                    const next = (model.screenshots || []).filter((_, j) => j !== i)
                    set('screenshots', next)
                  }}
                  className='rounded bg-rose-500 px-2 py-1 text-[10px] text-white font-medium hover:bg-rose-600'
                >✕ Remove</button>
              </div>
              {ss.title && (
                <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5'>
                  <span className='text-[10px] text-white font-medium truncate block'>{ss.title}</span>
                </div>
              )}
            </div>
          ))}

          {/* Add new image button */}
          <label className='flex aspect-video cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors bg-slate-50 dark:bg-slate-800/50'>
            <svg className='h-6 w-6 text-slate-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 4v16m8-8H4' />
            </svg>
            <span className='text-[10px] font-medium text-slate-400'>Add Picture</span>
            <input
              type='file'
              accept='image/*'
              className='hidden'
              onChange={(e) => {
                const file = e.target.files && e.target.files[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = () => {
                  const newScreenshot = {
                    id: uid('ss'),
                    src: reader.result,
                    title: file.name.replace(/\.[^.]+$/, ''),
                    description: '',
                    tags: [],
                    category: 'Setup',
                    notes: '',
                    createdAt: Date.now(),
                  }
                  set('screenshots', [...(model.screenshots || []), newScreenshot])
                }
                reader.readAsDataURL(file)
                // Reset input so the same file can be re-added if needed
                e.target.value = ''
              }}
            />
          </label>
        </div>
      </div>
    </div>
  )
}

/* ===================== Model Detail View ===================== */

function ModelDetailView({ model, allTrades, onBack, onSave, onToggleFav }) {
  const [tab, setTab] = useState('overview')
  const [editNotes, setEditNotes] = useState(model.notes || '')
  const linkedTrades = allTrades.filter((t) => t.modelId === model.id)
  const closed = linkedTrades.filter(isClosed)
  const s = useMemo(() => stats(closed), [closed])

  const tabs = [
    ['overview', 'Overview', '📊'],
    ['entries', 'Entry Rules', '📥'],
    ['exits', 'Exit Rules', '📤'],
    ['risk', 'Risk Rules', '🛡️'],
    ['journal', 'Journal', '📝'],
    ['trades', 'Linked Trades', '📋'],
    ['notes', 'Notes', '📌'],
  ]

  if (!model) return null

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between gap-2 flex-wrap'>
        <div className='flex items-center gap-2'>
          <button className={btnGhost} onClick={onBack}>← Back</button>
          <h2 className='text-lg font-bold'>{model.name}</h2>
          <span className={cx('rounded-full px-2 py-0.5 text-[10px]', model.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : model.status === 'Testing' ? 'bg-amber-500/10 text-amber-400' : model.status === 'Archived' ? 'bg-slate-500/10 text-slate-400' : 'bg-indigo-500/10 text-indigo-400')}>{model.status}</span>
        </div>
        <div className='flex items-center gap-1'>
          <button className={btnGhost} onClick={() => onToggleFav(model.id)}>{model.favorite ? '⭐' : '☆'}</button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className='flex overflow-x-auto gap-1 pb-1'>
        {tabs.map(([id, label, icon]) => (
          <button key={id} onClick={() => setTab(id)}
            className={cx('whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium', tab === id ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800')}>{icon} {label}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className='space-y-3'>
          <div className='grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8'>
            <MiniStat label='Trades' value={s.count} /><MiniStat label='Win Rate' value={fmtPct(s.winRate)} tone={s.winRate >= 50 ? 'text-emerald-500' : 'text-rose-500'} /><MiniStat label='Avg R' value={s.avgR.toFixed(2) + 'R'} tone={s.avgR > 0 ? 'text-emerald-500' : 'text-rose-500'} /><MiniStat label='Profit Factor' value={s.profitFactor === Infinity ? '∞' : s.profitFactor.toFixed(2)} tone={s.profitFactor >= 1.5 ? 'text-emerald-500' : 'text-rose-500'} /><MiniStat label='Total P&L' value={fmtMoney(s.totalPnl)} tone={pnlColor(s.totalPnl)} /><MiniStat label='Expectancy' value={fmtMoney(s.expectancy)} tone={s.expectancy > 0 ? 'text-emerald-500' : 'text-rose-500'} /><MiniStat label='Streak' value={(s.streak > 0 ? '+' : '') + s.streak} tone={pnlColor(s.streak)} /><MiniStat label='Max DD' value={s.count > 0 ? Math.abs(drawdownSeries(equityCurve(closed, 0, [])).maxDd).toFixed(1) + '%' : '—'} />
          </div>
          <div className={cx(card, 'p-3')}>
            <h4 className='mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500'>Details</h4>
            <div className='grid grid-cols-2 gap-1 text-xs'><span className='text-slate-400'>Category:</span><span>{model.category}</span><span className='text-slate-400'>Market:</span><span>{model.market}</span><span className='text-slate-400'>Timeframe:</span><span>{model.timeframe}</span><span className='text-slate-400'>Version:</span><span>v{model.version}</span><span className='text-slate-400'>Created:</span><span>{new Date(model.createdAt).toLocaleDateString()}</span></div>
          </div>

          {/* Screenshots gallery in overview */}
          {(model.screenshots || []).length > 0 && (
            <div className={cx(card, 'p-3')}>
              <h4 className='mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500'>Model Pictures ({model.screenshots.length})</h4>
              <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4'>
                {model.screenshots.map((ss) => (
                  <div key={ss.id} className='overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700'>
                    <img src={ss.src} alt={ss.title || 'Screenshot'} className='aspect-video w-full object-cover' />
                    {ss.title && <div className='px-2 py-1 text-[10px] text-slate-500 truncate'>{ss.title}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'entries' && (
        <div className={cx(card, 'p-3')}>
          <h4 className='mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500'>Entry Rules</h4>
          {model.entryRules?.length ? model.entryRules.map((r, i) => (
            <div key={r.id} className='flex items-start gap-2 border-t border-slate-100 py-1.5 text-sm dark:border-slate-800'><span className='font-semibold text-indigo-500'>#{i + 1}</span><span>{r.rule || '(empty)'}</span></div>
          )) : <p className='text-xs text-slate-400'>No entry rules defined.</p>}
        </div>
      )}

      {tab === 'exits' && (
        <div className={cx(card, 'p-3')}>
          <h4 className='mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500'>Exit Rules</h4>
          {model.exitRules?.length ? model.exitRules.map((r, i) => (
            <div key={r.id} className='flex items-start gap-2 border-t border-slate-100 py-1.5 text-sm dark:border-slate-800'><span className='font-semibold text-rose-500'>#{i + 1}</span><span>{r.rule || '(empty)'}</span></div>
          )) : <p className='text-xs text-slate-400'>No exit rules defined.</p>}
        </div>
      )}

      {tab === 'risk' && (
        <div className={cx(card, 'p-3')}>
          <h4 className='mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500'>Risk Rules</h4>
          {model.riskRules ? (
            <div className='grid grid-cols-2 gap-1 text-xs'><span className='text-slate-400'>Max Risk %:</span><span>{model.riskRules.maxRiskPct ?? '—'}%</span><span className='text-slate-400'>Min R:R:</span><span>{model.riskRules.minRR ?? '—'}:1</span><span className='text-slate-400'>Max Trades/Day:</span><span>{model.riskRules.maxDailyTrades ?? '—'}</span><span className='text-slate-400'>Max Spread:</span><span>{model.riskRules.maxSpread || '—'}</span></div>
          ) : <p className='text-xs text-slate-400'>No risk rules defined.</p>}
        </div>
      )}

      {tab === 'journal' && (
        <div className={cx(card, 'p-3')}>
          <h4 className='mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500'>Model Journal</h4>
          <div className='space-y-3'>
            {['lessons', 'mistakes', 'improvements', 'ideas', 'reviewNotes'].map((f) => (
              <label key={f} className='block'>
                <span className='mb-1 block text-xs font-medium text-slate-400 capitalize'>{f.replace(/([A-Z])/g, ' $1').trim()}</span>
                <textarea className={inputCls} rows={2} value={model.journal?.[f] ?? ''}
                  onChange={(e) => {
                    const updated = { ...model, journal: { ...model.journal, [f]: e.target.value } }
                    onSave(updated)
                  }} placeholder={`Add ${f}...`} />
              </label>
            ))}
          </div>
        </div>
      )}

      {tab === 'trades' && (
        <div className={cx(card)}>
          <div className='border-b border-slate-200 px-3 py-2 dark:border-slate-800'><h4 className='text-xs font-semibold uppercase tracking-wider text-slate-500'>Linked Trades ({linkedTrades.length})</h4></div>
          {linkedTrades.length ? (
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead className='text-left text-xs text-slate-500'><tr><th className='px-3 py-1.5'>Date</th><th className='px-3 py-1.5'>Symbol</th><th className='px-3 py-1.5 text-right'>P&L</th><th className='px-3 py-1.5 text-right'>R</th></tr></thead>
                <tbody>
                  {linkedTrades.sort((a, b) => new Date(b.exitDate || b.entryDate) - new Date(a.exitDate || a.entryDate)).map((t) => (
                    <tr key={t.id} className='border-t border-slate-100 dark:border-slate-800'>
                      <td className='px-3 py-1 text-xs text-slate-500'>{(t.exitDate || t.entryDate || '').slice(0, 10)}</td>
                      <td className='px-3 py-1 font-medium'>{t.symbol}</td>
                      <td className={cx('px-3 py-1 text-right tabular-nums', pnlColor(tradePnl(t) || 0))}>{fmtMoney(tradePnl(t))}</td>
                      <td className={cx('px-3 py-1 text-right tabular-nums', (rMultiple(t) || 0) > 0 ? 'text-emerald-500' : (rMultiple(t) || 0) < 0 ? 'text-rose-500' : '')}>{rMultiple(t) != null ? rMultiple(t).toFixed(2) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className='p-3 text-xs text-slate-400'>No trades linked to this model yet.</p>}
        </div>
      )}

      {tab === 'notes' && (
        <div className={cx(card, 'p-3')}>
          <h4 className='mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500'>Notes</h4>
          <textarea className={inputCls} rows={6} value={editNotes} onChange={(e) => setEditNotes(e.target.value)}
            onBlur={() => onSave({ ...model, notes: editNotes })} placeholder='Add notes about this model...' />
        </div>
      )}
    </div>
  )
}

/* ===================== Statistics Page ===================== */

function StatsPage({ models }) {
  const withData = models.filter((m) => (m.tradeCount ?? 0) >= 2)
  const chartData = useMemo(() => withData.map((m) => ({ name: m.name, wr: m.winRate ?? 0, avgR: m.avgR ?? 0, pf: m.profitFactor ?? 0, trades: m.tradeCount ?? 0, pnl: m.totalPnl ?? 0 })), [withData])

  return (
    <div className='space-y-4'>
      {withData.length < 2 ? (
        <Empty icon='📊' title='Need more data' hint='At least 2 models with linked trades are needed to show comparison charts.' />
      ) : (
        <>
          <div className='grid gap-3 lg:grid-cols-2'>
            <div className={cx(card, 'p-3')}>
              <h4 className='mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500'>Win Rate Comparison</h4>
              <ResponsiveContainer width='100%' height={220}><BarChart data={chartData}><CartesianGrid stroke={GRID} vertical={false} /><XAxis dataKey='name' tick={{ fontSize: 10, fill: AXIS }} /><YAxis tick={{ fontSize: 10, fill: AXIS }} width={30} domain={[0, 100]} /><Tooltip contentStyle={tipStyle} /><Bar dataKey='wr' name='Win Rate %'>{chartData.map((d, i) => <Cell key={i} fill={d.wr >= 50 ? '#10b981' : '#f43f5e'} />)}</Bar></BarChart></ResponsiveContainer>
            </div>
            <div className={cx(card, 'p-3')}>
              <h4 className='mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500'>Avg R Comparison</h4>
              <ResponsiveContainer width='100%' height={220}><BarChart data={chartData}><CartesianGrid stroke={GRID} vertical={false} /><XAxis dataKey='name' tick={{ fontSize: 10, fill: AXIS }} /><YAxis tick={{ fontSize: 10, fill: AXIS }} width={30} /><Tooltip contentStyle={tipStyle} /><Bar dataKey='avgR' name='Avg R'>{chartData.map((d, i) => <Cell key={i} fill={d.avgR > 0 ? '#10b981' : '#f43f5e'} />)}</Bar></BarChart></ResponsiveContainer>
            </div>
          </div>
          <div className='grid gap-3 lg:grid-cols-2'>
            <div className={cx(card, 'p-3')}>
              <h4 className='mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500'>Profit Factor Comparison</h4>
              <ResponsiveContainer width='100%' height={220}><BarChart data={chartData}><CartesianGrid stroke={GRID} vertical={false} /><XAxis dataKey='name' tick={{ fontSize: 10, fill: AXIS }} /><YAxis tick={{ fontSize: 10, fill: AXIS }} width={30} /><Tooltip contentStyle={tipStyle} /><Bar dataKey='pf' name='Profit Factor'>{chartData.map((d, i) => <Cell key={i} fill={d.pf >= 1.5 ? '#10b981' : '#f43f5e'} />)}</Bar></BarChart></ResponsiveContainer>
            </div>
            <div className={cx(card, 'p-3')}>
              <h4 className='mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500'>Trades Per Model</h4>
              <ResponsiveContainer width='100%' height={220}><BarChart data={chartData}><CartesianGrid stroke={GRID} vertical={false} /><XAxis dataKey='name' tick={{ fontSize: 10, fill: AXIS }} /><YAxis tick={{ fontSize: 10, fill: AXIS }} width={30} /><Tooltip contentStyle={tipStyle} /><Bar dataKey='trades' name='Trades' fill='#6366f1' /></BarChart></ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/* ===================== Version History Page ===================== */

function VersionPage({ models }) {
  const allVersions = useMemo(() => {
    const v = []
    models.forEach((m) => (m.versions || []).forEach((ver) => v.push({ ...ver, modelName: m.name, modelId: m.id })))
    return v.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [models])

  return (
    <div className='space-y-3'>
      {allVersions.length === 0 ? (
        <Empty icon='🕒' title='No version history' hint='Versions are created when you save changes to a model.' />
      ) : (
        <div className='space-y-1.5'>
          {allVersions.map((v, i) => (
            <div key={i} className={cx(card, 'flex items-start gap-3 p-3')}>
              <span className='rounded-lg bg-indigo-500/10 px-2 py-1 text-xs font-bold text-indigo-400'>v{v.number}</span>
              <div className='flex-1'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>{v.modelName}</span>
                  <span className='text-[10px] text-slate-400'>{new Date(v.date).toLocaleDateString()}</span>
                </div>
                {v.changes && <p className='text-xs text-slate-500 mt-0.5'>{v.changes}</p>}
                {v.reason && <p className='text-[10px] text-slate-400 mt-0.5'>{v.reason}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ===================== Main Playbook Module ===================== */

export default function PlaybookModule({ allTrades, models: externalModels, onModelsChange }) {
  const [subView, setSubView] = useState('overview')
  const [models, setModels] = useState(externalModels || [])
  const [selectedModel, setSelectedModel] = useState(null)

  useEffect(() => { setModels(externalModels || []) }, [externalModels])

  const saveModels = (next) => {
    setModels(next)
    onModelsChange && onModelsChange(next)
  }

  const handleSaveModel = (model) => {
    const idx = models.findIndex((m) => m.id === model.id)
    const next = idx >= 0 ? models.map((m, i) => i === idx ? model : m) : [...models, model]
    saveModels(next)
    setSubView('models')
  }

  const handleToggleFav = (id) => {
    const next = models.map((m) => m.id === id ? { ...m, favorite: !m.favorite } : m)
    saveModels(next)
  }

  const handleOpenModel = (model) => {
    setSelectedModel(model)
    setSubView('detail')
  }

  return (
    <div className='space-y-4'>
      {/* Playbook sub-navigation */}
      <div className='flex overflow-x-auto gap-1 pb-1'>
        {PB_NAV.map(([id, label, icon]) => (
          <button key={id} onClick={() => { setSubView(id); setSelectedModel(null) }}
            className={cx('whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              subView === id || (subView === 'create' && id === 'create') || (subView === 'detail' && id === 'models')
                ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800')}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Sub-view router */}
      {subView === 'overview' && <OverviewPage models={models} allTrades={allTrades} onNavigate={setSubView} />}
      {subView === 'models' && <ModelsPage models={models} onOpen={handleOpenModel} onToggleFav={handleToggleFav} onNavigate={setSubView} />}
      {subView === 'create' && <CreateModelPage models={models} onSave={handleSaveModel} onBack={() => setSubView('models')} />}
      {subView === 'detail' && selectedModel && (
        <ModelDetailView model={selectedModel} allTrades={allTrades} onBack={() => { setSubView('models'); setSelectedModel(null) }}
          onSave={(updated) => {
            const next = models.map((m) => m.id === updated.id ? updated : m)
            saveModels(next)
            setSelectedModel(updated)
          }}
          onToggleFav={handleToggleFav} />
      )}
      {subView === 'stats' && <StatsPage models={models} />}
      {subView === 'version' && <VersionPage models={models} />}
    </div>
  )
}
