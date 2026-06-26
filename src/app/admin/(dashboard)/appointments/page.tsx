import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { STATUS_COLORS, STATUS_LABELS, formatTime } from '@/lib/utils'
import type { AppointmentWithDetails } from '@/types/database'
import ManualAppointmentDialog from '@/components/admin/ManualAppointmentDialog'

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string
    doctor?: string
    branch?: string
    date?: string
    date_from?: string
    date_to?: string
    cal_month?: string
    view?: string
  }>
}) {
  const params = await searchParams
  const supabase = await createAdminClient()
  const today = format(new Date(), 'yyyy-MM-dd')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('appointments')
    .select(`
      *,
      doctors (id, name_en),
      specialties (id, name_en),
      branches (id, name_en),
      services (id, name_en, duration_minutes),
      appointment_rooms (*, rooms (id, name_en))
    `)
    .order('appointment_date', { ascending: false })
    .order('start_time')

  if (params.status) query = query.eq('status', params.status)
  if (params.doctor) query = query.eq('doctor_id', params.doctor)
  if (params.branch) query = query.eq('branch_id', params.branch)
  if (params.date) {
    query = query.eq('appointment_date', params.date)
  } else {
    if (params.date_from) query = query.gte('appointment_date', params.date_from)
    if (params.date_to) query = query.lte('appointment_date', params.date_to)
  }

  const selectedCalendarMonth = params.cal_month && /^\d{4}-\d{2}$/.test(params.cal_month)
    ? params.cal_month
    : today.slice(0, 7)
  const calendarMonth = new Date(`${selectedCalendarMonth}-01T00:00:00`)
  const calendarStart = startOfWeek(startOfMonth(calendarMonth))
  const calendarEnd = endOfWeek(endOfMonth(calendarMonth))

  const [appointmentsRes, upcomingCalendarRes] = await Promise.all([
    query.limit(200),
    (supabase as any)
      .from('appointments')
      .select(`
        *,
        doctors (id, name_en),
        specialties (id, name_en),
        branches (id, name_en),
        services (id, name_en, duration_minutes),
        appointment_rooms (*, rooms (id, name_en))
      `)
      .gte('appointment_date', format(calendarStart, 'yyyy-MM-dd'))
      .lte('appointment_date', format(calendarEnd, 'yyyy-MM-dd'))
      .not('status', 'eq', 'cancelled')
      .order('appointment_date')
      .order('start_time'),
  ])

  const appointments = appointmentsRes.data
  const upcomingAppointments = (upcomingCalendarRes.data || []) as AppointmentWithDetails[]
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const appointmentsByDate = upcomingAppointments.reduce<Record<string, AppointmentWithDetails[]>>((acc, appointment) => {
    acc[appointment.appointment_date] = [...(acc[appointment.appointment_date] || []), appointment]
    return acc
  }, {})

  const [doctorsRes, branchesRes, specialtiesRes, servicesRes] = await Promise.all([
    supabase.from('doctors').select('id, name_en, specialty_id, doctor_schedule_templates(id, branch_id, day_of_week, start_time, end_time, is_active, first_come_first_serve, first_come_capacity, branches(id, name_en))').eq('is_active', true).order('display_order'),
    supabase.from('branches').select('id, name_en').eq('is_active', true).order('display_order'),
    supabase.from('specialties').select('*').eq('is_active', true).order('display_order'),
    supabase.from('services').select('*, specialties(name_en), service_doctors(doctor_id)').eq('is_active', true).order('display_order'),
  ])

  const doctors = (doctorsRes.data || []) as Array<{ id: string; name_en: string; specialty_id: string; doctor_schedule_templates: unknown[] }>
  const branches = (branchesRes.data || []) as Array<{ id: string; name_en: string }>
  const specialties = (specialtiesRes.data || []) as Array<{ id: string; name_en: string }>
  const services = (servicesRes.data || []) as Array<{ id: string; name_en: string; specialty_id: string; doctor_id: string | null }>

  const statuses = ['reserved', 'confirmed', 'attended', 'no_show', 'cancelled', 'rescheduled']

  const hasDateFilter = !!(params.date || params.date_from || params.date_to || params.status || params.doctor || params.branch)
  const calendarHref = (month: Date) => {
    const queryParams = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value && key !== 'cal_month') queryParams.set(key, value)
    }
    queryParams.set('cal_month', format(month, 'yyyy-MM'))
    return `/admin/appointments?${queryParams.toString()}`
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <ManualAppointmentDialog
          doctors={doctors}
          specialties={specialties}
          services={services}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <form className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Date</label>
              <input
                type="date"
                name="date"
                defaultValue={params.date || ''}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">From date</label>
              <input
                type="date"
                name="date_from"
                defaultValue={params.date_from || ''}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">To date</label>
              <input
                type="date"
                name="date_to"
                defaultValue={params.date_to || ''}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Status</label>
              <select
                name="status"
                defaultValue={params.status || ''}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">All statuses</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Doctor</label>
              <select
                name="doctor"
                defaultValue={params.doctor || ''}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">All doctors</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.name_en}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Branch</label>
              <select
                name="branch"
                defaultValue={params.branch || ''}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">All branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name_en}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" size="sm" variant="outline">
                <Filter className="w-4 h-4 mr-1.5" />
                Filter
              </Button>
              {hasDateFilter && (
                <Link href="/admin/appointments">
                  <Button type="button" size="sm" variant="ghost">Clear</Button>
                </Link>
              )}
              <Link href={`/admin/appointments?date=${today}`}>
                <Button type="button" size="sm" variant="ghost" className="text-[#1B4F72]">
                  Today
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Upcoming calendar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Reservations Calendar</CardTitle>
              <p className="text-sm text-gray-500 mt-1">{format(calendarMonth, 'MMMM yyyy')}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href={calendarHref(addMonths(calendarMonth, -1))}>
                <Button type="button" size="sm" variant="outline" aria-label="Previous month">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </Link>
              <Link href={calendarHref(new Date())}>
                <Button type="button" size="sm" variant="ghost" className="text-[#1B4F72]">
                  This Month
                </Button>
              </Link>
              <Link href={calendarHref(addMonths(calendarMonth, 1))}>
                <Button type="button" size="sm" variant="outline" aria-label="Next month">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="py-1">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day) => {
                  const dayKey = format(day, 'yyyy-MM-dd')
                  const dayAppointments = appointmentsByDate[dayKey] || []
                  const isOutsideMonth = format(day, 'yyyy-MM') !== format(calendarMonth, 'yyyy-MM')
                  return (
                    <div key={dayKey} className={`min-h-32 rounded-lg border p-2 ${isOutsideMonth ? 'bg-gray-50/70' : 'bg-white'}`}>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className={`text-sm font-semibold ${isOutsideMonth ? 'text-gray-400' : 'text-gray-900'}`}>{format(day, 'd')}</p>
                        <p className="text-[11px] text-gray-400">{format(day, 'MMM')}</p>
                      </div>
                      {dayAppointments.length === 0 ? (
                        <p className="text-xs text-gray-300 py-4 text-center">No bookings</p>
                      ) : (
                        <div className="space-y-1.5">
                          {dayAppointments.slice(0, 4).map((appointment) => (
                            <Link
                              key={appointment.id}
                              href={`/admin/appointments/${appointment.id}`}
                              className="block rounded-md border border-[#19B7C6]/30 bg-[#F4FBFA] p-1.5 hover:border-[#0B8EA0] transition-colors"
                            >
                              <p className="text-[11px] font-semibold text-[#1B4F72]">{formatTime(appointment.start_time)}</p>
                              <p className="text-xs text-gray-900 truncate">{appointment.patient_name}</p>
                              <p className="text-[11px] text-gray-500 truncate">{appointment.doctors?.name_en}</p>
                            </Link>
                          ))}
                          {dayAppointments.length > 4 && (
                            <p className="text-[11px] text-gray-400">+{dayAppointments.length - 4} more</p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {appointments?.length || 0} appointment{(appointments?.length || 0) !== 1 ? 's' : ''}
            {params.date && ` on ${format(new Date(params.date + 'T00:00:00'), 'MMMM d, yyyy')}`}
            {params.date_from && !params.date && ` from ${format(new Date(params.date_from + 'T00:00:00'), 'MMM d')}`}
            {params.date_to && !params.date && ` to ${format(new Date(params.date_to + 'T00:00:00'), 'MMM d, yyyy')}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!appointments?.length ? (
            <p className="text-sm text-gray-400 py-8 text-center">No appointments found</p>
          ) : (
            <div className="divide-y">
              {(appointments as AppointmentWithDetails[]).map((appt) => (
                <Link
                  key={appt.id}
                  href={`/admin/appointments/${appt.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Date/Time */}
                  <div className="min-w-[80px] text-center">
                    <p className="text-xs text-gray-400">
                      {format(new Date(appt.appointment_date + 'T00:00:00'), 'MMM d')}
                    </p>
                    <p className="text-sm font-bold text-[#1B4F72]">{formatTime(appt.start_time)}</p>
                  </div>

                  {/* Patient info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900">{appt.patient_name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[appt.status]}`}>
                        {STATUS_LABELS[appt.status]}
                      </span>
                      {appt.is_new_patient && (
                        <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {appt.doctors?.name_en} · {appt.branches?.name_en}
                    </p>
                    {appt.primary_complaint && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{appt.primary_complaint}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="hidden md:block text-sm text-gray-600">
                    {appt.patient_phone_country_code} {appt.patient_phone}
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
