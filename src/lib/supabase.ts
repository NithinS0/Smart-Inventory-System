import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseUrl.startsWith('https://')) {
  console.error('CRITICAL: Supabase URL is missing or invalid. Check your .env file for VITE_SUPABASE_URL.');
}
if (!supabaseAnonKey || supabaseAnonKey === 'placeholder') {
  console.error('CRITICAL: Supabase Anon Key is missing or invalid. Check your .env file for VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-fail.supabase.co', 
  supabaseAnonKey || 'placeholder-fail'
)
