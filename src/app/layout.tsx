import type { Metadata } from 'next'
import './globals.css'
import { getLang } from '@/lib/i18n/server'
import { LanguageProvider } from '@/components/LanguageProvider'
import { ThemeProvider } from '@/components/ThemeProvider'
import { createClient } from '@/lib/supabase/server'
import { SpeedInsights } from '@vercel/speed-insights/next'

const siteUrl = process.env.APP_BASE_URL || 'http://localhost:3500'
const siteTitle = 'Aspects Clinica — أسبكتس كلينيكا'
const siteDescription =
  'Arabic-first Aspects Clinica reservation platform for premium polyclinic appointments, doctors, services, rooms, schedules, and clinic content.'
const socialImageUrl = `${siteUrl}/aspects-clinica-logo.png`

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  keywords: 'Aspects Clinica, أسبكتس كلينيكا, polyclinic, Cairo, dermatology, surgery, dentistry, laser',
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: [
      { url: '/aspects-clinica-logo.png', type: 'image/png' },
    ],
    apple: [
      { url: '/aspects-clinica-logo.png', type: 'image/png' },
    ],
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    siteName: 'Aspects Clinica',
    type: 'website',
    images: [
      {
        url: socialImageUrl,
        width: 1200,
        height: 630,
        alt: 'Aspects Clinica logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: [socialImageUrl],
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang()
  const dir = lang === 'ar' ? 'rtl' : 'ltr'
  const supabase = await createClient()
  const { data: themeSetting } = await supabase
    .from('clinic_settings')
    .select('value')
    .eq('key', 'site_theme_default')
    .maybeSingle()
  const defaultTheme = (themeSetting as { value?: string } | null)?.value === 'light' ? 'light' : 'dark'

  return (
    <html lang={lang} dir={dir} className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Marcellus&family=Noto+Kufi+Arabic:wght@500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <ThemeProvider defaultTheme={defaultTheme}>
          <LanguageProvider initialLang={lang}>
            {children}
          </LanguageProvider>
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  )
}
