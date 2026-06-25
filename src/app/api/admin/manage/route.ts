/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { databaseErrorResponse } from '@/lib/admin/api-errors'
import { getAdminRequestContext, forbiddenResponse } from '@/lib/admin/auth'
import { createClient, createServiceClient } from '@/lib/supabase/server'

type AdminResource =
  | 'branches'
  | 'rooms'
  | 'services'
  | 'schedules'
  | 'blocked-times'
  | 'admin-profiles'
  | 'clinic-settings'
  | 'site-content'
  | 'appointment-status'

type AdminAction = 'create' | 'update' | 'delete' | 'upsert'

type AdminManageBody = {
  resource: AdminResource
  action: AdminAction
  id?: string
  payload?: Record<string, any>
  values?: Record<string, string>
}

const simpleTables: Partial<Record<AdminResource, string>> = {
  branches: 'branches',
  rooms: 'rooms',
  services: 'services',
  'admin-profiles': 'admin_profiles',
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeSimplePayload(resource: AdminResource, payload: Record<string, any>) {
  if (resource === 'branches') {
    const nameEn = String(payload.name_en || '').trim()
    return {
      name_en: nameEn,
      name_ar: String(payload.name_ar || '').trim() || nameEn,
      slug: slugify(payload.slug || nameEn),
      address_en: payload.address_en || null,
      address_ar: payload.address_ar || null,
      google_maps_url: payload.google_maps_url || null,
      phone: payload.phone || null,
      is_public_branch: payload.is_public_branch !== false,
      is_active: payload.is_active !== false,
      display_order: Number.isFinite(payload.display_order) ? payload.display_order : 0,
    }
  }

  if (resource === 'rooms') {
    const nameEn = String(payload.name_en || '').trim()
    return {
      branch_id: payload.branch_id,
      name_en: nameEn,
      name_ar: String(payload.name_ar || '').trim() || nameEn,
      room_type: payload.room_type || 'clinic',
      is_active: payload.is_active !== false,
    }
  }

  if (resource === 'services') {
    const nameEn = String(payload.name_en || '').trim()
    return {
      specialty_id: payload.specialty_id,
      doctor_id: payload.doctor_id || null,
      name_en: nameEn,
      name_ar: String(payload.name_ar || '').trim() || nameEn,
      description_en: payload.description_en || null,
      description_ar: payload.description_ar || null,
      duration_minutes: Number.isFinite(payload.duration_minutes) ? payload.duration_minutes : 20,
      fee: payload.fee ?? null,
      is_visible_to_patients: payload.is_visible_to_patients !== false,
      is_active: payload.is_active !== false,
      display_order: Number.isFinite(payload.display_order) ? payload.display_order : 0,
    }
  }

  if (resource === 'admin-profiles') {
    return {
      user_id: payload.user_id,
      full_name: payload.full_name,
      role: payload.role,
      email: payload.email,
      whatsapp_number: payload.whatsapp_number || null,
      notifications_enabled: payload.notifications_enabled !== false,
      is_active: payload.is_active !== false,
    }
  }

  return payload
}

async function getAdminSupabase(request: NextRequest) {
  const admin = await getAdminRequestContext(request)
  if (!admin) return null

  return {
    admin,
    supabase: admin.userId ? await createClient() : await createServiceClient(),
  }
}

async function saveSimpleResource(supabase: any, body: AdminManageBody) {
  const table = simpleTables[body.resource]
  if (!table) return NextResponse.json({ error: 'Unsupported admin resource.' }, { status: 400 })

  const payload = normalizeSimplePayload(body.resource, body.payload || {})

  if (body.action === 'create') {
    const { data, error } = await supabase.from(table).insert(payload).select().single()
    if (error) return databaseErrorResponse(error)
    return NextResponse.json({ ok: true, data })
  }

  if (body.action === 'update') {
    if (!body.id) return NextResponse.json({ error: 'ID is required.' }, { status: 400 })
    const { data, error } = await supabase.from(table).update(payload).eq('id', body.id).select().single()
    if (error) return databaseErrorResponse(error)
    return NextResponse.json({ ok: true, data })
  }

  return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 })
}

async function saveSchedule(supabase: any, body: AdminManageBody) {
  const payload = body.payload || {}

  if (body.action === 'delete') {
    if (!body.id) return NextResponse.json({ error: 'ID is required.' }, { status: 400 })
    const { error } = await supabase.from('doctor_schedule_templates').delete().eq('id', body.id)
    if (error) return databaseErrorResponse(error)
    return NextResponse.json({ ok: true })
  }

  const schedulePayload = {
    doctor_id: payload.doctor_id,
    branch_id: payload.branch_id,
    day_of_week: payload.day_of_week,
    start_time: payload.start_time,
    end_time: payload.end_time,
    is_active: payload.is_active !== false,
  }
  const roomIds = Array.isArray(payload.room_ids) ? payload.room_ids : []

  let scheduleId = body.id || null

  if (body.action === 'update') {
    if (!scheduleId) return NextResponse.json({ error: 'ID is required.' }, { status: 400 })
    const { error } = await supabase.from('doctor_schedule_templates').update(schedulePayload).eq('id', scheduleId)
    if (error) return databaseErrorResponse(error)
    const deleteAssignments = await supabase.from('schedule_room_assignments').delete().eq('schedule_template_id', scheduleId)
    if (deleteAssignments.error) return databaseErrorResponse(deleteAssignments.error)
  } else if (body.action === 'create') {
    const { data, error } = await supabase
      .from('doctor_schedule_templates')
      .insert(schedulePayload)
      .select('id')
      .single()
    if (error) return databaseErrorResponse(error)
    scheduleId = data.id
  } else {
    return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 })
  }

  if (scheduleId && roomIds.length > 0) {
    const { error } = await supabase
      .from('schedule_room_assignments')
      .insert(roomIds.map((room_id: string) => ({ schedule_template_id: scheduleId, room_id })))
    if (error) return databaseErrorResponse(error)
  }

  return NextResponse.json({ ok: true, id: scheduleId })
}

async function saveBlockedTime(supabase: any, body: AdminManageBody) {
  if (body.action === 'delete') {
    if (!body.id) return NextResponse.json({ error: 'ID is required.' }, { status: 400 })
    const { error } = await supabase.from('blocked_times').delete().eq('id', body.id)
    if (error) return databaseErrorResponse(error)
    return NextResponse.json({ ok: true })
  }

  if (body.action !== 'create') {
    return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 })
  }

  const payload = body.payload || {}
  const isFullDay = payload.is_full_day === true
  const { data, error } = await supabase
    .from('blocked_times')
    .insert({
      block_date: payload.block_date,
      start_time: isFullDay ? null : payload.start_time || null,
      end_time: isFullDay ? null : payload.end_time || null,
      doctor_id: payload.doctor_id || null,
      room_id: payload.room_id || null,
      branch_id: payload.branch_id || null,
      reason: payload.reason || null,
      is_full_day: isFullDay,
    })
    .select()
    .single()
  if (error) return databaseErrorResponse(error)
  return NextResponse.json({ ok: true, data })
}

async function saveClinicSettings(supabase: any, body: AdminManageBody) {
  if (body.action !== 'upsert') {
    return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 })
  }

  const values = body.values || {}
  const rows = Object.entries(values).map(([key, value]) => ({ key, value }))
  if (rows.length === 0) return NextResponse.json({ ok: true })

  const { error } = await supabase.from('clinic_settings').upsert(rows, { onConflict: 'key' })
  if (error) return databaseErrorResponse(error)
  return NextResponse.json({ ok: true })
}

async function saveSiteContent(supabase: any, body: AdminManageBody) {
  if (body.action !== 'upsert') {
    return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 })
  }

  const rows = Array.isArray(body.payload?.rows) ? body.payload.rows : []
  if (rows.length === 0) return NextResponse.json({ ok: true })

  const normalized = rows.map((row: Record<string, any>) => ({
    section_key: String(row.section_key || '').trim(),
    field_key: String(row.field_key || '').trim(),
    value_en: row.value_en || null,
    value_ar: row.value_ar || null,
    content_type: row.content_type || 'text',
    asset_id: row.asset_id || null,
    is_active: row.is_active !== false,
    display_order: Number.isFinite(row.display_order) ? row.display_order : 0,
  })).filter((row: { section_key: string; field_key: string }) => row.section_key && row.field_key)

  const { error } = await supabase
    .from('site_content')
    .upsert(normalized, { onConflict: 'section_key,field_key' })

  if (error) return databaseErrorResponse(error)
  return NextResponse.json({ ok: true })
}

async function updateAppointmentStatus(supabase: any, body: AdminManageBody) {
  if (body.action !== 'update' || !body.id) {
    return NextResponse.json({ error: 'Appointment ID is required.' }, { status: 400 })
  }

  const payload = body.payload || {}
  const statusUpdate = await supabase
    .from('appointments')
    .update(payload.appointment || {})
    .eq('id', body.id)

  if (statusUpdate.error) return databaseErrorResponse(statusUpdate.error)

  if (payload.history) {
    const historyInsert = await supabase.from('appointment_status_history').insert(payload.history)
    if (historyInsert.error) return databaseErrorResponse(historyInsert.error)
  }

  return NextResponse.json({ ok: true })
}

export async function POST(request: NextRequest) {
  const context = await getAdminSupabase(request)
  if (!context) return forbiddenResponse()

  const body = await request.json() as AdminManageBody
  const { admin, supabase } = context

  if (['clinic-settings', 'site-content'].includes(body.resource) && admin.role !== 'medical_director') {
    return forbiddenResponse()
  }

  if (simpleTables[body.resource]) return saveSimpleResource(supabase, body)
  if (body.resource === 'schedules') return saveSchedule(supabase, body)
  if (body.resource === 'blocked-times') return saveBlockedTime(supabase, body)
  if (body.resource === 'clinic-settings') return saveClinicSettings(supabase, body)
  if (body.resource === 'site-content') return saveSiteContent(supabase, body)
  if (body.resource === 'appointment-status') return updateAppointmentStatus(supabase, body)

  return NextResponse.json({ error: 'Unsupported admin resource.' }, { status: 400 })
}
