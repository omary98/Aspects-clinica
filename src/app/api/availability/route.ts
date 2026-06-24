import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAvailableSlots } from '@/lib/availability'
import { parseISO, addDays, startOfDay, isBefore, isAfter } from 'date-fns'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const doctorId = searchParams.get('doctorId')
  const branchId = searchParams.get('branchId')
  const date = searchParams.get('date')
  const serviceId = searchParams.get('serviceId')

  // Input validation
  if (!doctorId || !branchId || !date) {
    return NextResponse.json({ error: 'doctorId, branchId, date are required' }, { status: 400 })
  }
  if (!UUID_RE.test(doctorId) || !UUID_RE.test(branchId)) {
    return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 })
  }
  if (!DATE_RE.test(date)) {
    return NextResponse.json({ error: 'Invalid date format (expected YYYY-MM-DD)' }, { status: 400 })
  }
  if (serviceId && !UUID_RE.test(serviceId)) {
    return NextResponse.json({ error: 'Invalid service ID' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  // Load settings first so we can validate the date range
  const { data: settingsRaw } = await supabase
    .from('clinic_settings')
    .select('key, value')
    .in('key', ['default_appointment_duration_minutes', 'min_notice_hours', 'booking_window_days'])

  const settings = Object.fromEntries(
    ((settingsRaw || []) as { key: string; value: string }[]).map((s) => [s.key, s.value])
  )
  const bookingWindowDays = parseInt(settings['booking_window_days'] || '90', 10)
  const minNoticeHours = parseInt(settings['min_notice_hours'] || '6', 10)
  const defaultDuration = parseInt(settings['default_appointment_duration_minutes'] || '20', 10)

  // Date range validation
  const now = new Date()
  const apptDate = parseISO(date)
  if (isBefore(apptDate, startOfDay(now))) {
    return NextResponse.json({ slots: [], durationMinutes: defaultDuration, reason: 'past' })
  }
  if (isAfter(apptDate, addDays(now, bookingWindowDays))) {
    return NextResponse.json({ slots: [], durationMinutes: defaultDuration, reason: 'out_of_window' })
  }

  const [schedulesRes, bookingsRes, blockedRes, serviceRes] = await Promise.all([
    supabase
      .from('doctor_schedule_templates')
      .select('doctor_id, branch_id, day_of_week, start_time, end_time')
      .eq('doctor_id', doctorId)
      .eq('branch_id', branchId)
      .eq('is_active', true),

    supabase
      .from('appointments')
      .select('doctor_id, branch_id, appointment_date, start_time, end_time, status')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', date)
      .in('status', ['reserved', 'confirmed']),

    supabase
      .from('blocked_times')
      .select('*')
      .eq('block_date', date),

    serviceId
      ? supabase
          .from('services')
          .select('duration_minutes')
          .eq('id', serviceId)
          .single()
      : Promise.resolve({ data: null, error: null }),
  ])

  const serviceData = serviceRes.data as { duration_minutes: number } | null
  const durationMinutes = serviceData?.duration_minutes || defaultDuration

  const slots = getAvailableSlots({
    doctorId,
    branchId,
    date,
    durationMinutes,
    schedules: schedulesRes.data || [],
    bookedAppointments: bookingsRes.data || [],
    blockedTimes: blockedRes.data || [],
    minNoticeHours,
  })

  return NextResponse.json({ slots, durationMinutes })
}
