// src/components/FormInputs.jsx
import React from 'react'
import { inputCls, btnGhost, btnDanger } from './UIPrimitives'
import { Field } from './UIPrimitives'

export function StarRating({ value = 0, onChange }) {
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
const cx = (...a) => a.filter(Boolean).join(' ')

export function TagChips({ options, value = [], onChange }) {
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

export function ImageDrop({ label, value, onChange }) {
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
          <input type='file' accept='image/*' className='hidden' onChange={(e) => onFile(e.target.files && e.target.files[0])} />
        </label>
        {value && (
          <div className='relative'>
            <img src={value} alt={label} className='h-12 w-20 rounded object-cover ring-1 ring-slate-300 dark:ring-slate-700' />
            <button type='button' onClick={() => onChange(null)} className='absolute -right-2 -top-2 rounded-full bg-rose-500 px-1 text-xs text-white'>✕</button>
          </div>
        )}
      </div>
    </div>
  )
}

export function ListEditor({ label, items = [], onChange }) {
  const [val, setVal] = React.useState('')
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
