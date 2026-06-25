import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import {
  ADMIN_OVERRIDE_COOKIE,
  ADMIN_OVERRIDE_PROFILE,
  createAdminOverrideSessionValue,
  getAdminOverrideSession,
} from '@/lib/admin/override-session'

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
}

export async function GET() {
  const overrideSession = await getAdminOverrideSession(await cookies())

  if (overrideSession) {
    return NextResponse.json({
      ok: true,
      profile: {
        fullName: overrideSession.fullName,
        role: overrideSession.role,
        email: overrideSession.email,
      },
    })
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { ok: false, error: 'No active session' },
      { status: 401 }
    )
  }

  const { data: profileRaw, error } = await supabase
    .from('admin_profiles')
    .select('full_name, role, is_active')
    .eq('user_id', user.id)
    .maybeSingle()

  const profile = profileRaw as { full_name: string; role: string; is_active: boolean } | null

  if (error) {
    return NextResponse.json(
      { ok: false, error: 'Could not verify admin access' },
      { status: 500 }
    )
  }

  if (!profile) {
    return NextResponse.json(
      { ok: false, error: 'This login is valid, but it is not linked to an admin profile.' },
      { status: 403 }
    )
  }

  if (!profile.is_active) {
    return NextResponse.json(
      { ok: false, error: 'This admin account is inactive.' },
      { status: 403 }
    )
  }

  return NextResponse.json({ ok: true })
}

export async function POST(request: Request) {
  const { email, password } = await request.json()

  if (
    String(email).trim().toLowerCase() !== ADMIN_OVERRIDE_PROFILE.email ||
    String(password) !== ADMIN_OVERRIDE_PROFILE.password
  ) {
    return NextResponse.json(
      { ok: false, error: 'Invalid admin override credentials' },
      { status: 401 }
    )
  }

  const response = NextResponse.json({
    ok: true,
    profile: {
      fullName: ADMIN_OVERRIDE_PROFILE.fullName,
      role: ADMIN_OVERRIDE_PROFILE.role,
      email: ADMIN_OVERRIDE_PROFILE.email,
    },
  })

  response.cookies.set(
    ADMIN_OVERRIDE_COOKIE,
    await createAdminOverrideSessionValue(),
    {
      ...cookieOptions,
      maxAge: 60 * 60 * 12,
    }
  )

  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(ADMIN_OVERRIDE_COOKIE, '', {
    ...cookieOptions,
    maxAge: 0,
  })

  return response
}
