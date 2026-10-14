import { createBrowserClient } from '@supabase/ssr'

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  return !!url && !url.includes('placeholder')
}

function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
    anonKey:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder-anon-key',
  }
}

export function createClient() {
  const { url, anonKey } = getSupabaseConfig()
  return createBrowserClient(url, anonKey)
}
