/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminRequestContext, forbiddenResponse } from '@/lib/admin/auth'
import { databaseErrorResponse } from '@/lib/admin/api-errors'
import { createClient, createServiceClient } from '@/lib/supabase/server'

type SpecialtyPayload = {
  id?: string
  name_en?: string
  name_ar?: string
  slug?: string
  description_en?: string | null
  description_ar?: string | null
  icon?: string | null
  image_url?: string | null
  display_order?: number
  is_active?: boolean
  featured_on_homepage?: boolean
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildPayload(body: SpecialtyPayload) {
  const nameEn = body.name_en?.trim() || ''
  const nameAr = body.name_ar?.trim() || nameEn

  return {
    name_en: nameEn,
    name_ar: nameAr,
    slug: normalizeSlug(body.slug || nameEn),
    description_en: body.description_en || null,
    description_ar: body.description_ar || null,
    icon: body.icon || null,
    image_url: body.image_url || null,
    display_order: typeof body.display_order === 'number' && Number.isFinite(body.display_order) ? body.display_order : 0,
    is_active: body.is_active !== false,
    featured_on_homepage: body.featured_on_homepage === true,
  }
}

export async function POST(request: NextRequest) {
  const admin = await getAdminRequestContext(request)
  if (!admin) return forbiddenResponse()

  const body = await request.json() as SpecialtyPayload
  const payload = buildPayload(body)

  if (!payload.name_en || !payload.slug) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
  }

  const supabase = admin.userId ? await createClient() : await createServiceClient()
  const { data, error } = await (supabase as any)
    .from('specialties')
    .insert(payload)
    .select()
    .single()

  if (error) {
    return databaseErrorResponse(error)
  }

  return NextResponse.json({ ok: true, specialty: data })
}

export async function PATCH(request: NextRequest) {
  const admin = await getAdminRequestContext(request)
  if (!admin) return forbiddenResponse()

  const body = await request.json() as SpecialtyPayload
  if (!body.id) {
    return NextResponse.json({ error: 'Specialty id is required.' }, { status: 400 })
  }

  const payload = buildPayload(body)
  if (!payload.name_en || !payload.slug) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
  }

  const supabase = admin.userId ? await createClient() : await createServiceClient()
  const { data, error } = await (supabase as any)
    .from('specialties')
    .update(payload)
    .eq('id', body.id)
    .select()
    .single()

  if (error) {
    return databaseErrorResponse(error)
  }

  return NextResponse.json({ ok: true, specialty: data })
}

export async function DELETE(request: NextRequest) {
  const admin = await getAdminRequestContext(request)
  if (!admin) return forbiddenResponse()

  const body = await request.json() as { id?: string }
  if (!body.id) {
    return NextResponse.json({ error: 'Specialty id is required.' }, { status: 400 })
  }

  const supabase = admin.userId ? await createClient() : await createServiceClient()
  const { error } = await (supabase as any)
    .from('specialties')
    .delete()
    .eq('id', body.id)

  if (error) {
    return databaseErrorResponse(error)
  }

  return NextResponse.json({ ok: true })
}
