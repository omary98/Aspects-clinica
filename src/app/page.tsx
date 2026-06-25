/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CSSProperties } from 'react'
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

  const { data: siteContentRaw } = await (supabase as any)
    .from('site_content')
    .select('section_key, field_key, value_en, value_ar, is_active')
    .eq('is_active', true)

  const settings = Object.fromEntries(
    ((settingsRaw || []) as Array<{ key: string; value: string }>).map((setting) => [setting.key, setting.value])
  )
  const contentMap = new Map(
    ((siteContentRaw || []) as Array<{ section_key: string; field_key: string; value_en: string | null; value_ar: string | null }>).map((row) => [
      `${row.section_key}.${row.field_key}`,
      row,
    ])
  )
  const cmsText = (section: string, field: string, fallback: string) => {
    const row = contentMap.get(`${section}.${field}`)
    const value = lang === 'ar' ? row?.value_ar : row?.value_en
    return value || fallback
  }

  const specialtiesList = (specialties || []) as any[]
  const doctorsList = (doctors || []) as any[]
  const branchesList = (branches || []) as any[]
  const heroBackgroundUrl = settings.landing_hero_background_url
  const heroBackgroundDarkUrl = settings.landing_hero_background_dark_url || heroBackgroundUrl
  const ctaBackgroundUrl = settings.landing_cta_background_url
  const ctaBackgroundDarkUrl = settings.landing_cta_background_dark_url || ctaBackgroundUrl
  const logoUrl = settings.header_logo_url || settings.logo_url
  const logoDarkUrl = settings.header_logo_dark_url || settings.logo_dark_url || logoUrl
  const footerLogoUrl = settings.footer_logo_url || settings.logo_url
  const footerLogoDarkUrl = settings.footer_logo_dark_url || settings.logo_dark_url || footerLogoUrl
  const primaryColor = settings.brand_primary_color || '#101010'
  const accentColor = settings.brand_accent_color || '#D8A83E'
  const backgroundColor = settings.brand_background_color || '#FFFDF7'
  const darkPrimaryColor = settings.brand_dark_primary_color || '#070707'
  const darkAccentColor = settings.brand_dark_accent_color || '#E1B84D'
  const darkBackgroundColor = settings.brand_dark_background_color || '#080806'
  const heroTagline = cmsText('hero', 'tagline', lang === 'en' ? settings.landing_hero_tagline_en || t.hero.tagline : t.hero.tagline)
  const heroTitle = cmsText('hero', 'title', lang === 'en' ? settings.landing_hero_title_en || t.hero.title : t.hero.title)
  const heroSubtitle = cmsText('hero', 'subtitle', lang === 'en' ? settings.landing_hero_subtitle_en || t.hero.subtitle : t.hero.subtitle)
  const heroPrimaryCta = cmsText('hero', 'primary_cta', t.hero.bookCta)
  const heroSecondaryCta = cmsText('hero', 'secondary_cta', t.hero.viewSpecialties)
  const aboutTitle = cmsText('about', 'title', lang === 'ar' ? 'عن يورو كيور' : 'About EuroCure')
  const aboutBody = cmsText('about', 'body', lang === 'ar' ? 'رعاية متخصصة وتجربة حجز مريحة وواضحة.' : 'Specialist care with a clear, comfortable booking experience.')
  const whyTitle = cmsText('why_choose', 'title', lang === 'ar' ? 'لماذا تختار يورو كيور' : 'Why choose EuroCure')
  const whyBody = cmsText('why_choose', 'body', lang === 'ar' ? 'مواعيد واضحة، أطباء متخصصون، وفروع متعددة.' : 'Clear availability, coordinated specialists, and multiple branches.')
  const ctaTitle = cmsText('cta', 'title', t.cta.title)
  const ctaSubtitle = cmsText('cta', 'subtitle', t.cta.subtitle)
  const ctaButton = cmsText('cta', 'button', t.cta.bookNow)
  const footerTagline = cmsText('footer', 'tagline', t.footer.tagline)

  return (
    <div
      className="eurocure-page min-h-screen"
      style={{
        '--page-bg-light': backgroundColor,
        '--page-bg-dark': darkBackgroundColor,
        '--brand-primary-light': primaryColor,
        '--brand-accent-light': accentColor,
        '--brand-primary-dark': darkPrimaryColor,
        '--brand-accent-dark': darkAccentColor,
      } as CSSProperties}
    >
      <Navbar logoUrl={logoUrl} logoUrlDark={logoDarkUrl} />

      {/* Hero */}
      <section
        className="eurocure-hero relative text-white overflow-hidden"
        style={{
          '--hero-bg-light': heroBackgroundUrl ? `linear-gradient(rgba(16, 16, 16, 0.74), rgba(16, 16, 16, 0.84)), url(${heroBackgroundUrl})` : `linear-gradient(135deg, ${primaryColor}, #2D2414)`,
          '--hero-bg-dark': heroBackgroundDarkUrl ? `linear-gradient(rgba(7, 7, 7, 0.68), rgba(7, 7, 7, 0.9)), url(${heroBackgroundDarkUrl})` : `linear-gradient(135deg, ${darkPrimaryColor}, #1F180B)`,
        } as CSSProperties}
      >
        <div className={`absolute inset-0 ${heroBackgroundUrl ? 'opacity-0' : 'opacity-10'}`}>
          <div className="absolute top-0 end-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 start-0 w-64 h-64 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-1.5 text-sm mb-6">
              <Star className="w-4 h-4 fill-current" style={{ color: accentColor }} />
              <span>{heroTagline}</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              {heroTitle}
              <br />
              <span style={{ color: accentColor }}>{t.hero.titleHighlight}</span>
            </h1>
            <p className="text-lg text-white/80 mb-8 leading-relaxed">
              {heroSubtitle}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/book">
                <Button size="lg" className="eurocure-primary-cta bg-white hover:bg-gray-100 font-semibold px-8" style={{ color: primaryColor }}>
                  {heroPrimaryCta}
                  <ChevronRight className={`w-5 h-5 ${lang === 'ar' ? 'rotate-180 ms-1' : 'ms-1'}`} />
                </Button>
              </Link>
              <Link href="/#specialties">
                <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 bg-transparent">
                  {heroSecondaryCta}
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

      <section id="about" className="eurocure-section py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="eurocure-surface rounded-lg border border-amber-100 bg-[#FFFDF7] p-7">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{aboutTitle}</h2>
            <p className="text-gray-600 leading-relaxed">{aboutBody}</p>
          </div>
          <div className="eurocure-premium-panel rounded-lg border border-amber-100 bg-[#101010] p-7 text-white">
            <h2 className="text-2xl font-bold mb-3" style={{ color: darkAccentColor || accentColor }}>{whyTitle}</h2>
            <p className="text-white/75 leading-relaxed">{whyBody}</p>
          </div>
        </div>
      </section>

      {/* Specialties */}
      <section id="specialties" className="eurocure-section-soft py-16 bg-[#FFFDF7]">
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
                className="eurocure-specialty-card group bg-white rounded-lg p-6 border border-amber-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                {specialty.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={specialty.image_url} alt={specialty[nameField] || specialty.name_en} className="h-28 w-full rounded-md object-cover mb-4" />
                )}
                <div className="w-14 h-14 rounded-lg bg-[#D8A83E]/15 flex items-center justify-center text-[#9A6A16] mb-4 group-hover:bg-[#101010] group-hover:text-white transition-colors duration-300">
                  {specialtyIcons[specialty.slug] || <Activity className="w-7 h-7" />}
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">
                  {specialty[nameField] || specialty.name_en}
                </h3>
                {specialty[descField] && (
                  <p className="text-sm text-gray-500 leading-relaxed">{specialty[descField]}</p>
                )}
                <div className="mt-4 flex items-center text-[#9A6A16] text-sm font-medium gap-1">
                  <span>{t.specialties.viewDoctors}</span>
                  <ChevronRight className={`w-4 h-4 group-hover:translate-x-1 transition-transform ${lang === 'ar' ? 'rotate-180' : ''}`} />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Doctors by Specialty */}
      <section id="doctors" className="eurocure-section py-16">
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
                    <Button variant="outline" size="sm" className="border-[#9A6A16] text-[#9A6A16] hover:bg-[#101010] hover:text-white">
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
      <section id="locations" className="eurocure-section-soft py-16 bg-[#FFFDF7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">{t.locations.sectionTitle}</h2>
            <p className="text-gray-500">{t.locations.sectionSubtitle}</p>
          </div>
          <div className="max-w-2xl mx-auto">
            {branchesList.map((branch: any) => (
              <div key={branch.id} className="eurocure-location-card bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-gray-900 text-lg mb-2">
                  {branch[nameField] || branch.name_en}
                </h3>
                {branch[addressField] && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#9A6A16]" />
                    <span>{branch[addressField]}</span>
                  </div>
                )}
                {branch.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <Phone className="w-4 h-4 text-[#9A6A16]" />
                    <a href={`tel:${branch.phone}`} className="hover:text-[#9A6A16]" dir="ltr">
                      {branch.phone}
                    </a>
                  </div>
                )}
                {branch.google_maps_url && (
                  <a
                    href={branch.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-[#9A6A16] font-medium hover:underline"
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
        className="eurocure-cta py-16 bg-[#101010]"
        style={{
          '--cta-bg-light': ctaBackgroundUrl ? `linear-gradient(rgba(16, 16, 16, 0.84), rgba(16, 16, 16, 0.84)), url(${ctaBackgroundUrl})` : 'linear-gradient(135deg, #101010, #2D2414)',
          '--cta-bg-dark': ctaBackgroundDarkUrl ? `linear-gradient(rgba(7, 7, 7, 0.82), rgba(7, 7, 7, 0.9)), url(${ctaBackgroundDarkUrl})` : 'linear-gradient(135deg, #070707, #211806)',
        } as CSSProperties}
      >
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">{ctaTitle}</h2>
          <p className="text-white/70 mb-8 text-lg">{ctaSubtitle}</p>
          <Link href="/book">
            <Button size="lg" className="eurocure-primary-cta bg-white hover:bg-gray-100 font-semibold px-10" style={{ color: primaryColor }}>
              {ctaButton}
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-[#101010] text-gray-400 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                {(footerLogoUrl || footerLogoDarkUrl) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={footerLogoUrl || footerLogoDarkUrl} alt="EuroCure" className="footer-logo-light w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#D8A83E] flex items-center justify-center">
                    <span className="text-white font-bold text-xs">EC</span>
                  </div>
                )}
                {footerLogoDarkUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={footerLogoDarkUrl} alt="EuroCure" className="footer-logo-dark hidden w-6 h-6 rounded-full object-cover" />
                )}
                <span className="eurocure-wordmark text-white">EuroCure</span>
              </div>
              <p className="text-sm max-w-xs">{footerTagline}</p>
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
