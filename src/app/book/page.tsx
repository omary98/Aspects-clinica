import { createClient } from '@/lib/supabase/server'
import { getLang } from '@/lib/i18n/server'
import { getT } from '@/lib/i18n'
import Navbar from '@/components/public/Navbar'
import BookingForm from '@/components/public/BookingForm'

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ doctor?: string; specialty?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const lang = await getLang()
  const t = getT(lang)

  const [doctorsRes, specialtiesRes, servicesRes, settingsRes] = await Promise.all([
    supabase
      .from('doctors')
      .select(`
        *,
        specialties (id, name_en, name_ar, slug),
        doctor_schedule_templates (
          id, day_of_week, start_time, end_time, branch_id, is_active,
          branches (id, name_en, name_ar, slug, is_public_branch),
          schedule_room_assignments (room_id, rooms (id, name_en))
        )
      `)
      .eq('is_active', true)
      .order('display_order'),

    supabase
      .from('specialties')
      .select('*')
      .eq('is_active', true)
      .order('display_order'),

    supabase
      .from('services')
      .select('*, specialties (name_en, name_ar)')
      .eq('is_active', true)
      .eq('is_visible_to_patients', true)
      .order('display_order'),

    supabase
      .from('clinic_settings')
      .select('key, value')
      .in('key', ['booking_window_days', 'min_notice_hours', 'default_appointment_duration_minutes']),
  ])

  const settings = Object.fromEntries(
    ((settingsRes.data || []) as { key: string; value: string }[]).map((s) => [s.key, s.value])
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t.booking.pageTitle}</h1>
          <p className="text-gray-500 mt-2">{t.booking.pageSubtitle}</p>
        </div>
        <BookingForm
          doctors={doctorsRes.data || []}
          specialties={specialtiesRes.data || []}
          services={servicesRes.data || []}
          settings={settings}
          initialDoctorId={params.doctor}
          initialSpecialtyId={params.specialty}
        />
      </div>
    </div>
  )
}
