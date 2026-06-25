export const ADMIN_OVERRIDE_COOKIE = 'eurocure_admin_override'

export const ADMIN_OVERRIDE_PROFILE = {
  email: 'doitrous@hotmail.com',
  password: '0000',
  fullName: 'Doitrous',
  role: 'medical_director',
}

type AdminOverridePayload = {
  email: string
  fullName: string
  role: string
  exp: number
}

type CookieReader = {
  get(name: string): { value: string } | undefined
}

const SESSION_TTL_SECONDS = 60 * 60 * 12

function getSecret() {
  return (
    process.env.ADMIN_OVERRIDE_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eurocure-admin-override-development-secret'
  )
}

function toBase64Url(input: string) {
  return btoa(input).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function fromBase64Url(input: string) {
  const normalized = input.replaceAll('-', '+').replaceAll('_', '/')
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
  return atob(padded)
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))
  return toBase64Url(String.fromCharCode(...new Uint8Array(signature)))
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false

  let mismatch = 0
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

export async function createAdminOverrideSessionValue() {
  const payload: AdminOverridePayload = {
    email: ADMIN_OVERRIDE_PROFILE.email,
    fullName: ADMIN_OVERRIDE_PROFILE.fullName,
    role: ADMIN_OVERRIDE_PROFILE.role,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  }
  const encodedPayload = toBase64Url(JSON.stringify(payload))
  const signature = await sign(encodedPayload)

  return `${encodedPayload}.${signature}`
}

export async function getAdminOverrideSession(cookieStore: CookieReader) {
  const value = cookieStore.get(ADMIN_OVERRIDE_COOKIE)?.value
  if (!value) return null

  const [encodedPayload, signature] = value.split('.')
  if (!encodedPayload || !signature) return null

  const expectedSignature = await sign(encodedPayload)
  if (!timingSafeEqual(signature, expectedSignature)) return null

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as AdminOverridePayload
    if (payload.email !== ADMIN_OVERRIDE_PROFILE.email) return null
    if (payload.exp < Math.floor(Date.now() / 1000)) return null

    return payload
  } catch {
    return null
  }
}
