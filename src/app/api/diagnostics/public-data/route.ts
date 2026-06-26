/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase/config'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function keyKind() {
  if (SUPABASE_ANON_KEY.startsWith('sb_publishable_')) return 'publishable'
  if (SUPABASE_ANON_KEY.startsWith('eyJ')) return 'jwt'
  if (SUPABASE_ANON_KEY.includes('placeholder')) return 'placeholder'
  return 'configured'
}

function safeError(error: unknown) {
  if (!error || typeof error !== 'object') return null
  const maybe = error as { message?: string; code?: string; details?: string; hint?: string }
  return {
    code: maybe.code || null,
    message: maybe.message || null,
    details: maybe.details || null,
    hint: maybe.hint || null,
  }
}

async function readPublicData() {
  const supabase = await createClient()
  const [doctorsRes, specialtiesRes] = await Promise.all([
    (supabase as any)
      .from('doctors')
      .select('id, name_en, name_ar, is_active, display_order, created_at')
      .eq('is_active', true)
      .order('display_order'),
    (supabase as any)
      .from('specialties')
      .select('id, name_en, name_ar, is_active, display_order')
      .eq('is_active', true)
      .order('display_order'),
  ])

  return {
    doctors: {
      count: doctorsRes.data?.length || 0,
      sample: (doctorsRes.data || []).slice(0, 8),
      error: safeError(doctorsRes.error),
    },
    specialties: {
      count: specialtiesRes.data?.length || 0,
      sample: (specialtiesRes.data || []).slice(0, 8),
      error: safeError(specialtiesRes.error),
    },
  }
}

async function readServiceData() {
  try {
    const supabase = await createServiceClient()
    const { data, error } = await (supabase as any)
      .from('doctors')
      .select('id, name_en, name_ar, is_active, display_order, created_at')
      .order('display_order')

    return {
      count: data?.length || 0,
      activeCount: (data || []).filter((doctor: { is_active: boolean }) => doctor.is_active).length,
      sample: (data || []).slice(0, 8),
      error: safeError(error),
    }
  } catch (error) {
    return {
      count: 0,
      activeCount: 0,
      sample: [],
      error: error instanceof Error ? { message: error.message, code: null, details: null, hint: null } : safeError(error),
    }
  }
}

export async function GET() {
  const publicData = await readPublicData()
  const serviceData = await readServiceData()
  const url = new URL(SUPABASE_URL)

  return NextResponse.json(
    {
      app: 'aspects-clinica-platform',
      checkedAt: new Date().toISOString(),
      supabase: {
        host: url.host,
        url: SUPABASE_URL,
        anonKeyKind: keyKind(),
      },
      publicRead: publicData,
      serviceRead: {
        doctors: serviceData,
      },
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  )
}
