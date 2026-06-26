export function normalizeSupabaseUrl(value: string | undefined, fallback = 'http://127.0.0.1:54321') {
  const raw = (value || fallback).trim()

  try {
    const url = new URL(raw)
    if (url.pathname === '/rest/v1' || url.pathname === '/rest/v1/') {
      url.pathname = ''
    } else {
      url.pathname = url.pathname.split('/').filter(Boolean).join('/')
      if (url.pathname) url.pathname = `/${url.pathname}`
    }
    url.search = ''
    url.hash = ''
    return `${url.protocol}//${url.host}${url.pathname}`
  } catch {
    return fallback
  }
}

export const SUPABASE_URL = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key'
