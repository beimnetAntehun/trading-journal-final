// src/components/LoginPage.jsx
// Professional full-page login / signup screen.
import React, { useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'

const cx = (...a) => a.filter(Boolean).join(' ')
const inputCls = 'w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500'
const btnPrimary = 'w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-40'

/* Trading chart background SVG – generated once, cached as a data URI */
function buildChartSvg() {
  const W = 1200, H = 800
  const g = [] // grid lines
  const c = [] // candlesticks
  const v = [] // volume bars
  const o = [] // overlays

  // ── grid ──
  for (let y = 50; y <= H; y += 40) {
    g.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#1a2540" stroke-width="0.5"/>`)
  }
  for (let x = 50; x <= W; x += 40) {
    g.push(`<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#1a2540" stroke-width="0.5"/>`)
  }

  // ── candlestick data ──
  const seeds = [
    530,555,540,570,560,585,575,555,530,510,530,550,565,580,595,
    580,565,545,525,545,560,580,595,610,625,610,595,615,635,620,
    600,620,645,630,615,595,615,630,650,665,650,635,655,675,660,
    640,660,680,665,645,625,645,665,685,700,685,665,685,705,690,
    670,690,710,695,675,655,675,695,710,730,715,695,715,735,720,
    700,720,740,725,705,685,705,725,745,760,745,725,745,760,745,
    725,745,765,750,730,710,730,750,765,780,765,745,765,785,770
  ]

  seeds.forEach((base, i) => {
    const x = 60 + i * 7
    const jitter = Math.sin(i * 0.7) * 30 + Math.cos(i * 0.3) * 20
    const close = base + jitter
    const bull = close > base
    const wickHi = Math.max(base, close) + 12 + Math.abs(Math.sin(i)) * 8
    const lo = Math.min(base, close) - 12 - Math.abs(Math.cos(i)) * 8
    const fill = bull ? '#16a34a' : '#dc2626'
    const stroke = bull ? '#22c55e' : '#ef4444'
    const top = Math.min(base, close)
    const barH = Math.abs(close - base) || 2

    c.push(`<line x1="${x}" y1="${lo}" x2="${x}" y2="${wickHi}" stroke="${fill}" stroke-width="0.7" stroke-opacity="0.7"/>`)
    c.push(`<rect x="${x - 2.5}" y="${top}" width="5" height="${barH}" fill="${fill}" stroke="${stroke}" stroke-width="0.5" stroke-opacity="0.7" rx="0.5"/>`)

    // volume bars (faint)
    const volH = 12 + Math.abs(Math.sin(i * 1.3)) * 35
    v.push(`<rect x="${x - 2}" y="${H - volH}" width="4" height="${volH}" fill="${fill}" opacity="0.15" rx="1"/>`)
  })

  // ── area overlay (trend fill) ──
  const pts = seeds.map((s, i) => `${60 + i * 7},${s + Math.sin(i * 0.7) * 30 + Math.cos(i * 0.3) * 20}`)
  o.push(`<polygon points="${pts.join(' ')} ${60 + (seeds.length - 1) * 7},${H} 60,${H}" fill="url(#areaGrad)" opacity="0.2"/>`)

  // ── moving averages ──
  const ma14 = seeds.map((_, i) => {
    const slice = seeds.slice(Math.max(0, i - 13), i + 1)
    return slice.reduce((a, b) => a + b, 0) / slice.length + Math.sin(i * 0.7) * 30 + Math.cos(i * 0.3) * 20
  })
  const ma50 = seeds.map((_, i) => {
    const slice = seeds.slice(Math.max(0, i - 49), i + 1)
    return slice.reduce((a, b) => a + b, 0) / slice.length + Math.sin(i * 0.7) * 30 + Math.cos(i * 0.3) * 20
  })
  const ma14Pts = ma14.map((y, i) => `${60 + i * 7},${y}`).join(' ')
  const ma50Pts = ma50.map((y, i) => `${60 + i * 7},${y}`).join(' ')
  o.push(`<polyline points="${ma14Pts}" fill="none" stroke="#facc15" stroke-width="0.7" stroke-opacity="0.25"/>`)
  o.push(`<polyline points="${ma50Pts}" fill="none" stroke="#f97316" stroke-width="0.7" stroke-opacity="0.2"/>`)

  // ── price labels (very faint) ──
  for (let y = 100; y < H; y += 150) {
    const px = (750 - y + 500).toFixed(0)
    o.push(`<text x="${W - 10}" y="${y}" fill="#334155" font-size="8" font-family="monospace" text-anchor="end" opacity="0.4">${px}</text>`)
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#6366f1" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
    </linearGradient>
  </defs>
  ${g.join('\n  ')}
  ${v.join('\n  ')}
  ${o.join('\n  ')}
  ${c.join('\n  ')}
</svg>`

  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export function LoginPage({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const chartBg = useMemo(() => buildChartSvg(), [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) {
          if (error.message.includes('already registered') || error.message.includes('already exists')) {
            throw new Error('This email is already registered. Please login instead.')
          }
          throw error
        }
        setSuccess('Account created! You can now login.')
        setMode('login')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          if (error.message.includes('Invalid login')) {
            throw new Error('Invalid email or password. Please try again.')
          }
          throw error
        }
        if (data?.user) onAuth(data.user)
      }
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  const handleSkip = () => {
    onAuth(null) // proceed without cloud sync
  }

  return (
    <div className='login-page min-h-screen flex items-center justify-center px-4'
      style={{ backgroundImage: `url("${chartBg}")` }}>
      {/* Dark overlay */}
      <div className='login-overlay' />
      {/* Content */}
      <div className='w-full max-w-md login-content'>
        {/* Logo / Brand */}
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white text-3xl mb-4 shadow-lg shadow-indigo-500/25'>
            📊
          </div>
          <h1 className='text-2xl font-bold text-slate-900 dark:text-white'>Trading Journal</h1>
          <p className='text-sm text-slate-500 dark:text-slate-400 mt-1'>Track. Analyze. Improve.</p>
        </div>

        {/* Card */}
        <div className='rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 backdrop-blur-sm p-6 shadow-xl shadow-black/20 dark:shadow-none'>
          {/* Tab switcher */}
          <div className='flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 mb-6'>
            <button
              className={cx('flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all', mode === 'login' ? 'bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300')}
              onClick={() => { setMode('login'); setError(''); setSuccess('') }}
            >
              Login
            </button>
            <button
              className={cx('flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all', mode === 'signup' ? 'bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300')}
              onClick={() => { setMode('signup'); setError(''); setSuccess('') }}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className='mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400'>Email</label>
              <input
                className={inputCls}
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='you@example.com'
                required
              />
            </div>
            <div>
              <label className='mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400'>Password</label>
              <input
                className={inputCls}
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='Min 6 characters'
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className='rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 px-3 py-2'>
                <p className='text-xs text-rose-600 dark:text-rose-400'>{error}</p>
              </div>
            )}
            {success && (
              <div className='rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 px-3 py-2'>
                <p className='text-xs text-emerald-600 dark:text-emerald-400'>{success}</p>
              </div>
            )}

            <button type='submit' className={btnPrimary} disabled={loading || !email || !password}>
              {loading ? (
                <span className='inline-flex items-center gap-2'>
                  <span className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                  {mode === 'login' ? 'Logging in...' : 'Creating account...'}
                </span>
              ) : mode === 'login' ? 'Login' : 'Create Account'}
            </button>
          </form>

          <div className='mt-4 text-center'>
            <p className='text-[11px] text-slate-400'>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                className='text-indigo-500 hover:text-indigo-400 font-medium'
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess('') }}
              >
                {mode === 'login' ? 'Sign up' : 'Login'}
              </button>
            </p>
          </div>
        </div>

        {/* Skip / offline mode */}
        <div className='text-center mt-4'>
          <button
            className='text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors'
            onClick={handleSkip}
          >
            Skip — use without cloud sync →
          </button>
        </div>

        {/* Footer */}
        <p className='text-center text-[10px] text-slate-400 mt-6'>
          Cloud sync keeps your data safe across devices
        </p>
      </div>
    </div>
  )
}
