import { createServiceClient } from '@/lib/supabase/server'
import { getLang } from '@/lib/i18n/server'
import { getT } from '@/lib/i18n'
import Navbar from '@/components/public/Navbar'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle, Calendar, Clock, MapPin, Phone, User } from 'lucide-react'
import { formatTime } from '@/lib/utils'
import { format, parseISO } from 'date-fns'

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const params = await searchParams
  const appointmentId = params.id
  const lang = await getLang()
  const t = getT(lang)
  const nameField = lang === 'ar' ? 'name_ar' : 'name_en'
  const titleField = lang === 'ar' ? 'title_ar' : 'title_en'
  const addressField = lang === 'ar' ? 'address_ar' : 'address_en'

  if (!appointmentId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <p className="text-gray-500">{t.confirmation.notFound}</p>
          <Link href="/book" className="mt-4 inline-block">
            <Button>{t.confirmation.bookAgain}</Button>
          </Link>
        </div>
      </div>
    )
  }

  const supabase = await createServiceClient()

  const { data: apptRaw } = await supabase
    .from('appointments')
    .select(`
      *,
      doctors (name_en, name_ar, title_en, title_ar),
      specialties (name_en, name_ar),
      branches (name_en, name_ar, address_en, address_ar, google_maps_url, phone),
      services (name_en, name_ar, duration_minutes)
    `)
    .eq('id', appointmentId)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const appt = apptRaw as any

  if (!appt) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <p className="text-gray-500">{t.confirmation.notFound}</p>
          <Link href="/book">
            <Button className="mt-4">{t.confirmation.bookAgain}</Button>
          </Link>
        </div>
      </div>
    )
  }

  const doctorName = appt.doctors?.[nameField] || appt.doctors?.name_en
  const doctorTitle = appt.doctors?.[titleField] || appt.doctors?.title_en
  const branchName = appt.branches?.[nameField] || appt.branches?.name_en
  const branchAddress = appt.branches?.[addressField] || appt.branches?.address_en

  const dateDisplay = appt.appointment_date
    ? format(parseISO(appt.appointment_date), 'd/M/yyyy')
    : ''

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Success header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.confirmation.title}</h1>
          <p className="text-gray-500 text-lg">
            {t.confirmation.subtitle}
            {appt.patient_email && ` ${t.confirmation.emailSent}`}
          </p>
        </div>

        {/* Appointment card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div className="bg-[#1B4F72] px-6 py-4">
            <p className="text-white/70 text-sm">{t.confirmation.reference}</p>
            <p className="text-white font-mono font-bold text-lg" dir="ltr">
              #{appointmentId.slice(0, 8).toUpperCase()}
            </p>
          </div>

          <div className="p-6 space-y-4">
            {/* Doctor */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1B4F72]/10 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-[#1B4F72]" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{doctorName}</p>
                <p className="text-sm text-gray-500">{doctorTitle}</p>
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            {/* Date & Time */}
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#1B4F72] flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">
                  {lang === 'ar'
                    ? `${t.dayNames[parseISO(appt.appointment_date).getDay()]}، ${dateDisplay}`
                    : dateDisplay}
                </p>
                <p className="text-sm text-gray-500 flex items-center gap-1" dir="ltr">
                  <Clock className="w-3.5 h-3.5" />
                  {formatTime(appt.start_time)} – {formatTime(appt.end_time)}
                </p>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#1B4F72] mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">{branchName}</p>
                {branchAddress && (
                  <p className="text-sm text-gray-500">{branchAddress}</p>
                )}
                {appt.branches?.phone && (
                  <p className="text-sm text-gray-500" dir="ltr">{appt.branches.phone}</p>
                )}
                {appt.branches?.google_maps_url && (
                  <a
                    href={appt.branches.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#1B4F72] hover:underline mt-1 inline-block"
                  >
                    {t.locations.viewOnMaps}
                  </a>
                )}
              </div>
            </div>

            {/* Patient info */}
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-[#1B4F72] flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">{appt.patient_name}</p>
                <p className="text-sm text-gray-500" dir="ltr">
                  {appt.patient_phone_country_code} {appt.patient_phone}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Important notes */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
          <p className="font-semibold mb-2">{t.confirmation.important.title}</p>
          <ul className="space-y-1.5 list-disc list-inside text-amber-700">
            <li>{t.confirmation.important.arrive}</li>
            <li>{t.confirmation.important.bringRecords}</li>
            <li>{t.confirmation.important.cancel}</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full">
              {t.confirmation.backHome}
            </Button>
          </Link>
          <Link href="/book" className="flex-1">
            <Button className="w-full bg-[#1B4F72] hover:bg-[#154360] text-white">
              {t.confirmation.bookAnother}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
