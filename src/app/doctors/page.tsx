/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CSSProperties } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getLang } from '@/lib/i18n/server'
import { getT } from '@/lib/i18n'
import Navbar from '@/components/public/Navbar'
import DoctorsDirectory from '@/components/public/DoctorsDirectory'
import { Button } from '@/components/ui/button'

export default async function DoctorsPage() {
  const supabase = await createClient()
  const lang = await getLang()
  const t = getT(lang)

  const [doctorsRes, specialtiesRes, settingsRes] = await Promise.all([
    (supabase as any)
      .from('doctors')
      .select('*, specialties (id, name_en, name_ar), doctor_schedule_templates (id, is_active)')
      .eq('is_active', true)
      .order('display_order'),
    (supabase as any)
      .from('specialties')
      .select('id, name_en, name_ar')
      .eq('is_active', true)
      .order('display_order'),
    (supabase as any)
      .from('clinic_settings')
      .select('key, value'),
  ])

  const settings = Object.fromEntries(
    ((settingsRes.data || []) as Array<{ key: string; value: string }>).map((setting) => [setting.key, setting.value])
  )

  return (
    <div
      className="aspects-page min-h-screen"
      style={{
        '--page-bg-light': settings.brand_background_color || '#F7FBF8',
        '--page-bg-dark': settings.brand_dark_background_color || '#061016',
      } as CSSProperties}
    >
      <Navbar
        logoUrl={settings.header_logo_url || settings.logo_url || '/aspects-clinica-logo.png'}
        logoUrlDark={settings.header_logo_dark_url || settings.logo_dark_url || settings.header_logo_url || settings.logo_url || '/aspects-clinica-logo.png'}
      />
      <main className="aspects-section-soft">
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 text-sm font-semibold text-[#0B8EA0]">
                {lang === 'ar' ? 'دليل الأطباء' : 'Doctor directory'}
              </p>
              <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">{t.doctors.sectionTitle}</h1>
              <p className="mt-3 text-gray-500">
                {lang === 'ar'
                  ? 'ابحث عن الطبيب المناسب حسب الاسم أو التخصص، ثم احجز مباشرة من نفس النظام.'
                  : 'Search by name or specialty, then book directly through the same reservation flow.'}
              </p>
            </div>
            <Link href="/book">
              <Button className="aspects-primary-cta bg-[#101010] text-white hover:bg-black">
                {t.nav.bookNow}
              </Button>
            </Link>
          </div>
          <DoctorsDirectory doctors={doctorsRes.data || []} specialties={specialtiesRes.data || []} />
        </section>
      </main>
    </div>
  )
}
