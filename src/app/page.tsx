/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { getLang } from '@/lib/i18n/server'
import { getT } from '@/lib/i18n'
import Navbar from '@/components/public/Navbar'
import DoctorCard from '@/components/public/DoctorCard'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MapPin, Phone, Activity, Scissors, Sparkles, ChevronRight, Star, Shield, Clock } from 'lucide-react'

const specialtyIcons: Record<string, React.ReactNode> = {
  'interventional-radiology': <Activity className="w-7 h-7" />,
  'surgery': <Scissors className="w-7 h-7" />,
  'dermatology-aesthetics': <Sparkles className="w-7 h-7" />,
}

export default async function HomePage() {
  const supabase = await createClient()
  const lang = await getLang()
  const t = getT(lang)
  const nameField = lang === 'ar' ? 'name_ar' : 'name_en'
  const descField = lang === 'ar' ? 'description_ar' : 'description_en'
  const addressField = lang === 'ar' ? 'address_ar' : 'address_en'

  const { data: specialties } = await (supabase as any)
    .from('specialties')
    .select('*')
    .eq('is_active', true)
    .order('display_order')

  const { data: doctors } = await (supabase as any)
    .from('doctors')
    .select(`
      *,
      specialties (name_en, name_ar),
      doctor_schedule_templates (
        day_of_week, start_time, end_time, branch_id, is_active,
        branches (id, name_en, name_ar, is_public_branch)
      )
    `)
    .eq('is_active', true)
    .order('display_order')

  const { data: branches } = await (supabase as any)
    .from('branches')
    .select('*')
    .eq('is_active', true)
    .eq('is_public_branch', true)
    .order('display_order')

  const { data: settingsRaw } = await (supabase as any)
    .from('clinic_settings')
    .select('key, value')

  const settings = Object.fromEntries(
    ((settingsRaw || []) as Array<{ key: string; value: string }>).map((setting) => [setting.key, setting.value])
  )

  const specialtiesList = (specialties || []) as any[]
  const doctorsList = (doctors || []) as any[]
  const branchesList = (branches || []) as any[]
  const heroBackgroundUrl = settings.landing_hero_background_url
  const ctaBackgroundUrl = settings.landing_cta_background_url
  const logoUrl = settings.logo_url
  const heroTagline = lang === 'en' ? settings.landing_hero_tagline_en || t.hero.tagline : t.hero.tagline
  const heroTitle = lang === 'en' ? settings.landing_hero_title_en || t.hero.title : t.hero.title
  const heroSubtitle = lang === 'en' ? settings.landing_hero_subtitle_en || t.hero.subtitle : t.hero.subtitle

  return (
    <div className="min-h-screen bg-white">
      <Navbar logoUrl={logoUrl} />

      {/* Hero */}
      <section
        className="relative bg-gradient-to-br from-[#1B4F72] via-[#2471A3] to-[#1B4F72] text-white overflow-hidden"
        style={heroBackgroundUrl ? { backgroundImage: `linear-gradient(rgba(27, 79, 114, 0.72), rgba(27, 79, 114, 0.72)), url(${heroBackgroundUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      >
        <div className={`absolute inset-0 ${heroBackgroundUrl ? 'opacity-0' : 'opacity-10'}`}>
          <div className="absolute top-0 end-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 start-0 w-64 h-64 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-1.5 text-sm mb-6">
              <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
              <span>{heroTagline}</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              {heroTitle}
              <br />
              <span className="text-blue-200">{t.hero.titleHighlight}</span>
            </h1>
            <p className="text-lg text-white/80 mb-8 leading-relaxed">
              {heroSubtitle}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/book">
                <Button size="lg" className="bg-white text-[#1B4F72] hover:bg-gray-100 font-semibold px-8">
                  {t.hero.bookCta}
                  <ChevronRight className={`w-5 h-5 ${lang === 'ar' ? 'rotate-180 ms-1' : 'ms-1'}`} />
                </Button>
              </Link>
              <Link href="/#specialties">
                <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 bg-transparent">
                  {t.hero.viewSpecialties}
                </Button>
              </Link>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap gap-6 mt-10 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>{t.hero.verified}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{t.hero.instant}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{t.hero.multiLocation}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specialties */}
      <section id="specialties" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">{t.specialties.sectionTitle}</h2>
            <p className="text-gray-500 max-w-xl mx-auto">{t.specialties.sectionSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {specialtiesList.map((specialty: any) => (
              <a
                key={specialty.id}
                href={`#${specialty.slug}`}
                className="group bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-[#1B4F72]/20 transition-all duration-200"
              >
                <div className="w-14 h-14 rounded-xl bg-[#1B4F72]/10 flex items-center justify-center text-[#1B4F72] mb-4 group-hover:bg-[#1B4F72] group-hover:text-white transition-colors">
                  {specialtyIcons[specialty.slug] || <Activity className="w-7 h-7" />}
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">
                  {specialty[nameField] || specialty.name_en}
                </h3>
                {specialty[descField] && (
                  <p className="text-sm text-gray-500 leading-relaxed">{specialty[descField]}</p>
                )}
                <div className="mt-4 flex items-center text-[#1B4F72] text-sm font-medium gap-1">
                  <span>{t.specialties.viewDoctors}</span>
                  <ChevronRight className={`w-4 h-4 group-hover:translate-x-1 transition-transform ${lang === 'ar' ? 'rotate-180' : ''}`} />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Doctors by Specialty */}
      <section id="doctors" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {specialtiesList.map((specialty: any) => {
            const specialtyDoctors = doctorsList.filter(
              (d: any) => d.specialty_id === specialty.id
            )
            if (!specialtyDoctors.length) return null

            return (
              <div key={specialty.id} id={specialty.slug} className="mb-16 scroll-mt-20">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {specialty[nameField] || specialty.name_en}
                    </h2>
                    {specialty[descField] && (
                      <p className="text-gray-500 text-sm mt-1">{specialty[descField]}</p>
                    )}
                  </div>
                  <Link href={`/book?specialty=${specialty.id}`} className="hidden md:block">
                    <Button variant="outline" size="sm" className="border-[#1B4F72] text-[#1B4F72] hover:bg-[#1B4F72] hover:text-white">
                      {t.specialties.bookIn} {specialty[nameField] || specialty.name_en}
                    </Button>
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {specialtyDoctors.map((doctor: any) => (
                    <DoctorCard
                      key={doctor.id}
                      lang={lang}
                      doctor={{
                        ...doctor,
                        specialties: {
                          name_en: specialty.name_en,
                          name_ar: specialty.name_ar,
                        },
                        schedules: ((doctor as any).doctor_schedule_templates || []).filter(
                          (s: any) => s.is_active
                        ),
                      }}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Locations */}
      <section id="locations" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">{t.locations.sectionTitle}</h2>
            <p className="text-gray-500">{t.locations.sectionSubtitle}</p>
          </div>
          <div className="max-w-2xl mx-auto">
            {branchesList.map((branch: any) => (
              <div key={branch.id} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-gray-900 text-lg mb-2">
                  {branch[nameField] || branch.name_en}
                </h3>
                {branch[addressField] && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#1B4F72]" />
                    <span>{branch[addressField]}</span>
                  </div>
                )}
                {branch.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <Phone className="w-4 h-4 text-[#1B4F72]" />
                    <a href={`tel:${branch.phone}`} className="hover:text-[#1B4F72]" dir="ltr">
                      {branch.phone}
                    </a>
                  </div>
                )}
                {branch.google_maps_url && (
                  <a
                    href={branch.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-[#1B4F72] font-medium hover:underline"
                  >
                    <MapPin className="w-4 h-4" />
                    {t.locations.viewOnMaps}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section
        className="py-16 bg-[#1B4F72]"
        style={ctaBackgroundUrl ? { backgroundImage: `linear-gradient(rgba(27, 79, 114, 0.82), rgba(27, 79, 114, 0.82)), url(${ctaBackgroundUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      >
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">{t.cta.title}</h2>
          <p className="text-white/70 mb-8 text-lg">{t.cta.subtitle}</p>
          <Link href="/book">
            <Button size="lg" className="bg-white text-[#1B4F72] hover:bg-gray-100 font-semibold px-10">
              {t.cta.bookNow}
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="EuroCure" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#1B4F72] flex items-center justify-center">
                    <span className="text-white font-bold text-xs">EC</span>
                  </div>
                )}
                <span className="font-bold text-white">EuroCure</span>
              </div>
              <p className="text-sm max-w-xs">{t.footer.tagline}</p>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <p className="font-medium text-white">{t.footer.quickLinks}</p>
              <Link href="/#specialties" className="hover:text-white transition-colors">{t.nav.specialties}</Link>
              <Link href="/#doctors" className="hover:text-white transition-colors">{t.nav.doctors}</Link>
              <Link href="/book" className="hover:text-white transition-colors">{t.nav.bookNow}</Link>
              <Link href="/admin/login" className="hover:text-white transition-colors">{t.footer.adminLogin}</Link>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-6 text-xs text-center">
            &copy; {new Date().getFullYear()} EuroCure Polyclinic. {t.footer.rights}
          </div>
        </div>
      </footer>
    </div>
  )
}
