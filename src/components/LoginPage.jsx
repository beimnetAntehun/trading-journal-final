// src/components/LoginPage.jsx
// Professional full-page login / signup screen.
import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

const cx = (...a) => a.filter(Boolean).join(' ')
const inputCls = 'w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500'
const btnPrimary = 'w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-40'

export function LoginPage({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
    <div className='login-page min-h-screen flex items-center justify-center px-4'>
      <div className='login-overlay' />
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
