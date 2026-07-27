// src/components/UIPrimitives.jsx
import React from 'react'

const cx = (...a) => a.filter(Boolean).join(' ')
const card = 'rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
const inputCls = 'w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500'
const btn = 'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40'
const btnPrimary = cx(btn, 'bg-indigo-600 text-white hover:bg-indigo-500')
const btnGhost = cx(btn, 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800')
const btnDanger = cx(btn, 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950')
const pnlColor = (n) => (n > 0 ? 'text-emerald-500' : n < 0 ? 'text-rose-500' : 'text-slate-400')

export { cx, card, inputCls, btn, btnPrimary, btnGhost, btnDanger, pnlColor }

export function Card({ title, right, children, className }) {
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

export function Modal({ open, onClose, title, children, wide }) {
  React.useEffect(() => {
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

export const Field = ({ label, children, hint, error }) => (
  <label className='block'>
    <span className='mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400'>{label}</span>
    {children}
    {hint && !error && <span className='mt-1 block text-xs text-slate-400'>{hint}</span>}
    {error && <span className='mt-1 block text-xs text-rose-500'>{error}</span>}
  </label>
)

export const Empty = ({ icon = '📈', title, hint }) => (
  <div className='flex flex-col items-center justify-center py-14 text-center'>
    <div className='mb-2 text-4xl opacity-70'>{icon}</div>
    <p className='font-medium'>{title}</p>
    {hint && <p className='mt-1 max-w-sm text-sm text-slate-500'>{hint}</p>}
  </div>
)

export const Spinner = () => (
  <div className='flex items-center justify-center py-20 text-slate-400'>
    <div className='h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500' />
    <span className='ml-3 text-sm'>Loading your journal…</span>
  </div>
)

export const AXIS = '#94a3b8'
export const GRID = 'rgba(148,163,184,0.15)'
export const tipStyle = { background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: 12 }
