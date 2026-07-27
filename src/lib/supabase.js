// src/lib/supabase.js
// Supabase client config — replace with your own project credentials.
// Create a free project at https://supabase.com then paste the URL and anon key here.

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = SUPABASE_URL ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null

export const isSupabaseReady = () => !!supabase

/** Save user data to Supabase (cloud backup) */
export async function cloudSave(userId, data) {
  if (!supabase || !userId) return false
  try {
    const { error } = await supabase
      .from('journal_data')
      .upsert({ user_id: userId, data: JSON.stringify(data), updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    if (error) { console.error('Cloud save error:', error); return false }
    return true
  } catch (e) { console.error('Cloud save failed:', e); return false }
}

/** Load user data from Supabase (cloud restore) */
export async function cloudLoad(userId) {
  if (!supabase || !userId) return null
  try {
    const { data, error } = await supabase
      .from('journal_data')
      .select('data')
      .eq('user_id', userId)
      .single()
    if (error) { console.error('Cloud load error:', error); return null }
    return data ? JSON.parse(data.data) : null
  } catch (e) { console.error('Cloud load failed:', e); return null }
}
