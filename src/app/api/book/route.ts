/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getSlotEndTime, normalizePhoneNumber, validatePhoneNumberForCountry } from '@/lib/utils'
import { sendPatientConfirmation, sendAdminNotification } from '@/lib/email/resend'
import { buildPatientConfirmationPayload, buildAdminNotificationPayload } from '@/lib/notifications/whatsapp-placeholder'
import type { AppointmentWithDetails } from '@/types/database'
import { addHours, parseISO, addDays, startOfDay, isAfter, isBefore } from 'date-fns'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^\d{2}:\d{2}$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function sanitizeText(v: unknown, maxLen = 200): string {
  return String(v ?? '').trim().slice(0, maxLen)
}

function minutesBetween(start: string, end: string) {
  const [startH, startM] = start.slice(0, 5).split(':').map(Number)
  const [endH, endM] = end.slice(0, 5).split(':').map(Number)
  return Math.max(1, (endH * 60 + endM) - (startH * 60 + startM))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      patient_name: rawName,
      patient_age,
      patient_phone_country_code: rawCountryCode,
      patient_phone: rawPhone,
      patient_email: rawEmail,
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
      lang,
    } = body

    // ── Required field check ──────────────────────────────────
    const patient_name = sanitizeText(rawName, 100)
    const patient_phone = normalizePhoneNumber(sanitizeText(rawPhone, 30))
    const patient_phone_country_code = sanitizeText(rawCountryCode, 8) || '+20'
    const patient_email = rawEmail ? sanitizeText(rawEmail, 254) : null

    if (!patient_name || !patient_phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 })
    }
    if (!doctor_id || !specialty_id || !branch_id || !appointment_date || !start_time) {
      return NextResponse.json({ error: 'Missing required booking fields' }, { status: 400 })
    }
    if (!validatePhoneNumberForCountry(patient_phone_country_code, patient_phone)) {
      return NextResponse.json({ error: 'Please enter a valid phone number for the selected country code.' }, { status: 400 })
    }

    // ── Format validation ─────────────────────────────────────
    if (!DATE_RE.test(appointment_date)) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }
    if (!TIME_RE.test(start_time)) {
      return NextResponse.json({ error: 'Invalid time format' }, { status: 400 })
    }
    if (!UUID_RE.test(doctor_id) || !UUID_RE.test(specialty_id) || !UUID_RE.test(branch_id)) {
      return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 })
    }
    if (service_id && !UUID_RE.test(service_id)) {
      return NextResponse.json({ error: 'Invalid service ID' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    // ── Load booking window settings ──────────────────────────
    const { data: settingsRaw } = await supabase
      .from('clinic_settings')
      .select('key, value')
      .in('key', ['booking_window_days', 'min_notice_hours', 'default_appointment_duration_minutes'])

    const settings = Object.fromEntries(
      ((settingsRaw || []) as { key: string; value: string }[]).map((s) => [s.key, s.value])
    )
    const bookingWindowDays = parseInt(settings['booking_window_days'] || '90', 10)
    const minNoticeHours = parseInt(settings['min_notice_hours'] || '6', 10)
    const defaultDuration = parseInt(settings['default_appointment_duration_minutes'] || '20', 10)

    // ── Business rule: date must not be in the past ───────────
    const now = new Date()
    const apptDate = parseISO(appointment_date)
    const todayStart = startOfDay(now)
    if (isBefore(apptDate, todayStart)) {
      return NextResponse.json({ error: 'Cannot book appointments in the past' }, { status: 400 })
    }

    // ── Business rule: date must be within booking window ─────
    const maxDate = addDays(now, bookingWindowDays)
    if (isAfter(apptDate, maxDate)) {
      return NextResponse.json({ error: `Appointments can only be booked up to ${bookingWindowDays} days in advance` }, { status: 400 })
    }

    // ── Business rule: minimum notice hours ──────────────────
    const [slotH, slotM] = start_time.split(':').map(Number)
    const slotDateTime = new Date(apptDate)
    slotDateTime.setHours(slotH, slotM, 0, 0)
    const cutoff = addHours(now, minNoticeHours)

    if (isBefore(slotDateTime, cutoff)) {
      return NextResponse.json(
        { error: `Appointments must be booked at least ${minNoticeHours} hours in advance` },
        { status: 400 }
      )
    }

    // ── Get service duration ──────────────────────────────────
    let durationMinutes = defaultDuration
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
    const dayOfWeek = apptDate.getDay()

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

    // ── Application-level conflict check (DB trigger is the final guard) ──
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
        return NextResponse.json({ error: 'This time slot is no longer available.' }, { status: 409 })
      }
    }

    // ── Insert appointment ────────────────────────────────────
    const { data: appt, error: apptError } = await (supabase as any)
      .from('appointments')
      .insert({
        patient_name,
        patient_age: patient_age ? parseInt(patient_age, 10) : null,
        patient_phone_country_code,
        patient_phone,
        patient_email,
        doctor_id,
        specialty_id,
        branch_id,
        service_id: service_id || null,
        appointment_date,
        start_time,
        end_time,
        duration_at_booking: durationAtBooking,
        fee_at_booking: feeAtBooking,
        primary_complaint: primary_complaint ? sanitizeText(primary_complaint, 1000) : null,
        referral_source: referral_source ? sanitizeText(referral_source, 100) : null,
        is_new_patient: is_new_patient !== false,
        notes: notes ? sanitizeText(notes, 1000) : null,
        status: 'reserved',
      })
      .select()
      .single()

    if (apptError) {
      console.error('Appointment insert error:', apptError)
      // Surface DB trigger errors (overlap) as 409
      if (apptError.message?.includes('overlapping') || apptError.code === '23514') {
        return NextResponse.json({ error: 'This time slot is no longer available.' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Booking failed. Please try again.' }, { status: 500 })
    }

    // ── Auto-assign room from schedule template ────────────────
    const scheduleTemplate = isFirstComeFirstServe
      ? null
      : matchingSchedule

    if (scheduleTemplate) {
      const { data: roomAssignments } = await supabase
        .from('schedule_room_assignments')
        .select('room_id')
        .eq('schedule_template_id', (scheduleTemplate as any).id)

      if (roomAssignments && roomAssignments.length > 0) {
        // Best-effort: ignore room conflict errors (another booking may have taken the room)
        await (supabase as any)
          .from('appointment_rooms')
          .insert((roomAssignments as any[]).map((r: any) => ({ appointment_id: appt.id, room_id: r.room_id })))
          .throwOnError(false)
      }
    }

    // ── Status history ─────────────────────────────────────────
    await (supabase as any).from('appointment_status_history').insert({
      appointment_id: appt.id,
      previous_status: null,
      new_status: 'reserved',
      notes: 'Patient self-booked online',
    })

    // ── Notifications (non-blocking — failure does not fail the booking) ──
    try {
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
        const emailLang: 'ar' | 'en' = lang === 'en' ? 'en' : 'ar'

        // Patient confirmation email
        const emailResult = await sendPatientConfirmation(apptWithDetails, emailLang)
        await (supabase as any).from('notification_logs').insert({
          appointment_id: appt.id,
          type: 'email',
          event: 'booking_created',
          recipient_email: patient_email || null,
          payload: { subject: 'Appointment Confirmation', lang: emailLang },
          sent_at: emailResult.success ? new Date().toISOString() : null,
          error: emailResult.error || null,
        })

        // Admin notification emails
        const { data: adminRecipients } = await (supabase as any)
          .from('admin_profiles')
          .select('email')
          .eq('is_active', true)
          .eq('notifications_enabled', true)

        if (adminRecipients && adminRecipients.length > 0) {
          const adminEmails = (adminRecipients as any[]).map((a: any) => a.email)
          const adminEmailResult = await sendAdminNotification(apptWithDetails, adminEmails)
          await (supabase as any).from('notification_logs').insert({
            appointment_id: appt.id,
            type: 'email',
            event: 'booking_created',
            recipient_email: adminEmails.join(', '),
            payload: { to: adminEmails },
            sent_at: adminEmailResult.success ? new Date().toISOString() : null,
            error: adminEmailResult.error || null,
          })
        }

        // WhatsApp placeholder log
        if (patient_phone) {
          const waPayload = buildPatientConfirmationPayload(apptWithDetails)
          await (supabase as any).from('notification_logs').insert({
            appointment_id: appt.id,
            type: 'whatsapp',
            event: 'booking_created',
            recipient_phone: `${patient_phone_country_code}${patient_phone}`,
            payload: waPayload as unknown as Record<string, unknown>,
            sent_at: null,
            error: 'WhatsApp provider not connected — v2',
          })
        }

        // Admin WhatsApp placeholders
        const { data: adminProfiles } = await (supabase as any)
          .from('admin_profiles')
          .select('whatsapp_number')
          .eq('is_active', true)
          .eq('notifications_enabled', true)
          .not('whatsapp_number', 'is', null)

        for (const admin of (adminProfiles as any[] | null) || []) {
          if (admin.whatsapp_number) {
            const waAdminPayload = buildAdminNotificationPayload(apptWithDetails, admin.whatsapp_number)
            await (supabase as any).from('notification_logs').insert({
              appointment_id: appt.id,
              type: 'whatsapp',
              event: 'booking_created',
              recipient_phone: admin.whatsapp_number,
              payload: waAdminPayload as unknown as Record<string, unknown>,
              sent_at: null,
              error: 'WhatsApp provider not connected — v2',
            })
          }
        }
      }
    } catch (notifErr) {
      // Notification failure must never fail the booking
      console.error('Notification error (non-fatal):', notifErr)
    }

    return NextResponse.json({ success: true, appointmentId: appt.id })
  } catch (err) {
    console.error('Booking error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
