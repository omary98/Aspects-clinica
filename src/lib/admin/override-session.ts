export const ADMIN_OVERRIDE_COOKIE = 'aspects_admin_override'

const DEFAULT_FALLBACK_EMAIL = 'doitrous@hotmail.com'
const DEFAULT_FALLBACK_PASSWORD_HASH =
  'pbkdf2_sha256$210000$aspects-clinica-local-admin-v1$ka3j9In-cXX5B_DRG0o8SNSByXmka7S_42MHop3Rpv4'

export const ADMIN_OVERRIDE_PROFILE = {
  email: (process.env.FALLBACK_ADMIN_EMAIL || DEFAULT_FALLBACK_EMAIL).trim().toLowerCase(),
  passwordHash: process.env.FALLBACK_ADMIN_PASSWORD_HASH || DEFAULT_FALLBACK_PASSWORD_HASH,
  fullName: 'Doitrous',
  role: process.env.FALLBACK_ADMIN_ROLE || 'medical_director',
  enabled: process.env.FALLBACK_ADMIN_ENABLED !== 'false',
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
    process.env.FALLBACK_ADMIN_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'aspects-admin-override-development-secret'
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

async function sha256(input: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return toBase64Url(String.fromCharCode(...new Uint8Array(digest)))
}

async function pbkdf2(password: string, salt: string, iterations: number) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: new TextEncoder().encode(salt),
      iterations,
    },
    key,
    256
  )
  return toBase64Url(String.fromCharCode(...new Uint8Array(bits)))
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

export async function verifyAdminOverridePassword(password: string) {
  if (!ADMIN_OVERRIDE_PROFILE.enabled) return false

  const [algorithm, iterationsRaw, salt, expectedHash] = ADMIN_OVERRIDE_PROFILE.passwordHash.split('$')
  if (!algorithm || !expectedHash) return false

  let actualHash = ''
  if (algorithm === 'pbkdf2_sha256') {
    const iterations = parseInt(iterationsRaw || '', 10)
    if (!Number.isFinite(iterations) || !salt) return false
    actualHash = await pbkdf2(password, salt, iterations)
  } else if (algorithm === 'sha256') {
    actualHash = await sha256(password)
  } else {
    return false
  }

  return timingSafeEqual(actualHash, expectedHash)
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
