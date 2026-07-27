// src/components/Heatmaps.jsx
import React, { useState, useMemo } from 'react'
import { cx, Card, btnGhost } from './UIPrimitives'
import { fmtMoney, DOW } from '../lib/calculations'
import { tradePnl } from '../lib/calculations'

const localDay = (iso) => {
  if (!iso) return null
  const d = new Date(iso)
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}
const keyFor = (mo, d) => mo.y + '-' + String(mo.m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0')
const hourOf = (iso) => (iso ? new Date(iso).getHours() : null)

export function TimeOfDayHeatmap({ trades, onDrillHour }) {
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

export function CalendarHeat({ trades, onDrillDay, compact }) {
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
        <span className={cx('ml-2 tabular-nums', pnl > 0 ? 'text-emerald-500' : pnl < 0 ? 'text-rose-500' : '')}>{fmtMoney(monthPnl)}</span>
      </div>
    }>
      <div className='grid grid-cols-7 gap-1 text-center text-xs text-slate-400'>
        {DOW.map((d) => <div key={d} className='py-1'>{d}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />
          const pnlVal = daily[keyFor(month, d)]
          const bg = pnlVal == null ? undefined : pnlVal >= 0
            ? 'rgba(16,185,129,' + (0.2 + 0.8 * Math.abs(pnlVal) / max) + ')'
            : 'rgba(244,63,94,' + (0.2 + 0.8 * Math.abs(pnlVal) / max) + ')'
          return (
            <div key={i} className='flex h-14 cursor-pointer flex-col items-center justify-center rounded border border-slate-100 p-1 transition-opacity hover:opacity-80 dark:border-slate-800'
              style={{ background: bg }}
              onClick={() => onDrillDay && onDrillDay(keyFor(month, d))}>
              <span className={cx('text-[11px]', pnlVal != null && 'font-semibold text-white')}>{d}</span>
              {pnlVal != null && <span className='text-[10px] text-white/90'>{Math.round(pnlVal)}</span>}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
