import { createAdminClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, Clock, MapPin, Phone, User, FileText, History } from 'lucide-react'
import { STATUS_COLORS, STATUS_LABELS, formatTime, formatDate } from '@/lib/utils'
import AppointmentActions from '@/components/admin/AppointmentActions'
import type { AppointmentWithDetails } from '@/types/database'

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createAdminClient()

  const { data: appt } = await supabase
    .from('appointments')
    .select(`
      *,
      doctors (id, name_en, name_ar, title_en),
      specialties (id, name_en),
      branches (id, name_en, address_en, google_maps_url),
      services (id, name_en, duration_minutes),
      appointment_rooms (*, rooms (id, name_en))
    `)
    .eq('id', id)
    .single()

  if (!appt) notFound()

  const { data: statusHistoryRaw } = await supabase
    .from('appointment_status_history')
    .select('id, appointment_id, previous_status, new_status, changed_by, notes, created_at')
    .eq('appointment_id', id)
    .order('created_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const statusHistory = statusHistoryRaw as any[] | null

  const apptTyped = appt as AppointmentWithDetails

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/appointments">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{apptTyped.patient_name}</h1>
          <p className="text-sm text-gray-500">
            {format(new Date(apptTyped.appointment_date), 'EEEE, MMMM d, yyyy')} at {formatTime(apptTyped.start_time)}
          </p>
        </div>
        <span className={`text-sm px-3 py-1 rounded-full border font-medium ${STATUS_COLORS[apptTyped.status]}`}>
          {STATUS_LABELS[apptTyped.status]}
        </span>
      </div>

      {/* Actions */}
      <AppointmentActions appointment={apptTyped} />

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Appointment info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Appointment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Detail icon={<Calendar className="w-4 h-4" />} label="Date" value={formatDate(apptTyped.appointment_date)} />
            <Detail
              icon={<Clock className="w-4 h-4" />}
              label="Time"
              value={`${formatTime(apptTyped.start_time)} – ${formatTime(apptTyped.end_time)} (${apptTyped.duration_at_booking} min)`}
            />
            <Detail icon={<User className="w-4 h-4" />} label="Doctor" value={`${apptTyped.doctors?.name_en} · ${apptTyped.doctors?.title_en}`} />
            <Detail label="Specialty" value={apptTyped.specialties?.name_en} />
            {apptTyped.services && <Detail label="Service" value={apptTyped.services.name_en} />}
            <Detail
              icon={<MapPin className="w-4 h-4" />}
              label="Branch"
              value={apptTyped.branches?.name_en}
            />
            {apptTyped.appointment_rooms?.length > 0 && (
              <Detail
                label="Room(s)"
                value={apptTyped.appointment_rooms.map((r) => r.rooms?.name_en).join(', ')}
              />
            )}
            {apptTyped.fee_at_booking !== null && apptTyped.fee_at_booking !== undefined && (
              <Detail label="Fee at Booking" value={`EGP ${apptTyped.fee_at_booking}`} />
            )}
          </CardContent>
        </Card>

        {/* Patient info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Patient
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Detail icon={<User className="w-4 h-4" />} label="Name" value={apptTyped.patient_name} />
            {apptTyped.patient_age && <Detail label="Age" value={String(apptTyped.patient_age)} />}
            <Detail
              icon={<Phone className="w-4 h-4" />}
              label="Phone"
              value={`${apptTyped.patient_phone_country_code} ${apptTyped.patient_phone}`}
            />
            {apptTyped.patient_email && (
              <Detail label="Email" value={apptTyped.patient_email} />
            )}
            <Detail label="Type" value={apptTyped.is_new_patient ? 'New Patient' : 'Follow-up'} />
            {apptTyped.referral_source && (
              <Detail label="Referral" value={apptTyped.referral_source} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Clinical notes */}
      {(apptTyped.primary_complaint || apptTyped.notes) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Clinical Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {apptTyped.primary_complaint && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">Primary Complaint</p>
                <p className="text-sm text-gray-700">{apptTyped.primary_complaint}</p>
              </div>
            )}
            {apptTyped.notes && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{apptTyped.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status history */}
      {statusHistory && statusHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4" />
              Status History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statusHistory.map((h) => (
                <div key={h.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-[#1B4F72] mt-1.5 flex-shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      {h.previous_status && (
                        <>
                          <span className={`text-xs px-1.5 py-0.5 rounded border ${STATUS_COLORS[h.previous_status]}`}>
                            {STATUS_LABELS[h.previous_status]}
                          </span>
                          <span className="text-gray-400">→</span>
                        </>
                      )}
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${STATUS_COLORS[h.new_status]}`}>
                        {STATUS_LABELS[h.new_status]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(new Date(h.created_at), 'MMM d, yyyy h:mm a')}
                      {h.notes && ` · ${h.notes}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Meta */}
      <div className="text-xs text-gray-400 space-y-1">
        <p>Created: {format(new Date(apptTyped.created_at), 'MMMM d, yyyy h:mm a')}</p>
        <p>Last updated: {format(new Date(apptTyped.updated_at), 'MMMM d, yyyy h:mm a')}</p>
      </div>
    </div>
  )
}

function Detail({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode
  label: string
  value?: string | null
}) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2.5">
      {icon && <span className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</span>}
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  )
}
