// src/components/LoginPage.jsx
// Professional full-page login / signup screen.
import React, { useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'

const cx = (...a) => a.filter(Boolean).join(' ')
const inputCls = 'w-full rounded-lg border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm text-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-slate-500'
const btnPrimary = 'w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-all disabled:opacity-40 shadow-lg shadow-indigo-500/20'

/* Trading workstation background SVG – photorealistic dark desk scene */
function buildChartSvg() {
  const W = 1920, H = 1080

  // Seeded PRNG for deterministic output
  let seed = 42
  const rand = () => { seed = (seed * 16807 + 0) % 2147483647; return (seed - 1) / 2147483646 }

  // ── helper: generate candles for a monitor chart ──
  function candleChart(ox, oy, cw, ch, count) {
    const els = []
    els.push(`<rect x="${ox}" y="${oy}" width="${cw}" height="${ch}" fill="#0a0e1a" rx="2"/>`)
    for (let gy = oy + 20; gy < oy + ch - 10; gy += 25) {
      els.push(`<line x1="${ox + 8}" y1="${gy}" x2="${ox + cw - 8}" y2="${gy}" stroke="#1a2540" stroke-width="0.3"/>`)
    }
    const base = oy + ch * 0.5
    const candleW = (cw - 20) / count
    for (let i = 0; i < count; i++) {
      const x = ox + 12 + i * candleW
      const trend = Math.sin(i * 0.15) * ch * 0.25 + Math.cos(i * 0.08) * ch * 0.15
      const open = base + trend + Math.sin(i * 2.3) * 8
      const close = open + (rand() > 0.45 ? 1 : -1) * (4 + rand() * 14)
      const hi = Math.max(open, close) + 2 + rand() * 6
      const lo = Math.min(open, close) - 2 - rand() * 6
      const bull = close > open
      const col = bull ? '#22c55e' : '#ef4444'
      const bodyTop = Math.min(open, close)
      const bodyH = Math.max(Math.abs(close - open), 1)
      els.push(`<line x1="${x}" y1="${lo}" x2="${x}" y2="${hi}" stroke="${col}" stroke-width="0.6" opacity="0.8"/>`)
      els.push(`<rect x="${x - candleW * 0.3}" y="${bodyTop}" width="${candleW * 0.6}" height="${bodyH}" fill="${col}" rx="0.5" opacity="0.85"/>`)
    }
    const maPts = []
    for (let i = 0; i < count; i++) {
      const x = ox + 12 + i * candleW
      const trend = Math.sin(i * 0.15) * ch * 0.25 + Math.cos(i * 0.08) * ch * 0.15
      maPts.push(`${x},${base + trend + Math.sin(i * 0.5) * 5}`)
    }
    els.push(`<polyline points="${maPts.join(' ')}" fill="none" stroke="#facc15" stroke-width="0.7" opacity="0.35"/>`)
    const subY = oy + ch - 35
    els.push(`<line x1="${ox + 8}" y1="${subY}" x2="${ox + cw - 8}" y2="${subY}" stroke="#1a2540" stroke-width="0.3"/>`)
    for (let i = 0; i < count; i += 2) {
      const x = ox + 12 + i * candleW
      const bh = Math.abs(Math.sin(i * 0.4)) * 18
      const up = Math.sin(i * 0.4) > 0
      els.push(`<rect x="${x}" y="${up ? subY + 1 - bh : subY + 1}" width="${candleW * 0.8}" height="${bh}" fill="${up ? '#22c55e' : '#ef4444'}" opacity="0.25" rx="0.5"/>`)
    }
    return els.join('\n')
  }

  // ── helper: monitor frame ──
  function monitorFrame(x, y, w, h, chartContent, label) {
    const els = []
    els.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#111827" rx="6" stroke="#1e293b" stroke-width="1"/>`)
    els.push(`<rect x="${x + 8}" y="${y + 8}" width="${w - 16}" height="${h - 16}" fill="#0a0e1a" rx="3"/>`)
    els.push(chartContent)
    els.push(`<rect x="${x + 8}" y="${y + 8}" width="${w - 16}" height="14" fill="#0f1629" rx="3"/>`)
    els.push(`<circle cx="${x + 20}" cy="${y + 15}" r="2.5" fill="#ef4444" opacity="0.7"/>`)
    els.push(`<circle cx="${x + 28}" cy="${y + 15}" r="2.5" fill="#eab308" opacity="0.7"/>`)
    els.push(`<circle cx="${x + 36}" cy="${y + 15}" r="2.5" fill="#22c55e" opacity="0.7"/>`)
    if (label) {
      els.push(`<text x="${x + w - 14}" y="${y + 17}" fill="#475569" font-size="6" font-family="monospace" text-anchor="end">${label}</text>`)
    }
    const standW = 30
    els.push(`<rect x="${x + w / 2 - standW / 2}" y="${y + h}" width="${standW}" height="18" fill="#1a1f2e" rx="1"/>`)
    els.push(`<rect x="${x + w / 2 - standW / 2 - 8}" y="${y + h + 16}" width="${standW + 16}" height="5" fill="#1a1f2e" rx="2"/>`)
    return els.join('\n')
  }

  const defs = []
  const layers = []

  defs.push(`
    <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0a0e1a"/>
      <stop offset="40%" stop-color="#0d1220"/>
      <stop offset="100%" stop-color="#111827"/>
    </linearGradient>
    <linearGradient id="lampGrad" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.5"/>
      <stop offset="60%" stop-color="#f59e0b" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="lampGlow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#fbbf24" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="screenGlow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#6366f1" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="deskGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1a1f2e"/>
      <stop offset="100%" stop-color="#0f1219"/>
    </linearGradient>
    <linearGradient id="windowGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="70%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#1a2540"/>
    </linearGradient>
  `)

  layers.push(`<rect width="${W}" height="${H}" fill="url(#skyGrad)"/>`)

  // ── city skyline through windows ──
  const windows = [
    { x: 180, y: 40, w: 520, h: 340 },
    { x: 750, y: 40, w: 520, h: 340 },
    { x: 1320, y: 40, w: 420, h: 340 },
  ]

  windows.forEach(win => {
    layers.push(`<rect x="${win.x}" y="${win.y}" width="${win.w}" height="${win.h}" fill="url(#windowGrad)" rx="2" stroke="#1e293b" stroke-width="2"/>`)
    const buildings = []
    const numB = 12 + Math.floor(rand() * 8)
    for (let b = 0; b < numB; b++) {
      const bx = win.x + 10 + b * (win.w / numB)
      const bw = win.w / numB - 4
      const bh = 30 + rand() * 100
      const by = win.y + win.h - bh
      buildings.push(`<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="#0c1222" opacity="0.9"/>`)
      for (let wy = by + 5; wy < win.y + win.h - 5; wy += 8) {
        for (let wx = bx + 3; wx < bx + bw - 2; wx += 6) {
          if (rand() > 0.6) {
            buildings.push(`<rect x="${wx}" y="${wy}" width="2" height="3" fill="#fbbf24" opacity="${0.1 + rand() * 0.2}"/>`)
          }
        }
      }
    }
    buildings.push(`<rect x="${win.x}" y="${win.y + win.h - 60}" width="${win.w}" height="60" fill="url(#lampGrad)" opacity="0.15"/>`)
    layers.push(buildings.join('\n'))
  })

  // ── desk surface ──
  layers.push(`<rect x="0" y="520" width="${W}" height="${H - 520}" fill="url(#deskGrad)"/>`)
  layers.push(`<rect x="0" y="518" width="${W}" height="3" fill="#252d3d" opacity="0.6"/>`)

  // ── monitors ──
  layers.push(monitorFrame(60, 60, 580, 420, candleChart(68, 80, 564, 380, 75), 'BTC/USDT  4H'))
  layers.push(`<ellipse cx="350" cy="530" rx="280" ry="40" fill="url(#screenGlow)"/>`)

  layers.push(monitorFrame(680, 80, 480, 360, candleChart(688, 98, 464, 320, 55), 'EUR/USD  1H'))
  layers.push(`<ellipse cx="920" cy="520" rx="220" ry="30" fill="url(#screenGlow)"/>`)

  layers.push(monitorFrame(1200, 90, 360, 300, candleChart(1208, 105, 344, 270, 40), 'XAU/USD  15M'))
  layers.push(`<ellipse cx="1380" cy="510" rx="170" ry="25" fill="url(#screenGlow)"/>`)

  // ── desk lamp (right side) ──
  layers.push(`<ellipse cx="1720" cy="530" rx="35" ry="8" fill="#2a3040"/>`)
  layers.push(`<rect x="1716" y="440" width="8" height="90" fill="#3a4250" rx="2"/>`)
  layers.push(`<line x1="1720" y1="440" x2="1680" y2="400" stroke="#3a4250" stroke-width="3"/>`)
  layers.push(`<line x1="1680" y1="400" x2="1660" y2="420" stroke="#3a4250" stroke-width="3"/>`)
  layers.push(`<path d="M 1635 420 L 1660 405 L 1685 420 Z" fill="#4a5568" stroke="#5a6577" stroke-width="0.5"/>`)
  layers.push(`<ellipse cx="1660" cy="420" rx="180" ry="120" fill="url(#lampGlow)"/>`)
  layers.push(`<ellipse cx="1660" cy="480" rx="120" ry="60" fill="#fbbf24" opacity="0.04"/>`)
  layers.push(`<path d="M 1635 420 L 1580 530 L 1740 530 L 1685 420 Z" fill="#fbbf24" opacity="0.03"/>`)

  // ── coffee mug ──
  layers.push(`<rect x="430" y="505" width="28" height="22" fill="#2a3040" rx="3"/>`)
  layers.push(`<rect x="458" y="510" width="10" height="12" fill="none" stroke="#2a3040" stroke-width="2" rx="5"/>`)
  layers.push(`<path d="M 440 500 Q 443 490 440 480" fill="none" stroke="#475569" stroke-width="0.5" opacity="0.3"/>`)
  layers.push(`<path d="M 448 502 Q 451 492 448 482" fill="none" stroke="#475569" stroke-width="0.5" opacity="0.25"/>`)

  // ── notebook / pen ──
  layers.push(`<rect x="1480" y="505" width="50" height="35" fill="#1e2738" rx="2" transform="rotate(-3 1505 522)"/>`)
  layers.push(`<rect x="1485" y="510" width="40" height="25" fill="#232b3c" rx="1" transform="rotate(-3 1505 522)"/>`)
  layers.push(`<line x1="1540" y1="510" x2="1570" y2="530" stroke="#3a4250" stroke-width="1.5" stroke-linecap="round"/>`)

  // ── keyboard ──
  layers.push(`<rect x="550" y="540" width="420" height="16" fill="#1a1f2e" rx="3" opacity="0.6"/>`)
  for (let kx = 558; kx < 960; kx += 14) {
    layers.push(`<rect x="${kx}" y="543" width="10" height="10" fill="#252d3d" rx="1" opacity="0.5"/>`)
  }

  // ── mouse ──
  layers.push(`<ellipse cx="1030" cy="548" rx="14" ry="18" fill="#1a1f2e" opacity="0.5" stroke="#252d3d" stroke-width="0.5"/>`)

  // ── ambient particles ──
  for (let p = 0; p < 30; p++) {
    const px = rand() * W, py = rand() * H * 0.7, pr = 0.3 + rand() * 0.8
    layers.push(`<circle cx="${px}" cy="${py}" r="${pr}" fill="#fbbf24" opacity="${0.02 + rand() * 0.04}"/>`)
  }

  // ── vignette ──
  defs.push(`<radialGradient id="vignette" cx="0.5" cy="0.45" r="0.7">
    <stop offset="0%" stop-color="transparent"/>
    <stop offset="70%" stop-color="rgba(0,0,0,0.3)"/>
    <stop offset="100%" stop-color="rgba(0,0,0,0.6)"/>
  </radialGradient>`)
  layers.push(`<rect width="${W}" height="${H}" fill="url(#vignette)"/>`)

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
  <defs>${defs.join('')}</defs>
  ${layers.join('\n')}
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
          <div className='inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-white text-3xl mb-4 shadow-lg shadow-indigo-500/20 backdrop-blur-sm'>
            📊
          </div>
          <h1 className='text-2xl font-bold text-white drop-shadow-lg'>Trading Journal</h1>
          <p className='text-sm text-slate-400 mt-1 drop-shadow'>Track. Analyze. Improve.</p>
        </div>

        {/* Card */}
        <div className='login-card rounded-2xl p-6'>
          {/* Tab switcher */}
          <div className='login-tabs flex rounded-lg p-1 mb-6'>
            <button
              className={cx('flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all', mode === 'login' && 'active')}
              onClick={() => { setMode('login'); setError(''); setSuccess('') }}
            >
              Login
            </button>
            <button
              className={cx('flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all', mode === 'signup' && 'active')}
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
              <div className='rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2'>
                <p className='text-xs text-rose-400'>{error}</p>
              </div>
            )}
            {success && (
              <div className='rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2'>
                <p className='text-xs text-emerald-400'>{success}</p>
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
            className='text-xs text-slate-400 hover:text-white transition-colors'
            onClick={handleSkip}
          >
            Skip — use without cloud sync →
          </button>
        </div>

        {/* Trust badges */}
        <div className='flex flex-wrap items-center justify-center gap-2 mt-6'>
          <span className='trust-badge'>
            <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Encrypted & Secure
          </span>
          <span className='trust-badge'>
            <svg viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Trusted by 10K+ Traders
          </span>
          <span className='trust-badge'>
            <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            100% Free to Start
          </span>
        </div>

        {/* Footer */}
        <p className='text-center text-[10px] text-slate-500 mt-4'>
          Cloud sync keeps your data safe across devices
        </p>
      </div>
    </div>
  )
}
