/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getAdminOverrideSession } from '@/lib/admin/override-session'
import { getSlotEndTime, normalizePhoneNumber, validatePhoneNumberForCountry } from '@/lib/utils'
import { sendAdminNotification } from '@/lib/email/resend'
import type { AppointmentWithDetails } from '@/types/database'

function minutesBetween(start: string, end: string) {
  const [startH, startM] = start.slice(0, 5).split(':').map(Number)
  const [endH, endM] = end.slice(0, 5).split(':').map(Number)
  return Math.max(1, (endH * 60 + endM) - (startH * 60 + startM))
}

export async function POST(request: NextRequest) {
  try {
    // Auth check — must be admin
    const overrideSession = await getAdminOverrideSession(request.cookies)
    let profile: { role: string; is_active: boolean } | null = overrideSession
      ? { role: overrideSession.role, is_active: true }
      : null
    let currentUserId: string | null = null

    if (!profile) {
      const authSupabase = await createClient()
      const { data: { user } } = await authSupabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      currentUserId = user.id

      const { data: supabaseProfile } = await (authSupabase as any)
        .from('admin_profiles')
        .select('id, role, is_active')
        .eq('user_id', user.id)
        .single()

      profile = supabaseProfile as { role: string; is_active: boolean } | null

      if (!profile || !profile.is_active) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const body = await request.json()
    const {
      patient_name,
      patient_age,
      patient_phone_country_code,
      patient_phone,
      patient_email,
      doctor_id,
      specialty_id,
      branch_id,
      service_id,
      appointment_date,
      start_time,
      primary_complaint,
      referral_source,
      is_new_patient,
      notes,
      status: initialStatus,
    } = body

    const patientPhone = normalizePhoneNumber(String(patient_phone || ''))
    const patientCountryCode = String(patient_phone_country_code || '+20')

    if (!patient_name || !doctor_id || !specialty_id || !branch_id || !appointment_date || !start_time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (patientPhone && !validatePhoneNumberForCountry(patientCountryCode, patientPhone)) {
      return NextResponse.json({ error: 'Please enter a valid phone number for the selected country code.' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    // Get service duration (same logic as patient-facing route)
    let durationMinutes = 20
    let feeAtBooking: number | null = null

    if (service_id) {
      const { data: svcRaw } = await supabase
        .from('services')
        .select('duration_minutes, fee, doctor_id, specialty_id, service_doctors(doctor_id)')
        .eq('id', service_id)
        .single()
      const svc = svcRaw as {
        duration_minutes: number
        fee: number | null
        doctor_id: string | null
        specialty_id: string
        service_doctors?: Array<{ doctor_id: string }>
      } | null
      if (svc) {
        const assignedDoctors = Array.isArray(svc.service_doctors) ? svc.service_doctors : []
        const doctorCanPerformService = assignedDoctors.length > 0
          ? assignedDoctors.some((row) => row.doctor_id === doctor_id)
          : (svc.doctor_id === null || svc.doctor_id === doctor_id)

        if (svc.specialty_id !== specialty_id || !doctorCanPerformService) {
          return NextResponse.json({ error: 'This service is not available for the selected doctor.' }, { status: 400 })
        }

        durationMinutes = svc.duration_minutes
        feeAtBooking = svc.fee
      }
    } else {
      const { data: settingsRaw } = await supabase
        .from('clinic_settings')
        .select('key, value')
        .eq('key', 'default_appointment_duration_minutes')
        .single()
      const settings = settingsRaw as { key: string; value: string } | null
      if (settings) durationMinutes = parseInt(settings.value, 10)
    }

    if (!feeAtBooking) {
      const { data: docRaw } = await supabase
        .from('doctors')
        .select('consultation_fee')
        .eq('id', doctor_id)
        .single()
      const doc = docRaw as { consultation_fee: number | null } | null
      if (doc?.consultation_fee) feeAtBooking = doc.consultation_fee
    }

    let end_time = getSlotEndTime(start_time, durationMinutes)
    let durationAtBooking = durationMinutes
    const dayOfWeek = new Date(`${appointment_date}T00:00:00`).getDay()

    const { data: scheduleTemplates } = await supabase
      .from('doctor_schedule_templates')
      .select('id, start_time, end_time, first_come_first_serve, first_come_capacity')
      .eq('doctor_id', doctor_id)
      .eq('branch_id', branch_id)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)

    const schedules = (scheduleTemplates || []) as Array<{
      id: string
      start_time: string
      end_time: string
      first_come_first_serve?: boolean
      first_come_capacity?: number
    }>
    const matchingFirstComeSchedule = schedules.find((schedule) => {
      const scheduleStart = schedule.start_time.slice(0, 5)
      const scheduleEnd = schedule.end_time.slice(0, 5)
      return schedule.first_come_first_serve === true && scheduleStart <= start_time && scheduleEnd > start_time
    })
    const matchingSchedule = matchingFirstComeSchedule || schedules.find((schedule) => {
      const scheduleStart = schedule.start_time.slice(0, 5)
      const scheduleEnd = schedule.end_time.slice(0, 5)
      return scheduleStart <= start_time && scheduleEnd >= end_time
    })
    const isFirstComeFirstServe = matchingSchedule?.first_come_first_serve === true

    if (isFirstComeFirstServe && matchingSchedule) {
      const scheduleStart = matchingSchedule.start_time.slice(0, 5)
      const scheduleEnd = matchingSchedule.end_time.slice(0, 5)
      end_time = matchingSchedule.end_time.slice(0, 5)
      durationAtBooking = minutesBetween(start_time, end_time)
      const capacity = Math.max(1, matchingSchedule.first_come_capacity || 1)
      const { count } = await supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('doctor_id', doctor_id)
        .eq('branch_id', branch_id)
        .eq('appointment_date', appointment_date)
        .in('status', ['reserved', 'confirmed'])
        .gte('start_time', scheduleStart)
        .lte('end_time', scheduleEnd)

      if ((count || 0) >= capacity) {
        return NextResponse.json({ error: 'This first-come first-serve clinic session is fully booked.' }, { status: 409 })
      }
    }

    // Conflict check (same as patient route — DB trigger also enforces)
    if (!isFirstComeFirstServe) {
      const { data: conflict } = await supabase
        .from('appointments')
        .select('id')
        .eq('doctor_id', doctor_id)
        .eq('appointment_date', appointment_date)
        .in('status', ['reserved', 'confirmed'])
        .lt('start_time', end_time)
        .gt('end_time', start_time)
        .limit(1)

      if (conflict && conflict.length > 0) {
        return NextResponse.json({ error: 'This time slot is already booked.' }, { status: 409 })
      }
    }

    const appointmentStatus = ['reserved', 'confirmed', 'attended', 'no_show', 'cancelled', 'rescheduled'].includes(initialStatus)
      ? initialStatus
      : 'confirmed'

    const { data: appt, error: apptError } = await (supabase as any)
      .from('appointments')
      .insert({
        patient_name,
        patient_age: patient_age || null,
        patient_phone_country_code: patientCountryCode,
        patient_phone: patientPhone || 'Not provided',
        patient_email: patient_email || null,
        doctor_id,
        specialty_id,
        branch_id,
        service_id: service_id || null,
        appointment_date,
        start_time,
        end_time,
        duration_at_booking: durationAtBooking,
        fee_at_booking: feeAtBooking,
        primary_complaint: primary_complaint || null,
        referral_source: referral_source || null,
        is_new_patient: is_new_patient !== false,
        notes: notes || null,
        status: appointmentStatus,
      })
      .select()
      .single()

    if (apptError) {
      console.error('Admin appointment insert error:', apptError)
      return NextResponse.json({ error: apptError.message }, { status: 500 })
    }

    // Auto-assign room from schedule template
    const scheduleTemplate = isFirstComeFirstServe
      ? null
      : matchingSchedule

    if (scheduleTemplate) {
      const { data: roomAssignments } = await supabase
        .from('schedule_room_assignments')
        .select('room_id')
        .eq('schedule_template_id', (scheduleTemplate as any).id)

      if (roomAssignments && roomAssignments.length > 0) {
        await (supabase as any)
          .from('appointment_rooms')
          .insert((roomAssignments as any[]).map((r: any) => ({ appointment_id: appt.id, room_id: r.room_id })))
      }
    }

    // Status history
    const adminRole = (profile as any).role || 'admin'
    await (supabase as any).from('appointment_status_history').insert({
      appointment_id: appt.id,
      previous_status: null,
      new_status: appointmentStatus,
      notes: `Created manually by ${adminRole}`,
    })

    // Admin notification email (non-blocking)
    const { data: fullAppt } = await supabase
      .from('appointments')
      .select(`
        *,
        doctors (id, name_en, name_ar, title_en, title_ar),
        specialties (id, name_en, name_ar),
        branches (id, name_en, name_ar),
        services (id, name_en, name_ar, duration_minutes),
        appointment_rooms (*, rooms (id, name_en, name_ar))
      `)
      .eq('id', appt.id)
      .single()

    if (fullAppt) {
      const apptWithDetails = fullAppt as AppointmentWithDetails
      const { data: adminRecipients } = await (supabase as any)
        .from('admin_profiles')
        .select('email, user_id')
        .eq('is_active', true)
        .eq('notifications_enabled', true)

      const recipients = currentUserId
        ? (adminRecipients as any[] | null)?.filter((admin) => admin.user_id !== currentUserId)
        : adminRecipients

      if (recipients && recipients.length > 0) {
        const adminEmails = (recipients as any[]).map((a: any) => a.email)
        const emailResult = await sendAdminNotification(apptWithDetails, adminEmails)
        await (supabase as any).from('notification_logs').insert({
          appointment_id: appt.id,
          type: 'email',
          event: 'admin_manual_booking',
          recipient_email: adminEmails.join(', '),
          payload: { to: adminEmails },
          sent_at: emailResult.success ? new Date().toISOString() : null,
          error: emailResult.error || null,
        })
      }
    }

    return NextResponse.json({ success: true, appointmentId: appt.id })
  } catch (err) {
    console.error('Admin booking error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
