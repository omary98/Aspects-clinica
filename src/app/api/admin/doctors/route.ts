/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminRequestContext, forbiddenResponse } from '@/lib/admin/auth'
import { databaseErrorResponse } from '@/lib/admin/api-errors'
import { createClient, createServiceClient } from '@/lib/supabase/server'

type DoctorPayload = {
  id?: string
  name_en?: string
  name_ar?: string
  specialty_id?: string
  title_en?: string
  title_ar?: string
  bio_en?: string | null
  bio_ar?: string | null
  photo_url?: string | null
  consultation_fee?: number | null
  is_active?: boolean
  display_order?: number
}

function buildPayload(body: DoctorPayload) {
  const nameEn = body.name_en?.trim() || ''
  const titleEn = body.title_en?.trim() || ''

  return {
    name_en: nameEn,
    name_ar: body.name_ar?.trim() || nameEn,
    specialty_id: body.specialty_id || '',
    title_en: titleEn,
    title_ar: body.title_ar?.trim() || titleEn,
    bio_en: body.bio_en || null,
    bio_ar: body.bio_ar || null,
    photo_url: body.photo_url || null,
    consultation_fee: body.consultation_fee ?? null,
    is_active: body.is_active !== false,
    display_order: typeof body.display_order === 'number' && Number.isFinite(body.display_order) ? body.display_order : 0,
  }
}

function validatePayload(payload: ReturnType<typeof buildPayload>) {
  if (!payload.name_en) return 'Doctor name is required.'
  if (!payload.specialty_id) return 'Specialty is required.'
  if (!payload.title_en) return 'Doctor title is required.'
  return null
}

export async function POST(request: NextRequest) {
  const admin = await getAdminRequestContext(request)
  if (!admin) return forbiddenResponse()

  const body = await request.json() as DoctorPayload
  const payload = buildPayload(body)
  const validationError = validatePayload(payload)

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const supabase = admin.userId ? await createClient() : await createServiceClient()
  const { data, error } = await (supabase as any)
    .from('doctors')
    .insert(payload)
    .select()
    .single()

  if (error) {
    return databaseErrorResponse(error)
  }

  return NextResponse.json({ ok: true, doctor: data })
}

export async function PATCH(request: NextRequest) {
  const admin = await getAdminRequestContext(request)
  if (!admin) return forbiddenResponse()

  const body = await request.json() as DoctorPayload
  if (!body.id) {
    return NextResponse.json({ error: 'Doctor id is required.' }, { status: 400 })
  }

  const supabase = admin.userId ? await createClient() : await createServiceClient()

  if (Object.keys(body).length === 2 && typeof body.is_active === 'boolean') {
    const { data, error } = await (supabase as any)
      .from('doctors')
      .update({ is_active: body.is_active })
      .eq('id', body.id)
      .select()
      .single()

    if (error) {
      return databaseErrorResponse(error)
    }

    return NextResponse.json({ ok: true, doctor: data })
  }

  const payload = buildPayload(body)
  const validationError = validatePayload(payload)

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const { data, error } = await (supabase as any)
    .from('doctors')
    .update(payload)
    .eq('id', body.id)
    .select()
    .single()

  if (error) {
    return databaseErrorResponse(error)
  }

  return NextResponse.json({ ok: true, doctor: data })
}
