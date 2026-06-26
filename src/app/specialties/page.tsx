/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CSSProperties } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getLang } from '@/lib/i18n/server'
import { getT } from '@/lib/i18n'
import Navbar from '@/components/public/Navbar'
import SpecialtiesDirectory from '@/components/public/SpecialtiesDirectory'
import { Button } from '@/components/ui/button'

export default async function SpecialtiesPage() {
  const supabase = await createClient()
  const lang = await getLang()
  const t = getT(lang)

  const [specialtiesRes, servicesRes, settingsRes] = await Promise.all([
    (supabase as any)
      .from('specialties')
      .select('*')
      .eq('is_active', true)
      .order('display_order'),
    (supabase as any)
      .from('services')
      .select('id, specialty_id, name_en, name_ar, is_active')
      .eq('is_active', true)
      .eq('is_visible_to_patients', true)
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
                {lang === 'ar' ? 'كل التخصصات والإجراءات' : 'All specialties and procedures'}
              </p>
              <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">{t.specialties.sectionTitle}</h1>
              <p className="mt-3 text-gray-500">{t.specialties.sectionSubtitle}</p>
            </div>
            <Link href="/book">
              <Button className="aspects-primary-cta bg-[#101010] text-white hover:bg-black">
                {t.nav.bookNow}
              </Button>
            </Link>
          </div>
          <SpecialtiesDirectory specialties={specialtiesRes.data || []} services={servicesRes.data || []} />
        </section>
      </main>
    </div>
  )
}
