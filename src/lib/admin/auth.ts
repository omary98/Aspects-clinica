import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminOverrideSession } from '@/lib/admin/override-session'

export type AdminRequestContext = {
  role: string
  userId: string | null
}

export async function getAdminRequestContext(request: NextRequest): Promise<AdminRequestContext | null> {
  const overrideSession = await getAdminOverrideSession(request.cookies)

  if (overrideSession) {
    return {
      role: overrideSession.role,
      userId: null,
    }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('admin_profiles')
    .select('role, is_active')
    .eq('user_id', user.id)
    .maybeSingle()

  const adminProfile = profile as { role: string; is_active: boolean } | null
  if (!adminProfile?.is_active) return null

  return {
    role: adminProfile.role,
    userId: user.id,
  }
}

export function forbiddenResponse() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
