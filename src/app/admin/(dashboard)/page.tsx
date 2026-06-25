import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { addDays, format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Users, AlertCircle, CheckCircle, ChevronRight } from 'lucide-react'
import { STATUS_COLORS, STATUS_LABELS, formatTime } from '@/lib/utils'
import type { AppointmentWithDetails } from '@/types/database'

export default async function AdminDashboardPage() {
  const supabase = await createAdminClient()
  const today = format(new Date(), 'yyyy-MM-dd')
  const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd')

  const [todayAppts, recentAppts, upcomingAppts, counts] = await Promise.all([
    // Today's appointments
    supabase
      .from('appointments')
      .select(`
        *,
        doctors (id, name_en, title_en),
        specialties (id, name_en),
        branches (id, name_en),
        services (id, name_en, duration_minutes),
        appointment_rooms (*, rooms (id, name_en))
      `)
      .eq('appointment_date', today)
      .not('status', 'in', '(cancelled)')
      .order('start_time'),

    // Recent reservations (last 20)
    supabase
      .from('appointments')
      .select(`
        *,
        doctors (id, name_en),
        specialties (id, name_en),
        branches (id, name_en),
        services (id, name_en, duration_minutes),
        appointment_rooms (*, rooms (id, name_en))
      `)
      .order('created_at', { ascending: false })
      .limit(20),

    // Upcoming reservations that the operations team needs visibility on
    supabase
      .from('appointments')
      .select('id, status')
      .gte('appointment_date', today)
      .lte('appointment_date', nextWeek)
      .not('status', 'in', '(cancelled)')
      .limit(1000),

    // Status counts
    supabase
      .from('appointments')
      .select('status'),
  ])

  const statusCounts = ((counts.data || []) as { status: string }[]).reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1
    return acc
  }, {})
  const todayByDoctor = ((todayAppts.data || []) as AppointmentWithDetails[]).reduce<Record<string, number>>((acc, appt) => {
    const name = appt.doctors?.name_en || 'Unassigned'
    acc[name] = (acc[name] || 0) + 1
    return acc
  }, {})
  const todayCount = todayAppts.data?.length || 0
  const upcomingCount = upcomingAppts.data?.length || 0
  const waitingConfirmation = statusCounts.reserved || 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <Link href="/admin/appointments">
          <Button className="bg-[#1B4F72] hover:bg-[#154360] text-white">
            <Calendar className="w-4 h-4 mr-2" />
            All Appointments
          </Button>
        </Link>
      </div>

      {/* Key operations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Today', value: todayCount, detail: 'active appointments', icon: Clock, href: `/admin/appointments?date=${today}` },
          { label: 'Next 7 Days', value: upcomingCount, detail: 'scheduled reservations', icon: Calendar, href: `/admin/appointments?date_from=${today}&date_to=${nextWeek}` },
          { label: 'Needs Confirmation', value: waitingConfirmation, detail: 'reserved appointments', icon: AlertCircle, href: '/admin/appointments?status=reserved' },
          { label: 'Recent Activity', value: recentAppts.data?.length || 0, detail: 'latest reservations loaded', icon: Users, href: '/admin/appointments' },
        ].map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.label} href={item.href}>
              <div className="rounded-lg border bg-white p-4 hover:border-[#1B4F72]/30 hover:bg-blue-50/30 transition-all">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{item.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{item.value}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-[#1B4F72]/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#1B4F72]" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">{item.detail}</p>
              </div>
            </Link>
          )
        })}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(STATUS_LABELS).map(([status, label]) => (
              <Link key={status} href={`/admin/appointments?status=${status}`}>
                <div className={`rounded-lg border p-3 ${STATUS_COLORS[status]}`}>
                  <p className="text-xs font-medium opacity-80">{label}</p>
                  <p className="text-xl font-bold mt-1">{statusCounts[status] || 0}</p>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {Object.keys(todayByDoctor).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Today by Doctor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(todayByDoctor).map(([doctor, count]) => (
                <div key={doctor} className="rounded-lg border border-gray-100 p-3">
                  <p className="text-sm font-medium text-gray-900 truncate">{doctor}</p>
                  <p className="text-xs text-gray-500 mt-1">{count} appointment{count === 1 ? '' : 's'} today</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's appointments */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#1B4F72]" />
              Today&apos;s Schedule
              <span className="text-gray-400 font-normal text-sm ml-auto">
                {todayAppts.data?.length || 0} appointments
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!todayAppts.data?.length ? (
              <p className="text-sm text-gray-400 py-4 text-center">No appointments today</p>
            ) : (
              <div className="space-y-3">
                {(todayAppts.data as AppointmentWithDetails[]).map((appt) => (
                  <Link
                    key={appt.id}
                    href={`/admin/appointments/${appt.id}`}
                    className="block"
                  >
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-[#1B4F72]/30 hover:bg-blue-50/30 transition-all">
                      <div className="text-center min-w-[52px]">
                        <p className="text-sm font-bold text-[#1B4F72]">{formatTime(appt.start_time)}</p>
                        <p className="text-xs text-gray-400">{formatTime(appt.end_time)}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{appt.patient_name}</p>
                        <p className="text-xs text-gray-500 truncate">{appt.doctors?.name_en}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[appt.status]}`}>
                        {STATUS_LABELS[appt.status]}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent reservations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-[#1B4F72]" />
              Recent Reservations
              <Link href="/admin/appointments" className="ml-auto">
                <Button variant="ghost" size="sm" className="text-xs text-[#1B4F72] h-7 px-2">
                  View all <ChevronRight className="w-3 h-3 ml-0.5" />
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!recentAppts.data?.length ? (
              <p className="text-sm text-gray-400 py-4 text-center">No recent reservations</p>
            ) : (
              <div className="space-y-3">
                {(recentAppts.data as AppointmentWithDetails[]).slice(0, 8).map((appt) => (
                  <Link
                    key={appt.id}
                    href={`/admin/appointments/${appt.id}`}
                    className="block"
                  >
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-[#1B4F72]/30 hover:bg-blue-50/30 transition-all">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 text-sm truncate">{appt.patient_name}</p>
                          <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[appt.status]}`}>
                            {STATUS_LABELS[appt.status]}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {appt.doctors?.name_en} · {format(new Date(appt.appointment_date), 'MMM d')} at {formatTime(appt.start_time)}
                        </p>
                        <p className="text-xs text-gray-400">
                          Booked {format(new Date(appt.created_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: '/admin/doctors', icon: Users, label: 'Manage Doctors' },
              { href: '/admin/schedules', icon: Calendar, label: 'Edit Schedules' },
              { href: '/admin/blocked-times', icon: AlertCircle, label: 'Block Time' },
              { href: '/admin/settings', icon: CheckCircle, label: 'Clinic Settings' },
            ].map((action) => {
              const Icon = action.icon
              return (
                <Link key={action.href} href={action.href}>
                  <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-100 hover:border-[#1B4F72]/30 hover:bg-blue-50/30 transition-all cursor-pointer text-center">
                    <Icon className="w-5 h-5 text-[#1B4F72]" />
                    <span className="text-xs font-medium text-gray-700">{action.label}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
