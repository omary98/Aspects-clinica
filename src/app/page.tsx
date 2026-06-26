/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CSSProperties } from 'react'
import Link from 'next/link'
import { Activity, ChevronRight, Clock, HeartPulse, Mail, MapPin, Phone, Shield, Sparkles, Star, Stethoscope, User, Waves } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getLang } from '@/lib/i18n/server'
import { getT } from '@/lib/i18n'
import Navbar from '@/components/public/Navbar'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function pickHomepageItems<T extends { featured_on_homepage?: boolean; display_order?: number }>(items: T[], limit = 8) {
  const featured = items.filter((item) => item.featured_on_homepage)
  const source = featured.length ? featured : items
  return source
    .slice()
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
    .slice(0, limit)
}

export default async function HomePage() {
  const supabase = await createClient()
  const lang = await getLang()
  const t = getT(lang)
  const nameField = lang === 'ar' ? 'name_ar' : 'name_en'
  const descField = lang === 'ar' ? 'description_ar' : 'description_en'
  const addressField = lang === 'ar' ? 'address_ar' : 'address_en'

  const [specialtiesRes, doctorsRes, branchesRes, settingsRes, contentRes] = await Promise.all([
    (supabase as any).from('specialties').select('*').eq('is_active', true).order('display_order'),
    (supabase as any).from('doctors').select('*, specialties (id, name_en, name_ar)').eq('is_active', true).order('display_order'),
    (supabase as any).from('branches').select('*').eq('is_active', true).order('display_order'),
    (supabase as any).from('clinic_settings').select('key, value'),
    (supabase as any).from('site_content').select('section_key, field_key, value_en, value_ar, is_active').eq('is_active', true),
  ])

  const specialties = (specialtiesRes.data || []) as any[]
  const doctors = (doctorsRes.data || []) as any[]
  const branches = (branchesRes.data || []) as any[]
  const homepageSpecialties = pickHomepageItems(specialties, 8)
  const homepageDoctors = pickHomepageItems(doctors, 8)
  const publicBranches = branches.filter((branch) => branch.is_public_branch)
  const mainBranch = publicBranches[0] || branches[0]

  const settings = Object.fromEntries(
    ((settingsRes.data || []) as Array<{ key: string; value: string }>).map((setting) => [setting.key, setting.value])
  )
  const contentMap = new Map(
    ((contentRes.data || []) as Array<{ section_key: string; field_key: string; value_en: string | null; value_ar: string | null }>).map((row) => [
      `${row.section_key}.${row.field_key}`,
      row,
    ])
  )
  const cmsText = (section: string, field: string, fallback: string) => {
    const row = contentMap.get(`${section}.${field}`)
    const value = lang === 'ar' ? row?.value_ar : row?.value_en
    return value || fallback
  }

  const primaryColor = settings.brand_primary_color || '#123B67'
  const accentColor = settings.brand_accent_color || '#BFEA1C'
  const backgroundColor = settings.brand_background_color || '#F7FBF8'
  const darkPrimaryColor = settings.brand_dark_primary_color || '#06151E'
  const darkAccentColor = settings.brand_dark_accent_color || '#BFEA1C'
  const darkBackgroundColor = settings.brand_dark_background_color || '#061016'
  const heroBackgroundUrl = settings.landing_hero_background_url
  const heroBackgroundDarkUrl = settings.landing_hero_background_dark_url || heroBackgroundUrl
  const ctaBackgroundUrl = settings.landing_cta_background_url
  const ctaBackgroundDarkUrl = settings.landing_cta_background_dark_url || ctaBackgroundUrl
  const logoUrl = settings.header_logo_url || settings.logo_url
  const logoDarkUrl = settings.header_logo_dark_url || settings.logo_dark_url || logoUrl
  const footerLogoUrl = settings.footer_logo_url || settings.logo_url
  const footerLogoDarkUrl = settings.footer_logo_dark_url || settings.logo_dark_url || footerLogoUrl
  const fallbackLogo = '/aspects-clinica-logo.png'
  const heroTagline = cmsText('hero', 'tagline', lang === 'en' ? settings.landing_hero_tagline_en || t.hero.tagline : t.hero.tagline)
  const heroTitle = cmsText('hero', 'title', lang === 'en' ? settings.landing_hero_title_en || t.hero.title : t.hero.title)
  const heroSubtitle = cmsText('hero', 'subtitle', lang === 'en' ? settings.landing_hero_subtitle_en || t.hero.subtitle : t.hero.subtitle)
  const heroPrimaryCta = cmsText('hero', 'primary_cta', t.hero.bookCta)
  const heroSecondaryCta = cmsText('hero', 'secondary_cta', t.hero.viewSpecialties)
  const aboutTitle = cmsText('about', 'title', lang === 'ar' ? 'عن أسبكتس كلينيكا' : 'About Aspects Clinica')
  const aboutBody = cmsText('about', 'body', lang === 'ar' ? 'أسبكتس كلينيكا منشأة طبية متكاملة تقدم رعاية طبية وجراحية وتجميلية متعددة التخصصات في القاهرة، من الكشف الروتيني إلى التشخيص والعلاج.' : 'Aspects Clinica is a full-service healthcare facility in Cairo providing routine examination, diagnosis, treatment, surgical care, and aesthetic procedures.')
  const contactTitle = cmsText('contact', 'title', lang === 'ar' ? 'تواصل معنا' : 'Contact Us')
  const contactBody = cmsText('contact', 'body', lang === 'ar' ? 'فريق أسبكتس كلينيكا جاهز لمساعدتك في اختيار الطبيب المناسب وتأكيد تفاصيل موعدك.' : 'Aspects Clinica is here to help you choose the right doctor and confirm your appointment details.')
  const ctaTitle = cmsText('cta', 'title', t.cta.title)
  const ctaSubtitle = cmsText('cta', 'subtitle', t.cta.subtitle)
  const footerTagline = cmsText('footer', 'tagline', t.footer.tagline)
  const clinicPhone = settings.clinic_phone || mainBranch?.phone || ''
  const contactEmail = settings.email_from || ''

  const facilities = [
    { icon: <Stethoscope className="h-5 w-5" />, label: lang === 'ar' ? '٧ غرف عيادات' : '7 clinic rooms' },
    { icon: <Waves className="h-5 w-5" />, label: lang === 'ar' ? 'غرفتا ليزر' : '2 laser rooms' },
    { icon: <HeartPulse className="h-5 w-5" />, label: lang === 'ar' ? 'غرفة عمليات' : 'Surgery room' },
    { icon: <Activity className="h-5 w-5" />, label: lang === 'ar' ? 'غرفتا إفاقة' : '2 recovery rooms' },
  ]

  return (
    <div
      className="aspects-page min-h-screen"
      style={{
        '--page-bg-light': backgroundColor,
        '--page-bg-dark': darkBackgroundColor,
        '--brand-primary-light': primaryColor,
        '--brand-accent-light': accentColor,
        '--brand-primary-dark': darkPrimaryColor,
        '--brand-accent-dark': darkAccentColor,
      } as CSSProperties}
    >
      <Navbar logoUrl={logoUrl || fallbackLogo} logoUrlDark={logoDarkUrl || fallbackLogo} />

      <section
        className="aspects-hero relative overflow-hidden text-white"
        style={{
          '--hero-bg-light': heroBackgroundUrl ? `linear-gradient(rgba(6, 21, 30, 0.72), rgba(18, 59, 103, 0.82)), url(${heroBackgroundUrl})` : `radial-gradient(circle at 82% 20%, rgba(191, 234, 28, 0.16), transparent 24%), linear-gradient(135deg, ${primaryColor}, #0B8EA0 54%, #17A565)`,
          '--hero-bg-dark': heroBackgroundDarkUrl ? `linear-gradient(rgba(6, 16, 22, 0.74), rgba(6, 16, 22, 0.92)), url(${heroBackgroundDarkUrl})` : `radial-gradient(circle at 82% 20%, rgba(191, 234, 28, 0.1), transparent 24%), linear-gradient(135deg, ${darkPrimaryColor}, #0B4D64 58%, #0F5A40)`,
        } as CSSProperties}
      >
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/18 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm backdrop-blur">
              <Star className="h-4 w-4 fill-current" style={{ color: accentColor }} />
              <span>{heroTagline}</span>
            </div>
            <h1 className="mb-5 text-4xl font-bold leading-tight md:text-6xl">
              {heroTitle}
              <br />
              <span style={{ color: accentColor }}>{t.hero.titleHighlight}</span>
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-white/80">{heroSubtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/book">
                <Button size="lg" className="aspects-primary-cta bg-white px-8 font-semibold hover:bg-gray-100" style={{ color: primaryColor }}>
                  {heroPrimaryCta}
                  <ChevronRight className={`ms-1 h-5 w-5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                </Button>
              </Link>
              <Link href="/specialties">
                <Button size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10">
                  {heroSecondaryCta}
                </Button>
              </Link>
              <Link href="/doctors">
                <Button size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10">
                  {lang === 'ar' ? 'تعرّف على الأطباء' : 'Meet Our Doctors'}
                </Button>
              </Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-5 text-sm text-white/72">
              <span className="flex items-center gap-2"><Shield className="h-4 w-4" />{t.hero.verified}</span>
              <span className="flex items-center gap-2"><Clock className="h-4 w-4" />{t.hero.instant}</span>
              <span className="flex items-center gap-2"><MapPin className="h-4 w-4" />{t.hero.multiLocation}</span>
            </div>
          </div>
        </div>
      </section>

      <section id="specialties" className="aspects-section-soft py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{t.specialties.sectionTitle}</h2>
              <p className="mt-2 max-w-2xl text-sm text-gray-500">
                {lang === 'ar' ? 'مختارات من التخصصات الأكثر طلبًا. كل التخصصات متاحة في الصفحة الكاملة.' : 'A curated preview of key specialties. The full directory stays one click away.'}
              </p>
            </div>
            <Link href="/specialties" className="text-sm font-semibold text-[#0B8EA0] hover:underline">
              {lang === 'ar' ? 'عرض كل التخصصات' : 'View all specialties'}
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {homepageSpecialties.map((specialty) => (
              <Link key={specialty.id} href={`/book?specialty=${specialty.id}`} className="aspects-specialty-card group rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#E6FAF6] text-[#0B8EA0]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-gray-900">{specialty[nameField] || specialty.name_en}</h3>
                {specialty[descField] && <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">{specialty[descField]}</p>}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="doctors" className="aspects-section py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{t.doctors.sectionTitle}</h2>
              <p className="mt-2 max-w-2xl text-sm text-gray-500">
                {lang === 'ar' ? 'عرض مختصر لأطباء أسبكتس كلينيكا، مع إمكانية التصفح الكامل والبحث.' : 'A compact preview of the Aspects Clinica medical team, with full search on the doctors page.'}
              </p>
            </div>
            <Link href="/doctors" className="text-sm font-semibold text-[#0B8EA0] hover:underline">
              {lang === 'ar' ? 'عرض كل الأطباء' : 'View all doctors'}
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {homepageDoctors.map((doctor) => (
              <article key={doctor.id} className="aspects-specialty-card rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#E6FAF6] text-[#0B8EA0]">
                    {doctor.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={doctor.photo_url} alt={doctor[nameField]} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-6 w-6" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-gray-900">{doctor[nameField] || doctor.name_en}</h3>
                    <p className="truncate text-xs text-[#0B8EA0]">{doctor[lang === 'ar' ? 'title_ar' : 'title_en'] || doctor.title_en}</p>
                  </div>
                </div>
                <Link href={`/book?doctor=${doctor.id}`} className="mt-4 block">
                  <Button size="sm" className="aspects-primary-cta w-full bg-[#101010] text-white hover:bg-black">
                    {lang === 'ar' ? 'احجز' : 'Book'}
                  </Button>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="aspects-section-soft py-12">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div className="aspects-surface rounded-lg border border-gray-100 bg-white p-6">
            <h2 className="text-2xl font-bold text-gray-900">{aboutTitle}</h2>
            <p className="mt-3 leading-7 text-gray-600">{aboutBody}</p>
            <Link href="/specialties" className="mt-5 inline-flex items-center text-sm font-semibold text-[#0B8EA0] hover:underline">
              {lang === 'ar' ? 'اكتشف الخدمات' : 'Explore services'}
              <ChevronRight className={`ms-1 h-4 w-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {facilities.map((facility) => (
              <div key={facility.label} className="aspects-surface rounded-lg border border-gray-100 bg-white p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#E6FAF6] text-[#0B8EA0]">{facility.icon}</div>
                <p className="font-semibold text-gray-900">{facility.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="aspects-section py-12 scroll-mt-20">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="mb-3 text-sm font-semibold text-[#0B8EA0]">{lang === 'ar' ? 'الدعم والتواصل' : 'Support & Contact'}</p>
            <h2 className="text-3xl font-bold text-gray-900">{contactTitle}</h2>
            <p className="mt-4 leading-7 text-gray-600">{contactBody}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {clinicPhone && (
                <a href={`tel:${clinicPhone.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 rounded-md bg-[#101010] px-4 py-2 text-sm font-medium text-white hover:bg-black" dir="ltr">
                  <Phone className="h-4 w-4" />{clinicPhone}
                </a>
              )}
              {clinicPhone && (
                <a href={`https://wa.me/${clinicPhone.replace(/[^\d]/g, '')}`} className="inline-flex items-center gap-2 rounded-md border border-[#0B8EA0]/40 px-4 py-2 text-sm font-medium text-[#0B8EA0] hover:bg-[#101010] hover:text-white" dir="ltr">
                  WhatsApp
                </a>
              )}
              {contactEmail && (
                <a href={`mailto:${contactEmail}`} className="inline-flex items-center gap-2 rounded-md border border-[#0B8EA0]/40 px-4 py-2 text-sm font-medium text-[#0B8EA0] hover:bg-[#101010] hover:text-white" dir="ltr">
                  <Mail className="h-4 w-4" />{contactEmail}
                </a>
              )}
            </div>
          </div>
          {mainBranch && (
            <div className="aspects-location-card rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">{mainBranch[nameField] || mainBranch.name_en}</h3>
              {mainBranch[addressField] && (
                <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-gray-600">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#0B8EA0]" />
                  <span>{mainBranch[addressField]}</span>
                </p>
              )}
              <div className="mt-5 flex flex-wrap gap-3">
                {mainBranch.google_maps_url && (
                  <a href={mainBranch.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#0B8EA0] hover:underline">
                    {t.locations.viewOnMaps}
                  </a>
                )}
                <Link href="/book" className="text-sm font-semibold text-[#0B8EA0] hover:underline">
                  {t.nav.bookNow}
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <section
        className="aspects-cta py-14"
        style={{
          '--cta-bg-light': ctaBackgroundUrl ? `linear-gradient(rgba(16, 16, 16, 0.84), rgba(16, 16, 16, 0.84)), url(${ctaBackgroundUrl})` : 'linear-gradient(135deg, #06151E, #0B8EA0)',
          '--cta-bg-dark': ctaBackgroundDarkUrl ? `linear-gradient(rgba(6, 16, 22, 0.82), rgba(6, 16, 22, 0.9)), url(${ctaBackgroundDarkUrl})` : 'linear-gradient(135deg, #061016, #08232A)',
        } as CSSProperties}
      >
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white">{ctaTitle}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/72">{ctaSubtitle}</p>
          <Link href="/book" className="mt-8 inline-block">
            <Button size="lg" className="aspects-primary-cta bg-white px-10 font-semibold hover:bg-gray-100" style={{ color: primaryColor }}>
              {t.cta.bookNow}
            </Button>
          </Link>
        </div>
      </section>

      <footer className="bg-[#101010] py-10 text-gray-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-8 md:flex-row">
            <div>
              <div className="mb-3 flex items-center gap-2">
                {(footerLogoUrl || footerLogoDarkUrl) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={footerLogoUrl || footerLogoDarkUrl} alt="Aspects Clinica" className="footer-logo-light h-6 w-6 rounded-full object-cover" />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#19B7C6] text-xs font-bold text-white">AC</div>
                )}
                {footerLogoDarkUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={footerLogoDarkUrl} alt="Aspects Clinica" className="footer-logo-dark hidden h-6 w-6 rounded-full object-cover" />
                )}
                <span className="aspects-wordmark text-white">{lang === 'ar' ? 'أسبكتس كلينيكا' : 'Aspects Clinica'}</span>
              </div>
              <p className="max-w-xs text-sm">{footerTagline}</p>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <p className="font-medium text-white">{t.footer.quickLinks}</p>
              <Link href="/specialties" className="hover:text-white">{t.nav.specialties}</Link>
              <Link href="/doctors" className="hover:text-white">{t.nav.doctors}</Link>
              <Link href="/#contact" className="hover:text-white">{t.nav.contact}</Link>
              <Link href="/book" className="hover:text-white">{t.nav.bookNow}</Link>
              <Link href="/admin/login" className="hover:text-white">{t.footer.adminLogin}</Link>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-6 text-center text-xs">
            &copy; {new Date().getFullYear()} Aspects Clinica. {t.footer.rights}
          </div>
        </div>
      </footer>
    </div>
  )
}
