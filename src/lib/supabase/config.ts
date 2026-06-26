export function normalizeSupabaseUrl(value: string | undefined, fallback = 'http://127.0.0.1:54321') {
  const raw = (value || fallback).trim()

  try {
    const url = new URL(raw)
    url.pathname = url.pathname.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')
    url.search = ''
    url.hash = ''
    return url.toString().replace(/\/$/, '')
  } catch {
    return fallback
  }
}

export const SUPABASE_URL = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key'
