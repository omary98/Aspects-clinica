import type { Metadata } from 'next'
import './globals.css'
import { getLang } from '@/lib/i18n/server'
import { LanguageProvider } from '@/components/LanguageProvider'
import { ThemeProvider } from '@/components/ThemeProvider'
import { createClient } from '@/lib/supabase/server'

const siteUrl = 'https://eurocure-clinic.vercel.app'
const siteTitle = 'EuroCure Clinic — No Pain Just Comfort'
const siteDescription =
  'Book your appointment at EuroCure Clinic with trusted specialists in interventional radiology, surgery, dermatology, and aesthetics.'
const socialImageUrl = `${siteUrl}/eurocure-og.png?v=2`

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  keywords: 'EuroCure, يوروكيور, polyclinic, Nasr City, مصر الجديدة, interventional radiology, dermatology',
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: [
      { url: '/eurocure-logo.png', type: 'image/png' },
    ],
    apple: [
      { url: '/eurocure-logo.png', type: 'image/png' },
    ],
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    siteName: 'EuroCure Clinic',
    type: 'website',
    images: [
      {
        url: socialImageUrl,
        width: 1200,
        height: 630,
        alt: 'EuroCure Clinic logo',
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
  const { data: themeSetting } = await (supabase as any)
    .from('clinic_settings')
    .select('value')
    .eq('key', 'site_theme_default')
    .maybeSingle()
  const defaultTheme = (themeSetting as { value?: string } | null)?.value === 'light' ? 'light' : 'dark'

  return (
    <html lang={lang} dir={dir} className="h-full">
      <body className="min-h-full flex flex-col antialiased">
        <ThemeProvider defaultTheme={defaultTheme}>
          <LanguageProvider initialLang={lang}>
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
