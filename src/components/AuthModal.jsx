// src/components/AuthModal.jsx
// Login / Signup modal that integrates with Supabase.
import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { cx, btnPrimary, btnGhost, inputCls, Modal } from './UIPrimitives'

export function AuthModal({ open, onClose, onAuth }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (!supabase) {
    return (
      <Modal open={open} onClose={onClose} title='Cloud Sync'>
        <div className='text-center py-6'>
          <div className='text-3xl mb-2'>☁️</div>
          <p className='text-sm text-slate-500 mb-3'>Cloud sync requires Supabase credentials.</p>
          <p className='text-xs text-slate-400'>Create a <code className='text-indigo-400'>.env</code> file with <code className='text-indigo-400'>VITE_SUPABASE_URL</code> and <code className='text-indigo-400'>VITE_SUPABASE_ANON_KEY</code>.</p>
          <button className={cx(btnGhost, 'mt-3')} onClick={onClose}>Close</button>
        </div>
      </Modal>
    )
  }

  const handleAuth = async () => {
    setLoading(true); setError(''); setSuccess('')
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setSuccess('Check your email for the confirmation link!')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        if (data?.user) { onAuth(data.user); onClose() }
      }
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  return (
    <Modal open={open} onClose={onClose} title='Cloud Sync Login'>
      <div className='space-y-4'>
        <div className='flex gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800'>
          <button className={cx('flex-1 rounded-md px-3 py-1.5 text-xs font-medium', mode === 'login' ? 'bg-white shadow dark:bg-slate-900' : '')} onClick={() => setMode('login')}>Login</button>
          <button className={cx('flex-1 rounded-md px-3 py-1.5 text-xs font-medium', mode === 'signup' ? 'bg-white shadow dark:bg-slate-900' : '')} onClick={() => setMode('signup')}>Sign Up</button>
        </div>

        <label className='block'><span className='mb-1 block text-xs text-slate-400'>Email</span>
          <input className={inputCls} type='email' value={email} onChange={(e) => setEmail(e.target.value)} placeholder='you@example.com' />
        </label>
        <label className='block'><span className='mb-1 block text-xs text-slate-400'>Password</span>
          <input className={inputCls} type='password' value={password} onChange={(e) => setPassword(e.target.value)} placeholder='Min 6 characters' />
        </label>

        {error && <p className='text-xs text-rose-500'>{error}</p>}
        {success && <p className='text-xs text-emerald-500'>{success}</p>}

        <button className={cx(btnPrimary, 'w-full')} disabled={loading || !email || !password} onClick={handleAuth}>
          {loading ? 'Loading...' : mode === 'login' ? 'Login' : 'Create Account'}
        </button>

        <p className='text-[10px] text-slate-400 text-center'>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button className='text-indigo-400 hover:underline' onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess('') }}>
            {mode === 'login' ? 'Sign up' : 'Login'}
          </button>
        </p>
      </div>
    </Modal>
  )
}
