// src/components/TradeForm.jsx
import React, { useState, useEffect, useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import { DIR, ASSET_CLASSES, tradePnl, tradePnlPct, rMultiple, riskPerTrade, isClosed } from '../lib/calculations'
import { cx, inputCls, btnPrimary, btnGhost, Modal, Field, Card } from './UIPrimitives'
import { StarRating, TagChips, ImageDrop } from './FormInputs'
import { fmtMoney, fmtPct } from '../lib/calculations'

const num = (v) => (v === '' || v == null ? null : Number(v))

export const blankTrade = (accountId) => ({
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

export function TradeForm({ open, onClose, initial, quick }) {
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
    if (wasOpen && isClosed(norm) && !reflect) { setReflect(true); return }
    onClose()
  }

  const inp = (k, props = {}) => (
    <input className={inputCls} value={t[k] ?? ''} onChange={(e) => set(k, e.target.value)} {...props} />
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); onSave() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <Modal open={open} onClose={onClose} wide title={t.id ? 'Edit trade' : quick ? 'Quick add' : 'New trade'}>
      {reflect ? (
        <div className='space-y-4'>
          <p className='text-sm text-slate-500'>Trade closed — take 20 seconds to reflect while it is fresh.</p>
          {state.reflectionPrompts.map((q, i) => (
            <Field key={i} label={q}>
              <textarea className={inputCls} rows={2} value={t.reflection[i] || ''}
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
          <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
            <Field label='Entered' error={errors.entryDate}>{inp('entryDate', { type: 'datetime-local' })}</Field>
            <Field label='Exited' error={errors.exitDate} hint='Leave blank if still open'>{inp('exitDate', { type: 'datetime-local' })}</Field>
            <Field label='Position size' error={errors.size}>{inp('size', { type: 'number', min: 0, step: 'any' })}</Field>
            <Field label='Leverage' hint='optional'>{inp('leverage', { type: 'number', min: 0, step: 'any' })}</Field>
          </div>
          <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
            <Field label='Entry price' error={errors.entryPrice}>{inp('entryPrice', { type: 'number', step: 'any' })}</Field>
            <Field label='Exit price' error={errors.exitPrice}>{inp('exitPrice', { type: 'number', step: 'any' })}</Field>
            <Field label='Stop loss'>{inp('stopLoss', { type: 'number', step: 'any' })}</Field>
            <Field label='Take profit'>{inp('takeProfit', { type: 'number', step: 'any' })}</Field>
          </div>
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
          <div className='grid grid-cols-2 gap-3 rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800/60 md:grid-cols-4'>
            <div><div className='text-xs text-slate-500'>Realized P&L</div><div className={cx('font-semibold', pnlColor(live.pnl || 0))}>{live.pnl == null ? '—' : fmtMoney(live.pnl)}</div></div>
            <div><div className='text-xs text-slate-500'>P&L %</div><div className={cx('font-semibold', pnlColor(live.pct || 0))}>{fmtPct(live.pct)}</div></div>
            <div><div className='text-xs text-slate-500'>R-multiple</div><div className='font-semibold'>{live.r == null ? '—' : live.r.toFixed(2) + 'R'}</div></div>
            <div><div className='text-xs text-slate-500'>Risk at stop</div><div className='font-semibold'>{live.risk == null ? '—' : fmtMoney(live.risk)}</div></div>
          </div>
        </div>
      )}
    </Modal>
  )
}

const btn = 'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40'
const pnlColor = (n) => (n > 0 ? 'text-emerald-500' : n < 0 ? 'text-rose-500' : 'text-slate-400')
